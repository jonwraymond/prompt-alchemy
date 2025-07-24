package learning

import (
	"context"
	"fmt"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// BackgroundWorker handles continuous learning tasks
type BackgroundWorker struct {
	storage  storage.StorageInterface
	registry providers.RegistryInterface
	logger   *logrus.Logger
	engine   *LearningEngine
}

// NewBackgroundWorker creates a new background worker
func NewBackgroundWorker(storage storage.StorageInterface, engine *LearningEngine, registry providers.RegistryInterface, logger *logrus.Logger) *BackgroundWorker {
	return &BackgroundWorker{
		storage:  storage,
		registry: registry,
		engine:   engine,
		logger:   logger,
	}
}

// Start runs the background worker
func (w *BackgroundWorker) Start(ctx context.Context) {
	w.logger.Info("Starting learning background worker")

	// Ticker for periodic tasks
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Stopping learning background worker")
			return
		case <-ticker.C:
			w.runPeriodicTasks(ctx)
		}
	}
}

// runPeriodicTasks runs all periodic learning tasks
func (w *BackgroundWorker) runPeriodicTasks(ctx context.Context) {
	w.logger.Debug("Running periodic learning tasks")

	// Embed new prompts
	if err := w.processNewPrompts(ctx); err != nil {
		w.logger.WithError(err).Error("Failed to process new prompts")
	}

	// Analyze relationships
	if err := w.analyzeRelationships(ctx); err != nil {
		w.logger.WithError(err).Error("Failed to analyze relationships")
	}
}

// processNewPrompts finds prompts without embeddings and generates them
func (w *BackgroundWorker) processNewPrompts(ctx context.Context) error {
	w.logger.Debug("Starting processNewPrompts task")

	// Get prompts that don't have embeddings (limit to 10 per batch for performance)
	const batchSize = 10
	prompts, err := w.storage.GetPromptsWithoutEmbeddings(ctx, batchSize)
	if err != nil {
		return fmt.Errorf("failed to get prompts without embeddings: %w", err)
	}

	if len(prompts) == 0 {
		w.logger.Debug("No prompts found without embeddings")
		return nil
	}

	w.logger.WithField("count", len(prompts)).Info("Found prompts without embeddings, generating embeddings...")

	// Create standardized embedding function using OpenAI provider
	embeddingFunc := func(ctx context.Context, text string) ([]float32, error) {
		provider, err := w.registry.Get(providers.ProviderOpenAI)
		if err != nil {
			return nil, fmt.Errorf("OpenAI provider not found in registry for standardized embeddings: %w", err)
		}

		if !provider.IsAvailable() {
			return nil, fmt.Errorf("OpenAI provider is not available for standardized embeddings")
		}

		if !provider.SupportsEmbeddings() {
			return nil, fmt.Errorf("OpenAI provider does not support embeddings")
		}

		return provider.GetEmbedding(ctx, text, w.registry)
	}

	successCount := 0
	for _, prompt := range prompts {
		select {
		case <-ctx.Done():
			w.logger.Info("Context cancelled, stopping embedding generation")
			return ctx.Err()
		default:
		}

		// Generate embedding for the prompt content
		embedding, err := embeddingFunc(ctx, prompt.Content)
		if err != nil {
			w.logger.WithError(err).WithField("prompt_id", prompt.ID).Error("Failed to generate embedding for prompt")
			continue
		}

		// Update prompt with embedding information
		prompt.Embedding = embedding
		prompt.EmbeddingProvider = providers.ProviderOpenAI // Using standardized OpenAI embeddings
		prompt.EmbeddingModel = "text-embedding-3-small"    // Standard model used by getStandardizedEmbedding

		// Set embedding configuration in storage if not already set
		currentProvider, currentModel, currentDims := w.storage.GetEmbeddingConfig()
		if currentProvider == "" || currentModel == "" || currentDims == 0 {
			w.storage.SetEmbeddingConfig(prompt.EmbeddingProvider, prompt.EmbeddingModel, len(embedding))
		}

		// Save the prompt with its new embedding
		if err := w.storage.SavePrompt(ctx, prompt); err != nil {
			w.logger.WithError(err).WithField("prompt_id", prompt.ID).Error("Failed to save prompt with embedding")
			continue
		}

		successCount++
		w.logger.WithFields(logrus.Fields{
			"prompt_id":       prompt.ID,
			"embedding_dims":  len(embedding),
			"embedding_model": prompt.EmbeddingModel,
		}).Debug("Successfully generated and saved embedding for prompt")
	}

	w.logger.WithFields(logrus.Fields{
		"total_prompts": len(prompts),
		"successful":    successCount,
		"failed":        len(prompts) - successCount,
	}).Info("Completed embedding generation batch")

	return nil
}

// analyzeRelationships analyzes prompt embeddings to find relationships
func (w *BackgroundWorker) analyzeRelationships(ctx context.Context) error {
	w.logger.Debug("Starting analyzeRelationships task")

	// Get prompts with embeddings for relationship analysis (limit to 5 per batch)
	const batchSize = 5
	const similarityThreshold = 0.7 // Minimum similarity score for meaningful relationships
	const maxSimilarPrompts = 3     // Maximum similar prompts to analyze per prompt

	// Get high-quality prompts that have embeddings for analysis
	prompts, err := w.storage.GetHighQualityHistoricalPrompts(ctx, batchSize)
	if err != nil {
		return fmt.Errorf("failed to get high-quality prompts for relationship analysis: %w", err)
	}

	if len(prompts) == 0 {
		w.logger.Debug("No high-quality prompts found for relationship analysis")
		return nil
	}

	w.logger.WithField("count", len(prompts)).Info("Analyzing relationships for high-quality prompts...")

	relationshipsFound := 0
	for _, prompt := range prompts {
		select {
		case <-ctx.Done():
			w.logger.Info("Context cancelled, stopping relationship analysis")
			return ctx.Err()
		default:
		}

		// Skip prompts without embeddings
		if len(prompt.Embedding) == 0 {
			w.logger.WithField("prompt_id", prompt.ID).Debug("Skipping prompt without embedding")
			continue
		}

		// Find similar prompts using vector similarity
		similarPrompts, err := w.storage.SearchSimilarHighQualityPrompts(
			ctx,
			prompt.Embedding,
			similarityThreshold,
			maxSimilarPrompts+1, // +1 because the prompt itself will be in results
		)
		if err != nil {
			w.logger.WithError(err).WithField("prompt_id", prompt.ID).Error("Failed to find similar prompts")
			continue
		}

		// Filter out the prompt itself and analyze relationships
		var actualSimilarPrompts []*models.Prompt
		for _, similar := range similarPrompts {
			if similar.ID != prompt.ID {
				actualSimilarPrompts = append(actualSimilarPrompts, similar)
			}
		}

		if len(actualSimilarPrompts) > 0 {
			relationshipsFound += len(actualSimilarPrompts)

			// Log relationship discovery for debugging and future enhancement
			w.logger.WithFields(logrus.Fields{
				"source_prompt_id":      prompt.ID,
				"source_phase":          prompt.Phase,
				"source_persona":        prompt.PersonaUsed,
				"source_relevance":      prompt.RelevanceScore,
				"similar_prompts_found": len(actualSimilarPrompts),
			}).Info("Discovered prompt relationships")

			// Log details of each relationship
			for _, similar := range actualSimilarPrompts {
				w.logger.WithFields(logrus.Fields{
					"source_prompt_id":  prompt.ID,
					"similar_prompt_id": similar.ID,
					"similar_phase":     similar.Phase,
					"similar_persona":   similar.PersonaUsed,
					"similar_relevance": similar.RelevanceScore,
					"phase_match":       prompt.Phase == similar.Phase,
					"persona_match":     prompt.PersonaUsed == similar.PersonaUsed,
				}).Debug("Relationship details")
			}

			// Future enhancement: Store relationships in a dedicated table
			// For now, we're analyzing and logging for learning purposes
			w.analyzeRelationshipPatterns(prompt, actualSimilarPrompts)
		}
	}

	w.logger.WithFields(logrus.Fields{
		"analyzed_prompts":    len(prompts),
		"relationships_found": relationshipsFound,
		"avg_relationships":   float64(relationshipsFound) / float64(len(prompts)),
	}).Info("Completed relationship analysis batch")

	return nil
}

// analyzeRelationshipPatterns analyzes patterns in prompt relationships for learning insights
func (w *BackgroundWorker) analyzeRelationshipPatterns(sourcePrompt *models.Prompt, similarPrompts []*models.Prompt) {
	var phaseMatches, personaMatches, enhancementMatches int
	var avgSimilarRelevance float64

	for _, similar := range similarPrompts {
		if sourcePrompt.Phase == similar.Phase {
			phaseMatches++
		}
		if sourcePrompt.PersonaUsed == similar.PersonaUsed {
			personaMatches++
		}
		if sourcePrompt.EnhancementMethod == similar.EnhancementMethod {
			enhancementMatches++
		}
		avgSimilarRelevance += similar.RelevanceScore
	}

	if len(similarPrompts) > 0 {
		avgSimilarRelevance /= float64(len(similarPrompts))
	}

	// Log pattern analysis for future machine learning enhancements
	w.logger.WithFields(logrus.Fields{
		"source_prompt_id":       sourcePrompt.ID,
		"source_relevance_score": sourcePrompt.RelevanceScore,
		"similar_count":          len(similarPrompts),
		"phase_match_rate":       float64(phaseMatches) / float64(len(similarPrompts)),
		"persona_match_rate":     float64(personaMatches) / float64(len(similarPrompts)),
		"enhancement_match_rate": float64(enhancementMatches) / float64(len(similarPrompts)),
		"avg_similar_relevance":  avgSimilarRelevance,
		"relevance_improvement":  avgSimilarRelevance - sourcePrompt.RelevanceScore,
	}).Debug("Relationship pattern analysis completed")

	// Future enhancement: Use these patterns to improve ranking algorithms
	// For example, if prompts with similar embeddings have higher relevance scores,
	// we could boost the relevance of the source prompt
}
