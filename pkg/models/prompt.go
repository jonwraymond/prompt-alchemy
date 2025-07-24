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
	TargetUseCase     string         `json:"target_use_case,omitempty" db:"target_use_case"`         // Target use case (auto-inferred or user-specified)

	CreatedAt         time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at" db:"updated_at"`
	Embedding         []float32       `json:"-" db:"embedding"`
	EmbeddingModel    string          `json:"embedding_model,omitempty" db:"embedding_model"`       // Model used for embedding
	EmbeddingProvider string          `json:"embedding_provider,omitempty" db:"embedding_provider"` // Provider used for embedding
	Metrics           *PromptMetrics  `json:"metrics,omitempty"`
	Context           []PromptContext `json:"context,omitempty"`
	ModelMetadata     *ModelMetadata  `json:"model_metadata,omitempty"` // Additional model information

	SessionID uuid.UUID `json:"session_id"`

	// UI display fields
	Score          float64  `json:"score,omitempty"`
	Reasoning      string   `json:"reasoning,omitempty"`
	SimilarPrompts []string `json:"similar_prompts,omitempty"`
	AvgSimilarity  float64  `json:"avg_similarity,omitempty"`
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

// Phase represents the alchemical transformation stage
type Phase string

const (
	PhasePrimaMaterial Phase = "prima-materia" // Raw, unrefined starting material
	PhaseSolutio       Phase = "solutio"       // Dissolution into natural form
	PhaseCoagulatio    Phase = "coagulatio"    // Crystallization into final form

	// Legacy phase names for backward compatibility
	PhaseIdea      Phase = PhasePrimaMaterial // Deprecated: use PhasePrimaMaterial
	PhaseHuman     Phase = PhaseSolutio       // Deprecated: use PhaseSolutio
	PhasePrecision Phase = PhaseCoagulatio    // Deprecated: use PhaseCoagulatio
)

// String returns the string representation of the Phase
func (p Phase) String() string {
	return string(p)
}

// PromptRequest represents a request to generate prompts
type PromptRequest struct {
	Input         string           `json:"input"`
	Phases        []Phase          `json:"phases"`
	Count         int              `json:"count"`
	Providers     map[Phase]string `json:"providers"`
	Temperature   float64          `json:"temperature"`
	MaxTokens     int              `json:"max_tokens"`
	Tags          []string         `json:"tags"`
	Context       []string         `json:"context"`
	Persona       string           `json:"persona,omitempty"`
	TargetUseCase string           `json:"target_use_case,omitempty"` // Optional: auto-inferred from persona if not provided
	SessionID     uuid.UUID
}

// UseCase represents different target use cases for prompts
type UseCase string

const (
	UseCaseGeneral     UseCase = "general"     // General purpose prompts
	UseCaseCode        UseCase = "code"        // Code generation and programming
	UseCaseWriting     UseCase = "writing"     // Content writing and editing
	UseCaseAnalysis    UseCase = "analysis"    // Data analysis and insights
	UseCaseCreative    UseCase = "creative"    // Creative writing and brainstorming
	UseCaseTechnical   UseCase = "technical"   // Technical documentation
	UseCaseEducational UseCase = "educational" // Educational content
	UseCaseBusiness    UseCase = "business"    // Business and professional
	UseCaseMarketing   UseCase = "marketing"   // Marketing and advertising
	UseCaseResearch    UseCase = "research"    // Research and academic
	UseCaseCustomer    UseCase = "customer"    // Customer service and support
	UseCaseSales       UseCase = "sales"       // Sales and conversion
	UseCaseProduct     UseCase = "product"     // Product development
	UseCaseDesign      UseCase = "design"      // Design and UX
	UseCaseLegal       UseCase = "legal"       // Legal and compliance
	UseCaseMedical     UseCase = "medical"     // Medical and healthcare
	UseCaseFinancial   UseCase = "financial"   // Financial and accounting
	UseCaseHR          UseCase = "hr"          // Human resources
	UseCaseOperations  UseCase = "operations"  // Operations and logistics
)

// String returns the string representation of the UseCase
func (u UseCase) String() string {
	return string(u)
}

// PersonaUseCaseMapping maps personas to their most likely target use cases
var PersonaUseCaseMapping = map[string]UseCase{
	// Analysis personas
	"analyst":           UseCaseAnalysis,
	"data_scientist":    UseCaseAnalysis,
	"researcher":        UseCaseResearch,
	"business_analyst":  UseCaseBusiness,
	"financial_analyst": UseCaseFinancial,

	// Code personas
	"programmer":        UseCaseCode,
	"software_engineer": UseCaseCode,
	"developer":         UseCaseCode,
	"architect":         UseCaseTechnical,
	"devops":            UseCaseTechnical,

	// Writing personas
	"writer":          UseCaseWriting,
	"content_creator": UseCaseWriting,
	"journalist":      UseCaseWriting,
	"editor":          UseCaseWriting,
	"copywriter":      UseCaseMarketing,

	// Creative personas
	"designer":          UseCaseDesign,
	"creative_director": UseCaseCreative,
	"artist":            UseCaseCreative,
	"marketer":          UseCaseMarketing,
	"brand_manager":     UseCaseMarketing,

	// Business personas
	"manager":         UseCaseBusiness,
	"executive":       UseCaseBusiness,
	"consultant":      UseCaseBusiness,
	"entrepreneur":    UseCaseBusiness,
	"product_manager": UseCaseProduct,

	// Service personas
	"customer_service":   UseCaseCustomer,
	"sales_rep":          UseCaseSales,
	"support_specialist": UseCaseCustomer,
	"account_manager":    UseCaseSales,

	// Professional personas
	"lawyer":        UseCaseLegal,
	"doctor":        UseCaseMedical,
	"teacher":       UseCaseEducational,
	"professor":     UseCaseEducational,
	"hr_specialist": UseCaseHR,

	// Operations personas
	"operations_manager":    UseCaseOperations,
	"logistics_coordinator": UseCaseOperations,
	"project_manager":       UseCaseBusiness,

	// Default fallback
	"": UseCaseGeneral,
}

// InferUseCaseFromPersona automatically determines the target use case based on persona
func InferUseCaseFromPersona(persona string) UseCase {
	if persona == "" {
		return UseCaseGeneral
	}

	if useCase, exists := PersonaUseCaseMapping[persona]; exists {
		return useCase
	}

	// Try partial matching for personas not in the exact mapping
	for key, useCase := range PersonaUseCaseMapping {
		if contains(persona, key) || contains(key, persona) {
			return useCase
		}
	}

	return UseCaseGeneral
}

// contains checks if a string contains another string (case-insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr ||
			len(s) > len(substr) &&
				(s[:len(substr)] == substr ||
					s[len(s)-len(substr):] == substr ||
					containsSubstring(s, substr)))
}

// containsSubstring performs a simple substring check
func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// GetUseCaseDescription returns a human-readable description of the use case
func (u UseCase) GetDescription() string {
	descriptions := map[UseCase]string{
		UseCaseGeneral:     "General purpose prompts for everyday tasks",
		UseCaseCode:        "Programming, code generation, and software development",
		UseCaseWriting:     "Content creation, writing, and text editing",
		UseCaseAnalysis:    "Data analysis, insights, and analytical thinking",
		UseCaseCreative:    "Creative writing, brainstorming, and artistic content",
		UseCaseTechnical:   "Technical documentation and specifications",
		UseCaseEducational: "Educational content and learning materials",
		UseCaseBusiness:    "Business communication and professional tasks",
		UseCaseMarketing:   "Marketing copy, advertising, and promotional content",
		UseCaseResearch:    "Research, academic writing, and scholarly content",
		UseCaseCustomer:    "Customer service, support, and user assistance",
		UseCaseSales:       "Sales pitches, proposals, and conversion content",
		UseCaseProduct:     "Product descriptions, features, and specifications",
		UseCaseDesign:      "Design briefs, UX content, and visual descriptions",
		UseCaseLegal:       "Legal documents, contracts, and compliance content",
		UseCaseMedical:     "Medical documentation and healthcare content",
		UseCaseFinancial:   "Financial reports, analysis, and accounting content",
		UseCaseHR:          "Human resources, job descriptions, and employee content",
		UseCaseOperations:  "Operations manuals, procedures, and logistics content",
	}

	if desc, exists := descriptions[u]; exists {
		return desc
	}
	return "Custom use case"
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
	LengthScore       float64
	SemanticScore     float64
}

// GenerationResult contains the result of prompt generation
type GenerationResult struct {
	Prompts  []Prompt        `json:"prompts"`
	Rankings []PromptRanking `json:"rankings"`
	Selected *Prompt         `json:"selected,omitempty"`

	SessionID uuid.UUID
}

// UserInteraction captures feedback on a prompt (e.g. chosen, skipped, rated).
type UserInteraction struct {
	ID        uuid.UUID `json:"id"`
	PromptID  uuid.UUID `json:"prompt_id"`
	SessionID uuid.UUID `json:"session_id"`      // Groups interactions from one generate call
	Action    string    `json:"action"`          // "chosen", "skipped", "rated"
	Score     float64   `json:"score,omitempty"` // For ratings (0-1)
	Timestamp time.Time `json:"timestamp"`
}

// PhaseConfig maps phases to providers
type PhaseConfig struct {
	Phase    Phase
	Provider string
}

// GenerateOptions contains options for prompt generation
type GenerateOptions struct {
	Request             PromptRequest
	PhaseConfigs        []PhaseConfig
	UseParallel         bool
	IncludeContext      bool
	Persona             string
	TargetModel         string
	AutoSelect          bool    `json:"auto_select,omitempty"`
	Optimize            bool    `json:"optimize,omitempty"`
	OptimizeTargetScore float64 `json:"optimize_target_score,omitempty"`
	OptimizeMaxIter     int     `json:"optimize_max_iterations,omitempty"`
}
