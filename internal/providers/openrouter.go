package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"io"
	"net/http"
	"time"
)

// OpenRouterProvider implements the Provider interface for OpenRouter
type OpenRouterProvider struct {
	config     Config
	httpClient *http.Client
}

// NewOpenRouterProvider creates a new OpenRouter provider
func NewOpenRouterProvider(config Config) *OpenRouterProvider {
	if config.BaseURL == "" {
		config.BaseURL = "https://openrouter.ai/api/v1"
	}

	return &OpenRouterProvider{
		config: config,
		httpClient: &http.Client{
			Timeout: time.Duration(config.Timeout) * time.Second,
		},
	}
}

// OpenRouterRequest represents the request structure for OpenRouter API
type OpenRouterRequest struct {
	Model       string                    `json:"model"`
	Models      []string                  `json:"models,omitempty"`   // Fallback models for routing
	Provider    *OpenRouterProviderConfig `json:"provider,omitempty"` // Provider routing preferences
	Messages    []OpenRouterMessage       `json:"messages"`
	Temperature float64                   `json:"temperature,omitempty"`
	MaxTokens   int                       `json:"max_tokens,omitempty"`
	Stream      bool                      `json:"stream"`
}

// OpenRouterProviderConfig represents provider routing configuration
type OpenRouterProviderConfig struct {
	Order             []string `json:"order,omitempty"`              // Preferred provider order
	AllowFallbacks    *bool    `json:"allow_fallbacks,omitempty"`    // Allow fallback providers
	RequireParameters *bool    `json:"require_parameters,omitempty"` // Require specific parameters
	QuantizeParams    *bool    `json:"quantize,omitempty"`           // Allow quantized models
	DataCollection    string   `json:"data_collection,omitempty"`    // Data collection preference
}

// OpenRouterMessage represents a message in the OpenRouter format
type OpenRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenRouterResponse represents the response from OpenRouter API
type OpenRouterResponse struct {
	ID      string             `json:"id"`
	Model   string             `json:"model"`
	Choices []OpenRouterChoice `json:"choices"`
	Usage   OpenRouterUsage    `json:"usage"`
	Error   *OpenRouterError   `json:"error,omitempty"`
}

// OpenRouterChoice represents a choice in the response
type OpenRouterChoice struct {
	Message OpenRouterMessage `json:"message"`
	Index   int               `json:"index"`
}

// OpenRouterUsage represents token usage information
type OpenRouterUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// OpenRouterError represents an error from the API
type OpenRouterError struct {
	Message string      `json:"message"`
	Type    string      `json:"type"`
	Code    interface{} `json:"code"` // Can be string or number
}

// Generate creates a prompt using OpenRouter
func (p *OpenRouterProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	logger := log.GetLogger()
	logger.Debug("OpenRouterProvider: Generating content")
	messages := []OpenRouterMessage{
		{
			Role:    "system",
			Content: req.SystemPrompt,
		},
	}

	// Add examples if provided
	for _, example := range req.Examples {
		messages = append(messages,
			OpenRouterMessage{
				Role:    "user",
				Content: example.Input,
			},
			OpenRouterMessage{
				Role:    "assistant",
				Content: example.Output,
			},
		)
	}

	// Add the actual prompt
	messages = append(messages, OpenRouterMessage{
		Role:    "user",
		Content: req.Prompt,
	})

	model := p.config.Model
	if model == "" {
		model = "openrouter/auto" // Default to auto-routing for intelligent model selection
	}
	logger.Debugf("OpenRouterProvider: Using model: %s", model)

	orReq := OpenRouterRequest{
		Model:       model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}

	// Add routing features if using auto-router or if configured
	if isAutoRouting(model) || hasRoutingConfig(&p.config) {
		logger.Debug("OpenRouterProvider: Auto-routing or routing config detected")
		// Add fallback models if configured
		if fallbackModels := getFallbackModels(&p.config); len(fallbackModels) > 0 {
			orReq.Models = fallbackModels
			logger.Debugf("OpenRouterProvider: Fallback models: %v", fallbackModels)
		}

		// Add provider routing preferences if configured
		if providerConfig := getProviderRouting(&p.config); providerConfig != nil {
			orReq.Provider = providerConfig
			logger.Debugf("OpenRouterProvider: Provider routing config: %+v", providerConfig)
		}
	}

	jsonData, err := json.Marshal(orReq)
	if err != nil {
		logger.WithError(err).Error("OpenRouterProvider: Failed to marshal request")
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		logger.WithError(err).Error("OpenRouterProvider: Failed to create HTTP request")
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("HTTP-Referer", "https://prompt-alchemy")
	httpReq.Header.Set("X-Title", "Prompt Alchemy")

	logger.Debugf("OpenRouterProvider: Sending request to %s", p.config.BaseURL+"/chat/completions")
	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		logger.WithError(err).Error("OpenRouterProvider: HTTP request failed")
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	logger.Debugf("OpenRouterProvider: Received response with status code: %d", resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.WithError(err).Error("OpenRouterProvider: Failed to read response body")
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var orResp OpenRouterResponse
	if err := json.Unmarshal(body, &orResp); err != nil {
		logger.WithError(err).Error("OpenRouterProvider: Failed to unmarshal response")
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if orResp.Error != nil {
		logger.Errorf("OpenRouterProvider: API error: %s (type: %s, code: %v)", orResp.Error.Message, orResp.Error.Type, orResp.Error.Code)
		return nil, fmt.Errorf("openrouter error: %s", orResp.Error.Message)
	}

	if len(orResp.Choices) == 0 {
		logger.Warn("OpenRouterProvider: No choices returned from OpenRouter")
		return nil, fmt.Errorf("no response from openrouter")
	}

	logger.Debugf("OpenRouterProvider: Successfully generated content. Tokens used: %d", orResp.Usage.TotalTokens)
	return &GenerateResponse{
		Content:    orResp.Choices[0].Message.Content,
		TokensUsed: orResp.Usage.TotalTokens,
		Model:      orResp.Model,
	}, nil
}

// GetEmbedding uses standardized OpenAI embeddings for compatibility
// All providers use the same embedding model to ensure dimensional compatibility
func (p *OpenRouterProvider) GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error) {
	// Use standardized embedding for compatibility with all other providers
	return getStandardizedEmbedding(ctx, text, registry)
}

// Name returns the provider name
func (p *OpenRouterProvider) Name() string {
	return ProviderOpenRouter
}

// IsAvailable checks if the provider is configured
func (p *OpenRouterProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *OpenRouterProvider) SupportsEmbeddings() bool {
	return true
}

// Helper functions for OpenRouter routing features

// isAutoRouting checks if the model is using OpenRouter's auto-routing feature
func isAutoRouting(model string) bool {
	return model == "openrouter/auto"
}

// hasRoutingConfig checks if routing configuration is available
func hasRoutingConfig(config *Config) bool {
	// Check if any routing-related configuration exists
	// For now, we'll assume routing config is available if using auto routing
	// This could be extended to check for environment variables or config files
	return config.Model == "openrouter/auto" || config.Model == ""
}

// getFallbackModels returns fallback models from configuration
func getFallbackModels(config *Config) []string {
	// Use configured fallback models if available
	if len(config.FallbackModels) > 0 {
		// OpenRouter allows max 3 fallback models
		if len(config.FallbackModels) > 3 {
			return config.FallbackModels[:3]
		}
		return config.FallbackModels
	}

	// Default fallback models for auto-routing (max 3 per OpenRouter requirements)
	// These are high-quality models with valid OpenRouter model IDs
	defaultFallbacks := []string{
		"anthropic/claude-3.5-sonnet",
		"openai/gpt-4o-mini",
		"google/gemini-pro-1.5",
	}

	return defaultFallbacks
}

// getProviderRouting returns provider routing configuration
func getProviderRouting(config *Config) *OpenRouterProviderConfig {
	// Default provider routing configuration for optimal performance and cost
	allowFallbacks := true
	requireParameters := false
	dataCollection := "deny" // Privacy-focused default

	providerConfig := &OpenRouterProviderConfig{
		Order: []string{
			"OpenAI",
			"Anthropic",
			"Google",
			"Meta",
		},
		AllowFallbacks:    &allowFallbacks,
		RequireParameters: &requireParameters,
		DataCollection:    dataCollection,
	}

	// Override with configured values if available
	if len(config.ProviderRouting) > 0 {
		if order, ok := config.ProviderRouting["order"].([]interface{}); ok {
			orderStrings := make([]string, len(order))
			for i, v := range order {
				if s, ok := v.(string); ok {
					orderStrings[i] = s
				}
			}
			if len(orderStrings) > 0 {
				providerConfig.Order = orderStrings
			}
		}

		if allowFallbacksVal, ok := config.ProviderRouting["allow_fallbacks"].(bool); ok {
			providerConfig.AllowFallbacks = &allowFallbacksVal
		}

		if requireParamsVal, ok := config.ProviderRouting["require_parameters"].(bool); ok {
			providerConfig.RequireParameters = &requireParamsVal
		}

		if dataCollectionVal, ok := config.ProviderRouting["data_collection"].(string); ok {
			providerConfig.DataCollection = dataCollectionVal
		}
	}

	return providerConfig
}
