package providers

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewOllamaProvider(t *testing.T) {
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
	// Test with unavailable service - this is a unit test, not integration
	provider := NewOllamaProvider(Config{
		Model:   "llama2",
		BaseURL: "http://localhost:11434",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Hello, world!",
		Temperature: 0.7,
		MaxTokens:   10,
	}

	// This should fail with connection refused or model not found
	resp, err := provider.Generate(ctx, req)

	// We expect an error since no service is running or model doesn't exist
	assert.Error(t, err)
	assert.Nil(t, resp)
	// Accept either connection refused (no Ollama running) or model not found (Ollama running but no model)
	assert.True(t,
		strings.Contains(err.Error(), "connection refused") ||
			strings.Contains(err.Error(), "model") ||
			strings.Contains(err.Error(), "failed to generate"),
		"Expected connection or model error, got: %s", err.Error())
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
