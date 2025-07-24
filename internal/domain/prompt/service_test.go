package prompt

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStorage is a mock implementation of StorageInterface
type MockStorage struct {
	mock.Mock
}

func (m *MockStorage) SavePrompt(ctx context.Context, prompt *models.Prompt) error {
	args := m.Called(ctx, prompt)
	return args.Error(0)
}

func (m *MockStorage) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockEngine is a mock implementation of EngineInterface
type MockEngine struct {
	mock.Mock
}

func (m *MockEngine) Generate(ctx context.Context, opts models.GenerateOptions) (*models.GenerationResult, error) {
	args := m.Called(ctx, opts)
	return args.Get(0).(*models.GenerationResult), args.Error(1)
}

// MockRanker is a mock implementation of RankerInterface
type MockRanker struct {
	mock.Mock
}

func (m *MockRanker) RankPrompts(ctx context.Context, prompts []models.Prompt, query string) ([]models.PromptRanking, error) {
	args := m.Called(ctx, prompts, query)
	return args.Get(0).([]models.PromptRanking), args.Error(1)
}

// TestService_Generate tests the prompt generation functionality
func TestService_Generate(t *testing.T) {
	tests := []struct {
		name            string
		request         GenerateRequest
		engineResult    *models.GenerationResult
		engineError     error
		rankingResult   []models.PromptRanking
		rankingError    error
		saveError       error
		expectedError   string
		expectedPrompts int
	}{
		{
			name: "successful generation with defaults",
			request: GenerateRequest{
				Input: "Create a REST API for user management",
			},
			engineResult: &models.GenerationResult{
				Prompts: []models.Prompt{
					{
						ID:       uuid.New(),
						Content:  "Generated prompt 1",
						Phase:    models.PhasePrimaMaterial,
						Provider: "openai",
					},
					{
						ID:       uuid.New(),
						Content:  "Generated prompt 2",
						Phase:    models.PhaseSolutio,
						Provider: "anthropic",
					},
				},
			},
			engineError: nil,
			rankingResult: []models.PromptRanking{
				{Prompt: &models.Prompt{ID: uuid.New()}, Score: 0.9},
				{Prompt: &models.Prompt{ID: uuid.New()}, Score: 0.8},
			},
			rankingError:    nil,
			saveError:       nil,
			expectedError:   "",
			expectedPrompts: 2,
		},
		{
			name: "engine generation failure",
			request: GenerateRequest{
				Input: "Test input",
			},
			engineResult:    nil,
			engineError:     assert.AnError,
			expectedError:   "generation failed",
			expectedPrompts: 0,
		},
		{
			name: "successful generation with save disabled",
			request: GenerateRequest{
				Input: "Test input",
				Save:  false,
			},
			engineResult: &models.GenerationResult{
				Prompts: []models.Prompt{
					{
						ID:       uuid.New(),
						Content:  "Generated prompt",
						Phase:    models.PhasePrimaMaterial,
						Provider: "openai",
					},
				},
			},
			engineError:     nil,
			rankingResult:   []models.PromptRanking{},
			rankingError:    nil,
			expectedError:   "",
			expectedPrompts: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mocks
			mockStorage := new(MockStorage)
			mockEngine := new(MockEngine)
			mockRanker := new(MockRanker)
			mockRegistry := providers.NewRegistry()
			logger := logrus.New()

			// Configure mock expectations
			if tt.engineResult != nil {
				mockEngine.On("Generate", mock.Anything, mock.Anything).Return(tt.engineResult, tt.engineError)
			} else {
				mockEngine.On("Generate", mock.Anything, mock.Anything).Return((*models.GenerationResult)(nil), tt.engineError)
			}

			if tt.engineResult != nil && len(tt.engineResult.Prompts) > 0 {
				mockRanker.On("RankPrompts", mock.Anything, tt.engineResult.Prompts, tt.request.Input).Return(tt.rankingResult, tt.rankingError)
			}

			if tt.request.Save && tt.engineResult != nil {
				for _, prompt := range tt.engineResult.Prompts {
					mockStorage.On("SavePrompt", mock.Anything, mock.MatchedBy(func(p *models.Prompt) bool {
						return p.Content == prompt.Content
					})).Return(tt.saveError)
				}
			}

			// Create service
			service := NewService(
				mockStorage,
				mockEngine,
				mockRanker,
				mockRegistry,
				logger,
			)

			// Execute test
			ctx := context.Background()
			result, err := service.Generate(ctx, tt.request)

			// Verify results
			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Len(t, result.Prompts, tt.expectedPrompts)
				assert.NotEmpty(t, result.SessionID)
				assert.NotEmpty(t, result.Metadata.Duration)
				assert.NotZero(t, result.Metadata.Timestamp)
			}

			// Verify mock expectations
			mockEngine.AssertExpectations(t)
			if tt.engineResult != nil && len(tt.engineResult.Prompts) > 0 {
				mockRanker.AssertExpectations(t)
			}
			if tt.request.Save && tt.engineResult != nil {
				mockStorage.AssertExpectations(t)
			}
		})
	}
}

// TestService_Generate_Defaults tests that defaults are properly set
func TestService_Generate_Defaults(t *testing.T) {
	mockStorage := new(MockStorage)
	mockEngine := new(MockEngine)
	mockRanker := new(MockRanker)
	mockRegistry := providers.NewRegistry()
	logger := logrus.New()

	// Configure mocks
	mockResult := &models.GenerationResult{
		Prompts: []models.Prompt{
			{
				ID:       uuid.New(),
				Content:  "Test prompt",
				Phase:    models.PhasePrimaMaterial,
				Provider: "openai",
			},
		},
	}

	mockEngine.On("Generate", mock.Anything, mock.MatchedBy(func(opts models.GenerateOptions) bool {
		req := opts.Request
		// Verify defaults are set
		return req.Count == 3 &&
			len(req.Phases) == 3 &&
			req.Phases[0] == models.PhasePrimaMaterial &&
			req.Phases[1] == models.PhaseSolutio &&
			req.Phases[2] == models.PhaseCoagulatio
	})).Return(mockResult, nil)

	mockRanker.On("RankPrompts", mock.Anything, mock.Anything, mock.Anything).Return([]models.PromptRanking{}, nil)

	service := NewService(mockStorage, mockEngine, mockRanker, mockRegistry, logger)

	// Test with minimal request
	ctx := context.Background()
	request := GenerateRequest{
		Input: "Test input",
		Save:  false, // Don't save to avoid storage mock setup
	}

	result, err := service.Generate(ctx, request)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	mockEngine.AssertExpectations(t)
}

// TestService_SavePrompt tests prompt saving functionality
func TestService_SavePrompt(t *testing.T) {
	mockStorage := new(MockStorage)
	logger := logrus.New()

	service := NewService(mockStorage, nil, nil, nil, logger)

	prompt := &models.Prompt{
		Content:  "Test prompt",
		Phase:    models.PhasePrimaMaterial,
		Provider: "openai",
	}

	// Mock storage call
	mockStorage.On("SavePrompt", mock.Anything, mock.MatchedBy(func(p *models.Prompt) bool {
		// Verify ID and timestamps are set
		return p.ID != uuid.Nil &&
			!p.CreatedAt.IsZero() &&
			!p.UpdatedAt.IsZero()
	})).Return(nil)

	ctx := context.Background()
	err := service.SavePrompt(ctx, prompt)

	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, prompt.ID)
	assert.False(t, prompt.CreatedAt.IsZero())
	assert.False(t, prompt.UpdatedAt.IsZero())
	mockStorage.AssertExpectations(t)
}

// TestService_ListPrompts tests listing functionality
func TestService_ListPrompts(t *testing.T) {
	logger := logrus.New()
	service := NewService(nil, nil, nil, nil, logger)

	ctx := context.Background()
	prompts, err := service.ListPrompts(ctx, 10, 0)

	// Currently returns empty list as it's not implemented
	assert.NoError(t, err)
	assert.Empty(t, prompts)
}

// TestService_GetPrompt tests single prompt retrieval
func TestService_GetPrompt(t *testing.T) {
	logger := logrus.New()
	service := NewService(nil, nil, nil, nil, logger)

	ctx := context.Background()
	prompt, err := service.GetPrompt(ctx, "test-id")

	// Currently returns error as it's not implemented
	assert.Error(t, err)
	assert.Nil(t, prompt)
	assert.Contains(t, err.Error(), "not implemented")
}

// TestService_SearchPrompts tests search functionality
func TestService_SearchPrompts(t *testing.T) {
	logger := logrus.New()
	service := NewService(nil, nil, nil, nil, logger)

	ctx := context.Background()
	prompts, err := service.SearchPrompts(ctx, "test query", 10)

	// Currently returns empty list as it's not implemented
	assert.NoError(t, err)
	assert.Empty(t, prompts)
}

// TestService_DeletePrompt tests prompt deletion
func TestService_DeletePrompt(t *testing.T) {
	logger := logrus.New()
	service := NewService(nil, nil, nil, nil, logger)

	ctx := context.Background()
	err := service.DeletePrompt(ctx, "test-id")

	// Currently returns error as it's not implemented
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not implemented")
}

// Benchmark tests
func BenchmarkService_Generate(b *testing.B) {
	mockStorage := new(MockStorage)
	mockEngine := new(MockEngine)
	mockRanker := new(MockRanker)
	mockRegistry := providers.NewRegistry()
	logger := logrus.New()

	mockResult := &models.GenerationResult{
		Prompts: []models.Prompt{
			{
				ID:       uuid.New(),
				Content:  "Test prompt",
				Phase:    models.PhasePrimaMaterial,
				Provider: "openai",
			},
		},
	}

	mockEngine.On("Generate", mock.Anything, mock.Anything).Return(mockResult, nil)
	mockRanker.On("RankPrompts", mock.Anything, mock.Anything, mock.Anything).Return([]models.PromptRanking{}, nil)

	service := NewService(mockStorage, mockEngine, mockRanker, mockRegistry, logger)

	request := GenerateRequest{
		Input: "Test input for benchmarking",
		Save:  false,
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.Generate(ctx, request)
		if err != nil {
			b.Fatal(err)
		}
	}
}
