package providers

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/spf13/viper"
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
				Model:  "gemini-2.5-flash",
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
		name           string
		config         Config
		text           string
		registrySetup  func() RegistryInterface
		wantErr        bool
		wantErrMessage string
	}{
		{
			name:   "no client initialized",
			config: Config{APIKey: ""},
			text:   "test",
			registrySetup: func() RegistryInterface {
				return NewRegistry()
			},
			wantErr:        true,
			wantErrMessage: "google client not initialized",
		},
		{
			name:   "no fallback provider",
			config: Config{APIKey: "test-key"},
			text:   "test",
			registrySetup: func() RegistryInterface {
				return NewRegistry()
			},
			wantErr:        true,
			wantErrMessage: "no fallback provider available",
		},
		{
			name:   "fallback provider success",
			config: Config{APIKey: "test-key"},
			text:   "test",
			registrySetup: func() RegistryInterface {
				registry := NewRegistry()
				mockProvider := &MockProvider{
					GetEmbeddingFunc: func(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
						return []float32{0.1, 0.2}, nil
					},
					SupportsEmbeddingsFunc: func() bool { return true },
					IsAvailableFunc:        func() bool { return true },
				}
				registry.Register("mock-embedding-provider", mockProvider)
				return registry
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := NewGoogleProvider(tt.config)
			registry := tt.registrySetup()

			// Manually set a fallback since config doesn't handle it in tests
			if tt.name == "fallback provider success" {
				viper.Set("providers.openai.model", "mock-embedding-provider")
			}

			embedding, err := provider.GetEmbedding(context.Background(), tt.text, registry)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMessage)
				assert.Nil(t, embedding)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, embedding)
				assert.Equal(t, []float32{0.1, 0.2}, embedding)
			}
			viper.Set("providers.openai.model", "") // reset
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
