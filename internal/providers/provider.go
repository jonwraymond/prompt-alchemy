package providers

import (
	"context"
	"errors"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

// Provider defines the interface for LLM providers
type Provider interface {
	// Generate creates a prompt based on the request
	Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error)

	// GetEmbedding returns embeddings for the given text
	GetEmbedding(ctx context.Context, text string) ([]float32, error)

	// Name returns the provider name
	Name() string

	// IsAvailable checks if the provider is configured and available
	IsAvailable() bool
}

// GenerateRequest contains the request parameters for prompt generation
type GenerateRequest struct {
	Prompt       string
	Temperature  float64
	MaxTokens    int
	SystemPrompt string
	Examples     []Example
}

// Example represents an example for few-shot learning
type Example struct {
	Input  string
	Output string
}

// GenerateResponse contains the response from prompt generation
type GenerateResponse struct {
	Content    string
	TokensUsed int
	Model      string
}

// Config contains provider configuration
type Config struct {
	APIKey     string
	BaseURL    string
	Model      string
	MaxRetries int
	Timeout    int
}

// Registry manages available providers
type Registry struct {
	providers map[string]Provider
}

// NewRegistry creates a new provider registry
func NewRegistry() *Registry {
	return &Registry{
		providers: make(map[string]Provider),
	}
}

// Register adds a provider to the registry
func (r *Registry) Register(name string, provider Provider) error {
	if _, exists := r.providers[name]; exists {
		return errors.New("provider already registered")
	}
	r.providers[name] = provider
	return nil
}

// Get retrieves a provider by name
func (r *Registry) Get(name string) (Provider, error) {
	provider, exists := r.providers[name]
	if !exists {
		return nil, errors.New("provider not found")
	}
	return provider, nil
}

// ListAvailable returns all available providers
func (r *Registry) ListAvailable() []string {
	available := make([]string, 0)
	for name, provider := range r.providers {
		if provider.IsAvailable() {
			available = append(available, name)
		}
	}
	return available
}

// PhaseConfig maps phases to providers
type PhaseConfig struct {
	Phase    models.Phase
	Provider string
}

// GetProviderForPhase returns the configured provider for a phase
func GetProviderForPhase(configs []PhaseConfig, phase models.Phase, registry *Registry) (Provider, error) {
	for _, config := range configs {
		if config.Phase == phase {
			return registry.Get(config.Provider)
		}
	}
	return nil, errors.New("no provider configured for phase")
}
