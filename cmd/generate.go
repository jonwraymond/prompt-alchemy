package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"bufio"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/helpers"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/client"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
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
	optimize            bool
	optimizeTargetScore float64
	optimizeMaxIter     int
)

// generateCmd represents the generate command
var generateCmd = &cobra.Command{
	Use:   "generate [input]",
	Short: "Transmute raw ideas into golden prompts through alchemical transformation",
	Long: `Generate AI prompts through the ancient art of prompt alchemy:
- Prima Materia: Extract pure essence from raw materials to create the foundation stone
- Solutio: Dissolve rigid structures into flowing, natural language
- Coagulatio: Crystallize the dissolved essence into its most potent, refined form`,
	Args: cobra.MinimumNArgs(1),
	RunE: runGenerate,
}

func init() {
	generateCmd.Flags().StringVarP(&phases, "phases", "p", "prima-materia,solutio,coagulatio", "Alchemical phases: prima-materia (brainstorming), solutio (natural flow), coagulatio (precision)")
	generateCmd.Flags().IntVarP(&count, "count", "c", 3, "Number of prompt variants to generate")
	generateCmd.Flags().Float64VarP(&temperature, "temperature", "t", 0.7, "Temperature for generation")
	generateCmd.Flags().IntVarP(&maxTokens, "max-tokens", "m", 2000, "Maximum tokens for generation")
	generateCmd.Flags().StringVar(&tags, "tags", "", "Tags for the prompt (comma-separated)")
	generateCmd.Flags().StringSliceVar(&contextFiles, "context", []string{}, "Context files to include")
	generateCmd.Flags().StringVar(&provider, "provider", "", "Override default provider for all phases")
	generateCmd.Flags().StringVarP(&outputFormat, "output", "o", "text", "Output format (text, json, yaml)")
	generateCmd.Flags().BoolVar(&savePrompt, "save", true, "Save generated prompts to database")
	generateCmd.Flags().StringVar(&persona, "persona", "code", "AI persona to use (code, writing, analysis, generic)")
	generateCmd.Flags().StringVar(&targetModel, "target-model", "", "Target model family for optimization (claude-4-sonnet-20250522, o4-mini, gemini-2.5-flash, etc.)")
	generateCmd.Flags().IntVar(&embeddingDimensions, "embedding-dimensions", 0, "Embedding dimensions for similarity search (uses config default if not specified)")
	generateCmd.Flags().BoolVar(&optimize, "optimize", false, "Enable AI-powered optimization with LLM-as-Judge and meta-prompting")
	generateCmd.Flags().Float64Var(&optimizeTargetScore, "optimize-target-score", 8.5, "Target quality score for optimization (1-10)")
	generateCmd.Flags().IntVar(&optimizeMaxIter, "optimize-max-iterations", 3, "Maximum optimization iterations per phase")

	// Client mode flag (overrides config)
	generateCmd.Flags().String("server", "", "Server URL for client mode (overrides config and enables client mode)")

	// Bind flags to viper for configuration file support
	_ = viper.BindPFlag("generation.default_phases", generateCmd.Flags().Lookup("phases"))
	_ = viper.BindPFlag("generation.default_count", generateCmd.Flags().Lookup("count"))
	_ = viper.BindPFlag("generation.default_temperature", generateCmd.Flags().Lookup("temperature"))
	_ = viper.BindPFlag("generation.default_max_tokens", generateCmd.Flags().Lookup("max-tokens"))
	_ = viper.BindPFlag("generation.default_provider", generateCmd.Flags().Lookup("provider"))
	_ = viper.BindPFlag("generation.default_persona", generateCmd.Flags().Lookup("persona"))
	_ = viper.BindPFlag("generation.default_target_model", generateCmd.Flags().Lookup("target-model"))
	_ = viper.BindPFlag("generation.default_embedding_dimensions", generateCmd.Flags().Lookup("embedding-dimensions"))
}

func runGenerate(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Starting prompt generation")

	// Join args as input
	input := strings.Join(args, " ")
	logger.Debugf("Input prompt: %s", input)

	// Check execution mode
	mode := viper.GetString("client.mode")
	serverFlag, _ := cmd.Flags().GetString("server")

	// Use client mode if explicitly set or if --server flag is provided
	if mode == "client" || client.IsServerMode() || serverFlag != "" {
		return runGenerateClient(cmd, args, input)
	}

	return runGenerateLocal(cmd, args, input)
}

func runGenerateClient(cmd *cobra.Command, args []string, input string) error {
	logger := log.GetLogger()
	logger.Info("Running in client mode")

	// Create client (check for --server flag override)
	var c *client.Client
	if serverFlag, _ := cmd.Flags().GetString("server"); serverFlag != "" {
		c = client.NewClientWithURL(serverFlag, logger)
		logger.Infof("Using server from flag: %s", serverFlag)
	} else {
		c = client.NewClient(logger)
	}

	// Check server health first
	ctx := context.Background()
	health, err := c.Health(ctx)
	if err != nil {
		return fmt.Errorf("server health check failed: %w", err)
	}
	logger.Infof("Connected to server: %s (version: %s)", health.Status, health.Version)

	// Parse phases and tags for client request
	phaseList := helpers.ParsePhases(phases)
	phaseStrings := make([]string, len(phaseList))
	for i, phase := range phaseList {
		phaseStrings[i] = string(phase)
	}
	tagList := parseTags(tags)

	// Create client request
	req := client.GenerateRequest{
		Input:       input,
		Phases:      phaseStrings,
		Count:       count,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		Tags:        tagList,
		Persona:     persona,
		TargetModel: targetModel,
	}

	// Generate via server
	result, err := c.Generate(ctx, req)
	if err != nil {
		return fmt.Errorf("client generation failed: %w", err)
	}

	// For client mode, we'll use a simplified output since we don't have local storage
	return outputClientResults(result, outputFormat)
}

func runGenerateLocal(cmd *cobra.Command, args []string, input string) error {
	logger := log.GetLogger()
	logger.Info("Running in local mode")

	// Parse phases
	phaseList := helpers.ParsePhases(phases)
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

	// Validate temperature range (general validation, providers may have stricter limits)
	if temperature < 0 || temperature > 2.0 {
		return fmt.Errorf("temperature must be between 0 and 2.0, got %f", temperature)
	}
	logger.Debugf("Temperature: %f", temperature)

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

	// Initialize storage only if we need to save prompts
	var store *storage.Storage
	if savePrompt {
		logger.Debug("Initializing storage")
		var err error
		store, err = storage.NewStorage(viper.GetString("data_dir"), logger)
		if err != nil {
			return fmt.Errorf("failed to initialize storage: %w", err)
		}
		defer func() {
			if err := store.Close(); err != nil {
				logger.WithError(err).Error("Failed to close storage")
			}
		}()

		// Set embedding configuration from config if available
		embeddingProvider := viper.GetString("embeddings.provider")
		embeddingModel := viper.GetString("embeddings.model")
		embeddingDims := viper.GetInt("embeddings.dimensions")
		if embeddingProvider != "" && embeddingModel != "" && embeddingDims > 0 {
			store.SetEmbeddingConfig(embeddingProvider, embeddingModel, embeddingDims)
			logger.WithFields(map[string]interface{}{
				"provider": embeddingProvider,
				"model":    embeddingModel,
				"dims":     embeddingDims,
			}).Info("Set embedding configuration from config")
		}
	}

	// Initialize providers
	logger.Debug("Initializing providers")
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Build phase configs
	phaseConfigs := helpers.BuildPhaseConfigs(phaseList, provider)
	logger.Debugf("Phase configs: %v", phaseConfigs)

	// Initialize engine
	eng := engine.NewEngine(registry, logger)
	if store != nil {
		eng.SetStorage(store)
	}

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

	sessionID := uuid.New()
	request.SessionID = sessionID // Assuming PromptRequest has SessionID field; add if not

	// Generate prompts
	logger.Info("Generating prompts...")
	ctx := context.Background()
	result, err := eng.Generate(ctx, models.GenerateOptions{
		Request:             request,
		PhaseConfigs:        phaseConfigs,
		UseParallel:         viper.GetBool("generation.use_parallel"),
		IncludeContext:      true,
		Persona:             persona,
		TargetModel:         string(modelFamily),
		Optimize:            optimize,
		OptimizeTargetScore: optimizeTargetScore,
		OptimizeMaxIter:     optimizeMaxIter,
	})

	if err != nil {
		return fmt.Errorf("generation failed: %w", err)
	}
	logger.Info("Prompt generation complete")

	// Assign session to all generated prompts
	for i := range result.Prompts {
		result.Prompts[i].SessionID = sessionID
	}

	// Rank prompts
	logger.Info("Ranking prompts...")
	ranker := ranking.NewRanker(store, registry, logger)
	defer func() {
		if err := ranker.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close ranker")
		}
	}()
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
			if err := store.SavePrompt(cmd.Context(), &prompt); err != nil {
				logger.WithError(err).Warn("Failed to save prompt")
			}
		}
		logger.Info("Prompt saving complete")
	}

	// Output results with persona information
	logger.Infof("Outputting results in %s format", outputFormat)
	return outputResults(ctx, store, result, outputFormat, personaObj, modelFamily)
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
		if err := registry.Register(providers.ProviderOpenAI, providers.NewOpenAIProvider(config)); err != nil {
			logger.Warn("Failed to register OpenAI provider", "error", err)
		}
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
		if err := registry.Register(providers.ProviderOpenRouter, providers.NewOpenRouterProvider(config)); err != nil {
			logger.Warn("Failed to register OpenRouter provider", "error", err)
		}
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
		if err := registry.Register(providers.ProviderAnthropic, providers.NewAnthropicProvider(config)); err != nil {
			logger.Warn("Failed to register Anthropic provider", "error", err)
		}
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
		if err := registry.Register(providers.ProviderGoogle, providers.NewGoogleProvider(config)); err != nil {
			logger.Warn("Failed to register Google provider", "error", err)
		}
	}

	// Initialize Ollama (Local AI)
	logger.Debug("Initializing Ollama provider")
	config := providers.Config{
		Model:   viper.GetString("providers.ollama.model"),
		BaseURL: viper.GetString("providers.ollama.base_url"),
		Timeout: viper.GetInt("providers.ollama.timeout"),
	}
	if err := registry.Register(providers.ProviderOllama, providers.NewOllamaProvider(config)); err != nil {
		logger.Warn("Failed to register Ollama provider", "error", err)
	}

	// Initialize Grok (xAI)
	if apiKey := viper.GetString("providers.grok.api_key"); apiKey != "" {
		logger.Debug("Initializing Grok provider")
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.grok.model"),
			BaseURL: viper.GetString("providers.grok.base_url"),
			Timeout: viper.GetInt("providers.grok.timeout"),
		}
		if err := registry.Register(providers.ProviderGrok, providers.NewGrokProvider(config)); err != nil {
			logger.Warn("Failed to register Grok provider", "error", err)
		}
	}

	// Check if at least one provider is available
	if len(registry.ListAvailable()) == 0 {
		logger.Error("no providers configured")
		return fmt.Errorf("no providers configured, please set API keys in config or environment, or start Ollama service")
	}

	logger.Infof("Initialized providers: %v", registry.ListAvailable())
	return nil
}

func outputResults(ctx context.Context, store *storage.Storage, result *models.GenerationResult, format string, persona *models.Persona, modelFamily models.ModelFamily) error {
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
		return outputResults(ctx, store, result, "json", persona, modelFamily)

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

		// Interactive selection for text mode
		fmt.Println("\nSelect a prompt to use (enter number, 0 to skip):")
		reader := bufio.NewReader(os.Stdin)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		sel, err := strconv.Atoi(input)
		if err != nil || sel < 0 || sel > len(result.Prompts) {
			logger.Info("No selection made")
			return nil
		}
		if sel == 0 {
			logger.Info("Selection skipped")
			return nil
		}

		chosen := result.Prompts[sel-1]
		logger.Infof("Selected prompt %d: %s", sel, chosen.ID)

		// Save interactions
		for i, p := range result.Prompts {
			inter := &models.UserInteraction{
				PromptID:  p.ID,
				SessionID: result.SessionID, // Assuming added to GenerationResult
				Action:    "skipped",
				Score:     0,
			}
			if i == sel-1 {
				inter.Action = "chosen"
				inter.Score = 1
			}
			if err := store.SaveInteraction(ctx, inter); err != nil {
				logger.WithError(err).Warn("Failed to save interaction for prompt ", p.ID)
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

func outputClientResults(result *models.GenerationResult, format string) error {
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
		logger.Warn("YAML output is not yet supported, falling back to JSON")
		return outputClientResults(result, "json")

	default: // text
		logger.Info("Generated Prompts:")
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
					break
				}
			}
		}

		// Show cost summary
		if totalCost > 0 {
			logger.Infof("Total Estimated Cost: $%.6f", totalCost)
		}

		// Note: Interactive selection disabled in client mode for simplicity
		logger.Info("(Interactive selection not available in client mode)")
	}

	return nil
}
