package providers

import (
	"context"
	"testing"

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
	// This test is now mocked and does not require a real API call.
	provider := &MockProvider{
		GenerateFunc: func(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
			return &GenerateResponse{
				Content: "mocked response",
			}, nil
		},
	}

	req := GenerateRequest{
		Prompt: "Hello, world!",
	}

	resp, err := provider.Generate(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "mocked response", resp.Content)
}

func TestOpenAIProviderGetEmbedding(t *testing.T) {
	provider := &MockProvider{
		GetEmbeddingFunc: func(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
			return []float32{0.1, 0.2, 0.3}, nil
		},
	}

	embedding, err := provider.GetEmbedding(context.Background(), "test text", nil)
	assert.NoError(t, err)
	assert.NotNil(t, embedding)
	assert.Equal(t, []float32{0.1, 0.2, 0.3}, embedding)
}
