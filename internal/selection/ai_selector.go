package selection

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

type AISelector struct {
	registry *providers.Registry
	logger   *logrus.Logger
}

// NewAISelector creates a new AI selector
func NewAISelector(registry *providers.Registry) *AISelector {
	return &AISelector{
		registry: registry,
		logger:   log.GetLogger(),
	}
}

// SelectionCriteria defines the criteria for prompt selection
type SelectionCriteria struct {
	TaskDescription    string            `json:"task_description"`
	TargetAudience     string            `json:"target_audience,omitempty"`
	DesiredTone        string            `json:"desired_tone,omitempty"`
	MaxLength          int               `json:"max_length,omitempty"`
	Requirements       []string          `json:"requirements,omitempty"`
	Persona            string            `json:"persona,omitempty"` // code, writing, analysis, generic
	EvaluationModel    string            `json:"evaluation_model,omitempty"`
	EvaluationProvider string            `json:"evaluation_provider,omitempty"`
	Weights            EvaluationWeights `json:"weights,omitempty"`
}

// EvaluationWeights defines weights for different aspects
type EvaluationWeights struct {
	Clarity      float64 `json:"clarity"`      // Default: 0.25
	Completeness float64 `json:"completeness"` // Default: 0.25
	Specificity  float64 `json:"specificity"`  // Default: 0.20
	Creativity   float64 `json:"creativity"`   // Default: 0.15
	Conciseness  float64 `json:"conciseness"`  // Default: 0.15
}

// PromptScore represents the score for a prompt
type PromptScore struct {
	PromptID     uuid.UUID `json:"prompt_id"`
	Score        float64   `json:"score"`
	Clarity      float64   `json:"clarity"`
	Completeness float64   `json:"completeness"`
	Specificity  float64   `json:"specificity"`
	Creativity   float64   `json:"creativity"`
	Conciseness  float64   `json:"conciseness"`
	Reasoning    string    `json:"reasoning"`
	Confidence   float64   `json:"confidence"`
}

// SelectionResult represents the result of AI selection
type SelectionResult struct {
	SelectedPrompt *models.Prompt `json:"selected_prompt"`
	Scores         []PromptScore  `json:"scores"`
	Reasoning      string         `json:"reasoning"`
	Alternatives   []uuid.UUID    `json:"alternatives,omitempty"`
	Confidence     float64        `json:"confidence"`
	ProcessingTime int            `json:"processing_time_ms"`
}

// PromptEvaluation contains detailed evaluation of a single prompt
type PromptEvaluation struct {
	Prompt        *models.Prompt `json:"prompt"`
	Score         float64        `json:"score"`
	Reasoning     string         `json:"reasoning"`
	StrengthAreas []string       `json:"strength_areas"`
	WeaknessAreas []string       `json:"weakness_areas"`
	TaskAlignment float64        `json:"task_alignment"`
}

// Select chooses the best prompt from a list using AI evaluation
func (s *AISelector) Select(ctx context.Context, prompts []models.Prompt, criteria SelectionCriteria) (*SelectionResult, error) {
	s.logger.Info("Starting AI prompt selection")
	startTime := time.Now()

	// Normalize weights
	weights := normalizeWeights(criteria.Weights)

	// Get evaluation provider
	evalProvider, err := s.getEvaluationProvider(criteria)
	if err != nil {
		return nil, fmt.Errorf("failed to get evaluation provider: %w", err)
	}
	s.logger.Debugf("Using evaluation provider: %s", evalProvider.Name())

	// Build system prompt based on persona
	systemPrompt := buildSystemPrompt(criteria.Persona, criteria)

	// Prepare prompt content with all candidates
	promptContent := buildEvaluationPrompt(prompts, criteria)

	// Set timeout for evaluation
	evalCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// Generate evaluation
	resp, err := evalProvider.Generate(evalCtx, providers.GenerateRequest{
		Prompt:       promptContent,
		SystemPrompt: systemPrompt,
		Temperature:  0.3, // Low temperature for consistent evaluation
		MaxTokens:    2000,
	})
	if err != nil {
		return nil, fmt.Errorf("evaluation generation failed: %w", err)
	}

	// Parse response into scores (assume JSON response)
	scores, err := parseEvaluationResponse(resp.Content)
	if err != nil {
		return nil, fmt.Errorf("failed to parse evaluation: %w", err)
	}

	// Select best prompt
	selected, overallReasoning, confidence := selectBestPrompt(scores, prompts, weights)

	processingTime := int(time.Since(startTime).Milliseconds())

	return &SelectionResult{
		SelectedPrompt: selected,
		Scores:         scores,
		Reasoning:      overallReasoning,
		Alternatives:   getAlternatives(scores, selected.ID),
		Confidence:     confidence,
		ProcessingTime: processingTime,
	}, nil
}

// evaluatePrompt evaluates a single prompt against the criteria
func (s *AISelector) evaluatePrompt(ctx context.Context, prompt *models.Prompt, criteria SelectionCriteria) (*PromptEvaluation, error) {
	// Get evaluation provider
	evalProvider, err := s.getEvaluationProvider(criteria)
	if err != nil {
		return nil, fmt.Errorf("failed to get evaluation provider: %w", err)
	}

	// Create evaluation prompt for the AI judge
	evaluationPrompt := s.buildEvaluationPrompt(prompt, criteria)

	// Use the provider to get AI evaluation
	response, err := evalProvider.Generate(ctx, providers.GenerateRequest{
		Prompt:       evaluationPrompt,
		SystemPrompt: s.buildSystemPrompt(criteria),
		Temperature:  0.3, // Lower temperature for more consistent evaluation
		MaxTokens:    500,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to generate evaluation: %w", err)
	}

	// Parse the evaluation response
	evaluation, err := s.parseEvaluationResponse(response.Content, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to parse evaluation response: %w", err)
	}

	return evaluation, nil
}

// buildEvaluationPrompt creates the prompt for evaluating a specific prompt
func (s *AISelector) buildEvaluationPrompt(prompt *models.Prompt, criteria SelectionCriteria) string {
	return fmt.Sprintf(`Evaluate this prompt for the given task:

TASK CONTEXT:
- Description: %s
- Target Audience: %s
- Required Tone: %s
- Preferred Length: %s
- Specific Requirements: %v

PROMPT TO EVALUATE:
%s

EVALUATION CRITERIA (1-10 scale):
- Clarity (weight: %.2f): How clear and understandable is this prompt?
- Completeness (weight: %.2f): How comprehensive is this prompt?
- Specificity (weight: %.2f): How specific vs general is this prompt?
- Actionability (weight: %.2f): How actionable is this prompt?
- Creativity (weight: %.2f): How creative/novel is this prompt?
- Technical Depth (weight: %.2f): How technically sophisticated is this prompt?

Provide your evaluation in this exact format:
SCORE: [overall score 1-10]
TASK_ALIGNMENT: [how well it fits the task 1-10]
STRENGTHS: [list 2-3 key strengths]
WEAKNESSES: [list 1-2 key weaknesses]
REASONING: [2-3 sentences explaining the score]`,
		criteria.TaskDescription,
		criteria.TargetAudience,
		criteria.DesiredTone, // Changed from RequiredTone to DesiredTone
		criteria.MaxLength,
		criteria.Requirements,
		prompt.Content,
		criteria.Weights.Clarity,      // Changed from criteria.WeightFactors.Clarity to criteria.Weights.Clarity
		criteria.Weights.Completeness, // Changed from criteria.WeightFactors.Completeness to criteria.Weights.Completeness
		criteria.Weights.Specificity,  // Changed from criteria.WeightFactors.Specificity to criteria.Weights.Specificity
		criteria.Weights.Creativity,   // Changed from criteria.WeightFactors.Creativity to criteria.Weights.Creativity
		criteria.Weights.Conciseness,  // Changed from criteria.WeightFactors.Conciseness to criteria.Weights.Conciseness
	)
}

// buildSystemPrompt creates the system prompt for evaluation
func (s *AISelector) buildSystemPrompt(criteria SelectionCriteria) string {
	return fmt.Sprintf(`You are an expert prompt evaluator working with %s personas for %s model families. 

Your task is to evaluate prompts objectively based on how well they meet the specified criteria. Consider the context, requirements, and weighting factors provided.

Be thorough but concise in your evaluation. Focus on practical utility and effectiveness for the intended use case.`,
		criteria.Persona,         // Changed from criteria.PersonaType to criteria.Persona
		criteria.EvaluationModel, // Changed from criteria.ModelFamily to criteria.EvaluationModel
	)
}

// parseEvaluationResponse parses the AI's evaluation response
func (s *AISelector) parseEvaluationResponse(response string, prompt *models.Prompt) (*PromptEvaluation, error) {
	eval := &PromptEvaluation{
		Prompt: prompt,
	}

	// Extract score
	if score := extractFloat(response, "SCORE:"); score > 0 {
		eval.Score = score
	} else {
		eval.Score = 5.0 // Default middle score if parsing fails
	}

	// Extract task alignment
	if alignment := extractFloat(response, "TASK_ALIGNMENT:"); alignment > 0 {
		eval.TaskAlignment = alignment
	} else {
		eval.TaskAlignment = eval.Score // Fallback to overall score
	}

	// Extract strengths
	eval.StrengthAreas = extractList(response, "STRENGTHS:")

	// Extract weaknesses
	eval.WeaknessAreas = extractList(response, "WEAKNESSES:")

	// Extract reasoning
	eval.Reasoning = extractText(response, "REASONING:")

	return eval, nil
}

// generateSelectionReasoning creates an explanation for why this prompt was selected
func (s *AISelector) generateSelectionReasoning(selected PromptEvaluation, alternatives []PromptEvaluation, criteria SelectionCriteria) string {
	if len(alternatives) <= 1 {
		return fmt.Sprintf("Selected with confidence score %.2f. %s", selected.Score, selected.Reasoning)
	}

	secondBest := alternatives[1]
	scoreDiff := selected.Score - secondBest.Score

	reason := fmt.Sprintf("Selected prompt with score %.2f (%.2f points ahead of next best). %s",
		selected.Score, scoreDiff, selected.Reasoning)

	if len(selected.StrengthAreas) > 0 {
		reason += fmt.Sprintf(" Key strengths: %v.", selected.StrengthAreas)
	}

	return reason
}

// Helper functions for parsing evaluation responses
func extractFloat(text, prefix string) float64 {
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), prefix) {
			valueStr := strings.TrimSpace(strings.TrimPrefix(line, prefix))
			if value, err := strconv.ParseFloat(valueStr, 64); err == nil {
				return value
			}
		}
	}
	return 0
}

func extractList(text, prefix string) []string {
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), prefix) {
			valueStr := strings.TrimSpace(strings.TrimPrefix(line, prefix))
			// Split by common delimiters and clean up
			items := strings.FieldsFunc(valueStr, func(r rune) bool {
				return r == ',' || r == ';' || r == '|'
			})
			result := make([]string, 0, len(items))
			for _, item := range items {
				if cleaned := strings.TrimSpace(item); cleaned != "" {
					result = append(result, cleaned)
				}
			}
			return result
		}
	}
	return []string{}
}

func extractText(text, prefix string) string {
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), prefix) {
			return strings.TrimSpace(strings.TrimPrefix(line, prefix))
		}
	}
	return ""
}

// DefaultWeightFactors returns balanced weight factors for general use
func DefaultWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Clarity:      0.25,
		Completeness: 0.25,
		Specificity:  0.20,
		Creativity:   0.15,
		Conciseness:  0.15,
	}
}

// CodeWeightFactors returns weight factors optimized for code generation tasks
func CodeWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Clarity:      0.25,
		Completeness: 0.25,
		Specificity:  0.20,
		Creativity:   0.15,
		Conciseness:  0.15,
	}
}

// WritingWeightFactors returns weight factors optimized for writing tasks
func WritingWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Clarity:      0.25,
		Completeness: 0.25,
		Specificity:  0.20,
		Creativity:   0.15,
		Conciseness:  0.15,
	}
}

// Helper functions
func normalizeWeights(w EvaluationWeights) EvaluationWeights {
	total := w.Clarity + w.Completeness + w.Specificity + w.Creativity + w.Conciseness
	if total == 0 {
		return EvaluationWeights{Clarity: 0.25, Completeness: 0.25, Specificity: 0.2, Creativity: 0.15, Conciseness: 0.15}
	}
	if total != 1 {
		w.Clarity /= total
		w.Completeness /= total
		w.Specificity /= total
		w.Creativity /= total
		w.Conciseness /= total
	}
	return w
}

func (s *AISelector) getEvaluationProvider(criteria SelectionCriteria) (providers.Provider, error) {
	if criteria.EvaluationProvider != "" {
		prov, err := s.registry.Get(criteria.EvaluationProvider)
		if err == nil && prov.IsAvailable() {
			return prov, nil
		}
	}
	// Fallback to default (e.g., OpenAI)
	return s.registry.Get("openai")
}

func buildSystemPrompt(persona string, criteria SelectionCriteria) string {
	base := "You are an expert prompt evaluator. Evaluate each prompt based on the criteria and provide scores and reasoning."
	switch persona {
	case "code":
		return base + " Focus on technical accuracy, code efficiency, and best practices."
	case "writing":
		return base + " Focus on narrative flow, engagement, and stylistic elements."
	case "analysis":
		return base + " Focus on logical structure, depth of insight, and analytical rigor."
	default:
		return base + " Use general evaluation criteria."
	}
}

func buildEvaluationPrompt(prompts []models.Prompt, criteria SelectionCriteria) string {
	var sb strings.Builder
	sb.WriteString("Evaluate these prompts for the task: " + criteria.TaskDescription + "\n")
	if criteria.TargetAudience != "" {
		sb.WriteString("Target audience: " + criteria.TargetAudience + "\n")
	}
	// Add more criteria...
	sb.WriteString("\nPrompts:\n")
	for i, p := range prompts {
		sb.WriteString(fmt.Sprintf("Prompt %d: %s\n", i+1, p.Content))
	}
	sb.WriteString("\nProvide JSON response with scores for each prompt.")
	return sb.String()
}

func parseEvaluationResponse(response string) ([]PromptScore, error) {
	var scores []PromptScore
	if err := json.Unmarshal([]byte(response), &scores); err != nil {
		return nil, err
	}
	return scores, nil
}

func selectBestPrompt(scores []PromptScore, prompts []models.Prompt, weights EvaluationWeights) (*models.Prompt, string, float64) {
	if len(scores) == 0 {
		return nil, "No scores available", 0
	}
	// Calculate weighted scores
	for i := range scores {
		scores[i].Score = scores[i].Clarity*weights.Clarity + scores[i].Completeness*weights.Completeness + scores[i].Specificity*weights.Specificity + scores[i].Creativity*weights.Creativity + scores[i].Conciseness*weights.Conciseness
	}
	// Sort by score desc
	sort.Slice(scores, func(i, j int) bool { return scores[i].Score > scores[j].Score })
	best := scores[0]
	var selected *models.Prompt
	for _, p := range prompts {
		if p.ID == best.PromptID {
			selected = &p
			break
		}
	}
	reasoning := fmt.Sprintf("Selected prompt %s with score %.2f: %s", best.PromptID, best.Score, best.Reasoning)
	return selected, reasoning, best.Confidence
}

func getAlternatives(scores []PromptScore, selectedID uuid.UUID) []uuid.UUID {
	alts := make([]uuid.UUID, 0, len(scores)-1)
	for _, s := range scores {
		if s.PromptID != selectedID {
			alts = append(alts, s.PromptID)
		}
	}
	return alts
}

// ... complete the helpers as needed ...
