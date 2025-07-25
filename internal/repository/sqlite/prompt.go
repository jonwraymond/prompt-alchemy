package sqlite

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/repository"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
)

// PromptRepository implements repository.PromptRepository using SQLite
type PromptRepository struct {
	storage *storage.Storage
	logger  *logrus.Logger
}

// NewPromptRepository creates a new SQLite prompt repository
func NewPromptRepository(storage *storage.Storage, logger *logrus.Logger) *PromptRepository {
	return &PromptRepository{
		storage: storage,
		logger:  logger,
	}
}

// Create saves a new prompt to the database
func (r *PromptRepository) Create(ctx context.Context, prompt *models.Prompt) error {
	r.logger.WithField("prompt_id", prompt.ID).Debug("Creating prompt")

	// Set timestamps
	if prompt.ID == uuid.Nil {
		prompt.ID = uuid.New()
	}
	prompt.CreatedAt = time.Now()
	prompt.UpdatedAt = time.Now()

	return r.storage.SavePrompt(ctx, prompt)
}

// GetByID retrieves a prompt by its ID
func (r *PromptRepository) GetByID(ctx context.Context, id string) (*models.Prompt, error) {
	r.logger.WithField("prompt_id", id).Debug("Getting prompt by ID")

	// For now, return an error as the storage interface needs to be updated
	// TODO: Implement when storage.GetPrompt is available
	return nil, fmt.Errorf("GetByID not implemented: storage interface needs GetPrompt method")
}

// Update updates an existing prompt
func (r *PromptRepository) Update(ctx context.Context, prompt *models.Prompt) error {
	r.logger.WithField("prompt_id", prompt.ID).Debug("Updating prompt")

	prompt.UpdatedAt = time.Now()
	return r.storage.SavePrompt(ctx, prompt)
}

// Delete removes a prompt from the database
func (r *PromptRepository) Delete(ctx context.Context, id string) error {
	r.logger.WithField("prompt_id", id).Debug("Deleting prompt")

	// TODO: Implement when storage.DeletePrompt is available
	return fmt.Errorf("Delete not implemented: storage interface needs DeletePrompt method")
}

// List retrieves a paginated list of prompts
func (r *PromptRepository) List(ctx context.Context, limit, offset int) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"limit":  limit,
		"offset": offset,
	}).Debug("Listing prompts")

	// TODO: Implement when storage.ListPrompts is available
	return []models.Prompt{}, fmt.Errorf("List not implemented: storage interface needs ListPrompts method")
}

// Search performs text-based search on prompts
func (r *PromptRepository) Search(ctx context.Context, query string, limit int) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"query": query,
		"limit": limit,
	}).Debug("Searching prompts")

	// TODO: Implement when storage.SearchPrompts is available
	return []models.Prompt{}, fmt.Errorf("Search not implemented: storage interface needs SearchPrompts method")
}

// SearchSemantic performs semantic search using embeddings
func (r *PromptRepository) SearchSemantic(ctx context.Context, embedding []float32, limit int, threshold float64) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"embedding_dims": len(embedding),
		"limit":          limit,
		"threshold":      threshold,
	}).Debug("Performing semantic search")

	// TODO: Implement using chromem vector search when available
	return []models.Prompt{}, fmt.Errorf("SearchSemantic not implemented: needs vector search integration")
}

// GetByTags retrieves prompts that have any of the specified tags
func (r *PromptRepository) GetByTags(ctx context.Context, tags []string, limit int) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"tags":  tags,
		"limit": limit,
	}).Debug("Getting prompts by tags")

	// TODO: Implement with proper SQL query
	return []models.Prompt{}, fmt.Errorf("GetByTags not implemented")
}

// GetByPhase retrieves prompts from a specific alchemical phase
func (r *PromptRepository) GetByPhase(ctx context.Context, phase models.Phase, limit int) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"phase": phase,
		"limit": limit,
	}).Debug("Getting prompts by phase")

	// TODO: Implement with proper SQL query
	return []models.Prompt{}, fmt.Errorf("GetByPhase not implemented")
}

// GetByProvider retrieves prompts generated by a specific provider
func (r *PromptRepository) GetByProvider(ctx context.Context, provider string, limit int) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"provider": provider,
		"limit":    limit,
	}).Debug("Getting prompts by provider")

	// TODO: Implement with proper SQL query
	return []models.Prompt{}, fmt.Errorf("GetByProvider not implemented")
}

// GetBySessionID retrieves all prompts from a specific session
func (r *PromptRepository) GetBySessionID(ctx context.Context, sessionID string) ([]models.Prompt, error) {
	r.logger.WithFields(logrus.Fields{
		"session_id": sessionID,
	}).Debug("Getting prompts by session ID")

	// TODO: Implement with proper SQL query
	return []models.Prompt{}, fmt.Errorf("GetBySessionID not implemented")
}

// GetUsageStats returns statistics about prompt usage
func (r *PromptRepository) GetUsageStats(ctx context.Context) (*repository.PromptUsageStats, error) {
	r.logger.Debug("Getting prompt usage statistics")

	// TODO: Implement with aggregation queries
	return &repository.PromptUsageStats{
		TotalPrompts:         0,
		TotalSessions:        0,
		AvgPromptsPerSession: 0,
		PopularPhases:        []repository.PhaseStats{},
		PopularProviders:     []repository.ProviderStats{},
		PopularTags:          []repository.TagStats{},
	}, fmt.Errorf("GetUsageStats not implemented")
}

// GetPopularPrompts returns the most frequently used prompts
func (r *PromptRepository) GetPopularPrompts(ctx context.Context, limit int) ([]models.Prompt, error) {
	r.logger.WithField("limit", limit).Debug("Getting popular prompts")

	// TODO: Implement based on usage_count field
	return []models.Prompt{}, fmt.Errorf("GetPopularPrompts not implemented")
}

// GetRecentPrompts returns the most recently created prompts
func (r *PromptRepository) GetRecentPrompts(ctx context.Context, limit int) ([]models.Prompt, error) {
	r.logger.WithField("limit", limit).Debug("Getting recent prompts")

	// TODO: Implement with ORDER BY created_at DESC
	return []models.Prompt{}, fmt.Errorf("GetRecentPrompts not implemented")
}

// Helper functions for future implementation

// convertPromptToModel converts database row to models.Prompt
func convertPromptToModel(row map[string]interface{}) (*models.Prompt, error) {
	prompt := &models.Prompt{}

	// Convert UUID
	if id, ok := row["id"].(string); ok {
		if parsed, err := uuid.Parse(id); err == nil {
			prompt.ID = parsed
		}
	}

	// Convert basic fields
	if content, ok := row["content"].(string); ok {
		prompt.Content = content
	}

	if phase, ok := row["phase"].(string); ok {
		prompt.Phase = models.Phase(phase)
	}

	if provider, ok := row["provider"].(string); ok {
		prompt.Provider = provider
	}

	if model, ok := row["model"].(string); ok {
		prompt.Model = model
	}

	// Convert numeric fields
	if temp, ok := row["temperature"].(float64); ok {
		prompt.Temperature = temp
	}

	if maxTokens, ok := row["max_tokens"].(int64); ok {
		prompt.MaxTokens = int(maxTokens)
	}

	if actualTokens, ok := row["actual_tokens"].(int64); ok {
		prompt.ActualTokens = int(actualTokens)
	}

	// Convert JSON fields
	if tagsJSON, ok := row["tags"].(string); ok && tagsJSON != "" {
		var tags []string
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err == nil {
			prompt.Tags = tags
		}
	}

	// Convert timestamps
	if createdAt, ok := row["created_at"].(time.Time); ok {
		prompt.CreatedAt = createdAt
	}

	if updatedAt, ok := row["updated_at"].(time.Time); ok {
		prompt.UpdatedAt = updatedAt
	}

	return prompt, nil
}

// buildTagsFilter creates SQL WHERE clause for tag filtering
func buildTagsFilter(tags []string) (string, []interface{}) {
	if len(tags) == 0 {
		return "", nil
	}

	placeholders := make([]string, len(tags))
	args := make([]interface{}, len(tags))

	for i, tag := range tags {
		placeholders[i] = "?"
		args[i] = "%" + tag + "%"
	}

	whereClause := "tags LIKE " + strings.Join(placeholders, " OR tags LIKE ")
	return whereClause, args
}
