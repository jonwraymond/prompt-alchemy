package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/client"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	searchTags     string
	searchLimit    int
	searchSemantic bool
	searchOutput   string
)

// SearchResult represents the search results for JSON output
type SearchResult struct {
	Query      string           `json:"query,omitempty"`
	SearchType string           `json:"search_type"`
	Count      int              `json:"count"`
	Prompts    []*models.Prompt `json:"prompts"`
}

// searchCmd represents the search command
var searchCmd = &cobra.Command{
	Use:   "search [query]",
	Short: "Search existing prompts",
	Long: `Search through saved prompts using text-based or semantic search.

Examples:
  # General-purpose listing of high-quality prompts
  prompt-alchemy search --limit 20

  # Semantic search using embeddings
  prompt-alchemy search "login security" --semantic --limit 5

  # Search by tags
  prompt-alchemy search --tags "technical,docs" --limit 20`,
	Args: cobra.MaximumNArgs(1),
	RunE: runSearch,
}

func init() {
	searchCmd.Flags().StringVar(&searchTags, "tags", "", "Filter by tags (comma-separated)")
	searchCmd.Flags().IntVar(&searchLimit, "limit", 10, "Maximum number of results")
	searchCmd.Flags().BoolVar(&searchSemantic, "semantic", false, "Use semantic search with embeddings")
	searchCmd.Flags().StringVar(&searchOutput, "output", "text", "Output format (text, json)")

	// Client mode flag (overrides config)
	searchCmd.Flags().String("server", "", "Server URL for client mode (overrides config and enables client mode)")
}

func runSearch(cmd *cobra.Command, args []string) error {
	query := ""
	if len(args) > 0 {
		query = args[0]
	}

	// Client mode is not supported for this simplified command
	if client.IsServerMode() || viper.GetString("client.mode") == "client" {
		return fmt.Errorf("search command does not support client mode in this version")
	}

	return runSearchLocal(cmd, query)
}

func runSearchLocal(cmd *cobra.Command, query string) error {
	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close storage")
		}
	}()

	if searchSemantic && query != "" {
		// Semantic search using embeddings
		return runSemanticSearch(cmd.Context(), store, query)
	} else {
		// General-purpose listing
		return runGeneralSearch(cmd.Context(), store, query)
	}
}

func runGeneralSearch(ctx context.Context, store *storage.Storage, query string) error {
	prompts, err := store.GetHighQualityHistoricalPrompts(ctx, searchLimit)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	// Post-filter by query and tags if provided
	var filteredPrompts []*models.Prompt
	queryLower := strings.ToLower(query)
	tagList := strings.Split(searchTags, ",")

	for _, p := range prompts {
		contentLower := strings.ToLower(p.Content)
		if (query == "" || strings.Contains(contentLower, queryLower)) &&
			(searchTags == "" || hasTags(p.Tags, tagList)) {
			filteredPrompts = append(filteredPrompts, p)
		}
	}

	return outputSearchResults(filteredPrompts, "general")
}

func runSemanticSearch(ctx context.Context, store *storage.Storage, query string) error {
	// Initialize providers to get embeddings
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Get embedding for the query
	embeddingProvider, err := registry.Get(providers.ProviderOpenAI) // Default to OpenAI for embeddings
	if err != nil {
		return fmt.Errorf("failed to get embedding provider: %w", err)
	}

	if !embeddingProvider.SupportsEmbeddings() {
		return fmt.Errorf("embedding provider does not support embeddings")
	}

	queryEmbedding, err := embeddingProvider.GetEmbedding(ctx, query, registry)
	if err != nil {
		return fmt.Errorf("failed to get query embedding: %w", err)
	}

	prompts, err := store.SearchSimilarPrompts(ctx, queryEmbedding, searchLimit)
	if err != nil {
		return fmt.Errorf("semantic search failed: %w", err)
	}

	return outputSearchResults(prompts, "semantic")
}

func outputSearchResults(prompts []*models.Prompt, searchType string) error {
	if searchOutput == "json" {
		return outputSearchResultsJSON(prompts, searchType)
	}

	// Text output
	if len(prompts) == 0 {
		fmt.Println("No prompts found matching the search criteria.")
		return nil
	}

	caser := cases.Title(language.English)
	fmt.Printf("%s Results (%d found)\n", caser.String(searchType), len(prompts))
	fmt.Println(strings.Repeat("=", 80))

	for i, prompt := range prompts {
		fmt.Printf("\n[%d] %s | %s | %s\n", i+1, prompt.Phase, prompt.Provider, prompt.Model)
		fmt.Printf("Created: %s\n", prompt.CreatedAt.Format(TimeFormat))

		if len(prompt.Tags) > 0 {
			fmt.Printf("Tags: %s\n", strings.Join(prompt.Tags, ", "))
		}

		fmt.Printf("ID: %s\n", prompt.ID.String())
		fmt.Println(strings.Repeat("-", 40))

		// Show content preview (first 200 characters)
		content := prompt.Content
		if len(content) > 200 {
			content = content[:200] + "..."
		}
		fmt.Printf("%s\n", content)
		fmt.Println(strings.Repeat("-", 80))
	}

	return nil
}

func outputSearchResultsJSON(prompts []*models.Prompt, searchType string) error {
	results := SearchResult{
		SearchType: searchType,
		Count:      len(prompts),
		Prompts:    prompts,
	}

	data, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(data))
	return nil
}

func hasTags(promptTags, searchTags []string) bool {
	for _, st := range searchTags {
		found := false
		for _, pt := range promptTags {
			if strings.TrimSpace(st) == pt {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}
