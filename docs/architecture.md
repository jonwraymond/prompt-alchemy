---
layout: default
title: Architecture
---

# Architecture

This document describes the technical architecture of Prompt Alchemy, a sophisticated AI prompt generation and management system.

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CLI Interface │────▶│  Prompt Engine   │────▶│ Provider Registry│
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Configuration  │     │   Ranking System │     │   LLM Services  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Advanced Storage Layer (SQLite)                     │
│  • Prompt Storage        • Enhancement History                   │
│  • Vector Embeddings     • Usage Analytics                       │
│  • Relationships         • Lifecycle Management                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Interface (`internal/cmd/`)

The command-line interface built with Cobra provides comprehensive functionality:

**Commands:**
- `generate` - Multi-phase prompt generation
- `batch` - Concurrent batch processing
- `search` - Text and semantic search
- `optimize` - AI-powered prompt improvement
- `update` - Prompt modification
- `delete` - Prompt removal
- `metrics` - Performance analytics
- `validate` - Configuration validation
- `config` - Configuration management
- `providers` - Provider listing
- `migrate` - Database migrations
- `serve` - MCP server (17 tools)
- `test` - A/B testing (planned)
- `version` - Version information

### 2. Prompt Engine (`internal/engine/`)

The orchestration core for prompt generation:

```go
type Engine struct {
    registry       *providers.Registry      // Provider management
    phaseTemplates map[models.Phase]string  // Phase-specific templates
    logger         *logrus.Logger           // Structured logging
}
```

**Key Features:**
- Three-phase generation (Idea → Human → Precision)
- Parallel and sequential processing modes
- Cost calculation and token estimation
- Provider coordination through registry
- Template-based phase execution

### 3. Provider System (`internal/providers/`)

Advanced abstraction layer for LLM providers:

```go
type Provider interface {
    Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error)
    GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error)
    Name() string
    IsAvailable() bool
    SupportsEmbeddings() bool
}
```

**Provider Registry Features:**
- Dynamic provider registration
- Capability discovery
- Embedding provider fallback logic
- Health checking
- Load balancing support

**Supported Providers:**
- **OpenAI** - Full support with embeddings (text-embedding-3-small)
- **Anthropic** - Generation only, Claude models
- **Google** - Gemini models with safety controls
- **OpenRouter** - Multi-model gateway with fallbacks
- **Ollama** - Local model support

### 4. Storage Layer (`internal/storage/`)

Sophisticated SQLite-based persistence system:

#### Core Tables

**prompts** (30 fields):
```sql
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_hash TEXT UNIQUE,  -- Deduplication
    phase TEXT CHECK(phase IN ('idea', 'human', 'precision')),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    actual_tokens INTEGER,
    tags TEXT,  -- JSON array
    parent_id TEXT,  -- Derivation tracking
    source_type TEXT DEFAULT 'generated',
    enhancement_method TEXT,
    relevance_score REAL DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,
    generation_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,  -- 1536-dimensional vectors
    embedding_model TEXT,
    embedding_provider TEXT,
    original_input TEXT,
    generation_request TEXT,  -- JSON
    generation_context TEXT,  -- JSON
    persona_used TEXT,
    target_model_family TEXT,
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);
```

**enhancement_history**:
- Tracks prompt improvement iterations
- Links original and enhanced versions
- Stores improvement scores and methods

**prompt_relationships**:
- Semantic relationships between prompts
- Relationship types: derived_from, similar_to, inspired_by, merged_with
- Strength scoring (0.0-1.0)

**usage_analytics**:
- Detailed usage tracking
- Generation context capture
- Effectiveness scoring

**model_metadata**:
- Per-generation model information
- Token usage and cost tracking
- API version tracking

**metrics**:
- Conversion rates
- Engagement scores
- Performance metrics

**database_config**:
- Lifecycle management settings
- Relevance decay parameters
- Cleanup thresholds

#### Advanced Features

**23 Indexes** including:
- Composite indexes for vector search optimization
- Relationship traversal indexes
- Analytics query optimization

**4 Triggers**:
- `update_timestamp` - Automatic timestamp updates
- `update_usage_count` - Usage tracking
- `update_relevance_on_usage` - Relevance boost on use
- `update_generation_count` - Track generation usage

### 5. Ranking System (`internal/ranking/`)

In-memory multi-factor scoring:

```go
type Ranker struct {
    storage Storage
    logger  *logrus.Logger
}
```

**Scoring Factors:**
- Temperature appropriateness
- Token efficiency
- Context relevance  
- Historical performance
- Usage patterns
- Relevance scores

### 6. Advanced Features

#### LLM-as-a-Judge (`internal/judge/`)

Sophisticated evaluation system:
- Multi-criteria assessment
- Model-specific evaluation strategies
- Bias detection mechanisms
- Improvement recommendations
- Scoring normalization

#### Meta-Prompt Optimizer (`internal/optimizer/`)

Iterative improvement system:
1. Initial prompt generation
2. LLM-based evaluation
3. Targeted improvements
4. Convergence to target score
5. Enhancement tracking

#### Lifecycle Management

Automated prompt lifecycle:
- Relevance decay over time
- Usage-based relevance boosting
- Automatic cleanup of low-relevance prompts
- Configurable retention policies

## Data Flow

### Generation Flow

```
User Input
    │
    ▼
Parse Request ──────▶ Load Persona ──────▶ Select Target Model
    │                      │                        │
    ▼                      ▼                        ▼
Phase: Idea ───────▶ Provider Registry ──▶ Generate + Store
    │                      │                        │
    ▼                      ▼                        ▼
Phase: Human ──────▶ Provider Registry ──▶ Generate + Store
    │                      │                        │
    ▼                      ▼                        ▼
Phase: Precision ──▶ Provider Registry ──▶ Generate + Store
    │                      │                        │
    ▼                      ▼                        ▼
Generate Embeddings ◀─── Rank Results ◀──── Track Relationships
    │                      │                        │
    ▼                      ▼                        ▼
Store Metadata ────▶ Update Analytics ────▶ Display Output
```

### Search Flow

```
Search Query
    │
    ├── Text Search ────────▶ Content Hash Check
    │                               │
    └── Semantic Search            │
            │                       ▼
            ▼                  SQL Pattern Match
        Get Query Embedding         │
            │                       │
            ▼                       ▼
    Load Prompt Embeddings ──▶ Vector Similarity
            │                       │
            └───────────────────────┘
                        │
                        ▼
                Apply Filters (phase, provider, tags)
                        │
                        ▼
                 Rank by Relevance
                        │
                        ▼
                Return Results + Metadata
```

## Configuration System

Hierarchical configuration with Viper:

1. Built-in defaults
2. Configuration file (`$HOME/.github.com/jonwraymond/prompt-alchemy/config.yaml`)
3. Environment variables (`PROMPT_ALCHEMY_*`)
4. Command-line flags

Priority: Flags > Environment > File > Defaults

### Default Configuration

```yaml
providers:
  ollama:
    model: "gemma3:4b"
    base_url: "http://localhost:11434"
    timeout: 120

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-3-5-sonnet-20241022"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536

phases:
  idea:
    provider: "openai"
  human:
    provider: "anthropic"
  precision:
    provider: "google"
```

## Embedding System

### Standardization

All embeddings use consistent parameters:
- Model: `text-embedding-3-small`
- Dimensions: 1536
- Provider: OpenAI primary, with automatic fallback

### Storage

Binary BLOB storage in SQLite:
```go
// Efficient float32 slice serialization
func SerializeEmbedding(embedding []float32) ([]byte, error)
func DeserializeEmbedding(data []byte) ([]float32, error)
```

### Similarity Search

Optimized vector operations:
- Cosine similarity calculation
- Pre-computed magnitude caching
- Batch similarity processing
- Threshold-based filtering

## MCP Server Integration

The MCP server (`serve` command) exposes 17 tools:

**Generation Tools:**
- `generate_prompts`, `batch_generate_prompts`

**Search Tools:**
- `search_prompts`, `get_prompt_by_id`

**Management Tools:**
- `update_prompt`, `delete_prompt`, `track_prompt_relationship`

**Optimization Tools:**
- `optimize_prompt`

**Analytics Tools:**
- `get_metrics`, `get_database_stats`, `run_lifecycle_maintenance`

**System Tools:**
- `get_providers`, `test_providers`, `get_config`, `validate_config`, `get_version`

## Performance Optimizations

### Concurrent Processing
- Parallel provider requests
- Worker pool for batch operations
- Context-based cancellation

### Database Optimization
- 23 specialized indexes
- Prepared statement caching
- Transaction batching
- Connection pooling

### Memory Management
- Streaming result processing
- Embedding lazy loading
- Result pagination

## Security Considerations

### API Key Management
- Environment variable isolation
- No logging of sensitive data
- Secure configuration storage
- Provider-specific key handling

### Input Validation
- SQL injection prevention
- Prompt content sanitization
- Parameter bounds validation
- Rate limiting support

### Data Protection
- Content hashing for integrity
- Audit trail maintenance
- Secure deletion support

## Monitoring and Observability

### Structured Logging
```go
logger.WithFields(logrus.Fields{
    "provider": provider,
    "phase": phase,
    "tokens": tokens,
    "duration": duration,
    "cost": cost,
}).Info("Prompt generated")
```

### Metrics Collection
- Generation latency
- Token usage by provider
- Cost tracking
- Error rates
- Cache hit ratios

### Health Monitoring
- Provider availability
- Database performance
- Embedding generation success
- API quota tracking

## Extension Points

### Adding a Provider
1. Implement `Provider` interface
2. Add to provider registry
3. Configure provider-specific settings
4. Add embedding support (optional)
5. Update documentation

### Custom Commands
1. Create command in `internal/cmd/`
2. Register with Cobra root
3. Implement business logic
4. Add comprehensive tests
5. Update CLI documentation

### Storage Extensions
1. Implement new storage backend
2. Maintain interface compatibility
3. Handle migration logic
4. Update configuration

## Future Considerations

1. **Distributed Storage** - PostgreSQL with pgvector extension
2. **API Gateway** - REST/GraphQL interface
3. **Streaming Generation** - Server-sent events
4. **Plugin Architecture** - Dynamic provider loading
5. **Cloud Deployment** - Kubernetes operators
6. **Multi-tenancy** - User isolation
7. **Advanced Analytics** - Real-time dashboards
8. **Federated Learning** - Cross-instance optimization