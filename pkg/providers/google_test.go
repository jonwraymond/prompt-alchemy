package providers

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewGoogleProvider(t *testing.T) {
	tests := []struct {
		name         string
		config       Config
		expectClient bool
	}{
		{
			name: "basic config with API key",
			config: Config{
				APIKey: "test-key",
			},
			expectClient: true,
		},
		{
			name: "config with model",
			config: Config{
				APIKey: "test-key",
				Model:  "gemini-2.0-flash",
			},
			expectClient: true,
		},
		{
			name: "config without API key",
			config: Config{
				APIKey: "",
			},
			expectClient: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewGoogleProvider(tt.config)
			assert.NotNil(t, provider)
			assert.Equal(t, tt.config, provider.config)
			if tt.expectClient {
				assert.NotNil(t, provider.client)
			} else {
				assert.Nil(t, provider.client)
			}
		})
	}
}

func TestGoogleProvider_Name(t *testing.T) {
	provider := NewGoogleProvider(Config{APIKey: "test-key"})
	assert.Equal(t, ProviderGoogle, provider.Name())
}

func TestGoogleProvider_IsAvailable(t *testing.T) {
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
			provider := NewGoogleProvider(tt.config)
			assert.Equal(t, tt.available, provider.IsAvailable())
		})
	}
}

func TestGoogleProvider_SupportsEmbeddings(t *testing.T) {
	provider := NewGoogleProvider(Config{APIKey: "test-key"})
	// Google provider returns true but uses fallback to other providers
	assert.True(t, provider.SupportsEmbeddings())
}

func TestGoogleProvider_Generate(t *testing.T) {
	provider := NewGoogleProvider(Config{
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
	// Check for either initialization error or API call error
	assert.True(t,
		contains(err.Error(), "Google client not initialized") ||
			contains(err.Error(), "Google Gemini API call failed") ||
			contains(err.Error(), "failed to create chat"),
		"Expected error message not found: %s", err.Error())
}

func TestGoogleProvider_GetEmbedding(t *testing.T) {
	tests := []struct {
		name     string
		config   Config
		text     string
		registry RegistryInterface
		wantErr  bool
		errMsg   string
	}{
		{
			name: "no client initialized",
			config: Config{
				APIKey: "",
			},
			text:     "test text",
			registry: nil,
			wantErr:  true,
			errMsg:   "Google client not initialized",
		},
		{
			name: "with client but no registry",
			config: Config{
				APIKey: "test-key",
			},
			text:     "test text",
			registry: nil,
			wantErr:  true,
			errMsg:   "Google provider does not support embeddings directly",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewGoogleProvider(tt.config)

			ctx := context.Background()
			embedding, err := provider.GetEmbedding(ctx, tt.text, tt.registry)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, embedding)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, embedding)
			}
		})
	}
}

func TestGoogleProvider_SupportsStreaming(t *testing.T) {
	provider := NewGoogleProvider(Config{APIKey: "test-key"})
	assert.False(t, provider.SupportsStreaming())
}

// Helper function for case-insensitive contains
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}
