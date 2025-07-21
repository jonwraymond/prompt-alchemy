package selection

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAISelector_Select(t *testing.T) {
	registry := providers.NewRegistry()
	mockProv := new(providers.MockProvider)
	_ = registry.Register("mock", mockProv)

	selector := NewAISelector(registry)

	prompts := []models.Prompt{
		{ID: uuid.New(), Content: "Prompt 1"},
		{ID: uuid.New(), Content: "Prompt 2"},
	}

	criteria := SelectionCriteria{
		TaskDescription:    "Test task",
		Weights:            EvaluationWeights{Clarity: 0.4, Completeness: 0.6},
		EvaluationProvider: "mock",
	}

	mockResponse := `[
		{"prompt_id": "` + prompts[0].ID.String() + `", "score": 0.8, "clarity": 0.7, "completeness": 0.9, "reasoning": "Good", "confidence": 0.85},
		{"prompt_id": "` + prompts[1].ID.String() + `", "score": 0.7, "clarity": 0.6, "completeness": 0.8, "reasoning": "Fair", "confidence": 0.75}
	]`
	mockProv.GenerateFunc = func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
		return &providers.GenerateResponse{Content: mockResponse}, nil
	}

	result, err := selector.Select(context.Background(), prompts, criteria)
	require.NoError(t, err)
	assert.NotNil(t, result.SelectedPrompt)
	assert.Equal(t, prompts[0].ID, result.SelectedPrompt.ID)
	assert.Len(t, result.Scores, 2)

}

// TestNormalizeWeights removed - normalizeWeights function doesn't exist

// Add more tests for error cases, different personas, etc.

// Benchmarks
func BenchmarkSelect(b *testing.B) {
	registry := providers.NewRegistry()
	mockProv := new(providers.MockProvider)
	_ = registry.Register("mock", mockProv)
	selector := NewAISelector(registry)
	prompts := []models.Prompt{{ID: uuid.New(), Content: "P1"}, {ID: uuid.New(), Content: "P2"}}
	criteria := SelectionCriteria{TaskDescription: "Bench task", EvaluationProvider: "mock"}
	mockProv.GenerateFunc = func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
		return &providers.GenerateResponse{Content: "[{}]"}, nil
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = selector.Select(context.Background(), prompts, criteria)
	}
}

// ... complete benchmarks ...
