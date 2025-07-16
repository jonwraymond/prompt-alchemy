package engine

import (
	"context"
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

// HistoryEnhancer enhances prompts using historical data and RAG
type HistoryEnhancer struct {
	storage  *storage.Storage
	embedder providers.Provider
}

// NewHistoryEnhancer creates a new history enhancer
func NewHistoryEnhancer(storage *storage.Storage, embedder providers.Provider) *HistoryEnhancer {
	return &HistoryEnhancer{
		storage:  storage,
		embedder: embedder,
	}
}

// EnhancedContext contains historical context for prompt generation
type EnhancedContext struct {
	OriginalInput       string
	SimilarPrompts      []*models.Prompt
	Similarities        []float64
	ExtractedPatterns   []string
	SuggestedApproaches []string
	HistoricalInsights  string
}

// EnhanceWithHistory enhances the input with historical context using RAG
func (h *HistoryEnhancer) EnhanceWithHistory(ctx context.Context, input string, phase models.Phase) (*EnhancedContext, error) {
	logger := log.GetLogger().WithFields(map[string]interface{}{
		"phase":        phase,
		"input_length": len(input),
	})
	logger.Info("Enhancing prompt with historical context")

	// Get embedding for the input
	embedding, err := h.embedder.GetEmbedding(ctx, input, nil)
	if err != nil {
		logger.WithError(err).Error("Failed to get embedding for input")
		return nil, fmt.Errorf("failed to get embedding for input: %w", err)
	}

	// Search for similar historical prompts using semantic search
	logger.Debug("Searching for similar historical prompts")
	similarPrompts, err := h.storage.SearchSimilarPrompts(ctx, embedding, 5)
	if err != nil {
		logger.WithError(err).Warn("Failed to search for similar prompts, continuing without history")
		// Continue without historical prompts if search fails
		similarPrompts = []*models.Prompt{}
	} else {
		logger.WithField("count", len(similarPrompts)).Debug("Found similar prompts")
	}

	// Also get high-quality historical prompts for this phase by relevance
	logger.Debug("Searching for high-quality historical prompts")
	highQualityPrompts, err := h.storage.GetHighQualityHistoricalPrompts(ctx, 3)
	if err != nil {
		logger.WithError(err).Warn("Failed to get high-quality historical prompts")
		highQualityPrompts = []*models.Prompt{}
	} else {
		// Filter by phase
		var filteredHighQuality []*models.Prompt
		for _, p := range highQualityPrompts {
			if p.Phase == phase {
				filteredHighQuality = append(filteredHighQuality, p)
			}
		}
		highQualityPrompts = filteredHighQuality
		logger.WithField("count", len(highQualityPrompts)).Debug("Found high-quality prompts")
	}

	// Extract patterns and approaches
	patterns := h.extractPatterns(similarPrompts, highQualityPrompts)
	approaches := h.extractApproaches(similarPrompts, phase)
	insights := h.generateInsights(similarPrompts, nil, highQualityPrompts)

	enhancementResult := &EnhancedContext{
		OriginalInput:       input,
		SimilarPrompts:      similarPrompts,
		Similarities:        nil,
		ExtractedPatterns:   patterns,
		SuggestedApproaches: approaches,
		HistoricalInsights:  insights,
	}

	logger.WithFields(map[string]interface{}{
		"similar_prompts":      len(similarPrompts),
		"high_quality_prompts": len(highQualityPrompts),
		"patterns_extracted":   len(patterns),
		"approaches":           len(approaches),
	}).Info("Completed prompt enhancement with historical context")

	return enhancementResult, nil
}

// extractPatterns identifies common patterns from historical prompts
func (h *HistoryEnhancer) extractPatterns(similar []*models.Prompt, highQuality []*models.Prompt) []string {
	patterns := make(map[string]int)

	// Analyze similar prompts for patterns
	for _, prompt := range similar {
		// Look for structural patterns
		if strings.Contains(prompt.Content, "step-by-step") || strings.Contains(prompt.Content, "step by step") {
			patterns["step-by-step instructions"]++
		}
		if strings.Contains(prompt.Content, "example") || strings.Contains(prompt.Content, "Example:") {
			patterns["includes examples"]++
		}
		if strings.Contains(prompt.Content, "specific") || strings.Contains(prompt.Content, "precisely") {
			patterns["emphasis on specificity"]++
		}
		if strings.Contains(prompt.Content, "context") || strings.Contains(prompt.Content, "background") {
			patterns["provides context"]++
		}
		if strings.Contains(prompt.Content, "format") || strings.Contains(prompt.Content, "structure") {
			patterns["defines output format"]++
		}
	}

	// Analyze high-quality prompts
	for _, prompt := range highQuality {
		if strings.Contains(prompt.Content, "constraints") || strings.Contains(prompt.Content, "requirements") {
			patterns["clear constraints"]++
		}
		if strings.Contains(prompt.Content, "goal") || strings.Contains(prompt.Content, "objective") {
			patterns["explicit goals"]++
		}
	}

	// Convert to list of patterns that appear frequently
	var extractedPatterns []string
	for pattern, count := range patterns {
		if count >= 2 || (count >= 1 && len(similar) <= 2) {
			extractedPatterns = append(extractedPatterns, pattern)
		}
	}

	return extractedPatterns
}

// extractApproaches identifies successful approaches from historical prompts
func (h *HistoryEnhancer) extractApproaches(similar []*models.Prompt, phase models.Phase) []string {
	approaches := make(map[string]bool)

	for _, prompt := range similar {
		// Phase-specific approach extraction
		switch phase {
		case models.PhasePrimaMaterial:
			if strings.Contains(prompt.Content, "brainstorm") || strings.Contains(prompt.Content, "explore") {
				approaches["Open-ended exploration"] = true
			}
			if strings.Contains(prompt.Content, "creative") || strings.Contains(prompt.Content, "innovative") {
				approaches["Emphasis on creativity"] = true
			}

		case models.PhaseSolutio:
			if strings.Contains(prompt.Content, "analyze") || strings.Contains(prompt.Content, "evaluate") {
				approaches["Analytical approach"] = true
			}
			if strings.Contains(prompt.Content, "compare") || strings.Contains(prompt.Content, "contrast") {
				approaches["Comparative analysis"] = true
			}

		case models.PhaseCoagulatio:
			if strings.Contains(prompt.Content, "summarize") || strings.Contains(prompt.Content, "concise") {
				approaches["Focused summarization"] = true
			}
			if strings.Contains(prompt.Content, "actionable") || strings.Contains(prompt.Content, "implement") {
				approaches["Action-oriented output"] = true
			}
		}

		// General approaches
		if prompt.RelevanceScore > 0.8 {
			approaches["High-relevance framing"] = true
		}
		if prompt.UsageCount > 5 {
			approaches["Proven effective structure"] = true
		}
	}

	// Convert to list
	var suggestionList []string
	for approach := range approaches {
		suggestionList = append(suggestionList, approach)
	}

	return suggestionList
}

// generateInsights creates a summary of historical insights
func (h *HistoryEnhancer) generateInsights(similar []*models.Prompt, similarities []float64, highQuality []*models.Prompt) string {
	var insights strings.Builder

	if len(similar) > 0 {
		insights.WriteString(fmt.Sprintf("Found %d similar historical prompts ", len(similar)))
		if len(similarities) > 0 {
			insights.WriteString(fmt.Sprintf("(best match: %.2f%% similarity). ", similarities[0]*100))
		}
	}

	if len(highQuality) > 0 {
		insights.WriteString(fmt.Sprintf("Identified %d high-performing prompts in this phase. ", len(highQuality)))

		// Analyze common characteristics
		var avgLength int
		for _, p := range highQuality {
			avgLength += len(p.Content)
		}
		avgLength /= len(highQuality)

		insights.WriteString(fmt.Sprintf("Successful prompts average %d characters. ", avgLength))
	}

	// Provider distribution insights
	providerCounts := make(map[string]int)
	for _, p := range similar {
		providerCounts[p.Provider]++
	}

	if len(providerCounts) > 0 {
		insights.WriteString("Historical providers used: ")
		for provider, count := range providerCounts {
			insights.WriteString(fmt.Sprintf("%s (%d), ", provider, count))
		}
	}

	return strings.TrimSuffix(insights.String(), ", ")
}

// BuildEnhancedPrompt creates an enhanced prompt incorporating historical context
func (h *HistoryEnhancer) BuildEnhancedPrompt(input string, context *EnhancedContext, phase models.Phase) string {
	var enhanced strings.Builder

	// Start with original input
	enhanced.WriteString(input)

	// Add historical insights if available
	if context.HistoricalInsights != "" {
		enhanced.WriteString("\n\n[Historical Context: ")
		enhanced.WriteString(context.HistoricalInsights)
		enhanced.WriteString("]")
	}

	// Add suggested patterns
	if len(context.ExtractedPatterns) > 0 {
		enhanced.WriteString("\n\n[Successful Patterns: ")
		enhanced.WriteString(strings.Join(context.ExtractedPatterns, ", "))
		enhanced.WriteString("]")
	}

	// Add phase-specific enhancements
	switch phase {
	case models.PhasePrimaMaterial:
		if len(context.SuggestedApproaches) > 0 {
			enhanced.WriteString("\n\n[Consider these exploration approaches: ")
			enhanced.WriteString(strings.Join(context.SuggestedApproaches, "; "))
			enhanced.WriteString("]")
		}

	case models.PhaseSolutio:
		if len(context.SimilarPrompts) > 0 {
			enhanced.WriteString("\n\n[Previous successful analyses focused on: ")
			// Extract key themes from similar prompts
			themes := h.extractThemes(context.SimilarPrompts[:min(3, len(context.SimilarPrompts))])
			enhanced.WriteString(strings.Join(themes, ", "))
			enhanced.WriteString("]")
		}

	case models.PhaseCoagulatio:
		enhanced.WriteString("\n\n[Optimization hint: Focus on actionable, concrete outputs]")
	}

	return enhanced.String()
}

// extractThemes extracts key themes from prompts
func (h *HistoryEnhancer) extractThemes(prompts []*models.Prompt) []string {
	themes := make(map[string]int)

	// Simple keyword extraction
	keywords := []string{
		"performance", "security", "scalability", "usability", "reliability",
		"efficiency", "maintainability", "flexibility", "simplicity", "robustness",
		"accuracy", "precision", "clarity", "consistency", "compatibility",
	}

	for _, prompt := range prompts {
		content := strings.ToLower(prompt.Content)
		for _, keyword := range keywords {
			if strings.Contains(content, keyword) {
				themes[keyword]++
			}
		}
	}

	// Return themes that appear most frequently
	var topThemes []string
	for theme, count := range themes {
		if count > 0 {
			topThemes = append(topThemes, theme)
		}
	}

	return topThemes
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
