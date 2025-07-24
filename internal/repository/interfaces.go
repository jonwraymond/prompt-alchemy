package repository

import (
	"context"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

// PromptRepository defines the interface for prompt data access
type PromptRepository interface {
	// CRUD operations
	Create(ctx context.Context, prompt *models.Prompt) error
	GetByID(ctx context.Context, id string) (*models.Prompt, error)
	Update(ctx context.Context, prompt *models.Prompt) error
	Delete(ctx context.Context, id string) error

	// Query operations
	List(ctx context.Context, limit, offset int) ([]models.Prompt, error)
	Search(ctx context.Context, query string, limit int) ([]models.Prompt, error)
	SearchSemantic(ctx context.Context, embedding []float32, limit int, threshold float64) ([]models.Prompt, error)

	// Filter operations
	GetByTags(ctx context.Context, tags []string, limit int) ([]models.Prompt, error)
	GetByPhase(ctx context.Context, phase models.Phase, limit int) ([]models.Prompt, error)
	GetByProvider(ctx context.Context, provider string, limit int) ([]models.Prompt, error)
	GetBySessionID(ctx context.Context, sessionID string) ([]models.Prompt, error)

	// Analytics operations
	GetUsageStats(ctx context.Context) (*PromptUsageStats, error)
	GetPopularPrompts(ctx context.Context, limit int) ([]models.Prompt, error)
	GetRecentPrompts(ctx context.Context, limit int) ([]models.Prompt, error)
}

// MetricsRepository defines the interface for metrics data access
type MetricsRepository interface {
	// Prompt metrics
	SavePromptMetrics(ctx context.Context, metrics *models.PromptMetrics) error
	GetPromptMetrics(ctx context.Context, promptID string) (*models.PromptMetrics, error)

	// Session metrics
	SaveSessionMetrics(ctx context.Context, metrics *SessionMetrics) error
	GetSessionMetrics(ctx context.Context, sessionID string) (*SessionMetrics, error)

	// Analytics
	GetMetricsStats(ctx context.Context, from, to string) (*MetricsStats, error)
	CleanupOldMetrics(ctx context.Context, olderThan string) error
}

// UserRepository defines the interface for user data access (future)
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id string) (*User, error)
	GetByAPIKey(ctx context.Context, apiKey string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, limit, offset int) ([]User, error)
}

// Analytics and stats types

// PromptUsageStats contains statistics about prompt usage
type PromptUsageStats struct {
	TotalPrompts         int64           `json:"total_prompts"`
	TotalSessions        int64           `json:"total_sessions"`
	AvgPromptsPerSession float64         `json:"avg_prompts_per_session"`
	PopularPhases        []PhaseStats    `json:"popular_phases"`
	PopularProviders     []ProviderStats `json:"popular_providers"`
	PopularTags          []TagStats      `json:"popular_tags"`
}

// PhaseStats contains statistics for a specific phase
type PhaseStats struct {
	Phase    models.Phase `json:"phase"`
	Count    int64        `json:"count"`
	AvgScore float64      `json:"avg_score"`
}

// ProviderStats contains statistics for a specific provider
type ProviderStats struct {
	Provider  string  `json:"provider"`
	Count     int64   `json:"count"`
	AvgScore  float64 `json:"avg_score"`
	AvgTokens int     `json:"avg_tokens"`
}

// TagStats contains statistics for a specific tag
type TagStats struct {
	Tag   string `json:"tag"`
	Count int64  `json:"count"`
}

// SessionMetrics contains metrics for a generation session
type SessionMetrics struct {
	SessionID     string   `json:"session_id"`
	UserID        string   `json:"user_id,omitempty"`
	StartTime     string   `json:"start_time"`
	EndTime       string   `json:"end_time"`
	Duration      int64    `json:"duration_ms"`
	PromptsCount  int      `json:"prompts_count"`
	PhasesUsed    []string `json:"phases_used"`
	ProvidersUsed []string `json:"providers_used"`
	TotalTokens   int      `json:"total_tokens"`
	Success       bool     `json:"success"`
	ErrorMessage  string   `json:"error_message,omitempty"`
}

// MetricsStats contains aggregated metrics statistics
type MetricsStats struct {
	Period              string          `json:"period"`
	TotalSessions       int64           `json:"total_sessions"`
	SuccessfulSessions  int64           `json:"successful_sessions"`
	SuccessRate         float64         `json:"success_rate"`
	AvgDuration         float64         `json:"avg_duration_ms"`
	TotalTokens         int64           `json:"total_tokens"`
	AvgTokensPerSession float64         `json:"avg_tokens_per_session"`
	PopularPhases       []PhaseStats    `json:"popular_phases"`
	PopularProviders    []ProviderStats `json:"popular_providers"`
}

// User represents a user in the system (future enhancement)
type User struct {
	ID        string     `json:"id"`
	Username  string     `json:"username"`
	Email     string     `json:"email"`
	APIKey    string     `json:"api_key"`
	CreatedAt string     `json:"created_at"`
	UpdatedAt string     `json:"updated_at"`
	Active    bool       `json:"active"`
	Role      string     `json:"role"`
	Limits    UserLimits `json:"limits"`
}

// UserLimits defines usage limits for a user
type UserLimits struct {
	RequestsPerMonth    int      `json:"requests_per_month"`
	RequestsPerDay      int      `json:"requests_per_day"`
	MaxTokensPerRequest int      `json:"max_tokens_per_request"`
	AllowedProviders    []string `json:"allowed_providers"`
}

// Repository aggregates all repository interfaces
type Repository struct {
	Prompt  PromptRepository
	Metrics MetricsRepository
	User    UserRepository
}

// Transaction defines a database transaction interface
type Transaction interface {
	Commit() error
	Rollback() error
}

// Transactional defines repositories that support transactions
type Transactional interface {
	BeginTransaction(ctx context.Context) (Transaction, error)
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}
