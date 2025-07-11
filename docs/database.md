---
layout: default
title: Database Architecture
---

# Database Architecture and Implementation

This comprehensive guide covers the database architecture, implementation, and operations for Prompt Alchemy's storage system.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Vector Embeddings](#vector-embeddings)
4. [Indexing Strategy](#indexing-strategy)
5. [Lifecycle Management](#lifecycle-management)
6. [Search Operations](#search-operations)
7. [Performance Optimization](#performance-optimization)
8. [Data Migration](#data-migration)
9. [Backup and Recovery](#backup-and-recovery)
10. [Best Practices](#best-practices)

## Overview

Prompt Alchemy uses SQLite as its primary database with advanced features for vector search and semantic analysis. The database is designed to handle:

- **Prompt Storage**: Multi-phase prompt content with metadata
- **Vector Embeddings**: Semantic search capabilities using float32 arrays
- **Relationship Tracking**: Prompt derivation and enhancement chains
- **Analytics**: Usage metrics and performance data
- **Lifecycle Management**: Automated cleanup and relevance scoring

### Key Features

- **SQLite with WAL mode**: Write-Ahead Logging for better concurrency
- **Vector-optimized storage**: Binary embedding storage with similarity search
- **Comprehensive indexing**: Performance-optimized queries
- **Automated triggers**: Real-time updates for usage tracking
- **Deduplication**: Content hashing to prevent duplicates
- **Lifecycle automation**: Relevance decay and cleanup processes

## Database Schema

### Core Tables

#### 1. `prompts` Table

The main table storing all prompt data with vector embeddings:

```sql
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,                    -- UUID for unique identification
    content TEXT NOT NULL,                  -- The actual prompt content
    content_hash TEXT UNIQUE,               -- SHA256 hash for deduplication
    phase TEXT NOT NULL,                    -- Generation phase (idea, human, precision)
    provider TEXT NOT NULL,                 -- LLM provider (openai, anthropic, etc.)
    model TEXT NOT NULL,                    -- Specific model used
    temperature REAL DEFAULT 0.7,          -- Generation temperature
    max_tokens INTEGER DEFAULT 2000,       -- Maximum tokens for generation
    actual_tokens INTEGER DEFAULT 0,       -- Actual tokens used
    tags TEXT,                             -- JSON array of tags
    parent_id TEXT,                        -- Reference to parent prompt
    source_type TEXT DEFAULT 'manual',     -- How prompt was created
    enhancement_method TEXT,               -- Method used for enhancement
    relevance_score REAL DEFAULT 1.0,     -- Dynamic relevance (0.0-1.0)
    usage_count INTEGER DEFAULT 0,        -- Usage frequency
    generation_count INTEGER DEFAULT 0,   -- How many prompts this generated
    last_used_at TIMESTAMP,               -- Last access time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,                        -- Vector embedding (binary)
    embedding_model TEXT,                  -- Model used for embedding
    embedding_provider TEXT,               -- Provider for embedding
    original_input TEXT,                   -- Original user input
    generation_request TEXT,               -- JSON of generation parameters
    generation_context TEXT,               -- JSON of generation context
    persona_used TEXT,                     -- Active persona during generation
    target_model_family TEXT,              -- Target model optimization
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);
```

#### 2. `model_metadata` Table

Detailed metadata about model usage and performance:

```sql
CREATE TABLE IF NOT EXISTS model_metadata (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    generation_model TEXT NOT NULL,        -- Model used for generation
    generation_provider TEXT NOT NULL,     -- Provider for generation
    embedding_model TEXT,                  -- Model used for embedding
    embedding_provider TEXT,               -- Provider for embedding
    model_version TEXT,                    -- Model version
    api_version TEXT,                      -- API version used
    processing_time INTEGER DEFAULT 0,     -- Time in milliseconds
    input_tokens INTEGER DEFAULT 0,        -- Input token count
    output_tokens INTEGER DEFAULT 0,       -- Output token count
    total_tokens INTEGER DEFAULT 0,        -- Total token usage
    cost REAL DEFAULT 0.0,                 -- Cost in USD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);
```

#### 3. `enhancement_history` Table

Tracks how prompts are improved over time:

```sql
CREATE TABLE IF NOT EXISTS enhancement_history (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    parent_prompt_id TEXT,                 -- Original prompt before enhancement
    enhancement_type TEXT NOT NULL,       -- Type of enhancement
    enhancement_method TEXT NOT NULL,     -- Method used
    improvement_score REAL DEFAULT 0.0,   -- Quantified improvement
    metadata TEXT,                        -- JSON metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
);
```

#### 4. `prompt_relationships` Table

Semantic and usage relationships between prompts:

```sql
CREATE TABLE IF NOT EXISTS prompt_relationships (
    id TEXT PRIMARY KEY,
    source_prompt_id TEXT NOT NULL,
    target_prompt_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,      -- 'derived_from', 'similar_to', etc.
    strength REAL DEFAULT 0.0,           -- Relationship strength (0.0-1.0)
    context TEXT,                         -- Why this relationship exists
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    UNIQUE(source_prompt_id, target_prompt_id, relationship_type)
);
```

#### 5. `usage_analytics` Table

Tracks how prompts are used in generation:

```sql
CREATE TABLE IF NOT EXISTS usage_analytics (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    used_in_generation BOOLEAN DEFAULT FALSE,
    generated_prompt_id TEXT,              -- What prompt was generated
    usage_context TEXT,                   -- Context of usage
    effectiveness_score REAL DEFAULT 0.0, -- How effective was this usage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
);
```

#### 6. `metrics` Table

Performance and engagement metrics:

```sql
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
```

#### 7. `context` Table

Contextual information associated with prompts:

```sql
CREATE TABLE IF NOT EXISTS context (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    context_type TEXT NOT NULL,
    content TEXT NOT NULL,
    relevance_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);
```

#### 8. `database_config` Table

Configuration values for lifecycle management:

```sql
CREATE TABLE IF NOT EXISTS database_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Default Configuration Values

```sql
INSERT OR IGNORE INTO database_config (key, value, description) VALUES 
('max_prompts', '1000', 'Maximum number of prompts to keep in database'),
('min_relevance_score', '0.3', 'Minimum relevance score to keep prompts'),
('cleanup_interval_days', '7', 'Days between automatic cleanup runs'),
('relevance_decay_rate', '0.95', 'Daily decay rate for unused prompts'),
('max_unused_days', '30', 'Days before unused prompts are candidates for cleanup'),
('vector_similarity_threshold', '0.7', 'Default similarity threshold for vector search'),
('vector_dimensions', '1536', 'Embedding vector dimensions'),
('enable_vector_search', 'true', 'Enable optimized vector search'),
('search_optimization_level', 'high', 'Vector search optimization level');
```

## Vector Embeddings

### Storage Format

Embeddings are stored as binary BLOB data using IEEE 754 float32 format:

```go
// Convert []float32 to []byte for storage
func float32ArrayToBytes(data []float32) []byte {
    result := make([]byte, len(data)*4)
    for i, v := range data {
        binary.LittleEndian.PutUint32(result[i*4:], math.Float32bits(v))
    }
    return result
}

// Convert []byte back to []float32
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
```

### Embedding Models

Supported embedding models and their dimensions:

| Model | Provider | Dimensions | Use Case |
|-------|----------|------------|----------|
| `text-embedding-3-small` | OpenAI | 1536 | General purpose, fast (default) |
| `text-embedding-3-large` | OpenAI | 3072 | Higher quality, slower |
| `text-embedding-ada-002` | OpenAI | 1536 | Legacy, still supported |
| Custom models | Various | Variable | Specialized domains |

### Semantic Search Implementation

```go
// Cosine similarity calculation
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
```

### Search Query Optimization

```sql
-- Optimized semantic search with pre-filtering
SELECT 
    p.id, p.content, p.phase, p.provider, p.model, p.embedding,
    p.relevance_score, p.usage_count, p.created_at
FROM prompts p
WHERE p.embedding IS NOT NULL
  AND p.relevance_score >= 0.1  -- Pre-filter low-relevance prompts
  AND p.phase = ?               -- Filter by phase if specified
  AND p.provider = ?            -- Filter by provider if specified
ORDER BY p.relevance_score DESC, p.usage_count DESC
LIMIT ?;
```

## Indexing Strategy

### Primary Indexes

```sql
-- Core performance indexes
CREATE INDEX IF NOT EXISTS idx_prompts_phase ON prompts(phase);
CREATE INDEX IF NOT EXISTS idx_prompts_provider ON prompts(provider);
CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
CREATE INDEX IF NOT EXISTS idx_prompts_content_hash ON prompts(content_hash);
CREATE INDEX IF NOT EXISTS idx_prompts_source_type ON prompts(source_type);
CREATE INDEX IF NOT EXISTS idx_prompts_relevance_score ON prompts(relevance_score);
CREATE INDEX IF NOT EXISTS idx_prompts_usage_count ON prompts(usage_count);
CREATE INDEX IF NOT EXISTS idx_prompts_last_used_at ON prompts(last_used_at);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON prompts(parent_id);
```

### Composite Indexes for Vector Search

```sql
-- Optimized vector search indexes
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_relevance 
ON prompts(embedding, relevance_score) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompts_phase_embedding 
ON prompts(phase, embedding) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompts_provider_embedding 
ON prompts(provider, embedding) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompts_model_embedding 
ON prompts(model, embedding) WHERE embedding IS NOT NULL;
```

### Foreign Key Indexes

```sql
-- Relationship table indexes
CREATE INDEX IF NOT EXISTS idx_enhancement_history_prompt_id ON enhancement_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_relationships_source ON prompt_relationships(source_prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_relationships_target ON prompt_relationships(target_prompt_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_prompt_id ON usage_analytics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_model_metadata_prompt_id ON model_metadata(prompt_id);
CREATE INDEX IF NOT EXISTS idx_metrics_prompt_id ON metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_prompt_id ON context(prompt_id);
```

## Lifecycle Management

### Automated Triggers

#### 1. Timestamp Updates

```sql
-- Update timestamps automatically
CREATE TRIGGER IF NOT EXISTS update_prompts_timestamp 
AFTER UPDATE ON prompts
BEGIN
    UPDATE prompts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_metrics_timestamp 
AFTER UPDATE ON metrics
BEGIN
    UPDATE metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

#### 2. Usage Tracking

```sql
-- Update usage count when prompt is accessed
CREATE TRIGGER IF NOT EXISTS update_prompt_usage
AFTER UPDATE OF last_used_at ON prompts
BEGIN
    UPDATE prompts SET usage_count = usage_count + 1 WHERE id = NEW.id;
END;
```

#### 3. Relevance Score Updates

```sql
-- Update relevance score based on usage
CREATE TRIGGER IF NOT EXISTS update_relevance_on_usage
AFTER UPDATE OF usage_count ON prompts
BEGIN
    UPDATE prompts SET 
        relevance_score = MIN(1.0, relevance_score + 0.05)
    WHERE id = NEW.id;
END;
```

### Relevance Decay

Daily decay of unused prompts:

```go
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
    return err
}
```

### Automated Cleanup

Remove old, low-relevance prompts:

```go
func (s *Storage) CleanupOldPrompts() error {
    maxPrompts, _ := s.getConfigInt("max_prompts", 1000)
    minRelevance, _ := s.getConfigFloat("min_relevance_score", 0.3)
    maxUnusedDays, _ := s.getConfigInt("max_unused_days", 30)
    
    // Count current prompts
    var currentCount int
    err := s.db.Get(&currentCount, "SELECT COUNT(*) FROM prompts")
    if err != nil || currentCount <= maxPrompts {
        return err
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
    
    toDelete := currentCount - maxPrompts + 50
    _, err = s.db.Exec(deleteQuery, minRelevance, maxUnusedDays, toDelete)
    return err
}
```

## Search Operations

### 1. Text Search

Basic text search with filtering:

```sql
SELECT p.*, mm.generation_model, mm.total_tokens
FROM prompts p
LEFT JOIN model_metadata mm ON p.id = mm.prompt_id
WHERE p.content LIKE '%' || ? || '%'
  AND p.phase = COALESCE(?, p.phase)
  AND p.provider = COALESCE(?, p.provider)
  AND p.created_at >= COALESCE(?, p.created_at)
ORDER BY p.relevance_score DESC, p.usage_count DESC, p.created_at DESC
LIMIT ?;
```

### 2. Semantic Search

Vector similarity search with pre-filtering:

```go
func (s *Storage) SearchPromptsSemanticFast(criteria SemanticSearchCriteria) ([]models.Prompt, []float64, error) {
    // Pre-filter candidates by relevance and other criteria
    query := `
        SELECT id, content, phase, provider, model, embedding, relevance_score, usage_count, created_at
        FROM prompts
        WHERE embedding IS NOT NULL
          AND relevance_score >= 0.1  -- Pre-filter low-relevance prompts
          AND phase = COALESCE(?, phase)
          AND provider = COALESCE(?, provider)
        ORDER BY relevance_score DESC, usage_count DESC
        LIMIT ?
    `
    
    // Execute query and calculate similarities in application
    rows, err := s.db.Query(query, criteria.Phase, criteria.Provider, maxCandidates)
    if err != nil {
        return nil, nil, err
    }
    defer rows.Close()
    
    var candidates []candidatePrompt
    for rows.Next() {
        // Scan row data
        // Calculate cosine similarity
        similarity := cosineSimilarity(criteria.QueryEmbedding, promptEmbedding)
        if similarity >= criteria.MinSimilarity {
            candidates = append(candidates, candidatePrompt{
                prompt:     prompt,
                similarity: similarity,
            })
        }
    }
    
    // Sort by similarity and return top results
    sort.Slice(candidates, func(i, j int) bool {
        return candidates[i].similarity > candidates[j].similarity
    })
    
    return extractTopResults(candidates, criteria.Limit)
}
```

### 3. Hybrid Search

Combine text and semantic search results:

```go
func (s *Storage) SearchPromptsHybrid(textQuery string, embedding []float32, limit int) ([]models.Prompt, error) {
    // Get text search results
    textResults, err := s.SearchPromptsText(textQuery, limit*2)
    if err != nil {
        return nil, err
    }
    
    // Get semantic search results
    semanticResults, similarities, err := s.SearchPromptsSemanticFast(SemanticSearchCriteria{
        QueryEmbedding: embedding,
        Limit:          limit*2,
        MinSimilarity:  0.5,
    })
    if err != nil {
        return nil, err
    }
    
    // Combine and rank results
    return combineSearchResults(textResults, semanticResults, similarities, limit)
}
```

## Performance Optimization

### SQLite Configuration

```sql
-- WAL mode for better concurrency
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB memory map
PRAGMA threads = 4;
```

### Query Optimization

#### 1. Use Prepared Statements

```go
// Prepare frequently used queries
stmt, err := s.db.Prepare(`
    SELECT id, content, embedding FROM prompts 
    WHERE phase = ? AND provider = ? AND embedding IS NOT NULL
    ORDER BY relevance_score DESC LIMIT ?
`)
if err != nil {
    return err
}
defer stmt.Close()

// Execute with parameters
rows, err := stmt.Query(phase, provider, limit)
```

#### 2. Batch Operations

```go
// Batch insert for better performance
tx, err := s.db.Begin()
if err != nil {
    return err
}
defer tx.Rollback()

stmt, err := tx.Prepare(`INSERT INTO prompts (id, content, phase, provider, embedding) VALUES (?, ?, ?, ?, ?)`)
if err != nil {
    return err
}
defer stmt.Close()

for _, prompt := range prompts {
    _, err = stmt.Exec(prompt.ID, prompt.Content, prompt.Phase, prompt.Provider, prompt.Embedding)
    if err != nil {
        return err
    }
}

return tx.Commit()
```

### Memory Management

```go
// Efficient embedding processing
func (s *Storage) ProcessEmbeddingsBatch(prompts []models.Prompt, batchSize int) error {
    for i := 0; i < len(prompts); i += batchSize {
        end := i + batchSize
        if end > len(prompts) {
            end = len(prompts)
        }
        
        batch := prompts[i:end]
        if err := s.processBatch(batch); err != nil {
            return err
        }
        
        // Force garbage collection for large batches
        if batchSize > 1000 {
            runtime.GC()
        }
    }
    return nil
}
```

## Data Migration

### Embedding Migration

Migrate embeddings to new model or dimensions:

```go
func (s *Storage) MigrateLegacyEmbeddings(standardModel string, standardDimensions int, batchSize int) error {
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
        return err
    }
    defer rows.Close()
    
    var migrationCandidates []MigrationCandidate
    for rows.Next() {
        var candidate MigrationCandidate
        if err := rows.Scan(&candidate.ID, &candidate.Embedding, &candidate.EmbeddingModel, &candidate.Dimensions); err != nil {
            continue
        }
        migrationCandidates = append(migrationCandidates, candidate)
    }
    
    // Process in batches
    for i, candidate := range migrationCandidates {
        if i > 0 && i%batchSize == 0 {
            s.logger.WithField("processed", i).Info("Migration batch processed")
        }
        
        // Clear old embedding for re-processing
        _, err := s.db.Exec(`
            UPDATE prompts 
            SET embedding = NULL, embedding_model = NULL, embedding_provider = NULL, updated_at = ?
            WHERE id = ?
        `, time.Now(), candidate.ID)
        
        if err != nil {
            s.logger.WithError(err).WithField("prompt_id", candidate.ID).Error("Failed to clear legacy embedding")
            continue
        }
    }
    
    return nil
}
```

### Schema Updates

```sql
-- Add new columns safely
ALTER TABLE prompts ADD COLUMN new_field TEXT DEFAULT '';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_prompts_new_field ON prompts(new_field);

-- Update existing data
UPDATE prompts SET new_field = 'default_value' WHERE new_field = '';
```

## Backup and Recovery

### Database Backup

```bash
# Create backup with WAL checkpoint
sqlite3 prompts.db "PRAGMA wal_checkpoint(FULL);"
cp prompts.db prompts_backup_$(date +%Y%m%d_%H%M%S).db

# Compressed backup
sqlite3 prompts.db ".backup" | gzip > prompts_backup_$(date +%Y%m%d_%H%M%S).db.gz
```

### Recovery Operations

```go
func (s *Storage) RecoverFromBackup(backupPath string) error {
    // Verify backup integrity
    backupDB, err := sql.Open("sqlite3", backupPath)
    if err != nil {
        return fmt.Errorf("failed to open backup: %w", err)
    }
    defer backupDB.Close()
    
    // Check schema compatibility
    var count int
    err = backupDB.QueryRow("SELECT COUNT(*) FROM prompts").Scan(&count)
    if err != nil {
        return fmt.Errorf("backup validation failed: %w", err)
    }
    
    s.logger.WithField("prompt_count", count).Info("Backup validated successfully")
    
    // Close current database
    s.db.Close()
    
    // Replace current database with backup
    if err := os.Rename(backupPath, s.dbPath); err != nil {
        return fmt.Errorf("failed to restore backup: %w", err)
    }
    
    // Reconnect to restored database
    return s.reconnect()
}
```

## Best Practices

### 1. Connection Management

```go
// Use connection pooling
db.SetMaxOpenConns(10)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(time.Hour)

// Always use contexts for timeouts
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

rows, err := db.QueryContext(ctx, query, args...)
```

### 2. Transaction Management

```go
// Use transactions for related operations
tx, err := db.Begin()
if err != nil {
    return err
}
defer func() {
    if err != nil {
        tx.Rollback()
    } else {
        tx.Commit()
    }
}()

// Perform multiple related operations
_, err = tx.Exec("INSERT INTO prompts ...")
if err != nil {
    return err
}

_, err = tx.Exec("INSERT INTO model_metadata ...")
if err != nil {
    return err
}
```

### 3. Error Handling

```go
// Distinguish between different error types
func (s *Storage) GetPrompt(id uuid.UUID) (*models.Prompt, error) {
    var prompt models.Prompt
    err := s.db.Get(&prompt, "SELECT * FROM prompts WHERE id = ?", id.String())
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrPromptNotFound
        }
        return nil, fmt.Errorf("failed to get prompt: %w", err)
    }
    return &prompt, nil
}
```

### 4. Resource Cleanup

```go
// Always close resources
func (s *Storage) SearchWithPagination(query string, offset, limit int) ([]models.Prompt, error) {
    rows, err := s.db.Query("SELECT * FROM prompts WHERE content LIKE ? LIMIT ? OFFSET ?", 
        "%"+query+"%", limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()  // Always close rows
    
    var prompts []models.Prompt
    for rows.Next() {
        var prompt models.Prompt
        if err := rows.Scan(&prompt.ID, &prompt.Content); err != nil {
            return nil, err
        }
        prompts = append(prompts, prompt)
    }
    
    return prompts, rows.Err()  // Check for iteration errors
}
```

### 5. Performance Monitoring

```go
// Monitor query performance
func (s *Storage) executeWithTiming(query string, args ...interface{}) (time.Duration, error) {
    start := time.Now()
    _, err := s.db.Exec(query, args...)
    duration := time.Since(start)
    
    s.logger.WithFields(logrus.Fields{
        "query":    query,
        "duration": duration,
        "error":    err,
    }).Debug("Query executed")
    
    return duration, err
}
```

### 6. Data Validation

```go
// Validate data before insertion
func (s *Storage) SavePrompt(prompt *models.Prompt) error {
    // Validate required fields
    if prompt.Content == "" {
        return ErrEmptyContent
    }
    if prompt.Phase == "" {
        return ErrMissingPhase
    }
    
    // Validate embedding dimensions
    if prompt.Embedding != nil && len(prompt.Embedding) != 1536 {
        return ErrInvalidEmbeddingDimensions
    }
    
    // Validate relevance score
    if prompt.RelevanceScore < 0.0 || prompt.RelevanceScore > 1.0 {
        return ErrInvalidRelevanceScore
    }
    
    return s.savePrompt(prompt)
}
```

This comprehensive database architecture provides a robust foundation for Prompt Alchemy's storage needs, with advanced features for vector search, lifecycle management, and performance optimization.