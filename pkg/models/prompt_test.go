package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestPrompt_NewPrompt(t *testing.T) {
	prompt := &Prompt{
		ID:           uuid.New(),
		Content:      "Test prompt content",
		Phase:        PhaseIdea,
		Provider:     "openai",
		Model:        "gpt-4",
		Temperature:  0.7,
		MaxTokens:    1000,
		ActualTokens: 150,
		Tags:         []string{"test", "unit"},
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	assert.NotEqual(t, uuid.Nil, prompt.ID)
	assert.Equal(t, "Test prompt content", prompt.Content)
	assert.Equal(t, PhaseIdea, prompt.Phase)
	assert.Equal(t, "openai", prompt.Provider)
	assert.Equal(t, "gpt-4", prompt.Model)
	assert.Equal(t, 0.7, prompt.Temperature)
	assert.Equal(t, 1000, prompt.MaxTokens)
	assert.Equal(t, 150, prompt.ActualTokens)
	assert.Contains(t, prompt.Tags, "test")
	assert.Contains(t, prompt.Tags, "unit")
}

func TestPromptRequest_Fields(t *testing.T) {
	request := PromptRequest{
		Input:       "Create a web application",
		Phases:      []Phase{PhaseIdea, PhaseHuman},
		Temperature: 0.7,
		MaxTokens:   1000,
		Count:       2,
		Tags:        []string{"web", "application"},
		Context:     []string{"React", "TypeScript"},
	}

	assert.Equal(t, "Create a web application", request.Input)
	assert.Len(t, request.Phases, 2)
	assert.Contains(t, request.Phases, PhaseIdea)
	assert.Contains(t, request.Phases, PhaseHuman)
	assert.Equal(t, 0.7, request.Temperature)
	assert.Equal(t, 1000, request.MaxTokens)
	assert.Equal(t, 2, request.Count)
	assert.Contains(t, request.Tags, "web")
	assert.Contains(t, request.Context, "React")
}

func TestPhase_String(t *testing.T) {
	tests := []struct {
		phase    Phase
		expected string
	}{
		{PhaseIdea, "idea"},
		{PhaseHuman, "human"},
		{PhasePrecision, "precision"},
	}

	for _, tt := range tests {
		t.Run(string(tt.phase), func(t *testing.T) {
			assert.Equal(t, tt.expected, string(tt.phase))
		})
	}
}

func TestPhase_Values(t *testing.T) {
	// Test valid phase values
	assert.Equal(t, "idea", string(PhaseIdea))
	assert.Equal(t, "human", string(PhaseHuman))
	assert.Equal(t, "precision", string(PhasePrecision))
}

func TestPersonaType_Values(t *testing.T) {
	// Test valid persona type values
	assert.Equal(t, "code", string(PersonaCode))
	assert.Equal(t, "writing", string(PersonaWriting))
	assert.Equal(t, "analysis", string(PersonaAnalysis))
	assert.Equal(t, "generic", string(PersonaGeneric))
}

func TestPromptMetrics(t *testing.T) {
	metrics := &PromptMetrics{
		ID:              uuid.New(),
		PromptID:        uuid.New(),
		ConversionRate:  0.85,
		EngagementScore: 0.92,
		TokenUsage:      150,
		ResponseTime:    250,
		UsageCount:      10,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	assert.NotEqual(t, uuid.Nil, metrics.ID)
	assert.NotEqual(t, uuid.Nil, metrics.PromptID)
	assert.Equal(t, 0.85, metrics.ConversionRate)
	assert.Equal(t, 0.92, metrics.EngagementScore)
	assert.Equal(t, 150, metrics.TokenUsage)
	assert.Equal(t, 250, metrics.ResponseTime)
	assert.Equal(t, 10, metrics.UsageCount)
}

func TestModelMetadata(t *testing.T) {
	metadata := &ModelMetadata{
		ID:                 uuid.New(),
		PromptID:           uuid.New(),
		GenerationModel:    "gpt-4",
		GenerationProvider: "openai",
		EmbeddingModel:     "text-embedding-3-small",
		EmbeddingProvider:  "openai",
		ModelVersion:       "2024-04-09",
		APIVersion:         "v1",
		ProcessingTime:     1500,
		InputTokens:        100,
		OutputTokens:       150,
		TotalTokens:        250,
		Cost:               0.005,
		CreatedAt:          time.Now(),
	}

	assert.NotEqual(t, uuid.Nil, metadata.ID)
	assert.NotEqual(t, uuid.Nil, metadata.PromptID)
	assert.Equal(t, "gpt-4", metadata.GenerationModel)
	assert.Equal(t, "openai", metadata.GenerationProvider)
	assert.Equal(t, "text-embedding-3-small", metadata.EmbeddingModel)
	assert.Equal(t, "openai", metadata.EmbeddingProvider)
	assert.Equal(t, 1500, metadata.ProcessingTime)
	assert.Equal(t, 250, metadata.TotalTokens)
	assert.Equal(t, 0.005, metadata.Cost)
}

func TestPromptContext(t *testing.T) {
	context := &PromptContext{
		ID:             uuid.New(),
		PromptID:       uuid.New(),
		ContextType:    "file",
		Content:        "Additional context content",
		RelevanceScore: 0.95,
		CreatedAt:      time.Now(),
	}

	assert.NotEqual(t, uuid.Nil, context.ID)
	assert.NotEqual(t, uuid.Nil, context.PromptID)
	assert.Equal(t, "file", context.ContextType)
	assert.Equal(t, "Additional context content", context.Content)
	assert.Equal(t, 0.95, context.RelevanceScore)
}

func TestPromptRanking(t *testing.T) {
	prompt := &Prompt{
		ID:      uuid.New(),
		Content: "Test prompt",
		Phase:   PhaseIdea,
	}

	ranking := &PromptRanking{
		Prompt:            prompt,
		Score:             0.88,
		TemperatureScore:  0.85,
		TokenScore:        0.90,
		HistoricalScore:   0.80,
		ContextScore:      0.95,
		EmbeddingDistance: 0.12,
	}

	assert.NotNil(t, ranking.Prompt)
	assert.Equal(t, 0.88, ranking.Score)
	assert.Equal(t, 0.85, ranking.TemperatureScore)
	assert.Equal(t, 0.90, ranking.TokenScore)
	assert.Equal(t, 0.80, ranking.HistoricalScore)
	assert.Equal(t, 0.95, ranking.ContextScore)
	assert.Equal(t, 0.12, ranking.EmbeddingDistance)
}

func TestGenerationResult(t *testing.T) {
	prompt1 := Prompt{
		ID:      uuid.New(),
		Content: "First prompt",
		Phase:   PhaseIdea,
	}
	prompt2 := Prompt{
		ID:      uuid.New(),
		Content: "Second prompt",
		Phase:   PhaseHuman,
	}

	ranking1 := PromptRanking{
		Prompt: &prompt1,
		Score:  0.85,
	}
	ranking2 := PromptRanking{
		Prompt: &prompt2,
		Score:  0.92,
	}

	result := &GenerationResult{
		Prompts:  []Prompt{prompt1, prompt2},
		Rankings: []PromptRanking{ranking1, ranking2},
		Selected: &prompt2,
	}

	assert.Len(t, result.Prompts, 2)
	assert.Len(t, result.Rankings, 2)
	assert.NotNil(t, result.Selected)
	assert.Equal(t, prompt2.ID, result.Selected.ID)

	// Test finding best prompt
	bestRanking := result.Rankings[0]
	for _, ranking := range result.Rankings {
		if ranking.Score > bestRanking.Score {
			bestRanking = ranking
		}
	}
	assert.Equal(t, 0.92, bestRanking.Score)
	assert.Equal(t, prompt2.ID, bestRanking.Prompt.ID)
}

func TestPrompt_WithEmbedding(t *testing.T) {
	prompt := &Prompt{
		ID:                uuid.New(),
		Content:           "Test prompt with embedding",
		Phase:             PhaseIdea,
		Provider:          "openai",
		Model:             "gpt-4",
		Embedding:         []float32{0.1, 0.2, 0.3, 0.4, 0.5},
		EmbeddingModel:    "text-embedding-3-small",
		EmbeddingProvider: "openai",
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	assert.NotNil(t, prompt.Embedding)
	assert.Len(t, prompt.Embedding, 5)
	assert.Equal(t, "text-embedding-3-small", prompt.EmbeddingModel)
	assert.Equal(t, "openai", prompt.EmbeddingProvider)
}

func TestPrompt_WithParent(t *testing.T) {
	parentID := uuid.New()
	prompt := &Prompt{
		ID:       uuid.New(),
		Content:  "Child prompt",
		Phase:    PhaseHuman,
		ParentID: &parentID,
	}

	assert.NotNil(t, prompt.ParentID)
	assert.Equal(t, parentID, *prompt.ParentID)
}

func TestPrompt_WithComplexContext(t *testing.T) {
	prompt := &Prompt{
		ID:      uuid.New(),
		Content: "Complex prompt with context",
		Phase:   PhasePrecision,
		Context: []PromptContext{
			{
				ID:             uuid.New(),
				ContextType:    "file",
				Content:        "File context",
				RelevanceScore: 0.9,
			},
			{
				ID:             uuid.New(),
				ContextType:    "previous",
				Content:        "Previous prompt context",
				RelevanceScore: 0.8,
			},
		},
	}

	assert.Len(t, prompt.Context, 2)
	assert.Equal(t, "file", prompt.Context[0].ContextType)
	assert.Equal(t, "previous", prompt.Context[1].ContextType)
	assert.Equal(t, 0.9, prompt.Context[0].RelevanceScore)
	assert.Equal(t, 0.8, prompt.Context[1].RelevanceScore)
}

// Benchmark tests

func BenchmarkPrompt_Creation(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		prompt := &Prompt{
			ID:           uuid.New(),
			Content:      "Benchmark prompt content",
			Phase:        PhaseIdea,
			Provider:     "openai",
			Model:        "gpt-4",
			Temperature:  0.7,
			MaxTokens:    1000,
			ActualTokens: 150,
			Tags:         []string{"benchmark", "test"},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		_ = prompt
	}
}

func BenchmarkPromptRequest_Creation(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		request := PromptRequest{
			Input:       "Benchmark creation test",
			Phases:      []Phase{PhaseIdea, PhaseHuman},
			Temperature: 0.7,
			MaxTokens:   1000,
			Count:       1,
			Tags:        []string{"benchmark"},
		}
		_ = request
	}
}
