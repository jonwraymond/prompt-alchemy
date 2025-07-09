package providers

import (
	"context"
	"fmt"

	"github.com/sashabaranov/go-openai"
)

// OpenAIProvider implements the Provider interface for OpenAI
type OpenAIProvider struct {
	client *openai.Client
	config Config
}

// NewOpenAIProvider creates a new OpenAI provider
func NewOpenAIProvider(config Config) *OpenAIProvider {
	clientConfig := openai.DefaultConfig(config.APIKey)
	if config.BaseURL != "" {
		clientConfig.BaseURL = config.BaseURL
	}

	return &OpenAIProvider{
		client: openai.NewClientWithConfig(clientConfig),
		config: config,
	}
}

// Generate creates a prompt using OpenAI
func (p *OpenAIProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: req.SystemPrompt,
		},
	}

	// Add examples if provided
	for _, example := range req.Examples {
		messages = append(messages,
			openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleUser,
				Content: example.Input,
			},
			openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleAssistant,
				Content: example.Output,
			},
		)
	}

	// Add the actual prompt
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.Prompt,
	})

	model := p.config.Model
	if model == "" {
		model = openai.GPT4TurboPreview
	}

	resp, err := p.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: float32(req.Temperature),
		MaxTokens:   req.MaxTokens,
	})

	if err != nil {
		return nil, fmt.Errorf("openai generation failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from openai")
	}

	return &GenerateResponse{
		Content:    resp.Choices[0].Message.Content,
		TokensUsed: resp.Usage.TotalTokens,
		Model:      resp.Model,
	}, nil
}

// GetEmbedding returns embeddings for the given text
func (p *OpenAIProvider) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
	resp, err := p.client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.AdaEmbeddingV2,
	})

	if err != nil {
		return nil, fmt.Errorf("openai embedding failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return resp.Data[0].Embedding, nil
}

// Name returns the provider name
func (p *OpenAIProvider) Name() string {
	return "openai"
}

// IsAvailable checks if the provider is configured
func (p *OpenAIProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}
