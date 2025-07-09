# Prompt Alchemy Architecture

## Overview

Prompt Alchemy is a sophisticated prompt generation system that uses a phased approach to create, refine, and optimize AI prompts. It supports multiple LLM providers and includes advanced features like embeddings, context building, and performance tracking.

## Core Components

### 1. Provider Interface
- **Location**: `internal/providers/`
- **Purpose**: Abstraction layer for multiple LLM providers
- **Supported Providers**:
  - OpenAI (ChatGPT)
  - Anthropic (Claude)
  - Google (Gemini)
  - OpenRouter (Universal API)

### 2. Prompt Engine
- **Location**: `internal/engine/`
- **Purpose**: Core prompt generation with phased approach
- **Phases**:
  1. **Idea Setup**: Initial prompt creation
  2. **Human Layer**: Natural language refinement
  3. **Precision Tweak**: Final optimization

### 3. Storage Layer
- **Location**: `internal/storage/`
- **Purpose**: SQLite database for prompt catalog and context
- **Features**:
  - Prompt versioning
  - Tag management
  - Context accumulation
  - Performance metrics

### 4. Embedding System
- **Location**: `internal/embedding/`
- **Purpose**: Semantic search and context matching
- **Components**:
  - Vector storage
  - Similarity search
  - Context retrieval

### 5. Ranking System
- **Location**: `internal/ranking/`
- **Purpose**: Intelligent prompt selection
- **Factors**:
  - Temperature optimization
  - Token efficiency
  - Historical performance
  - Context relevance

### 6. MCP Integration
- **Location**: `internal/mcp/`
- **Purpose**: Model Context Protocol support for AI agents
- **Features**:
  - Tool registration
  - Context passing
  - Response formatting

### 7. Metrics Tracking
- **Location**: `internal/metrics/`
- **Purpose**: Performance tracking and A/B testing
- **Metrics**:
  - Conversion rates
  - Engagement scores
  - Token usage
  - Response quality

## Data Flow

1. **Input Processing**
   - User/Agent provides initial idea or context
   - System analyzes existing context from storage
   - Embedding system finds relevant historical prompts

2. **Generation Pipeline**
   - Phase 1: Generate base prompt variants (3-5)
   - Phase 2: Apply human layer refinement
   - Phase 3: Precision optimization

3. **Ranking & Selection**
   - Score each variant based on multiple factors
   - Present top options to user/agent
   - Learn from selection for future optimization

4. **Storage & Learning**
   - Save selected prompt with metadata
   - Update performance metrics
   - Build context graph for future use

## File Structure

```
.prompt-alchemy/
├── prompts.db          # SQLite database
├── embeddings/         # Vector storage
│   └── index.faiss    
├── config.yaml         # User configuration
└── metrics/           # Performance data
    └── reports/
```

## CLI Commands

```bash
# Generate prompts
prompt-alchemy generate --phases "idea,human,precision" --count 5

# Search existing prompts
prompt-alchemy search "authentication flow"

# Test prompt variants
prompt-alchemy test --ab-test prompt1.yaml prompt2.yaml

# View metrics
prompt-alchemy metrics --report weekly

# MCP mode for agents
prompt-alchemy serve --mcp
```

## Database Schema

### prompts
- id (UUID)
- content (TEXT)
- phase (TEXT)
- provider (TEXT)
- model (TEXT)
- temperature (FLOAT)
- max_tokens (INT)
- actual_tokens (INT)
- tags (JSON)
- parent_id (UUID)
- created_at (TIMESTAMP)
- embedding (BLOB)
- embedding_model (TEXT)
- embedding_provider (TEXT)

### model_metadata
- id (UUID)
- prompt_id (UUID)
- generation_model (TEXT)
- generation_provider (TEXT)
- embedding_model (TEXT)
- embedding_provider (TEXT)
- processing_time (INT)
- input_tokens (INT)
- output_tokens (INT)
- total_tokens (INT)
- cost (FLOAT)
- created_at (TIMESTAMP)

### metrics
- id (UUID)
- prompt_id (UUID)
- conversion_rate (FLOAT)
- engagement_score (FLOAT)
- token_usage (INT)
- response_time (INT)
- created_at (TIMESTAMP)

### context
- id (UUID)
- prompt_id (UUID)
- context_type (TEXT)
- content (TEXT)
- relevance_score (FLOAT)
- created_at (TIMESTAMP) 