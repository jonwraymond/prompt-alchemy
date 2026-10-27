package providers

import (
	"context"
	"errors"
)

// MockProvider is a configurable Provider implementation for tests.
//
// It lives in the providers package (rather than a _test.go file) because
// tests in other packages use it to exercise provider-dependent components.
type MockProvider struct {
	GenerateFunc           func(context.Context, GenerateRequest) (*GenerateResponse, error)
	GetEmbeddingFunc       func(context.Context, string, RegistryInterface) ([]float32, error)
	NameFunc               func() string
	IsAvailableFunc        func() bool
	SupportsEmbeddingsFunc func() bool
	SupportsStreamingFunc  func() bool
}

func (m *MockProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	if m.GenerateFunc != nil {
		return m.GenerateFunc(ctx, req)
	}

	return &GenerateResponse{
		Content:    "Mock response for: " + req.Prompt,
		TokensUsed: 100,
		Model:      m.Name() + "-model",
	}, nil
}

func (m *MockProvider) GetEmbedding(ctx context.Context, text string, registry RegistryInterface) ([]float32, error) {
	if m.GetEmbeddingFunc != nil {
		return m.GetEmbeddingFunc(ctx, text, registry)
	}
	if !m.SupportsEmbeddings() {
		return nil, errors.New("provider does not support embeddings")
	}

	return []float32{0.1, 0.2, 0.3}, nil
}

func (m *MockProvider) Name() string {
	if m.NameFunc != nil {
		return m.NameFunc()
	}
	return "mock"
}

func (m *MockProvider) IsAvailable() bool {
	if m.IsAvailableFunc != nil {
		return m.IsAvailableFunc()
	}
	return true
}

func (m *MockProvider) SupportsEmbeddings() bool {
	if m.SupportsEmbeddingsFunc != nil {
		return m.SupportsEmbeddingsFunc()
	}
	return false
}

func (m *MockProvider) SupportsStreaming() bool {
	if m.SupportsStreamingFunc != nil {
		return m.SupportsStreamingFunc()
	}
	return false
}
