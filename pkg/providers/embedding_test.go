package providers

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetStandardizedEmbedding(t *testing.T) {
	tests := []struct {
		name          string
		registry      *mockRegistry
		expectedError string
	}{
		{
			name: "successful embedding",
			registry: &mockRegistry{
				provider: &TestProvider{
					available:          true,
					supportsEmbeddings: true,
					embeddingFunc: func(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
						return []float32{0.1, 0.2}, nil
					},
				},
			},
			expectedError: "",
		},
		{
			name: "provider not found",
			registry: &mockRegistry{
				err: errors.New("provider not found"),
			},
			expectedError: "OpenAI provider not found",
		},
		{
			name: "provider not available",
			registry: &mockRegistry{
				provider: &TestProvider{
					available: false,
				},
			},
			expectedError: "not available",
		},
		{
			name: "provider does not support embeddings",
			registry: &mockRegistry{
				provider: &TestProvider{
					available:          true,
					supportsEmbeddings: false,
				},
			},
			expectedError: "does not support embeddings",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			embedding, err := getStandardizedEmbedding(ctx, "test text", tt.registry)
			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, embedding)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, embedding)
				assert.Len(t, embedding, 2)
			}
		})
	}
}

// mockRegistry implements RegistryInterface for testing
type mockRegistry struct {
	provider Provider
	err      error
}

func (m *mockRegistry) Get(name string) (Provider, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.provider, nil
}

func (m *mockRegistry) ListAvailable() []string {
	return []string{}
}

func (m *mockRegistry) ListEmbeddingCapableProviders() []string {
	return []string{}
}
