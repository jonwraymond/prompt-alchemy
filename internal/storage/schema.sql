-- Prompts table to store all generated prompts and their metadata.
-- Note: embedding column removed as we use chromem-go for vector operations
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    phase TEXT,
    provider TEXT,
    model TEXT,
    temperature REAL,
    max_tokens INTEGER,
    actual_tokens INTEGER,
    tags TEXT, -- Stored as a JSON array
    parent_id TEXT,
    session_id TEXT,
    
    source_type TEXT,
    enhancement_method TEXT,
    relevance_score REAL,
    usage_count INTEGER,
    generation_count INTEGER,
    last_used_at DATETIME,

    original_input TEXT,
    persona_used TEXT,
    target_model_family TEXT,

    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    -- Embedding metadata (actual vectors stored in chromem-go)
    embedding_model TEXT,
    embedding_provider TEXT,
    
    FOREIGN KEY (parent_id) REFERENCES prompts(id)
);

-- Table to store user interactions for learning-to-rank
CREATE TABLE IF NOT EXISTS user_interactions (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    action TEXT NOT NULL,
    score REAL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

-- Table to store prompt relationships for optimization
CREATE TABLE IF NOT EXISTS prompt_relationships (
    id TEXT PRIMARY KEY,
    source_prompt_id TEXT NOT NULL,
    target_prompt_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL, -- 'derived_from', 'optimized_to', 'similar_to'
    strength REAL NOT NULL DEFAULT 0.5,
    context TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (source_prompt_id) REFERENCES prompts(id),
    FOREIGN KEY (target_prompt_id) REFERENCES prompts(id)
);

-- Indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_prompts_phase ON prompts(phase);
CREATE INDEX IF NOT EXISTS idx_prompts_provider ON prompts(provider);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_relevance_score ON prompts(relevance_score);
CREATE INDEX IF NOT EXISTS idx_prompts_session_id ON prompts(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_prompt_id ON user_interactions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON prompt_relationships(source_prompt_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON prompt_relationships(target_prompt_id);