package models

import (
	"time"

	"github.com/google/uuid"
)

// Prompt represents a generated prompt with all metadata
type Prompt struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Content      string     `json:"content" db:"content"`
	Phase        Phase      `json:"phase" db:"phase"`
	Provider     string     `json:"provider" db:"provider"`
	Model        string     `json:"model" db:"model"` // Model used for generation
	Temperature  float64    `json:"temperature" db:"temperature"`
	MaxTokens    int        `json:"max_tokens" db:"max_tokens"`
	ActualTokens int        `json:"actual_tokens" db:"actual_tokens"` // Actual tokens used
	Tags         []string   `json:"tags" db:"tags"`
	ParentID     *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`

	// Lifecycle management fields
	SourceType        string     `json:"source_type" db:"source_type"`                         // How prompt was created (manual, generated, optimized, derived)
	EnhancementMethod string     `json:"enhancement_method,omitempty" db:"enhancement_method"` // How it was improved
	RelevanceScore    float64    `json:"relevance_score" db:"relevance_score"`                 // Dynamic relevance score (0.0-1.0)
	UsageCount        int        `json:"usage_count" db:"usage_count"`                         // How many times accessed/used
	GenerationCount   int        `json:"generation_count" db:"generation_count"`               // How many prompts this generated
	LastUsedAt        *time.Time `json:"last_used_at,omitempty" db:"last_used_at"`             // Last access timestamp

	// Original input tracking
	OriginalInput     string         `json:"original_input,omitempty" db:"original_input"`           // Original user input that generated this
	GenerationRequest *PromptRequest `json:"generation_request,omitempty" db:"-"`                    // Original request parameters
	GenerationContext []string       `json:"generation_context,omitempty" db:"-"`                    // Additional context (files, etc.)
	PersonaUsed       string         `json:"persona_used,omitempty" db:"persona_used"`               // Persona used for generation
	TargetModelFamily string         `json:"target_model_family,omitempty" db:"target_model_family"` // Target model family specified

	CreatedAt         time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at" db:"updated_at"`
	Embedding         []float32       `json:"-" db:"embedding"`
	EmbeddingModel    string          `json:"embedding_model,omitempty" db:"embedding_model"`       // Model used for embedding
	EmbeddingProvider string          `json:"embedding_provider,omitempty" db:"embedding_provider"` // Provider used for embedding
	Metrics           *PromptMetrics  `json:"metrics,omitempty"`
	Context           []PromptContext `json:"context,omitempty"`
	ModelMetadata     *ModelMetadata  `json:"model_metadata,omitempty"` // Additional model information
}

// ModelMetadata contains detailed information about model usage
type ModelMetadata struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	PromptID           uuid.UUID `json:"prompt_id" db:"prompt_id"`
	GenerationModel    string    `json:"generation_model" db:"generation_model"`
	GenerationProvider string    `json:"generation_provider" db:"generation_provider"`
	EmbeddingModel     string    `json:"embedding_model" db:"embedding_model"`
	EmbeddingProvider  string    `json:"embedding_provider" db:"embedding_provider"`
	ModelVersion       string    `json:"model_version,omitempty" db:"model_version"`
	APIVersion         string    `json:"api_version,omitempty" db:"api_version"`
	ProcessingTime     int       `json:"processing_time" db:"processing_time"` // Processing time in milliseconds
	InputTokens        int       `json:"input_tokens" db:"input_tokens"`
	OutputTokens       int       `json:"output_tokens" db:"output_tokens"`
	TotalTokens        int       `json:"total_tokens" db:"total_tokens"`
	Cost               float64   `json:"cost,omitempty" db:"cost"` // Cost in USD if available
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
}

// Phase represents the generation phase
type Phase string

const (
	PhaseIdea      Phase = "idea"
	PhaseHuman     Phase = "human"
	PhasePrecision Phase = "precision"
)

// PromptRequest represents a request to generate prompts
type PromptRequest struct {
	Input       string           `json:"input"`
	Phases      []Phase          `json:"phases"`
	Count       int              `json:"count"`
	Providers   map[Phase]string `json:"providers"`
	Temperature float64          `json:"temperature"`
	MaxTokens   int              `json:"max_tokens"`
	Tags        []string         `json:"tags"`
	Context     []string         `json:"context"`
}

// PromptMetrics contains performance metrics for a prompt
type PromptMetrics struct {
	ID              uuid.UUID `json:"id" db:"id"`
	PromptID        uuid.UUID `json:"prompt_id" db:"prompt_id"`
	ConversionRate  float64   `json:"conversion_rate" db:"conversion_rate"`
	EngagementScore float64   `json:"engagement_score" db:"engagement_score"`
	TokenUsage      int       `json:"token_usage" db:"token_usage"`
	ResponseTime    int       `json:"response_time" db:"response_time"`
	UsageCount      int       `json:"usage_count" db:"usage_count"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// PromptContext represents contextual information for a prompt
type PromptContext struct {
	ID             uuid.UUID `json:"id" db:"id"`
	PromptID       uuid.UUID `json:"prompt_id" db:"prompt_id"`
	ContextType    string    `json:"context_type" db:"context_type"`
	Content        string    `json:"content" db:"content"`
	RelevanceScore float64   `json:"relevance_score" db:"relevance_score"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// PromptRanking contains ranking information for prompt selection
type PromptRanking struct {
	Prompt            *Prompt
	Score             float64
	TemperatureScore  float64
	TokenScore        float64
	HistoricalScore   float64
	ContextScore      float64
	EmbeddingDistance float64
}

// GenerationResult contains the result of prompt generation
type GenerationResult struct {
	Prompts  []Prompt        `json:"prompts"`
	Rankings []PromptRanking `json:"rankings"`
	Selected *Prompt         `json:"selected,omitempty"`
}
