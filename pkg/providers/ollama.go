package providers

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/sirupsen/logrus"

	"github.com/ollama/ollama/api"
)

// OllamaProvider implements the Provider interface for Ollama local models
type OllamaProvider struct {
	config Config
	client *api.Client
}

// NewOllamaProvider creates a new Ollama provider using the official API
func NewOllamaProvider(config Config) *OllamaProvider {
	// Default to local Ollama instance
	baseURL := config.BaseURL
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}

	// Parse the base URL
	u, err := url.Parse(baseURL)
	if err != nil {
		// Fallback to localhost if URL parsing fails
		u, _ = url.Parse("http://localhost:11434")
	}

	// Create HTTP client with timeout
	timeout := time.Duration(config.Timeout) * time.Second
	if timeout == 0 {
		if config.GenerationTimeout > 0 {
			timeout = time.Duration(config.GenerationTimeout) * time.Second
		} else {
			timeout = time.Duration(DefaultGenerationTimeout) * time.Second // Longer timeout for local models
		}
	}

	httpClient := &http.Client{
		Timeout: timeout,
	}

	// Create client using the official API constructor
	client := api.NewClient(u, httpClient)

	return &OllamaProvider{
		config: config,
		client: client,
	}
}

// Generate creates a prompt using Ollama's official API
func (p *OllamaProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	// Convert our request to Ollama API format
	ollamaReq := &api.GenerateRequest{
		Model:  p.config.Model,
		Prompt: req.Prompt,
		Stream: &[]bool{false}[0],
	}

	// Optional parameters
	if req.Temperature > 0 {
		ollamaReq.Options = map[string]interface{}{
			"temperature": req.Temperature,
		}
	}

	if req.MaxTokens > 0 {
		if ollamaReq.Options == nil {
			ollamaReq.Options = make(map[string]interface{})
		}
		ollamaReq.Options["num_predict"] = req.MaxTokens
	}

	// Make the API call
	var response api.GenerateResponse
	err := p.client.Generate(ctx, ollamaReq, func(resp api.GenerateResponse) error {
		response = resp
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to generate completion: %w", err)
	}

	return &GenerateResponse{
		Content:    response.Response,
		Model:      p.config.Model,
		TokensUsed: 0, // Ollama doesn't provide token usage
	}, nil
}

// GetEmbedding delegates to standardized embedding to ensure 1536 dimensions
func (p *OllamaProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	logger := log.GetLogger().WithFields(logrus.Fields{
		"provider": p.Name(),
	})
	logger.Info("OllamaProvider delegating embedding to standardized provider")
	return getStandardizedEmbedding(ctx, text, registry)
}

// Name returns the provider name
func (p *OllamaProvider) Name() string {
	return ProviderOllama
}

// IsAvailable checks if the provider is configured and Ollama is running
func (p *OllamaProvider) IsAvailable() bool {
	// For Ollama, we check if the service is running
	// Use configurable embedding timeout
	embeddingTimeout := time.Duration(p.config.EmbeddingTimeout) * time.Second
	if embeddingTimeout == 0 {
		embeddingTimeout = time.Duration(DefaultEmbeddingTimeout) * time.Second // Default timeout
	}

	ctx, cancel := context.WithTimeout(context.Background(), embeddingTimeout)
	defer cancel()

	// Use the official API to check if Ollama is available
	err := p.client.Heartbeat(ctx)
	return err == nil
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *OllamaProvider) SupportsEmbeddings() bool {
	return true // Ollama supports embeddings with appropriate models
}

// SupportsStreaming checks if the provider supports streaming generation
func (p *OllamaProvider) SupportsStreaming() bool {
	return true // Ollama supports streaming
}
