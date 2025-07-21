package ranking

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func TestCalculateSemanticSimilarity(t *testing.T) {
	mockProv := new(providers.MockProvider)
	registry := providers.NewRegistry()
	registry.Register("mock", mockProv)

	r := &Ranker{
		embedProvider: "mock",
		registry:      registry,
		logger:        logrus.New(),
	}
	ctx := context.Background()

	emb1 := []float32{1, 0, 0}
	emb2 := []float32{0, 1, 0}
	mockProv.GetEmbeddingFunc = func(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
		if text == "text1" {
			return emb1, nil
		}
		if text == "text2" {
			return emb2, nil
		}
		return nil, nil
	}

	score := r.calculateSemanticSimilarity(ctx, "text1", "text2")
	assert.Equal(t, 0.5, score) // Cosine 0 → 0.5
}

func TestCalculateLengthRatio(t *testing.T) {
	r := &Ranker{}
	tests := []struct {
		t1, t2 string
		exp    float64
	}{{"", "", 0}, {"a", "", 0}, {"ab", "abcd", 0.5}, {"abc", "abc", 1.0}, {"abcd", "ab", 0.5}}
	for _, tt := range tests {
		assert.Equal(t, tt.exp, r.calculateLengthRatio(tt.t1, tt.t2))
	}
}

func TestRankPrompts(t *testing.T) {
	// Create mock provider and real registry
	mockProv := new(providers.MockProvider)
	registry := providers.NewRegistry()
	registry.Register("openai", mockProv)

	// Create ranker with proper mocks
	logger := logrus.New()
	r := &Ranker{
		storage:        &storage.Storage{}, // Mock if needed
		registry:       registry,
		logger:         logger,
		embedProvider:  "openai",
		tempWeight:     0.2,
		tokenWeight:    0.2,
		semanticWeight: 0.4,
		lengthWeight:   0.2,
	}

	prompts := []models.Prompt{{
		ID:          uuid.New(),
		Content:     "similar",
		Temperature: 0.7,
	}, {
		ID:          uuid.New(),
		Content:     "different",
		Temperature: 0.8,
	}}

	// Mock embeddings for "original" and prompts
	mockProv.GetEmbeddingFunc = func(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
		switch text {
		case "original":
			return []float32{1, 0}, nil
		case "similar":
			return []float32{0.9, 0.1}, nil
		case "different":
			return []float32{0, 1}, nil
		}
		return nil, nil
	}

	rankings, err := r.RankPrompts(context.Background(), prompts, "original")
	assert.NoError(t, err)
	assert.Len(t, rankings, 2)
	assert.True(t, rankings[0].SemanticScore > rankings[1].SemanticScore) // "similar" ranks higher
	assert.Equal(t, "similar", rankings[0].Prompt.Content)                // Verify sorting
}
