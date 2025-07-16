package cmd

import (
	"context"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var nightlyCmd = &cobra.Command{
	Use:   "nightly",
	Short: "Run nightly training job for ranking weights",
	RunE:  runNightly,
}

func init() {
	rootCmd.AddCommand(nightlyCmd)
}

func runNightly(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return err
	}
	defer func() { _ = store.Close() }()

	// Get interactions since last run (e.g. last 24h)
	since := time.Now().Add(-24 * time.Hour)
	interactions, err := store.ListInteractions(cmd.Context(), since)
	if err != nil {
		return err
	}
	if len(interactions) == 0 {
		logger.Info("No new interactions")
		return nil
	}

	// Group by session
	sessions := make(map[uuid.UUID][]*models.UserInteraction)
	for _, inter := range interactions {
		sessions[inter.SessionID] = append(sessions[inter.SessionID], inter)
	}

	// Generate training pairs
	var features [][]float64
	var labels []float64
	for _, group := range sessions {
		var chosen, skipped []*models.UserInteraction
		for _, inter := range group {
			switch inter.Action {
			case "chosen":
				chosen = append(chosen, inter)
			case "skipped":
				skipped = append(skipped, inter)
			}
		}
		// Use default session input for now
		// TODO: Add proper session tracking to storage layer
		sessionInput := "default"

		for _, c := range chosen {
			for _, s := range skipped {
				crank, err := getRanking(cmd.Context(), store, c.PromptID, sessionInput)
				if err != nil {
					continue
				}
				srank, err := getRanking(cmd.Context(), store, s.PromptID, sessionInput)
				if err != nil {
					continue
				}

				featC := []float64{crank.TemperatureScore, crank.TokenScore, crank.ContextScore, crank.LengthScore, crank.HistoricalScore}
				featS := []float64{srank.TemperatureScore, srank.TokenScore, srank.ContextScore, srank.LengthScore, srank.HistoricalScore}

				// Pair: C > S (label 1)
				features = append(features, append(featC, featS...)) // Concat for pairwise
				labels = append(labels, 1)

				// Optional: S > C (label 0) for balance
				features = append(features, append(featS, featC...))
				labels = append(labels, 0)
			}
		}
	}

	if len(features) == 0 {
		logger.Info("No training pairs generated")
		return nil
	}

	// Simple linear regression as LambdaMART placeholder
	// In production, use proper ranking library
	logger.Infof("Training on %d feature pairs", len(features))

	// Calculate feature importance based on correlation with labels
	importances := make([]float64, 5)
	for i := 0; i < 5; i++ {
		var sum, sumSq float64
		for j, feat := range features {
			val := feat[i] - feat[i+5] // Difference between chosen and skipped
			sum += val * labels[j]
			sumSq += val * val
		}
		if sumSq > 0 {
			importances[i] = math.Abs(sum / math.Sqrt(sumSq))
		} else {
			importances[i] = 0.2 // Default
		}
	}

	// Extract feature importances as new weights
	sumImp := 0.0
	for _, imp := range importances[:5] { // First 5 feats
		sumImp += imp
	}
	newWeights := make(map[string]float64)
	keys := []string{"temperature", "token", "semantic", "length", "historical"}
	for i, key := range keys {
		newWeights[key] = importances[i] / sumImp
	}

	// Save to config with atomic write
	configFile := viper.ConfigFileUsed()
	if configFile == "" {
		configFile = "config.yaml" // Default
	}

	// Read current config
	currentConfig := make(map[string]interface{})
	for k, v := range viper.AllSettings() {
		currentConfig[k] = v
	}

	// Update weights
	if currentConfig["ranking"] == nil {
		currentConfig["ranking"] = make(map[string]interface{})
	}
	rankingConfig := currentConfig["ranking"].(map[string]interface{})
	if rankingConfig["weights"] == nil {
		rankingConfig["weights"] = make(map[string]interface{})
	}
	weightsConfig := rankingConfig["weights"].(map[string]interface{})

	for k, v := range newWeights {
		weightsConfig[k] = v
		viper.Set("ranking.weights."+k, v)
	}

	// Write atomically
	if err := viper.WriteConfig(); err != nil {
		logger.WithError(err).Error("Failed to write config")
		return err
	}

	logger.WithFields(logrus.Fields{
		"new_weights":    newWeights,
		"config_file":    configFile,
		"training_pairs": len(features),
	}).Info("Weights updated successfully")
	return nil
}

// getRanking fetches or computes ranking features for a prompt
func getRanking(ctx context.Context, store *storage.Storage, promptID uuid.UUID, originalInput string) (*models.PromptRanking, error) {
	// Get prompt from storage
	prompt, err := store.GetPromptByID(ctx, promptID)
	if err != nil {
		return nil, err
	}

	// Compute basic features (simplified - no embeddings for now)
	tempScore := 1.0 - math.Abs(prompt.Temperature-0.7)/0.7

	tokenScore := 1.0
	contentLength := len(prompt.Content)
	if contentLength < 100 {
		tokenScore = float64(contentLength) / 100.0
	} else if contentLength > 2000 {
		tokenScore = 2000.0 / float64(contentLength)
	}

	// Length ratio as context score for now
	len1 := float64(len(prompt.Content))
	len2 := float64(len(originalInput))
	contextScore := 0.0
	if len1 > 0 && len2 > 0 {
		ratio := len1 / len2
		if ratio > 1 {
			ratio = 1 / ratio
		}
		contextScore = ratio
	}

	return &models.PromptRanking{
		Prompt:           prompt,
		TemperatureScore: tempScore,
		TokenScore:       tokenScore,
		ContextScore:     contextScore,
		LengthScore:      contextScore, // Same for now
		HistoricalScore:  0.5,
	}, nil
}
