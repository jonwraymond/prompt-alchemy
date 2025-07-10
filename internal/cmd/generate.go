package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	phases              string
	count               int
	temperature         float64
	maxTokens           int
	tags                string
	contextFiles        []string
	provider            string
	outputFormat        string
	savePrompt          bool
	persona             string
	targetModel         string
	embeddingDimensions int
)

// generateCmd represents the generate command
var generateCmd = &cobra.Command{
	Use:   "generate [input]",
	Short: "Generate AI prompts using phased approach",
	Long: `Generate AI prompts through a sophisticated phased approach:
- Idea Phase: Creates comprehensive base prompts
- Human Phase: Adds natural language and emotional resonance
- Precision Phase: Optimizes for clarity and effectiveness`,
	Args: cobra.MinimumNArgs(1),
	RunE: runGenerate,
}

func init() {
	generateCmd.Flags().StringVarP(&phases, "phases", "p", "idea,human,precision", "Phases to use (comma-separated)")
	generateCmd.Flags().IntVarP(&count, "count", "c", 3, "Number of prompt variants to generate")
	generateCmd.Flags().Float64VarP(&temperature, "temperature", "t", 0.7, "Temperature for generation")
	generateCmd.Flags().IntVarP(&maxTokens, "max-tokens", "m", 2000, "Maximum tokens for generation")
	generateCmd.Flags().StringVar(&tags, "tags", "", "Tags for the prompt (comma-separated)")
	generateCmd.Flags().StringSliceVar(&contextFiles, "context", []string{}, "Context files to include")
	generateCmd.Flags().StringVar(&provider, "provider", "", "Override default provider for all phases")
	generateCmd.Flags().StringVarP(&outputFormat, "output", "o", "text", "Output format (text, json, yaml)")
	generateCmd.Flags().BoolVar(&savePrompt, "save", true, "Save generated prompts to database")
	generateCmd.Flags().StringVar(&persona, "persona", "code", "AI persona to use (code, writing, analysis, generic)")
	generateCmd.Flags().StringVar(&targetModel, "target-model", "", "Target model family for optimization (claude-3-5-sonnet-20241022, gpt-4o-mini, gemini-2.5-flash, etc.)")
	generateCmd.Flags().IntVar(&embeddingDimensions, "embedding-dimensions", 0, "Embedding dimensions for similarity search (uses config default if not specified)")
}

func runGenerate(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Starting prompt generation")

	// Join args as input
	input := strings.Join(args, " ")
	logger.Debugf("Input prompt: %s", input)

	// Parse phases
	phaseList := parsePhases(phases)
	if len(phaseList) == 0 {
		return fmt.Errorf("no valid phases specified")
	}
	logger.Debugf("Phases: %v", phaseList)

	// Parse tags
	tagList := parseTags(tags)
	logger.Debugf("Tags: %v", tagList)

	// Load context
	contextList, err := loadContext(contextFiles)
	if err != nil {
		return fmt.Errorf("failed to load context: %w", err)
	}
	logger.Debugf("Context files: %v", contextFiles)

	// Validate and load persona
	personaType := models.PersonaType(persona)
	personaObj, err := models.GetPersona(personaType)
	if err != nil {
		return fmt.Errorf("invalid persona '%s': %w", persona, err)
	}
	logger.Debugf("Using persona: %s", persona)

	// Detect or use specified target model family
	var modelFamily models.ModelFamily
	if targetModel != "" {
		modelFamily = models.DetectModelFamily(targetModel)
		logger.WithField("target_model", targetModel).WithField("detected_family", modelFamily).Info("Using specified target model")
	} else {
		// Use default target model from config
		defaultTargetModel := viper.GetString("generation.default_target_model")
		if defaultTargetModel != "" {
			targetModel = defaultTargetModel
			modelFamily = models.DetectModelFamily(targetModel)
			logger.WithField("target_model", targetModel).WithField("detected_family", modelFamily).Info("Using default target model from config")
		} else {
			modelFamily = models.ModelFamilyGeneric
			logger.Info("No target model specified, using generic optimization")
		}
	}

	// Get count from flag or config
	if count == 0 {
		count = viper.GetInt("generation.default_count")
	}
	logger.Debugf("Generation count: %d", count)

	// Get embedding dimensions from flag or config
	if embeddingDimensions == 0 {
		embeddingDimensions = viper.GetInt("generation.default_embedding_dimensions")
	}
	if embeddingDimensions > 0 {
		logger.WithField("embedding_dimensions", embeddingDimensions).Info("Using custom embedding dimensions")
	}

	// Initialize storage
	logger.Debug("Initializing storage")
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Error("Failed to close storage")
		}
	}()

	// Initialize providers
	logger.Debug("Initializing providers")
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Build phase configs
	phaseConfigs := buildPhaseConfigs(phaseList, provider)
	logger.Debugf("Phase configs: %v", phaseConfigs)

	// Initialize engine
	eng := engine.NewEngine(registry, logger)

	// Create request
	request := models.PromptRequest{
		Input:       input,
		Phases:      phaseList,
		Count:       count,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		Tags:        tagList,
		Context:     contextList,
	}

	// Generate prompts
	logger.Info("Generating prompts...")
	ctx := context.Background()
	result, err := eng.Generate(ctx, engine.GenerateOptions{
		Request:        request,
		PhaseConfigs:   phaseConfigs,
		UseParallel:    viper.GetBool("generation.use_parallel"),
		IncludeContext: true,
		Persona:        persona,
		TargetModel:    string(modelFamily),
	})

	if err != nil {
		return fmt.Errorf("generation failed: %w", err)
	}
	logger.Info("Prompt generation complete")

	// Rank prompts
	logger.Info("Ranking prompts...")
	ranker := ranking.NewRanker(store, logger)
	rankings, err := ranker.RankPrompts(ctx, result.Prompts, input)
	if err != nil {
		logger.WithError(err).Warn("Failed to rank prompts")
	} else {
		result.Rankings = rankings
		logger.Info("Prompt ranking complete")
	}

	// Save prompts if requested
	if savePrompt {
		logger.Info("Saving prompts...")
		for _, prompt := range result.Prompts {
			if err := store.SavePrompt(&prompt); err != nil {
				logger.WithError(err).Warn("Failed to save prompt")
			}
		}
		logger.Info("Prompt saving complete")
	}

	// Output results with persona information
	logger.Infof("Outputting results in %s format", outputFormat)
	return outputResults(result, outputFormat, personaObj, modelFamily)
}

func parsePhases(phasesStr string) []models.Phase {
	parts := strings.Split(phasesStr, ",")
	phases := make([]models.Phase, 0, len(parts))

	for _, part := range parts {
		phase := strings.TrimSpace(part)
		switch phase {
		case "idea":
			phases = append(phases, models.PhaseIdea)
		case "human":
			phases = append(phases, models.PhaseHuman)
		case "precision":
			phases = append(phases, models.PhasePrecision)
		}
	}

	return phases
}

func parseTags(tagsStr string) []string {
	if tagsStr == "" {
		return []string{}
	}

	parts := strings.Split(tagsStr, ",")
	tags := make([]string, 0, len(parts))

	for _, part := range parts {
		tag := strings.TrimSpace(part)
		if tag != "" {
			tags = append(tags, tag)
		}
	}

	return tags
}

func loadContext(files []string) ([]string, error) {
	// Implementation for loading context from files
	// For now, return empty
	return []string{}, nil
}

func initializeProviders(registry *providers.Registry) error {
	logger := log.GetLogger()
	logger.Debug("Initializing providers")

	// Initialize OpenAI
	if apiKey := viper.GetString("providers.openai.api_key"); apiKey != "" {
		logger.Debug("Initializing OpenAI provider")
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.openai.model"),
			BaseURL: viper.GetString("providers.openai.base_url"),
			Timeout: viper.GetInt("providers.openai.timeout"),
		}
		registry.Register(providers.ProviderOpenAI, providers.NewOpenAIProvider(config))
	}

	// Initialize OpenRouter
	if apiKey := viper.GetString("providers.openrouter.api_key"); apiKey != "" {
		logger.Debug("Initializing OpenRouter provider")
		config := providers.Config{
			APIKey:          apiKey,
			Model:           viper.GetString("providers.openrouter.model"),
			BaseURL:         viper.GetString("providers.openrouter.base_url"),
			Timeout:         viper.GetInt("providers.openrouter.timeout"),
			FallbackModels:  viper.GetStringSlice("providers.openrouter.fallback_models"),
			ProviderRouting: viper.GetStringMap("providers.openrouter.provider_routing"),
		}
		registry.Register(providers.ProviderOpenRouter, providers.NewOpenRouterProvider(config))
	}

	// Initialize Anthropic (Claude)
	if apiKey := viper.GetString("providers.anthropic.api_key"); apiKey != "" {
		logger.Debug("Initializing Anthropic provider")
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.anthropic.model"),
			BaseURL: viper.GetString("providers.anthropic.base_url"),
			Timeout: viper.GetInt("providers.anthropic.timeout"),
		}
		registry.Register(providers.ProviderAnthropic, providers.NewAnthropicProvider(config))
	}

	// Initialize Google (Gemini)
	if apiKey := viper.GetString("providers.google.api_key"); apiKey != "" {
		logger.Debug("Initializing Google provider")
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.google.model"),
			BaseURL: viper.GetString("providers.google.base_url"),
			Timeout: viper.GetInt("providers.google.timeout"),
		}
		registry.Register(providers.ProviderGoogle, providers.NewGoogleProvider(config))
	}

	// Initialize Ollama (Local AI)
	logger.Debug("Initializing Ollama provider")
	config := providers.Config{
		Model:   viper.GetString("providers.ollama.model"),
		BaseURL: viper.GetString("providers.ollama.base_url"),
		Timeout: viper.GetInt("providers.ollama.timeout"),
	}
	registry.Register(providers.ProviderOllama, providers.NewOllamaProvider(config))

	// Check if at least one provider is available
	if len(registry.ListAvailable()) == 0 {
		logger.Error("no providers configured")
		return fmt.Errorf("no providers configured, please set API keys in config or environment, or start Ollama service")
	}

	logger.Infof("Initialized providers: %v", registry.ListAvailable())
	return nil
}

func buildPhaseConfigs(phases []models.Phase, overrideProvider string) []providers.PhaseConfig {
	configs := make([]providers.PhaseConfig, 0, len(phases))

	for _, phase := range phases {
		provider := overrideProvider
		if provider == "" {
			// Use default provider for phase
			provider = viper.GetString(fmt.Sprintf("phases.%s.provider", phase))
		}

		configs = append(configs, providers.PhaseConfig{
			Phase:    phase,
			Provider: provider,
		})
	}

	return configs
}

func outputResults(result *models.GenerationResult, format string, persona *models.Persona, modelFamily models.ModelFamily) error {
	logger := log.GetLogger()
	switch format {
	case "json":
		data, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			logger.WithError(err).Error("Failed to marshal result to JSON")
			return err
		}
		fmt.Println(string(data))

	case "yaml":
		// For simplicity, using JSON for now
		// Can add proper YAML support later
		logger.Warn("YAML output is not yet supported, falling back to JSON")
		return outputResults(result, "json", persona, modelFamily)

	default: // text
		logger.Infof("Generated Prompts (Persona: %s, Target Model Family: %s):", persona.Name, modelFamily)
		logger.Infof("Optimization Strategy: %s", persona.Description)
		totalCost := 0.0

		for i, prompt := range result.Prompts {
			logger.Infof("[%d] Phase: %s | Provider: %s | Model: %s", i+1, prompt.Phase, prompt.Provider, prompt.Model)
			logger.Info(prompt.Content)

			// Show model metadata if available
			if prompt.ModelMetadata != nil {
				logger.Infof("  Generation Model: %s (%s)", prompt.ModelMetadata.GenerationModel, prompt.ModelMetadata.GenerationProvider)
				if prompt.ModelMetadata.EmbeddingModel != "" {
					logger.Infof("  Embedding Model: %s (%s)", prompt.ModelMetadata.EmbeddingModel, prompt.ModelMetadata.EmbeddingProvider)
				}
				logger.Infof("  Processing Time: %d ms", prompt.ModelMetadata.ProcessingTime)
				logger.Infof("  Tokens: %d input, %d output, %d total",
					prompt.ModelMetadata.InputTokens, prompt.ModelMetadata.OutputTokens, prompt.ModelMetadata.TotalTokens)
				if prompt.ModelMetadata.Cost > 0 {
					logger.Infof("  Estimated Cost: $%.6f", prompt.ModelMetadata.Cost)
					totalCost += prompt.ModelMetadata.Cost
				}
			} else {
				// Fallback for basic info
				logger.Infof("Token Usage: %d", prompt.ActualTokens)
			}

			// Show ranking if available
			for _, ranking := range result.Rankings {
				if ranking.Prompt.ID == prompt.ID {
					logger.Infof("Ranking Score: %.2f", ranking.Score)
					logger.Infof("- Temperature Score: %.2f", ranking.TemperatureScore)
					logger.Infof("- Token Score: %.2f", ranking.TokenScore)
					logger.Infof("- Context Score: %.2f", ranking.ContextScore)
					break
				}
			}
		}

		// Show cost summary
		if totalCost > 0 {
			logger.Infof("Total Estimated Cost: $%.6f", totalCost)
		}

		// Show best prompt if rankings available
		if len(result.Rankings) > 0 {
			best := result.Rankings[0]
			for _, r := range result.Rankings {
				if r.Score > best.Score {
					best = r
				}
			}

			logger.Infof("Best Prompt (Score: %.2f):", best.Score)
			logger.Infof("Model: %s | Phase: %s", best.Prompt.Model, best.Prompt.Phase)
			logger.Info(best.Prompt.Content)

			if best.Prompt.ModelMetadata != nil && best.Prompt.ModelMetadata.Cost > 0 {
				logger.Infof("Cost: $%.6f | Tokens: %d | Time: %d ms",
					best.Prompt.ModelMetadata.Cost,
					best.Prompt.ModelMetadata.TotalTokens,
					best.Prompt.ModelMetadata.ProcessingTime)
			}
		}
	}

	return nil
}
