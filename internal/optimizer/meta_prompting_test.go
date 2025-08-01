package optimizer

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const fibonacciPrompt = "Write a fibonacci function"
const fibonacciTaskDescription = "Calculate fibonacci efficiently"
const codeQuality = "code_quality"

// MockOptimizerProvider implements providers.Provider for testing
type MockOptimizerProvider struct {
	responses map[string]string
	errors    map[string]error
}

func NewMockOptimizerProvider() *MockOptimizerProvider {
	return &MockOptimizerProvider{
		responses: make(map[string]string),
		errors:    make(map[string]error),
	}
}

func (m *MockOptimizerProvider) Name() string {
	return "mock-optimizer"
}

func (m *MockOptimizerProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	if err, exists := m.errors[""]; exists {
		return nil, err
	}
	if err, exists := m.errors[req.Prompt]; exists {
		return nil, err
	}

	response, exists := m.responses[req.Prompt]
	if !exists {
		// Default optimization response
		if strings.Contains(req.Prompt, "improve") {
			response = "Here's an improved version: Write a highly efficient Python function to calculate fibonacci numbers using dynamic programming with memoization."
		} else {
			response = "def fibonacci(n):\n    memo = {}\n    def fib(x):\n        if x in memo: return memo[x]\n        if x <= 1: return x\n        memo[x] = fib(x-1) + fib(x-2)\n        return memo[x]\n    return fib(n)"
		}
	}

	return &providers.GenerateResponse{
		Content:    response,
		Model:      "mock-model",
		TokensUsed: 100,
	}, nil
}

func (m *MockOptimizerProvider) GetEmbedding(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
	return []float32{0.1, 0.2, 0.3, 0.4, 0.5}, nil
}

func (m *MockOptimizerProvider) IsAvailable() bool {
	return true
}

func (m *MockOptimizerProvider) SupportsEmbeddings() bool {
	return true
}

func (m *MockOptimizerProvider) SupportsStreaming() bool {
	return false
}

func (m *MockOptimizerProvider) SetResponse(prompt, response string) {
	m.responses[prompt] = response
}

func (m *MockOptimizerProvider) SetError(prompt string, err error) {
	m.errors[prompt] = err
}

// MockJudgeProvider for optimizer testing
type MockJudgeProvider struct {
	scores    map[string]float64
	responses map[string]string
	errors    map[string]error
}

func NewMockJudgeProvider() *MockJudgeProvider {
	return &MockJudgeProvider{
		scores:    make(map[string]float64),
		responses: make(map[string]string),
		errors:    make(map[string]error),
	}
}

func (m *MockJudgeProvider) Name() string {
	return "mock-judge"
}

func (m *MockJudgeProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	if err, exists := m.errors[""]; exists {
		return nil, err
	}
	if err, exists := m.errors[req.Prompt]; exists {
		return nil, err
	}

	response, exists := m.responses[req.Prompt]
	if !exists {
		// Default evaluation response with varying scores
		score := 7.5
		if s, exists := m.scores[req.Prompt]; exists {
			score = s
		} else if strings.Contains(req.Prompt, "improved") || strings.Contains(req.Prompt, "optimized") {
			score = 8.5 // Higher score for improved prompts
		}

		response = fmt.Sprintf(`{
			"overall_score": %.1f,
			"criteria_scores": {
				"factual_accuracy": %.1f,
				"helpfulness": %.1f,
				"code_quality": %.1f,
				"conciseness": %.1f
			},
			"reasoning": "Evaluation for optimization testing",
			"improvements": ["Add more examples", "Improve clarity"],
			"bias_notes": []
		}`, score, score-0.5, score, score+0.5, score-1.0)
	}

	return &providers.GenerateResponse{
		Content:    response,
		Model:      "mock-judge-model",
		TokensUsed: 150,
	}, nil
}

func (m *MockJudgeProvider) GetEmbedding(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
	return []float32{0.1, 0.2, 0.3, 0.4, 0.5}, nil
}

func (m *MockJudgeProvider) IsAvailable() bool {
	return true
}

func (m *MockJudgeProvider) SupportsEmbeddings() bool {
	return true
}

func (m *MockJudgeProvider) SupportsStreaming() bool {
	return false
}

func (m *MockJudgeProvider) SetScore(prompt string, score float64) {
	m.scores[prompt] = score
}

func (m *MockJudgeProvider) SetResponse(prompt, response string) {
	m.responses[prompt] = response
}

func (m *MockJudgeProvider) SetError(prompt string, err error) {
	m.errors[prompt] = err
}

// MockStorage implements storage.StorageInterface for testing
type MockStorage struct {
	embeddingProvider string
	embeddingModel    string
	embeddingDims     int
}

func (m *MockStorage) Close() error                                                { return nil }
func (m *MockStorage) SavePrompt(ctx context.Context, prompt *models.Prompt) error { return nil }
func (m *MockStorage) GetPromptByID(ctx context.Context, id uuid.UUID) (*models.Prompt, error) {
	return nil, nil
}
func (m *MockStorage) GetPromptsWithoutEmbeddings(ctx context.Context, limit int) ([]*models.Prompt, error) {
	return nil, nil
}
func (m *MockStorage) UpdatePromptRelevanceScore(ctx context.Context, id uuid.UUID, score float64) error {
	return nil
}
func (m *MockStorage) SearchSimilarPrompts(ctx context.Context, embedding []float32, limit int) ([]*models.Prompt, error) {
	return nil, nil
}
func (m *MockStorage) GetHighQualityHistoricalPrompts(ctx context.Context, limit int) ([]*models.Prompt, error) {
	return nil, nil
}
func (m *MockStorage) SearchSimilarHighQualityPrompts(ctx context.Context, embedding []float32, minScore float64, limit int) ([]*models.Prompt, error) {
	return nil, nil
}
func (m *MockStorage) SaveInteraction(ctx context.Context, interaction *models.UserInteraction) error {
	return nil
}
func (m *MockStorage) SetEmbeddingConfig(provider, model string, dims int) {
	m.embeddingProvider = provider
	m.embeddingModel = model
	m.embeddingDims = dims
}
func (m *MockStorage) GetEmbeddingConfig() (provider, model string, dims int) {
	return m.embeddingProvider, m.embeddingModel, m.embeddingDims
}

// MockRegistry implements providers.RegistryInterface for testing
type MockRegistry struct {
	providers map[string]providers.Provider
}

func NewMockRegistry() *MockRegistry {
	return &MockRegistry{
		providers: make(map[string]providers.Provider),
	}
}

func (m *MockRegistry) Get(name string) (providers.Provider, error) {
	if provider, exists := m.providers[name]; exists {
		return provider, nil
	}
	return nil, fmt.Errorf("provider %s not found", name)
}

func (m *MockRegistry) ListAvailable() []string {
	var names []string
	for name, provider := range m.providers {
		if provider.IsAvailable() {
			names = append(names, name)
		}
	}
	return names
}

func (m *MockRegistry) ListEmbeddingCapableProviders() []string {
	var names []string
	for name, provider := range m.providers {
		if provider.SupportsEmbeddings() {
			names = append(names, name)
		}
	}
	return names
}

// createTestOptimizer creates a new optimizer with mock dependencies for testing
func createTestOptimizer() (*MetaPromptOptimizer, *MockOptimizerProvider, *MockJudgeProvider) {
	provider := NewMockOptimizerProvider()
	judgeProvider := NewMockJudgeProvider()
	storage := &MockStorage{}
	registry := NewMockRegistry()

	// Register the providers in the registry so they can be found
	registry.providers[provider.Name()] = provider
	registry.providers[judgeProvider.Name()] = judgeProvider

	optimizer := NewMetaPromptOptimizer(provider, judgeProvider, storage, registry)
	return optimizer, provider, judgeProvider
}

func TestNewMetaPromptOptimizer(t *testing.T) {
	optimizer, provider, _ := createTestOptimizer()

	assert.NotNil(t, optimizer)
	assert.Equal(t, provider, optimizer.provider)
	assert.NotNil(t, optimizer.judge)
}

func TestOptimizePromptSuccess(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  "Write a function to calculate fibonacci",
		TaskDescription: "Calculate fibonacci numbers efficiently",
		Examples: []OptimizationExample{
			{
				Input:          "fibonacci(10)",
				ExpectedOutput: "55",
				Quality:        8.0,
			},
		},
		Constraints:   []string{"Use Python", "Be efficient"},
		ModelFamily:   models.ModelFamilyGPT,
		PersonaType:   models.PersonaCode,
		MaxIterations: 3,
		TargetScore:   8.0,
		OptimizationGoals: map[string]float64{
			"factual_accuracy": 0.3,
			"code_quality":     0.4,
			"helpfulness":      0.3,
		},
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.OptimizedPrompt)
	assert.Greater(t, result.FinalScore, 0.0)
	assert.GreaterOrEqual(t, result.FinalScore, result.OriginalScore)
	assert.NotZero(t, result.TotalTime)
	assert.NotEmpty(t, result.Iterations)
	assert.LessOrEqual(t, len(result.Iterations), 3) // Max iterations
}

func TestOptimizePromptTargetScoreReached(t *testing.T) {
	optimizer, _, judgeProvider := createTestOptimizer()

	// Set high initial score to trigger early convergence
	judgeProvider.SetScore("", 9.0)

	request := &OptimizationRequest{
		OriginalPrompt:  fibonacciPrompt,
		TaskDescription: fibonacciTaskDescription,
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   5,
		TargetScore:     8.5, // Lower than initial score
		OptimizationGoals: map[string]float64{
			"code_quality": 1.0,
		},
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.GreaterOrEqual(t, result.FinalScore, request.TargetScore)
	assert.Greater(t, result.ConvergedAt, 0) // Should converge early
	assert.Less(t, result.ConvergedAt, 5)    // Before max iterations
}

func TestOptimizePromptMaxIterationsReached(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  fibonacciPrompt,
		TaskDescription: fibonacciTaskDescription,
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   2,
		TargetScore:     10.0, // Unreachable target
		OptimizationGoals: map[string]float64{
			"code_quality": 1.0,
		},
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 2, len(result.Iterations)) // Should run all iterations
	assert.Equal(t, -1, result.ConvergedAt)    // Should not converge (-1 means no convergence)
}

func TestOptimizePromptProviderError(t *testing.T) {
	optimizer, provider, _ := createTestOptimizer()

	// Set provider to return error
	provider.SetError("", errors.New("provider error"))

	request := &OptimizationRequest{
		OriginalPrompt:  fibonacciPrompt,
		TaskDescription: fibonacciTaskDescription,
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   2,
		TargetScore:     8.0,
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to evaluate original prompt")
}

func TestOptimizePromptJudgeError(t *testing.T) {
	optimizer, _, judgeProvider := createTestOptimizer()

	// Set judge to return error
	judgeProvider.SetError("", errors.New("judge error"))

	request := &OptimizationRequest{
		OriginalPrompt:  fibonacciPrompt,
		TaskDescription: fibonacciTaskDescription,
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   2,
		TargetScore:     8.0,
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to evaluate original prompt")
}

func TestOptimizePromptImprovementTracking(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  fibonacciPrompt,
		TaskDescription: fibonacciTaskDescription,
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   3,
		TargetScore:     9.5, // High target to ensure all iterations run
		OptimizationGoals: map[string]float64{
			"code_quality": 1.0,
		},
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check that iterations are tracked
	assert.Equal(t, 3, len(result.Iterations))

	// Check that each iteration has required fields
	for i, iteration := range result.Iterations {
		assert.Equal(t, i+1, iteration.Iteration)
		assert.NotEmpty(t, iteration.Prompt)
		assert.Greater(t, iteration.Score, 0.0)
		assert.NotNil(t, iteration.Evaluation)
		assert.NotZero(t, iteration.ProcessingTime)
	}

	// Check improvement calculation
	assert.Equal(t, result.FinalScore-result.OriginalScore, result.Improvement)
}

func TestOptimizePromptWithExamples(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  "Write a sorting function",
		TaskDescription: "Sort an array efficiently",
		Examples: []OptimizationExample{
			{
				Input:          "[3, 1, 4, 1, 5]",
				ExpectedOutput: "[1, 1, 3, 4, 5]",
				Quality:        9.0,
			},
			{
				Input:          "[9, 8, 7, 6]",
				ExpectedOutput: "[6, 7, 8, 9]",
				Quality:        8.5,
			},
		},
		ModelFamily:   models.ModelFamilyGPT,
		PersonaType:   models.PersonaCode,
		MaxIterations: 2,
		TargetScore:   8.0,
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.OptimizedPrompt)
}

func TestOptimizePromptWithConstraints(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  "Write a function",
		TaskDescription: "Process data",
		Constraints:     []string{"Use only built-in functions", "No external libraries", "Maximum 10 lines"},
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   2,
		TargetScore:     8.0,
	}

	ctx := context.Background()
	result, err := optimizer.OptimizePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.OptimizedPrompt)
}

func TestEvaluatePromptTestResponseGeneration(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  "Write a test function",
		TaskDescription: "Create unit tests",
		Examples: []OptimizationExample{
			{
				Input:          "test_addition",
				ExpectedOutput: "def test_addition(): assert add(2, 3) == 5",
				Quality:        8.0,
			},
		},
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	ctx := context.Background()
	score, evaluation, err := optimizer.evaluatePrompt(ctx, "Write comprehensive unit tests", request)

	require.NoError(t, err)
	assert.Greater(t, score, 0.0)
	assert.NotNil(t, evaluation)
	assert.NotEmpty(t, evaluation.Reasoning)
}

func TestGenerateTestResponseWithExample(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		Examples: []OptimizationExample{
			{
				Input:          "fibonacci(5)",
				ExpectedOutput: "5",
				Quality:        8.0,
			},
		},
	}

	ctx := context.Background()
	response, err := optimizer.generateTestResponse(ctx, "Calculate fibonacci", request)

	require.NoError(t, err)
	assert.NotEmpty(t, response)
}

func TestGenerateTestResponseWithoutExample(t *testing.T) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		TaskDescription: "Process data efficiently",
		Examples:        []OptimizationExample{}, // No examples
	}

	ctx := context.Background()
	response, err := optimizer.generateTestResponse(ctx, "Process data", request)

	require.NoError(t, err)
	assert.NotEmpty(t, response)
}

func TestGenerateTestResponseProviderError(t *testing.T) {
	optimizer, provider, _ := createTestOptimizer()

	// Set provider to return error
	provider.SetError("", errors.New("generation error"))

	request := &OptimizationRequest{
		TaskDescription: "Test task",
	}

	ctx := context.Background()
	response, err := optimizer.generateTestResponse(ctx, "Test prompt", request)

	assert.Error(t, err)
	assert.Empty(t, response)
}

func TestGetOptimizationCriteria(t *testing.T) {
	request := &OptimizationRequest{
		OptimizationGoals: map[string]float64{
			"factual_accuracy": 0.4,
			codeQuality:        0.3,
			"helpfulness":      0.3,
		},
	}

	criteria := getOptimizationCriteria(request)

	assert.Len(t, criteria, 4) // Default code criteria has 4 items
	assert.Contains(t, criteria, "factual_accuracy")
	assert.Contains(t, criteria, codeQuality)
	assert.Contains(t, criteria, "helpfulness")

	// Check weights
	assert.Equal(t, 0.4, criteria["factual_accuracy"].Weight)
	assert.Equal(t, 0.3, criteria[codeQuality].Weight)
	assert.Equal(t, 0.3, criteria["helpfulness"].Weight)
}

func TestGetOptimizationCriteriaDefaultGoals(t *testing.T) {
	request := &OptimizationRequest{
		// No optimization goals specified
	}

	criteria := getOptimizationCriteria(request)

	// Should return default criteria
	assert.NotEmpty(t, criteria)
	assert.Contains(t, criteria, "factual_accuracy")
	assert.Contains(t, criteria, "helpfulness")
}

// Benchmark tests for performance
func BenchmarkOptimizePrompt(b *testing.B) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		OriginalPrompt:  "Write a function",
		TaskDescription: "Process data",
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
		MaxIterations:   2,
		TargetScore:     8.0,
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := optimizer.OptimizePrompt(ctx, request)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkEvaluatePrompt(b *testing.B) {
	optimizer, _, _ := createTestOptimizer()

	request := &OptimizationRequest{
		TaskDescription: "Test task",
		ModelFamily:     models.ModelFamilyGPT,
		PersonaType:     models.PersonaCode,
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := optimizer.evaluatePrompt(ctx, "Test prompt", request)
		if err != nil {
			b.Fatal(err)
		}
	}
}
