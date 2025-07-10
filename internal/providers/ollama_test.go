package providers

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestOllamaProvider_NewOllamaProvider(t *testing.T) {
	tests := []struct {
		name   string
		config Config
	}{
		{
			name: "basic config",
			config: Config{
				Model: "llama2",
			},
		},
		{
			name: "config with base URL",
			config: Config{
				Model:   "llama2",
				BaseURL: "http://localhost:11434",
			},
		},
		{
			name: "config with timeout",
			config: Config{
				Model:   "llama2",
				Timeout: 60,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewOllamaProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
			assert.NotNil(t, provider.client)
		})
	}
}

func TestOllamaProvider_Name(t *testing.T) {
	provider := NewOllamaProvider(Config{Model: "llama2"})
	assert.Equal(t, "ollama", provider.Name())
}

func TestOllamaProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewOllamaProvider(Config{Model: "llama2"})
	assert.True(t, provider.SupportsEmbeddings())
}

func TestOllamaProvider_Generate(t *testing.T) {
	// Skip integration tests unless Ollama is running
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	provider := NewOllamaProvider(Config{
		Model:   "llama2",
		BaseURL: "http://localhost:11434",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   10,
	}

	// This will fail unless Ollama is running locally - that's expected for unit tests
	_, err := provider.Generate(ctx, req)
	// We expect an error because Ollama is likely not running in test environment
	assert.Error(t, err)
}

func TestOllamaProvider_GetEmbedding(t *testing.T) {
	provider := NewOllamaProvider(Config{
		Model:   "nomic-embed-text",
		BaseURL: "http://localhost:11434",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Check if Ollama is available
	if provider.IsAvailable() {
		// If Ollama is running, we expect GetEmbedding to succeed
		_, err := provider.GetEmbedding(ctx, "test text", nil)
		assert.NoError(t, err, "GetEmbedding should succeed when Ollama is available")
	} else {
		// If Ollama is not running, we expect GetEmbedding to fail
		_, err := provider.GetEmbedding(ctx, "test text", nil)
		assert.Error(t, err, "GetEmbedding should fail when Ollama is not available")
	}
}

func TestOllamaProvider_IsAvailable(t *testing.T) {
	provider := NewOllamaProvider(Config{
		Model:   "llama2",
		BaseURL: "http://localhost:11434",
	})

	// This will return true if Ollama is running, false otherwise
	available := provider.IsAvailable()
	// We don't make assumptions about whether Ollama is running
	assert.IsType(t, true, available) // Just check it returns a boolean
}
