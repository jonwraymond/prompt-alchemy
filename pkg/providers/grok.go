package providers

import (
	"context"
	"fmt"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/security"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/sirupsen/logrus"
)

// GrokProvider implements the Provider interface for xAI Grok using OpenAI-compatible SDK
// Note: Grok requires credits to be purchased before API access is enabled.
// New accounts must add credits at https://console.x.ai
type GrokProvider struct {
	client openai.Client
	config Config
}

// NewGrokProvider creates a new Grok provider
func NewGrokProvider(config Config) *GrokProvider {
	baseURL := config.BaseURL
	if baseURL == "" {
		baseURL = "https://api.x.ai/v1" // Default xAI API base as of July 2025
	}

	// Validate the base URL for security
	if err := security.ValidateBaseURL(baseURL); err != nil {
		log.GetLogger().Errorf("Invalid base URL for Grok provider: %v", err)
		// Fall back to default safe URL
		baseURL = "https://api.x.ai/v1"
	}

	opts := []option.RequestOption{
		option.WithAPIKey(config.APIKey),
		option.WithBaseURL(baseURL),
	}

	client := openai.NewClient(opts...)

	return &GrokProvider{
		client: client,
		config: config,
	}
}

// Generate creates a prompt using Grok (OpenAI-compatible)
func (p *GrokProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	logger := log.GetLogger()
	logger.Debug("GrokProvider: Generating prompt")

	// Determine the model to use
	model := p.config.Model
	if model == "" {
		model = "grok-2-1212" // Default Grok model as of July 2025
	}

	// Create the chat completion request
	messages := []openai.ChatCompletionMessageParamUnion{
		openai.UserMessage(req.Prompt),
	}

	// Add system prompt if provided
	if req.SystemPrompt != "" {
		messages = append([]openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(req.SystemPrompt),
		}, messages...)
	}

	// Create the request parameters
	params := openai.ChatCompletionNewParams{
		Messages: messages,
		Model:    openai.ChatModel(model),
	}

	// Add optional parameters
	if req.Temperature > 0 {
		params.Temperature = openai.Float(req.Temperature)
	}
	if req.MaxTokens > 0 {
		params.MaxTokens = openai.Int(int64(req.MaxTokens))
	}

	// Make the API call
	response, err := p.client.Chat.Completions.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("Grok API call failed: %w", err)
	}

	// Extract the response
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from Grok API")
	}

	choice := response.Choices[0]
	content := choice.Message.Content

	// Build the response
	genResponse := &GenerateResponse{
		Content: content,
		Model:   model,
	}

	// Add usage information if available
	if response.Usage.TotalTokens > 0 {
		genResponse.TokensUsed = int(response.Usage.TotalTokens)
	}

	return genResponse, nil
}

// GetEmbedding delegates to standardized (Grok doesn't support natively as of July 2025)
func (p *GrokProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	logger := log.GetLogger().WithFields(logrus.Fields{
		"provider": p.Name(),
	})
	logger.Info("GrokProvider delegating embedding to standardized provider")
	return getStandardizedEmbedding(ctx, text, registry)
}

// Name returns the provider name
func (p *GrokProvider) Name() string {
	return ProviderGrok
}

// IsAvailable checks if the provider is configured
func (p *GrokProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *GrokProvider) SupportsEmbeddings() bool {
	return false
}

// SupportsStreaming checks if the provider supports streaming generation
func (p *GrokProvider) SupportsStreaming() bool {
	return true
}
