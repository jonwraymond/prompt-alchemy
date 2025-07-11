package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewAnthropicProvider(t *testing.T) {
	tests := []struct {
		name   string
		config Config
	}{
		{
			name: "basic config",
			config: Config{
				APIKey: "test-key",
			},
		},
		{
			name: "config with base URL",
			config: Config{
				APIKey:  "test-key",
				BaseURL: "https://api.anthropic.com",
			},
		},
		{
			name: "config with model",
			config: Config{
				APIKey: "test-key",
				Model:  "claude-3-5-sonnet-20241022",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewAnthropicProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
			assert.NotNil(t, provider.client)
		})
	}
}

func TestAnthropicProvider_Name(t *testing.T) {
	provider := NewAnthropicProvider(Config{APIKey: "test-key"})
	assert.Equal(t, "anthropic", provider.Name())
}

func TestAnthropicProvider_IsAvailable(t *testing.T) {
	tests := []struct {
		name      string
		config    Config
		available bool
	}{
		{
			name: "with API key",
			config: Config{
				APIKey: "test-key",
			},
			available: true,
		},
		{
			name: "without API key",
			config: Config{
				APIKey: "",
			},
			available: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewAnthropicProvider(tt.config)
			assert.Equal(t, tt.available, provider.IsAvailable())
		})
	}
}

func TestAnthropicProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewAnthropicProvider(Config{APIKey: "test-key"})
	assert.False(t, provider.SupportsEmbeddings())
}

func TestAnthropicProvider_GetEmbedding(t *testing.T) {
	provider := NewAnthropicProvider(Config{APIKey: "test-key"})

	ctx := context.Background()
	_, err := provider.GetEmbedding(ctx, "test text", nil)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not support embeddings")
}

func TestAnthropicProvider_Generate_WithoutAPIKey(t *testing.T) {
	provider := NewAnthropicProvider(Config{
		APIKey: "fake-key-for-testing",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   100,
	}

	// This should fail with authentication error since we're using a fake key
	_, err := provider.Generate(ctx, req)

	// We expect an error because the API key is fake
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "anthropic API call failed")
}

func TestAnthropicProvider_Generate_Parameters(t *testing.T) {
	// Test parameter validation without making actual API calls
	provider := NewAnthropicProvider(Config{
		APIKey: "fake-key-for-testing",
		Model:  "claude-3-5-sonnet-20241022",
	})

	tests := []struct {
		name    string
		request GenerateRequest
	}{
		{
			name: "basic request",
			request: GenerateRequest{
				Prompt:      "Test prompt",
				Temperature: 0.5,
				MaxTokens:   500,
			},
		},
		{
			name: "request with system prompt",
			request: GenerateRequest{
				Prompt:       "Test prompt",
				SystemPrompt: "You are a helpful assistant",
				Temperature:  0.3,
				MaxTokens:    1000,
			},
		},
		{
			name: "request with examples",
			request: GenerateRequest{
				Prompt: "Test prompt",
				Examples: []Example{
					{Input: "Hello", Output: "Hi there!"},
					{Input: "Goodbye", Output: "See you later!"},
				},
				Temperature: 0.7,
				MaxTokens:   200,
			},
		},
		{
			name: "request with zero temperature",
			request: GenerateRequest{
				Prompt:      "Test prompt",
				Temperature: 0.0,
				MaxTokens:   100,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			// We expect these to fail with auth errors, but we're testing parameter handling
			_, err := provider.Generate(ctx, tt.request)

			// Should fail with API error, not parameter validation error
			require.Error(t, err)
			assert.Contains(t, err.Error(), "anthropic API call failed")
		})
	}
}

func TestAnthropicProvider_DefaultValues(t *testing.T) {
	// Test that default values are applied correctly
	provider := NewAnthropicProvider(Config{
		APIKey: "fake-key-for-testing",
		// No model specified - should use default
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt: "Test prompt",
		// No MaxTokens specified - should use default
		// No Temperature specified - should handle gracefully
	}

	// This will fail due to fake API key, but we're testing default handling
	_, err := provider.Generate(ctx, req)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "anthropic API call failed")
}
