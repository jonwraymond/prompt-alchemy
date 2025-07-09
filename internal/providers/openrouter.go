package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
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
	Model       string              `json:"model"`
	Messages    []OpenRouterMessage `json:"messages"`
	Temperature float64             `json:"temperature,omitempty"`
	MaxTokens   int                 `json:"max_tokens,omitempty"`
	Stream      bool                `json:"stream"`
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
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code"`
}

// Generate creates a prompt using OpenRouter
func (p *OpenRouterProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
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
		model = "openai/gpt-4-turbo-preview"
	}

	orReq := OpenRouterRequest{
		Model:       model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}

	jsonData, err := json.Marshal(orReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("HTTP-Referer", "https://github.com/jraymond/promptforge")
	httpReq.Header.Set("X-Title", "PromptForge")

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var orResp OpenRouterResponse
	if err := json.Unmarshal(body, &orResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if orResp.Error != nil {
		return nil, fmt.Errorf("openrouter error: %s", orResp.Error.Message)
	}

	if len(orResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from openrouter")
	}

	return &GenerateResponse{
		Content:    orResp.Choices[0].Message.Content,
		TokensUsed: orResp.Usage.TotalTokens,
		Model:      orResp.Model,
	}, nil
}

// GetEmbedding returns embeddings for the given text using OpenRouter
func (p *OpenRouterProvider) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
	// OpenRouter typically routes to various providers for embeddings
	// Using OpenAI's embedding model through OpenRouter

	reqBody := map[string]interface{}{
		"model": "openai/text-embedding-ada-002",
		"input": text,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL+"/embeddings", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var embResp struct {
		Data []struct {
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
		Error *OpenRouterError `json:"error,omitempty"`
	}

	if err := json.Unmarshal(body, &embResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if embResp.Error != nil {
		return nil, fmt.Errorf("openrouter embedding error: %s", embResp.Error.Message)
	}

	if len(embResp.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return embResp.Data[0].Embedding, nil
}

// Name returns the provider name
func (p *OpenRouterProvider) Name() string {
	return "openrouter"
}

// IsAvailable checks if the provider is configured
func (p *OpenRouterProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}
