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

// GetEmbedding creates embeddings using OpenAI's official SDK
func (p *OpenAIProvider) GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error) {
	logger := log.GetLogger()
	logger.Debug("OpenAIProvider: Getting embedding")

	// Create embedding parameters using the official SDK
	params := openai.EmbeddingNewParams{
		Model: openai.EmbeddingModelTextEmbedding3Small,
		Input: openai.EmbeddingNewParamsInputUnion{
			OfString: openai.String(text),
		},
	}

	// Call the embeddings API
	response, err := p.client.Embeddings.New(ctx, params)
	if err != nil {
		logger.WithError(err).Error("OpenAIProvider: Failed to create embedding")
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	// Extract embedding from response
	if len(response.Data) == 0 {
		logger.Warn("OpenAIProvider: No embedding returned from OpenAI")
		return nil, fmt.Errorf("no embedding returned")
	}

	// Convert []float64 to []float32
	embeddingF64 := response.Data[0].Embedding
	embeddingF32 := make([]float32, len(embeddingF64))
	for i, v := range embeddingF64 {
		embeddingF32[i] = float32(v)
	}
	logger.Debugf("OpenAIProvider: Successfully created embedding with length %d", len(embeddingF32))

	return embeddingF32, nil
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
