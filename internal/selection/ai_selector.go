package selection

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/templates"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

// AISelector uses an LLM to select the best prompt
type AISelector struct {
	registry *providers.Registry
}

// NewAISelector creates a new AI selector
func NewAISelector(registry *providers.Registry) *AISelector {
	return &AISelector{registry: registry}
}

// SelectionCriteria defines the criteria for AI-powered selection
type SelectionCriteria struct {
	TaskDescription    string
	TargetAudience     string
	DesiredTone        string
	MaxLength          int
	Requirements       []string
	Persona            string
	EvaluationModel    string
	EvaluationProvider string
	Weights            EvaluationWeights
}

// EvaluationWeights defines weights for different evaluation factors
type EvaluationWeights struct {
	Relevance    float64
	Clarity      float64
	Completeness float64
	Conciseness  float64
	Toxicity     float64
}

// PromptEvaluation contains the evaluation result for a single prompt
type PromptEvaluation struct {
	Prompt    *models.Prompt
	Score     float64
	Reasoning string
}

// AISelectionResult contains the result of an AI selection process
type AISelectionResult struct {
	SelectedPrompt *models.Prompt
	Reasoning      string
	Confidence     float64
	Scores         []EvaluationScore
	ProcessingTime int64
}

// EvaluationScore holds the detailed scores for a prompt
type EvaluationScore struct {
	PromptID     uuid.UUID          `json:"promptId"`
	Score        float64            `json:"score"`
	Reasoning    string             `json:"reasoning"`
	SubScores    map[string]float64 `json:"sub_scores,omitempty"`
	Confidence   float64            `json:"confidence"`
	ErrorMessage string             `json:"error_message,omitempty"`
}

// Select uses an LLM to select the best prompt from a list
func (s *AISelector) Select(ctx context.Context, prompts []models.Prompt, criteria SelectionCriteria) (*AISelectionResult, error) {
	startTime := time.Now()
	logger := log.GetLogger()
	logger.WithField("prompt_count", len(prompts)).Info("Starting AI-powered prompt selection")

	if len(prompts) == 0 {
		return nil, fmt.Errorf("no prompts provided for selection")
	}

	provider, err := s.registry.Get(criteria.EvaluationProvider)
	if err != nil {
		return nil, fmt.Errorf("failed to get evaluation provider: %w", err)
	}

	systemPrompt, err := s.buildSelectionPrompt(criteria)
	if err != nil {
		return nil, fmt.Errorf("failed to build selection prompt: %w", err)
	}

	userPrompt := s.formatPromptsForEvaluation(prompts)

	req := providers.GenerateRequest{
		SystemPrompt: systemPrompt,
		Prompt:       userPrompt,
		MaxTokens:    2048, // Allow for larger JSON output
		Temperature:  0.2,  // Low temperature for deterministic scoring
	}

	resp, err := provider.Generate(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("AI selection generation failed: %w", err)
	}

	var scores []EvaluationScore
	if err := json.Unmarshal([]byte(resp.Content), &scores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal evaluation scores: %w", err)
	}

	if len(scores) == 0 {
		return nil, fmt.Errorf("AI selection returned no scores")
	}

	// Find the best prompt based on the highest score
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	bestScore := scores[0]
	var selectedPrompt *models.Prompt
	for i := range prompts {
		if prompts[i].ID == bestScore.PromptID {
			selectedPrompt = &prompts[i]
			break
		}
	}

	if selectedPrompt == nil {
		return nil, fmt.Errorf("could not find prompt with ID: %s", bestScore.PromptID)
	}

	processingTime := time.Since(startTime).Milliseconds()

	return &AISelectionResult{
		SelectedPrompt: selectedPrompt,
		Reasoning:      bestScore.Reasoning,
		Confidence:     bestScore.Confidence,
		Scores:         scores,
		ProcessingTime: processingTime,
	}, nil
}

func (s *AISelector) buildSelectionPrompt(criteria SelectionCriteria) (string, error) {
	tmpl, err := templates.DefaultLoader.LoadPersonaSystemPrompt("analysis")
	if err != nil {
		return "", fmt.Errorf("failed to load analysis persona template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, criteria); err != nil {
		return "", fmt.Errorf("failed to execute judge persona template: %w", err)
	}

	return buf.String(), nil
}

func (s *AISelector) formatPromptsForEvaluation(prompts []models.Prompt) string {
	var sb strings.Builder
	sb.WriteString("Please evaluate the following prompts:\n\n")
	for _, p := range prompts {
		sb.WriteString(fmt.Sprintf("---\nPrompt ID: %s\n%s\n", p.ID, p.Content))
	}
	return sb.String()
}

// DefaultWeightFactors returns default evaluation weights
func DefaultWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Relevance:    0.3,
		Clarity:      0.3,
		Completeness: 0.2,
		Conciseness:  0.1,
		Toxicity:     0.1,
	}
}

// CodeWeightFactors returns weights optimized for code generation
func CodeWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Relevance:    0.4,
		Clarity:      0.2,
		Completeness: 0.2,
		Conciseness:  0.1,
		Toxicity:     0.1,
	}
}

// WritingWeightFactors returns weights optimized for writing tasks
func WritingWeightFactors() EvaluationWeights {
	return EvaluationWeights{
		Relevance:    0.3,
		Clarity:      0.4,
		Completeness: 0.1,
		Conciseness:  0.1,
		Toxicity:     0.1,
	}
}
