package providers

import (
	"context"
	"fmt"
	"strings"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"google.golang.org/genai"
)

// GoogleProvider implements the Provider interface for Google's Gemini AI
type GoogleProvider struct {
	config Config
	client *genai.Client
}

// NewGoogleProvider creates a new GoogleProvider
func NewGoogleProvider(config Config) *GoogleProvider {
	if config.APIKey == "" {
		// If no API key, return provider without client
		return &GoogleProvider{
			config: config,
		}
	}

	// Create client with API key
	ctx := context.Background()
	clientConfig := &genai.ClientConfig{
		APIKey:  config.APIKey,
		Backend: genai.BackendGeminiAPI,
	}

	client, err := genai.NewClient(ctx, clientConfig)
	if err != nil {
		log.GetLogger().WithError(err).Error("Failed to create Google Gemini client")
		return &GoogleProvider{
			config: config,
		}
	}

	return &GoogleProvider{
		config: config,
		client: client,
	}
}

// Generate generates a prompt using Google Gemini
func (p *GoogleProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	if p.client == nil {
		return nil, fmt.Errorf("google client not initialized")
	}

	// Use configured model or default
	model := p.config.Model
	if model == "" {
		model = "gemini-2.5-flash" // Default to Gemini 2.5 Flash (correct model name)
	}

	// Create generation config
	var config *genai.GenerateContentConfig
	if req.Temperature > 0 || req.MaxTokens > 0 || req.SystemPrompt != "" {
		config = &genai.GenerateContentConfig{}
		if req.Temperature > 0 {
			temp := float32(req.Temperature)
			config.Temperature = &temp
		}
		if req.MaxTokens > 0 {
			config.MaxOutputTokens = int32(req.MaxTokens)
		}
		// Add system instruction if provided
		if req.SystemPrompt != "" {
			config.SystemInstruction = &genai.Content{
				Role: "system",
				Parts: []*genai.Part{
					genai.NewPartFromText(req.SystemPrompt),
				},
			}
		}
	}

	// Build conversation history
	var history []*genai.Content

	// Add examples as conversation history if provided
	for _, example := range req.Examples {
		// Add user message
		history = append(history, &genai.Content{
			Role: genai.RoleUser,
			Parts: []*genai.Part{
				genai.NewPartFromText(example.Input),
			},
		})
		// Add assistant response
		history = append(history, &genai.Content{
			Role: genai.RoleModel,
			Parts: []*genai.Part{
				genai.NewPartFromText(example.Output),
			},
		})
	}

	// Create chat with history
	chat, err := p.client.Chats.Create(ctx, model, config, history)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat: %w", err)
	}

	// Send the actual prompt
	part := genai.NewPartFromText(req.Prompt)
	result, err := chat.SendMessage(ctx, *part)
	if err != nil {
		return nil, fmt.Errorf("google Gemini API call failed: %w", err)
	}

	// Extract content from response
	content := result.Text()
	if content == "" {
		return nil, fmt.Errorf("empty response from Google Gemini")
	}

	// Build response
	response := &GenerateResponse{
		Content: strings.TrimSpace(content),
		Model:   model,
	}

	// Add token usage if available
	if result.UsageMetadata != nil {
		totalTokens := result.UsageMetadata.TotalTokenCount
		response.TokensUsed = int(totalTokens)
	}

	return response, nil
}

// GetEmbedding generates an embedding for the given text
func (p *GoogleProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	if p.client == nil {
		return nil, fmt.Errorf("google client not initialized")
	}

	// Google Gemini doesn't have a dedicated embedding model like text-embedding-gecko
	// For now, fallback to another provider
	logger := log.GetLogger()
	logger.Debug("Google provider doesn't support direct embeddings, falling back to another provider")

	// Try to use OpenAI or another provider for embeddings
	if registry != nil {
		// Try OpenAI first
		openAI, err := registry.Get(ProviderOpenAI)
		if err == nil && openAI.IsAvailable() && openAI.SupportsEmbeddings() {
			logger.Debug("Using OpenAI for embeddings fallback")
			return openAI.GetEmbedding(ctx, text, registry)
		}

		// Try any available provider that supports embeddings
		for _, providerName := range registry.ListAvailable() {
			if providerName == ProviderGoogle {
				continue // Skip self
			}
			provider, err := registry.Get(providerName)
			if err == nil && provider.SupportsEmbeddings() {
				logger.Debugf("Using %s for embeddings fallback", providerName)
				return provider.GetEmbedding(ctx, text, registry)
			}
		}
	}

	return nil, fmt.Errorf("google provider does not support embeddings directly and no fallback provider available")
}

// Name returns the name of the provider
func (p *GoogleProvider) Name() string {
	return "google"
}

// IsAvailable checks if the provider is available
func (p *GoogleProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embeddings
func (p *GoogleProvider) SupportsEmbeddings() bool {
	return true
}

// SupportsStreaming checks if the provider supports streaming generation
func (p *GoogleProvider) SupportsStreaming() bool {
	return false
}
