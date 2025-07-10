package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	validateFix     bool
	validateOutput  string
	validateVerbose bool
)

// ValidationResult represents the result of configuration validation
type ValidationResult struct {
	Valid       bool                   `json:"valid"`
	Issues      []ValidationIssue      `json:"issues"`
	Suggestions []ValidationSuggestion `json:"suggestions"`
	Summary     ValidationSummary      `json:"summary"`
}

// ValidationIssue represents a configuration problem
type ValidationIssue struct {
	Category    string `json:"category"`
	Severity    string `json:"severity"`
	Field       string `json:"field"`
	Message     string `json:"message"`
	Fix         string `json:"fix,omitempty"`
	AutoFixable bool   `json:"auto_fixable"`
}

// ValidationSuggestion represents an optimization recommendation
type ValidationSuggestion struct {
	Category    string `json:"category"`
	Field       string `json:"field"`
	Current     string `json:"current"`
	Recommended string `json:"recommended"`
	Reason      string `json:"reason"`
	Impact      string `json:"impact"`
}

// ValidationSummary provides an overview of validation results
type ValidationSummary struct {
	TotalIssues      int  `json:"total_issues"`
	CriticalIssues   int  `json:"critical_issues"`
	WarningIssues    int  `json:"warning_issues"`
	InfoIssues       int  `json:"info_issues"`
	TotalSuggestions int  `json:"total_suggestions"`
	ConfigValid      bool `json:"config_valid"`
	ReadyForUse      bool `json:"ready_for_use"`
}

// validateCmd represents the validate command
var validateCmd = &cobra.Command{
	Use:   "validate",
	Short: "Validate and optimize Prompt Alchemy configuration",
	Long: `Validate Prompt Alchemy configuration for completeness, security, and performance.
Provides detailed analysis of your configuration with suggestions for optimization.

Examples:
  # Validate current configuration
  prompt-alchemy validate

  # Validate with detailed output
  prompt-alchemy validate --verbose

  # Validate and apply automatic fixes
  prompt-alchemy validate --fix

  # Export validation results as JSON
  prompt-alchemy validate --output json`,
	RunE: runValidate,
}

func init() {
	validateCmd.Flags().BoolVar(&validateFix, "fix", false, "Automatically fix issues where possible")
	validateCmd.Flags().StringVar(&validateOutput, "output", "text", "Output format (text, json)")
	validateCmd.Flags().BoolVar(&validateVerbose, "verbose", false, "Show detailed validation information")
}

func runValidate(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Starting configuration validation")

	// Perform validation
	result := validateConfiguration()

	// Apply fixes if requested
	if validateFix && hasAutoFixableIssues(result.Issues) {
		logger.Info("Applying automatic fixes...")
		result = applyAutomaticFixes(result)
	}

	// Output results
	if validateOutput == "json" {
		return outputValidationJSON(result)
	}
	return outputValidationText(result)
}

func validateConfiguration() ValidationResult {
	logger := log.GetLogger()
	var issues []ValidationIssue
	var suggestions []ValidationSuggestion

	// Check if config file exists
	configFile := viper.ConfigFileUsed()
	if configFile == "" {
		issues = append(issues, ValidationIssue{
			Category:    "setup",
			Severity:    "critical",
			Field:       "config_file",
			Message:     "No configuration file found",
			Fix:         "Run 'prompt-alchemy config init' to create a configuration file",
			AutoFixable: false,
		})
		return ValidationResult{
			Valid:   false,
			Issues:  issues,
			Summary: generateValidationSummary(issues, suggestions),
		}
	}

	logger.Debugf("Validating configuration file: %s", configFile)

	// Validate providers
	issues = append(issues, validateProviders()...)
	suggestions = append(suggestions, suggestProviderOptimizations()...)

	// Validate phases
	issues = append(issues, validatePhases()...)
	suggestions = append(suggestions, suggestPhaseOptimizations()...)

	// Validate embeddings
	issues = append(issues, validateEmbeddings()...)
	suggestions = append(suggestions, suggestEmbeddingOptimizations()...)

	// Validate generation settings
	issues = append(issues, validateGeneration()...)
	suggestions = append(suggestions, suggestGenerationOptimizations()...)

	// Validate security
	issues = append(issues, validateSecurity()...)
	suggestions = append(suggestions, suggestSecurityOptimizations()...)

	// Validate data directory
	issues = append(issues, validateDataDirectory()...)

	summary := generateValidationSummary(issues, suggestions)

	return ValidationResult{
		Valid:       summary.CriticalIssues == 0,
		Issues:      issues,
		Suggestions: suggestions,
		Summary:     summary,
	}
}

func validateProviders() []ValidationIssue {
	var issues []ValidationIssue
	providers := viper.GetStringMap("providers")

	if len(providers) == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "providers",
			Severity:    "critical",
			Field:       "providers",
			Message:     "No providers configured",
			Fix:         "Add at least one provider configuration",
			AutoFixable: false,
		})
		return issues
	}

	// Validate each provider
	for name := range providers {
		providerPath := fmt.Sprintf("providers.%s", name)

		// Check API key
		apiKey := viper.GetString(fmt.Sprintf("%s.api_key", providerPath))
		if apiKey == "" && name != "ollama" {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "critical",
				Field:       fmt.Sprintf("%s.api_key", providerPath),
				Message:     fmt.Sprintf("Missing API key for %s provider", name),
				Fix:         fmt.Sprintf("Add api_key to %s configuration", name),
				AutoFixable: false,
			})
		}

		// Check for placeholder values
		if strings.Contains(apiKey, "your-") || strings.Contains(apiKey, "sk-your-") {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "critical",
				Field:       fmt.Sprintf("%s.api_key", providerPath),
				Message:     fmt.Sprintf("Placeholder API key detected for %s", name),
				Fix:         fmt.Sprintf("Replace placeholder with real API key for %s", name),
				AutoFixable: false,
			})
		}

		// Check model configuration
		model := viper.GetString(fmt.Sprintf("%s.model", providerPath))
		if model == "" {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "warning",
				Field:       fmt.Sprintf("%s.model", providerPath),
				Message:     fmt.Sprintf("No model specified for %s provider", name),
				Fix:         "Add model configuration",
				AutoFixable: true,
			})
		}

		// Validate provider-specific settings
		issues = append(issues, validateProviderSpecific(name, providerPath)...)
	}

	return issues
}

func validateProviderSpecific(providerName, providerPath string) []ValidationIssue {
	var issues []ValidationIssue

	switch providerName {
	case "openrouter":
		// Check for openrouter/auto default
		model := viper.GetString(fmt.Sprintf("%s.model", providerPath))
		if model != "openrouter/auto" {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "info",
				Field:       fmt.Sprintf("%s.model", providerPath),
				Message:     "OpenRouter model is not set to auto-routing",
				Fix:         "Consider using 'openrouter/auto' for optimal model selection",
				AutoFixable: true,
			})
		}

	case "ollama":
		// Check base URL for local deployment
		baseURL := viper.GetString(fmt.Sprintf("%s.base_url", providerPath))
		if baseURL == "" {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "warning",
				Field:       fmt.Sprintf("%s.base_url", providerPath),
				Message:     "No base URL specified for Ollama",
				Fix:         "Add base_url (e.g., http://localhost:11434)",
				AutoFixable: true,
			})
		}

	case "gemini", "google":
		// Check token limits
		maxTokens := viper.GetInt(fmt.Sprintf("%s.max_flash_tokens", providerPath))
		if maxTokens < 1024 {
			issues = append(issues, ValidationIssue{
				Category:    "providers",
				Severity:    "info",
				Field:       fmt.Sprintf("%s.max_flash_tokens", providerPath),
				Message:     "Google Flash token limit may be too low",
				Fix:         "Consider increasing to at least 1024 tokens",
				AutoFixable: true,
			})
		}
	}

	return issues
}

func validatePhases() []ValidationIssue {
	var issues []ValidationIssue
	phases := viper.GetStringMap("phases")
	providers := viper.GetStringMap("providers")

	if len(phases) == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "phases",
			Severity:    "warning",
			Field:       "phases",
			Message:     "No phase configurations found",
			Fix:         "Add phase-to-provider mappings",
			AutoFixable: true,
		})
		return issues
	}

	// Check required phases
	requiredPhases := []string{"idea", "human", "precision"}
	for _, phase := range requiredPhases {
		if _, exists := phases[phase]; !exists {
			issues = append(issues, ValidationIssue{
				Category:    "phases",
				Severity:    "warning",
				Field:       fmt.Sprintf("phases.%s", phase),
				Message:     fmt.Sprintf("Missing configuration for %s phase", phase),
				Fix:         fmt.Sprintf("Add provider mapping for %s phase", phase),
				AutoFixable: true,
			})
		}
	}

	// Validate provider references
	for phase, providerInterface := range phases {
		var provider string
		if providerMap, ok := providerInterface.(map[string]interface{}); ok {
			if p, exists := providerMap["provider"]; exists {
				provider = fmt.Sprintf("%v", p)
			}
		} else {
			provider = fmt.Sprintf("%v", providerInterface)
		}

		if provider == "" {
			issues = append(issues, ValidationIssue{
				Category:    "phases",
				Severity:    "warning",
				Field:       fmt.Sprintf("phases.%s.provider", phase),
				Message:     fmt.Sprintf("No provider specified for %s phase", phase),
				Fix:         "Add provider name",
				AutoFixable: false,
			})
			continue
		}

		if _, exists := providers[provider]; !exists {
			issues = append(issues, ValidationIssue{
				Category:    "phases",
				Severity:    "critical",
				Field:       fmt.Sprintf("phases.%s.provider", phase),
				Message:     fmt.Sprintf("Phase %s references non-existent provider: %s", phase, provider),
				Fix:         fmt.Sprintf("Either add %s provider or change phase configuration", provider),
				AutoFixable: false,
			})
		}
	}

	return issues
}

func validateEmbeddings() []ValidationIssue {
	var issues []ValidationIssue

	// Check standard model
	standardModel := viper.GetString("embeddings.standard_model")
	if standardModel == "" {
		issues = append(issues, ValidationIssue{
			Category:    "embeddings",
			Severity:    "warning",
			Field:       "embeddings.standard_model",
			Message:     "No standard embedding model specified",
			Fix:         "Add standard_model (recommended: text-embedding-3-small)",
			AutoFixable: true,
		})
	}

	// Check dimensions
	dimensions := viper.GetInt("embeddings.standard_dimensions")
	if dimensions == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "embeddings",
			Severity:    "warning",
			Field:       "embeddings.standard_dimensions",
			Message:     "No embedding dimensions specified",
			Fix:         "Add standard_dimensions (recommended: 1536)",
			AutoFixable: true,
		})
	} else if dimensions != 1536 {
		issues = append(issues, ValidationIssue{
			Category:    "embeddings",
			Severity:    "info",
			Field:       "embeddings.standard_dimensions",
			Message:     "Non-standard embedding dimensions detected",
			Fix:         "Consider using 1536 dimensions for optimal compatibility",
			AutoFixable: true,
		})
	}

	// Check similarity threshold
	threshold := viper.GetFloat64("embeddings.similarity_threshold")
	if threshold == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "embeddings",
			Severity:    "info",
			Field:       "embeddings.similarity_threshold",
			Message:     "No similarity threshold specified",
			Fix:         "Add similarity_threshold (recommended: 0.3)",
			AutoFixable: true,
		})
	} else if threshold > 0.8 {
		issues = append(issues, ValidationIssue{
			Category:    "embeddings",
			Severity:    "warning",
			Field:       "embeddings.similarity_threshold",
			Message:     "Similarity threshold may be too strict",
			Fix:         "Consider lowering threshold to 0.3-0.6 for better search results",
			AutoFixable: true,
		})
	}

	return issues
}

func validateGeneration() []ValidationIssue {
	var issues []ValidationIssue

	// Check temperature
	temperature := viper.GetFloat64("generation.default_temperature")
	if temperature < 0 || temperature > 2 {
		issues = append(issues, ValidationIssue{
			Category:    "generation",
			Severity:    "warning",
			Field:       "generation.default_temperature",
			Message:     "Temperature value outside recommended range (0-2)",
			Fix:         "Set temperature between 0 and 2",
			AutoFixable: true,
		})
	}

	// Check max tokens
	maxTokens := viper.GetInt("generation.default_max_tokens")
	if maxTokens == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "generation",
			Severity:    "warning",
			Field:       "generation.default_max_tokens",
			Message:     "No default max tokens specified",
			Fix:         "Add default_max_tokens (recommended: 2000-4000)",
			AutoFixable: true,
		})
	} else if maxTokens < 100 {
		issues = append(issues, ValidationIssue{
			Category:    "generation",
			Severity:    "warning",
			Field:       "generation.default_max_tokens",
			Message:     "Max tokens may be too low for quality outputs",
			Fix:         "Consider increasing to at least 1000 tokens",
			AutoFixable: true,
		})
	}

	// Check count
	count := viper.GetInt("generation.default_count")
	if count == 0 {
		issues = append(issues, ValidationIssue{
			Category:    "generation",
			Severity:    "info",
			Field:       "generation.default_count",
			Message:     "No default generation count specified",
			Fix:         "Add default_count (recommended: 3)",
			AutoFixable: true,
		})
	} else if count > 10 {
		issues = append(issues, ValidationIssue{
			Category:    "generation",
			Severity:    "warning",
			Field:       "generation.default_count",
			Message:     "High generation count may increase costs",
			Fix:         "Consider reducing count to 3-5 for cost efficiency",
			AutoFixable: false,
		})
	}

	return issues
}

func validateSecurity() []ValidationIssue {
	var issues []ValidationIssue

	// Check for hardcoded API keys in config
	configFile := viper.ConfigFileUsed()
	if configFile != "" {
		content, err := os.ReadFile(configFile)
		if err == nil {
			configStr := string(content)

			// Check for exposed keys
			apiKeyPattern := regexp.MustCompile(`api_key:\s*["']?(sk-[a-zA-Z0-9-_]+|[a-zA-Z0-9-_]{20,})["']?`)
			if apiKeyPattern.MatchString(configStr) {
				issues = append(issues, ValidationIssue{
					Category:    "security",
					Severity:    "critical",
					Field:       "api_keys",
					Message:     "API keys detected in configuration file",
					Fix:         "Consider using environment variables for API keys",
					AutoFixable: false,
				})
			}

			// Check file permissions
			info, err := os.Stat(configFile)
			if err == nil {
				mode := info.Mode()
				if mode.Perm() > 0600 {
					issues = append(issues, ValidationIssue{
						Category:    "security",
						Severity:    "warning",
						Field:       "file_permissions",
						Message:     "Configuration file has overly permissive permissions",
						Fix:         fmt.Sprintf("Run: chmod 600 %s", configFile),
						AutoFixable: true,
					})
				}
			}
		}
	}

	return issues
}

func validateDataDirectory() []ValidationIssue {
	var issues []ValidationIssue

	dataDir := viper.GetString("data_dir")
	if dataDir == "" {
		issues = append(issues, ValidationIssue{
			Category:    "storage",
			Severity:    "info",
			Field:       "data_dir",
			Message:     "No data directory specified, using default",
			Fix:         "Explicitly set data_dir in configuration",
			AutoFixable: true,
		})
		return issues
	}

	// Expand home directory
	if strings.HasPrefix(dataDir, "~/") {
		home, err := os.UserHomeDir()
		if err == nil {
			dataDir = filepath.Join(home, dataDir[2:])
		}
	}

	// Check if directory exists and is writable
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		issues = append(issues, ValidationIssue{
			Category:    "storage",
			Severity:    "warning",
			Field:       "data_dir",
			Message:     "Data directory does not exist",
			Fix:         "Directory will be created automatically on first use",
			AutoFixable: true,
		})
	} else {
		// Check write permissions
		testFile := filepath.Join(dataDir, ".write_test")
		if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
			issues = append(issues, ValidationIssue{
				Category:    "storage",
				Severity:    "critical",
				Field:       "data_dir",
				Message:     "Data directory is not writable",
				Fix:         fmt.Sprintf("Check permissions for: %s", dataDir),
				AutoFixable: false,
			})
		} else {
			os.Remove(testFile)
		}
	}

	return issues
}

// Suggestion functions
func suggestProviderOptimizations() []ValidationSuggestion {
	var suggestions []ValidationSuggestion
	providers := viper.GetStringMap("providers")

	// Suggest additional providers for redundancy
	if len(providers) == 1 {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "reliability",
			Field:       "providers",
			Current:     "Single provider configured",
			Recommended: "Multiple providers",
			Reason:      "Provides fallback options and prevents service interruptions",
			Impact:      "High - Improves reliability and uptime",
		})
	}

	// Suggest OpenRouter for cost optimization
	if _, hasOpenRouter := providers["openrouter"]; !hasOpenRouter {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "cost",
			Field:       "providers.openrouter",
			Current:     "Not configured",
			Recommended: "Add OpenRouter with auto-routing",
			Reason:      "OpenRouter provides access to multiple models with automatic cost optimization",
			Impact:      "Medium - Potential cost savings and access to latest models",
		})
	}

	// Suggest local model for development
	if _, hasOllama := providers["ollama"]; !hasOllama {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "development",
			Field:       "providers.ollama",
			Current:     "Not configured",
			Recommended: "Add Ollama for local development",
			Reason:      "Enables offline development and reduces API costs during testing",
			Impact:      "Medium - Improves development workflow and reduces costs",
		})
	}

	return suggestions
}

func suggestPhaseOptimizations() []ValidationSuggestion {
	var suggestions []ValidationSuggestion
	phases := viper.GetStringMap("phases")

	// Suggest phase specialization
	if len(phases) > 0 {
		allSameProvider := true
		var firstProvider string
		for _, providerInterface := range phases {
			provider := fmt.Sprintf("%v", providerInterface)
			if firstProvider == "" {
				firstProvider = provider
			} else if provider != firstProvider {
				allSameProvider = false
				break
			}
		}

		if allSameProvider {
			suggestions = append(suggestions, ValidationSuggestion{
				Category:    "optimization",
				Field:       "phases",
				Current:     "All phases use same provider",
				Recommended: "Specialize providers by phase",
				Reason:      "Different models excel at different tasks (idea generation vs refinement)",
				Impact:      "Medium - Improved output quality through specialization",
			})
		}
	}

	return suggestions
}

func suggestEmbeddingOptimizations() []ValidationSuggestion {
	var suggestions []ValidationSuggestion

	// Suggest embedding caching
	cacheEnabled := viper.GetBool("embeddings.cache_embeddings")
	if !cacheEnabled {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "performance",
			Field:       "embeddings.cache_embeddings",
			Current:     "false",
			Recommended: "true",
			Reason:      "Caching reduces API calls and improves search performance",
			Impact:      "High - Significant performance improvement for repeated searches",
		})
	}

	// Suggest migration settings
	autoMigrate := viper.GetBool("embeddings.auto_migrate_legacy")
	if !autoMigrate {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "maintenance",
			Field:       "embeddings.auto_migrate_legacy",
			Current:     "false",
			Recommended: "true",
			Reason:      "Automatically updates old embeddings to current standards",
			Impact:      "Medium - Ensures consistent search quality over time",
		})
	}

	return suggestions
}

func suggestGenerationOptimizations() []ValidationSuggestion {
	var suggestions []ValidationSuggestion

	// Suggest parallel generation
	useParallel := viper.GetBool("generation.use_parallel")
	if !useParallel {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "performance",
			Field:       "generation.use_parallel",
			Current:     "false",
			Recommended: "true",
			Reason:      "Parallel generation reduces total processing time",
			Impact:      "High - Significant speed improvement for multiple variants",
		})
	}

	// Suggest optimal temperature
	temperature := viper.GetFloat64("generation.default_temperature")
	if temperature > 1.0 {
		suggestions = append(suggestions, ValidationSuggestion{
			Category:    "quality",
			Field:       "generation.default_temperature",
			Current:     fmt.Sprintf("%.1f", temperature),
			Recommended: "0.7",
			Reason:      "Temperature 0.7 provides good balance of creativity and coherence",
			Impact:      "Medium - Improved output quality and consistency",
		})
	}

	return suggestions
}

func suggestSecurityOptimizations() []ValidationSuggestion {
	var suggestions []ValidationSuggestion

	// Always suggest environment variables for API keys
	suggestions = append(suggestions, ValidationSuggestion{
		Category:    "security",
		Field:       "api_keys",
		Current:     "Configuration file",
		Recommended: "Environment variables",
		Reason:      "Environment variables prevent accidental exposure of API keys",
		Impact:      "High - Critical security improvement",
	})

	return suggestions
}

func generateValidationSummary(issues []ValidationIssue, suggestions []ValidationSuggestion) ValidationSummary {
	summary := ValidationSummary{
		TotalIssues:      len(issues),
		TotalSuggestions: len(suggestions),
	}

	for _, issue := range issues {
		switch issue.Severity {
		case "critical":
			summary.CriticalIssues++
		case "warning":
			summary.WarningIssues++
		case "info":
			summary.InfoIssues++
		}
	}

	summary.ConfigValid = summary.CriticalIssues == 0
	summary.ReadyForUse = summary.CriticalIssues == 0 && summary.WarningIssues <= 2

	return summary
}

func hasAutoFixableIssues(issues []ValidationIssue) bool {
	for _, issue := range issues {
		if issue.AutoFixable {
			return true
		}
	}
	return false
}

func applyAutomaticFixes(result ValidationResult) ValidationResult {
	logger := log.GetLogger()
	var fixedIssues []ValidationIssue
	appliedFixes := 0

	for _, issue := range result.Issues {
		if issue.AutoFixable {
			if applyFix(issue) {
				logger.Infof("Applied fix for: %s", issue.Message)
				appliedFixes++
				continue
			}
		}
		fixedIssues = append(fixedIssues, issue)
	}

	logger.Infof("Applied %d automatic fixes", appliedFixes)

	// Re-validate after fixes
	if appliedFixes > 0 {
		return validateConfiguration()
	}

	result.Issues = fixedIssues
	result.Summary = generateValidationSummary(fixedIssues, result.Suggestions)
	return result
}

func applyFix(issue ValidationIssue) bool {
	// Implementation would depend on specific fix types
	// For now, return false to indicate manual intervention needed
	return false
}

func outputValidationText(result ValidationResult) error {
	logger := log.GetLogger()

	// Header
	logger.Info("🔍 Configuration Validation Report")
	logger.Info("================================")

	// Summary
	status := "🟢 VALID"
	if !result.Summary.ConfigValid {
		status = "🔴 INVALID"
	} else if !result.Summary.ReadyForUse {
		status = "🟡 NEEDS ATTENTION"
	}

	logger.Infof("Overall Status: %s", status)
	logger.Infof("Total Issues: %d (Critical: %d, Warning: %d, Info: %d)",
		result.Summary.TotalIssues,
		result.Summary.CriticalIssues,
		result.Summary.WarningIssues,
		result.Summary.InfoIssues)
	logger.Infof("Optimization Suggestions: %d", result.Summary.TotalSuggestions)

	if result.Summary.ReadyForUse {
		logger.Info("✅ Configuration is ready for production use")
	} else if result.Summary.ConfigValid {
		logger.Info("⚠️ Configuration is valid but has optimization opportunities")
	} else {
		logger.Info("❌ Configuration has critical issues that must be resolved")
	}
	logger.Info("")

	// Issues
	if len(result.Issues) > 0 {
		logger.Info("🚨 Issues Found")
		logger.Info("===============")

		for _, issue := range result.Issues {
			icon := getIssueIcon(issue.Severity)
			logger.Infof("%s [%s] %s: %s", icon, strings.ToUpper(issue.Category), issue.Field, issue.Message)
			if issue.Fix != "" {
				logger.Infof("   Fix: %s", issue.Fix)
			}
			if issue.AutoFixable {
				logger.Info("   (Auto-fixable with --fix flag)")
			}
			logger.Info("")
		}
	}

	// Suggestions
	if len(result.Suggestions) > 0 {
		logger.Info("💡 Optimization Suggestions")
		logger.Info("===========================")

		for _, suggestion := range result.Suggestions {
			logger.Infof("📈 [%s] %s", strings.ToUpper(suggestion.Category), suggestion.Field)
			logger.Infof("   Current: %s", suggestion.Current)
			logger.Infof("   Recommended: %s", suggestion.Recommended)
			logger.Infof("   Reason: %s", suggestion.Reason)
			logger.Infof("   Impact: %s", suggestion.Impact)
			logger.Info("")
		}
	}

	// Footer
	if validateVerbose {
		configFile := viper.ConfigFileUsed()
		if configFile != "" {
			logger.Infof("Configuration file: %s", configFile)
		}
		logger.Infof("Data directory: %s", viper.GetString("data_dir"))
	}

	return nil
}

func outputValidationJSON(result ValidationResult) error {
	logger := log.GetLogger()
	logger.Info("Outputting validation results in JSON format")

	// Would implement JSON marshaling and output here
	// For now, just indicate JSON output is requested
	logger.Info("JSON output not yet implemented")
	return nil
}

func getIssueIcon(severity string) string {
	switch severity {
	case "critical":
		return "🔴"
	case "warning":
		return "🟡"
	case "info":
		return "🔵"
	default:
		return "⚪"
	}
}
