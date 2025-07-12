---
layout: default
title: Database Architecture
---

# Database Architecture

Prompt Alchemy uses SQLite as its primary storage engine, providing a lightweight, reliable, and self-contained database solution that requires no external dependencies.

## Overview

The database stores all prompt data, metadata, metrics, and learning information in a single SQLite file located at `~/.prompt-alchemy/prompts.db` by default.

## Schema Design

### Core Tables

#### `prompts` - Main prompt storage
```sql
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    phase TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    persona TEXT,
    tags TEXT,
    context TEXT,
    embedding BLOB,
    embedding_model TEXT,
    embedding_dimensions INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    parent_id TEXT,
    variant_of TEXT,
    effectiveness_score REAL DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0
);
```

#### `model_metadata` - Generation metadata
```sql
CREATE TABLE model_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    generation_model TEXT NOT NULL,
    total_tokens INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    temperature REAL,
    max_tokens INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

#### `metrics` - Performance tracking
```sql
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    token_usage INTEGER,
    response_time_ms INTEGER,
    success_rate REAL,
    user_rating INTEGER,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

#### `enhancement_history` - Version control
```sql
CREATE TABLE enhancement_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    updated_content TEXT NOT NULL,
    update_reason TEXT,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

### Learning Tables

#### `learning_patterns` - Adaptive learning data
```sql
CREATE TABLE learning_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL,
    pattern_data TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_feedback` - Feedback collection
```sql
CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT,
    feedback_text TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

## Data Types and Constraints

### Text Fields
- **id**: UUID format (e.g., `abc123-def456-789`)
- **phase**: One of `prima-materia`, `solutio`, `coagulatio`
- **provider**: One of `openai`, `anthropic`, `google`, `openrouter`, `ollama`
- **persona**: One of `code`, `writing`, `analysis`, `generic`
- **tags**: Comma-separated values (e.g., `api,backend,sql`)

### Numeric Fields
- **effectiveness_score**: 0.0 to 1.0 (higher is better)
- **usage_count**: Non-negative integer
- **token_usage**: Non-negative integer
- **response_time_ms**: Non-negative integer
- **user_rating**: 1 to 5 (integer)

### Binary Fields
- **embedding**: Vector embeddings as BLOB (typically 1536 dimensions for OpenAI)

## Indexes

The database includes several indexes for optimal query performance:

```sql
-- Primary search indexes
CREATE INDEX idx_prompts_phase ON prompts(phase);
CREATE INDEX idx_prompts_provider ON prompts(provider);
CREATE INDEX idx_prompts_persona ON prompts(persona);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_effectiveness ON prompts(effectiveness_score);

-- Tag search index
CREATE INDEX idx_prompts_tags ON prompts(tags);

-- Foreign key indexes
CREATE INDEX idx_model_metadata_prompt_id ON model_metadata(prompt_id);
CREATE INDEX idx_metrics_prompt_id ON metrics(prompt_id);
CREATE INDEX idx_enhancement_history_prompt_id ON enhancement_history(prompt_id);
CREATE INDEX idx_user_feedback_prompt_id ON user_feedback(prompt_id);

-- Learning indexes
CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_confidence ON learning_patterns(confidence_score);
```

## Data Relationships

### Prompt Hierarchy
```
prompts (parent_id) → prompts (id)
prompts (variant_of) → prompts (id)
```

### Metadata Relationships
```
prompts (id) → model_metadata (prompt_id)
prompts (id) → metrics (prompt_id)
prompts (id) → enhancement_history (prompt_id)
prompts (id) → user_feedback (prompt_id)
```

## Database Operations

### Migration Management

Run database migrations to update schema:

```bash
# Preview migration without changes
prompt-alchemy migrate --dry-run

# Run migration with custom batch size
prompt-alchemy migrate --batch-size 25

# Force migration (skip safety checks)
prompt-alchemy migrate --force
```

### Backup and Restore

```bash
# Export all data
prompt-alchemy export --format sql > backup.sql

# Export specific data
prompt-alchemy export --format json --since 2024-01-01 > recent_prompts.json

# Import data
prompt-alchemy import --file backup.sql
```

### Database Maintenance

```bash
# Analyze database performance
prompt-alchemy db analyze

# Optimize database (VACUUM)
prompt-alchemy db optimize

# Check database integrity
prompt-alchemy db integrity-check

# Compact database
prompt-alchemy db compact
```

## Performance Considerations

### Query Optimization

1. **Use indexes**: Queries on `phase`, `provider`, `persona`, and `created_at` are optimized
2. **Limit results**: Use `--limit` flag to restrict result sets
3. **Filter early**: Apply filters before semantic search operations
4. **Batch operations**: Use batch commands for multiple operations

### Storage Optimization

1. **Embedding compression**: Store embeddings efficiently
2. **Regular cleanup**: Remove old or ineffective prompts
3. **Database maintenance**: Run periodic VACUUM operations
4. **Archive old data**: Move old data to separate archive tables

### Memory Usage

- **Default cache size**: 1000 prompts in memory
- **Embedding cache**: Configurable size limit
- **Connection pooling**: Single connection per process

## Security Considerations

### Data Protection

1. **File permissions**: Database file should be readable only by the user
2. **Encryption**: Consider filesystem-level encryption for sensitive data
3. **Backup security**: Encrypt backup files containing API keys
4. **Access control**: Limit database file access to authorized users

### API Key Storage

API keys are stored in the configuration file, not the database:
- **Location**: `~/.prompt-alchemy/config.yaml`
- **Permissions**: 600 (user read/write only)
- **Format**: Plain text (consider environment variables for production)

## Monitoring and Analytics

### Built-in Metrics

```bash
# View database statistics
prompt-alchemy metrics --database

# Check table sizes
prompt-alchemy db stats

# Monitor query performance
prompt-alchemy db performance
```

### Custom Queries

Connect directly to the database for custom analysis:

```bash
# Open SQLite shell
sqlite3 ~/.prompt-alchemy/prompts.db

# Example queries
SELECT phase, COUNT(*) FROM prompts GROUP BY phase;
SELECT provider, AVG(effectiveness_score) FROM prompts GROUP BY provider;
SELECT DATE(created_at), COUNT(*) FROM prompts GROUP BY DATE(created_at);
```

## Troubleshooting

### Common Issues

**Database locked errors**:
```bash
# Check for other processes
lsof ~/.prompt-alchemy/prompts.db

# Restart the application
pkill prompt-alchemy
```

**Corrupted database**:
```bash
# Check integrity
prompt-alchemy db integrity-check

# Recover from backup
cp backup.sql ~/.prompt-alchemy/prompts.db
```

**Performance issues**:
```bash
# Analyze query performance
prompt-alchemy db analyze

# Optimize database
prompt-alchemy db optimize
```

### Logs and Debugging

Database operations are logged to:
- **Location**: `~/.prompt-alchemy/logs/prompt-alchemy.log`
- **Level**: DEBUG for database operations
- **Rotation**: Automatic daily rotation

## Migration Strategy

### Version Compatibility

- **Backward compatibility**: New versions maintain compatibility with existing databases
- **Automatic migration**: Schema updates are applied automatically
- **Rollback support**: Previous versions can read newer database formats
- **Data preservation**: All existing data is preserved during migrations

### Migration Process

1. **Pre-migration backup**: Automatic backup before schema changes
2. **Validation**: Verify data integrity after migration
3. **Rollback**: Automatic rollback on migration failure
4. **Notification**: Clear feedback on migration status

## Next Steps

- Review the [Architecture]({{ site.baseurl }}/architecture) for system design details
- Explore [Vector Embeddings]({{ site.baseurl }}/vector-embeddings) for semantic search implementation
- Check [CLI Reference]({{ site.baseurl }}/cli-reference) for database management commands
- Learn about [Learning Mode]({{ site.baseurl }}/learning-mode) for adaptive features