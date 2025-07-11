---
layout: default
title: Vector Embeddings & Semantic Search
---

# Vector Embeddings & Semantic Search

Prompt Alchemy implements a sophisticated vector embedding system using SQLite for high-performance semantic search and prompt similarity matching.

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Embedding Models](#embedding-models)
4. [Semantic Search](#semantic-search)
5. [Performance Optimization](#performance-optimization)
6. [Configuration](#configuration)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Migration & Maintenance](#migration--maintenance)

## Overview

The vector embedding system provides:

- **Semantic Search**: Find similar prompts based on meaning, not just keywords
- **Binary Storage**: Efficient IEEE 754 float32 format in SQLite BLOB columns
- **Cosine Similarity**: Mathematical similarity calculation between vectors
- **Multi-Model Support**: Support for different embedding models with standardization
- **Performance Optimization**: Indexed queries, pre-filtering, and memory optimization

### Key Features

- 🔍 **Semantic Search**: Find prompts by meaning, not just text matches
- 📊 **Cosine Similarity**: Mathematically precise similarity scoring
- 🗄️ **SQLite Integration**: No external vector database required
- ⚡ **Performance Optimized**: Pre-filtering, indexing, and batch processing
- 🔄 **Model Migration**: Automatic migration between embedding models
- 📈 **Analytics**: Vector coverage and similarity statistics

## Storage Architecture

### Database Schema

The vector system uses the main `prompts` table with dedicated embedding columns:

```sql
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    -- ... other columns ...
    embedding BLOB,                    -- Vector data as binary
    embedding_model TEXT,              -- Model used (e.g., "text-embedding-3-small")
    embedding_provider TEXT,           -- Provider (e.g., "openai")
    -- ... other columns ...
);
```

### Binary Storage Format

Embeddings are stored as binary data using IEEE 754 float32 format:

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

### Indexing Strategy

Optimized indexes for vector operations:

```sql
-- Vector-specific indexes
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_model ON prompts(embedding_model);
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_provider ON prompts(embedding_provider);

-- Composite indexes for optimized vector search
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_relevance 
    ON prompts(embedding, relevance_score) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_phase_embedding 
    ON prompts(phase, embedding) WHERE embedding IS NOT NULL;
```

## Embedding Models

### Supported Models

| Model | Provider | Dimensions | Use Case |
|-------|----------|------------|----------|
| `text-embedding-3-small` | OpenAI | 1536 | General purpose, fast (default) |
| `text-embedding-3-large` | OpenAI | 3072 | Higher quality, slower |
| `text-embedding-ada-002` | OpenAI | 1536 | Legacy, still supported |
| Custom models | Various | Variable | Specialized domains |

### Model Standardization

The system uses `text-embedding-3-small` as the standard model to ensure dimensional compatibility:

```yaml
# Configuration
embeddings:
  standard_model: "text-embedding-3-small"
  standard_dimensions: 1536
  auto_migrate_legacy: true
  similarity_threshold: 0.3
```

### Embedding Generation

Embeddings are generated automatically when prompts are saved:

```go
// SavePrompt with embedding
func (s *Storage) SavePrompt(prompt *models.Prompt) error {
    // Convert embedding to bytes for storage
    var embeddingBytes []byte
    if prompt.Embedding != nil {
        embeddingBytes = float32ArrayToBytes(prompt.Embedding)
    }
    
    // Insert with embedding data
    _, err = tx.NamedExec(`
        INSERT INTO prompts (
            id, content, embedding, embedding_model, embedding_provider, ...
        ) VALUES (
            :id, :content, :embedding, :embedding_model, :embedding_provider, ...
        )
    `, map[string]interface{}{
        "embedding":          embeddingBytes,
        "embedding_model":    prompt.EmbeddingModel,
        "embedding_provider": prompt.EmbeddingProvider,
        // ... other fields
    })
    
    return err
}
```

## Semantic Search

### Search Implementation

The semantic search system uses cosine similarity for mathematical precision:

```go
// SearchPromptsSemanticFast performs optimized semantic search
func (s *Storage) SearchPromptsSemanticFast(criteria SemanticSearchCriteria) ([]models.Prompt, []float64, error) {
    // Optimized query with pre-filtering
    query := `
        SELECT p.id, p.content, p.embedding, p.relevance_score, ...
        FROM prompts p
        WHERE p.embedding IS NOT NULL
          AND p.relevance_score >= 0.1  -- Pre-filter low-relevance prompts
    `
    
    // Add filters for phase, provider, model, tags, date
    if criteria.Phase != "" {
        query += " AND p.phase = ?"
        args = append(args, criteria.Phase)
    }
    
    // Order by relevance for better candidates first
    query += ` ORDER BY p.relevance_score DESC, p.usage_count DESC`
    
    // Limit initial fetch for performance
    maxCandidates := criteria.Limit * 10
    query += fmt.Sprintf(" LIMIT %d", maxCandidates)
    
    // Execute query and calculate similarities
    for rows.Next() {
        promptEmbedding := bytesToFloat32Array(dbPrompt.Embedding)
        similarity := cosineSimilarity(criteria.QueryEmbedding, promptEmbedding)
        
        if similarity >= criteria.MinSimilarity {
            // Add to results
        }
    }
}
```

### Cosine Similarity Calculation

Mathematical implementation for precise similarity scoring:

```go
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

### Search Criteria

Complete search criteria support:

```go
type SemanticSearchCriteria struct {
    Query          string     // Text query
    QueryEmbedding []float32  // Pre-computed embedding
    Limit          int        // Max results
    MinSimilarity  float64    // Minimum similarity threshold
    Phase          string     // Filter by phase
    Provider       string     // Filter by provider
    Model          string     // Filter by model
    Tags           []string   // Filter by tags
    Since          *time.Time // Filter by date
}
```

## Performance Optimization

### SQLite Optimizations

The system applies several SQLite optimizations for vector operations:

```go
func (s *Storage) setupVectorOptimizations() error {
    optimizations := []string{
        "PRAGMA mmap_size = 268435456",  // 256MB memory map
        "PRAGMA temp_store = memory",    // Store temp tables in memory
        "PRAGMA threads = 4",            // Use multiple threads
        "PRAGMA optimize",               // Enable query optimizer
        "PRAGMA analysis_limit = 1000",  // Optimize statistics
    }
    
    for _, pragma := range optimizations {
        if _, err := s.db.Exec(pragma); err != nil {
            s.logger.WithError(err).Warn("Failed to set pragma")
        }
    }
    
    return nil
}
```

### Pre-filtering Strategy

The search system uses pre-filtering to reduce the candidate set:

1. **Relevance Filtering**: Only consider prompts with `relevance_score >= 0.1`
2. **Index Usage**: Leverage composite indexes for fast filtering
3. **Batch Processing**: Limit initial fetch to `limit * 10` candidates
4. **Early Termination**: Stop when enough high-quality matches are found

### Memory Management

- **Binary Storage**: Efficient 4-byte per dimension storage
- **Lazy Loading**: Embeddings loaded only when needed
- **Batch Operations**: Process embeddings in configurable batches
- **Connection Pooling**: Reuse database connections

## Configuration

### YAML Configuration

```yaml
# Vector embeddings configuration
embeddings:
  # Standard embedding model for all prompts
  standard_model: "text-embedding-3-small"
  standard_dimensions: 1536
  
  # Provider preference order
  provider_priority:
    - "openai"
    - "claude"     # Will use OpenAI for embeddings
    - "gemini"     # Will use OpenAI for embeddings
  
  # Migration settings
  auto_migrate_legacy: true
  migration_batch_size: 10
  
  # Performance settings
  cache_embeddings: true
  similarity_threshold: 0.3

# Database configuration
database_config:
  vector_similarity_threshold: 0.7
  vector_dimensions: 1536
  enable_vector_search: true
  search_optimization_level: high
```

### Environment Variables

```bash
# Vector search configuration
PROMPT_ALCHEMY_EMBEDDINGS_STANDARD_MODEL=text-embedding-3-small
PROMPT_ALCHEMY_EMBEDDINGS_STANDARD_DIMENSIONS=1536
PROMPT_ALCHEMY_EMBEDDINGS_SIMILARITY_THRESHOLD=0.3

# Database vector settings
PROMPT_ALCHEMY_DATABASE_VECTOR_SIMILARITY_THRESHOLD=0.7
PROMPT_ALCHEMY_DATABASE_ENABLE_VECTOR_SEARCH=true
```

## API Reference

### Search Commands

```bash
# Basic semantic search
prompt-alchemy search --semantic "user authentication"

# Semantic search with filters
prompt-alchemy search --semantic --phase human --provider claude "natural language processing"

# Semantic search with custom threshold
prompt-alchemy search --semantic --similarity 0.8 "API design patterns"

# Combined text and semantic search
prompt-alchemy search --semantic --tags "backend,api" "REST endpoints"
```

### Programmatic API

```go
// Create search criteria
criteria := SemanticSearchCriteria{
    Query:         "user authentication",
    Limit:         10,
    MinSimilarity: 0.7,
    Phase:         "human",
    Provider:      "claude",
}

// Perform search
prompts, similarities, err := storage.SearchPromptsSemanticFast(criteria)
if err != nil {
    return err
}

// Process results
for i, prompt := range prompts {
    fmt.Printf("Prompt: %s (Similarity: %.3f)\n", prompt.Content, similarities[i])
}
```

### Vector Statistics

```go
// Get vector statistics
stats, err := storage.GetVectorStats()
if err != nil {
    return err
}

fmt.Printf("Vector Coverage: %.2f%%\n", stats["vector_coverage"].(float64)*100)
fmt.Printf("Total Vectors: %d\n", stats["vector_count"].(int))
fmt.Printf("Average Relevance: %.3f\n", stats["avg_relevance_score"].(float64))
```

## Best Practices

### Embedding Generation

1. **Consistent Model**: Use the same embedding model for all prompts
2. **Batch Processing**: Generate embeddings in batches for efficiency
3. **Error Handling**: Implement retry logic for embedding API calls
4. **Content Preparation**: Clean and normalize text before embedding

### Search Optimization

1. **Appropriate Thresholds**: Use similarity thresholds between 0.3-0.8
2. **Combined Filters**: Combine semantic search with metadata filters
3. **Result Limits**: Use reasonable limits (10-50) for interactive use
4. **Caching**: Cache frequently used embeddings

### Performance Tuning

1. **Database Optimization**: Ensure SQLite optimizations are applied
2. **Index Usage**: Monitor index usage with `EXPLAIN QUERY PLAN`
3. **Memory Management**: Configure appropriate memory limits
4. **Connection Pooling**: Use connection pooling for concurrent access

### Model Management

1. **Standardization**: Stick to standard embedding models
2. **Migration Planning**: Plan migrations during low-usage periods
3. **Fallback Strategy**: Have fallback providers for embeddings
4. **Monitoring**: Monitor embedding generation costs and latency

## Migration & Maintenance

### Legacy Embedding Migration

The system can automatically migrate prompts with non-standard embeddings:

```go
// Migrate legacy embeddings to standard model
err := storage.MigrateLegacyEmbeddings(
    "text-embedding-3-small",  // Target model
    1536,                       // Target dimensions
    10,                         // Batch size
)
```

### Embedding Validation

```go
// Validate embedding against standard
isValid := storage.ValidateEmbeddingStandard(
    embedding,
    "text-embedding-3-small",
    "text-embedding-3-small",
    1536,
)
```

### Statistics and Monitoring

```go
// Get embedding statistics
stats, err := storage.GetEmbeddingStats()
if err != nil {
    return err
}

// Check model distribution
modelStats := stats["models"].([]modelStats)
for _, model := range modelStats {
    fmt.Printf("Model: %s, Dimensions: %d, Count: %d\n", 
        model.Model, model.Dimensions, model.Count)
}
```

### Maintenance Tasks

1. **Regular Cleanup**: Remove embeddings for deleted prompts
2. **Relevance Updates**: Update relevance scores affecting search
3. **Index Maintenance**: Rebuild indexes periodically
4. **Statistics Updates**: Update SQLite statistics with `PRAGMA analyze`

### Troubleshooting

Common issues and solutions:

1. **Dimension Mismatches**: Use migration tools to standardize
2. **Poor Search Results**: Adjust similarity thresholds
3. **Performance Issues**: Check index usage and SQLite settings
4. **Memory Issues**: Reduce batch sizes and enable connection pooling

### Future Enhancements

Planned improvements:

1. **Hybrid Search**: Combine full-text and vector search
2. **Advanced Filtering**: More sophisticated pre-filtering
3. **Compression**: Vector compression for storage efficiency
4. **Distributed Search**: Support for distributed vector search

The vector embedding system provides a powerful foundation for semantic search while maintaining the simplicity and reliability of SQLite storage.