package judge

import (
	"context"
	"strings"
	"testing"

	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockJudgeProvider implements providers.Provider for testing
type MockJudgeProvider struct {
	responses map[string]string
	errors    map[string]error
}

func NewMockJudgeProvider() *MockJudgeProvider {
	return &MockJudgeProvider{
		responses: make(map[string]string),
		errors:    make(map[string]error),
	}
}

func (m *MockJudgeProvider) Name() string {
	return "mock-judge"
}

func (m *MockJudgeProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	// Check for errors first - use empty string as wildcard for any prompt
	if err, exists := m.errors[""]; exists {
		return nil, err
	}
	if err, exists := m.errors[req.Prompt]; exists {
		return nil, err
	}

	response, exists := m.responses[req.Prompt]
	if !exists {
		// Default valid JSON response
		response = `{
			"overall_score": 7.5,
			"criteria_scores": {
				"factual_accuracy": 8.0,
				"helpfulness": 7.0,
				"code_quality": 8.0,
				"conciseness": 7.0
			},
			"reasoning": "The response demonstrates good technical accuracy and provides helpful information.",
			"improvements": ["Add more specific examples", "Improve code formatting"],
			"bias_notes": []
		}`
	}

	return &providers.GenerateResponse{
		Content:    response,
		Model:      "mock-model",
		TokensUsed: 150,
	}, nil
}

func (m *MockJudgeProvider) SetResponse(prompt, response string) {
	m.responses[prompt] = response
}

func (m *MockJudgeProvider) SetError(prompt string, err error) {
	m.errors[prompt] = err
}

func (m *MockJudgeProvider) GetEmbedding(ctx context.Context, text string, registry *providers.Registry) ([]float32, error) {
	// Mock embedding - return a simple vector
	return []float32{0.1, 0.2, 0.3, 0.4, 0.5}, nil
}

func (m *MockJudgeProvider) IsAvailable() bool {
	return true
}

func (m *MockJudgeProvider) SupportsEmbeddings() bool {
	return true
}

func TestNewLLMJudge(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	assert.NotNil(t, judge)
	assert.Equal(t, provider, judge.provider)
	assert.Equal(t, "test-model", judge.modelName)
	assert.NotNil(t, judge.biasChecks)
	assert.Len(t, judge.biasChecks, 3) // verbosity, position, fine_grained
}

func TestEvaluatePrompt_Success(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	request := &PromptEvaluationRequest{
		OriginalPrompt:    "Write a Python function to calculate fibonacci numbers",
		GeneratedResponse: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
		ModelFamily:       models.ModelFamilyGPT,
		PersonaType:       models.PersonaCode,
		Criteria: map[string]EvaluationCriteria{
			"code_quality": {
				CodeQuality: true,
				Weight:      0.5,
			},
			"factual_accuracy": {
				FactualAccuracy: true,
				Weight:          0.5,
			},
		},
	}

	ctx := context.Background()
	result, err := judge.EvaluatePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 7.5, result.OverallScore)
	assert.Equal(t, models.ModelFamilyGPT, result.ModelFamily)
	assert.NotZero(t, result.ProcessingDuration)
	assert.Contains(t, result.CriteriaScores, "factual_accuracy")
	assert.Contains(t, result.CriteriaScores, "code_quality")
}

func TestEvaluatePrompt_DifferentModelFamilies(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	testCases := []struct {
		name        string
		modelFamily models.ModelFamily
		expectsTag  string
	}{
		{"Claude", models.ModelFamilyClaude, "<instructions>"},
		{"GPT", models.ModelFamilyGPT, "# Evaluation Instructions"},
		{"Gemini", models.ModelFamilyGemini, "I need your help evaluating"},
		{"Generic", models.ModelFamily("unknown"), "Evaluate the following"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			request := &PromptEvaluationRequest{
				OriginalPrompt:    "Test prompt",
				GeneratedResponse: "Test response",
				ModelFamily:       tc.modelFamily,
				PersonaType:       models.PersonaCode,
				Criteria:          GetDefaultCodeCriteria(),
			}

			ctx := context.Background()
			result, err := judge.EvaluatePrompt(ctx, request)

			require.NoError(t, err)
			assert.NotNil(t, result)
			assert.Equal(t, tc.modelFamily, result.ModelFamily)
		})
	}
}

func TestParseEvaluationResponse_ValidJSON(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	validJSON := `{
		"overall_score": 8.5,
		"criteria_scores": {
			"factual_accuracy": 9.0,
			"helpfulness": 8.0
		},
		"reasoning": "Excellent response with high accuracy",
		"improvements": ["Add examples"],
		"bias_notes": ["No bias detected"]
	}`

	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	result, err := judge.parseEvaluationResponse(validJSON, request)

	require.NoError(t, err)
	assert.Equal(t, 8.5, result.OverallScore)
	assert.Equal(t, 9.0, result.CriteriaScores["factual_accuracy"])
	assert.Equal(t, 8.0, result.CriteriaScores["helpfulness"])
	assert.Equal(t, "Excellent response with high accuracy", result.Reasoning)
	assert.Contains(t, result.Improvements, "Add examples")
}

func TestParseEvaluationResponse_CodeBlocks(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	responseWithCodeBlocks := `Here's my evaluation:

` + "```json" + `
{
	"overall_score": 7.0,
	"criteria_scores": {"code_quality": 7.5},
	"reasoning": "Good code structure",
	"improvements": ["Add comments"],
	"bias_notes": []
}
` + "```" + `

This evaluation considers all criteria.`

	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	result, err := judge.parseEvaluationResponse(responseWithCodeBlocks, request)

	require.NoError(t, err)
	assert.Equal(t, 7.0, result.OverallScore)
	assert.Equal(t, 7.5, result.CriteriaScores["code_quality"])
}

func TestParseEvaluationResponse_ClaudeAnswerTags(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	claudeResponse := `<thinking>
Let me evaluate this response...
</thinking>

<answer>
{
	"overall_score": 6.5,
	"criteria_scores": {"helpfulness": 6.0},
	"reasoning": "Moderately helpful response",
	"improvements": ["Be more specific"],
	"bias_notes": []
}
</answer>`

	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyClaude,
		PersonaType: models.PersonaCode,
	}

	result, err := judge.parseEvaluationResponse(claudeResponse, request)

	require.NoError(t, err)
	assert.Equal(t, 6.5, result.OverallScore)
	assert.Equal(t, 6.0, result.CriteriaScores["helpfulness"])
}

func TestParseEvaluationResponse_FallbackParsing(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	malformedResponse := `The response has a score of 8 out of 10. It's quite good but could be improved.`

	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	result, err := judge.parseEvaluationResponse(malformedResponse, request)

	require.NoError(t, err)
	assert.Equal(t, 8.0, result.OverallScore) // Should extract "8" from text
	assert.NotNil(t, result.CriteriaScores)
	assert.Contains(t, result.Reasoning, "Fallback evaluation")
}

func TestNormalizeScore(t *testing.T) {
	testCases := []struct {
		input    float64
		expected float64
	}{
		{-1.0, 0.0},
		{0.0, 0.0},
		{5.5, 5.5},
		{10.0, 10.0},
		{15.0, 10.0},
	}

	for _, tc := range testCases {
		result := normalizeScore(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

func TestExtractNumericScore(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	testCases := []struct {
		text     string
		expected float64
	}{
		{"score: 7.5", 7.5},
		{"Overall: 8", 8.0},
		{"6/10", 6.0},
		{"9.2 out of 10", 9.2},
		{"No numeric score here", 6.0}, // Default
	}

	for _, tc := range testCases {
		result := judge.extractNumericScore(tc.text)
		assert.Equal(t, tc.expected, result)
	}
}

func TestBiasDetection(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	t.Run("VerbosityBias", func(t *testing.T) {
		request := &PromptEvaluationRequest{
			GeneratedResponse: strings.Repeat("word ", 600), // Very long response
		}
		result := &EvaluationResult{
			OverallScore: 9.0, // High score for verbose response
		}

		judge.detectBiases(request, result)
		assert.Contains(t, result.BiasDetected, "Verbosity Bias")
	})

	t.Run("FineGrainedScoringBias", func(t *testing.T) {
		request := &PromptEvaluationRequest{}
		result := &EvaluationResult{
			CriteriaScores: map[string]float64{
				"accuracy": 7.37, // Suspiciously precise
			},
		}

		judge.detectBiases(request, result)
		assert.Contains(t, result.BiasDetected, "Fine-Grained Scoring Bias")
	})

	t.Run("NoBias", func(t *testing.T) {
		request := &PromptEvaluationRequest{
			GeneratedResponse: "Short response",
		}
		result := &EvaluationResult{
			OverallScore: 7.0,
			CriteriaScores: map[string]float64{
				"accuracy": 7.5, // Normal precision
			},
		}

		judge.detectBiases(request, result)
		assert.Empty(t, result.BiasDetected)
	})
}

func TestBuildCriteriaDescription(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	criteria := map[string]EvaluationCriteria{
		"accuracy": {
			FactualAccuracy: true,
			Weight:          0.5,
		},
		"quality": {
			CodeQuality: true,
			Helpfulness: true,
			Weight:      0.5,
		},
	}

	description := judge.buildCriteriaDescription(criteria)

	assert.Contains(t, description, "accuracy")
	assert.Contains(t, description, "quality")
	assert.Contains(t, description, "0.50")
	assert.Contains(t, description, "Check factual correctness")
	assert.Contains(t, description, "Evaluate code structure")
	assert.Contains(t, description, "Assess practical usefulness")
}

func TestGetDefaultCodeCriteria(t *testing.T) {
	criteria := GetDefaultCodeCriteria()

	assert.Len(t, criteria, 4)
	assert.Contains(t, criteria, "factual_accuracy")
	assert.Contains(t, criteria, "code_quality")
	assert.Contains(t, criteria, "helpfulness")
	assert.Contains(t, criteria, "conciseness")

	// Check weights sum to 1.0
	totalWeight := 0.0
	for _, criterion := range criteria {
		totalWeight += criterion.Weight
	}
	assert.InDelta(t, 1.0, totalWeight, 0.01)
}

func TestEvaluatePrompt_WithReferenceAnswer(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	request := &PromptEvaluationRequest{
		OriginalPrompt:    "Calculate factorial",
		GeneratedResponse: "def factorial(n): return n * factorial(n-1) if n > 1 else 1",
		ReferenceAnswer:   "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
		ModelFamily:       models.ModelFamilyGPT,
		PersonaType:       models.PersonaCode,
		Criteria:          GetDefaultCodeCriteria(),
	}

	ctx := context.Background()
	result, err := judge.EvaluatePrompt(ctx, request)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, models.ModelFamilyGPT, result.ModelFamily)
}

func TestEvaluatePrompt_ProviderError(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	// Set up provider to return error
	provider.SetError("", assert.AnError)

	request := &PromptEvaluationRequest{
		OriginalPrompt:    "Test prompt",
		GeneratedResponse: "Test response",
		ModelFamily:       models.ModelFamilyGPT,
		PersonaType:       models.PersonaCode,
		Criteria:          GetDefaultCodeCriteria(),
	}

	ctx := context.Background()
	result, err := judge.EvaluatePrompt(ctx, request)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to get evaluation from LLM")
}

func TestCleanLLMResponse(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			"WithPrefix",
			"Here's the evaluation: {\"score\": 8}",
			"{\"score\": 8}",
		},
		{
			"WithCodeBlocks",
			"```json\n{\"score\": 7}\n```",
			"{\"score\": 7}",
		},
		{
			"WithSuffix",
			"{\"score\": 9} This evaluation is helpful.",
			"{\"score\": 9}",
		},
		{
			"CleanJSON",
			"{\"score\": 6}",
			"{\"score\": 6}",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := judge.cleanLLMResponse(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestTryParseJSON_InvalidJSON(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	invalidJSON := `{"score": 8, "invalid": }`

	result, err := judge.tryParseJSON(invalidJSON)
	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestTryParseJSON_ScoreNormalization(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	jsonWithInvalidScores := `{
		"overall_score": 15.0,
		"criteria_scores": {
			"accuracy": -2.0,
			"quality": 12.0
		},
		"reasoning": "Test",
		"improvements": []
	}`

	result, err := judge.tryParseJSON(jsonWithInvalidScores)

	require.NoError(t, err)
	assert.Equal(t, 10.0, result.OverallScore)              // Normalized from 15.0
	assert.Equal(t, 0.0, result.CriteriaScores["accuracy"]) // Normalized from -2.0
	assert.Equal(t, 10.0, result.CriteriaScores["quality"]) // Normalized from 12.0
}

func TestCreateFallbackEvaluation(t *testing.T) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	response := "The response scores 8 out of 10 and is quite good."
	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	result, err := judge.createFallbackEvaluation(response, request)

	require.NoError(t, err)
	assert.Equal(t, 8.0, result.OverallScore) // Extracted from text
	assert.NotNil(t, result.CriteriaScores)
	assert.Contains(t, result.Reasoning, "Fallback evaluation")
	assert.Contains(t, result.Improvements, "Improve response format")
}

// Benchmark tests for performance
func BenchmarkEvaluatePrompt(b *testing.B) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	request := &PromptEvaluationRequest{
		OriginalPrompt:    "Write a sorting algorithm",
		GeneratedResponse: "def bubble_sort(arr): ...",
		ModelFamily:       models.ModelFamilyGPT,
		PersonaType:       models.PersonaCode,
		Criteria:          GetDefaultCodeCriteria(),
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := judge.EvaluatePrompt(ctx, request)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkParseEvaluationResponse(b *testing.B) {
	provider := NewMockJudgeProvider()
	judge := NewLLMJudge(provider, "test-model")

	jsonResponse := `{
		"overall_score": 7.5,
		"criteria_scores": {
			"factual_accuracy": 8.0,
			"helpfulness": 7.0,
			"code_quality": 8.0,
			"conciseness": 7.0
		},
		"reasoning": "Good response with accurate information",
		"improvements": ["Add examples", "Improve formatting"],
		"bias_notes": []
	}`

	request := &PromptEvaluationRequest{
		ModelFamily: models.ModelFamilyGPT,
		PersonaType: models.PersonaCode,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := judge.parseEvaluationResponse(jsonResponse, request)
		if err != nil {
			b.Fatal(err)
		}
	}
}
