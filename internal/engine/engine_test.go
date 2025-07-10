package engine

import (
	"context"
	"errors"
	"testing"

	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockProvider implements the Provider interface for testing
type MockProvider struct {
	name               string
	available          bool
	supportsEmbeddings bool
	generateFunc       func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error)
	embeddingFunc      func(ctx context.Context, text string, registry *providers.Registry) ([]float32, error)
}

func (m *MockProvider) Name() string             { return m.name }
func (m *MockProvider) IsAvailable() bool        { return m.available }
func (m *MockProvider) SupportsEmbeddings() bool { return m.supportsEmbeddings }

func (m *MockProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	if m.generateFunc != nil {
		return m.generateFunc(ctx, req)
	}
	return &providers.GenerateResponse{
		Content:    "Mock response for: " + req.Prompt,
		TokensUsed: 100,
		Model:      m.name + "-model",
	}, nil
}

func (m *MockProvider) GetEmbedding(ctx context.Context, text string, registry *providers.Registry) ([]float32, error) {
	if m.embeddingFunc != nil {
		return m.embeddingFunc(ctx, text, registry)
	}
	if !m.supportsEmbeddings {
		return nil, errors.New("provider does not support embeddings")
	}
	return []float32{0.1, 0.2, 0.3}, nil
}

func TestNewEngine(t *testing.T) {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	registry := providers.NewRegistry()

	engine := NewEngine(registry, logger)
	require.NotNil(t, engine)
}

func TestEngine_Generate_SinglePhase(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register mock provider
	mockProvider := &MockProvider{
		name:      "test-provider",
		available: true,
	}
	registry.Register("test-provider", mockProvider)

	// Create generation options
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Create a login system",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "test-provider"},
		},
		UseParallel: false,
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Prompts, 1)
	assert.Equal(t, models.PhaseIdea, result.Prompts[0].Phase)
	assert.Equal(t, "test-provider", result.Prompts[0].Provider)
	assert.Contains(t, result.Prompts[0].Content, "Mock response for:")
}

func TestEngine_Generate_MultiplePhases(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register mock providers
	ideaProvider := &MockProvider{
		name:      "idea-provider",
		available: true,
		generateFunc: func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
			return &providers.GenerateResponse{
				Content:    "Idea phase response: " + req.Prompt,
				TokensUsed: 50,
				Model:      "idea-model",
			}, nil
		},
	}
	humanProvider := &MockProvider{
		name:      "human-provider",
		available: true,
		generateFunc: func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
			return &providers.GenerateResponse{
				Content:    "Human phase response: " + req.Prompt,
				TokensUsed: 75,
				Model:      "human-model",
			}, nil
		},
	}

	registry.Register("idea-provider", ideaProvider)
	registry.Register("human-provider", humanProvider)

	// Create generation options with multiple phases
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Create a user authentication system",
			Phases:      []models.Phase{models.PhaseIdea, models.PhaseHuman},
			Temperature: 0.8,
			MaxTokens:   1500,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "idea-provider"},
			{Phase: models.PhaseHuman, Provider: "human-provider"},
		},
		UseParallel: false,
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Prompts, 2)

	// Check idea phase result
	ideaResult := findResultByPhase(result.Prompts, models.PhaseIdea)
	require.NotNil(t, ideaResult)
	assert.Equal(t, "idea-provider", ideaResult.Provider)
	assert.Contains(t, ideaResult.Content, "Idea phase response:")

	// Check human phase result
	humanResult := findResultByPhase(result.Prompts, models.PhaseHuman)
	require.NotNil(t, humanResult)
	assert.Equal(t, "human-provider", humanResult.Provider)
	assert.Contains(t, humanResult.Content, "Human phase response:")
}

func TestEngine_Generate_WithPersona(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register mock provider
	mockProvider := &MockProvider{
		name:      "test-provider",
		available: true,
	}
	registry.Register("test-provider", mockProvider)

	// Create generation options with persona
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Write a function to sort an array",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.5,
			MaxTokens:   800,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "test-provider"},
		},
		Persona: string(models.PersonaCode),
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Prompts, 1)
	assert.Equal(t, string(models.PersonaCode), result.Prompts[0].PersonaUsed)
}

func TestEngine_Generate_WithTags(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register mock provider
	mockProvider := &MockProvider{
		name:      "test-provider",
		available: true,
	}
	registry.Register("test-provider", mockProvider)

	// Create generation options with tags
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Create a REST API",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
			Tags:        []string{"api", "backend", "test"},
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "test-provider"},
		},
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Prompts, 1)
	assert.Equal(t, []string{"api", "backend", "test"}, result.Prompts[0].Tags)
}

func TestEngine_Generate_ProviderError(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register mock provider that returns an error
	mockProvider := &MockProvider{
		name:      "error-provider",
		available: true,
		generateFunc: func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
			return nil, errors.New("provider generation failed")
		},
	}
	registry.Register("error-provider", mockProvider)

	// Create generation options
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Test input",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "error-provider"},
		},
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "provider generation failed")
}

func TestEngine_Generate_UnavailableProvider(t *testing.T) {
	engine, registry := setupTestEngine(t)

	// Register unavailable provider
	mockProvider := &MockProvider{
		name:      "unavailable-provider",
		available: false,
	}
	registry.Register("unavailable-provider", mockProvider)

	// Create generation options
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Test input",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "unavailable-provider"},
		},
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	// The engine doesn't check availability before use, so this will succeed
	// but we can verify the provider was used
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Prompts, 1)
	assert.Equal(t, "unavailable-provider", result.Prompts[0].Provider)
}

func TestEngine_Generate_NonExistentProvider(t *testing.T) {
	engine, _ := setupTestEngine(t)

	// Create generation options with non-existent provider
	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Test input",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "non-existent-provider"},
		},
	}

	ctx := context.Background()
	result, err := engine.Generate(ctx, opts)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "provider not found")
}

func TestEngine_PhaseTemplates(t *testing.T) {
	engine, _ := setupTestEngine(t)

	// Test that phase templates are initialized
	assert.NotNil(t, engine.phaseTemplates)
	assert.Contains(t, engine.phaseTemplates, models.PhaseIdea)
	assert.Contains(t, engine.phaseTemplates, models.PhaseHuman)
	assert.Contains(t, engine.phaseTemplates, models.PhasePrecision)

	// Test template content
	ideaTemplate := engine.phaseTemplates[models.PhaseIdea]
	assert.Contains(t, ideaTemplate, "{{INPUT}}")
	assert.Contains(t, ideaTemplate, "{{TYPE}}")
}

// Helper functions

func setupTestEngine(t *testing.T) (*Engine, *providers.Registry) {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	registry := providers.NewRegistry()
	engine := NewEngine(registry, logger)

	return engine, registry
}

func findResultByPhase(results []models.Prompt, phase models.Phase) *models.Prompt {
	for _, result := range results {
		if result.Phase == phase {
			return &result
		}
	}
	return nil
}

// Benchmark tests

func BenchmarkEngine_Generate_SinglePhase(b *testing.B) {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	registry := providers.NewRegistry()
	engine := NewEngine(registry, logger)

	// Register mock provider
	mockProvider := &MockProvider{
		name:      "bench-provider",
		available: true,
	}
	registry.Register("bench-provider", mockProvider)

	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Benchmark test input",
			Phases:      []models.Phase{models.PhaseIdea},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "bench-provider"},
		},
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := engine.Generate(ctx, opts)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkEngine_Generate_MultiplePhases(b *testing.B) {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	registry := providers.NewRegistry()
	engine := NewEngine(registry, logger)

	// Register mock providers
	for _, name := range []string{"idea-provider", "human-provider", "precision-provider"} {
		mockProvider := &MockProvider{
			name:      name,
			available: true,
		}
		registry.Register(name, mockProvider)
	}

	opts := GenerateOptions{
		Request: models.PromptRequest{
			Input:       "Benchmark test input",
			Phases:      []models.Phase{models.PhaseIdea, models.PhaseHuman, models.PhasePrecision},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
		},
		PhaseConfigs: []providers.PhaseConfig{
			{Phase: models.PhaseIdea, Provider: "idea-provider"},
			{Phase: models.PhaseHuman, Provider: "human-provider"},
			{Phase: models.PhasePrecision, Provider: "precision-provider"},
		},
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := engine.Generate(ctx, opts)
		if err != nil {
			b.Fatal(err)
		}
	}
}
