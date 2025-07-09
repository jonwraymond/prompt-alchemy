-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    phase TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,                    -- Model used for generation
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    actual_tokens INTEGER DEFAULT 0,       -- Actual tokens used in generation
    tags TEXT,                             -- JSON array
    parent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,                        -- Vector embedding stored as binary
    embedding_model TEXT,                  -- Model used for embedding
    embedding_provider TEXT,               -- Provider used for embedding
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);

-- Model metadata table for detailed model information
CREATE TABLE IF NOT EXISTS model_metadata (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    generation_model TEXT NOT NULL,
    generation_provider TEXT NOT NULL,
    embedding_model TEXT,
    embedding_provider TEXT,
    model_version TEXT,
    api_version TEXT,
    processing_time INTEGER DEFAULT 0,     -- Processing time in milliseconds
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0.0,                 -- Cost in USD if available
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

-- Trigger to update updated_at timestamp
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