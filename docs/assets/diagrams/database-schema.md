# Database Schema

```mermaid
erDiagram
    PROMPTS ||--|{ PROMPT_CONTEXT : "has"
    PROMPTS ||--|{ PROMPT_METRICS : "tracks"
    PROMPTS ||--|{ USAGE_ANALYTICS : "monitors"
    PROMPTS ||--o{ LEARNING_FEEDBACK : "receives"
    
    PROMPTS {
        string id PK "UUID primary key"
        text content "Generated prompt text"
        string content_hash "SHA256 hash of content"
        string phase "Alchemical phase"
        string provider "LLM provider used"
        string model "Specific model name"
        string persona_used "Persona used for generation"
        float temperature "Generation temperature"
        int max_tokens "Token limit"
        int actual_tokens "Actual tokens used"
        string tags "Comma-separated tags"
        string parent_id FK "Link to parent prompt"
        string session_id "Session identifier"
        float relevance_score "Dynamic relevance score"
        int usage_count "How many times it was used"
        int generation_count "How many prompts it generated"
        datetime last_used_at "Last access timestamp"
        datetime created_at "Creation timestamp"
        datetime updated_at "Last modification"
        blob embedding "Vector embedding data"
        string embedding_model "Model used for embedding"
        string embedding_provider "Provider for embedding"
        text original_input "Original user input"
        text generation_request "Serialized generation request"
        text generation_context "Serialized context"
    }

    PROMPT_CONTEXT {
        string id PK "Context entry ID"
        string prompt_id FK "Links to prompts.id"
        string context_type "Type of context (e.g., file, url)"
        text content "The actual context content"
        float relevance_score "Relevance of this context"
        datetime created_at "Timestamp"
    }

    PROMPT_METRICS {
        string id PK "Metric entry ID"
        string prompt_id FK "Links to prompts.id"
        float conversion_rate "Effectiveness metric"
        float engagement_score "User engagement metric"
        int token_usage "Token consumption"
        int response_time "Response time in ms"
        int usage_count "Total usage count"
        datetime created_at "Timestamp"
        datetime updated_at "Last update"
    }

    USAGE_ANALYTICS {
        string id PK "Analytics entry ID"
        string prompt_id FK "Links to prompts.id"
        bool used_in_generation "If it was used to generate another prompt"
        string generated_prompt_id FK "The resulting prompt"
        string usage_context "Context of the usage"
        float effectiveness_score "User-provided score"
        datetime created_at "Timestamp"
    }
    
    LEARNING_FEEDBACK {
        string id PK "Feedback entry ID"
        string prompt_id FK "Links to prompts.id"
        string session_id "Session identifier"
        int rating "1-5 star rating"
        bool was_helpful "If the prompt was helpful"
        bool met_expectations "If the prompt met expectations"
        text suggested_improvement "User suggestion"
        json context "Additional context"
        datetime created_at "Timestamp"
    }
```

## Key Relationships

- A **PROMPT** can have multiple **CONTEXT** entries, **METRICS** records, and **ANALYTICS** events.
- **USAGE_ANALYTICS** tracks how a prompt is used, potentially linking to a `generated_prompt_id`.
- **LEARNING_FEEDBACK** provides direct user feedback on a prompt's quality.

## Indexing Strategy
```sql
-- Core indexes for performance
CREATE INDEX idx_prompts_phase ON prompts(phase);
CREATE INDEX idx_prompts_provider ON prompts(provider);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_relevance_score ON prompts(relevance_score);
CREATE INDEX idx_prompts_last_used_at ON prompts(last_used_at);

-- Foreign key indexes
CREATE INDEX idx_prompt_context_prompt_id ON prompt_context(prompt_id);
CREATE INDEX idx_prompt_metrics_prompt_id ON prompt_metrics(prompt_id);
CREATE INDEX idx_usage_analytics_prompt_id ON usage_analytics(prompt_id);
CREATE INDEX idx_learning_feedback_prompt_id ON learning_feedback(prompt_id);
```

## Data Types & Constraints

### Enumerations
- **Phase**: `'prima-materia', 'solutio', 'coagulatio'`
- **Provider**: `'openai', 'anthropic', 'google', 'openrouter', 'ollama'`
- **Status**: `'pending', 'running', 'completed', 'failed'`
- **Metric Type**: `'cost', 'time', 'tokens', 'quality'`

### Constraints
- All UUIDs are generated using UUID v4
- Scores are constrained between 0.0 and 1.0
- Temperatures are constrained between 0.0 and 2.0
- Token counts must be positive integers
- Timestamps use UTC timezone

### Storage Optimizations
- Embeddings stored as compressed BLOBs
- Large text content uses TEXT type
- JSON metadata enables flexible schema evolution
- Partitioning by date for large datasets