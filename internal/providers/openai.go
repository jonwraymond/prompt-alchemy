package providers

import (
	"context"
	"fmt"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// OpenAIProvider implements the Provider interface for OpenAI using the official SDK
type OpenAIProvider struct {
	client openai.Client
	config Config
}

// NewOpenAIProvider creates a new OpenAI provider using the official SDK
func NewOpenAIProvider(config Config) *OpenAIProvider {
	opts := []option.RequestOption{
		option.WithAPIKey(config.APIKey),
	}

	if config.BaseURL != "" {
		opts = append(opts, option.WithBaseURL(config.BaseURL))
	}

	client := openai.NewClient(opts...)

	return &OpenAIProvider{
		client: client,
		config: config,
	}
}

// Generate creates a prompt using OpenAI's official SDK
func (p *OpenAIProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	messages := []openai.ChatCompletionMessageParamUnion{}

	// Add system prompt if provided
	if req.SystemPrompt != "" {
		messages = append(messages, openai.SystemMessage(req.SystemPrompt))
	}

	// Add examples if provided
	for _, example := range req.Examples {
		messages = append(messages, openai.UserMessage(example.Input))
		messages = append(messages, openai.AssistantMessage(example.Output))
	}

	// Add the actual prompt
	messages = append(messages, openai.UserMessage(req.Prompt))

	// Use configured model or default
	model := p.config.Model
	if model == "" {
		model = "o4-mini" // Default to o4-mini
	}

	// Create chat completion parameters
	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
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
		return nil, fmt.Errorf("OpenAI API call failed: %w", err)
	}

	// Extract the response
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from OpenAI API")
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

// GetEmbedding returns embeddings for the given text using OpenAI's embedding API
func (p *OpenAIProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	logger := log.GetLogger()
	logger.Debug("OpenAIProvider: Getting embedding")

	model := "text-embedding-3-small" // Standard model for all embeddings (1536 dimensions)
	logger.Debugf("OpenAIProvider: Using embedding model: %s", model)

	response, err := p.client.Embeddings.New(ctx, openai.EmbeddingNewParams{
		Input: openai.EmbeddingNewParamsInputUnion{
			OfString: openai.String(text),
		},
		Model: openai.EmbeddingModelTextEmbedding3Small,
	})
	if err != nil {
		logger.WithError(err).Error("OpenAIProvider: Failed to create embedding")
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	if len(response.Data) == 0 {
		logger.Error("OpenAIProvider: No embedding data returned")
		return nil, fmt.Errorf("no embedding data returned")
	}

	// Convert []float64 to []float32
	embedding := make([]float32, len(response.Data[0].Embedding))
	for i, v := range response.Data[0].Embedding {
		embedding[i] = float32(v)
	}
	logger.Debugf("OpenAIProvider: Successfully created embedding with length %d", len(embedding))

	return embedding, nil
}

// Name returns the provider name
func (p *OpenAIProvider) Name() string {
	return ProviderOpenAI
}

// IsAvailable checks if the provider is configured
func (p *OpenAIProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *OpenAIProvider) SupportsEmbeddings() bool {
	return true
}
