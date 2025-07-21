package cmd

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// PromptJudge evaluates and ranks prompts
type PromptJudge struct {
	provider providers.Provider
	logger   *logrus.Logger
}

// NewPromptJudge creates a new prompt judge
func NewPromptJudge(provider providers.Provider, logger *logrus.Logger) *PromptJudge {
	return &PromptJudge{
		provider: provider,
		logger:   logger,
	}
}

// RankPrompts evaluates and ranks a list of prompts
func (j *PromptJudge) RankPrompts(ctx context.Context, prompts []models.Prompt, criteria JudgeCriteria) ([]RankedPrompt, error) {
	if len(prompts) <= 1 {
		// No need to rank a single prompt
		if len(prompts) == 1 {
			return []RankedPrompt{{
				Prompt:    prompts[0],
				Score:     1.0,
				Reasoning: "Single prompt, no ranking needed",
			}}, nil
		}
		return []RankedPrompt{}, nil
	}

	// Build evaluation prompt
	evalPrompt := j.buildEvaluationPrompt(prompts, criteria)

	// Get evaluation from AI
	req := providers.GenerateRequest{
		SystemPrompt: "You are an expert prompt evaluator.",
		Prompt:       evalPrompt,
		Temperature:  0.3,
		MaxTokens:    1000,
	}

	response, err := j.provider.Generate(ctx, req)
	if err != nil {
		j.logger.WithError(err).Error("Failed to get AI evaluation")
		// Fallback to simple ranking
		return j.fallbackRanking(prompts), nil
	}

	// Parse response and create rankings
	rankings := j.parseRankingResponse(response.Content, prompts)

	// Sort by score descending
	sort.Slice(rankings, func(i, j int) bool {
		return rankings[i].Score > rankings[j].Score
	})

	return rankings, nil
}

// SelectBest returns the highest-ranked prompt
func (j *PromptJudge) SelectBest(ctx context.Context, prompts []models.Prompt, criteria JudgeCriteria) (models.Prompt, error) {
	if len(prompts) == 0 {
		return models.Prompt{}, fmt.Errorf("no prompts to select from")
	}

	if len(prompts) == 1 {
		return prompts[0], nil
	}

	rankings, err := j.RankPrompts(ctx, prompts, criteria)
	if err != nil {
		return prompts[0], err
	}

	if len(rankings) > 0 {
		return rankings[0].Prompt, nil
	}

	return prompts[0], nil
}

// JudgeCriteria defines what to look for when judging prompts
type JudgeCriteria struct {
	TaskDescription  string
	DesiredQualities []string
	Persona          string
	MaxLength        int
}

// RankedPrompt represents a prompt with its ranking
type RankedPrompt struct {
	Prompt    models.Prompt
	Score     float64
	Reasoning string
}

func (j *PromptJudge) buildEvaluationPrompt(prompts []models.Prompt, criteria JudgeCriteria) string {
	var sb strings.Builder

	sb.WriteString("You are an expert prompt evaluator. Evaluate the following prompts based on these criteria:\n\n")
	sb.WriteString(fmt.Sprintf("Task: %s\n", criteria.TaskDescription))
	sb.WriteString(fmt.Sprintf("Persona: %s\n", criteria.Persona))

	if len(criteria.DesiredQualities) > 0 {
		sb.WriteString("Desired qualities: " + strings.Join(criteria.DesiredQualities, ", ") + "\n")
	}

	sb.WriteString("\nPrompts to evaluate:\n\n")

	for i, prompt := range prompts {
		sb.WriteString(fmt.Sprintf("PROMPT %d:\n%s\n\n", i+1, prompt.Content))
	}

	sb.WriteString("For each prompt, provide:\n")
	sb.WriteString("1. A score from 0.0 to 1.0\n")
	sb.WriteString("2. Brief reasoning (one sentence)\n\n")
	sb.WriteString("Format your response as:\n")
	sb.WriteString("PROMPT 1: Score: X.X | Reasoning: ...\n")
	sb.WriteString("PROMPT 2: Score: X.X | Reasoning: ...\n")
	sb.WriteString("etc.\n")

	return sb.String()
}

func (j *PromptJudge) parseRankingResponse(response string, prompts []models.Prompt) []RankedPrompt {
	rankings := make([]RankedPrompt, 0, len(prompts))
	lines := strings.Split(response, "\n")

	for i, prompt := range prompts {
		score := 0.5 // Default score
		reasoning := "AI evaluation"

		// Look for the prompt's evaluation in the response
		for _, line := range lines {
			if strings.Contains(line, fmt.Sprintf("PROMPT %d:", i+1)) {
				// Try to extract score
				if strings.Contains(line, "Score:") {
					parts := strings.Split(line, "|")
					if len(parts) >= 1 {
						scorePart := strings.TrimSpace(parts[0])
						if strings.Contains(scorePart, "Score:") {
							scoreStr := strings.TrimSpace(strings.Split(scorePart, "Score:")[1])
							var parsedScore float64
							if _, err := fmt.Sscanf(scoreStr, "%f", &parsedScore); err == nil {
								score = parsedScore
							}
						}
					}
					if len(parts) >= 2 && strings.Contains(parts[1], "Reasoning:") {
						reasoning = strings.TrimSpace(strings.Split(parts[1], "Reasoning:")[1])
					}
				}
				break
			}
		}

		rankings = append(rankings, RankedPrompt{
			Prompt:    prompt,
			Score:     score,
			Reasoning: reasoning,
		})
	}

	return rankings
}

func (j *PromptJudge) fallbackRanking(prompts []models.Prompt) []RankedPrompt {
	rankings := make([]RankedPrompt, len(prompts))
	for i, prompt := range prompts {
		// Simple heuristic: prefer longer, more detailed prompts
		score := float64(len(prompt.Content)) / 1000.0
		if score > 1.0 {
			score = 1.0
		}

		rankings[i] = RankedPrompt{
			Prompt:    prompt,
			Score:     score,
			Reasoning: "Ranked by content length and detail",
		}
	}
	return rankings
}
