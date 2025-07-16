package selection

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockProvider for testing
type MockProvider struct {
	mock.Mock
}

// Implement Provider interface methods with mock
func (m *MockProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*providers.GenerateResponse), args.Error(1)
}
func (m *MockProvider) GetEmbedding(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
	return nil, nil // Not used in selector
}
func (m *MockProvider) Name() string             { return "mock" }
func (m *MockProvider) IsAvailable() bool        { return true }
func (m *MockProvider) SupportsEmbeddings() bool { return false }
func (m *MockProvider) SupportsStreaming() bool  { return false }

func TestAISelector_Select(t *testing.T) {
	registry := providers.NewRegistry()
	mockProv := new(MockProvider)
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
	mockProv.On("Generate", mock.Anything, mock.Anything).Return(&providers.GenerateResponse{Content: mockResponse}, nil)

	result, err := selector.Select(context.Background(), prompts, criteria)
	require.NoError(t, err)
	assert.NotNil(t, result.SelectedPrompt)
	assert.Equal(t, prompts[0].ID, result.SelectedPrompt.ID)
	assert.Len(t, result.Scores, 2)

	mockProv.AssertExpectations(t)
}

// TestNormalizeWeights removed - normalizeWeights function doesn't exist

// Add more tests for error cases, different personas, etc.

// Benchmarks
func BenchmarkSelect(b *testing.B) {
	registry := providers.NewRegistry()
	mockProv := new(MockProvider)
	_ = registry.Register("mock", mockProv)
	selector := NewAISelector(registry)
	prompts := []models.Prompt{{ID: uuid.New(), Content: "P1"}, {ID: uuid.New(), Content: "P2"}}
	criteria := SelectionCriteria{TaskDescription: "Bench task", EvaluationProvider: "mock"}
	mockProv.On("Generate", mock.Anything, mock.Anything).Return(&providers.GenerateResponse{Content: "[{}]"}, nil)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = selector.Select(context.Background(), prompts, criteria)
	}
}

// ... complete benchmarks ...
