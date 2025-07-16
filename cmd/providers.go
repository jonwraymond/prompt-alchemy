package cmd

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// providersCmd represents the providers command
var providersCmd = &cobra.Command{
	Use:   "providers",
	Short: "List available providers and their capabilities",
	Long: `List all configured providers and show their capabilities including:
- Generation support
- Embedding support  
- Configuration status
- Available models`,
	RunE: runProviders,
}

func init() {
	// Command is added in root.go to avoid duplicate registration
}

func runProviders(cmd *cobra.Command, args []string) error {
	// Initialize providers
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	available := registry.ListAvailable()
	embeddingCapable := registry.ListEmbeddingCapableProviders()

	if len(available) == 0 {
		logger.Info("No providers configured.")
		fmt.Println("No providers configured. Please set API keys in config or environment.")
		return nil
	}

	fmt.Println("🚀 Prompt Alchemy Provider Status")
	fmt.Println("==================================")
	fmt.Println()

	// Create a tabwriter for nice formatting
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	if _, err := fmt.Fprintln(w, "Provider\tStatus\tGeneration\tEmbeddings\tModel\tEmbedding Model"); err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}
	if _, err := fmt.Fprintln(w, "--------\t------\t----------\t----------\t-----\t---------------"); err != nil {
		return fmt.Errorf("failed to write separator: %w", err)
	}

	allProviders := []string{"openai", "openrouter", "anthropic", "google", "ollama", "grok"}

	for _, providerName := range allProviders {
		provider, err := registry.Get(providerName)
		status := "❌ Not configured"
		generation := "❌"
		embeddings := "❌"
		model := "N/A"
		embeddingModel := "N/A"

		if err == nil && provider.IsAvailable() {
			status = "✅ Available"
			generation = "✅"

			if provider.SupportsEmbeddings() {
				embeddings = "✅"
				// Get embedding model for each provider
				switch providerName {
				case "openai":
					embeddingModel = viper.GetString("providers.openai.embedding_model")
					if embeddingModel == "" {
						embeddingModel = "text-embedding-3-small"
					}
				case "openrouter":
					embeddingModel = viper.GetString("providers.openrouter.embedding_model")
					if embeddingModel == "" {
						embeddingModel = "openai/text-embedding-3-small"
					}
				case "ollama":
					embeddingModel = viper.GetString("providers.ollama.embedding_model")
					if embeddingModel == "" {
						embeddingModel = "nomic-embed-text"
					}
				}
			} else {
				embeddings = "❌ (fallback available)"
				embeddingModel = "Uses fallback"
			}

			// Get configured model
			switch providerName {
			case "openai":
				model = viper.GetString("providers.openai.model")
			case "openrouter":
				model = viper.GetString("providers.openrouter.model")
			case "anthropic":
				model = viper.GetString("providers.anthropic.model")
			case "google":
				model = viper.GetString("providers.google.model")
			case "ollama":
				model = viper.GetString("providers.ollama.model")
			case "grok":
				model = viper.GetString("providers.grok.model")
			}

			if model == "" {
				model = "default"
			}
		}

		if _, err := fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\n", providerName, status, generation, embeddings, model, embeddingModel); err != nil {
			return fmt.Errorf("failed to write provider info: %w", err)
		}
	}

	if err := w.Flush(); err != nil {
		return fmt.Errorf("failed to flush output: %w", err)
	}
	fmt.Println()

	// Show embedding capabilities summary
	fmt.Println("📊 Embedding Support Summary")
	fmt.Println("============================")
	if len(embeddingCapable) > 0 {
		fmt.Printf("✅ Providers with native embedding support: %v\n", embeddingCapable)
	} else {
		fmt.Println("❌ No providers with native embedding support configured")
	}

	// Show fallback mechanism info
	fmt.Println()
	fmt.Println("🔄 Fallback Mechanism")
	fmt.Println("=====================")
	fmt.Println("• Providers without embedding support automatically use available embedding-capable providers")
	fmt.Println("• Current fallback priority: OpenAI → OpenRouter → Google → Ollama")
	fmt.Println("• Anthropic will use fallback for embeddings")

	// Show Ollama setup info if not available
	ollamaProvider, err := registry.Get("ollama")
	if err == nil && !ollamaProvider.IsAvailable() {
		fmt.Println()
		fmt.Println("🏠 Local AI Setup (Ollama)")
		fmt.Println("==========================")
		fmt.Println("• Ollama is not running. To use local AI:")
		fmt.Println("  1. Install Ollama: https://ollama.ai")
		fmt.Println("  2. Run: ollama serve")
		fmt.Println("  3. Pull a model: ollama pull llama2")
		fmt.Println("• Supported models: llama2, codellama, mistral, phi, gemma, etc.")
		fmt.Println("• Embedding models: nomic-embed-text, mxbai-embed-large")
	}

	// Show phase assignments
	fmt.Println()
	fmt.Println("🎯 Current Phase Assignments")
	fmt.Println("============================")
	fmt.Printf("• Prima Materia Phase: %s\n", viper.GetString("phases.prima-materia.provider"))
	fmt.Printf("• Solutio Phase: %s\n", viper.GetString("phases.solutio.provider"))
	fmt.Printf("• Coagulatio Phase: %s\n", viper.GetString("phases.coagulatio.provider"))

	return nil
}
