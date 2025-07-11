package optimizer

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/judge"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

// MetaPromptOptimizer implements automated prompt optimization using LLMs
type MetaPromptOptimizer struct {
	provider providers.Provider
	judge    *judge.LLMJudge
}

// OptimizationRequest contains parameters for prompt optimization
type OptimizationRequest struct {
	OriginalPrompt    string                `json:"original_prompt"`
	TaskDescription   string                `json:"task_description"`
	Examples          []OptimizationExample `json:"examples"`
	Constraints       []string              `json:"constraints"`
	ModelFamily       models.ModelFamily    `json:"model_family"`
	PersonaType       models.PersonaType    `json:"persona_type"`
	MaxIterations     int                   `json:"max_iterations"`
	TargetScore       float64               `json:"target_score"`
	OptimizationGoals map[string]float64    `json:"optimization_goals"`
}

// OptimizationExample provides training data for the optimizer
type OptimizationExample struct {
	Input          string  `json:"input"`
	ExpectedOutput string  `json:"expected_output"`
	Quality        float64 `json:"quality"` // 1-10 quality score
}

// OptimizationResult contains the results of prompt optimization
type OptimizationResult struct {
	OptimizedPrompt string                  `json:"optimized_prompt"`
	OriginalScore   float64                 `json:"original_score"`
	FinalScore      float64                 `json:"final_score"`
	Improvement     float64                 `json:"improvement"`
	Iterations      []OptimizationIteration `json:"iterations"`
	TotalTime       time.Duration           `json:"total_time"`
	ConvergedAt     int                     `json:"converged_at"`
}

// OptimizationIteration represents one iteration of optimization
type OptimizationIteration struct {
	Iteration       int                     `json:"iteration"`
	Prompt          string                  `json:"prompt"`
	Score           float64                 `json:"score"`
	Evaluation      *judge.EvaluationResult `json:"evaluation"`
	Improvements    []string                `json:"improvements"`
	ChangeReasoning string                  `json:"change_reasoning"`
	ProcessingTime  time.Duration           `json:"processing_time"`
}

// NewMetaPromptOptimizer creates a new meta-prompt optimizer
func NewMetaPromptOptimizer(provider providers.Provider, judgeProvider providers.Provider) *MetaPromptOptimizer {
	return &MetaPromptOptimizer{
		provider: provider,
		judge:    judge.NewLLMJudge(judgeProvider, ""),
	}
}

// OptimizePrompt performs iterative prompt optimization using LLM feedback
func (o *MetaPromptOptimizer) OptimizePrompt(ctx context.Context, request *OptimizationRequest) (*OptimizationResult, error) {
	logger := log.GetLogger()
	logger.Info("Starting prompt optimization")
	startTime := time.Now()

	result := &OptimizationResult{
		Iterations:  make([]OptimizationIteration, 0),
		TotalTime:   0,
		ConvergedAt: -1,
	}

	currentPrompt := request.OriginalPrompt

	// Evaluate original prompt
	logger.Debug("Evaluating original prompt")
	originalScore, originalEval, err := o.evaluatePrompt(ctx, currentPrompt, request)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate original prompt: %w", err)
	}

	result.OriginalScore = originalScore
	bestScore := originalScore
	bestPrompt := currentPrompt

	// Iterative optimization
	for i := 0; i < request.MaxIterations; i++ {
		logger.Infof("Starting optimization iteration %d", i+1)
		iterStart := time.Now()

		// Generate improved prompt
		logger.Debug("Generating improved prompt")
		improvedPrompt, reasoning, err := o.generateImprovedPrompt(ctx, currentPrompt, originalEval, request)
		if err != nil {
			return nil, fmt.Errorf("failed to generate improved prompt at iteration %d: %w", i+1, err)
		}

		// Evaluate improved prompt
		logger.Debug("Evaluating improved prompt")
		score, evaluation, err := o.evaluatePrompt(ctx, improvedPrompt, request)
		if err != nil {
			return nil, fmt.Errorf("failed to evaluate improved prompt at iteration %d: %w", i+1, err)
		}

		iteration := OptimizationIteration{
			Iteration:       i + 1,
			Prompt:          improvedPrompt,
			Score:           score,
			Evaluation:      evaluation,
			Improvements:    evaluation.Improvements,
			ChangeReasoning: reasoning,
			ProcessingTime:  time.Since(iterStart),
		}

		result.Iterations = append(result.Iterations, iteration)

		// Update best if improved
		if score > bestScore {
			logger.Infof("Found improved prompt with score: %.2f", score)
			bestScore = score
			bestPrompt = improvedPrompt
		}

		// Check for convergence
		if score >= request.TargetScore {
			logger.Infof("Target score of %.2f reached, stopping optimization", request.TargetScore)
			result.ConvergedAt = i + 1
			break
		}

		// Use current prompt for next iteration
		currentPrompt = improvedPrompt
	}

	result.OptimizedPrompt = bestPrompt
	result.FinalScore = bestScore
	result.Improvement = bestScore - originalScore
	result.TotalTime = time.Since(startTime)

	logger.Info("Prompt optimization finished")
	return result, nil
}

// evaluatePrompt evaluates a prompt using the LLM judge
func (o *MetaPromptOptimizer) evaluatePrompt(ctx context.Context, prompt string, request *OptimizationRequest) (float64, *judge.EvaluationResult, error) {
	logger := log.GetLogger()
	logger.Debugf("Evaluating prompt: %s", prompt)
	// Generate test response using the prompt
	testResponse, err := o.generateTestResponse(ctx, prompt, request)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to generate test response: %w", err)
	}

	// Evaluate using LLM judge
	evalRequest := &judge.PromptEvaluationRequest{
		OriginalPrompt:    prompt,
		GeneratedResponse: testResponse,
		Criteria:          getOptimizationCriteria(request),
		ModelFamily:       request.ModelFamily,
		PersonaType:       request.PersonaType,
	}

	logger.Debug("Sending evaluation request to LLM judge")
	evaluation, err := o.judge.EvaluatePrompt(ctx, evalRequest)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to evaluate prompt: %w", err)
	}

	return evaluation.OverallScore, evaluation, nil
}

// generateTestResponse creates a test response using the prompt
func (o *MetaPromptOptimizer) generateTestResponse(ctx context.Context, prompt string, request *OptimizationRequest) (string, error) {
	logger := log.GetLogger()
	logger.Debug("Generating test response")
	// Use first example if available, otherwise use task description
	testInput := request.TaskDescription
	if len(request.Examples) > 0 {
		testInput = request.Examples[0].Input
	}

	fullPrompt := prompt + "\n\nTask: " + testInput

	response, err := o.provider.Generate(ctx, providers.GenerateRequest{
		Prompt:      fullPrompt,
		Temperature: 0.3, // Low temperature for consistent evaluation
		MaxTokens:   1000,
	})

	if err != nil {
		return "", err
	}

	return response.Content, nil
}

// generateImprovedPrompt creates an improved version of the prompt using meta-prompting
func (o *MetaPromptOptimizer) generateImprovedPrompt(ctx context.Context, currentPrompt string, evaluation *judge.EvaluationResult, request *OptimizationRequest) (string, string, error) {
	logger := log.GetLogger()
	logger.Debug("Generating improved prompt")
	metaPrompt := o.buildMetaPrompt(currentPrompt, evaluation, request)

	response, err := o.provider.Generate(ctx, providers.GenerateRequest{
		Prompt:      metaPrompt,
		Temperature: 0.7, // Higher creativity for prompt generation
		MaxTokens:   2000,
	})

	if err != nil {
		return "", "", err
	}

	// Parse the response to extract the improved prompt and reasoning
	improvedPrompt, reasoning := o.parseMetaPromptResponse(response.Content)

	return improvedPrompt, reasoning, nil
}

// buildMetaPrompt creates a meta-prompt for prompt optimization
func (o *MetaPromptOptimizer) buildMetaPrompt(currentPrompt string, evaluation *judge.EvaluationResult, request *OptimizationRequest) string {
	constraintsText := strings.Join(request.Constraints, "\n- ")
	improvementsText := strings.Join(evaluation.Improvements, "\n- ")

	template := `You are an expert prompt engineer specializing in %s tasks. Your job is to improve prompts to achieve better performance.

Current Prompt:
"""
%s
"""

Evaluation Results:
- Overall Score: %.1f/10
- Specific Improvements Needed:
%s

Task Description: %s

Constraints:
- %s
- Maintain the core intent and functionality
- Only make necessary improvements
- Ensure clarity and specificity

Examples (if available):
%s

Please provide an improved version of the prompt that addresses the evaluation feedback. 

FORMAT YOUR RESPONSE AS:
REASONING: [Explain your specific changes and why they improve the prompt]

IMPROVED PROMPT:
[Your improved prompt here]`

	personaContext := string(request.PersonaType)
	examplesText := o.formatExamples(request.Examples)

	return fmt.Sprintf(template, personaContext, currentPrompt, evaluation.OverallScore,
		improvementsText, request.TaskDescription, constraintsText, examplesText)
}

// parseMetaPromptResponse extracts the improved prompt and reasoning from the response
func (o *MetaPromptOptimizer) parseMetaPromptResponse(response string) (string, string) {
	// Look for REASONING: and IMPROVED PROMPT: sections
	reasoningStart := strings.Index(response, "REASONING:")
	promptStart := strings.Index(response, "IMPROVED PROMPT:")

	var reasoning, improvedPrompt string

	if reasoningStart != -1 && promptStart != -1 {
		reasoning = strings.TrimSpace(response[reasoningStart+10 : promptStart])
		improvedPrompt = strings.TrimSpace(response[promptStart+16:])
	} else {
		// Fallback: use entire response as improved prompt
		improvedPrompt = strings.TrimSpace(response)
		reasoning = "No explicit reasoning provided"
	}

	return improvedPrompt, reasoning
}

// formatExamples formats optimization examples for the meta-prompt
func (o *MetaPromptOptimizer) formatExamples(examples []OptimizationExample) string {
	if len(examples) == 0 {
		return "No examples provided"
	}

	var formatted []string
	for i, example := range examples {
		formatted = append(formatted, fmt.Sprintf("Example %d:\nInput: %s\nExpected Output: %s\nQuality: %.1f/10",
			i+1, example.Input, example.ExpectedOutput, example.Quality))
	}

	return strings.Join(formatted, "\n\n")
}

// getOptimizationCriteria returns evaluation criteria for optimization
func getOptimizationCriteria(request *OptimizationRequest) map[string]judge.EvaluationCriteria {
	criteria := judge.GetDefaultCodeCriteria()

	// Adjust weights based on optimization goals
	for criterion, weight := range request.OptimizationGoals {
		if existingCriteria, exists := criteria[criterion]; exists {
			existingCriteria.Weight = weight
			criteria[criterion] = existingCriteria
		}
	}

	return criteria
}

// GenerateOptimizedSystemPrompt creates an optimized system prompt for a specific model family
func (o *MetaPromptOptimizer) GenerateOptimizedSystemPrompt(ctx context.Context, persona *models.Persona, modelFamily models.ModelFamily, task string) (string, error) {
	logger := log.GetLogger()
	logger.Debugf("Generating optimized system prompt for persona %s and model family %s", persona.Name, modelFamily)
	promptCtx := &models.PersonaPromptContext{
		Persona:      persona,
		ModelFamily:  modelFamily,
		Reasoning:    persona.DefaultReasoning,
		Task:         task,
		Context:      "",
		Requirements: []string{"Be helpful and accurate", "Follow best practices", "Provide clear explanations"},
		Examples:     []string{},
	}

	optimizedPrompt, err := persona.GenerateOptimizedPrompt(promptCtx)
	if err != nil {
		logger.WithError(err).Error("Failed to generate optimized prompt")
		return "", fmt.Errorf("failed to generate optimized prompt: %w", err)
	}

	return optimizedPrompt, nil
}
