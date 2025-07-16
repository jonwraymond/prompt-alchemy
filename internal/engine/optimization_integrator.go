package engine

import (
	"context"
	"fmt"

	"github.com/jonwraymond/prompt-alchemy/internal/optimizer"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// OptimizationIntegrator handles optimization for the engine
type OptimizationIntegrator struct {
	logger   *logrus.Logger
	storage  storage.StorageInterface
	registry *providers.Registry
}

// NewOptimizationIntegrator creates a new optimization integrator
func NewOptimizationIntegrator(logger *logrus.Logger, storage storage.StorageInterface, registry *providers.Registry) *OptimizationIntegrator {
	return &OptimizationIntegrator{
		logger:   logger,
		storage:  storage,
		registry: registry,
	}
}

// OptimizePhaseOutput optimizes a phase output if optimization is enabled
func (o *OptimizationIntegrator) OptimizePhaseOutput(ctx context.Context, prompt *models.Prompt, opts models.GenerateOptions) (*models.Prompt, error) {
	if !opts.Optimize {
		return prompt, nil
	}

	o.logger.WithFields(logrus.Fields{
		"phase":        prompt.Phase,
		"prompt_id":    prompt.ID,
		"target_score": opts.OptimizeTargetScore,
		"max_iter":     opts.OptimizeMaxIter,
	}).Info("Starting phase optimization")

	// Get provider for optimization
	provider, err := o.getOptimizationProvider(prompt.Provider)
	if err != nil {
		o.logger.WithError(err).Warn("Failed to get optimization provider, skipping optimization")
		return prompt, nil
	}

	// Get judge provider (try to use different provider to avoid bias)
	judgeProvider := o.getJudgeProvider(provider)

	// Create meta-prompt optimizer with storage and registry for historical learning
	metaOptimizer := optimizer.NewMetaPromptOptimizer(provider, judgeProvider, o.storage, o.registry)

	// Get persona
	personaType := models.PersonaType(opts.Persona)
	_, err = models.GetPersona(personaType)
	if err != nil {
		o.logger.WithError(err).Warn("Failed to get persona for optimization")
		personaType = models.PersonaGeneric
	}

	// Detect model family from target model
	modelFamily := models.ModelFamilyGeneric
	if opts.TargetModel != "" {
		modelFamily = models.DetectModelFamily(opts.TargetModel)
	}

	// Create optimization request
	request := &optimizer.OptimizationRequest{
		OriginalPrompt:  prompt.Content,
		TaskDescription: fmt.Sprintf("Optimize %s phase output for AI prompt generation", prompt.Phase),
		Examples:        o.getOptimizationExamples(prompt.Phase),
		Constraints:     o.getPhaseConstraints(prompt.Phase),
		ModelFamily:     modelFamily,
		PersonaType:     personaType,
		MaxIterations:   opts.OptimizeMaxIter,
		TargetScore:     opts.OptimizeTargetScore,
		OptimizationGoals: map[string]float64{
			"clarity":      0.3,
			"relevance":    0.3,
			"completeness": 0.2,
			"conciseness":  0.2,
		},
	}

	// Run optimization
	result, err := metaOptimizer.OptimizePrompt(ctx, request)
	if err != nil {
		o.logger.WithError(err).Warn("Optimization failed, using original prompt")
		return prompt, nil
	}

	// Check if optimization actually improved the prompt
	if result.FinalScore <= result.OriginalScore {
		o.logger.WithFields(logrus.Fields{
			"original_score": result.OriginalScore,
			"final_score":    result.FinalScore,
		}).Info("Optimization did not improve prompt, using original")
		return prompt, nil
	}

	// Create optimized prompt
	optimizedPrompt := *prompt // Copy original
	optimizedPrompt.Content = result.OptimizedPrompt
	optimizedPrompt.EnhancementMethod = "meta-prompt-optimization"
	optimizedPrompt.ParentID = &prompt.ID

	// Store optimization metadata in generation context
	optimizedPrompt.GenerationContext = append(optimizedPrompt.GenerationContext,
		fmt.Sprintf("optimization_iterations=%d", len(result.Iterations)),
		fmt.Sprintf("optimization_score=%.2f", result.FinalScore),
		fmt.Sprintf("optimization_improvement=%.2f", result.Improvement),
	)

	o.logger.WithFields(logrus.Fields{
		"phase":          prompt.Phase,
		"original_score": result.OriginalScore,
		"final_score":    result.FinalScore,
		"improvement":    result.Improvement,
		"iterations":     len(result.Iterations),
	}).Info("Successfully optimized phase output")

	return &optimizedPrompt, nil
}

// getOptimizationProvider gets the provider for optimization
func (o *OptimizationIntegrator) getOptimizationProvider(preferredProvider string) (providers.Provider, error) {
	// Try to get the preferred provider first
	if preferredProvider != "" {
		provider, err := o.registry.Get(preferredProvider)
		if err == nil {
			return provider, nil
		}
	}

	// Fallback to first available provider
	available := o.registry.ListAvailable()
	if len(available) == 0 {
		return nil, fmt.Errorf("no providers available for optimization")
	}

	provider, err := o.registry.Get(available[0])
	if err != nil {
		return nil, err
	}

	return provider, nil
}

// getJudgeProvider gets a different provider for judging to avoid bias
func (o *OptimizationIntegrator) getJudgeProvider(optimizationProvider providers.Provider) providers.Provider {
	available := o.registry.ListAvailable()

	// Try to find a different provider
	for _, name := range available {
		if name != optimizationProvider.Name() {
			provider, err := o.registry.Get(name)
			if err == nil {
				o.logger.WithField("judge_provider", name).Debug("Using different provider for judging")
				return provider
			}
		}
	}

	// Fallback to same provider
	o.logger.Debug("Using same provider for optimization and judging")
	return optimizationProvider
}

// getOptimizationExamples returns examples for optimization based on phase
func (o *OptimizationIntegrator) getOptimizationExamples(phase models.Phase) []optimizer.OptimizationExample {
	switch phase {
	case models.PhasePrimaMaterial:
		return []optimizer.OptimizationExample{
			{
				Input:          "Create a chatbot",
				ExpectedOutput: "Design an AI-powered conversational assistant that understands natural language, maintains context across conversations, and provides helpful responses tailored to user needs",
				Quality:        8.5,
			},
		}
	case models.PhaseSolutio:
		return []optimizer.OptimizationExample{
			{
				Input:          "Technical documentation",
				ExpectedOutput: "Transform complex technical concepts into clear, accessible documentation that balances accuracy with readability, using examples and visual aids where appropriate",
				Quality:        8.0,
			},
		}
	case models.PhaseCoagulatio:
		return []optimizer.OptimizationExample{
			{
				Input:          "Optimization algorithm",
				ExpectedOutput: "Implement a sophisticated optimization algorithm that leverages mathematical principles, heuristics, and domain knowledge to find optimal solutions efficiently",
				Quality:        9.0,
			},
		}
	default:
		return []optimizer.OptimizationExample{}
	}
}

// getPhaseConstraints returns constraints for optimization based on phase
func (o *OptimizationIntegrator) getPhaseConstraints(phase models.Phase) []string {
	baseConstraints := []string{
		"Maintain the alchemical essence of the phase",
		"Preserve the original intent and meaning",
		"Enhance clarity without losing depth",
	}

	switch phase {
	case models.PhasePrimaMaterial:
		return append(baseConstraints,
			"Focus on extracting pure essence from raw ideas",
			"Emphasize foundational concepts and core elements",
		)
	case models.PhaseSolutio:
		return append(baseConstraints,
			"Ensure natural flow and readability",
			"Balance technical accuracy with accessibility",
		)
	case models.PhaseCoagulatio:
		return append(baseConstraints,
			"Crystallize ideas into precise, actionable form",
			"Maximize potency and effectiveness",
		)
	default:
		return baseConstraints
	}
}
