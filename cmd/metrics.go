package cmd

import (
	"encoding/json"
	"fmt"
	"time"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	metricsPhase    string
	metricsProvider string
	metricsSince    string
	metricsLimit    int
	metricsOutput   string
	metricsReport   string
)

// MetricsResult represents metrics data for JSON output
type MetricsResult struct {
	Summary    MetricsSummary         `json:"summary"`
	Breakdown  MetricsBreakdown       `json:"breakdown"`
	TopPrompts []TopPrompt            `json:"top_prompts"`
	Metrics    []models.PromptMetrics `json:"metrics,omitempty"`
}

// MetricsSummary contains overall statistics
type MetricsSummary struct {
	TotalPrompts          int     `json:"total_prompts"`
	TotalCost             float64 `json:"total_cost"`
	TotalTokens           int     `json:"total_tokens"`
	AverageTokens         float64 `json:"average_tokens"`
	AverageProcessingTime int     `json:"average_processing_time_ms"`
	WithEmbeddings        int     `json:"prompts_with_embeddings"`
	EmbeddingCoverage     float64 `json:"embedding_coverage_percent"`
}

// MetricsBreakdown contains breakdowns by different dimensions
type MetricsBreakdown struct {
	ByPhase    map[string]int `json:"by_phase"`
	ByProvider map[string]int `json:"by_provider"`
	ByModel    map[string]int `json:"by_model"`
	ByDate     map[string]int `json:"by_date"`
}

// TopPrompt represents a high-performing prompt
type TopPrompt struct {
	ID             string    `json:"id"`
	Content        string    `json:"content_preview"`
	Phase          string    `json:"phase"`
	Provider       string    `json:"provider"`
	Model          string    `json:"model"`
	Tokens         int       `json:"tokens"`
	Cost           float64   `json:"cost"`
	CreatedAt      time.Time `json:"created_at"`
	ProcessingTime int       `json:"processing_time_ms"`
}

// metricsCmd represents the metrics command
var metricsCmd = &cobra.Command{
	Use:   "metrics",
	Short: "View prompt performance metrics",
	Long: `View comprehensive prompt performance metrics and analytics including:
- Token usage and cost analysis
- Performance by phase, provider, and model
- Processing time statistics
- Embedding coverage analysis
- Top performing prompts

Examples:
  # View overall metrics
  prompt-alchemy metrics

  # View metrics for specific phase
  prompt-alchemy metrics --phase idea --limit 20

  # View metrics since specific date
  prompt-alchemy metrics --since "2024-01-01" --output json

  # Generate weekly report
  prompt-alchemy metrics --report weekly`,
	RunE: runMetrics,
}

func init() {
	metricsCmd.Flags().StringVar(&metricsPhase, "phase", "", "Filter by phase: prima-materia (brainstorming), solutio (natural flow), coagulatio (precision)")
	metricsCmd.Flags().StringVar(&metricsProvider, "provider", "", "Filter by provider")
	metricsCmd.Flags().StringVar(&metricsSince, "since", "", "Filter by creation date (YYYY-MM-DD)")
	metricsCmd.Flags().IntVar(&metricsLimit, "limit", 100, "Maximum number of prompts to analyze")
	metricsCmd.Flags().StringVar(&metricsOutput, "output", "text", "Output format (text, json)")
	metricsCmd.Flags().StringVar(&metricsReport, "report", "", "Generate report (daily, weekly, monthly)")
}

func runMetrics(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Starting metrics command")
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

	// Parse since date
	var sinceTime *time.Time
	if metricsSince != "" {
		parsed, err := time.Parse(DateFormatISO, metricsSince)
		if err != nil {
			return fmt.Errorf("invalid date format for --since (use YYYY-MM-DD): %w", err)
		}
		sinceTime = &parsed
		logger.Debugf("Parsed since time: %v", sinceTime)
	} else if metricsReport != "" {
		// Set default time range based on report type
		now := time.Now()
		switch metricsReport {
		case "daily":
			since := now.AddDate(0, 0, -1)
			sinceTime = &since
		case "weekly":
			since := now.AddDate(0, 0, -7)
			sinceTime = &since
		case "monthly":
			since := now.AddDate(0, -1, 0)
			sinceTime = &since
		}
		logger.Debugf("Report type '%s' set since time to: %v", metricsReport, sinceTime)
	}

	// Get prompts for analysis
	prompts, err := store.GetHighQualityHistoricalPrompts(cmd.Context(), metricsLimit)
	if err != nil {
		return fmt.Errorf("failed to fetch prompts: %w", err)
	}
	logger.Infof("Found %d prompts to analyze", len(prompts))

	// Analyze prompts and generate report
	result := analyzePrompts(prompts, nil)

	if metricsOutput == "json" {
		return outputMetricsJSON(result)
	}

	return outputMetricsText(result, metricsReport)
}

func analyzePrompts(prompts []*models.Prompt, metrics []models.PromptMetrics) MetricsResult {
	logger := log.GetLogger()
	logger.Debugf("Analyzing %d prompts", len(prompts))
	summary := MetricsSummary{
		TotalPrompts: len(prompts),
	}

	breakdown := MetricsBreakdown{
		ByPhase:    make(map[string]int),
		ByProvider: make(map[string]int),
		ByModel:    make(map[string]int),
		ByDate:     make(map[string]int),
	}

	var topPrompts []TopPrompt
	var totalTokens, totalProcessingTime int
	var totalCost float64
	var embeddingCount int

	for _, prompt := range prompts {
		// Update breakdown counters
		breakdown.ByPhase[string(prompt.Phase)]++
		breakdown.ByProvider[prompt.Provider]++
		breakdown.ByModel[prompt.Model]++
		breakdown.ByDate[prompt.CreatedAt.Format("2006-01-02")]++

		// Count embeddings
		if len(prompt.Embedding) > 0 {
			embeddingCount++
		}

		// Accumulate totals
		totalTokens += prompt.ActualTokens

		// Get metadata if available
		if prompt.ModelMetadata != nil {
			totalCost += prompt.ModelMetadata.Cost
			totalProcessingTime += prompt.ModelMetadata.ProcessingTime

			// Add to top prompts (we'll sort later)
			contentPreview := prompt.Content
			if len(contentPreview) > 100 {
				contentPreview = contentPreview[:100] + "..."
			}

			topPrompts = append(topPrompts, TopPrompt{
				ID:             prompt.ID.String(),
				Content:        contentPreview,
				Phase:          string(prompt.Phase),
				Provider:       prompt.Provider,
				Model:          prompt.Model,
				Tokens:         prompt.ModelMetadata.TotalTokens,
				Cost:           prompt.ModelMetadata.Cost,
				CreatedAt:      prompt.CreatedAt,
				ProcessingTime: prompt.ModelMetadata.ProcessingTime,
			})
		}
	}

	// Calculate averages
	if len(prompts) > 0 {
		summary.AverageTokens = float64(totalTokens) / float64(len(prompts))
		summary.AverageProcessingTime = totalProcessingTime / len(prompts)
		summary.EmbeddingCoverage = (float64(embeddingCount) / float64(len(prompts))) * 100
	}

	summary.TotalCost = totalCost
	summary.TotalTokens = totalTokens
	summary.WithEmbeddings = embeddingCount

	// Sort top prompts by cost (descending) and take top 10
	for i := 0; i < len(topPrompts)-1; i++ {
		for j := i + 1; j < len(topPrompts); j++ {
			if topPrompts[j].Cost > topPrompts[i].Cost {
				topPrompts[i], topPrompts[j] = topPrompts[j], topPrompts[i]
			}
		}
	}

	if len(topPrompts) > 10 {
		topPrompts = topPrompts[:10]
	}

	logger.Debugf("Analysis complete. Summary: %+v", summary)
	return MetricsResult{
		Summary:    summary,
		Breakdown:  breakdown,
		TopPrompts: topPrompts,
		Metrics:    metrics,
	}
}

func outputMetricsText(result MetricsResult, reportType string) error {
	logger := log.GetLogger()
	title := "Prompt Alchemy Metrics"
	if reportType != "" {
		title = fmt.Sprintf("Prompt Alchemy %s Report", cases.Title(language.English).String(reportType))
	}

	logger.Info(title)

	// Summary section
	logger.Info("📊 Summary")
	logger.Infof("Total Prompts: %d", result.Summary.TotalPrompts)
	logger.Infof("Total Tokens: %s", formatNumber(result.Summary.TotalTokens))
	logger.Infof("Average Tokens: %.1f", result.Summary.AverageTokens)
	logger.Infof("Total Cost: $%.4f", result.Summary.TotalCost)
	logger.Infof("Average Processing Time: %d ms", result.Summary.AverageProcessingTime)
	logger.Infof("Embedding Coverage: %.1f%% (%d/%d)",
		result.Summary.EmbeddingCoverage,
		result.Summary.WithEmbeddings,
		result.Summary.TotalPrompts)

	// Breakdown by phase
	if len(result.Breakdown.ByPhase) > 0 {
		logger.Info("🔄 By Phase")
		for phase, count := range result.Breakdown.ByPhase {
			percentage := (float64(count) / float64(result.Summary.TotalPrompts)) * 100
			logger.Infof("%-12s: %3d (%.1f%%)", phase, count, percentage)
		}
	}

	// Breakdown by provider
	if len(result.Breakdown.ByProvider) > 0 {
		logger.Info("🤖 By Provider")
		for provider, count := range result.Breakdown.ByProvider {
			percentage := (float64(count) / float64(result.Summary.TotalPrompts)) * 100
			logger.Infof("%-12s: %3d (%.1f%%)", provider, count, percentage)
		}
	}

	// Top models
	if len(result.Breakdown.ByModel) > 0 {
		logger.Info("🎯 Top Models")
		// Sort models by count
		type modelCount struct {
			model string
			count int
		}
		var models []modelCount
		for model, count := range result.Breakdown.ByModel {
			models = append(models, modelCount{model, count})
		}
		for i := 0; i < len(models)-1; i++ {
			for j := i + 1; j < len(models); j++ {
				if models[j].count > models[i].count {
					models[i], models[j] = models[j], models[i]
				}
			}
		}

		for i, model := range models {
			if i >= 5 { // Show top 5
				break
			}
			percentage := (float64(model.count) / float64(result.Summary.TotalPrompts)) * 100
			logger.Infof("%-30s: %3d (%.1f%%)", model.model, model.count, percentage)
		}
	}

	// Top prompts by cost
	if len(result.TopPrompts) > 0 {
		logger.Info("💰 Most Expensive Prompts")
		for i, prompt := range result.TopPrompts {
			if i >= 5 { // Show top 5
				break
			}
			logger.Infof("[%d] %s | %s | $%.4f", i+1, prompt.Phase, prompt.Model, prompt.Cost)
			logger.Infof("    %s", prompt.Content)
			logger.Infof("    Tokens: %s | Time: %d ms | %s",
				formatNumber(prompt.Tokens),
				prompt.ProcessingTime,
				prompt.CreatedAt.Format("2006-01-02 15:04"))
		}
	}

	// Activity timeline (if report type specified)
	if reportType != "" && len(result.Breakdown.ByDate) > 0 {
		logger.Infof("📅 %s Activity", cases.Title(language.English).String(reportType))

		// Sort dates
		type dateCount struct {
			date  string
			count int
		}
		var dates []dateCount
		for date, count := range result.Breakdown.ByDate {
			dates = append(dates, dateCount{date, count})
		}
		for i := 0; i < len(dates)-1; i++ {
			for j := i + 1; j < len(dates); j++ {
				if dates[j].date > dates[i].date {
					dates[i], dates[j] = dates[j], dates[i]
				}
			}
		}

		for _, date := range dates {
			logger.Infof("%s: %d prompts", date.date, date.count)
		}
	}

	// Performance insights
	logger.Info("🔍 Insights")
	if result.Summary.TotalCost > 0 {
		costPerPrompt := result.Summary.TotalCost / float64(result.Summary.TotalPrompts)
		logger.Infof("• Average cost per prompt: $%.4f", costPerPrompt)
	}
	if result.Summary.AverageTokens > 0 {
		logger.Infof("• Token efficiency: %.1f tokens/prompt", result.Summary.AverageTokens)
	}
	if result.Summary.EmbeddingCoverage < 100 {
		logger.Infof("• %.1f%% of prompts missing embeddings", 100-result.Summary.EmbeddingCoverage)
	}
	if result.Summary.AverageProcessingTime > 10000 {
		logger.Warn("• Consider optimizing for faster response times")
	}

	return nil
}

func outputMetricsJSON(result MetricsResult) error {
	logger := log.GetLogger()
	logger.Info("Outputting metrics in JSON format")
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(data))
	return nil
}

func formatNumber(n int) string {
	if n >= 1000000 {
		return fmt.Sprintf("%.1fM", float64(n)/1000000)
	} else if n >= 1000 {
		return fmt.Sprintf("%.1fK", float64(n)/1000)
	}
	return fmt.Sprintf("%d", n)
}
