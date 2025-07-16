package engine

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jonwraymond/prompt-alchemy/internal/helpers"
	"github.com/jonwraymond/prompt-alchemy/internal/phases"
	"github.com/jonwraymond/prompt-alchemy/internal/selection"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// Engine handles prompt generation with phased approach
// TODO: Server Mode Enhancement - Real-time Processing Engine
// When implementing server mode, extend the engine to support:
// - StreamGenerate() - Stream prompt generation results as they're created
// - DiscoverRelationshipsOnDemand() - Real-time semantic relationship discovery
// - GetSimilarPrompts() - Find similar prompts using embedding similarity
// - WebhookNotification() - Notify external systems when generation completes
//
// This keeps the engine stateless and lightweight while enabling
// powerful server-side features for API consumers.
type Engine struct {
	registry      *providers.Registry
	phaseHandlers map[models.Phase]phases.PhaseHandler
	logger        *logrus.Logger
	storage       storage.StorageInterface
	optimizer     *OptimizationIntegrator
}

// NewEngine creates a new prompt generation engine
func NewEngine(registry *providers.Registry, logger *logrus.Logger) *Engine {
	return &Engine{
		registry: registry,
		phaseHandlers: map[models.Phase]phases.PhaseHandler{
			models.PhasePrimaMaterial: &phases.PrimaMateria{},
			models.PhaseSolutio:       &phases.Solutio{},
			models.PhaseCoagulatio:    &phases.Coagulatio{},
		},
		logger: logger,
	}
}

// SetStorage sets the storage interface for the engine
func (e *Engine) SetStorage(storage storage.StorageInterface) {
	e.storage = storage
	if e.storage != nil {
		e.optimizer = NewOptimizationIntegrator(e.logger, e.storage, e.registry)
	}
}

// Generate creates prompts using the phased approach
func (e *Engine) Generate(ctx context.Context, opts models.GenerateOptions) (*models.GenerationResult, error) {
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

		// Optimize phase prompts if enabled
		if e.optimizer != nil && opts.Optimize {
			for i, prompt := range phasePrompts {
				optimized, err := e.optimizer.OptimizePhaseOutput(ctx, &prompt, opts)
				if err != nil {
					e.logger.WithError(err).Warn("Optimization failed, using original prompt")
				} else {
					phasePrompts[i] = *optimized
				}
			}
		}

		// Update base prompts for next phase
		basePrompts = make([]string, len(phasePrompts))
		for i, prompt := range phasePrompts {
			basePrompts[i] = prompt.Content
			result.Prompts = append(result.Prompts, prompt)
		}
	}

	if opts.AutoSelect {
		selector := selection.NewAISelector(e.registry)
		criteria := selection.SelectionCriteria{
			TaskDescription: opts.Request.Input,
			Persona:         opts.Persona,
			// Add other relevant fields from opts
		}
		selectResult, err := selector.Select(ctx, result.Prompts, criteria)
		if err == nil {
			result.Selected = selectResult.SelectedPrompt
		}
	}

	e.logger.Info("Prompt generation engine finished")
	return result, nil
}

// GenerateFromParams handles prompt generation with string parameters (shared between CLI and MCP)
func (e *Engine) GenerateFromParams(ctx context.Context, input string, phasesStr string, count int, temperature float64, maxTokens int, tagsStr string, persona string, targetModel string) (*models.GenerationResult, error) {
	phaseList := helpers.ParsePhases(phasesStr) // Assume parsePhases is available or add it
	tagList := helpers.ParseTags(tagsStr)

	phaseConfigs := helpers.BuildPhaseConfigs(phaseList, "") // Use default providers

	request := models.PromptRequest{
		Input:       input,
		Phases:      phaseList,
		Count:       count,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		Tags:        tagList,
		Context:     []string{},
	}

	options := models.GenerateOptions{
		Request:        request,
		PhaseConfigs:   phaseConfigs,
		UseParallel:    viper.GetBool("generation.use_parallel"),
		IncludeContext: true,
		Persona:        persona,
		TargetModel:    targetModel,
	}

	return e.Generate(ctx, options)
}

// processPhase handles generation for a single phase
func (e *Engine) processPhase(ctx context.Context, phase models.Phase, provider providers.Provider, inputs []string, opts models.GenerateOptions) ([]models.Prompt, error) {
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
func (e *Engine) generateSinglePrompt(ctx context.Context, phase models.Phase, provider providers.Provider, input string, opts models.GenerateOptions) (*models.Prompt, error) {
	e.logger.Debugf("Generating single prompt for phase %s", phase)
	startTime := time.Now()

	// Get the template for this phase
	handler, exists := e.phaseHandlers[phase]
	if !exists {
		return nil, fmt.Errorf("no handler for phase %s", phase)
	}

	template := handler.GetTemplate()

	// Build the system prompt based on phase
	systemPrompt := handler.BuildSystemPrompt(opts)

	// Prepare the prompt content
	promptContent := handler.PreparePromptContent(input, opts)
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
		fmt.Sprintf("template=%s", func() string {
			if len(template) > 50 {
				return template[:50] + "..."
			}
			return template
		}()), // Truncate template for brevity
		fmt.Sprintf("processing_time=%dms", processingTime),
	}
	// Add context files if any
	if len(opts.Request.Context) > 0 {
		prompt.GenerationContext = append(prompt.GenerationContext, opts.Request.Context...)
	}

	// Get embedding if available
	var embeddingModel, embeddingProviderName string
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
				embeddingProviderName = embeddingProvider.Name()
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
		EmbeddingProvider:  embeddingProviderName,
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
		case "o4-mini":
			costPerToken = 0.00000015 // $0.00015 per 1K tokens
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

// StreamGenerate handles real-time generation for server mode
func (e *Engine) StreamGenerate(ctx context.Context, opts models.GenerateOptions, conn *websocket.Conn) error {
	// TODO: Implement streaming logic
	for phase := range e.phaseHandlers {
		// Generate and stream partial results
		content := "Streaming phase: " + string(phase) // Placeholder
		if err := conn.WriteMessage(websocket.TextMessage, []byte(content)); err != nil {
			return err
		}
	}
	return nil
}
