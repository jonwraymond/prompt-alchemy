package providers

import (
	"context"
	"fmt"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
)

// getStandardizedEmbedding creates an OpenAI provider for embeddings
// This ensures all providers use the same embedding model for compatibility
// All providers delegate embedding requests to OpenAI text-embedding-3-small (1536d)
// for maximum search coverage and dimensional compatibility
func getStandardizedEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error) {
	logger := log.GetLogger()

	provider, err := registry.Get(ProviderOpenAI)
	if err != nil {
		logger.WithError(err).Error("OpenAI provider not found in registry for standardized embeddings")
		return nil, fmt.Errorf("OpenAI provider not found in registry for standardized embeddings: %w", err)
	}

	if !provider.IsAvailable() {
		logger.Error("OpenAI provider is not available for standardized embeddings")
		return nil, fmt.Errorf("OpenAI provider is not available for standardized embeddings")
	}

	if !provider.SupportsEmbeddings() {
		logger.Error("OpenAI provider does not support embeddings")
		return nil, fmt.Errorf("OpenAI provider does not support embeddings")
	}

	return provider.GetEmbedding(ctx, text, registry)
}
