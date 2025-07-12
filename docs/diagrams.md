---
layout: default
title: Architecture Diagrams
---

# Architecture Diagrams

This page provides visual representations of Prompt Alchemy's architecture, data flow, and system components using Mermaid diagrams.

## System Overview

```mermaid
graph TB
    subgraph "User Interface"
        CLI[CLI Commands]
        MCP[MCP Client]
        HTTP[HTTP API]
    end
    
    subgraph "Core System"
        API[API Layer]
        GEN[Generation Engine]
        SEARCH[Search Engine]
        LEARN[Learning Engine]
    end
    
    subgraph "Data Layer"
        DB[(SQLite Database)]
        CACHE[Memory Cache]
        VECTORS[Vector Store]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        ANTHROPIC[Anthropic API]
        GOOGLE[Google API]
        OLLAMA[Ollama Local]
    end
    
    CLI --> API
    MCP --> API
    HTTP --> API
    
    API --> GEN
    API --> SEARCH
    API --> LEARN
    
    GEN --> DB
    SEARCH --> DB
    LEARN --> DB
    
    SEARCH --> VECTORS
    LEARN --> CACHE
    
    GEN --> OPENAI
    GEN --> ANTHROPIC
    GEN --> GOOGLE
    GEN --> OLLAMA
```

## Alchemical Process Flow

```mermaid
flowchart TD
    A[Raw Input] --> B[Prima Materia]
    B --> C[Extract Core Concepts]
    C --> D[Solutio]
    D --> E[Natural Language Flow]
    E --> F[Coagulatio]
    F --> G[Precision Tuning]
    G --> H[Final Prompt]
    
    subgraph "Phase 1: Prima Materia"
        B
        C
    end
    
    subgraph "Phase 2: Solutio"
        D
        E
    end
    
    subgraph "Phase 3: Coagulatio"
        F
        G
    end
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style B fill:#fff3e0
    style D fill:#fff3e0
    style F fill:#fff3e0
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Processing"
        INPUT[User Input]
        PARSER[Input Parser]
        VALIDATOR[Input Validator]
    end
    
    subgraph "Generation Pipeline"
        PHASE1[Phase 1: Prima Materia]
        PHASE2[Phase 2: Solutio]
        PHASE3[Phase 3: Coagulatio]
        SELECTOR[Variant Selector]
    end
    
    subgraph "Storage & Retrieval"
        DB[(Database)]
        VECTOR[Vector Store]
        CACHE[Cache]
    end
    
    subgraph "Output Processing"
        FORMATTER[Output Formatter]
        METRICS[Metrics Collector]
        FEEDBACK[Feedback Handler]
    end
    
    INPUT --> PARSER
    PARSER --> VALIDATOR
    VALIDATOR --> PHASE1
    PHASE1 --> PHASE2
    PHASE2 --> PHASE3
    PHASE3 --> SELECTOR
    SELECTOR --> FORMATTER
    
    PHASE1 --> DB
    PHASE2 --> DB
    PHASE3 --> DB
    SELECTOR --> DB
    
    PHASE1 --> VECTOR
    PHASE2 --> VECTOR
    PHASE3 --> VECTOR
    
    SELECTOR --> CACHE
    FORMATTER --> METRICS
    METRICS --> FEEDBACK
    FEEDBACK --> DB
```

## Database Schema

```mermaid
erDiagram
    PROMPTS {
        text id PK
        text content
        text phase
        text provider
        text model
        text persona
        text tags
        text context
        blob embedding
        text embedding_model
        integer embedding_dimensions
        datetime created_at
        datetime updated_at
        text parent_id FK
        text variant_of FK
        real effectiveness_score
        integer usage_count
    }
    
    MODEL_METADATA {
        integer id PK
        text prompt_id FK
        text generation_model
        integer total_tokens
        integer input_tokens
        integer output_tokens
        real temperature
        integer max_tokens
        datetime created_at
    }
    
    METRICS {
        integer id PK
        text prompt_id FK
        integer token_usage
        integer response_time_ms
        real success_rate
        integer user_rating
        text feedback
        datetime created_at
    }
    
    ENHANCEMENT_HISTORY {
        integer id PK
        text prompt_id FK
        text updated_content
        text update_reason
        text updated_by
        datetime created_at
    }
    
    LEARNING_PATTERNS {
        integer id PK
        text pattern_type
        text pattern_data
        real confidence_score
        integer usage_count
        datetime created_at
        datetime updated_at
    }
    
    USER_FEEDBACK {
        integer id PK
        text prompt_id FK
        integer rating
        text feedback_type
        text feedback_text
        text session_id
        datetime created_at
    }
    
    PROMPTS ||--o{ MODEL_METADATA : "has"
    PROMPTS ||--o{ METRICS : "tracks"
    PROMPTS ||--o{ ENHANCEMENT_HISTORY : "versioned"
    PROMPTS ||--o{ USER_FEEDBACK : "receives"
    PROMPTS ||--o{ PROMPTS : "parent_of"
    PROMPTS ||--o{ PROMPTS : "variant_of"
```

## Component Interaction

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as CLI
    participant API as API Layer
    participant GEN as Generation Engine
    participant DB as Database
    participant AI as AI Provider
    
    U->>CLI: prompt-alchemy generate "input"
    CLI->>API: GenerateRequest
    API->>GEN: Process Input
    GEN->>DB: Store Initial Prompt
    GEN->>AI: Phase 1 Request
    AI-->>GEN: Phase 1 Response
    GEN->>DB: Store Phase 1 Result
    GEN->>AI: Phase 2 Request
    AI-->>GEN: Phase 2 Response
    GEN->>DB: Store Phase 2 Result
    GEN->>AI: Phase 3 Request
    AI-->>GEN: Phase 3 Response
    GEN->>DB: Store Final Result
    GEN-->>API: Generation Complete
    API-->>CLI: Response
    CLI-->>U: Display Results
```

## Learning System Architecture

```mermaid
graph TD
    subgraph "Data Collection"
        USAGE[Usage Patterns]
        FEEDBACK[User Feedback]
        METRICS[Performance Metrics]
    end
    
    subgraph "Learning Engine"
        PATTERN[Pattern Recognition]
        ANALYSIS[Effectiveness Analysis]
        OPTIMIZATION[Prompt Optimization]
    end
    
    subgraph "Storage"
        PATTERNS[(Learning Patterns)]
        WEIGHTS[(Model Weights)]
        CACHE[(Recommendation Cache)]
    end
    
    subgraph "Application"
        RECOMMEND[Recommendation Engine]
        RANKING[Prompt Ranking]
        ADAPTATION[Adaptive Generation]
    end
    
    USAGE --> PATTERN
    FEEDBACK --> ANALYSIS
    METRICS --> OPTIMIZATION
    
    PATTERN --> PATTERNS
    ANALYSIS --> WEIGHTS
    OPTIMIZATION --> CACHE
    
    PATTERNS --> RECOMMEND
    WEIGHTS --> RANKING
    CACHE --> ADAPTATION
    
    RECOMMEND --> RANKING
    RANKING --> ADAPTATION
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "On-Demand Mode"
        CLI1[CLI Process]
        CONFIG1[Local Config]
        DB1[Local Database]
    end
    
    subgraph "Server Mode"
        SERVER[Server Process]
        CONFIG2[Server Config]
        DB2[Server Database]
        CACHE2[Server Cache]
    end
    
    subgraph "Docker Deployment"
        CONTAINER[Docker Container]
        VOLUME[Persistent Volume]
        NETWORK[Network Bridge]
    end
    
    subgraph "External Services"
        AI_PROVIDERS[AI APIs]
        MONITORING[Monitoring]
        LOGGING[Logging]
    end
    
    CLI1 --> CONFIG1
    CLI1 --> DB1
    CLI1 --> AI_PROVIDERS
    
    SERVER --> CONFIG2
    SERVER --> DB2
    SERVER --> CACHE2
    SERVER --> AI_PROVIDERS
    SERVER --> MONITORING
    SERVER --> LOGGING
    
    CONTAINER --> VOLUME
    CONTAINER --> NETWORK
    CONTAINER --> AI_PROVIDERS
```

## Search and Retrieval Flow

```mermaid
flowchart LR
    subgraph "Search Input"
        QUERY[Search Query]
        FILTERS[Search Filters]
        OPTIONS[Search Options]
    end
    
    subgraph "Search Processing"
        PARSER[Query Parser]
        SEMANTIC[Semantic Search]
        TEXT[Text Search]
        RANKER[Result Ranker]
    end
    
    subgraph "Data Sources"
        DB[(Database)]
        VECTORS[Vector Store]
        CACHE[Search Cache]
    end
    
    subgraph "Output"
        RESULTS[Search Results]
        METADATA[Result Metadata]
        SUGGESTIONS[Suggestions]
    end
    
    QUERY --> PARSER
    FILTERS --> PARSER
    OPTIONS --> PARSER
    
    PARSER --> SEMANTIC
    PARSER --> TEXT
    
    SEMANTIC --> VECTORS
    TEXT --> DB
    
    SEMANTIC --> CACHE
    TEXT --> CACHE
    
    VECTORS --> RANKER
    DB --> RANKER
    CACHE --> RANKER
    
    RANKER --> RESULTS
    RANKER --> METADATA
    RANKER --> SUGGESTIONS
```

## Error Handling and Recovery

```mermaid
graph TD
    subgraph "Error Detection"
        VALIDATION[Input Validation]
        TIMEOUT[Timeout Detection]
        FAILURE[Failure Detection]
    end
    
    subgraph "Error Handling"
        RETRY[Retry Logic]
        FALLBACK[Fallback Provider]
        DEGRADATION[Graceful Degradation]
    end
    
    subgraph "Recovery"
        ROLLBACK[State Rollback]
        COMPENSATION[Compensation Logic]
        NOTIFICATION[Error Notification]
    end
    
    subgraph "Monitoring"
        LOGGING[Error Logging]
        METRICS[Error Metrics]
        ALERTS[Alert System]
    end
    
    VALIDATION --> RETRY
    TIMEOUT --> FALLBACK
    FAILURE --> DEGRADATION
    
    RETRY --> ROLLBACK
    FALLBACK --> COMPENSATION
    DEGRADATION --> NOTIFICATION
    
    ROLLBACK --> LOGGING
    COMPENSATION --> METRICS
    NOTIFICATION --> ALERTS
```

## Performance Optimization

```mermaid
graph LR
    subgraph "Caching Strategy"
        MEMORY[Memory Cache]
        DISK[Disk Cache]
        DISTRIBUTED[Distributed Cache]
    end
    
    subgraph "Optimization Techniques"
        BATCHING[Request Batching]
        PIPELINING[Response Pipelining]
        COMPRESSION[Data Compression]
    end
    
    subgraph "Resource Management"
        CONNECTION[Connection Pooling]
        THREADING[Thread Management]
        MEMORY_MGMT[Memory Management]
    end
    
    subgraph "Monitoring"
        PROFILING[Performance Profiling]
        BOTTLENECK[Bottleneck Detection]
        OPTIMIZATION[Auto Optimization]
    end
    
    MEMORY --> BATCHING
    DISK --> PIPELINING
    DISTRIBUTED --> COMPRESSION
    
    BATCHING --> CONNECTION
    PIPELINING --> THREADING
    COMPRESSION --> MEMORY_MGMT
    
    CONNECTION --> PROFILING
    THREADING --> BOTTLENECK
    MEMORY_MGMT --> OPTIMIZATION
```

## Next Steps

- Explore the [Architecture]({{ site.baseurl }}/architecture) documentation for detailed system design
- Review the [Database]({{ site.baseurl }}/database) schema for data structure details
- Check the [CLI Reference]({{ site.baseurl }}/cli-reference) for command-line interface
- Learn about [MCP Integration]({{ site.baseurl }}/mcp-integration) for AI agent connectivity