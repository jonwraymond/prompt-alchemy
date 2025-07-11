package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

const testAPIKey = "test-key"
const unauthorizedError = "401 Unauthorized"

func TestNewOpenAIProvider(t *testing.T) {
	tests := []struct {
		name   string
		config Config
	}{
		{
			name: "basic config",
			config: Config{
				APIKey: testAPIKey,
			},
		},
		{
			name: "config with base URL",
			config: Config{
				APIKey:  testAPIKey,
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

func TestOpenAIProviderName(t *testing.T) {
	provider := NewOpenAIProvider(Config{APIKey: testAPIKey})
	assert.Equal(t, "openai", provider.Name())
}

func TestOpenAIProviderIsAvailable(t *testing.T) {
	tests := []struct {
		name     string
		config   Config
		expected bool
	}{
		{
			name: "with API key",
			config: Config{
				APIKey: testAPIKey,
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

func TestOpenAIProviderSupportsEmbeddings(t *testing.T) {
	provider := NewOpenAIProvider(Config{APIKey: testAPIKey})
	assert.True(t, provider.SupportsEmbeddings())
}

func TestOpenAIProviderGenerate(t *testing.T) {
	// Test with invalid API key - this is a unit test, not integration
	provider := NewOpenAIProvider(Config{
		APIKey: testAPIKey, // Invalid key to test error handling
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
	assert.Contains(t, err.Error(), unauthorizedError)
}

func TestOpenAIProviderGetEmbedding(t *testing.T) {
	provider := NewOpenAIProvider(Config{
		APIKey: testAPIKey,
	})

	// This should now make a real API call and fail with authentication error
	_, err := provider.GetEmbedding(context.Background(), "test text", nil)
	assert.Error(t, err)
	// Should get an authentication error from the API, not the old stub message
	assert.Contains(t, err.Error(), unauthorizedError)
}
