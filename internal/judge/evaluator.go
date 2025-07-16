package judge

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/sirupsen/logrus"
)

// EvaluationCriteria defines what aspects to evaluate
type EvaluationCriteria struct {
	FactualAccuracy  bool    `json:"factual_accuracy"`
	Helpfulness      bool    `json:"helpfulness"`
	Conciseness      bool    `json:"conciseness"`
	CodeQuality      bool    `json:"code_quality"`
	AdherenceToStyle bool    `json:"adherence_to_style"`
	Weight           float64 `json:"weight"`
}

// EvaluationResult contains the detailed evaluation of a prompt/response
type EvaluationResult struct {
	OverallScore       float64            `json:"overall_score"`
	CriteriaScores     map[string]float64 `json:"criteria_scores"`
	Reasoning          string             `json:"reasoning"`
	Improvements       []string           `json:"improvements"`
	BiasDetected       []string           `json:"bias_detected"`
	ModelFamily        models.ModelFamily `json:"model_family"`
	EvaluationTime     time.Time          `json:"evaluation_time"`
	ProcessingDuration time.Duration      `json:"processing_duration"`
}

// PromptEvaluationRequest contains all information needed for evaluation
type PromptEvaluationRequest struct {
	OriginalPrompt     string                        `json:"original_prompt"`
	GeneratedResponse  string                        `json:"generated_response"`
	ReferenceAnswer    string                        `json:"reference_answer,omitempty"`
	Criteria           map[string]EvaluationCriteria `json:"criteria"`
	ModelFamily        models.ModelFamily            `json:"model_family"`
	PersonaType        models.PersonaType            `json:"persona_type"`
	EvaluationProvider string                        `json:"evaluation_provider"`
}

// LLMJudge implements the LLM-as-a-Judge evaluation system
type LLMJudge struct {
	provider   providers.Provider
	modelName  string
	biasChecks map[string]BiasCheck
}

// BiasCheck defines a specific bias detection strategy
type BiasCheck struct {
	Name        string
	Description string
	Detector    func(request *PromptEvaluationRequest, result *EvaluationResult) bool
}

// NewLLMJudge creates a new LLM judge evaluator
func NewLLMJudge(provider providers.Provider, modelName string) *LLMJudge {
	judge := &LLMJudge{
		provider:   provider,
		modelName:  modelName,
		biasChecks: make(map[string]BiasCheck),
	}

	// Initialize bias checks
	judge.initializeBiasChecks()

	return judge
}

// EvaluatePrompt performs comprehensive evaluation of a prompt and response
func (j *LLMJudge) EvaluatePrompt(ctx context.Context, request *PromptEvaluationRequest) (*EvaluationResult, error) {
	logger := log.GetLogger()
	logger.Info("Starting prompt evaluation")
	startTime := time.Now()

	// Generate evaluation prompt based on model family
	logger.Debugf("Building evaluation prompt for model family: %s", request.ModelFamily)
	evaluationPrompt := j.buildEvaluationPrompt(request)

	// Get evaluation from LLM
	logger.Debug("Getting evaluation from LLM")
	response, err := j.provider.Generate(ctx, providers.GenerateRequest{
		Prompt:      evaluationPrompt,
		Temperature: 0.0, // Use deterministic evaluation
		MaxTokens:   2000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get evaluation from LLM: %w", err)
	}

	// Parse evaluation response
	logger.Debug("Parsing evaluation response")
	result, err := j.parseEvaluationResponse(response.Content, request)
	if err != nil {
		logger.WithError(err).Error("Failed to parse evaluation response")
		return nil, fmt.Errorf("failed to parse evaluation response: %w", err)
	}

	// Run bias detection
	logger.Debug("Running bias detection")
	j.detectBiases(request, result)

	result.ModelFamily = request.ModelFamily
	result.EvaluationTime = startTime
	result.ProcessingDuration = time.Since(startTime)

	logger.WithFields(logrus.Fields{
		"overall_score": result.OverallScore,
		"duration_ms":   result.ProcessingDuration.Milliseconds(),
	}).Info("Prompt evaluation completed")
	return result, nil
}

// buildEvaluationPrompt creates model-specific evaluation prompts
func (j *LLMJudge) buildEvaluationPrompt(request *PromptEvaluationRequest) string {
	criteriaList := j.buildCriteriaDescription(request.Criteria)

	switch request.ModelFamily {
	case models.ModelFamilyClaude:
		return j.buildClaudeEvaluationPrompt(request, criteriaList)
	case models.ModelFamilyGPT:
		return j.buildGPTEvaluationPrompt(request, criteriaList)
	case models.ModelFamilyGemini:
		return j.buildGeminiEvaluationPrompt(request, criteriaList)
	default:
		return j.buildGenericEvaluationPrompt(request, criteriaList)
	}
}

// buildClaudeEvaluationPrompt creates Claude-optimized evaluation prompt
func (j *LLMJudge) buildClaudeEvaluationPrompt(request *PromptEvaluationRequest, criteria string) string {
	personaContext := fmt.Sprintf("persona: %s", request.PersonaType)
	referenceSection := ""
	if request.ReferenceAnswer != "" {
		referenceSection = fmt.Sprintf("\n<reference_answer>\n%s\n</reference_answer>", request.ReferenceAnswer)
	}

	template := `<instructions>
You are an expert evaluator specializing in ` + personaContext + `. Your task is to evaluate the quality of an AI-generated response based on specific criteria.

CRITICAL: Be objective and avoid verbosity bias. Concise, accurate responses are better than verbose ones.

<evaluation_criteria>
` + criteria + `
</evaluation_criteria>

Follow this evaluation process:
1. Analyze the response systematically
2. Score each criterion (1-10 scale)
3. Provide specific improvement suggestions
4. Give an overall assessment

IMPORTANT: Your response must be ONLY valid JSON with no additional text before or after.
</instructions>

<original_prompt>
` + request.OriginalPrompt + `
</original_prompt>

<generated_response>
` + request.GeneratedResponse + `
</generated_response>
` + referenceSection + `

Provide your evaluation as a single JSON object with this exact structure:
{
  "overall_score": 7.5,
  "criteria_scores": {
    "factual_accuracy": 8.0,
    "helpfulness": 7.0,
    "code_quality": 8.0,
    "conciseness": 7.0
  },
  "reasoning": "The response correctly addresses the user's request...",
  "improvements": ["Be more specific about...", "Include examples of..."],
  "bias_notes": []
}`

	return template
}

// buildGPTEvaluationPrompt creates GPT-optimized evaluation prompt
func (j *LLMJudge) buildGPTEvaluationPrompt(request *PromptEvaluationRequest, criteria string) string {
	personaContext := fmt.Sprintf("persona: %s", request.PersonaType)
	referenceSection := ""
	if request.ReferenceAnswer != "" {
		referenceSection = fmt.Sprintf("\n## Reference Answer\n```\n%s\n```", request.ReferenceAnswer)
	}

	return fmt.Sprintf(`You are an expert evaluator for %s responses. Evaluate the AI-generated response objectively.

## Evaluation Criteria
%s

## Original Prompt
%s

## Generated Response
%s
%s

## Instructions
1. Analyze each criterion systematically
2. Score each criterion from 1-10
3. Calculate an overall score
4. Provide specific improvements

CRITICAL: Respond with ONLY a JSON object, no additional text or markdown.

Example format:
{
  "overall_score": 7.5,
  "criteria_scores": {
    "factual_accuracy": 8.0,
    "helpfulness": 7.0,
    "code_quality": 8.0,
    "conciseness": 7.0
  },
  "reasoning": "The response addresses the main requirements...",
  "improvements": ["Add more specific examples", "Improve error handling"],
  "bias_notes": []
}`, personaContext, criteria, request.OriginalPrompt, request.GeneratedResponse, referenceSection)
}

// buildGeminiEvaluationPrompt creates Gemini-optimized evaluation prompt
func (j *LLMJudge) buildGeminiEvaluationPrompt(request *PromptEvaluationRequest, criteria string) string {
	personaContext := string(request.PersonaType)
	referenceSection := ""
	if request.ReferenceAnswer != "" {
		referenceSection = fmt.Sprintf("\n\nFor reference, here's an ideal answer:\n\"%s\"", request.ReferenceAnswer)
	}

	return fmt.Sprintf("I need your help evaluating an AI-generated response for %s tasks. As an expert evaluator, please assess the quality objectively.\n\nHere's why this evaluation matters: I want to improve prompt quality and ensure the AI provides valuable, accurate responses. Please evaluate as if you're an expert in %s.\n\nEvaluation criteria to consider:\n%s\n\nThe original prompt was:\n\"%s\"\n\nThe AI generated this response:\n\"%s\"\n\n%s\n\nPlease evaluate this response by:\n1. Explaining your reasoning for each criterion\n2. Providing specific scores (1-10 scale)\n3. Suggesting concrete improvements\n4. Noting any evaluation biases you detect\n\nPlease format your response as valid JSON:\n{\n  \"overall_score\": 0.0,\n  \"criteria_scores\": {\"criterion_name\": 0.0},\n  \"reasoning\": \"Your detailed reasoning\",\n  \"improvements\": [\"Specific suggestions\"],\n  \"bias_notes\": [\"Any biases detected\"]\n}", personaContext, personaContext, criteria, request.OriginalPrompt, request.GeneratedResponse, referenceSection)
}

// buildGenericEvaluationPrompt creates a fallback evaluation prompt
func (j *LLMJudge) buildGenericEvaluationPrompt(request *PromptEvaluationRequest, criteria string) string {
	personaContext := string(request.PersonaType)
	referenceSection := ""
	if request.ReferenceAnswer != "" {
		referenceSection = fmt.Sprintf("\nReference Answer: %s", request.ReferenceAnswer)
	}

	return fmt.Sprintf("Evaluate the following AI-generated response for %s tasks.\n\nCriteria:\n%s\n\nOriginal Prompt: %s\n\nGenerated Response: %s\n\n%s\n\nProvide evaluation in JSON format:\n{\n  \"overall_score\": 0.0,\n  \"criteria_scores\": {\"criterion_name\": 0.0},\n  \"reasoning\": \"Your reasoning\",\n  \"improvements\": [\"Suggestions\"],\n  \"bias_notes\": [\"Bias concerns\"]\n}", personaContext, criteria, request.OriginalPrompt, request.GeneratedResponse, referenceSection)
}

// buildCriteriaDescription formats evaluation criteria for prompts
func (j *LLMJudge) buildCriteriaDescription(criteria map[string]EvaluationCriteria) string {
	var parts []string

	for name, criterion := range criteria {
		description := fmt.Sprintf("- **%s** (weight: %.2f)", name, criterion.Weight)
		if criterion.FactualAccuracy {
			description += " - Check factual correctness"
		}
		if criterion.Helpfulness {
			description += " - Assess practical usefulness"
		}
		if criterion.CodeQuality {
			description += " - Evaluate code structure and efficiency"
		}
		if criterion.Conciseness {
			description += " - Prefer concise over verbose responses"
		}
		parts = append(parts, description)
	}

	return strings.Join(parts, "\n")
}

// parseEvaluationResponse extracts structured evaluation from LLM response
func (j *LLMJudge) parseEvaluationResponse(response string, request *PromptEvaluationRequest) (*EvaluationResult, error) {
	logger := log.GetLogger()
	logger.Debug("Parsing evaluation response")

	// First, try to parse the response as-is (in case it's pure JSON)
	if result, err := j.tryParseJSON(response); err == nil {
		logger.Debug("Successfully parsed response as pure JSON")
		return result, nil
	}

	// Strategy 1: Look for JSON between code blocks
	logger.Debug("Trying to parse JSON from code blocks")
	if strings.Contains(response, "```json") {
		start := strings.Index(response, "```json") + 7
		end := strings.Index(response[start:], "```")
		if end != -1 {
			jsonStr := strings.TrimSpace(response[start : start+end])
			if result, err := j.tryParseJSON(jsonStr); err == nil {
				return result, nil
			}
		}
	}

	// Strategy 2: Look for JSON in any code block
	if strings.Contains(response, "```") {
		parts := strings.Split(response, "```")
		for i := 1; i < len(parts); i += 2 {
			jsonStr := strings.TrimSpace(parts[i])
			// Remove language identifier if present
			if idx := strings.Index(jsonStr, "\n"); idx > 0 && idx < 20 {
				jsonStr = strings.TrimSpace(jsonStr[idx+1:])
			}
			if result, err := j.tryParseJSON(jsonStr); err == nil {
				return result, nil
			}
		}
	}

	// Strategy 3: Look for JSON between <answer> tags (Claude style)
	logger.Debug("Trying to parse JSON from <answer> tags")
	if strings.Contains(response, "<answer>") && strings.Contains(response, "</answer>") {
		start := strings.Index(response, "<answer>") + 8
		end := strings.Index(response[start:], "</answer>")
		if end != -1 {
			jsonStr := strings.TrimSpace(response[start : start+end])
			if result, err := j.tryParseJSON(jsonStr); err == nil {
				return result, nil
			}
		}
	}

	// Strategy 4: Extract JSON between first { and last }
	logger.Debug("Trying to parse JSON between curly braces")
	jsonStart := strings.Index(response, "{")
	jsonEnd := strings.LastIndex(response, "}") + 1

	if jsonStart != -1 && jsonEnd > jsonStart {
		jsonStr := strings.TrimSpace(response[jsonStart:jsonEnd])
		if result, err := j.tryParseJSON(jsonStr); err == nil {
			return result, nil
		}
	}

	// Strategy 5: Try to find and clean JSON with common LLM formatting issues
	logger.Debug("Trying to parse cleaned JSON")
	cleanedResponse := j.cleanLLMResponse(response)
	if result, err := j.tryParseJSON(cleanedResponse); err == nil {
		return result, nil
	}

	// Strategy 6: Fallback - create a default evaluation with extracted info
	logger.Warn("All JSON parsing strategies failed, creating fallback evaluation")
	return j.createFallbackEvaluation(response, request)
}

// tryParseJSON attempts to parse JSON with validation
func (j *LLMJudge) tryParseJSON(jsonStr string) (*EvaluationResult, error) {
	logger := log.GetLogger()

	// Log first 200 chars of JSON for debugging
	logStr := jsonStr
	if len(logStr) > 200 {
		logStr = logStr[:200] + "..."
	}
	logger.Debugf("Attempting to parse JSON: %s", logStr)

	var result EvaluationResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		logger.Debugf("JSON parse error: %v", err)
		return nil, err
	}

	// Validate and normalize scores
	if result.OverallScore < 0 || result.OverallScore > 10 {
		result.OverallScore = normalizeScore(result.OverallScore)
	}

	// Ensure criteria_scores exists
	if result.CriteriaScores == nil {
		result.CriteriaScores = make(map[string]float64)
	}

	// Validate criteria scores
	for criterion, score := range result.CriteriaScores {
		if score < 0 || score > 10 {
			result.CriteriaScores[criterion] = normalizeScore(score)
		}
	}

	// Ensure required fields have reasonable defaults
	if result.Reasoning == "" {
		result.Reasoning = "Evaluation completed"
	}
	if result.Improvements == nil {
		result.Improvements = []string{}
	}

	logger.Debugf("Successfully parsed JSON with overall_score: %.1f", result.OverallScore)
	return &result, nil
}

// cleanLLMResponse removes common LLM formatting issues
func (j *LLMJudge) cleanLLMResponse(response string) string {
	// Remove common prefixes and suffixes
	prefixes := []string{
		"Here's the evaluation:",
		"Here is the evaluation:",
		"```json",
		"```",
		"Based on the criteria:",
		"Evaluation:",
	}

	suffixes := []string{
		"```",
		"This evaluation considers all the specified criteria.",
		"I hope this evaluation is helpful.",
	}

	cleaned := strings.TrimSpace(response)

	// Remove prefixes
	for _, prefix := range prefixes {
		if strings.HasPrefix(strings.ToLower(cleaned), strings.ToLower(prefix)) {
			cleaned = strings.TrimSpace(cleaned[len(prefix):])
		}
	}

	// Remove suffixes
	for _, suffix := range suffixes {
		if strings.HasSuffix(strings.ToLower(cleaned), strings.ToLower(suffix)) {
			cleaned = strings.TrimSpace(cleaned[:len(cleaned)-len(suffix)])
		}
	}

	// Try to extract just the JSON part
	if start := strings.Index(cleaned, "{"); start != -1 {
		if end := strings.LastIndex(cleaned, "}"); end != -1 && end > start {
			cleaned = cleaned[start : end+1]
		}
	}

	return cleaned
}

// createFallbackEvaluation creates a basic evaluation when JSON parsing fails
func (j *LLMJudge) createFallbackEvaluation(response string, request *PromptEvaluationRequest) (*EvaluationResult, error) {
	// Extract numerical scores if possible
	score := j.extractNumericScore(response)

	// Create basic evaluation
	result := &EvaluationResult{
		OverallScore:   score,
		CriteriaScores: make(map[string]float64),
		Reasoning:      fmt.Sprintf("Fallback evaluation - original response: %s", response),
		Improvements:   []string{"Improve response format", "Ensure JSON compliance"},
		BiasDetected:   []string{},
	}

	// Set default criteria scores
	criteriaNames := []string{"factual_accuracy", "helpfulness", "code_quality", "conciseness"}
	for _, name := range criteriaNames {
		result.CriteriaScores[name] = score
	}

	return result, nil
}

// extractNumericScore tries to find a reasonable score in the text
func (j *LLMJudge) extractNumericScore(text string) float64 {
	// Look for patterns like "score: 7", "7/10", "7.5", etc.
	scorePatterns := []string{
		`score:\s*(\d+\.?\d*)`,
		`(\d+)/10`,
		`(\d+\.?\d*)\s*/\s*10`,
		`overall:\s*(\d+\.?\d*)`,
		`(\d+\.?\d*)\s*out\s*of\s*10`,
	}

	for _, pattern := range scorePatterns {
		if matches := regexp.MustCompile(`(?i)` + pattern).FindStringSubmatch(text); len(matches) > 1 {
			if score, err := strconv.ParseFloat(matches[1], 64); err == nil {
				return normalizeScore(score)
			}
		}
	}

	// Default score if nothing found
	return 6.0
}

// initializeBiasChecks sets up bias detection mechanisms
func (j *LLMJudge) initializeBiasChecks() {
	j.biasChecks["verbosity"] = BiasCheck{
		Name:        "Verbosity Bias",
		Description: "Tendency to prefer longer responses over concise ones",
		Detector: func(request *PromptEvaluationRequest, result *EvaluationResult) bool {
			responseLength := len(strings.Fields(request.GeneratedResponse))
			if responseLength > 500 && result.OverallScore > 8.0 {
				return true // Potentially biased toward verbose response
			}
			return false
		},
	}

	j.biasChecks["position"] = BiasCheck{
		Name:        "Position Bias",
		Description: "Tendency to prefer first option in comparisons",
		Detector: func(request *PromptEvaluationRequest, result *EvaluationResult) bool {
			// This would be used in pairwise comparisons
			return false
		},
	}

	j.biasChecks["fine_grained"] = BiasCheck{
		Name:        "Fine-Grained Scoring Bias",
		Description: "Arbitrary precision in detailed scoring scales",
		Detector: func(request *PromptEvaluationRequest, result *EvaluationResult) bool {
			// Check if scores are suspiciously precise (e.g., 7.37)
			for _, score := range result.CriteriaScores {
				if score != float64(int(score)) && score != float64(int(score))+0.5 {
					return true
				}
			}
			return false
		},
	}
}

// detectBiases runs bias detection checks on evaluation results
func (j *LLMJudge) detectBiases(request *PromptEvaluationRequest, result *EvaluationResult) {
	var detectedBiases []string

	for _, check := range j.biasChecks {
		if check.Detector(request, result) {
			detectedBiases = append(detectedBiases, check.Name)
		}
	}

	result.BiasDetected = detectedBiases
}

// normalizeScore ensures scores are in 0-10 range
func normalizeScore(score float64) float64 {
	if score < 0 {
		return 0
	}
	if score > 10 {
		return 10
	}
	return score
}

// GetDefaultCodeCriteria returns standard evaluation criteria for code generation
func GetDefaultCodeCriteria() map[string]EvaluationCriteria {
	return map[string]EvaluationCriteria{
		"factual_accuracy": {
			FactualAccuracy: true,
			Weight:          0.3,
		},
		"code_quality": {
			CodeQuality: true,
			Weight:      0.3,
		},
		"helpfulness": {
			Helpfulness: true,
			Weight:      0.2,
		},
		"conciseness": {
			Conciseness: true,
			Weight:      0.2,
		},
	}
}
