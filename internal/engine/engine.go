package engine

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
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
		logger:         log.GetLogger(),
	}
}

// initializePhaseTemplates returns the default templates for each alchemical phase
func initializePhaseTemplates() map[models.Phase]string {
	return map[models.Phase]string{
		models.PhasePrimaMaterial: `You are an alchemical prompt engineer, working with the Prima Materia - the raw, unformed potential. Extract and shape the essential elements from the user's vision into a comprehensive prompt that generates {{TYPE}} for {{AUDIENCE}}, using {{TONE}}, focusing on {{THEME}}.

Requirements:
- Extract the pure essence of the request
- Shape raw ideas into structured form
- Define the vessel (output format) clearly
- Consider all elemental aspects

Raw Material: {{INPUT}}`,

		models.PhaseSolutio: `You are a linguistic alchemist performing Solutio - the dissolution phase. Take this crystallized prompt and dissolve it into flowing, natural language that resonates with the soul. Transform rigid structure into fluid conversation.

Material to Dissolve:
{{PROMPT}}

Transformation Requirements:
- Dissolve formality into natural flow
- Infuse with emotional resonance
- Add the warmth of human connection
- Preserve the essential truth while softening edges`,

		models.PhaseCoagulatio: `You are a master alchemist performing Coagulatio - the final crystallization. Take this flowing prompt and crystallize it into its most potent, refined form. Remove all impurities to reveal the philosopher's stone of prompts.

Solution to Crystallize:
{{PROMPT}}

Crystallization Requirements:
- Distill to pure essence
- Remove all redundant matter
- Perfect the structural lattice
- Optimize for maximum potency
- Achieve the golden ratio of clarity to power`,
	}
}

// GenerateOptions contains options for prompt generation
type GenerateOptions struct {
	Request        models.PromptRequest
	PhaseConfigs   []providers.PhaseConfig
	UseParallel    bool
	IncludeContext bool
	Persona        string
	TargetModel    string
}

// Generate creates prompts using the phased approach
func (e *Engine) Generate(ctx context.Context, opts GenerateOptions) (*models.GenerationResult, error) {
	e.logger.Info("Starting prompt generation engine")
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
		e.logger.Debugf("Using provider %s for phase %s", provider.Name(), phase)

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

	e.logger.Info("Prompt generation engine finished")
	return result, nil
}

// processPhase handles generation for a single phase
func (e *Engine) processPhase(ctx context.Context, phase models.Phase, provider providers.Provider, inputs []string, opts GenerateOptions) ([]models.Prompt, error) {
	e.logger.Debugf("Processing phase %s with %d inputs", phase, len(inputs))
	prompts := make([]models.Prompt, 0, len(inputs))

	if opts.UseParallel {
		// Process in parallel
		e.logger.Debug("Processing phase in parallel")
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
		e.logger.Debug("Processing phase sequentially")
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
	e.logger.Debugf("Generating single prompt for phase %s", phase)
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
	e.logger.Debugf("Prompt content for provider: %s", promptContent)

	// Generate using the provider
	resp, err := provider.Generate(ctx, providers.GenerateRequest{
		Prompt:       promptContent,
		SystemPrompt: systemPrompt,
		Temperature:  opts.Request.Temperature,
		MaxTokens:    opts.Request.MaxTokens,
	})

	if err != nil {
		e.logger.WithFields(logrus.Fields{
			"provider": provider.Name(),
			"phase":    phase,
		}).Errorf("Provider generation failed: %v", err)
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

	// Set original input tracking fields
	prompt.OriginalInput = opts.Request.Input
	prompt.PersonaUsed = opts.Persona
	prompt.TargetModelFamily = opts.TargetModel
	prompt.SourceType = "generated"
	prompt.RelevanceScore = 1.0 // Default relevance score for new prompts
	prompt.UsageCount = 0
	prompt.GenerationCount = 1

	// Set generation request as PromptRequest object (will be serialized by SavePrompt)
	prompt.GenerationRequest = &opts.Request

	// Set generation context as string array
	prompt.GenerationContext = []string{
		fmt.Sprintf("phase=%s", phase),
		fmt.Sprintf("provider=%s", provider.Name()),
		fmt.Sprintf("template=%s", template[:50]+"..."), // Truncate template for brevity
		fmt.Sprintf("processing_time=%dms", processingTime),
	}
	// Add context files if any
	if len(opts.Request.Context) > 0 {
		prompt.GenerationContext = append(prompt.GenerationContext, opts.Request.Context...)
	}

	// Get embedding if available
	var embeddingModel, embeddingProvider string
	if opts.IncludeContext {
		embeddingProvider := providers.GetEmbeddingProvider(provider, e.registry)

		if embeddingProvider.SupportsEmbeddings() {
			e.logger.Debugf("Getting embedding from provider: %s", embeddingProvider.Name())
			embedding, err := embeddingProvider.GetEmbedding(ctx, resp.Content, e.registry)
			if err != nil {
				e.logger.WithError(err).WithFields(logrus.Fields{
					"primary_provider":   provider.Name(),
					"embedding_provider": embeddingProvider.Name(),
				}).Warn("Failed to get embedding")
			} else {
				prompt.Embedding = embedding
				embeddingModel = getEmbeddingModelName(embeddingProvider.Name())
				embeddingProviderName := embeddingProvider.Name()
				prompt.EmbeddingModel = embeddingModel
				prompt.EmbeddingProvider = embeddingProviderName

				// Log successful embedding with fallback info
				if provider.Name() != embeddingProvider.Name() {
					e.logger.WithFields(logrus.Fields{
						"primary_provider":   provider.Name(),
						"embedding_provider": embeddingProviderName,
					}).Info("Using fallback provider for embeddings")
				}
			}
		} else {
			e.logger.WithField("provider", provider.Name()).Info("Provider does not support embeddings, skipping embedding generation")
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
	baseSystem := "You are a master alchemist of language, transforming raw ideas into golden prompts through ancient processes."

	switch phase {
	case models.PhasePrimaMaterial:
		return baseSystem + " In this Prima Materia phase, extract the pure essence from raw materials to create the foundation stone of comprehensive, well-structured prompts."
	case models.PhaseSolutio:
		return baseSystem + " In this Solutio phase, dissolve rigid structures into flowing, natural language that speaks to the human soul while maintaining clarity of purpose."
	case models.PhaseCoagulatio:
		return baseSystem + " In this Coagulatio phase, crystallize the dissolved essence into its most potent form - achieving maximum effectiveness through perfect refinement."
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
	// Use default embedding model from config for OpenAI provider
	if providerName == providers.ProviderOpenAI {
		defaultEmbeddingModel := viper.GetString("generation.default_embedding_model")
		if defaultEmbeddingModel != "" {
			return defaultEmbeddingModel
		}
	}

	switch providerName {
	case providers.ProviderOpenAI:
		return "text-embedding-3-small"
	case providers.ProviderOpenRouter:
		return "openai/text-embedding-3-small"
	case providers.ProviderAnthropic:
		// Anthropic doesn't have native embeddings
		return "none"
	case providers.ProviderGoogle:
		return "text-embedding-004"
	case providers.ProviderOllama:
		return "nomic-embed-text"
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
	case providers.ProviderOpenAI:
		switch model {
		case "gpt-4-turbo-preview", "gpt-4-1106-preview":
			costPerToken = 0.00003 // $0.03 per 1K tokens (output)
		case "gpt-3.5-turbo":
			costPerToken = 0.000002 // $0.002 per 1K tokens
		default:
			costPerToken = 0.00002
		}
	case providers.ProviderOpenRouter:
		// OpenRouter has variable pricing
		costPerToken = 0.00002
	case providers.ProviderAnthropic:
		switch model {
		case "claude-3-opus-20240229":
			costPerToken = 0.000075 // $0.075 per 1K tokens (output)
		case "claude-3-sonnet-20240229", "claude-3-5-sonnet-20241022":
			costPerToken = 0.000015 // $0.015 per 1K tokens (output)
		default:
			costPerToken = 0.00003
		}
	case providers.ProviderGoogle:
		costPerToken = 0.000002 // Gemini Pro pricing
	case providers.ProviderOllama:
		costPerToken = 0.0 // Local models are free
	}

	return float64(tokens) * costPerToken
}
