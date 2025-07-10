package cmd

import (
	"context"
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/optimizer"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	optimizePrompt              string
	optimizeTask                string
	optimizePersona             string
	optimizeTargetModel         string
	optimizeProvider            string
	optimizeJudgeProvider       string
	optimizeMaxIter             int
	optimizeTargetScore         float64
	optimizeEmbeddingDimensions int
)

// optimizeCmd represents the optimize command
var optimizeCmd = &cobra.Command{
	Use:   "optimize",
	Short: "Optimize prompts using AI-powered meta-prompting and self-improvement",
	Long: `Optimize prompts using advanced AI techniques including:
- LLM-as-a-Judge evaluation
- Meta-prompting for iterative improvement
- Model-specific optimization strategies
- Bias detection and mitigation
- Automated reasoning pattern enhancement

This command demonstrates the cutting-edge research in prompt optimization and self-improving AI systems.`,
	RunE: runOptimize,
}

func init() {
	optimizeCmd.Flags().StringVarP(&optimizePrompt, "prompt", "p", "", "Prompt to optimize (required)")
	optimizeCmd.Flags().StringVar(&optimizePersona, "persona", "code", "AI persona to use (code, writing, analysis, generic)")
	optimizeCmd.Flags().StringVar(&optimizeTargetModel, "target-model", "", "Target model for optimization (auto-detected if not specified)")
	optimizeCmd.Flags().IntVar(&optimizeMaxIter, "max-iterations", 5, "Maximum optimization iterations")
	optimizeCmd.Flags().Float64Var(&optimizeTargetScore, "target-score", 8.5, "Target quality score (1-10)")
	optimizeCmd.Flags().StringVarP(&optimizeTask, "task", "t", "", "Task description for testing (required)")
	optimizeCmd.Flags().StringVar(&optimizeProvider, "provider", "", "Provider to use for optimization")
	optimizeCmd.Flags().StringVar(&optimizeJudgeProvider, "judge-provider", "", "Provider to use for evaluation (defaults to main provider)")
	optimizeCmd.Flags().IntVar(&optimizeEmbeddingDimensions, "embedding-dimensions", 0, "Embedding dimensions for similarity search (uses config default if not specified)")

	if err := optimizeCmd.MarkFlagRequired("prompt"); err != nil {
		logger.Error("Failed to mark prompt flag as required", "error", err)
	}
	if err := optimizeCmd.MarkFlagRequired("task"); err != nil {
		logger.Error("Failed to mark task flag as required", "error", err)
	}
}

func runOptimize(cmd *cobra.Command, args []string) error {
	// Validate and load persona
	personaType := models.PersonaType(optimizePersona)
	personaObj, err := models.GetPersona(personaType)
	if err != nil {
		return fmt.Errorf("invalid persona '%s': %w", optimizePersona, err)
	}

	// Detect or use specified target model family
	var modelFamily models.ModelFamily
	if optimizeTargetModel != "" {
		modelFamily = models.DetectModelFamily(optimizeTargetModel)
		logger.WithField("target_model", optimizeTargetModel).WithField("detected_family", modelFamily).Info("Using specified target model")
	} else {
		// Use default target model from config
		defaultTargetModel := viper.GetString("generation.default_target_model")
		if defaultTargetModel != "" {
			optimizeTargetModel = defaultTargetModel
			modelFamily = models.DetectModelFamily(optimizeTargetModel)
			logger.WithField("target_model", optimizeTargetModel).WithField("detected_family", modelFamily).Info("Using default target model from config")
		} else {
			modelFamily = models.ModelFamilyGeneric
			logger.Info("No target model specified, using generic optimization")
		}
	}

	// Initialize providers
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Select optimization provider
	var optimizationProvider providers.Provider
	if optimizeProvider != "" {
		optimizationProvider, err = registry.Get(optimizeProvider)
		if err != nil {
			return fmt.Errorf("optimization provider '%s' not available: %w", optimizeProvider, err)
		}
	} else {
		// Use first available provider
		available := registry.ListAvailable()
		if len(available) == 0 {
			return fmt.Errorf("no providers available")
		}
		optimizationProvider, _ = registry.Get(available[0])
		logger.WithField("provider", available[0]).Info("Using default optimization provider")
	}

	// Get embedding dimensions from flag or config
	if optimizeEmbeddingDimensions == 0 {
		optimizeEmbeddingDimensions = viper.GetInt("generation.default_embedding_dimensions")
	}
	if optimizeEmbeddingDimensions > 0 {
		logger.WithField("embedding_dimensions", optimizeEmbeddingDimensions).Info("Using custom embedding dimensions for optimization")
	}

	// Select judge provider
	var judgeProvider providers.Provider
	if optimizeJudgeProvider != "" {
		judgeProvider, err = registry.Get(optimizeJudgeProvider)
		if err != nil {
			return fmt.Errorf("judge provider '%s' not available: %w", optimizeJudgeProvider, err)
		}
	} else {
		// Use different provider than optimization if available (to avoid narcissistic bias)
		available := registry.ListAvailable()
		judgeProvider = optimizationProvider // fallback
		for _, providerName := range available {
			if providerName != optimizationProvider.Name() {
				judgeProvider, _ = registry.Get(providerName)
				logger.WithField("judge_provider", providerName).Info("Using different provider for judgment to avoid bias")
				break
			}
		}
	}

	// Create optimizer
	opt := optimizer.NewMetaPromptOptimizer(optimizationProvider, judgeProvider)

	// Create optimization request
	request := &optimizer.OptimizationRequest{
		OriginalPrompt:  optimizePrompt,
		TaskDescription: optimizeTask,
		Examples:        []optimizer.OptimizationExample{}, // Could be loaded from file
		Constraints:     []string{"Maintain clarity", "Preserve intent", "Improve effectiveness"},
		ModelFamily:     modelFamily,
		PersonaType:     personaType,
		MaxIterations:   optimizeMaxIter,
		TargetScore:     optimizeTargetScore,
		OptimizationGoals: map[string]float64{
			"factual_accuracy": 0.3,
			"code_quality":     0.3,
			"helpfulness":      0.2,
			"conciseness":      0.2,
		},
	}

	// Run optimization
	ctx := context.Background()
	result, err := opt.OptimizePrompt(ctx, request)
	if err != nil {
		logger.Errorf("optimization failed: %v", err)
		return fmt.Errorf("optimization failed: %w", err)
	}

	// Display results
	return displayOptimizationResults(result, personaObj, modelFamily)
}

func displayOptimizationResults(result *optimizer.OptimizationResult, persona *models.Persona, modelFamily models.ModelFamily) error {
	fmt.Printf("Prompt Optimization Results (Persona: %s, Target Family: %s)\n", persona.Name, modelFamily)
	fmt.Println(strings.Repeat("=", 80))

	// Summary
	fmt.Printf("Original Score: %.1f/10\n", result.OriginalScore)
	fmt.Printf("Final Score: %.1f/10\n", result.FinalScore)
	improvement := result.Improvement
	if improvement > 0 {
		fmt.Printf("Improvement: +%.1f points (%.1f%% better)\n", improvement, (improvement/result.OriginalScore)*100)
	} else {
		fmt.Printf("Improvement: %.1f points\n", improvement)
	}
	fmt.Printf("Total Time: %v\n", result.TotalTime)
	fmt.Printf("Iterations: %d", len(result.Iterations))
	if result.ConvergedAt > 0 {
		fmt.Printf(" (converged at iteration %d)", result.ConvergedAt)
	}
	fmt.Println()

	// Show iteration progress
	fmt.Println("\nOptimization Progress:")
	fmt.Println(strings.Repeat("-", 60))
	for _, iteration := range result.Iterations {
		fmt.Printf("Iteration %d: Score %.1f/10 (took %v)\n",
			iteration.Iteration, iteration.Score, iteration.ProcessingTime)
		if iteration.ChangeReasoning != "" {
			fmt.Printf("  Reasoning: %s\n", truncateString(iteration.ChangeReasoning, 100))
		}
		if len(iteration.Improvements) > 0 {
			fmt.Printf("  Key Improvements: %s\n", strings.Join(iteration.Improvements[:min(2, len(iteration.Improvements))], ", "))
		}

		// Show bias detection if any
		if iteration.Evaluation != nil && len(iteration.Evaluation.BiasDetected) > 0 {
			fmt.Printf("  ⚠️  Bias Detected: %s\n", strings.Join(iteration.Evaluation.BiasDetected, ", "))
		}
		fmt.Println()
	}

	// Final optimized prompt
	fmt.Println("\nOptimized Prompt:")
	fmt.Println(strings.Repeat("=", 80))
	fmt.Println(result.OptimizedPrompt)
	fmt.Println(strings.Repeat("=", 80))

	// Show model-specific optimization features used
	optimization := persona.ModelOptimizations[modelFamily]
	if optimization.StructuringMethod != "" {
		fmt.Printf("\nModel-Specific Optimizations Applied:\n")
		fmt.Printf("- Structuring Method: %s\n", optimization.StructuringMethod)
		fmt.Printf("- Reasoning Pattern: %s\n", optimization.ReasoningElicitation)
		fmt.Printf("- Tool Integration: %s\n", optimization.ToolIntegration)
		if len(optimization.KeyDirectives) > 0 {
			fmt.Printf("- Key Directives: %s\n", strings.Join(optimization.KeyDirectives, ", "))
		}
	}

	// Research features demonstrated
	fmt.Printf("\n🔬 Advanced Research Features Demonstrated:\n")
	fmt.Println("✓ LLM-as-a-Judge evaluation with bias detection")
	fmt.Println("✓ Meta-prompting for automated improvement")
	fmt.Println("✓ Model-specific optimization strategies")
	fmt.Println("✓ Persona-based prompt adaptation")
	fmt.Println("✓ Iterative self-improvement loop")
	if modelFamily != models.ModelFamilyGeneric {
		fmt.Printf("✓ %s-specific prompting idioms\n", modelFamily)
	}

	return nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
