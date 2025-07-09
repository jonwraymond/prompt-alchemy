package engine

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
)

// Engine handles prompt generation with phased approach
type Engine struct {
	registry       *providers.Registry
	phaseTemplates map[models.Phase]string
	logger         *logrus.Logger
}

// NewEngine creates a new prompt generation engine
func NewEngine(registry *providers.Registry, logger *logrus.Logger) *Engine {
	return &Engine{
		registry:       registry,
		phaseTemplates: initializePhaseTemplates(),
		logger:         logger,
	}
}

// initializePhaseTemplates returns the default templates for each phase
func initializePhaseTemplates() map[models.Phase]string {
	return map[models.Phase]string{
		models.PhaseIdea: `You are an expert prompt engineer. Create a comprehensive prompt that generates {{TYPE}} for {{AUDIENCE}}, using {{TONE}}, focusing on {{THEME}}.

Requirements:
- Be specific and detailed
- Include clear instructions
- Define expected output format
- Consider edge cases

User Input: {{INPUT}}`,

		models.PhaseHuman: `You are a natural language expert. Take this prompt and rewrite it to feel more natural, specific, and emotionally resonant. Add a first-person voice where appropriate.

Original Prompt:
{{PROMPT}}

Requirements:
- Make it conversational and engaging
- Add specific examples where helpful
- Ensure clarity and flow
- Maintain the original intent`,

		models.PhasePrecision: `You are an optimization expert. Refine this prompt for maximum effectiveness based on recent best practices and output clarity.

Current Prompt:
{{PROMPT}}

Requirements:
- Optimize for clarity and precision
- Remove redundancy
- Enhance structure
- Consider token efficiency
- Add performance-oriented instructions`,
	}
}

// GenerateOptions contains options for prompt generation
type GenerateOptions struct {
	Request        models.PromptRequest
	PhaseConfigs   []providers.PhaseConfig
	UseParallel    bool
	IncludeContext bool
}

// Generate creates prompts using the phased approach
func (e *Engine) Generate(ctx context.Context, opts GenerateOptions) (*models.GenerationResult, error) {
	result := &models.GenerationResult{
		Prompts:  make([]models.Prompt, 0),
		Rankings: make([]models.PromptRanking, 0),
	}

	// Start with the base input
	basePrompts := make([]string, opts.Request.Count)
	for i := 0; i < opts.Request.Count; i++ {
		basePrompts[i] = opts.Request.Input
	}

	// Process through each phase
	for _, phase := range opts.Request.Phases {
		e.logger.WithField("phase", phase).Info("Processing phase")

		provider, err := providers.GetProviderForPhase(opts.PhaseConfigs, phase, e.registry)
		if err != nil {
			return nil, fmt.Errorf("failed to get provider for phase %s: %w", phase, err)
		}

		// Generate variants for this phase
		phasePrompts, err := e.processPhase(ctx, phase, provider, basePrompts, opts)
		if err != nil {
			return nil, fmt.Errorf("failed to process phase %s: %w", phase, err)
		}

		// Update base prompts for next phase
		basePrompts = make([]string, len(phasePrompts))
		for i, prompt := range phasePrompts {
			basePrompts[i] = prompt.Content
			result.Prompts = append(result.Prompts, prompt)
		}
	}

	return result, nil
}

// processPhase handles generation for a single phase
func (e *Engine) processPhase(ctx context.Context, phase models.Phase, provider providers.Provider, inputs []string, opts GenerateOptions) ([]models.Prompt, error) {
	prompts := make([]models.Prompt, 0, len(inputs))

	if opts.UseParallel {
		// Process in parallel
		var wg sync.WaitGroup
		var mu sync.Mutex
		errors := make([]error, len(inputs))

		for i, input := range inputs {
			wg.Add(1)
			go func(idx int, content string) {
				defer wg.Done()

				prompt, err := e.generateSinglePrompt(ctx, phase, provider, content, opts)
				if err != nil {
					errors[idx] = err
					return
				}

				mu.Lock()
				prompts = append(prompts, *prompt)
				mu.Unlock()
			}(i, input)
		}

		wg.Wait()

		// Check for errors
		for i, err := range errors {
			if err != nil {
				return nil, fmt.Errorf("failed to generate prompt %d: %w", i, err)
			}
		}
	} else {
		// Process sequentially
		for _, input := range inputs {
			prompt, err := e.generateSinglePrompt(ctx, phase, provider, input, opts)
			if err != nil {
				return nil, err
			}
			prompts = append(prompts, *prompt)
		}
	}

	return prompts, nil
}

// generateSinglePrompt generates a single prompt for a phase
func (e *Engine) generateSinglePrompt(ctx context.Context, phase models.Phase, provider providers.Provider, input string, opts GenerateOptions) (*models.Prompt, error) {
	startTime := time.Now()

	// Get the template for this phase
	template, exists := e.phaseTemplates[phase]
	if !exists {
		return nil, fmt.Errorf("no template for phase %s", phase)
	}

	// Build the system prompt based on phase
	systemPrompt := e.buildSystemPrompt(phase, opts)

	// Prepare the prompt content
	promptContent := e.preparePromptContent(template, input, opts)

	// Generate using the provider
	resp, err := provider.Generate(ctx, providers.GenerateRequest{
		Prompt:       promptContent,
		SystemPrompt: systemPrompt,
		Temperature:  opts.Request.Temperature,
		MaxTokens:    opts.Request.MaxTokens,
	})

	if err != nil {
		return nil, fmt.Errorf("provider generation failed: %w", err)
	}

	processingTime := int(time.Since(startTime).Milliseconds())
	promptID := uuid.New()

	// Create the prompt model
	prompt := &models.Prompt{
		ID:           promptID,
		Content:      resp.Content,
		Phase:        phase,
		Provider:     provider.Name(),
		Model:        resp.Model, // Model from response
		Temperature:  opts.Request.Temperature,
		MaxTokens:    opts.Request.MaxTokens,
		ActualTokens: resp.TokensUsed, // Actual tokens used
		Tags:         opts.Request.Tags,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Get embedding if available
	var embeddingModel, embeddingProvider string
	if opts.IncludeContext {
		embedding, err := provider.GetEmbedding(ctx, resp.Content)
		if err != nil {
			e.logger.WithError(err).Warn("Failed to get embedding")
		} else {
			prompt.Embedding = embedding
			embeddingModel = getEmbeddingModelName(provider.Name())
			embeddingProvider = provider.Name()
			prompt.EmbeddingModel = embeddingModel
			prompt.EmbeddingProvider = embeddingProvider
		}
	}

	// Create detailed model metadata
	prompt.ModelMetadata = &models.ModelMetadata{
		ID:                 uuid.New(),
		PromptID:           promptID,
		GenerationModel:    resp.Model,
		GenerationProvider: provider.Name(),
		EmbeddingModel:     embeddingModel,
		EmbeddingProvider:  embeddingProvider,
		ProcessingTime:     processingTime,
		InputTokens:        calculateInputTokens(promptContent), // Estimate
		OutputTokens:       resp.TokensUsed,
		TotalTokens:        resp.TokensUsed, // For now, same as output tokens
		CreatedAt:          time.Now(),
	}

	// Set cost if we can calculate it
	if cost := calculateCost(provider.Name(), resp.Model, resp.TokensUsed); cost > 0 {
		prompt.ModelMetadata.Cost = cost
	}

	return prompt, nil
}

// buildSystemPrompt creates the system prompt for a phase
func (e *Engine) buildSystemPrompt(phase models.Phase, opts GenerateOptions) string {
	baseSystem := "You are an expert AI prompt engineer with deep understanding of language models and their capabilities."

	switch phase {
	case models.PhaseIdea:
		return baseSystem + " Your task is to create comprehensive, well-structured prompts that clearly define the task and expected output."
	case models.PhaseHuman:
		return baseSystem + " Your task is to make prompts more natural, conversational, and emotionally engaging while maintaining clarity."
	case models.PhasePrecision:
		return baseSystem + " Your task is to optimize prompts for maximum effectiveness, clarity, and token efficiency."
	default:
		return baseSystem
	}
}

// preparePromptContent prepares the prompt content with template substitution
func (e *Engine) preparePromptContent(template, input string, opts GenerateOptions) string {
	content := template

	// Replace placeholders
	replacements := map[string]string{
		"{{INPUT}}":    input,
		"{{TYPE}}":     extractType(input),
		"{{AUDIENCE}}": extractAudience(input),
		"{{TONE}}":     extractTone(input),
		"{{THEME}}":    extractTheme(input),
		"{{PROMPT}}":   input,
	}

	for placeholder, value := range replacements {
		content = strings.ReplaceAll(content, placeholder, value)
	}

	// Add context if provided
	if len(opts.Request.Context) > 0 {
		content += "\n\nAdditional Context:\n"
		for _, ctx := range opts.Request.Context {
			content += fmt.Sprintf("- %s\n", ctx)
		}
	}

	return content
}

// Helper functions to extract information from input
func extractType(input string) string {
	// Simple extraction logic - can be enhanced with NLP
	if strings.Contains(strings.ToLower(input), "email") {
		return "email content"
	} else if strings.Contains(strings.ToLower(input), "code") {
		return "code snippets"
	} else if strings.Contains(strings.ToLower(input), "article") {
		return "article content"
	}
	return "content"
}

func extractAudience(input string) string {
	// Simple extraction logic - can be enhanced
	if strings.Contains(strings.ToLower(input), "developer") {
		return "developers"
	} else if strings.Contains(strings.ToLower(input), "business") {
		return "business professionals"
	}
	return "general audience"
}

func extractTone(input string) string {
	// Simple extraction logic - can be enhanced
	if strings.Contains(strings.ToLower(input), "formal") {
		return "formal tone"
	} else if strings.Contains(strings.ToLower(input), "casual") {
		return "casual tone"
	}
	return "professional tone"
}

func extractTheme(input string) string {
	// Simple extraction logic - can be enhanced
	words := strings.Fields(input)
	if len(words) > 5 {
		return strings.Join(words[:5], " ") + "..."
	}
	return input
}

// getEmbeddingModelName returns the embedding model name for a provider
func getEmbeddingModelName(providerName string) string {
	switch providerName {
	case "openai":
		return "text-embedding-ada-002"
	case "openrouter":
		return "openai/text-embedding-ada-002"
	case "claude":
		// Claude doesn't have native embeddings, might use OpenAI through API
		return "text-embedding-ada-002"
	case "gemini":
		return "embedding-001"
	default:
		return "unknown"
	}
}

// calculateInputTokens estimates input tokens (simple approximation)
func calculateInputTokens(content string) int {
	// Rough approximation: 1 token ≈ 4 characters for English text
	return len(content) / 4
}

// calculateCost estimates the cost based on provider and usage
func calculateCost(provider, model string, tokens int) float64 {
	// These are approximate costs - should be updated with current pricing
	costPerToken := 0.0

	switch provider {
	case "openai":
		switch model {
		case "gpt-4-turbo-preview", "gpt-4-1106-preview":
			costPerToken = 0.00003 // $0.03 per 1K tokens (output)
		case "gpt-3.5-turbo":
			costPerToken = 0.000002 // $0.002 per 1K tokens
		default:
			costPerToken = 0.00002
		}
	case "openrouter":
		// OpenRouter has variable pricing
		costPerToken = 0.00002
	case "claude":
		switch model {
		case "claude-3-opus-20240229":
			costPerToken = 0.000075 // $0.075 per 1K tokens (output)
		case "claude-3-sonnet-20240229":
			costPerToken = 0.000015 // $0.015 per 1K tokens (output)
		default:
			costPerToken = 0.00003
		}
	case "gemini":
		costPerToken = 0.000002 // Gemini Pro pricing
	}

	return float64(tokens) * costPerToken
}
