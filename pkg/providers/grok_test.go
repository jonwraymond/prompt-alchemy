package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewGrokProvider(t *testing.T) {
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
				Model:  "grok-4",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewGrokProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
		})
	}
}

func TestGrokProvider_Name(t *testing.T) {
	provider := NewGrokProvider(Config{APIKey: "test-key"})
	assert.Equal(t, ProviderGrok, provider.Name())
}

func TestGrokProvider_IsAvailable(t *testing.T) {
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
			provider := NewGrokProvider(tt.config)
			assert.Equal(t, tt.available, provider.IsAvailable())
		})
	}
}

func TestGrokProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewGrokProvider(Config{APIKey: "test-key"})
	assert.False(t, provider.SupportsEmbeddings())
}

func TestGrokProvider_Generate(t *testing.T) {
	provider := NewGrokProvider(Config{
		APIKey: "fake-key-for-testing",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   10,
	}

	// This should fail with authentication error since we're using a fake key
	resp, err := provider.Generate(ctx, req)
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "grok API")
}
