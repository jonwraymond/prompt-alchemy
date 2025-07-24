package ranking

import (
	"context"
	"math"
	"sort"
	"time"

	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// Ranker handles prompt ranking
type Ranker struct {
	storage  storage.StorageInterface
	registry providers.RegistryInterface
	logger   *logrus.Logger

	// configurable weights (must sum ~1.0; will be normalised)
	tempWeight     float64
	tokenWeight    float64
	semanticWeight float64
	lengthWeight   float64

	embedModel    string
	embedProvider string

	// for hot-reload
	weightsMutex sync.RWMutex
	watcher      *fsnotify.Watcher
}

// Constants for configuration keys
const (
	WeightTemperatureKey = "ranking.weights.temperature"
	WeightTokenKey       = "ranking.weights.token"
	WeightSemanticKey    = "ranking.weights.semantic"
	WeightLengthKey      = "ranking.weights.length"
	EmbeddingModelKey    = "ranking.embedding_model"
	EmbeddingProviderKey = "ranking.embedding_provider"

	// Default weight values
	DefaultWeightTemperature = 0.2
	DefaultWeightToken       = 0.2
	DefaultWeightSemantic    = 0.4
	DefaultWeightLength      = 0.2

	// Optimal temperature for scoring
	OptimalTemperature = 0.7

	// Token length boundaries
	MinTokenLength       = 100
	MaxPreferredTokenLen = 2000
)

// NewRanker creates a new ranker instance
// registry is required so we can obtain an embedding-capable provider for
// semantic similarity calculations.
func NewRanker(storage storage.StorageInterface, registry providers.RegistryInterface, logger *logrus.Logger) *Ranker {
	// Load weights from config / env with sane defaults.
	viper.SetDefault(WeightTemperatureKey, DefaultWeightTemperature)
	viper.SetDefault(WeightTokenKey, DefaultWeightToken)
	viper.SetDefault(WeightSemanticKey, DefaultWeightSemantic)
	viper.SetDefault(WeightLengthKey, DefaultWeightLength)
	viper.SetDefault(EmbeddingModelKey, "text-embedding-3-small")
	viper.SetDefault(EmbeddingProviderKey, "openai")

	weights := loadWeights()
	normalizedWeights := normalizeWeights(weights)

	ranker := &Ranker{
		storage:        storage,
		registry:       registry,
		logger:         log.GetLogger(),
		tempWeight:     normalizedWeights[0],
		tokenWeight:    normalizedWeights[1],
		semanticWeight: normalizedWeights[2],
		lengthWeight:   normalizedWeights[3],
		embedModel:     viper.GetString(EmbeddingModelKey),
		embedProvider:  viper.GetString(EmbeddingProviderKey),
	}

	// Setup config file watcher for hot-reload
	if err := ranker.setupConfigWatcher(); err != nil {
		logger.WithError(err).Warn("Failed to setup config watcher, hot-reload disabled")
	}

	return ranker
}

// loadWeights reads weight values from configuration
func loadWeights() []float64 {
	return []float64{
		viper.GetFloat64(WeightTemperatureKey),
		viper.GetFloat64(WeightTokenKey),
		viper.GetFloat64(WeightSemanticKey),
		viper.GetFloat64(WeightLengthKey),
	}
}

// normalizeWeights normalizes weights to sum to 1.0
func normalizeWeights(weights []float64) []float64 {
	var sum float64
	for _, w := range weights {
		sum += w
	}
	if sum == 0 {
		sum = 1
	}

	normalized := make([]float64, len(weights))
	for i, w := range weights {
		normalized[i] = w / sum
	}
	return normalized
}

// ReloadWeights re-reads weights from config and updates the ranker
func (r *Ranker) ReloadWeights() error {
	r.weightsMutex.Lock()
	defer r.weightsMutex.Unlock()

	weights := loadWeights()
	normalizedWeights := normalizeWeights(weights)

	r.tempWeight = normalizedWeights[0]
	r.tokenWeight = normalizedWeights[1]
	r.semanticWeight = normalizedWeights[2]
	r.lengthWeight = normalizedWeights[3]

	r.logger.WithFields(logrus.Fields{
		"temp_weight":     r.tempWeight,
		"token_weight":    r.tokenWeight,
		"semantic_weight": r.semanticWeight,
		"length_weight":   r.lengthWeight,
	}).Info("Reloaded ranking weights from config")

	return nil
}

// setupConfigWatcher sets up file watching for config changes
func (r *Ranker) setupConfigWatcher() error {
	configFile := viper.ConfigFileUsed()
	if configFile == "" {
		r.logger.Debug("No config file in use, skipping watcher setup")
		return nil
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	r.watcher = watcher

	// Watch the config file directory (not the file itself, as it may be replaced)
	configDir := filepath.Dir(configFile)
	if err := watcher.Add(configDir); err != nil {
		if closeErr := watcher.Close(); closeErr != nil {
			r.logger.WithError(closeErr).Warn("Failed to close watcher during cleanup")
		}
		return err
	}

	go r.watchConfigChanges(configFile)
	r.logger.WithField("config_file", configFile).Info("Config file watcher started")
	return nil
}

// watchConfigChanges handles config file change events
func (r *Ranker) watchConfigChanges(configFile string) {
	for {
		select {
		case event, ok := <-r.watcher.Events:
			if !ok {
				return
			}
			r.handleConfigFileEvent(event, configFile)
		case err, ok := <-r.watcher.Errors:
			if !ok {
				return
			}
			r.logger.WithError(err).Error("Config watcher error")
		}
	}
}

// handleConfigFileEvent processes a single file system event
func (r *Ranker) handleConfigFileEvent(event fsnotify.Event, configFile string) {
	if !r.isConfigFileModified(event, configFile) {
		return
	}

	r.logger.WithField("event", event.String()).Debug("Config file changed, reloading weights")

	if err := viper.ReadInConfig(); err != nil {
		r.logger.WithError(err).Error("Failed to re-read config file")
		return
	}

	if err := r.ReloadWeights(); err != nil {
		r.logger.WithError(err).Error("Failed to reload weights")
	}
}

// isConfigFileModified checks if the event represents a modification to our config file
func (r *Ranker) isConfigFileModified(event fsnotify.Event, configFile string) bool {
	return event.Name == configFile &&
		(event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Create == fsnotify.Create)
}

// Close cleans up the ranker resources
func (r *Ranker) Close() error {
	if r.watcher != nil {
		return r.watcher.Close()
	}
	return nil
}

// RankPrompts ranks prompts based on multiple factors
func (r *Ranker) RankPrompts(ctx context.Context, prompts []models.Prompt, originalInput string) ([]models.PromptRanking, error) {
	r.logger.Infof("Ranking %d prompts", len(prompts))
	rankings := make([]models.PromptRanking, 0, len(prompts))

	for i := range prompts {
		ranking := r.calculateRanking(ctx, &prompts[i], originalInput)
		rankings = append(rankings, ranking)
	}

	// Sort by score (highest first) using efficient O(n log n) sort
	sort.Slice(rankings, func(i, j int) bool {
		return rankings[i].Score > rankings[j].Score
	})

	r.logger.Info("Finished ranking prompts")
	return rankings, nil
}

// calculateRanking calculates ranking scores for a prompt
func (r *Ranker) calculateRanking(ctx context.Context, prompt *models.Prompt, originalInput string) models.PromptRanking {
	r.weightsMutex.RLock()
	defer r.weightsMutex.RUnlock()

	// Temperature score (0.7 is optimal)
	tempScore := 1.0 - math.Abs(prompt.Temperature-OptimalTemperature)/OptimalTemperature

	// Token efficiency score (prefer moderate length)
	tokenScore := calculateTokenScore(len(prompt.Content))

	// Semantic score (embedding-based similarity to input)
	semanticScore := r.calculateSemanticSimilarity(ctx, prompt.Content, originalInput)

	// Length score (prefer similar lengths)
	lengthScore := r.calculateLengthRatio(prompt.Content, originalInput)

	// Calculate weighted total score using configurable weights
	totalScore := (tempScore * r.tempWeight) + (tokenScore * r.tokenWeight) +
		(semanticScore * r.semanticWeight) + (lengthScore * r.lengthWeight)

	r.logger.WithFields(logrus.Fields{
		"prompt_id":      prompt.ID,
		"score":          totalScore,
		"temp_score":     tempScore,
		"token_score":    tokenScore,
		"semantic_score": semanticScore,
		"length_score":   lengthScore,
		"w_temp":         r.tempWeight,
		"w_token":        r.tokenWeight,
		"w_semantic":     r.semanticWeight,
		"w_length":       r.lengthWeight,
	}).Debug("Calculated prompt ranking")
	return models.PromptRanking{
		Prompt:           prompt,
		Score:            totalScore,
		TemperatureScore: tempScore,
		TokenScore:       tokenScore,
		HistoricalScore:  0, // No longer used
		SemanticScore:    semanticScore,
		LengthScore:      lengthScore,
	}
}

// calculateLengthRatio returns a [0,1] similarity based on text lengths.
func (r *Ranker) calculateLengthRatio(text1, text2 string) float64 {
	len1 := float64(len(text1))
	len2 := float64(len(text2))

	if len1 == 0 || len2 == 0 {
		return 0
	}

	ratio := len1 / len2
	if ratio > 1 {
		ratio = 1 / ratio
	}

	return ratio
}

// calculateSemanticSimilarity computes cosine similarity between the embeddings of two
// texts. It falls back to 0 when embeddings cannot be generated.
func (r *Ranker) calculateSemanticSimilarity(ctx context.Context, text1, text2 string) float64 {
	start := time.Now()
	defer func() {
		r.logger.WithField("duration_ms", time.Since(start).Milliseconds()).Debug("Semantic similarity calculation completed")
	}()

	// Get configured embedding provider, fallback to first capable
	provider, err := r.registry.Get(r.embedProvider)
	if err != nil || !provider.IsAvailable() || !provider.SupportsEmbeddings() {
		capable := r.registry.ListEmbeddingCapableProviders()
		if len(capable) == 0 {
			r.logger.Warn("No embedding-capable provider available – semantic score = 0")
			return 0
		}
		provider, _ = r.registry.Get(capable[0])
		r.logger.WithFields(logrus.Fields{
			"requested_provider": r.embedProvider,
			"fallback_provider":  provider.Name(),
			"embedding_model":    r.embedModel,
		}).Info("Using fallback embedding provider")
	} else {
		r.logger.WithFields(logrus.Fields{
			"provider":        provider.Name(),
			"embedding_model": r.embedModel,
		}).Debug("Using configured embedding provider")
	}

	emb1, err1 := provider.GetEmbedding(ctx, text1, r.registry)
	if err1 != nil {
		r.logger.WithError(err1).WithField("text_length", len(text1)).Warn("Failed to embed prompt content")
		return 0
	}

	emb2, err2 := provider.GetEmbedding(ctx, text2, r.registry)
	if err2 != nil {
		r.logger.WithError(err2).WithField("text_length", len(text2)).Warn("Failed to embed original input")
		return 0
	}

	r.logger.WithFields(logrus.Fields{
		"embedding_dim": len(emb1),
		"provider":      provider.Name(),
	}).Debug("Successfully generated embeddings")

	sim := cosineSimilarity(emb1, emb2)
	return (sim + 1) / 2 // Map to [0,1]
}

// calculateTokenScore computes a score based on content length
func calculateTokenScore(contentLength int) float64 {
	if contentLength < MinTokenLength {
		return float64(contentLength) / float64(MinTokenLength)
	}
	if contentLength > MaxPreferredTokenLen {
		return float64(MaxPreferredTokenLen) / float64(contentLength)
	}
	return 1.0
}

// cosineSimilarity returns the cosine similarity between two float32 vectors.
func cosineSimilarity(a, b []float32) float64 {
	if len(a) == 0 || len(b) == 0 {
		return 0
	}

	n := len(a)
	if len(b) < n {
		n = len(b)
	}

	var dot, normA, normB float64
	for i := 0; i < n; i++ {
		va := float64(a[i])
		vb := float64(b[i])
		dot += va * vb
		normA += va * va
		normB += vb * vb
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

// getHistoricalScore retrieves the historical quality score for a prompt
// func (r *Ranker) getHistoricalScore(promptID string) float64 {
// 	// Get metrics for this specific prompt
// 	criteria := storage.MetricsCriteria{
// 		Limit: 1,
// 	}

// 	metrics, err := r.storage.GetMetrics(context.Background(), criteria)
// 	if err != nil {
// 		r.logger.WithError(err).Debug("Failed to get historical metrics")
// 		return 0.5 // Default fallback score
// 	}

// 	// Find the metrics for this specific prompt
// 	for _, m := range metrics {
// 		if m.PromptID.String() == promptID {
// 			// Use engagement score as a proxy for quality
// 			if m.EngagementScore > 0 {
// 				return m.EngagementScore / 100.0 // Normalize to 0-1
// 			}
// 		}
// 	}

// 	return 0.5 // Default if no metrics found
// }
