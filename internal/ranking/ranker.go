package ranking

import (
	"context"
	"math"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
)

// Ranker handles prompt ranking
type Ranker struct {
	storage *storage.Storage
	logger  *logrus.Logger
}

// NewRanker creates a new ranker instance
func NewRanker(storage *storage.Storage, logger *logrus.Logger) *Ranker {
	return &Ranker{
		storage: storage,
		logger:  log.GetLogger(),
	}
}

// RankPrompts ranks prompts based on multiple factors
func (r *Ranker) RankPrompts(ctx context.Context, prompts []models.Prompt, originalInput string) ([]models.PromptRanking, error) {
	r.logger.Infof("Ranking %d prompts", len(prompts))
	rankings := make([]models.PromptRanking, 0, len(prompts))

	for i := range prompts {
		ranking := r.calculateRanking(&prompts[i], originalInput)
		rankings = append(rankings, ranking)
	}

	// Sort by score (highest first)
	for i := 0; i < len(rankings)-1; i++ {
		for j := i + 1; j < len(rankings); j++ {
			if rankings[j].Score > rankings[i].Score {
				rankings[i], rankings[j] = rankings[j], rankings[i]
			}
		}
	}

	r.logger.Info("Finished ranking prompts")
	return rankings, nil
}

// calculateRanking calculates ranking scores for a prompt
func (r *Ranker) calculateRanking(prompt *models.Prompt, originalInput string) models.PromptRanking {
	// Temperature score (0.7 is optimal)
	tempScore := 1.0 - math.Abs(prompt.Temperature-0.7)/0.7

	// Token efficiency score (prefer moderate length)
	tokenScore := 1.0
	contentLength := len(prompt.Content)
	if contentLength < 100 {
		tokenScore = float64(contentLength) / 100.0
	} else if contentLength > 2000 {
		tokenScore = 2000.0 / float64(contentLength)
	}

	// Context score (similarity to input)
	contextScore := calculateSimilarity(prompt.Content, originalInput)

	// Historical score (placeholder for now)
	historicalScore := 0.5

	// Calculate weighted total score
	totalScore := (tempScore * 0.2) + (tokenScore * 0.2) +
		(contextScore * 0.4) + (historicalScore * 0.2)

	r.logger.WithFields(logrus.Fields{
		"prompt_id": prompt.ID,
		"score":     totalScore,
	}).Debug("Calculated prompt ranking")
	return models.PromptRanking{
		Prompt:           prompt,
		Score:            totalScore,
		TemperatureScore: tempScore,
		TokenScore:       tokenScore,
		HistoricalScore:  historicalScore,
		ContextScore:     contextScore,
	}
}

// calculateSimilarity calculates basic text similarity
func calculateSimilarity(text1, text2 string) float64 {
	// Simple length-based similarity for now
	// Can be enhanced with proper NLP techniques
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
