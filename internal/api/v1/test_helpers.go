package v1

import (
	"context"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/stretchr/testify/mock"
)

// Mock implementations for testing
type MockStorage struct {
	mock.Mock
	saveCount int
}

func (m *MockStorage) SavePrompt(ctx context.Context, p *models.Prompt) error {
	m.saveCount++
	args := m.Called(ctx, p)
	return args.Error(0)
}

func (m *MockStorage) Close() error {
	args := m.Called()
	return args.Error(0)
}

// GetSaveCount returns the number of times SavePrompt was called
func (m *MockStorage) GetSaveCount() int {
	return m.saveCount
}

// ResetSaveCount resets the save counter
func (m *MockStorage) ResetSaveCount() {
	m.saveCount = 0
}

type MockEngine struct {
	mock.Mock
}

func (m *MockEngine) Generate(ctx context.Context, opts models.GenerateOptions) (*models.GenerationResult, error) {
	args := m.Called(ctx, opts)
	if result := args.Get(0); result != nil {
		return result.(*models.GenerationResult), args.Error(1)
	}
	return nil, args.Error(1)
}

// CreateMockEngine creates a mock engine for testing
func CreateMockEngine() *engine.Engine {
	// Since we can't create a real engine.Engine from a MockEngine,
	// we need to return nil and handle it in the tests
	return nil
}

type MockRanker struct {
	mock.Mock
}

func (m *MockRanker) RankPrompts(ctx context.Context, prompts []models.Prompt, query string) ([]models.PromptRanking, error) {
	args := m.Called(ctx, prompts, query)
	if result := args.Get(0); result != nil {
		return result.([]models.PromptRanking), args.Error(1)
	}
	return nil, args.Error(1)
}
