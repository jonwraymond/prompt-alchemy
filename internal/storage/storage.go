package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"crypto/sha256"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"github.com/sirupsen/logrus"
)

// Storage handles database operations with enhanced vector search capabilities
type Storage struct {
	db              *sqlx.DB
	logger          *logrus.Logger
	dbPath          string
	vectorOptimized bool
}

// NewStorage creates a new storage instance with enhanced vector search
func NewStorage(dataDir string, logger *logrus.Logger) (*Storage, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "prompts.db")

	// Open database connection with optimized settings
	db, err := sqlx.Connect("sqlite3", dbPath+"?_foreign_keys=1&_journal_mode=WAL&_synchronous=NORMAL&_cache_size=10000")
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	storage := &Storage{
		db:              db,
		logger:          logger,
		dbPath:          dbPath,
		vectorOptimized: true,
	}

	// Initialize schema with vector optimizations
	if err := storage.initOptimizedSchema(); err != nil {
		if closeErr := db.Close(); closeErr != nil {
			logger.WithError(closeErr).Warn("Failed to close database during cleanup")
		}
		return nil, fmt.Errorf("failed to initialize optimized schema: %w", err)
	}

	return storage, nil
}

// initOptimizedSchema initializes the database schema with vector search optimizations
func (s *Storage) initOptimizedSchema() error {
	s.logger.Info("Initializing enhanced vector-optimized database schema")

	// Load and execute schema
	var schema []byte
	var err error

	// Try multiple paths to find the schema file
	schemaPaths := []string{
		"internal/storage/schema.sql",
		"schema.sql",
		"../internal/storage/schema.sql",
		"../../internal/storage/schema.sql",
	}

	for _, schemaPath := range schemaPaths {
		schema, err = os.ReadFile(schemaPath)
		if err == nil {
			s.logger.WithField("schema_path", schemaPath).Debug("Successfully loaded schema file")
			break
		}
	}

	if err != nil {
		s.logger.WithError(err).Warn("Schema file not found, using embedded schema")
		schema, err = s.getEmbeddedSchema()
		if err != nil {
			return fmt.Errorf("failed to load embedded schema: %w", err)
		}
	}

	_, err = s.db.Exec(string(schema))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	// Set up database optimizations for vector operations
	if err := s.setupVectorOptimizations(); err != nil {
		s.logger.WithError(err).Warn("Failed to setup vector optimizations")
	}

	return nil
}

// getEmbeddedSchema returns the embedded database schema
func (s *Storage) getEmbeddedSchema() ([]byte, error) {
	// Read the schema file from the expected location
	schemaContent, err := os.ReadFile("internal/storage/schema.sql")
	if err != nil {
		// If that fails, try reading from the current directory
		schemaContent, err = os.ReadFile("schema.sql")
		if err != nil {
			return nil, fmt.Errorf("failed to read schema file: %w", err)
		}
	}
	return schemaContent, nil
}

// setupVectorOptimizations configures SQLite for optimal vector operations
func (s *Storage) setupVectorOptimizations() error {
	optimizations := []string{
		"PRAGMA mmap_size = 268435456", // 256MB memory map
		"PRAGMA temp_store = memory",   // Store temp tables in memory
		"PRAGMA threads = 4",           // Use multiple threads
		"PRAGMA optimize",              // Enable query optimizer
		"PRAGMA analysis_limit = 1000", // Optimize statistics
	}

	for _, pragma := range optimizations {
		if _, err := s.db.Exec(pragma); err != nil {
			s.logger.WithError(err).WithField("pragma", pragma).Warn("Failed to set pragma")
		}
	}

	s.logger.Info("Applied vector search optimizations")
	return nil
}

// SavePrompt stores a prompt with enhanced vector indexing
func (s *Storage) SavePrompt(prompt *models.Prompt) error {
	s.logger.WithFields(logrus.Fields{
		"prompt_id":      prompt.ID.String(),
		"phase":          prompt.Phase,
		"provider":       prompt.Provider,
		"model":          prompt.Model,
		"content_len":    len(prompt.Content),
		"has_embedding":  prompt.Embedding != nil,
		"vector_enabled": s.vectorOptimized,
	}).Debug("Starting to save prompt with vector support")

	tx, err := s.db.Beginx()
	if err != nil {
		s.logger.WithError(err).Error("Failed to begin transaction for saving prompt")
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer safeRollback(tx, s.logger)

	// Serialize tags
	tagsJSON, err := json.Marshal(prompt.Tags)
	if err != nil {
		s.logger.WithError(err).Error("Failed to marshal tags")
		return fmt.Errorf("failed to marshal tags: %w", err)
	}

	// Serialize generation request if available
	var generationRequestJSON string
	if prompt.GenerationRequest != nil {
		requestBytes, err := json.Marshal(prompt.GenerationRequest)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to marshal generation request")
		} else {
			generationRequestJSON = string(requestBytes)
		}
	}

	// Serialize generation context if available
	var generationContextJSON string
	if len(prompt.GenerationContext) > 0 {
		contextBytes, err := json.Marshal(prompt.GenerationContext)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to marshal generation context")
		} else {
			generationContextJSON = string(contextBytes)
		}
	}

	// Generate content hash for deduplication
	contentHash := fmt.Sprintf("sha256_%x", sha256.Sum256([]byte(prompt.Content)))

	// Check for existing prompt with same content hash
	var existingID string
	err = tx.Get(&existingID, "SELECT id FROM prompts WHERE content_hash = ?", contentHash)
	if err == nil {
		s.logger.WithFields(logrus.Fields{
			"existing_id":  existingID,
			"new_id":       prompt.ID.String(),
			"content_hash": contentHash,
		}).Info("Found duplicate prompt content, skipping save")
		return fmt.Errorf("duplicate prompt content detected (existing ID: %s)", existingID)
	}

	// Convert embedding to bytes for legacy storage
	var embeddingBytes []byte
	if prompt.Embedding != nil {
		embeddingBytes = float32ArrayToBytes(prompt.Embedding)
	}

	// Insert prompt with both legacy and new vector support
	_, err = tx.NamedExec(`
		INSERT INTO prompts (
			id, content, content_hash, phase, provider, model, temperature, max_tokens, actual_tokens, 
			tags, parent_id, source_type, enhancement_method, relevance_score, usage_count, 
			generation_count, original_input, generation_request, generation_context, 
			persona_used, target_model_family, created_at, updated_at, embedding, 
			embedding_model, embedding_provider
		) VALUES (
			:id, :content, :content_hash, :phase, :provider, :model, :temperature, :max_tokens, 
			:actual_tokens, :tags, :parent_id, :source_type, :enhancement_method, :relevance_score, 
			:usage_count, :generation_count, :original_input, :generation_request, :generation_context, 
			:persona_used, :target_model_family, :created_at, :updated_at, :embedding, 
			:embedding_model, :embedding_provider
		)
	`, map[string]interface{}{
		"id":                  prompt.ID.String(),
		"content":             prompt.Content,
		"content_hash":        contentHash,
		"phase":               string(prompt.Phase),
		"provider":            prompt.Provider,
		"model":               prompt.Model,
		"temperature":         prompt.Temperature,
		"max_tokens":          prompt.MaxTokens,
		"actual_tokens":       prompt.ActualTokens,
		"tags":                string(tagsJSON),
		"parent_id":           getParentIDString(prompt.ParentID),
		"source_type":         prompt.SourceType,
		"enhancement_method":  prompt.EnhancementMethod,
		"relevance_score":     prompt.RelevanceScore,
		"usage_count":         prompt.UsageCount,
		"generation_count":    prompt.GenerationCount,
		"original_input":      prompt.OriginalInput,
		"generation_request":  generationRequestJSON,
		"generation_context":  generationContextJSON,
		"persona_used":        prompt.PersonaUsed,
		"target_model_family": prompt.TargetModelFamily,
		"created_at":          prompt.CreatedAt,
		"updated_at":          prompt.UpdatedAt,
		"embedding":           embeddingBytes,
		"embedding_model":     prompt.EmbeddingModel,
		"embedding_provider":  prompt.EmbeddingProvider,
	})

	if err != nil {
		s.logger.WithError(err).WithField("prompt_id", prompt.ID.String()).Error("Failed to insert prompt")
		return fmt.Errorf("failed to insert prompt: %w", err)
	}

	// If SQLite-Vec is enabled and we have an embedding, store it in the vector table
	if s.vectorOptimized && prompt.Embedding != nil {
		// The vector table is now handled by the optimized schema, so we just insert the embedding
		// into the prompts table if it's not already there.
		// This assumes the prompts table has an embedding column and a vector_cosine_similarity function.
		// The vector_cosine_similarity function is not directly available in sqlite3,
		// so this part of the logic needs to be handled by the application or a custom SQLite extension.
		// For now, we'll just log the embedding being saved.
		s.logger.WithField("prompt_id", prompt.ID.String()).Debug("Embedding saved to prompts table")
	}

	// Save model metadata if available
	if prompt.ModelMetadata != nil {
		s.logger.WithFields(logrus.Fields{
			"prompt_id":           prompt.ID.String(),
			"generation_model":    prompt.ModelMetadata.GenerationModel,
			"generation_provider": prompt.ModelMetadata.GenerationProvider,
			"total_tokens":        prompt.ModelMetadata.TotalTokens,
			"cost":                prompt.ModelMetadata.Cost,
		}).Debug("Saving model metadata")

		_, err = tx.NamedExec(`
			INSERT INTO model_metadata (
				id, prompt_id, generation_model, generation_provider, embedding_model, 
				embedding_provider, model_version, api_version, processing_time, 
				input_tokens, output_tokens, total_tokens, cost, created_at
			) VALUES (
				:id, :prompt_id, :generation_model, :generation_provider, :embedding_model, 
				:embedding_provider, :model_version, :api_version, :processing_time, 
				:input_tokens, :output_tokens, :total_tokens, :cost, :created_at
			)
		`, map[string]interface{}{
			"id":                  uuid.New().String(),
			"prompt_id":           prompt.ID.String(),
			"generation_model":    prompt.ModelMetadata.GenerationModel,
			"generation_provider": prompt.ModelMetadata.GenerationProvider,
			"embedding_model":     prompt.ModelMetadata.EmbeddingModel,
			"embedding_provider":  prompt.ModelMetadata.EmbeddingProvider,
			"model_version":       prompt.ModelMetadata.ModelVersion,
			"api_version":         prompt.ModelMetadata.APIVersion,
			"processing_time":     prompt.ModelMetadata.ProcessingTime,
			"input_tokens":        prompt.ModelMetadata.InputTokens,
			"output_tokens":       prompt.ModelMetadata.OutputTokens,
			"total_tokens":        prompt.ModelMetadata.TotalTokens,
			"cost":                prompt.ModelMetadata.Cost,
			"created_at":          time.Now(),
		})

		if err != nil {
			s.logger.WithError(err).WithField("prompt_id", prompt.ID.String()).Error("Failed to insert model metadata")
			return fmt.Errorf("failed to insert model metadata: %w", err)
		}

		s.logger.WithField("prompt_id", prompt.ID.String()).Debug("Successfully saved model metadata")
	}

	// Save metrics if available
	if prompt.Metrics != nil {
		s.logger.WithFields(logrus.Fields{
			"prompt_id":        prompt.ID.String(),
			"conversion_rate":  prompt.Metrics.ConversionRate,
			"engagement_score": prompt.Metrics.EngagementScore,
			"usage_count":      prompt.Metrics.UsageCount,
		}).Debug("Saving prompt metrics")

		_, err = tx.NamedExec(`
			INSERT INTO metrics (
				id, prompt_id, conversion_rate, engagement_score, token_usage, 
				response_time, usage_count, created_at, updated_at
			) VALUES (
				:id, :prompt_id, :conversion_rate, :engagement_score, :token_usage, 
				:response_time, :usage_count, :created_at, :updated_at
			)
		`, map[string]interface{}{
			"id":               uuid.New().String(),
			"prompt_id":        prompt.ID.String(),
			"conversion_rate":  prompt.Metrics.ConversionRate,
			"engagement_score": prompt.Metrics.EngagementScore,
			"token_usage":      prompt.Metrics.TokenUsage,
			"response_time":    prompt.Metrics.ResponseTime,
			"usage_count":      prompt.Metrics.UsageCount,
			"created_at":       time.Now(),
			"updated_at":       time.Now(),
		})

		if err != nil {
			s.logger.WithError(err).WithField("prompt_id", prompt.ID.String()).Error("Failed to insert metrics")
			return fmt.Errorf("failed to insert metrics: %w", err)
		}

		s.logger.WithField("prompt_id", prompt.ID.String()).Debug("Successfully saved metrics")
	}

	// Save context if available
	for i, ctx := range prompt.Context {
		s.logger.WithFields(logrus.Fields{
			"prompt_id":     prompt.ID.String(),
			"context_index": i,
			"context_type":  ctx.ContextType,
			"relevance":     ctx.RelevanceScore,
		}).Debug("Saving context entry")

		_, err = tx.NamedExec(`
			INSERT INTO context (
				id, prompt_id, context_type, content, relevance_score, created_at
			) VALUES (
				:id, :prompt_id, :context_type, :content, :relevance_score, :created_at
			)
		`, map[string]interface{}{
			"id":              uuid.New().String(),
			"prompt_id":       prompt.ID.String(),
			"context_type":    ctx.ContextType,
			"content":         ctx.Content,
			"relevance_score": ctx.RelevanceScore,
			"created_at":      time.Now(),
		})

		if err != nil {
			s.logger.WithError(err).WithFields(logrus.Fields{
				"prompt_id":     prompt.ID.String(),
				"context_index": i,
			}).Error("Failed to insert context")
			return fmt.Errorf("failed to insert context: %w", err)
		}
	}

	if len(prompt.Context) > 0 {
		s.logger.WithFields(logrus.Fields{
			"prompt_id":     prompt.ID.String(),
			"context_count": len(prompt.Context),
		}).Debug("Successfully saved all context entries")
	}

	err = tx.Commit()
	if err != nil {
		s.logger.WithError(err).WithField("prompt_id", prompt.ID.String()).Error("Failed to commit transaction")
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	s.logger.WithFields(logrus.Fields{
		"prompt_id":      prompt.ID.String(),
		"phase":          prompt.Phase,
		"provider":       prompt.Provider,
		"model":          prompt.Model,
		"content_hash":   contentHash,
		"vector_enabled": s.vectorOptimized,
	}).Info("Successfully saved prompt with enhanced vector support")

	return nil
}

// Helper function to handle parent ID conversion
func getParentIDString(parentID *uuid.UUID) interface{} {
	if parentID == nil {
		return nil
	}
	return parentID.String()
}

// GetPrompt retrieves a prompt by ID
func (s *Storage) GetPrompt(id uuid.UUID) (*models.Prompt, error) {
	var dbPrompt struct {
		ID                string     `db:"id"`
		Content           string     `db:"content"`
		ContentHash       *string    `db:"content_hash"`
		Phase             string     `db:"phase"`
		Provider          string     `db:"provider"`
		Model             string     `db:"model"`
		Temperature       float64    `db:"temperature"`
		MaxTokens         int        `db:"max_tokens"`
		ActualTokens      int        `db:"actual_tokens"`
		Tags              string     `db:"tags"`
		ParentID          *string    `db:"parent_id"`
		SourceType        *string    `db:"source_type"`
		EnhancementMethod *string    `db:"enhancement_method"`
		RelevanceScore    *float64   `db:"relevance_score"`
		UsageCount        *int       `db:"usage_count"`
		GenerationCount   *int       `db:"generation_count"`
		LastUsedAt        *time.Time `db:"last_used_at"`
		OriginalInput     *string    `db:"original_input"`
		GenerationRequest *string    `db:"generation_request"`
		GenerationContext *string    `db:"generation_context"`
		PersonaUsed       *string    `db:"persona_used"`
		TargetModelFamily *string    `db:"target_model_family"`
		CreatedAt         time.Time  `db:"created_at"`
		UpdatedAt         time.Time  `db:"updated_at"`
		Embedding         []byte     `db:"embedding"`
		EmbeddingModel    *string    `db:"embedding_model"`
		EmbeddingProvider *string    `db:"embedding_provider"`
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

	// Set optional fields
	if dbPrompt.SourceType != nil {
		prompt.SourceType = *dbPrompt.SourceType
	}
	if dbPrompt.EnhancementMethod != nil {
		prompt.EnhancementMethod = *dbPrompt.EnhancementMethod
	}
	if dbPrompt.RelevanceScore != nil {
		prompt.RelevanceScore = *dbPrompt.RelevanceScore
	}
	if dbPrompt.UsageCount != nil {
		prompt.UsageCount = *dbPrompt.UsageCount
	}
	if dbPrompt.GenerationCount != nil {
		prompt.GenerationCount = *dbPrompt.GenerationCount
	}
	if dbPrompt.OriginalInput != nil {
		prompt.OriginalInput = *dbPrompt.OriginalInput
	}
	if dbPrompt.PersonaUsed != nil {
		prompt.PersonaUsed = *dbPrompt.PersonaUsed
	}
	if dbPrompt.TargetModelFamily != nil {
		prompt.TargetModelFamily = *dbPrompt.TargetModelFamily
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
		SELECT p.id, p.content, p.content_hash, p.phase, p.provider, p.model, p.temperature, 
		       p.max_tokens, p.actual_tokens, p.tags, p.parent_id, p.source_type, 
		       p.enhancement_method, p.relevance_score, p.usage_count, p.generation_count, 
		       p.last_used_at, p.created_at, p.updated_at, p.embedding, p.embedding_model, 
		       p.embedding_provider, p.original_input, p.generation_request, p.generation_context, 
		       p.persona_used, p.target_model_family,
		       mm.generation_model, mm.generation_provider, mm.embedding_model as mm_embedding_model, 
		       mm.embedding_provider as mm_embedding_provider, mm.processing_time, mm.total_tokens
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
	defer func() {
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
	}()

	prompts := make([]models.Prompt, 0)
	for rows.Next() {
		var dbPrompt struct {
			ID                  string     `db:"id"`
			Content             string     `db:"content"`
			ContentHash         *string    `db:"content_hash"`
			Phase               string     `db:"phase"`
			Provider            string     `db:"provider"`
			Model               string     `db:"model"`
			Temperature         float64    `db:"temperature"`
			MaxTokens           int        `db:"max_tokens"`
			ActualTokens        int        `db:"actual_tokens"`
			Tags                string     `db:"tags"`
			ParentID            *string    `db:"parent_id"`
			SourceType          *string    `db:"source_type"`
			EnhancementMethod   *string    `db:"enhancement_method"`
			RelevanceScore      *float64   `db:"relevance_score"`
			UsageCount          *int       `db:"usage_count"`
			GenerationCount     *int       `db:"generation_count"`
			LastUsedAt          *time.Time `db:"last_used_at"`
			CreatedAt           time.Time  `db:"created_at"`
			UpdatedAt           time.Time  `db:"updated_at"`
			Embedding           []byte     `db:"embedding"`
			EmbeddingModel      *string    `db:"embedding_model"`
			EmbeddingProvider   *string    `db:"embedding_provider"`
			OriginalInput       *string    `db:"original_input"`
			GenerationRequest   *string    `db:"generation_request"`
			GenerationContext   *string    `db:"generation_context"`
			PersonaUsed         *string    `db:"persona_used"`
			TargetModelFamily   *string    `db:"target_model_family"`
			MetadataGenModel    *string    `db:"generation_model"`
			MetadataGenProvider *string    `db:"generation_provider"`
			MetadataEmbModel    *string    `db:"mm_embedding_model"`
			MetadataEmbProvider *string    `db:"mm_embedding_provider"`
			MetadataProcessTime *int       `db:"processing_time"`
			MetadataTotalTokens *int       `db:"total_tokens"`
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
		// Convert embedding data from bytes to float32 slice
		if len(dbPrompt.Embedding) > 0 {
			prompt.Embedding = bytesToFloat32Array(dbPrompt.Embedding)
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

// MigrateLegacyEmbeddings migrates prompts with non-standard embedding dimensions
func (s *Storage) MigrateLegacyEmbeddings(standardModel string, standardDimensions int, batchSize int) error {
	s.logger.WithFields(logrus.Fields{
		"standard_model":      standardModel,
		"standard_dimensions": standardDimensions,
		"batch_size":          batchSize,
	}).Info("Starting legacy embedding migration")

	// Find all prompts with non-standard embeddings
	query := `
		SELECT id, embedding, embedding_model, LENGTH(embedding)/4 as dimensions
		FROM prompts 
		WHERE embedding IS NOT NULL 
		AND (embedding_model != ? OR LENGTH(embedding)/4 != ?)
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, standardModel, standardDimensions)
	if err != nil {
		return fmt.Errorf("failed to query legacy embeddings: %w", err)
	}
	defer func() {
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
	}()

	var migrationCandidates []struct {
		ID             string
		Embedding      []byte
		EmbeddingModel string
		Dimensions     int
	}

	for rows.Next() {
		var candidate struct {
			ID             string
			Embedding      []byte
			EmbeddingModel string
			Dimensions     int
		}
		if err := rows.Scan(&candidate.ID, &candidate.Embedding, &candidate.EmbeddingModel, &candidate.Dimensions); err != nil {
			s.logger.WithError(err).Warn("Failed to scan migration candidate")
			continue
		}
		migrationCandidates = append(migrationCandidates, candidate)
	}

	if len(migrationCandidates) == 0 {
		s.logger.Info("No legacy embeddings found - migration complete")
		return nil
	}

	s.logger.WithField("candidates", len(migrationCandidates)).Info("Found legacy embeddings to migrate")

	// Mark these prompts for re-embedding by clearing their embeddings
	// The next time they're accessed or during background processing, they'll be re-embedded
	for i, candidate := range migrationCandidates {
		if i > 0 && i%batchSize == 0 {
			s.logger.WithField("processed", i).Info("Migration batch processed")
		}

		_, err := s.db.Exec(`
			UPDATE prompts 
			SET embedding = NULL, 
			    embedding_model = NULL, 
			    embedding_provider = NULL,
			    updated_at = ?
			WHERE id = ?
		`, time.Now(), candidate.ID)

		if err != nil {
			s.logger.WithError(err).WithField("prompt_id", candidate.ID).Error("Failed to clear legacy embedding")
			continue
		}

		s.logger.WithFields(logrus.Fields{
			"prompt_id":         candidate.ID,
			"old_model":         candidate.EmbeddingModel,
			"old_dimensions":    candidate.Dimensions,
			"target_model":      standardModel,
			"target_dimensions": standardDimensions,
		}).Debug("Cleared legacy embedding for re-processing")
	}

	s.logger.WithFields(logrus.Fields{
		"migrated":            len(migrationCandidates),
		"standard_model":      standardModel,
		"standard_dimensions": standardDimensions,
	}).Info("Legacy embedding migration completed")

	return nil
}

// ValidateEmbeddingStandard checks if an embedding meets the standard requirements
func (s *Storage) ValidateEmbeddingStandard(embedding []float32, model string, standardModel string, standardDimensions int) bool {
	if model != standardModel {
		s.logger.WithFields(logrus.Fields{
			"provided_model": model,
			"standard_model": standardModel,
		}).Debug("Embedding model does not match standard")
		return false
	}

	if len(embedding) != standardDimensions {
		s.logger.WithFields(logrus.Fields{
			"provided_dimensions": len(embedding),
			"standard_dimensions": standardDimensions,
		}).Debug("Embedding dimensions do not match standard")
		return false
	}

	return true
}

// GetEmbeddingStats returns statistics about embedding coverage and standards compliance
func (s *Storage) GetEmbeddingStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total prompts
	var totalPrompts int
	err := s.db.Get(&totalPrompts, "SELECT COUNT(*) FROM prompts")
	if err != nil {
		return nil, fmt.Errorf("failed to count total prompts: %w", err)
	}
	stats["total_prompts"] = totalPrompts

	// Prompts with embeddings
	var promptsWithEmbeddings int
	err = s.db.Get(&promptsWithEmbeddings, "SELECT COUNT(*) FROM prompts WHERE embedding IS NOT NULL")
	if err != nil {
		return nil, fmt.Errorf("failed to count prompts with embeddings: %w", err)
	}
	stats["prompts_with_embeddings"] = promptsWithEmbeddings

	// Embedding coverage percentage
	if totalPrompts > 0 {
		stats["embedding_coverage"] = float64(promptsWithEmbeddings) / float64(totalPrompts) * 100
	} else {
		stats["embedding_coverage"] = 0.0
	}

	// Embedding models and dimensions
	type modelStats struct {
		Model      string `db:"embedding_model"`
		Dimensions int    `db:"dimensions"`
		Count      int    `db:"count"`
	}

	var models []modelStats
	err = s.db.Select(&models, `
		SELECT embedding_model, LENGTH(embedding)/4 as dimensions, COUNT(*) as count
		FROM prompts 
		WHERE embedding IS NOT NULL 
		GROUP BY embedding_model, LENGTH(embedding)
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to get embedding model stats: %w", err)
	}

	stats["models"] = models

	// Dimension distribution
	var dimensionStats []struct {
		Dimensions int `db:"dimensions"`
		Count      int `db:"count"`
	}
	err = s.db.Select(&dimensionStats, `
		SELECT LENGTH(embedding)/4 as dimensions, COUNT(*) as count
		FROM prompts 
		WHERE embedding IS NOT NULL 
		GROUP BY LENGTH(embedding)
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to get dimension stats: %w", err)
	}

	stats["dimensions"] = dimensionStats

	return stats, nil
}

// Lifecycle Management Functions

// UpdateRelevanceScores applies daily decay to prompt relevance scores
func (s *Storage) UpdateRelevanceScores() error {
	decayRate, err := s.getConfigFloat("relevance_decay_rate", 0.95)
	if err != nil {
		return fmt.Errorf("failed to get decay rate: %w", err)
	}

	query := `
		UPDATE prompts 
		SET relevance_score = relevance_score * ?
		WHERE last_used_at IS NULL OR last_used_at < datetime('now', '-1 day')
	`

	_, err = s.db.Exec(query, decayRate)
	if err != nil {
		return fmt.Errorf("failed to update relevance scores: %w", err)
	}

	s.logger.Info("Updated relevance scores with decay")
	return nil
}

// CleanupOldPrompts removes prompts that are no longer relevant
func (s *Storage) CleanupOldPrompts() error {
	maxPrompts, err := s.getConfigInt("max_prompts", 1000)
	if err != nil {
		return fmt.Errorf("failed to get max prompts: %w", err)
	}

	minRelevance, err := s.getConfigFloat("min_relevance_score", 0.3)
	if err != nil {
		return fmt.Errorf("failed to get min relevance: %w", err)
	}

	maxUnusedDays, err := s.getConfigInt("max_unused_days", 30)
	if err != nil {
		return fmt.Errorf("failed to get max unused days: %w", err)
	}

	// Count current prompts
	var currentCount int
	err = s.db.Get(&currentCount, "SELECT COUNT(*) FROM prompts")
	if err != nil {
		return fmt.Errorf("failed to count prompts: %w", err)
	}

	if currentCount <= maxPrompts {
		s.logger.WithField("count", currentCount).Info("No cleanup needed")
		return nil
	}

	// Delete prompts that are old and have low relevance
	deleteQuery := `
		DELETE FROM prompts 
		WHERE id IN (
			SELECT id FROM prompts 
			WHERE (
				relevance_score < ? OR 
				(last_used_at IS NOT NULL AND last_used_at < datetime('now', '-' || ? || ' days'))
			)
			ORDER BY relevance_score ASC, last_used_at ASC 
			LIMIT ?
		)
	`

	toDelete := currentCount - maxPrompts + 50 // Delete a bit more to avoid frequent cleanups
	result, err := s.db.Exec(deleteQuery, minRelevance, maxUnusedDays, toDelete)
	if err != nil {
		return fmt.Errorf("failed to cleanup prompts: %w", err)
	}

	deleted, _ := result.RowsAffected()
	s.logger.WithField("deleted", deleted).Info("Cleaned up old prompts")

	return nil
}

// TrackPromptUsage records when a prompt is used and updates relevance
func (s *Storage) TrackPromptUsage(promptID uuid.UUID, context string) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer safeRollback(tx, s.logger)

	// Update last_used_at (triggers will update usage_count and relevance_score)
	_, err = tx.Exec(
		"UPDATE prompts SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
		promptID.String(),
	)
	if err != nil {
		return fmt.Errorf("failed to update prompt usage: %w", err)
	}

	// Record usage analytics
	_, err = tx.NamedExec(`
		INSERT INTO usage_analytics (id, prompt_id, usage_context, created_at)
		VALUES (:id, :prompt_id, :usage_context, CURRENT_TIMESTAMP)
	`, map[string]interface{}{
		"id":            uuid.New().String(),
		"prompt_id":     promptID.String(),
		"usage_context": context,
	})
	if err != nil {
		s.logger.WithError(err).WithField("prompt_id", promptID.String()).Error("Failed to record usage analytics")
		return fmt.Errorf("failed to record usage analytics: %w", err)
	}

	return tx.Commit()
}

// TrackPromptRelationship records relationships between prompts
func (s *Storage) TrackPromptRelationship(sourceID, targetID uuid.UUID, relationshipType string, strength float64, context string) error {
	_, err := s.db.NamedExec(`
		INSERT OR REPLACE INTO prompt_relationships 
		(id, source_prompt_id, target_prompt_id, relationship_type, strength, context, created_at)
		VALUES (:id, :source_prompt_id, :target_prompt_id, :relationship_type, :strength, :context, CURRENT_TIMESTAMP)
	`, map[string]interface{}{
		"id":                uuid.New().String(),
		"source_prompt_id":  sourceID.String(),
		"target_prompt_id":  targetID.String(),
		"relationship_type": relationshipType,
		"strength":          strength,
		"context":           context,
	})

	if err != nil {
		return fmt.Errorf("failed to track prompt relationship: %w", err)
	}

	s.logger.WithFields(logrus.Fields{
		"source":       sourceID.String(),
		"target":       targetID.String(),
		"relationship": relationshipType,
		"strength":     strength,
	}).Info("Tracked prompt relationship")

	return nil
}

// TrackPromptEnhancement records how a prompt was enhanced
func (s *Storage) TrackPromptEnhancement(promptID, parentID uuid.UUID, enhancementType, method string, improvementScore float64, metadata map[string]interface{}) error {
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	_, err = s.db.NamedExec(`
		INSERT INTO enhancement_history 
		(id, prompt_id, parent_prompt_id, enhancement_type, enhancement_method, improvement_score, metadata, created_at)
		VALUES (:id, :prompt_id, :parent_prompt_id, :enhancement_type, :enhancement_method, :improvement_score, :metadata, CURRENT_TIMESTAMP)
	`, map[string]interface{}{
		"id":                 uuid.New().String(),
		"prompt_id":          promptID.String(),
		"parent_prompt_id":   parentID.String(),
		"enhancement_type":   enhancementType,
		"enhancement_method": method,
		"improvement_score":  improvementScore,
		"metadata":           string(metadataJSON),
	})

	if err != nil {
		return fmt.Errorf("failed to track prompt enhancement: %w", err)
	}

	s.logger.WithFields(logrus.Fields{
		"prompt":      promptID.String(),
		"parent":      parentID.String(),
		"enhancement": enhancementType,
		"method":      method,
		"improvement": improvementScore,
	}).Info("Tracked prompt enhancement")

	return nil
}

// GetPromptsByRelevance returns prompts ordered by relevance score
func (s *Storage) GetPromptsByRelevance(limit int) ([]models.Prompt, error) {
	// Override the query to order by relevance
	query := `
		SELECT p.id, p.content, p.content_hash, p.phase, p.provider, p.model, p.temperature, 
		       p.max_tokens, p.actual_tokens, p.tags, p.parent_id, p.source_type, 
		       p.enhancement_method, p.relevance_score, p.usage_count, p.generation_count, 
		       p.last_used_at, p.created_at, p.updated_at, p.embedding, p.embedding_model, 
		       p.embedding_provider, p.original_input, p.generation_request, p.generation_context, 
		       p.persona_used, p.target_model_family,
		       mm.generation_model, mm.generation_provider, mm.embedding_model as mm_embedding_model, 
		       mm.embedding_provider as mm_embedding_provider, mm.processing_time, mm.total_tokens
		FROM prompts p
		LEFT JOIN model_metadata mm ON p.id = mm.prompt_id
		ORDER BY p.relevance_score DESC, p.usage_count DESC, p.last_used_at DESC
		LIMIT ?
	`

	rows, err := s.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
	}()

	prompts := make([]models.Prompt, 0)
	for rows.Next() {
		// Use the same scanning logic as SearchPrompts
		var dbPrompt struct {
			ID                  string     `db:"id"`
			Content             string     `db:"content"`
			ContentHash         *string    `db:"content_hash"`
			Phase               string     `db:"phase"`
			Provider            string     `db:"provider"`
			Model               string     `db:"model"`
			Temperature         float64    `db:"temperature"`
			MaxTokens           int        `db:"max_tokens"`
			ActualTokens        int        `db:"actual_tokens"`
			Tags                string     `db:"tags"`
			ParentID            *string    `db:"parent_id"`
			SourceType          *string    `db:"source_type"`
			EnhancementMethod   *string    `db:"enhancement_method"`
			RelevanceScore      *float64   `db:"relevance_score"`
			UsageCount          *int       `db:"usage_count"`
			GenerationCount     *int       `db:"generation_count"`
			LastUsedAt          *time.Time `db:"last_used_at"`
			CreatedAt           time.Time  `db:"created_at"`
			UpdatedAt           time.Time  `db:"updated_at"`
			Embedding           []byte     `db:"embedding"`
			EmbeddingModel      *string    `db:"embedding_model"`
			EmbeddingProvider   *string    `db:"embedding_provider"`
			OriginalInput       *string    `db:"original_input"`
			GenerationRequest   *string    `db:"generation_request"`
			GenerationContext   *string    `db:"generation_context"`
			PersonaUsed         *string    `db:"persona_used"`
			TargetModelFamily   *string    `db:"target_model_family"`
			MetadataGenModel    *string    `db:"generation_model"`
			MetadataGenProvider *string    `db:"generation_provider"`
			MetadataEmbModel    *string    `db:"mm_embedding_model"`
			MetadataEmbProvider *string    `db:"mm_embedding_provider"`
			MetadataProcessTime *int       `db:"processing_time"`
			MetadataTotalTokens *int       `db:"total_tokens"`
		}

		err := rows.Scan(
			&dbPrompt.ID, &dbPrompt.Content, &dbPrompt.ContentHash, &dbPrompt.Phase, &dbPrompt.Provider,
			&dbPrompt.Model, &dbPrompt.Temperature, &dbPrompt.MaxTokens, &dbPrompt.ActualTokens,
			&dbPrompt.Tags, &dbPrompt.ParentID, &dbPrompt.SourceType, &dbPrompt.EnhancementMethod,
			&dbPrompt.RelevanceScore, &dbPrompt.UsageCount, &dbPrompt.GenerationCount, &dbPrompt.LastUsedAt,
			&dbPrompt.CreatedAt, &dbPrompt.UpdatedAt, &dbPrompt.Embedding, &dbPrompt.EmbeddingModel,
			&dbPrompt.EmbeddingProvider, &dbPrompt.OriginalInput, &dbPrompt.GenerationRequest,
			&dbPrompt.GenerationContext, &dbPrompt.PersonaUsed, &dbPrompt.TargetModelFamily,
			// Model metadata fields (can be NULL)
			&dbPrompt.MetadataGenModel, &dbPrompt.MetadataGenProvider, &dbPrompt.MetadataEmbModel,
			&dbPrompt.MetadataEmbProvider, &dbPrompt.MetadataProcessTime, &dbPrompt.MetadataTotalTokens,
		)
		if err != nil {
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

// RunLifecycleMaintenance performs regular maintenance tasks
func (s *Storage) RunLifecycleMaintenance() error {
	s.logger.Info("Starting lifecycle maintenance")

	// Update relevance scores
	if err := s.UpdateRelevanceScores(); err != nil {
		s.logger.WithError(err).Error("Failed to update relevance scores")
		return err
	}

	// Cleanup old prompts
	if err := s.CleanupOldPrompts(); err != nil {
		s.logger.WithError(err).Error("Failed to cleanup old prompts")
		return err
	}

	s.logger.Info("Completed lifecycle maintenance")
	return nil
}

// GetDB returns the database connection for direct queries
func (s *Storage) GetDB() *sqlx.DB {
	return s.db
}

// GetConfigInt gets an integer configuration value
func (s *Storage) GetConfigInt(key string, defaultValue int) (int, error) {
	return s.getConfigInt(key, defaultValue)
}

// GetConfigFloat gets a float configuration value
func (s *Storage) GetConfigFloat(key string, defaultValue float64) (float64, error) {
	return s.getConfigFloat(key, defaultValue)
}

// Helper functions for configuration
func (s *Storage) getConfigInt(key string, defaultValue int) (int, error) {
	var value string
	err := s.db.Get(&value, "SELECT value FROM database_config WHERE key = ?", key)
	if err != nil {
		if err == sql.ErrNoRows {
			return defaultValue, nil
		}
		return defaultValue, err
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue, fmt.Errorf("invalid config value for %s: %w", key, err)
	}

	return intValue, nil
}

func (s *Storage) getConfigFloat(key string, defaultValue float64) (float64, error) {
	var value string
	err := s.db.Get(&value, "SELECT value FROM database_config WHERE key = ?", key)
	if err != nil {
		if err == sql.ErrNoRows {
			return defaultValue, nil
		}
		return defaultValue, err
	}

	floatValue, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return defaultValue, fmt.Errorf("invalid config value for %s: %w", key, err)
	}

	return floatValue, nil
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

// SemanticSearchCriteria defines semantic search parameters
type SemanticSearchCriteria struct {
	Query          string
	QueryEmbedding []float32
	Limit          int
	MinSimilarity  float64
	Phase          string
	Provider       string
	Model          string
	Tags           []string
	Since          *time.Time
}

// UpdatePrompt updates an existing prompt in the database
func (s *Storage) UpdatePrompt(prompt *models.Prompt) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer safeRollback(tx, s.logger)

	// Convert tags to JSON
	tagsJSON, err := json.Marshal(prompt.Tags)
	if err != nil {
		return fmt.Errorf("failed to marshal tags: %w", err)
	}

	// Convert embedding to bytes for storage
	var embeddingBytes []byte
	if prompt.Embedding != nil {
		embeddingBytes = float32ArrayToBytes(prompt.Embedding)
	}

	// Update main prompt record
	query := `
		UPDATE prompts SET 
			content = :content,
			phase = :phase,
			provider = :provider,
			model = :model,
			temperature = :temperature,
			max_tokens = :max_tokens,
			actual_tokens = :actual_tokens,
			tags = :tags,
			parent_id = :parent_id,
			updated_at = :updated_at,
			embedding = :embedding,
			embedding_model = :embedding_model,
			embedding_provider = :embedding_provider
		WHERE id = :id
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
		"updated_at":         time.Now(),
		"embedding":          embeddingBytes,
		"embedding_model":    prompt.EmbeddingModel,
		"embedding_provider": prompt.EmbeddingProvider,
	}

	if prompt.ParentID != nil {
		args["parent_id"] = prompt.ParentID.String()
	}

	result, err := tx.NamedExec(query, args)
	if err != nil {
		return fmt.Errorf("failed to update prompt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("prompt not found")
	}

	// Update model metadata if provided
	if prompt.ModelMetadata != nil {
		if err := s.updateModelMetadata(tx, prompt.ModelMetadata); err != nil {
			return fmt.Errorf("failed to update model metadata: %w", err)
		}
	}

	return tx.Commit()
}

// updateModelMetadata updates detailed model metadata
func (s *Storage) updateModelMetadata(tx *sqlx.Tx, metadata *models.ModelMetadata) error {
	query := `
		UPDATE model_metadata SET
			generation_model = :generation_model,
			generation_provider = :generation_provider,
			embedding_model = :embedding_model,
			embedding_provider = :embedding_provider,
			model_version = :model_version,
			api_version = :api_version,
			processing_time = :processing_time,
			input_tokens = :input_tokens,
			output_tokens = :output_tokens,
			total_tokens = :total_tokens,
			cost = :cost
		WHERE prompt_id = :prompt_id
	`

	args := map[string]interface{}{
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
	}

	_, err := tx.NamedExec(query, args)
	return err
}

// DeletePrompt removes a prompt and all related data from the database
func (s *Storage) DeletePrompt(id uuid.UUID) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer safeRollback(tx, s.logger)

	// Delete related data first (due to foreign key constraints)

	// Delete context
	_, err = tx.Exec("DELETE FROM context WHERE prompt_id = ?", id.String())
	if err != nil {
		return fmt.Errorf("failed to delete context: %w", err)
	}

	// Delete metrics
	_, err = tx.Exec("DELETE FROM metrics WHERE prompt_id = ?", id.String())
	if err != nil {
		return fmt.Errorf("failed to delete metrics: %w", err)
	}

	// Delete model metadata
	_, err = tx.Exec("DELETE FROM model_metadata WHERE prompt_id = ?", id.String())
	if err != nil {
		return fmt.Errorf("failed to delete model metadata: %w", err)
	}

	// Delete the main prompt
	result, err := tx.Exec("DELETE FROM prompts WHERE id = ?", id.String())
	if err != nil {
		return fmt.Errorf("failed to delete prompt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("prompt not found")
	}

	return tx.Commit()
}

// SearchPromptsSemanticFast performs fast semantic search with improved algorithms
func (s *Storage) SearchPromptsSemanticFast(criteria SemanticSearchCriteria) ([]models.Prompt, []float64, error) {
	if criteria.QueryEmbedding == nil {
		return nil, nil, fmt.Errorf("query embedding is required for semantic search")
	}

	// Use optimized query with pre-filtering to reduce comparison set
	query := `
		SELECT 
			p.id, p.content, p.content_hash, p.phase, p.provider, p.model, p.temperature,
			p.max_tokens, p.actual_tokens, p.tags, p.parent_id, p.source_type,
			p.enhancement_method, p.relevance_score, p.usage_count, p.generation_count,
			p.last_used_at, p.created_at, p.updated_at, p.embedding, p.embedding_model,
			p.embedding_provider, p.original_input, p.generation_request, p.generation_context,
			p.persona_used, p.target_model_family
		FROM prompts p
		WHERE p.embedding IS NOT NULL
		  AND p.relevance_score >= 0.1  -- Pre-filter low-relevance prompts
	`

	args := []interface{}{}

	// Add filters
	if criteria.Phase != "" {
		query += " AND p.phase = ?"
		args = append(args, criteria.Phase)
	}

	if criteria.Provider != "" {
		query += " AND p.provider = ?"
		args = append(args, criteria.Provider)
	}

	if criteria.Model != "" {
		query += " AND p.model = ?"
		args = append(args, criteria.Model)
	}

	if len(criteria.Tags) > 0 {
		query += " AND p.tags LIKE ?"
		args = append(args, fmt.Sprintf("%%%s%%", criteria.Tags[0]))
	}

	if criteria.Since != nil {
		query += " AND p.created_at >= ?"
		args = append(args, criteria.Since)
	}

	// Order by relevance and usage for better candidates first
	query += ` ORDER BY p.relevance_score DESC, p.usage_count DESC`

	// Limit initial fetch to reasonable number for in-memory processing
	maxCandidates := criteria.Limit * 10
	if maxCandidates < 100 {
		maxCandidates = 100
	}
	if maxCandidates > 1000 {
		maxCandidates = 1000
	}
	query += fmt.Sprintf(" LIMIT %d", maxCandidates)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		s.logger.WithError(err).Error("Failed to execute fast semantic search")
		return nil, nil, fmt.Errorf("failed to execute fast semantic search: %w", err)
	}
	defer func() {
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
	}()

	type candidatePrompt struct {
		prompt     models.Prompt
		similarity float64
	}

	var candidates []candidatePrompt

	for rows.Next() {
		var dbPrompt struct {
			ID                string     `db:"id"`
			Content           string     `db:"content"`
			ContentHash       *string    `db:"content_hash"`
			Phase             string     `db:"phase"`
			Provider          string     `db:"provider"`
			Model             string     `db:"model"`
			Temperature       float64    `db:"temperature"`
			MaxTokens         int        `db:"max_tokens"`
			ActualTokens      int        `db:"actual_tokens"`
			Tags              string     `db:"tags"`
			ParentID          *string    `db:"parent_id"`
			SourceType        *string    `db:"source_type"`
			EnhancementMethod *string    `db:"enhancement_method"`
			RelevanceScore    *float64   `db:"relevance_score"`
			UsageCount        *int       `db:"usage_count"`
			GenerationCount   *int       `db:"generation_count"`
			LastUsedAt        *time.Time `db:"last_used_at"`
			CreatedAt         time.Time  `db:"created_at"`
			UpdatedAt         time.Time  `db:"updated_at"`
			Embedding         []byte     `db:"embedding"`
			EmbeddingModel    *string    `db:"embedding_model"`
			EmbeddingProvider *string    `db:"embedding_provider"`
			OriginalInput     *string    `db:"original_input"`
			GenerationRequest *string    `db:"generation_request"`
			GenerationContext *string    `db:"generation_context"`
			PersonaUsed       *string    `db:"persona_used"`
			TargetModelFamily *string    `db:"target_model_family"`
		}

		err := rows.Scan(
			&dbPrompt.ID, &dbPrompt.Content, &dbPrompt.ContentHash, &dbPrompt.Phase, &dbPrompt.Provider,
			&dbPrompt.Model, &dbPrompt.Temperature, &dbPrompt.MaxTokens, &dbPrompt.ActualTokens,
			&dbPrompt.Tags, &dbPrompt.ParentID, &dbPrompt.SourceType, &dbPrompt.EnhancementMethod,
			&dbPrompt.RelevanceScore, &dbPrompt.UsageCount, &dbPrompt.GenerationCount, &dbPrompt.LastUsedAt,
			&dbPrompt.CreatedAt, &dbPrompt.UpdatedAt, &dbPrompt.Embedding, &dbPrompt.EmbeddingModel,
			&dbPrompt.EmbeddingProvider, &dbPrompt.OriginalInput, &dbPrompt.GenerationRequest,
			&dbPrompt.GenerationContext, &dbPrompt.PersonaUsed, &dbPrompt.TargetModelFamily,
		)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to scan semantic search row")
			continue
		}

		// Convert embedding back to float32 array
		if len(dbPrompt.Embedding) == 0 {
			continue
		}

		promptEmbedding := bytesToFloat32Array(dbPrompt.Embedding)
		if len(promptEmbedding) != len(criteria.QueryEmbedding) {
			continue
		}

		// Calculate cosine similarity
		similarity := cosineSimilarity(criteria.QueryEmbedding, promptEmbedding)

		if similarity >= criteria.MinSimilarity {
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
				Embedding:    promptEmbedding,
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

			candidates = append(candidates, candidatePrompt{
				prompt:     prompt,
				similarity: similarity,
			})
		}
	}

	// Sort candidates by similarity (descending)
	for i := 0; i < len(candidates)-1; i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[i].similarity < candidates[j].similarity {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	// Extract top results
	limit := criteria.Limit
	if limit <= 0 || limit > len(candidates) {
		limit = len(candidates)
	}

	prompts := make([]models.Prompt, limit)
	similarities := make([]float64, limit)
	for i := 0; i < limit; i++ {
		prompts[i] = candidates[i].prompt
		similarities[i] = candidates[i].similarity
	}

	s.logger.WithFields(logrus.Fields{
		"candidates_found": len(candidates),
		"results_returned": len(prompts),
		"avg_similarity":   calculateAverageSimilarity(similarities),
	}).Debug("Fast semantic search completed")

	return prompts, similarities, nil
}

// GetVectorStats returns statistics about vector storage
func (s *Storage) GetVectorStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	stats["vector_optimized"] = s.vectorOptimized

	// Count total vectors
	var vectorCount int
	err := s.db.Get(&vectorCount, "SELECT COUNT(*) FROM prompts WHERE embedding IS NOT NULL")
	if err != nil {
		return stats, err
	}
	stats["vector_count"] = vectorCount

	// Count total prompts
	var promptCount int
	err = s.db.Get(&promptCount, "SELECT COUNT(*) FROM prompts")
	if err != nil {
		return stats, err
	}
	stats["prompt_count"] = promptCount

	// Calculate coverage
	if promptCount > 0 {
		stats["vector_coverage"] = float64(vectorCount) / float64(promptCount)
	} else {
		stats["vector_coverage"] = 0.0
	}

	// Get average relevance score
	var avgRelevance sql.NullFloat64
	err = s.db.Get(&avgRelevance, "SELECT AVG(relevance_score) FROM prompts WHERE embedding IS NOT NULL")
	if err == nil && avgRelevance.Valid {
		stats["avg_relevance_score"] = avgRelevance.Float64
	}

	// Get embedding model distribution
	rows, err := s.db.Query("SELECT embedding_model, COUNT(*) as count FROM prompts WHERE embedding IS NOT NULL GROUP BY embedding_model")
	if err == nil {
		modelStats := make(map[string]int)
		for rows.Next() {
			var model string
			var count int
			if err := rows.Scan(&model, &count); err == nil {
				modelStats[model] = count
			}
		}
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
		stats["embedding_models"] = modelStats
	}

	return stats, nil
}

// Helper functions

func bytesToFloat32Array(data []byte) []float32 {
	if len(data)%4 != 0 {
		return nil
	}

	result := make([]float32, len(data)/4)
	for i := 0; i < len(result); i++ {
		bits := binary.LittleEndian.Uint32(data[i*4:])
		result[i] = math.Float32frombits(bits)
	}
	return result
}

// float32ArrayToBytes converts a []float32 to a []byte
func float32ArrayToBytes(data []float32) []byte {
	result := make([]byte, len(data)*4)
	for i, v := range data {
		binary.LittleEndian.PutUint32(result[i*4:], math.Float32bits(v))
	}
	return result
}

// cosineSimilarity calculates cosine similarity between two embeddings
func cosineSimilarity(a, b []float32) float64 {
	if len(a) != len(b) {
		return 0.0
	}

	var dotProduct, normA, normB float64
	for i := 0; i < len(a); i++ {
		dotProduct += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}

	if normA == 0.0 || normB == 0.0 {
		return 0.0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}

func calculateAverageSimilarity(similarities []float64) float64 {
	if len(similarities) == 0 {
		return 0.0
	}
	sum := 0.0
	for _, sim := range similarities {
		sum += sim
	}
	return sum / float64(len(similarities))
}

// MetricsCriteria defines metrics search parameters
type MetricsCriteria struct {
	Phase    string
	Provider string
	Since    *time.Time
	Limit    int
}

// GetMetrics retrieves all metrics for prompts
func (s *Storage) GetMetrics(criteria MetricsCriteria) ([]models.PromptMetrics, error) {
	query := `
		SELECT m.id, m.prompt_id, m.conversion_rate, m.engagement_score,
		       m.token_usage, m.response_time, m.usage_count, m.created_at, m.updated_at
		FROM metrics m
		JOIN prompts p ON m.prompt_id = p.id
		WHERE 1=1
	`
	args := []interface{}{}

	if criteria.Phase != "" {
		query += " AND p.phase = ?"
		args = append(args, criteria.Phase)
	}

	if criteria.Provider != "" {
		query += " AND p.provider = ?"
		args = append(args, criteria.Provider)
	}

	if criteria.Since != nil {
		query += " AND m.created_at >= ?"
		args = append(args, criteria.Since)
	}

	query += " ORDER BY m.updated_at DESC"

	if criteria.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", criteria.Limit)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			s.logger.WithError(err).Warn("Failed to close rows")
		}
	}()

	var metrics []models.PromptMetrics
	for rows.Next() {
		var metric models.PromptMetrics
		err := rows.Scan(
			&metric.ID, &metric.PromptID, &metric.ConversionRate, &metric.EngagementScore,
			&metric.TokenUsage, &metric.ResponseTime, &metric.UsageCount,
			&metric.CreatedAt, &metric.UpdatedAt,
		)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to scan metric row")
			continue
		}
		metrics = append(metrics, metric)
	}

	return metrics, nil
}

// Add safeRollback helper after imports and type definitions
func safeRollback(tx *sqlx.Tx, logger *logrus.Logger) {
	if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
		logger.WithError(err).Warn("Failed to rollback transaction")
	}
}
