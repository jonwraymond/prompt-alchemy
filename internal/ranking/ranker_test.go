package ranking

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockProvider struct {
	mock.Mock
}

func (m *mockProvider) Generate(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*providers.GenerateResponse), args.Error(1)
}

func (m *mockProvider) GetEmbedding(ctx context.Context, text string, registry providers.RegistryInterface) ([]float32, error) {
	args := m.Called(ctx, text, registry)
	return args.Get(0).([]float32), args.Error(1)
}

func (m *mockProvider) Name() string             { return "mock" }
func (m *mockProvider) IsAvailable() bool        { return true }
func (m *mockProvider) SupportsEmbeddings() bool { return true }

type mockRegistry struct {
	mock.Mock
}

func (m *mockRegistry) Get(name string) (providers.Provider, error) {
	args := m.Called(name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(providers.Provider), args.Error(1)
}

func (m *mockRegistry) ListAvailable() []string {
	args := m.Called()
	return args.Get(0).([]string)
}

func (m *mockRegistry) ListEmbeddingCapableProviders() []string {
	return m.Called().Get(0).([]string)
}

func TestCalculateSemanticSimilarity(t *testing.T) {
	mockReg := new(mockRegistry)
	r := &Ranker{
		embedProvider: "mock",
		registry:      mockReg,
		logger:        logrus.New(),
	}
	ctx := context.Background()

	mockProv := new(mockProvider)
	mockReg.On("Get", "mock").Return(mockProv, nil)

	emb1 := []float32{1, 0, 0}
	emb2 := []float32{0, 1, 0}
	mockProv.On("GetEmbedding", ctx, "text1", mockReg).Return(emb1, nil)
	mockProv.On("GetEmbedding", ctx, "text2", mockReg).Return(emb2, nil)

	score := r.calculateSemanticSimilarity(ctx, "text1", "text2")
	assert.Equal(t, 0.5, score) // Cosine 0 → 0.5
}

func TestCalculateLengthRatio(t *testing.T) {
	r := &Ranker{}
	tests := []struct {
		t1, t2 string
		exp    float64
	}{{"", "", 0}, {"a", "", 0}, {"ab", "abcd", 0.5}, {"abc", "abc", 1.0}, {"abcd", "ab", 0.5}}
	for _, tt := range tests {
		assert.Equal(t, tt.exp, r.calculateLengthRatio(tt.t1, tt.t2))
	}
}

func TestRankPrompts(t *testing.T) {
	// Create mock registry and provider
	reg := new(mockRegistry)
	mockProv := new(mockProvider)

	// Set up expectations for embedding capability check
	reg.On("ListEmbeddingCapableProviders").Return([]string{"openai"})

	// Create ranker with proper mocks
	logger := logrus.New()
	r := &Ranker{
		storage:        &storage.Storage{}, // Mock if needed
		registry:       reg,
		logger:         logger,
		embedProvider:  "openai",
		tempWeight:     0.2,
		tokenWeight:    0.2,
		semanticWeight: 0.4,
		lengthWeight:   0.2,
	}

	prompts := []models.Prompt{{
		ID:          uuid.New(),
		Content:     "similar",
		Temperature: 0.7,
	}, {
		ID:          uuid.New(),
		Content:     "different",
		Temperature: 0.8,
	}}

	// Mock embeddings for "original" and prompts
	reg.On("Get", "openai").Return(mockProv, nil)
	mockProv.On("GetEmbedding", mock.Anything, "original", reg).Return([]float32{1, 0}, nil)
	mockProv.On("GetEmbedding", mock.Anything, "similar", reg).Return([]float32{0.9, 0.1}, nil)
	mockProv.On("GetEmbedding", mock.Anything, "different", reg).Return([]float32{0, 1}, nil)

	rankings, err := r.RankPrompts(context.Background(), prompts, "original")
	assert.NoError(t, err)
	assert.Len(t, rankings, 2)
	assert.True(t, rankings[0].SemanticScore > rankings[1].SemanticScore) // "similar" ranks higher
	assert.Equal(t, "similar", rankings[0].Prompt.Content)                // Verify sorting
}
