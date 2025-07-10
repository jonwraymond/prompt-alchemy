package providers

import (
	"context"
	"errors"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

// Provider name constants to avoid duplication
const (
	ProviderOpenAI     = "openai"
	ProviderAnthropic  = "anthropic"
	ProviderGoogle     = "google"
	ProviderOllama     = "ollama"
	ProviderOpenRouter = "openrouter"
)

// Default configuration constants
const (
	DefaultHTTPTimeout       = 60   // seconds
	DefaultGenerationTimeout = 120  // seconds
	DefaultEmbeddingTimeout  = 5    // seconds
	DefaultMaxProTokens      = 8192 // Gemini Pro models support 8k output tokens
	DefaultMaxFlashTokens    = 8192 // Gemini 2.5 Flash supports 8k output tokens
	DefaultMaxTokens         = 256
	DefaultMaxTemperature    = 2.0
)

// Provider defines the interface for LLM providers
type Provider interface {
	// Generate creates a prompt based on the request
	Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error)

	// GetEmbedding returns embeddings for the given text
	GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error)

	// Name returns the provider name
	Name() string

	// IsAvailable checks if the provider is configured and available
	IsAvailable() bool

	// SupportsEmbeddings checks if the provider supports embedding generation
	SupportsEmbeddings() bool
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
	APIKey          string
	BaseURL         string
	Model           string
	MaxRetries      int
	Timeout         int
	FallbackModels  []string               // OpenRouter fallback models
	ProviderRouting map[string]interface{} // OpenRouter provider routing config

	// Google-specific configuration
	SafetyThreshold string  `mapstructure:"safety_threshold"` // Default: "BLOCK_MEDIUM_AND_ABOVE"
	MaxProTokens    int     `mapstructure:"max_pro_tokens"`   // Default: 1024
	MaxFlashTokens  int     `mapstructure:"max_flash_tokens"` // Default: 512
	DefaultTokens   int     `mapstructure:"default_tokens"`   // Default: 256
	MaxTemperature  float64 `mapstructure:"max_temperature"`  // Default: 2.0

	// Ollama-specific configuration
	DefaultEmbeddingModel string `mapstructure:"default_embedding_model"` // Default: "nomic-embed-text"
	EmbeddingTimeout      int    `mapstructure:"embedding_timeout"`       // Default: 5 seconds
	GenerationTimeout     int    `mapstructure:"generation_timeout"`      // Default: 120 seconds
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
	logger := log.GetLogger()
	if _, exists := r.providers[name]; exists {
		logger.Warnf("Provider %s already registered", name)
		return errors.New("provider already registered")
	}
	logger.Debugf("Registering provider: %s", name)
	r.providers[name] = provider
	return nil
}

// Get retrieves a provider by name
func (r *Registry) Get(name string) (Provider, error) {
	logger := log.GetLogger()
	provider, exists := r.providers[name]
	if !exists {
		logger.Errorf("Provider not found: %s", name)
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
	logger := log.GetLogger()
	for _, config := range configs {
		if config.Phase == phase {
			return registry.Get(config.Provider)
		}
	}
	logger.WithField("phase", phase).Error("No provider configured for phase")
	return nil, errors.New("no provider configured for phase")
}

// GetEmbeddingProvider returns a provider that supports embeddings, with fallback
func GetEmbeddingProvider(primaryProvider Provider, registry *Registry) Provider {
	logger := log.GetLogger()
	// If primary provider supports embeddings, use it
	if primaryProvider.SupportsEmbeddings() {
		logger.Debugf("Primary provider %s supports embeddings", primaryProvider.Name())
		return primaryProvider
	}

	// Try to find a fallback provider that supports embeddings
	logger.Debugf("Primary provider %s does not support embeddings, searching for fallback", primaryProvider.Name())
	available := registry.ListAvailable()
	for _, providerName := range available {
		if provider, err := registry.Get(providerName); err == nil {
			if provider.SupportsEmbeddings() {
				logger.Infof("Found fallback embedding provider: %s", provider.Name())
				return provider
			}
		}
	}

	// Return primary provider anyway (will error gracefully)
	logger.Warnf("No embedding provider found, returning primary provider %s", primaryProvider.Name())
	return primaryProvider
}

// ListEmbeddingCapableProviders returns all providers that support embeddings
func (r *Registry) ListEmbeddingCapableProviders() []string {
	capable := make([]string, 0)
	for name, provider := range r.providers {
		if provider.IsAvailable() && provider.SupportsEmbeddings() {
			capable = append(capable, name)
		}
	}
	return capable
}
