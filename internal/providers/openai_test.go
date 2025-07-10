package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestOpenAIProvider_NewOpenAIProvider(t *testing.T) {
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
				BaseURL: "https://api.openai.com/v1",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewOpenAIProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
		})
	}
}

func TestOpenAIProvider_Name(t *testing.T) {
	provider := NewOpenAIProvider(Config{APIKey: "test-key"})
	assert.Equal(t, "openai", provider.Name())
}

func TestOpenAIProvider_IsAvailable(t *testing.T) {
	tests := []struct {
		name     string
		config   Config
		expected bool
	}{
		{
			name: "with API key",
			config: Config{
				APIKey: "test-key",
			},
			expected: true,
		},
		{
			name: "without API key",
			config: Config{
				APIKey: "",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewOpenAIProvider(tt.config)
			assert.Equal(t, tt.expected, provider.IsAvailable())
		})
	}
}

func TestOpenAIProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewOpenAIProvider(Config{APIKey: "test-key"})
	assert.True(t, provider.SupportsEmbeddings())
}

func TestOpenAIProvider_Generate(t *testing.T) {
	// Test with invalid API key - this is a unit test, not integration
	provider := NewOpenAIProvider(Config{
		APIKey: "test-key", // Invalid key to test error handling
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   10,
	}

	// This will fail with authentication error
	resp, err := provider.Generate(ctx, req)

	// We expect an error because we're using a fake API key
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "401 Unauthorized")
}

func TestOpenAIProvider_GetEmbedding(t *testing.T) {
	provider := NewOpenAIProvider(Config{
		APIKey: "test-key",
	})

	// This should now make a real API call and fail with authentication error
	_, err := provider.GetEmbedding(context.Background(), "test text", nil)
	assert.Error(t, err)
	// Should get an authentication error from the API, not the old stub message
	assert.Contains(t, err.Error(), "401 Unauthorized")
}
