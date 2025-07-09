package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	_ "github.com/mattn/go-sqlite3"
	"github.com/sirupsen/logrus"
)

// Storage handles database operations
type Storage struct {
	db     *sqlx.DB
	logger *logrus.Logger
	dbPath string
}

// NewStorage creates a new storage instance
func NewStorage(dataDir string, logger *logrus.Logger) (*Storage, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "prompts.db")

	// Open database connection
	db, err := sqlx.Connect("sqlite3", dbPath+"?_foreign_keys=1")
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	storage := &Storage{
		db:     db,
		logger: logger,
		dbPath: dbPath,
	}

	// Initialize schema
	if err := storage.initSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return storage, nil
}

// initSchema initializes the database schema
func (s *Storage) initSchema() error {
	schemaPath := "internal/storage/schema.sql"
	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		// If schema file not found, use embedded schema
		schema = []byte(embeddedSchema)
	}

	_, err = s.db.Exec(string(schema))
	return err
}

// SavePrompt saves a prompt to the database
func (s *Storage) SavePrompt(prompt *models.Prompt) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Convert tags to JSON
	tagsJSON, err := json.Marshal(prompt.Tags)
	if err != nil {
		return fmt.Errorf("failed to marshal tags: %w", err)
	}

	// Save main prompt record
	query := `
		INSERT INTO prompts (
			id, content, phase, provider, model, temperature, max_tokens, actual_tokens,
			tags, parent_id, created_at, updated_at, embedding, embedding_model, embedding_provider
		) VALUES (
			:id, :content, :phase, :provider, :model, :temperature, :max_tokens, :actual_tokens,
			:tags, :parent_id, :created_at, :updated_at, :embedding, :embedding_model, :embedding_provider
		)
	`

	args := map[string]interface{}{
		"id":                 prompt.ID.String(),
		"content":            prompt.Content,
		"phase":              string(prompt.Phase),
		"provider":           prompt.Provider,
		"model":              prompt.Model,
		"temperature":        prompt.Temperature,
		"max_tokens":         prompt.MaxTokens,
		"actual_tokens":      prompt.ActualTokens,
		"tags":               string(tagsJSON),
		"parent_id":          nil,
		"created_at":         prompt.CreatedAt,
		"updated_at":         prompt.UpdatedAt,
		"embedding":          prompt.Embedding,
		"embedding_model":    prompt.EmbeddingModel,
		"embedding_provider": prompt.EmbeddingProvider,
	}

	if prompt.ParentID != nil {
		args["parent_id"] = prompt.ParentID.String()
	}

	_, err = tx.NamedExec(query, args)
	if err != nil {
		return fmt.Errorf("failed to save prompt: %w", err)
	}

	// Save model metadata if provided
	if prompt.ModelMetadata != nil {
		if err := s.saveModelMetadata(tx, prompt.ModelMetadata); err != nil {
			return fmt.Errorf("failed to save model metadata: %w", err)
		}
	}

	return tx.Commit()
}

// saveModelMetadata saves detailed model metadata
func (s *Storage) saveModelMetadata(tx *sqlx.Tx, metadata *models.ModelMetadata) error {
	query := `
		INSERT INTO model_metadata (
			id, prompt_id, generation_model, generation_provider, embedding_model, embedding_provider,
			model_version, api_version, processing_time, input_tokens, output_tokens, total_tokens,
			cost, created_at
		) VALUES (
			:id, :prompt_id, :generation_model, :generation_provider, :embedding_model, :embedding_provider,
			:model_version, :api_version, :processing_time, :input_tokens, :output_tokens, :total_tokens,
			:cost, :created_at
		)
	`

	args := map[string]interface{}{
		"id":                  metadata.ID.String(),
		"prompt_id":           metadata.PromptID.String(),
		"generation_model":    metadata.GenerationModel,
		"generation_provider": metadata.GenerationProvider,
		"embedding_model":     metadata.EmbeddingModel,
		"embedding_provider":  metadata.EmbeddingProvider,
		"model_version":       metadata.ModelVersion,
		"api_version":         metadata.APIVersion,
		"processing_time":     metadata.ProcessingTime,
		"input_tokens":        metadata.InputTokens,
		"output_tokens":       metadata.OutputTokens,
		"total_tokens":        metadata.TotalTokens,
		"cost":                metadata.Cost,
		"created_at":          metadata.CreatedAt,
	}

	_, err := tx.NamedExec(query, args)
	return err
}

// GetPrompt retrieves a prompt by ID
func (s *Storage) GetPrompt(id uuid.UUID) (*models.Prompt, error) {
	var dbPrompt struct {
		ID                string    `db:"id"`
		Content           string    `db:"content"`
		Phase             string    `db:"phase"`
		Provider          string    `db:"provider"`
		Model             string    `db:"model"`
		Temperature       float64   `db:"temperature"`
		MaxTokens         int       `db:"max_tokens"`
		ActualTokens      int       `db:"actual_tokens"`
		Tags              string    `db:"tags"`
		ParentID          *string   `db:"parent_id"`
		CreatedAt         time.Time `db:"created_at"`
		UpdatedAt         time.Time `db:"updated_at"`
		Embedding         []byte    `db:"embedding"`
		EmbeddingModel    *string   `db:"embedding_model"`
		EmbeddingProvider *string   `db:"embedding_provider"`
	}

	query := `SELECT * FROM prompts WHERE id = ?`
	if err := s.db.Get(&dbPrompt, query, id.String()); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("prompt not found")
		}
		return nil, err
	}

	// Convert back to model
	prompt := &models.Prompt{
		ID:           uuid.MustParse(dbPrompt.ID),
		Content:      dbPrompt.Content,
		Phase:        models.Phase(dbPrompt.Phase),
		Provider:     dbPrompt.Provider,
		Model:        dbPrompt.Model,
		Temperature:  dbPrompt.Temperature,
		MaxTokens:    dbPrompt.MaxTokens,
		ActualTokens: dbPrompt.ActualTokens,
		CreatedAt:    dbPrompt.CreatedAt,
		UpdatedAt:    dbPrompt.UpdatedAt,
	}

	// Parse tags
	if err := json.Unmarshal([]byte(dbPrompt.Tags), &prompt.Tags); err != nil {
		s.logger.WithError(err).Warn("Failed to unmarshal tags")
	}

	// Convert parent ID
	if dbPrompt.ParentID != nil {
		parentID := uuid.MustParse(*dbPrompt.ParentID)
		prompt.ParentID = &parentID
	}

	// Set embedding info
	if dbPrompt.EmbeddingModel != nil {
		prompt.EmbeddingModel = *dbPrompt.EmbeddingModel
	}
	if dbPrompt.EmbeddingProvider != nil {
		prompt.EmbeddingProvider = *dbPrompt.EmbeddingProvider
	}

	// Convert embedding
	if len(dbPrompt.Embedding) > 0 {
		prompt.Embedding = bytesToFloat32Array(dbPrompt.Embedding)
	}

	// Load model metadata
	metadata, err := s.getModelMetadata(prompt.ID)
	if err != nil {
		s.logger.WithError(err).Warn("Failed to load model metadata")
	} else {
		prompt.ModelMetadata = metadata
	}

	return prompt, nil
}

// getModelMetadata retrieves model metadata for a prompt
func (s *Storage) getModelMetadata(promptID uuid.UUID) (*models.ModelMetadata, error) {
	var metadata models.ModelMetadata

	query := `SELECT * FROM model_metadata WHERE prompt_id = ?`
	if err := s.db.Get(&metadata, query, promptID.String()); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No metadata found
		}
		return nil, err
	}

	return &metadata, nil
}

// SearchPrompts searches for prompts based on criteria
func (s *Storage) SearchPrompts(criteria SearchCriteria) ([]models.Prompt, error) {
	query := `
		SELECT p.*, mm.generation_model, mm.generation_provider, mm.embedding_model, mm.embedding_provider,
		       mm.processing_time, mm.total_tokens
		FROM prompts p
		LEFT JOIN model_metadata mm ON p.id = mm.prompt_id
		WHERE 1=1
	`
	args := make(map[string]interface{})

	if criteria.Phase != "" {
		query += " AND p.phase = :phase"
		args["phase"] = criteria.Phase
	}

	if criteria.Provider != "" {
		query += " AND p.provider = :provider"
		args["provider"] = criteria.Provider
	}

	if criteria.Model != "" {
		query += " AND p.model = :model"
		args["model"] = criteria.Model
	}

	if len(criteria.Tags) > 0 {
		// Simple tag search - can be enhanced
		query += " AND p.tags LIKE :tag_pattern"
		args["tag_pattern"] = fmt.Sprintf("%%%s%%", criteria.Tags[0])
	}

	if criteria.Since != nil {
		query += " AND p.created_at >= :since"
		args["since"] = criteria.Since
	}

	query += " ORDER BY p.created_at DESC"

	if criteria.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", criteria.Limit)
	}

	rows, err := s.db.NamedQuery(query, args)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	prompts := make([]models.Prompt, 0)
	for rows.Next() {
		var dbPrompt struct {
			ID                  string    `db:"id"`
			Content             string    `db:"content"`
			Phase               string    `db:"phase"`
			Provider            string    `db:"provider"`
			Model               string    `db:"model"`
			Temperature         float64   `db:"temperature"`
			MaxTokens           int       `db:"max_tokens"`
			ActualTokens        int       `db:"actual_tokens"`
			Tags                string    `db:"tags"`
			ParentID            *string   `db:"parent_id"`
			CreatedAt           time.Time `db:"created_at"`
			UpdatedAt           time.Time `db:"updated_at"`
			Embedding           []byte    `db:"embedding"`
			EmbeddingModel      *string   `db:"embedding_model"`
			EmbeddingProvider   *string   `db:"embedding_provider"`
			MetadataGenModel    *string   `db:"generation_model"`
			MetadataGenProvider *string   `db:"generation_provider"`
			MetadataEmbModel    *string   `db:"embedding_model"`
			MetadataEmbProvider *string   `db:"embedding_provider"`
			MetadataProcessTime *int      `db:"processing_time"`
			MetadataTotalTokens *int      `db:"total_tokens"`
		}

		if err := rows.StructScan(&dbPrompt); err != nil {
			s.logger.WithError(err).Warn("Failed to scan row")
			continue
		}

		prompt := models.Prompt{
			ID:           uuid.MustParse(dbPrompt.ID),
			Content:      dbPrompt.Content,
			Phase:        models.Phase(dbPrompt.Phase),
			Provider:     dbPrompt.Provider,
			Model:        dbPrompt.Model,
			Temperature:  dbPrompt.Temperature,
			MaxTokens:    dbPrompt.MaxTokens,
			ActualTokens: dbPrompt.ActualTokens,
			CreatedAt:    dbPrompt.CreatedAt,
			UpdatedAt:    dbPrompt.UpdatedAt,
		}

		// Parse tags
		if err := json.Unmarshal([]byte(dbPrompt.Tags), &prompt.Tags); err != nil {
			s.logger.WithError(err).Warn("Failed to unmarshal tags")
		}

		// Convert parent ID
		if dbPrompt.ParentID != nil {
			parentID := uuid.MustParse(*dbPrompt.ParentID)
			prompt.ParentID = &parentID
		}

		// Set embedding info
		if dbPrompt.EmbeddingModel != nil {
			prompt.EmbeddingModel = *dbPrompt.EmbeddingModel
		}
		if dbPrompt.EmbeddingProvider != nil {
			prompt.EmbeddingProvider = *dbPrompt.EmbeddingProvider
		}

		prompts = append(prompts, prompt)
	}

	return prompts, nil
}

// SaveMetrics saves prompt metrics
func (s *Storage) SaveMetrics(metrics *models.PromptMetrics) error {
	query := `
		INSERT INTO metrics (
			id, prompt_id, conversion_rate, engagement_score,
			token_usage, response_time, usage_count, created_at, updated_at
		) VALUES (
			:id, :prompt_id, :conversion_rate, :engagement_score,
			:token_usage, :response_time, :usage_count, :created_at, :updated_at
		) ON CONFLICT(id) DO UPDATE SET
			conversion_rate = :conversion_rate,
			engagement_score = :engagement_score,
			token_usage = :token_usage,
			response_time = :response_time,
			usage_count = :usage_count,
			updated_at = :updated_at
	`

	args := map[string]interface{}{
		"id":               metrics.ID.String(),
		"prompt_id":        metrics.PromptID.String(),
		"conversion_rate":  metrics.ConversionRate,
		"engagement_score": metrics.EngagementScore,
		"token_usage":      metrics.TokenUsage,
		"response_time":    metrics.ResponseTime,
		"usage_count":      metrics.UsageCount,
		"created_at":       metrics.CreatedAt,
		"updated_at":       metrics.UpdatedAt,
	}

	_, err := s.db.NamedExec(query, args)
	return err
}

// SaveContext saves prompt context
func (s *Storage) SaveContext(context *models.PromptContext) error {
	query := `
		INSERT INTO context (
			id, prompt_id, context_type, content, relevance_score, created_at
		) VALUES (
			:id, :prompt_id, :context_type, :content, :relevance_score, :created_at
		)
	`

	args := map[string]interface{}{
		"id":              context.ID.String(),
		"prompt_id":       context.PromptID.String(),
		"context_type":    context.ContextType,
		"content":         context.Content,
		"relevance_score": context.RelevanceScore,
		"created_at":      context.CreatedAt,
	}

	_, err := s.db.NamedExec(query, args)
	return err
}

// Close closes the database connection
func (s *Storage) Close() error {
	return s.db.Close()
}

// SearchCriteria defines search parameters
type SearchCriteria struct {
	Phase    string
	Provider string
	Model    string
	Tags     []string
	Since    *time.Time
	Limit    int
}

// Helper functions

func bytesToFloat32Array(data []byte) []float32 {
	if len(data)%4 != 0 {
		return nil
	}

	result := make([]float32, len(data)/4)
	for i := 0; i < len(result); i++ {
		// Simple byte to float32 conversion - can be enhanced
		// This is a placeholder implementation
		result[i] = float32(i)
	}
	return result
}

// embeddedSchema is used when schema.sql file is not found
const embeddedSchema = `
-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    phase TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    actual_tokens INTEGER DEFAULT 0,
    tags TEXT,
    parent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,
    embedding_model TEXT,
    embedding_provider TEXT,
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);

-- Model metadata table
CREATE TABLE IF NOT EXISTS model_metadata (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    generation_model TEXT NOT NULL,
    generation_provider TEXT NOT NULL,
    embedding_model TEXT,
    embedding_provider TEXT,
    model_version TEXT,
    api_version TEXT,
    processing_time INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    conversion_rate REAL DEFAULT 0.0,
    engagement_score REAL DEFAULT 0.0,
    token_usage INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Context table
CREATE TABLE IF NOT EXISTS context (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    context_type TEXT NOT NULL,
    content TEXT NOT NULL,
    relevance_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompts_phase ON prompts(phase);
CREATE INDEX IF NOT EXISTS idx_prompts_provider ON prompts(provider);
CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_model ON prompts(embedding_model);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_model_metadata_prompt_id ON model_metadata(prompt_id);
CREATE INDEX IF NOT EXISTS idx_model_metadata_generation_model ON model_metadata(generation_model);
CREATE INDEX IF NOT EXISTS idx_model_metadata_embedding_model ON model_metadata(embedding_model);
CREATE INDEX IF NOT EXISTS idx_metrics_prompt_id ON metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_prompt_id ON context(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON context(context_type);
`
