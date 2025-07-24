package storage

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/ncruces/go-sqlite3"
	_ "github.com/ncruces/go-sqlite3/embed"
	"github.com/philippgille/chromem-go"
	"github.com/sirupsen/logrus"
)

//go:embed schema.sql
var ddl string

// Storage provides a future-proof hybrid approach:
// - SQLite (WASM) for structured data, metadata, and relationships
// - chromem-go for vector operations and similarity search
// This eliminates atomic operations issues while maintaining performance
type Storage struct {
	db      *sqlite3.Conn // SQLite for structured data (no vector extension)
	vectors *chromem.DB   // chromem-go for vector operations
	logger  *logrus.Logger

	// New fields for tracking current embedding config
	currentEmbeddingModel    string
	currentEmbeddingProvider string
	currentEmbeddingDims     int
}

// NewStorage creates a new Storage instance with hybrid architecture
func NewStorage(dsn string, logger *logrus.Logger) (*Storage, error) {
	// If dsn is a directory, append the database filename
	if info, err := os.Stat(dsn); err == nil && info.IsDir() {
		dsn = filepath.Join(dsn, "prompts.db")
	}

	logger.WithField("dsn", dsn).Info("Initializing future-proof hybrid storage")

	// Initialize SQLite (WASM) for structured data - no vector extensions needed
	db, err := sqlite3.Open(dsn)
	if err != nil {
		logger.WithError(err).Error("Failed to open SQLite database")
		return nil, fmt.Errorf("failed to open SQLite database: %w", err)
	}

	// Enable WAL mode for better concurrency
	if err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to set WAL mode: %w", err)
	}

	// Create tables (no vector-specific tables needed)
	if err := db.Exec(ddl); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	// Initialize persistent chromem-go for vector operations
	vectorDBPath := filepath.Join(filepath.Dir(dsn), "chromem-vectors")
	vectors, err := chromem.NewPersistentDB(vectorDBPath, true) // true for gzip compression
	if err != nil {
		logger.WithError(err).Warn("Failed to create persistent vector DB, using in-memory fallback")
		vectors = chromem.NewDB()
	} else {
		logger.WithField("path", vectorDBPath).Info("Successfully initialized persistent vector storage")
	}

	logger.Info("Successfully initialized hybrid storage: SQLite (WASM) + chromem-go")

	return &Storage{
		db:      db,
		vectors: vectors,
		logger:  logger,
	}, nil
}

// Close closes all database connections
func (s *Storage) Close() error {
	if err := s.db.Close(); err != nil {
		s.logger.WithError(err).Error("Failed to close SQLite connection")
		return err
	}

	// chromem-go persistent DB handles cleanup automatically
	// The persistent files are flushed on document addition

	s.logger.Info("Closed hybrid storage connections")
	return nil
}

// SetEmbeddingConfig updates the current embedding configuration
func (s *Storage) SetEmbeddingConfig(provider, model string, dims int) {
	s.currentEmbeddingProvider = provider
	s.currentEmbeddingModel = model
	s.currentEmbeddingDims = dims

	s.logger.WithFields(logrus.Fields{
		"provider": provider,
		"model":    model,
		"dims":     dims,
	}).Info("Updated embedding configuration")
}

// GetEmbeddingConfig returns the current embedding configuration
func (s *Storage) GetEmbeddingConfig() (provider, model string, dims int) {
	return s.currentEmbeddingProvider, s.currentEmbeddingModel, s.currentEmbeddingDims
}

// SavePrompt saves a prompt using the hybrid approach:
// - Structured data goes to SQLite
// - Embedding goes to chromem-go for efficient vector search
func (s *Storage) SavePrompt(ctx context.Context, p *models.Prompt) error {
	p.UpdatedAt = time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = p.UpdatedAt
	}
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}

	// Save structured data to SQLite
	if err := s.savePromptMetadata(ctx, p); err != nil {
		return fmt.Errorf("failed to save prompt metadata: %w", err)
	}

	// Save embedding to chromem-go if available
	if len(p.Embedding) > 0 {
		// Auto-detect dimensions if not set
		if s.currentEmbeddingDims == 0 {
			s.currentEmbeddingDims = len(p.Embedding)
			s.logger.WithField("dims", s.currentEmbeddingDims).Info("Auto-detected embedding dimensions")
		}

		// Verify dimensions match
		if len(p.Embedding) != s.currentEmbeddingDims {
			return fmt.Errorf("embedding dimension mismatch: expected %d, got %d",
				s.currentEmbeddingDims, len(p.Embedding))
		}

		if err := s.savePromptEmbedding(ctx, p); err != nil {
			s.logger.WithError(err).Warn("Failed to save embedding, continuing without vector search capability")
		}
	}

	s.logger.WithField("prompt_id", p.ID).Debug("Successfully saved prompt with hybrid approach")
	return nil
}

// savePromptMetadata saves the prompt's structured data to SQLite
func (s *Storage) savePromptMetadata(ctx context.Context, p *models.Prompt) error {
	tagsJSON, err := json.Marshal(p.Tags)
	if err != nil {
		return fmt.Errorf("failed to marshal tags: %w", err)
	}

	hash := sha256.Sum256([]byte(p.Content))
	contentHash := hex.EncodeToString(hash[:])

	stmt, _, err := s.db.Prepare(`
		INSERT INTO prompts (
			id, content, content_hash, phase, provider, model, temperature, max_tokens, actual_tokens, 
			tags, parent_id, session_id, source_type, enhancement_method, relevance_score, 
			usage_count, generation_count, last_used_at, original_input, persona_used, 
			target_model_family, created_at, updated_at, embedding_model, embedding_provider
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			content = excluded.content,
			content_hash = excluded.content_hash,
			phase = excluded.phase,
			provider = excluded.provider,
			model = excluded.model,
			temperature = excluded.temperature,
			max_tokens = excluded.max_tokens,
			actual_tokens = excluded.actual_tokens,
			tags = excluded.tags,
			parent_id = excluded.parent_id,
			session_id = excluded.session_id,
			source_type = excluded.source_type,
			enhancement_method = excluded.enhancement_method,
			relevance_score = excluded.relevance_score,
			usage_count = excluded.usage_count,
			generation_count = excluded.generation_count,
			last_used_at = excluded.last_used_at,
			original_input = excluded.original_input,
			persona_used = excluded.persona_used,
			target_model_family = excluded.target_model_family,
			updated_at = excluded.updated_at,
			embedding_model = excluded.embedding_model,
			embedding_provider = excluded.embedding_provider;
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare save prompt statement: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindText(1, p.ID.String())
	_ = stmt.BindText(2, p.Content)
	_ = stmt.BindText(3, contentHash)
	_ = stmt.BindText(4, string(p.Phase))
	_ = stmt.BindText(5, p.Provider)
	_ = stmt.BindText(6, p.Model)
	_ = stmt.BindFloat(7, p.Temperature)
	_ = stmt.BindInt(8, p.MaxTokens)
	_ = stmt.BindInt(9, p.ActualTokens)
	_ = stmt.BindText(10, string(tagsJSON))
	if p.ParentID != nil {
		_ = stmt.BindText(11, p.ParentID.String())
	}
	_ = stmt.BindText(12, p.SessionID.String())
	_ = stmt.BindText(13, p.SourceType)
	_ = stmt.BindText(14, p.EnhancementMethod)
	_ = stmt.BindFloat(15, p.RelevanceScore)
	_ = stmt.BindInt(16, p.UsageCount)
	_ = stmt.BindInt(17, p.GenerationCount)
	if p.LastUsedAt != nil {
		_ = stmt.BindInt64(18, p.LastUsedAt.Unix())
	}
	_ = stmt.BindText(19, p.OriginalInput)
	_ = stmt.BindText(20, p.PersonaUsed)
	_ = stmt.BindText(21, p.TargetModelFamily)
	_ = stmt.BindInt64(22, p.CreatedAt.Unix())
	_ = stmt.BindInt64(23, p.UpdatedAt.Unix())
	_ = stmt.BindText(24, p.EmbeddingModel)
	_ = stmt.BindText(25, p.EmbeddingProvider)

	if !stmt.Step() {
		if err := stmt.Err(); err != nil {
			return fmt.Errorf("failed to execute save prompt statement: %w", err)
		}
	}

	return nil
}

// savePromptEmbedding saves the prompt's embedding to chromem-go
func (s *Storage) savePromptEmbedding(ctx context.Context, p *models.Prompt) error {
	// Auto-detect embedding provider and model if not configured
	if s.currentEmbeddingProvider == "" && p.EmbeddingProvider != "" {
		s.currentEmbeddingProvider = p.EmbeddingProvider
		s.logger.WithField("provider", s.currentEmbeddingProvider).Info("Auto-detected embedding provider")
	}
	if s.currentEmbeddingModel == "" && p.EmbeddingModel != "" {
		s.currentEmbeddingModel = p.EmbeddingModel
		s.logger.WithField("model", s.currentEmbeddingModel).Info("Auto-detected embedding model")
	}
	if s.currentEmbeddingDims == 0 && p.Embedding != nil {
		s.currentEmbeddingDims = len(p.Embedding)
		s.logger.WithField("dims", s.currentEmbeddingDims).Info("Auto-detected embedding dimensions")
	}

	document := chromem.Document{
		ID:        p.ID.String(),
		Embedding: p.Embedding,
		Metadata: map[string]string{
			"phase":               string(p.Phase),
			"provider":            p.Provider,
			"model":               p.Model,
			"relevance_score":     fmt.Sprintf("%.2f", p.RelevanceScore),
			"enhancement_method":  p.EnhancementMethod,
			"persona_used":        p.PersonaUsed,
			"target_model_family": p.TargetModelFamily,
			"created_at":          fmt.Sprintf("%d", p.CreatedAt.Unix()),
		},
		Content: p.Content, // For full-text search capabilities
	}

	collection := s.getOrCreateCollection()
	err := collection.AddDocument(ctx, document)
	if err != nil {
		return fmt.Errorf("failed to add document to vector collection: %w", err)
	}

	return nil
}

// getCollectionName generates a collection name based on embedding config
func (s *Storage) getCollectionName(provider, model string, dims int) string {
	// Sanitize model name (replace special chars)
	sanitizedModel := strings.ReplaceAll(model, "/", "_")
	sanitizedModel = strings.ReplaceAll(sanitizedModel, "-", "_")
	sanitizedModel = strings.ReplaceAll(sanitizedModel, ".", "_")

	collectionName := fmt.Sprintf("prompts_%s_%s_%d", provider, sanitizedModel, dims)
	s.logger.WithFields(logrus.Fields{
		"provider":       provider,
		"model":          model,
		"sanitizedModel": sanitizedModel,
		"dims":           dims,
		"collectionName": collectionName,
	}).Debug("Generated collection name")

	return collectionName
}

// getOrCreateCollection returns the collection for current embedding config
func (s *Storage) getOrCreateCollection() *chromem.Collection {
	// Use default collection name if no embedding config is set
	collectionName := "prompts"
	if s.currentEmbeddingProvider != "" && s.currentEmbeddingModel != "" && s.currentEmbeddingDims > 0 {
		collectionName = s.getCollectionName(
			s.currentEmbeddingProvider,
			s.currentEmbeddingModel,
			s.currentEmbeddingDims,
		)
	}

	s.logger.WithFields(logrus.Fields{
		"collection": collectionName,
		"provider":   s.currentEmbeddingProvider,
		"model":      s.currentEmbeddingModel,
		"dims":       s.currentEmbeddingDims,
	}).Debug("Getting or creating collection")

	collection := s.vectors.GetCollection(collectionName, nil)
	if collection == nil {
		collection, _ = s.vectors.CreateCollection(collectionName, nil, nil)
		s.logger.WithField("collection", collectionName).Info("Created new embedding collection")
	}
	return collection
}

// SearchSimilarPrompts finds prompts with similar embeddings using chromem-go
func (s *Storage) SearchSimilarPrompts(ctx context.Context, embedding []float32, limit int) ([]*models.Prompt, error) {
	collection := s.getOrCreateCollection()
	if collection == nil {
		s.logger.Warn("No vector collection available, falling back to recent prompts")
		return s.GetHighQualityHistoricalPrompts(ctx, limit)
	}

	// Check if collection has documents
	count := collection.Count()
	if count == 0 {
		s.logger.Debug("Vector collection is empty, falling back to recent prompts")
		return s.GetHighQualityHistoricalPrompts(ctx, limit)
	}

	// Ensure we don't request more results than available
	if limit > count {
		limit = count
	}

	// Search for similar vectors using chromem-go
	results, err := collection.QueryEmbedding(ctx, embedding, limit, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to query vector collection: %w", err)
	}

	// Hydrate full prompt data from SQLite using the IDs
	var prompts []*models.Prompt
	for _, result := range results {
		promptID, err := uuid.Parse(result.ID)
		if err != nil {
			s.logger.WithError(err).Warn("Invalid prompt ID in vector result")
			continue
		}

		prompt, err := s.GetPromptByID(ctx, promptID)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to retrieve prompt by ID")
			continue
		}

		prompts = append(prompts, prompt)
	}

	s.logger.WithFields(logrus.Fields{
		"embedding_dim": len(embedding),
		"results_found": len(prompts),
		"limit":         limit,
	}).Debug("Successfully performed vector similarity search")

	return prompts, nil
}

// SearchSimilarHighQualityPrompts finds prompts with similar embeddings AND high relevance scores
func (s *Storage) SearchSimilarHighQualityPrompts(ctx context.Context, embedding []float32, minScore float64, limit int) ([]*models.Prompt, error) {
	collection := s.getOrCreateCollection()
	if collection == nil {
		s.logger.Warn("No vector collection available, falling back to high quality prompts")
		return s.GetHighQualityHistoricalPrompts(ctx, limit)
	}

	// Check if collection has documents
	count := collection.Count()
	if count == 0 {
		s.logger.Debug("Vector collection is empty, falling back to high quality prompts")
		return s.GetHighQualityHistoricalPrompts(ctx, limit)
	}

	// Search for similar vectors - get more results than needed to filter by score
	searchLimit := limit * 3 // Get 3x to account for filtering
	if searchLimit > count {
		searchLimit = count
	}

	results, err := collection.QueryEmbedding(ctx, embedding, searchLimit, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to query vector collection: %w", err)
	}

	// Hydrate full prompt data and filter by relevance score
	var prompts []*models.Prompt
	for _, result := range results {
		promptID, err := uuid.Parse(result.ID)
		if err != nil {
			s.logger.WithError(err).Warn("Invalid prompt ID in vector result")
			continue
		}

		prompt, err := s.GetPromptByID(ctx, promptID)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to retrieve prompt by ID")
			continue
		}

		// Filter by minimum relevance score
		if prompt.RelevanceScore >= minScore {
			prompts = append(prompts, prompt)
			if len(prompts) >= limit {
				break
			}
		}
	}

	s.logger.WithFields(logrus.Fields{
		"embedding_dim": len(embedding),
		"results_found": len(prompts),
		"min_score":     minScore,
		"limit":         limit,
		"search_limit":  searchLimit,
	}).Debug("Successfully performed filtered vector similarity search")

	return prompts, nil
}

// GetHighQualityHistoricalPrompts returns high-quality prompts based on relevance score
func (s *Storage) GetHighQualityHistoricalPrompts(ctx context.Context, limit int) ([]*models.Prompt, error) {
	query := strings.Replace(s.baseSelectQuery(), ";", " ORDER BY relevance_score DESC, last_used_at DESC LIMIT ?;", 1)
	stmt, _, err := s.db.Prepare(query)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare high quality prompts query: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindInt(1, limit)

	return s.scanPrompts(stmt)
}

// GetPromptsWithoutEmbeddings retrieves prompts that do not have an embedding.
func (s *Storage) GetPromptsWithoutEmbeddings(ctx context.Context, limit int) ([]*models.Prompt, error) {
	// This query is designed to find prompts that are not in the vector database.
	// It assumes that if a prompt has an embedding, it will be in the chromem-go collection.
	// A more robust solution might involve a flag in the SQLite database.
	allPromptsStmt, _, err := s.db.Prepare(s.baseSelectQuery())
	if err != nil {
		return nil, fmt.Errorf("failed to prepare statement to get all prompts: %w", err)
	}
	defer func() { _ = allPromptsStmt.Close() }()

	allPrompts, err := s.scanPrompts(allPromptsStmt)
	if err != nil {
		return nil, fmt.Errorf("failed to scan all prompts: %w", err)
	}

	collection := s.getOrCreateCollection()
	var promptsWithoutEmbeddings []*models.Prompt
	for _, p := range allPrompts {
		results, err := collection.Query(ctx, "", 1, map[string]string{"id": p.ID.String()}, nil)
		if err != nil || len(results) == 0 {
			promptsWithoutEmbeddings = append(promptsWithoutEmbeddings, p)
			if len(promptsWithoutEmbeddings) >= limit {
				break
			}
		}
	}

	return promptsWithoutEmbeddings, nil
}

// SaveInteraction saves a user interaction to the database
func (s *Storage) SaveInteraction(ctx context.Context, interaction *models.UserInteraction) error {
	if interaction.ID == uuid.Nil {
		interaction.ID = uuid.New()
	}
	if interaction.Timestamp.IsZero() {
		interaction.Timestamp = time.Now()
	}

	stmt, _, err := s.db.Prepare(`
		INSERT INTO user_interactions (id, prompt_id, session_id, action, score, timestamp)
		VALUES (?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return fmt.Errorf("failed to prepare save interaction statement: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindText(1, interaction.ID.String())
	_ = stmt.BindText(2, interaction.PromptID.String())
	_ = stmt.BindText(3, interaction.SessionID.String())
	_ = stmt.BindText(4, interaction.Action)
	_ = stmt.BindFloat(5, interaction.Score)
	_ = stmt.BindInt64(6, interaction.Timestamp.Unix())

	stmt.Step()
	if err := stmt.Err(); err != nil {
		return fmt.Errorf("failed to execute save interaction statement: %w", err)
	}

	return nil
}

// GetPromptByID retrieves a single prompt by its ID
func (s *Storage) GetPromptByID(ctx context.Context, id uuid.UUID) (*models.Prompt, error) {
	query := s.baseSelectQuery() + " WHERE id = ? LIMIT 1;"
	stmt, _, err := s.db.Prepare(query)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare get prompt by id query: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindText(1, id.String())

	prompts, err := s.scanPrompts(stmt)
	if err != nil {
		return nil, err
	}
	if len(prompts) == 0 {
		return nil, fmt.Errorf("prompt with id %s not found", id)
	}
	return prompts[0], nil
}

// baseSelectQuery returns the base SELECT query for prompts
func (s *Storage) baseSelectQuery() string {
	return `
		SELECT
			id, content, phase, provider, model, temperature, max_tokens,
			actual_tokens, tags, parent_id, session_id, source_type,
			enhancement_method, relevance_score, usage_count, generation_count,
			last_used_at, original_input, persona_used, target_model_family,
			created_at, updated_at, embedding_model, embedding_provider
		FROM prompts;
	`
}

// UpdatePromptRelevanceScore updates the relevance score of a specific prompt
func (s *Storage) UpdatePromptRelevanceScore(ctx context.Context, promptID uuid.UUID, newScore float64) error {
	stmt, _, err := s.db.Prepare(`
		UPDATE prompts
		SET relevance_score = ?, updated_at = ?
		WHERE id = ?`)
	if err != nil {
		return fmt.Errorf("failed to prepare update relevance score statement: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindFloat(1, newScore)
	_ = stmt.BindInt64(2, time.Now().Unix())
	_ = stmt.BindText(3, promptID.String())

	if !stmt.Step() {
		if err := stmt.Err(); err != nil {
			return fmt.Errorf("failed to execute update relevance score statement: %w", err)
		}
	}

	s.logger.WithFields(logrus.Fields{
		"prompt_id":  promptID,
		"new_score":  newScore,
		"updated_at": time.Now(),
	}).Debug("Successfully updated prompt relevance score")

	return nil
}

// ListInteractions returns user interactions for analysis, optionally filtered by time
func (s *Storage) ListInteractions(ctx context.Context, since time.Time) ([]*models.UserInteraction, error) {
	query := `
		SELECT id, prompt_id, session_id, action, score, timestamp
		FROM user_interactions
		WHERE timestamp >= ?
		ORDER BY timestamp DESC`

	stmt, _, err := s.db.Prepare(query)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare list interactions query: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	_ = stmt.BindInt64(1, since.Unix())

	var interactions []*models.UserInteraction
	for stmt.Step() {
		interaction := &models.UserInteraction{}
		interaction.ID, _ = uuid.Parse(stmt.ColumnText(0))
		interaction.PromptID, _ = uuid.Parse(stmt.ColumnText(1))
		interaction.SessionID, _ = uuid.Parse(stmt.ColumnText(2))
		interaction.Action = stmt.ColumnText(3)
		interaction.Score = stmt.ColumnFloat(4)
		interaction.Timestamp = time.Unix(stmt.ColumnInt64(5), 0)
		interactions = append(interactions, interaction)
	}
	if err := stmt.Err(); err != nil {
		return nil, err
	}
	return interactions, nil
}

// scanPrompts scans SQLite results into Prompt structs
func (s *Storage) scanPrompts(stmt *sqlite3.Stmt) ([]*models.Prompt, error) {
	var results []*models.Prompt
	for stmt.Step() {
		p := &models.Prompt{}
		p.ID, _ = uuid.Parse(stmt.ColumnText(0))
		p.Content = stmt.ColumnText(1)
		p.Phase = models.Phase(stmt.ColumnText(2))
		p.Provider = stmt.ColumnText(3)
		p.Model = stmt.ColumnText(4)
		p.Temperature = stmt.ColumnFloat(5)
		p.MaxTokens = stmt.ColumnInt(6)
		p.ActualTokens = stmt.ColumnInt(7)

		var tagsJSON string
		if stmt.ColumnType(8) != sqlite3.NULL {
			tagsJSON = stmt.ColumnText(8)
			_ = json.Unmarshal([]byte(tagsJSON), &p.Tags)
		}

		if stmt.ColumnType(9) != sqlite3.NULL {
			parentID, _ := uuid.Parse(stmt.ColumnText(9))
			p.ParentID = &parentID
		}

		if stmt.ColumnType(10) != sqlite3.NULL {
			p.SessionID, _ = uuid.Parse(stmt.ColumnText(10))
		}

		p.SourceType = stmt.ColumnText(11)
		p.EnhancementMethod = stmt.ColumnText(12)
		p.RelevanceScore = stmt.ColumnFloat(13)
		p.UsageCount = stmt.ColumnInt(14)
		p.GenerationCount = stmt.ColumnInt(15)

		if stmt.ColumnType(16) != sqlite3.NULL {
			lastUsedUnix := stmt.ColumnInt64(16)
			lastUsedTime := time.Unix(lastUsedUnix, 0)
			p.LastUsedAt = &lastUsedTime
		}

		p.OriginalInput = stmt.ColumnText(17)
		p.PersonaUsed = stmt.ColumnText(18)
		p.TargetModelFamily = stmt.ColumnText(19)

		if stmt.ColumnType(20) != sqlite3.NULL {
			createdUnix := stmt.ColumnInt64(20)
			p.CreatedAt = time.Unix(createdUnix, 0)
		}
		if stmt.ColumnType(21) != sqlite3.NULL {
			updatedUnix := stmt.ColumnInt64(21)
			p.UpdatedAt = time.Unix(updatedUnix, 0)
		}

		p.EmbeddingModel = stmt.ColumnText(22)
		p.EmbeddingProvider = stmt.ColumnText(23)

		results = append(results, p)
	}
	if err := stmt.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

// Add missing methods to the Storage interface and implementation

// ListPrompts retrieves a paginated list of prompts
func (s *Storage) ListPrompts(ctx context.Context, limit, offset int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"limit":  limit,
		"offset": offset,
	}).Debug("Listing prompts")

	// TODO: Implement actual database query
	// For now, return empty slice
	return []models.Prompt{}, nil
}

// GetPrompt retrieves a single prompt by ID
func (s *Storage) GetPrompt(ctx context.Context, id string) (*models.Prompt, error) {
	s.logger.WithField("prompt_id", id).Debug("Getting prompt by ID")

	// TODO: Implement actual database query
	// For now, return not found error
	return nil, fmt.Errorf("prompt not found")
}

// SearchPrompts performs text-based search on prompts
func (s *Storage) SearchPrompts(ctx context.Context, query string, limit int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"query": query,
		"limit": limit,
	}).Debug("Searching prompts")

	// TODO: Implement actual text search
	return []models.Prompt{}, nil
}

// SearchPromptsWithVector performs semantic search using embeddings
func (s *Storage) SearchPromptsWithVector(ctx context.Context, embedding []float32, limit int, threshold float64) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"embedding_dims": len(embedding),
		"limit":          limit,
		"threshold":      threshold,
	}).Debug("Performing semantic search")

	// TODO: Implement vector search with chromem
	return []models.Prompt{}, nil
}

// GetPromptsByTags retrieves prompts with any of the specified tags
func (s *Storage) GetPromptsByTags(ctx context.Context, tags []string, limit int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"tags":  tags,
		"limit": limit,
	}).Debug("Getting prompts by tags")

	// TODO: Implement tag-based filtering
	return []models.Prompt{}, nil
}

// GetPromptsByPhase retrieves prompts from a specific alchemical phase
func (s *Storage) GetPromptsByPhase(ctx context.Context, phase models.Phase, limit int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"phase": phase,
		"limit": limit,
	}).Debug("Getting prompts by phase")

	// TODO: Implement phase-based filtering
	return []models.Prompt{}, nil
}

// GetPromptsByProvider retrieves prompts generated by a specific provider
func (s *Storage) GetPromptsByProvider(ctx context.Context, provider string, limit int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"provider": provider,
		"limit":    limit,
	}).Debug("Getting prompts by provider")

	// TODO: Implement provider-based filtering
	return []models.Prompt{}, nil
}

// DeletePrompt removes a prompt from storage
func (s *Storage) DeletePrompt(ctx context.Context, id string) error {
	s.logger.WithField("prompt_id", id).Debug("Deleting prompt")

	// TODO: Implement actual deletion
	return fmt.Errorf("delete not implemented")
}

// UpdatePrompt updates an existing prompt
func (s *Storage) UpdatePrompt(ctx context.Context, prompt *models.Prompt) error {
	s.logger.WithField("prompt_id", prompt.ID).Debug("Updating prompt")

	prompt.UpdatedAt = time.Now()

	// TODO: Implement actual update
	return fmt.Errorf("update not implemented")
}

// GetPromptsCount returns the total number of prompts
func (s *Storage) GetPromptsCount(ctx context.Context) (int, error) {
	// TODO: Implement actual count query
	return 0, nil
}

// GetPopularPrompts returns the most frequently accessed prompts
func (s *Storage) GetPopularPrompts(ctx context.Context, limit int) ([]models.Prompt, error) {
	s.logger.WithField("limit", limit).Debug("Getting popular prompts")

	// TODO: Implement based on usage_count or access frequency
	return []models.Prompt{}, nil
}

// GetRecentPrompts returns the most recently created prompts
func (s *Storage) GetRecentPrompts(ctx context.Context, limit int) ([]models.Prompt, error) {
	s.logger.WithField("limit", limit).Debug("Getting recent prompts")

	// TODO: Implement with ORDER BY created_at DESC
	return []models.Prompt{}, nil
}

// NewSQLiteStorage creates a new SQLite storage instance
func NewSQLiteStorage(ctx context.Context, dbPath string, logger *logrus.Logger) (*Storage, error) {
	logger.WithField("db_path", dbPath).Info("Initializing SQLite storage")

	// TODO: Implement actual SQLite initialization
	// For now, return a basic storage instance
	storage := &Storage{
		logger: logger,
	}

	return storage, nil
}
