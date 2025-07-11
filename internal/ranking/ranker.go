package ranking

import (
	"context"
	"math"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/sirupsen/logrus"
)

// Ranker handles prompt ranking
type Ranker struct {
	storage  *storage.Storage
	registry *providers.Registry
	logger   *logrus.Logger
}

// NewRanker creates a new ranker instance
// registry is required so we can obtain an embedding-capable provider for
// semantic similarity calculations.
func NewRanker(storage *storage.Storage, registry *providers.Registry, logger *logrus.Logger) *Ranker {
	return &Ranker{
		storage:  storage,
		registry: registry,
		logger:   log.GetLogger(),
	}
}

// RankPrompts ranks prompts based on multiple factors
func (r *Ranker) RankPrompts(ctx context.Context, prompts []models.Prompt, originalInput string) ([]models.PromptRanking, error) {
	r.logger.Infof("Ranking %d prompts", len(prompts))
	rankings := make([]models.PromptRanking, 0, len(prompts))

	for i := range prompts {
		ranking := r.calculateRanking(ctx, &prompts[i], originalInput)
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
func (r *Ranker) calculateRanking(ctx context.Context, prompt *models.Prompt, originalInput string) models.PromptRanking {
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

	// Context score (semantic similarity to input)
	contextScore := r.calculateSimilarity(ctx, prompt.Content, originalInput)

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

// calculateSimilarity computes cosine similarity between the embeddings of two
// texts. It falls back to 0 when embeddings cannot be generated.
func (r *Ranker) calculateSimilarity(ctx context.Context, text1, text2 string) float64 {
	// Get an embedding-capable provider. Prefer OpenAI for consistency but fall
	// back to the first available provider that supports embeddings.
	provider, err := r.registry.Get(providers.ProviderOpenAI)
	if err != nil || !provider.IsAvailable() || !provider.SupportsEmbeddings() {
		// Fallback
		capable := r.registry.ListEmbeddingCapableProviders()
		if len(capable) == 0 {
			r.logger.Warn("No embedding-capable provider available – reverting to zero similarity")
			return 0
		}
		provider, _ = r.registry.Get(capable[0])
	}

	emb1, err1 := provider.GetEmbedding(ctx, text1, r.registry)
	if err1 != nil {
		r.logger.WithError(err1).Warn("Failed to create embedding for prompt content")
		return 0
	}

	emb2, err2 := provider.GetEmbedding(ctx, text2, r.registry)
	if err2 != nil {
		r.logger.WithError(err2).Warn("Failed to create embedding for original input")
		return 0
	}

	sim := cosineSimilarity(emb1, emb2)

	// Map cosine similarity (-1 … 1) to [0,1] for scoring consistency.
	return (sim + 1) / 2
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
