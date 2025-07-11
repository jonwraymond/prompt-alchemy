# Database Schema

```mermaid
erDiagram
    PROMPTS ||--o{ METRICS : tracks
    PROMPTS ||--o{ EMBEDDINGS : has
    PROMPTS }o--|| PROMPT_REQUESTS : generated_from
    PROMPTS }o--o{ TAGS : tagged_with
    PROMPT_REQUESTS ||--o{ REQUEST_PHASES : contains
    
    PROMPTS {
        string id PK "UUID primary key"
        text content "Generated prompt text"
        string phase "Alchemical phase (prima-materia, solutio, coagulatio)"
        string provider "LLM provider used"
        string model "Specific model name"
        string persona "Generation persona"
        float temperature "Generation temperature"
        int max_tokens "Token limit"
        int actual_tokens "Actual tokens used"
        string request_id FK "Link to original request"
        datetime created_at "Creation timestamp"
        datetime updated_at "Last modification"
        json metadata "Additional metadata"
        float score "Quality score (0-1)"
        int rank "Ranking among variants"
    }
    
    EMBEDDINGS {
        string prompt_id PK "Links to prompts.id"
        string model "Embedding model used"
        int dimensions "Vector dimensions"
        blob embedding "Vector data"
        datetime created_at "Generation timestamp"
        float similarity_threshold "Minimum similarity for matches"
    }
    
    METRICS {
        string id PK "Unique metric ID"
        string prompt_id FK "Links to prompts.id"
        string metric_type "Type of metric (cost, time, tokens)"
        float value "Numeric value"
        string unit "Unit of measurement"
        int processing_time_ms "Generation time"
        float cost_usd "Cost in USD"
        int total_tokens "Total tokens (input + output)"
        int input_tokens "Input tokens"
        int output_tokens "Output tokens"
        datetime timestamp "Measurement time"
        json details "Additional metric details"
    }
    
    PROMPT_REQUESTS {
        string id PK "Request UUID"
        text input "Original user input"
        string persona "Requested persona"
        json phases "Phases to execute"
        int count "Number of variants"
        float temperature "Generation temperature"
        int max_tokens "Token limit"
        json tags "Associated tags"
        string provider_override "Provider override"
        datetime created_at "Request timestamp"
        datetime completed_at "Completion timestamp"
        string status "Request status"
        json metadata "Request metadata"
    }
    
    REQUEST_PHASES {
        string id PK "Phase execution ID"
        string request_id FK "Links to prompt_requests.id"
        string phase "Phase name"
        string provider "Provider used"
        string model "Model used"
        datetime started_at "Phase start time"
        datetime completed_at "Phase completion time"
        string status "Phase status (pending, running, completed, failed)"
        text error_message "Error details if failed"
        json config "Phase configuration"
    }
    
    TAGS {
        string id PK "Tag ID"
        string prompt_id FK "Links to prompts.id"
        string tag "Tag value"
        datetime created_at "Tag creation time"
    }
    
    CONFIGURATIONS {
        string key PK "Configuration key"
        json value "Configuration value"
        string type "Value type (string, number, object)"
        datetime updated_at "Last update time"
        string updated_by "Who updated it"
    }
    
    SEARCH_HISTORY {
        string id PK "Search ID"
        text query "Search query"
        string search_type "Type (text, semantic)"
        json filters "Applied filters"
        int result_count "Number of results"
        float min_similarity "Minimum similarity threshold"
        json results "Search result IDs"
        datetime timestamp "Search timestamp"
    }
```

## Key Relationships

### Core Data Flow
1. **User Request** → `PROMPT_REQUESTS` table
2. **Phase Execution** → `REQUEST_PHASES` table  
3. **Generated Prompts** → `PROMPTS` table
4. **Performance Data** → `METRICS` table
5. **Vector Data** → `EMBEDDINGS` table

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_prompts_phase ON prompts(phase);
CREATE INDEX idx_prompts_provider ON prompts(provider);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_score ON prompts(score);

-- Search indexes  
CREATE INDEX idx_embeddings_model ON embeddings(model);
CREATE INDEX idx_tags_tag ON tags(tag);
CREATE INDEX idx_search_history_query ON search_history(query);

-- Foreign key indexes
CREATE INDEX idx_metrics_prompt_id ON metrics(prompt_id);
CREATE INDEX idx_embeddings_prompt_id ON embeddings(prompt_id);
CREATE INDEX idx_request_phases_request_id ON request_phases(request_id);
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