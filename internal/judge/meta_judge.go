package judge

import (
	"context"
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

// MetaJudge selects the best prompt from multiple candidates
type MetaJudge struct {
	provider providers.Provider
}

// NewMetaJudge creates a new meta judge instance
func NewMetaJudge(provider providers.Provider) *MetaJudge {
	return &MetaJudge{
		provider: provider,
	}
}

// CandidatePrompt represents a prompt candidate for selection
type CandidatePrompt struct {
	ID              string
	Prompt          string
	Phase           string
	Provider        string
	JudgeScore      float64
	HistoricalScore float64
	SemanticMatch   float64
	Source          string // "generated", "optimized", "historical"
	Reasoning       string // Why this was generated/selected
	CycleNumber     int    // Which generation cycle produced this
}

// SelectionRequest contains all candidates and selection criteria
type SelectionRequest struct {
	UserInput      string
	Candidates     []CandidatePrompt
	SelectionCount int // For now always 1, but keep for future flexibility
	UserIntent     string
	TaskContext    string
}

// SelectionResult contains the selected prompt(s) with reasoning
type SelectionResult struct {
	Selected   []CandidatePrompt
	Reasoning  string
	Confidence float64
}

// SelectBest selects the best prompt(s) from candidates
func (m *MetaJudge) SelectBest(ctx context.Context, request *SelectionRequest) (*SelectionResult, error) {
	logger := log.GetLogger().WithFields(map[string]interface{}{
		"candidate_count": len(request.Candidates),
		"user_intent":     request.UserIntent,
	})
	logger.Info("Meta-Judge: Starting prompt selection")

	// Build the selection prompt
	selectionPrompt := m.buildSelectionPrompt(request)
	logger.WithField("prompt_length", len(selectionPrompt)).Debug("Built selection prompt")

	// Call the AI provider
	req := providers.GenerateRequest{
		Prompt:       selectionPrompt,
		Temperature:  0.3, // Lower temperature for more consistent selection
		MaxTokens:    2000,
		SystemPrompt: "You are an expert prompt engineering judge tasked with selecting the single best prompt from multiple candidates.",
	}

	response, err := m.provider.Generate(ctx, req)
	if err != nil {
		logger.WithError(err).Error("Meta-Judge: Failed to generate selection")
		return nil, fmt.Errorf("failed to generate selection: %w", err)
	}

	// Parse the selection response
	result := m.parseSelectionResponse(response.Content, request.Candidates)

	logger.WithFields(map[string]interface{}{
		"selected_id": result.Selected[0].ID,
		"confidence":  result.Confidence,
	}).Info("Meta-Judge: Prompt selection complete")

	return result, nil
}

func (m *MetaJudge) buildSelectionPrompt(request *SelectionRequest) string {
	var sb strings.Builder

	sb.WriteString("# Prompt Selection Task\n\n")
	sb.WriteString(fmt.Sprintf("User Request: %s\n", request.UserInput))
	sb.WriteString(fmt.Sprintf("Task Context: %s\n", request.TaskContext))
	sb.WriteString(fmt.Sprintf("User Intent: %s\n\n", request.UserIntent))

	sb.WriteString("## Candidates\n\n")
	for i, candidate := range request.Candidates {
		sb.WriteString(fmt.Sprintf("### Candidate %d (ID: %s)\n", i+1, candidate.ID))
		sb.WriteString(fmt.Sprintf("- Source: %s (Cycle %d, Phase: %s)\n",
			candidate.Source, candidate.CycleNumber, candidate.Phase))
		sb.WriteString(fmt.Sprintf("- Provider: %s\n", candidate.Provider))
		sb.WriteString(fmt.Sprintf("- Judge Score: %.2f\n", candidate.JudgeScore))
		sb.WriteString(fmt.Sprintf("- Historical Score: %.2f\n", candidate.HistoricalScore))
		sb.WriteString(fmt.Sprintf("- Semantic Match: %.2f\n", candidate.SemanticMatch))
		sb.WriteString(fmt.Sprintf("- Generation Reasoning: %s\n", candidate.Reasoning))
		sb.WriteString(fmt.Sprintf("\nPrompt:\n```\n%s\n```\n\n", candidate.Prompt))
	}

	sb.WriteString("## Selection Criteria\n\n")
	sb.WriteString("Select THE ONE BEST prompt based on:\n")
	sb.WriteString("1. Overall quality and effectiveness for the user's request\n")
	sb.WriteString("2. Clarity and actionability of instructions\n")
	sb.WriteString("3. Balance between sophistication and usability\n")
	sb.WriteString("4. Fitness for the specific task context\n")
	sb.WriteString("5. Judge scores and historical performance\n\n")

	sb.WriteString("## Required Output Format\n\n")
	sb.WriteString("SELECTED_ID: [exact ID of chosen prompt]\n")
	sb.WriteString("CONFIDENCE: [0.0-1.0 score]\n")
	sb.WriteString("REASONING:\n")
	sb.WriteString("[Detailed explanation of why this prompt was selected over others]\n")

	return sb.String()
}

func (m *MetaJudge) parseSelectionResponse(response string, candidates []CandidatePrompt) *SelectionResult {
	result := &SelectionResult{
		Selected:   make([]CandidatePrompt, 0, 1),
		Confidence: 0.85, // Default confidence
	}

	lines := strings.Split(response, "\n")
	var selectedID string
	var collectingReasoning bool
	var reasoningLines []string

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "SELECTED_ID:") {
			selectedID = strings.TrimSpace(strings.TrimPrefix(line, "SELECTED_ID:"))
		} else if strings.HasPrefix(line, "CONFIDENCE:") {
			confStr := strings.TrimSpace(strings.TrimPrefix(line, "CONFIDENCE:"))
			// Handle potential parsing errors gracefully
			var conf float64
			_, _ = fmt.Sscanf(confStr, "%f", &conf)
			if conf > 0 && conf <= 1.0 {
				result.Confidence = conf
			}
		} else if strings.HasPrefix(line, "REASONING:") {
			collectingReasoning = true
		} else if collectingReasoning && line != "" {
			reasoningLines = append(reasoningLines, line)
		}
	}

	// Find the selected candidate
	for _, candidate := range candidates {
		if candidate.ID == selectedID {
			result.Selected = append(result.Selected, candidate)
			break
		}
	}

	// If no valid selection found, default to highest judge score
	if len(result.Selected) == 0 {
		logger := log.GetLogger()
		logger.Warn("Meta-Judge response parsing failed, defaulting to highest judge score")
		bestScore := -1.0
		var bestCandidate CandidatePrompt
		for _, candidate := range candidates {
			if candidate.JudgeScore > bestScore {
				bestScore = candidate.JudgeScore
				bestCandidate = candidate
			}
		}
		if bestScore > -1.0 {
			result.Selected = append(result.Selected, bestCandidate)
			result.Reasoning = "Selected based on highest judge score (fallback)"
			logger.WithField("selected_id", bestCandidate.ID).Info("Meta-Judge: Fell back to highest judge score")
		} else if len(candidates) > 0 {
			// If no scores, select the first candidate
			result.Selected = append(result.Selected, candidates[0])
			result.Reasoning = "Selected first candidate (fallback)"
			logger.Info("Meta-Judge: Fell back to first candidate")
		}
	} else {
		result.Reasoning = strings.Join(reasoningLines, "\n")
	}

	return result
}
