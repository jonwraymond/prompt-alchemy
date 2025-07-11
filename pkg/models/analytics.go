package models

import (
	"time"

	"github.com/google/uuid"
)

// UsageAnalytics tracks how prompts are used in generation
type UsageAnalytics struct {
	ID                 uuid.UUID  `db:"id" json:"id"`
	PromptID           uuid.UUID  `db:"prompt_id" json:"prompt_id"`
	UsedInGeneration   bool       `db:"used_in_generation" json:"used_in_generation"`
	GeneratedPromptID  *uuid.UUID `db:"generated_prompt_id" json:"generated_prompt_id,omitempty"`
	UsageContext       string     `db:"usage_context" json:"usage_context"`
	EffectivenessScore float64    `db:"effectiveness_score" json:"effectiveness_score"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`

	// Additional fields for learning
	SessionID      string    `json:"session_id,omitempty"`
	GenerationTime int       `json:"generation_time,omitempty"` // milliseconds
	UserFeedback   *int      `json:"user_feedback,omitempty"`   // 1-5 rating
	ErrorMessage   string    `json:"error_message,omitempty"`
	Context        []string  `json:"context,omitempty"`
	GeneratedAt    time.Time `json:"generated_at"`
}

// LearningFeedback represents user feedback for learning
type LearningFeedback struct {
	PromptID             uuid.UUID              `json:"prompt_id"`
	SessionID            string                 `json:"session_id"`
	Rating               int                    `json:"rating"` // 1-5
	WasHelpful           bool                   `json:"was_helpful"`
	MetExpectations      bool                   `json:"met_expectations"`
	SuggestedImprovement string                 `json:"suggested_improvement,omitempty"`
	Context              map[string]interface{} `json:"context,omitempty"`
}
