---
layout: default
title: Architecture
---

# Architecture

This document describes the technical architecture of Prompt Alchemy.

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CLI Interface │────▶│  Prompt Engine   │────▶│    Providers    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Configuration  │     │   Ranking System │     │   LLM Services  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         
         ▼                       ▼                         
┌─────────────────────────────────────────────────────────────────┐
│                         Storage Layer (SQLite)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Interface (`internal/cmd/`)

The command-line interface built with Cobra provides:

- Command parsing and validation
- Flag management
- Output formatting
- User interaction

Key files:
- `root.go` - Base command setup
- `generate.go` - Prompt generation command
- `search.go` - Search functionality
- `metrics.go` - Analytics commands

### 2. Prompt Engine (`internal/engine/`)

The heart of the system that orchestrates prompt generation:

```go
type Engine struct {
    providers map[string]Provider
    storage   Storage
    ranker    *Ranker
}
```

Responsibilities:
- Phase management (idea → human → precision)
- Provider coordination
- Parallel processing
- Result aggregation

### 3. Provider System (`internal/providers/`)

Abstraction layer for LLM providers:

```go
type Provider interface {
    Generate(context.Context, GenerateRequest) (*GenerateResponse, error)
    GetEmbedding(context.Context, string) ([]float32, error)
    Name() string
    IsAvailable() bool
    SupportsEmbeddings() bool
}
```

Supported providers:
- **OpenAI** - Full support including embeddings
- **Anthropic** - Generation only
- **Google** - Gemini models
- **OpenRouter** - Multi-model gateway
- **Ollama** - Local models

### 4. Storage Layer (`internal/storage/`)

SQLite-based persistence with:

- Prompt storage with metadata
- Vector embeddings (BLOB storage)
- Metrics and analytics
- Lifecycle management

Database schema highlights:
```sql
-- Main prompts table
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    phase TEXT,
    provider TEXT,
    embedding BLOB,
    created_at TIMESTAMP,
    -- ... more fields
);

-- Ranking data
CREATE TABLE prompt_rankings (
    prompt_id TEXT,
    score REAL,
    temperature_score REAL,
    token_score REAL,
    context_score REAL
);
```

### 5. Ranking System (`internal/ranking/`)

Multi-factor scoring system:

```go
type Ranker struct {
    weights RankingWeights
}

type RankingWeights struct {
    Temperature float64
    TokenUsage  float64
    Context     float64
    Recency     float64
}
```

Factors considered:
- Temperature appropriateness
- Token efficiency
- Context relevance
- Historical performance

### 6. Advanced Features

#### LLM-as-a-Judge (`internal/judge/`)

Automated quality evaluation:
- Objective scoring (1-10 scale)
- Multi-criteria assessment
- Bias detection
- Improvement suggestions

#### Meta-Prompt Optimizer (`internal/optimizer/`)

Iterative improvement system:
1. Generate initial prompt
2. Evaluate with LLM judge
3. Generate improved version
4. Repeat until target score reached

## Data Flow

### Generation Flow

```
User Input
    │
    ▼
Parse Request ──────▶ Load Persona
    │                      │
    ▼                      ▼
Phase: Idea ───────▶ Select Provider ──▶ Generate
    │                                         │
    ▼                                         ▼
Phase: Human ──────▶ Select Provider ──▶ Generate
    │                                         │
    ▼                                         ▼
Phase: Precision ──▶ Select Provider ──▶ Generate
    │                                         │
    ▼                                         ▼
Store Results ◀──────── Rank Results ◀────────┘
    │
    ▼
Display Output
```

### Search Flow

```
Search Query
    │
    ├── Text Search ────▶ SQL LIKE Query
    │                            │
    └── Semantic Search         │
            │                    │
            ▼                    ▼
        Get Embedding ──▶ Vector Similarity
            │                    │
            └────────────────────┘
                       │
                       ▼
                 Rank Results
                       │
                       ▼
                Return Matches
```

## Configuration System

Hierarchical configuration with Viper:

1. Default values
2. Configuration file (`~/.prompt-alchemy/config.yaml`)
3. Environment variables
4. Command-line flags

Priority: Flags > Env > File > Defaults

## Embedding System

### Standardization

All embeddings use:
- Model: `text-embedding-3-small`
- Dimensions: 1536
- Provider: OpenAI (fallback for others)

### Storage

Embeddings stored as BLOB in SQLite:
```go
// float32 slice → bytes
func float32SliceToBytes(floats []float32) []byte
```

### Similarity Search

Cosine similarity calculation:
```go
func CosineSimilarity(a, b []float32) float32
```

## Extension Points

### Adding a Provider

1. Implement `Provider` interface
2. Register in provider factory
3. Add configuration support
4. Update documentation

Example:
```go
type CustomProvider struct {
    client *CustomClient
    config Config
}

func (p *CustomProvider) Generate(...) (*GenerateResponse, error) {
    // Implementation
}
```

### Custom Personas

Add to `pkg/models/persona.go`:
```go
var CustomPersona = &Persona{
    Name:        "custom",
    Description: "Custom persona description",
    Temperature: 0.7,
    // ... other fields
}
```

### New Commands

1. Create command file in `internal/cmd/`
2. Register with root command
3. Implement business logic
4. Add tests

## Performance Considerations

### Optimization Strategies

1. **Parallel Generation** - Multiple providers simultaneously
2. **Connection Pooling** - Reuse HTTP clients
3. **Batch Operations** - Group database operations
4. **Caching** - Provider responses (when appropriate)

### Database Optimization

- Indexes on frequently queried fields
- VACUUM periodically
- Prepared statements
- Transaction batching

## Security

### API Key Management

- Never logged or displayed
- Environment variable support
- Secure storage in config
- Per-provider isolation

### Input Validation

- Prompt content sanitization
- Parameter bounds checking
- SQL injection prevention
- Rate limiting

## Monitoring and Debugging

### Logging

Structured logging with Logrus:
```go
log.WithFields(log.Fields{
    "provider": provider.Name(),
    "phase":    phase,
    "tokens":   result.TokensUsed,
}).Info("Generated prompt")
```

### Metrics Collection

Automatic tracking of:
- Generation times
- Token usage
- Provider errors
- Cost estimation

## Future Architecture Considerations

1. **Distributed Storage** - PostgreSQL with pgvector
2. **API Server** - REST/GraphQL interface
3. **Streaming** - Real-time generation
4. **Plugins** - Dynamic provider loading
5. **Cloud Native** - Kubernetes deployment