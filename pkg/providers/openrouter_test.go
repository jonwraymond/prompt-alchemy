package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewOpenRouterProvider(t *testing.T) {
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
			name: "config with model",
			config: Config{
				APIKey: "test-key",
				Model:  "openrouter/auto",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewOpenRouterProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
			assert.NotNil(t, provider.httpClient)
		})
	}
}

func TestOpenRouterProvider_Name(t *testing.T) {
	provider := NewOpenRouterProvider(Config{APIKey: "test-key"})
	assert.Equal(t, ProviderOpenRouter, provider.Name())
}

func TestOpenRouterProvider_IsAvailable(t *testing.T) {
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
			provider := NewOpenRouterProvider(tt.config)
			assert.Equal(t, tt.available, provider.IsAvailable())
		})
	}
}

func TestOpenRouterProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewOpenRouterProvider(Config{APIKey: "test-key"})
	assert.True(t, provider.SupportsEmbeddings())
}

func TestOpenRouterProvider_Generate(t *testing.T) {
	provider := NewOpenRouterProvider(Config{
		APIKey: "fake-key-for-testing",
		Model:  "test-model",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   10,
	}

	// Since OpenRouter is using placeholder implementation, it returns success
	resp, err := provider.Generate(ctx, req)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "This is a placeholder response from the OpenRouter provider.", resp.Content)
	assert.Equal(t, 10, resp.TokensUsed)
	assert.Equal(t, "test-model", resp.Model)
}

func TestOpenRouterProvider_GetEmbedding(t *testing.T) {
	provider := NewOpenRouterProvider(Config{
		APIKey: "test-key",
	})

	ctx := context.Background()
	embedding, err := provider.GetEmbedding(ctx, "test text", nil)

	// Since OpenRouter is using placeholder implementation, it returns success
	assert.NoError(t, err)
	assert.NotNil(t, embedding)
	assert.Equal(t, []float32{0.4, 0.5, 0.6}, embedding)
}

func TestOpenRouterProvider_SupportsStreaming(t *testing.T) {
	provider := NewOpenRouterProvider(Config{APIKey: "test-key"})
	assert.False(t, provider.SupportsStreaming())
}
