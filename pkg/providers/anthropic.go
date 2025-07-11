package providers

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// AnthropicProvider implements the Provider interface for Anthropic Claude using the official SDK
type AnthropicProvider struct {
	config Config
	client *anthropic.Client
}

// NewAnthropicProvider creates a new Anthropic provider using the official SDK
func NewAnthropicProvider(config Config) *AnthropicProvider {
	opts := []option.RequestOption{
		option.WithAPIKey(config.APIKey),
	}

	if config.BaseURL != "" {
		opts = append(opts, option.WithBaseURL(config.BaseURL))
	}

	client := anthropic.NewClient(opts...)

	return &AnthropicProvider{
		config: config,
		client: &client,
	}
}

// Generate creates a prompt using Anthropic Claude with the official SDK
func (p *AnthropicProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	messages := []anthropic.MessageParam{}

	// Add examples if provided
	for _, example := range req.Examples {
		messages = append(messages,
			anthropic.NewUserMessage(anthropic.NewTextBlock(example.Input)),
			anthropic.NewAssistantMessage(anthropic.NewTextBlock(example.Output)),
		)
	}

	// Add the actual prompt
	messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(req.Prompt)))

	model := p.config.Model
	if model == "" {
		model = "claude-3-5-sonnet-20241022" // Latest Claude 3.5 Sonnet
	}

	maxTokens := req.MaxTokens
	if maxTokens == 0 {
		maxTokens = 2000
	}

	// Build parameters for the official SDK
	params := anthropic.MessageNewParams{
		Model:     anthropic.Model(model),
		MaxTokens: int64(maxTokens),
		Messages:  messages,
	}

	// Add temperature if specified
	if req.Temperature > 0 {
		params.Temperature = anthropic.Float(req.Temperature)
	}

	// Add system prompt if specified
	if req.SystemPrompt != "" {
		params.System = []anthropic.TextBlockParam{
			{
				Type: "text",
				Text: req.SystemPrompt,
			},
		}
	}

	// Call the API using the official SDK
	response, err := p.client.Messages.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("anthropic API call failed: %w", err)
	}

	// Extract content from response
	if len(response.Content) == 0 {
		return nil, fmt.Errorf("no content in response")
	}

	var content string
	for _, block := range response.Content {
		if block.Type == "text" {
			content += block.Text
		}
	}

	// Calculate total tokens used
	tokensUsed := 0
	if response.Usage.InputTokens > 0 {
		tokensUsed += int(response.Usage.InputTokens)
	}
	if response.Usage.OutputTokens > 0 {
		tokensUsed += int(response.Usage.OutputTokens)
	}

	return &GenerateResponse{
		Content:    content,
		TokensUsed: tokensUsed,
		Model:      string(response.Model),
	}, nil
}

// GetEmbedding returns embeddings for the given text
// Note: Anthropic doesn't provide embeddings, so we return an error
func (p *AnthropicProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	return nil, fmt.Errorf("anthropic provider does not support embeddings - use OpenAI or OpenRouter for embeddings")
}

// Name returns the provider name
func (p *AnthropicProvider) Name() string {
	return ProviderAnthropic
}

// IsAvailable checks if the provider is configured
func (p *AnthropicProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *AnthropicProvider) SupportsEmbeddings() bool {
	return false
}
