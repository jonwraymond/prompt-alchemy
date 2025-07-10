package providers

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestProvider is a mock provider for testing
type TestProvider struct {
	name               string
	available          bool
	supportsEmbeddings bool
	generateFunc       func(ctx context.Context, req GenerateRequest) (*GenerateResponse, error)
	embeddingFunc      func(ctx context.Context, text string, registry *Registry) ([]float32, error)
}

func (p *TestProvider) Name() string             { return p.name }
func (p *TestProvider) IsAvailable() bool        { return p.available }
func (p *TestProvider) SupportsEmbeddings() bool { return p.supportsEmbeddings }

func (p *TestProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	if p.generateFunc != nil {
		return p.generateFunc(ctx, req)
	}
	return &GenerateResponse{
		Content:    "Test response for: " + req.Prompt,
		TokensUsed: 100,
		Model:      "test-model",
	}, nil
}

func (p *TestProvider) GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error) {
	if p.embeddingFunc != nil {
		return p.embeddingFunc(ctx, text, registry)
	}
	if !p.supportsEmbeddings {
		return nil, errors.New("provider does not support embeddings")
	}
	return []float32{0.1, 0.2, 0.3}, nil
}

func TestProviderRegistry(t *testing.T) {
	// Create test providers
	provider1 := &TestProvider{
		name:               "test1",
		available:          true,
		supportsEmbeddings: true,
	}
	provider2 := &TestProvider{
		name:               "test2",
		available:          false,
		supportsEmbeddings: false,
	}

	// Test registration
	registry := NewRegistry()
	err1 := registry.Register("test1", provider1)
	assert.NoError(t, err1)

	err2 := registry.Register("test2", provider2)
	assert.NoError(t, err2)

	// Test retrieval
	retrieved1, err := registry.Get("test1")
	assert.NoError(t, err)
	assert.Equal(t, provider1, retrieved1)

	retrieved2, err := registry.Get("test2")
	assert.NoError(t, err)
	assert.Equal(t, provider2, retrieved2)

	// Test non-existent provider
	_, err = registry.Get("nonexistent")
	assert.Error(t, err)

	// Test available providers
	available := registry.ListAvailable()
	assert.Len(t, available, 1)
	assert.Contains(t, available, "test1")
}

func TestProviderTimeout(t *testing.T) {
	// Create provider with slow generation
	slowProvider := &TestProvider{
		name:      "slow",
		available: true,
		generateFunc: func(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
			select {
			case <-time.After(100 * time.Millisecond):
				return &GenerateResponse{Content: "slow response", Model: "test"}, nil
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		},
	}

	// Test with short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	req := GenerateRequest{
		Prompt:      "Test prompt",
		Temperature: 0.7,
		MaxTokens:   100,
	}

	_, err := slowProvider.Generate(ctx, req)
	assert.Error(t, err)
	assert.Equal(t, context.DeadlineExceeded, err)
}

func TestProviderConcurrency(t *testing.T) {
	provider := &TestProvider{
		name:      "concurrent",
		available: true,
	}

	// Test concurrent requests
	const numRequests = 10
	results := make(chan error, numRequests)

	for i := 0; i < numRequests; i++ {
		go func(id int) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			req := GenerateRequest{
				Prompt:      "Concurrent test prompt",
				Temperature: 0.7,
				MaxTokens:   100,
			}

			_, err := provider.Generate(ctx, req)
			results <- err
		}(i)
	}

	// Collect results
	for i := 0; i < numRequests; i++ {
		err := <-results
		assert.NoError(t, err)
	}
}

func TestEmbeddingNotSupported(t *testing.T) {
	provider := &TestProvider{
		name:               "no-embeddings",
		available:          true,
		supportsEmbeddings: false,
	}

	ctx := context.Background()
	_, err := provider.GetEmbedding(ctx, "test text", nil)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not support embeddings")
}

func TestProviderAvailability(t *testing.T) {
	tests := []struct {
		name      string
		provider  Provider
		available bool
	}{
		{
			name: "available provider",
			provider: &TestProvider{
				name:      "available",
				available: true,
			},
			available: true,
		},
		{
			name: "unavailable provider",
			provider: &TestProvider{
				name:      "unavailable",
				available: false,
			},
			available: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.available, tt.provider.IsAvailable())
		})
	}
}

func TestGenerateRequest(t *testing.T) {
	provider := &TestProvider{
		name:      "test",
		available: true,
	}

	tests := []struct {
		name string
		req  GenerateRequest
	}{
		{
			name: "basic request",
			req: GenerateRequest{
				Prompt:      "Test prompt",
				Temperature: 0.7,
				MaxTokens:   100,
			},
		},
		{
			name: "request with system prompt",
			req: GenerateRequest{
				Prompt:       "Test prompt",
				SystemPrompt: "You are a helpful assistant",
				Temperature:  0.3,
				MaxTokens:    1000,
			},
		},
		{
			name: "request with examples",
			req: GenerateRequest{
				Prompt: "Test prompt",
				Examples: []Example{
					{Input: "Hello", Output: "Hi there!"},
					{Input: "Goodbye", Output: "See you later!"},
				},
				Temperature: 0.7,
				MaxTokens:   200,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			resp, err := provider.Generate(ctx, tt.req)

			assert.NoError(t, err)
			assert.NotNil(t, resp)
			assert.NotEmpty(t, resp.Content)
			assert.Greater(t, resp.TokensUsed, 0)
		})
	}
}

func TestEmbeddingProvider(t *testing.T) {
	provider := &TestProvider{
		name:               "embedding-provider",
		available:          true,
		supportsEmbeddings: true,
	}

	ctx := context.Background()
	registry := NewRegistry()

	embedding, err := provider.GetEmbedding(ctx, "test text", registry)

	assert.NoError(t, err)
	assert.NotNil(t, embedding)
	assert.Len(t, embedding, 3) // Our mock returns 3 values
}

func TestGetEmbeddingProvider(t *testing.T) {
	// Create providers
	noEmbedProvider := &TestProvider{
		name:               "no-embed",
		available:          true,
		supportsEmbeddings: false,
	}
	embedProvider := &TestProvider{
		name:               "with-embed",
		available:          true,
		supportsEmbeddings: true,
	}

	// Create registry and register providers
	registry := NewRegistry()
	if err := registry.Register("no-embed", noEmbedProvider); err != nil {
		t.Fatalf("Failed to register no-embed provider: %v", err)
	}
	if err := registry.Register("with-embed", embedProvider); err != nil {
		t.Fatalf("Failed to register with-embed provider: %v", err)
	}

	// Test fallback mechanism
	fallbackProvider := GetEmbeddingProvider(noEmbedProvider, registry)
	assert.Equal(t, "with-embed", fallbackProvider.Name())

	// Test primary provider that supports embeddings
	primaryProvider := GetEmbeddingProvider(embedProvider, registry)
	assert.Equal(t, "with-embed", primaryProvider.Name())
}

func BenchmarkProviderGenerate(b *testing.B) {
	provider := &TestProvider{
		name:      "benchmark",
		available: true,
	}

	req := GenerateRequest{
		Prompt:      "Benchmark test prompt",
		Temperature: 0.7,
		MaxTokens:   100,
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := provider.Generate(ctx, req)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkProviderEmbedding(b *testing.B) {
	provider := &TestProvider{
		name:               "benchmark",
		available:          true,
		supportsEmbeddings: true,
	}

	ctx := context.Background()
	text := "Benchmark embedding text"
	registry := NewRegistry()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := provider.GetEmbedding(ctx, text, registry)
		if err != nil {
			b.Fatal(err)
		}
	}
}
