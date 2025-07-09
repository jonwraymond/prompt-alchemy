package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	phases       string
	count        int
	temperature  float64
	maxTokens    int
	tags         string
	contextFiles []string
	provider     string
	outputFormat string
	savePrompt   bool
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
}

func runGenerate(cmd *cobra.Command, args []string) error {
	// Join args as input
	input := strings.Join(args, " ")

	// Parse phases
	phaseList := parsePhases(phases)
	if len(phaseList) == 0 {
		return fmt.Errorf("no valid phases specified")
	}

	// Parse tags
	tagList := parseTags(tags)

	// Load context
	contextList, err := loadContext(contextFiles)
	if err != nil {
		return fmt.Errorf("failed to load context: %w", err)
	}

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer store.Close()

	// Initialize providers
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Build phase configs
	phaseConfigs := buildPhaseConfigs(phaseList, provider)

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
	ctx := context.Background()
	result, err := eng.Generate(ctx, engine.GenerateOptions{
		Request:        request,
		PhaseConfigs:   phaseConfigs,
		UseParallel:    viper.GetBool("generation.use_parallel"),
		IncludeContext: true,
	})

	if err != nil {
		return fmt.Errorf("generation failed: %w", err)
	}

	// Rank prompts
	ranker := ranking.NewRanker(store, logger)
	rankings, err := ranker.RankPrompts(ctx, result.Prompts, input)
	if err != nil {
		logger.WithError(err).Warn("Failed to rank prompts")
	} else {
		result.Rankings = rankings
	}

	// Save prompts if requested
	if savePrompt {
		for _, prompt := range result.Prompts {
			if err := store.SavePrompt(&prompt); err != nil {
				logger.WithError(err).Warn("Failed to save prompt")
			}
		}
	}

	// Output results
	return outputResults(result, outputFormat)
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
	// Initialize OpenAI
	if apiKey := viper.GetString("providers.openai.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.openai.model"),
			BaseURL: viper.GetString("providers.openai.base_url"),
			Timeout: viper.GetInt("providers.openai.timeout"),
		}
		registry.Register("openai", providers.NewOpenAIProvider(config))
	}

	// Initialize OpenRouter
	if apiKey := viper.GetString("providers.openrouter.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.openrouter.model"),
			BaseURL: viper.GetString("providers.openrouter.base_url"),
			Timeout: viper.GetInt("providers.openrouter.timeout"),
		}
		registry.Register("openrouter", providers.NewOpenRouterProvider(config))
	}

	// Check if at least one provider is available
	if len(registry.ListAvailable()) == 0 {
		return fmt.Errorf("no providers configured, please set API keys in config or environment")
	}

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

func outputResults(result *models.GenerationResult, format string) error {
	switch format {
	case "json":
		data, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			return err
		}
		fmt.Println(string(data))

	case "yaml":
		// For simplicity, using JSON for now
		// Can add proper YAML support later
		return outputResults(result, "json")

	default: // text
		fmt.Println("Generated Prompts:")
		fmt.Println(strings.Repeat("=", 80))

		totalCost := 0.0

		for i, prompt := range result.Prompts {
			fmt.Printf("\n[%d] Phase: %s | Provider: %s | Model: %s\n", i+1, prompt.Phase, prompt.Provider, prompt.Model)
			fmt.Println(strings.Repeat("-", 40))
			fmt.Println(prompt.Content)

			// Show model metadata if available
			if prompt.ModelMetadata != nil {
				fmt.Printf("\nModel Details:\n")
				fmt.Printf("  Generation Model: %s (%s)\n", prompt.ModelMetadata.GenerationModel, prompt.ModelMetadata.GenerationProvider)
				if prompt.ModelMetadata.EmbeddingModel != "" {
					fmt.Printf("  Embedding Model: %s (%s)\n", prompt.ModelMetadata.EmbeddingModel, prompt.ModelMetadata.EmbeddingProvider)
				}
				fmt.Printf("  Processing Time: %d ms\n", prompt.ModelMetadata.ProcessingTime)
				fmt.Printf("  Tokens: %d input, %d output, %d total\n",
					prompt.ModelMetadata.InputTokens, prompt.ModelMetadata.OutputTokens, prompt.ModelMetadata.TotalTokens)
				if prompt.ModelMetadata.Cost > 0 {
					fmt.Printf("  Estimated Cost: $%.6f\n", prompt.ModelMetadata.Cost)
					totalCost += prompt.ModelMetadata.Cost
				}
			} else {
				// Fallback for basic info
				fmt.Printf("\nToken Usage: %d\n", prompt.ActualTokens)
			}

			// Show ranking if available
			for _, ranking := range result.Rankings {
				if ranking.Prompt.ID == prompt.ID {
					fmt.Printf("\nRanking Score: %.2f\n", ranking.Score)
					fmt.Printf("- Temperature Score: %.2f\n", ranking.TemperatureScore)
					fmt.Printf("- Token Score: %.2f\n", ranking.TokenScore)
					fmt.Printf("- Context Score: %.2f\n", ranking.ContextScore)
					break
				}
			}
		}

		fmt.Println("\n" + strings.Repeat("=", 80))

		// Show cost summary
		if totalCost > 0 {
			fmt.Printf("Total Estimated Cost: $%.6f\n", totalCost)
			fmt.Println(strings.Repeat("-", 40))
		}

		// Show best prompt if rankings available
		if len(result.Rankings) > 0 {
			best := result.Rankings[0]
			for _, r := range result.Rankings {
				if r.Score > best.Score {
					best = r
				}
			}

			fmt.Println("\nBest Prompt (Score: " + fmt.Sprintf("%.2f", best.Score) + "):")
			fmt.Printf("Model: %s | Phase: %s\n", best.Prompt.Model, best.Prompt.Phase)
			fmt.Println(strings.Repeat("-", 40))
			fmt.Println(best.Prompt.Content)

			if best.Prompt.ModelMetadata != nil && best.Prompt.ModelMetadata.Cost > 0 {
				fmt.Printf("\nCost: $%.6f | Tokens: %d | Time: %d ms\n",
					best.Prompt.ModelMetadata.Cost,
					best.Prompt.ModelMetadata.TotalTokens,
					best.Prompt.ModelMetadata.ProcessingTime)
			}
		}
	}

	return nil
}
