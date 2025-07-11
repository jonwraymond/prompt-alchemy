package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	searchPhase      string
	searchProvider   string
	searchModel      string
	searchTags       string
	searchSince      string
	searchLimit      int
	searchSemantic   bool
	searchSimilarity float64
	searchOutput     string
)

// SearchResult represents the search results for JSON output
type SearchResult struct {
	Query      string         `json:"query,omitempty"`
	SearchType string         `json:"search_type"`
	Count      int            `json:"count"`
	Prompts    []PromptResult `json:"prompts"`
}

// PromptResult represents a single prompt in search results
type PromptResult struct {
	ID          string    `json:"id"`
	Content     string    `json:"content"`
	Phase       string    `json:"phase"`
	Provider    string    `json:"provider"`
	Model       string    `json:"model"`
	Temperature float64   `json:"temperature"`
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"created_at"`
	Similarity  *float64  `json:"similarity,omitempty"`
}

// searchCmd represents the search command
var searchCmd = &cobra.Command{
	Use:   "search [query]",
	Short: "Search existing prompts",
	Long: `Search through saved prompts using text-based or semantic search.

Examples:
  # Text-based search with filters
  prompt-alchemy search "authentication" --phase idea --provider openai --limit 10

  # Semantic search using embeddings
  prompt-alchemy search "login security" --semantic --similarity 0.7 --limit 5

  # Search by tags and time range
  prompt-alchemy search --tags "technical,docs" --since "2024-01-01" --limit 20

  # Search with specific model
  prompt-alchemy search "API design" --model "o4-mini" --output json`,
	Args: cobra.MaximumNArgs(1),
	RunE: runSearch,
}

func init() {
	searchCmd.Flags().StringVar(&searchPhase, "phase", "", "Filter by phase: prima-materia (brainstorming), solutio (natural flow), coagulatio (precision)")
	searchCmd.Flags().StringVar(&searchProvider, "provider", "", "Filter by provider (openai, anthropic, google, openrouter)")
	searchCmd.Flags().StringVar(&searchModel, "model", "", "Filter by model")
	searchCmd.Flags().StringVar(&searchTags, "tags", "", "Filter by tags (comma-separated)")
	searchCmd.Flags().StringVar(&searchSince, "since", "", "Filter by creation date (YYYY-MM-DD)")
	searchCmd.Flags().IntVar(&searchLimit, "limit", 10, "Maximum number of results")
	searchCmd.Flags().BoolVar(&searchSemantic, "semantic", false, "Use semantic search with embeddings")
	searchCmd.Flags().Float64Var(&searchSimilarity, "similarity", 0.5, "Minimum similarity threshold for semantic search (0.0-1.0)")
	searchCmd.Flags().StringVar(&searchOutput, "output", "text", "Output format (text, json)")
}

func runSearch(cmd *cobra.Command, args []string) error {
	query := ""
	if len(args) > 0 {
		query = args[0]
	}

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

	// Parse tags
	var tagList []string
	if searchTags != "" {
		tagList = strings.Split(searchTags, ",")
		for i, tag := range tagList {
			tagList[i] = strings.TrimSpace(tag)
		}
	}

	// Parse since date
	var sinceTime *time.Time
	if searchSince != "" {
		parsed, err := time.Parse(DateFormatISO, searchSince)
		if err != nil {
			return fmt.Errorf("invalid date format for --since (use YYYY-MM-DD): %w", err)
		}
		sinceTime = &parsed
	}

	if searchSemantic && query != "" {
		// Semantic search using embeddings
		return runSemanticSearch(store, query, tagList, sinceTime)
	} else {
		// Text-based search
		return runTextSearch(store, query, tagList, sinceTime)
	}
}

func runTextSearch(store *storage.Storage, query string, tagList []string, sinceTime *time.Time) error {
	criteria := storage.SearchCriteria{
		Phase:    searchPhase,
		Provider: searchProvider,
		Model:    searchModel,
		Tags:     tagList,
		Since:    sinceTime,
		Limit:    searchLimit,
	}

	prompts, err := store.SearchPrompts(criteria)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	// Filter by query if provided (simple text matching)
	if query != "" {
		filtered := make([]models.Prompt, 0)
		queryLower := strings.ToLower(query)

		for _, prompt := range prompts {
			contentLower := strings.ToLower(prompt.Content)
			if strings.Contains(contentLower, queryLower) {
				filtered = append(filtered, prompt)
			}
		}
		prompts = filtered
	}

	return outputSearchResults(prompts, nil, query)
}

func runSemanticSearch(store *storage.Storage, query string, tagList []string, sinceTime *time.Time) error {
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

	ctx := context.Background()
	queryEmbedding, err := embeddingProvider.GetEmbedding(ctx, query, registry)
	if err != nil {
		return fmt.Errorf("failed to get query embedding: %w", err)
	}

	criteria := storage.SemanticSearchCriteria{
		Query:          query,
		QueryEmbedding: queryEmbedding,
		Limit:          searchLimit,
		MinSimilarity:  searchSimilarity,
		Phase:          searchPhase,
		Provider:       searchProvider,
		Model:          searchModel,
		Tags:           tagList,
		Since:          sinceTime,
	}

	prompts, similarities, err := store.SearchPromptsSemanticFast(criteria)
	if err != nil {
		return fmt.Errorf("semantic search failed: %w", err)
	}

	return outputSearchResults(prompts, similarities, query)
}

func outputSearchResults(prompts []models.Prompt, similarities []float64, query string) error {
	if searchOutput == "json" {
		return outputSearchResultsJSON(prompts, similarities, query)
	}

	// Text output
	if len(prompts) == 0 {
		fmt.Println("No prompts found matching the search criteria.")
		return nil
	}

	searchType := "Text Search"
	if similarities != nil {
		searchType = "Semantic Search"
	}

	fmt.Printf("%s Results", searchType)
	if query != "" {
		fmt.Printf(" for: %q", query)
	}
	fmt.Printf(" (%d found)\n", len(prompts))
	fmt.Println(strings.Repeat("=", 80))

	for i, prompt := range prompts {
		fmt.Printf("\n[%d] %s | %s | %s\n", i+1, prompt.Phase, prompt.Provider, prompt.Model)

		if similarities != nil {
			fmt.Printf("Similarity: %.3f\n", similarities[i])
		}

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

func outputSearchResultsJSON(prompts []models.Prompt, similarities []float64, query string) error {
	searchType := "text"
	if similarities != nil {
		searchType = "semantic"
	}

	results := SearchResult{
		Query:      query,
		SearchType: searchType,
		Count:      len(prompts),
		Prompts:    make([]PromptResult, len(prompts)),
	}

	for i, prompt := range prompts {
		result := PromptResult{
			ID:          prompt.ID.String(),
			Content:     prompt.Content,
			Phase:       string(prompt.Phase),
			Provider:    prompt.Provider,
			Model:       prompt.Model,
			Temperature: prompt.Temperature,
			Tags:        prompt.Tags,
			CreatedAt:   prompt.CreatedAt,
		}

		if similarities != nil {
			result.Similarity = &similarities[i]
		}

		results.Prompts[i] = result
	}

	data, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(data))
	return nil
}
