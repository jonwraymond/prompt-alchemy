-- Enhanced Prompts table with vector search optimizations
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,            -- SHA256 hash for deduplication
    phase TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,                    -- Model used for generation
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    actual_tokens INTEGER DEFAULT 0,       -- Actual tokens used in generation
    tags TEXT,                             -- JSON array
    parent_id TEXT,                        -- Parent prompt for derivations
    source_type TEXT DEFAULT 'manual',     -- 'manual', 'generated', 'optimized', 'derived'
    enhancement_method TEXT,               -- 'optimization', 'semantic_search', 'user_edit', etc.
    relevance_score REAL DEFAULT 1.0,     -- Dynamic relevance score (0.0-1.0)
    usage_count INTEGER DEFAULT 0,        -- How many times this prompt was used
    generation_count INTEGER DEFAULT 0,   -- How many prompts this generated
    last_used_at TIMESTAMP,               -- Last time prompt was accessed/used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,                        -- Vector embedding stored as binary
    embedding_model TEXT,                  -- Model used for embedding
    embedding_provider TEXT,               -- Provider used for embedding
    original_input TEXT,                   -- Original user input that led to this prompt
    generation_request TEXT,               -- JSON of the generation request parameters
    generation_context TEXT,               -- JSON of context used during generation
    persona_used TEXT,                     -- Persona that was active during generation
    target_model_family TEXT,              -- Target model family this prompt was optimized for
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);

-- View for prompts with embedding information for easy querying
CREATE VIEW IF NOT EXISTS prompts_with_embeddings AS
SELECT 
    p.*,
    CASE WHEN p.embedding IS NOT NULL THEN 1 ELSE 0 END as has_embedding,
    length(p.embedding) as embedding_size
FROM prompts p;

-- Enhancement history table - tracks how prompts were improved
CREATE TABLE IF NOT EXISTS enhancement_history (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    parent_prompt_id TEXT,                 -- Original prompt before enhancement
    enhancement_type TEXT NOT NULL,       -- 'optimization', 'refinement', 'merge', 'split'
    enhancement_method TEXT NOT NULL,     -- 'ai_optimization', 'semantic_similarity', 'user_feedback'
    improvement_score REAL DEFAULT 0.0,   -- Quantified improvement (0.0-1.0)
    metadata TEXT,                        -- JSON metadata about the enhancement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
);

-- Prompt relationships table - tracks semantic and usage relationships
CREATE TABLE IF NOT EXISTS prompt_relationships (
    id TEXT PRIMARY KEY,
    source_prompt_id TEXT NOT NULL,
    target_prompt_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,      -- 'derived_from', 'similar_to', 'inspired_by', 'merged_with'
    strength REAL DEFAULT 0.0,           -- Relationship strength (0.0-1.0)
    context TEXT,                         -- Why this relationship exists
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    UNIQUE(source_prompt_id, target_prompt_id, relationship_type)
);

-- Usage analytics table - tracks how prompts are used in generation
CREATE TABLE IF NOT EXISTS usage_analytics (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    used_in_generation BOOLEAN DEFAULT FALSE, -- Was this prompt used to generate others?
    generated_prompt_id TEXT,              -- What prompt was generated using this one
    usage_context TEXT,                   -- Context of usage (phase, task, etc.)
    effectiveness_score REAL DEFAULT 0.0, -- How effective was this usage (0.0-1.0)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
);

-- Database configuration table - for lifecycle management settings
CREATE TABLE IF NOT EXISTS database_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration values including vector search settings
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

-- Create optimized indexes for vector search and general performance
CREATE INDEX IF NOT EXISTS idx_prompts_phase ON prompts(phase);
CREATE INDEX IF NOT EXISTS idx_prompts_provider ON prompts(provider);
CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
CREATE INDEX IF NOT EXISTS idx_prompts_content_hash ON prompts(content_hash);
CREATE INDEX IF NOT EXISTS idx_prompts_source_type ON prompts(source_type);
CREATE INDEX IF NOT EXISTS idx_prompts_relevance_score ON prompts(relevance_score);
CREATE INDEX IF NOT EXISTS idx_prompts_usage_count ON prompts(usage_count);
CREATE INDEX IF NOT EXISTS idx_prompts_last_used_at ON prompts(last_used_at);
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_model ON prompts(embedding_model);
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_provider ON prompts(embedding_provider);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON prompts(parent_id);

-- Composite indexes for optimized vector search
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_relevance ON prompts(embedding, relevance_score) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_phase_embedding ON prompts(phase, embedding) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_provider_embedding ON prompts(provider, embedding) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_model_embedding ON prompts(model, embedding) WHERE embedding IS NOT NULL;

-- Indexes for related tables
CREATE INDEX IF NOT EXISTS idx_enhancement_history_prompt_id ON enhancement_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_history_parent_prompt_id ON enhancement_history(parent_prompt_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_history_type ON enhancement_history(enhancement_type);

CREATE INDEX IF NOT EXISTS idx_prompt_relationships_source ON prompt_relationships(source_prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_relationships_target ON prompt_relationships(target_prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_relationships_type ON prompt_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_prompt_relationships_strength ON prompt_relationships(strength);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_prompt_id ON usage_analytics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_generated_prompt_id ON usage_analytics(generated_prompt_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_effectiveness ON usage_analytics(effectiveness_score);

CREATE INDEX IF NOT EXISTS idx_model_metadata_prompt_id ON model_metadata(prompt_id);
CREATE INDEX IF NOT EXISTS idx_model_metadata_generation_model ON model_metadata(generation_model);
CREATE INDEX IF NOT EXISTS idx_model_metadata_embedding_model ON model_metadata(embedding_model);

CREATE INDEX IF NOT EXISTS idx_metrics_prompt_id ON metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_prompt_id ON context(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON context(context_type);

-- Triggers for automatic updates and optimization
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

-- Trigger to update usage count when prompt is accessed
CREATE TRIGGER IF NOT EXISTS update_prompt_usage
AFTER UPDATE OF last_used_at ON prompts
BEGIN
    UPDATE prompts SET usage_count = usage_count + 1 WHERE id = NEW.id;
END;

-- Trigger to update relevance score based on usage
CREATE TRIGGER IF NOT EXISTS update_relevance_on_usage
AFTER UPDATE OF usage_count ON prompts
BEGIN
    UPDATE prompts SET 
        relevance_score = MIN(1.0, relevance_score + 0.05)
    WHERE id = NEW.id;
END;

-- Trigger to decay relevance scores over time (can be run periodically)
-- This is just the definition; actual execution would be via a scheduled job 