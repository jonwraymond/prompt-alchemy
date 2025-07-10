---
layout: default
title: Architecture Diagrams
---

# Architecture Diagrams

This page contains detailed diagrams illustrating the key concepts and architecture of Prompt Alchemy.

## 1. Multi-Phase Prompt Generation Flow

The core workflow of Prompt Alchemy follows a three-phase approach where each phase refines the prompt for different qualities:

```mermaid
graph TD
    A[User Input] --> B[Prompt Engine]
    B --> C{Phase 1: Idea}
    C --> D[OpenAI GPT-4]
    C --> E[Anthropic Claude]
    C --> F[Google Gemini]
    
    D --> G[Idea Prompts Generated]
    E --> G
    F --> G
    
    G --> H{Phase 2: Human}
    H --> I[Human-Centric Refinement]
    H --> J[Context Enhancement]
    H --> K[Clarity Optimization]
    
    I --> L[Human-Optimized Prompts]
    J --> L
    K --> L
    
    L --> M{Phase 3: Precision}
    M --> N[Technical Precision]
    M --> O[Parameter Optimization]
    M --> P[Format Standardization]
    
    N --> Q[Final Ranked Prompts]
    O --> Q
    P --> Q
    
    Q --> R[SQLite Storage]
    R --> S[Vector Embeddings]
    R --> T[Metadata Storage]
    
    Q --> U[Ranking System]
    U --> V[Temperature Score]
    U --> W[Token Efficiency]
    U --> X[Context Relevance]
    
    V --> Y[Best Prompt Selection]
    W --> Y
    X --> Y
    
    Y --> Z[User Output]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style Q fill:#e8f5e8
    style Y fill:#fff3e0
    style Z fill:#ffebee
```

## 2. Provider Architecture

The provider system abstracts different LLM services through a common interface:

```mermaid
graph TB
    A[Provider Interface] --> B[OpenAI Provider]
    A --> C[Anthropic Provider]
    A --> D[Google Provider]
    A --> E[OpenRouter Provider]
    A --> F[Ollama Provider]
    
    B --> G[OpenAI API]
    C --> H[Anthropic API]
    D --> I[Google API]
    E --> J[OpenRouter API]
    F --> K[Local Ollama]
    
    subgraph "Provider Capabilities"
        B --> L[Generation + Embeddings]
        C --> M[Generation Only]
        D --> N[Generation Only]
        E --> O[Generation + Embeddings]
        F --> P[Generation Only (Local)]
    end
    
    subgraph "Provider Registry"
        Q[Registry Manager] --> R[Provider Discovery]
        Q --> S[Health Checks]
        Q --> T[Load Balancing]
        Q --> U[Failover Logic]
    end
    
    A --> Q
    
    style A fill:#e3f2fd
    style Q fill:#f1f8e9
    style L fill:#e8f5e8
    style M fill:#fff3e0
    style N fill:#fff3e0
    style O fill:#e8f5e8
    style P fill:#fff3e0
```

## 3. Database Schema and Storage Architecture

The storage layer uses SQLite with vector embeddings for semantic search:

```mermaid
erDiagram
    PROMPTS {
        string id PK
        text content
        string content_hash
        string phase
        string provider
        string model
        real temperature
        integer max_tokens
        integer actual_tokens
        text tags
        string parent_id FK
        string source_type
        string enhancement_method
        real relevance_score
        integer usage_count
        timestamp last_used_at
        timestamp created_at
        timestamp updated_at
        blob embedding
        string embedding_model
        string embedding_provider
        text original_input
        text generation_request
        text generation_context
        string persona_used
        string target_model_family
    }
    
    MODEL_METADATA {
        string id PK
        string prompt_id FK
        string generation_model
        string generation_provider
        string embedding_model
        string embedding_provider
        string model_version
        string api_version
        integer processing_time
        integer input_tokens
        integer output_tokens
        integer total_tokens
        real cost
        timestamp created_at
    }
    
    ENHANCEMENT_HISTORY {
        string id PK
        string prompt_id FK
        string parent_prompt_id FK
        string enhancement_type
        string enhancement_method
        real improvement_score
        text metadata
        timestamp created_at
    }
    
    PROMPT_RELATIONSHIPS {
        string id PK
        string source_prompt_id FK
        string target_prompt_id FK
        string relationship_type
        real strength
        text context
        timestamp created_at
    }
    
    USAGE_ANALYTICS {
        string id PK
        string prompt_id FK
        boolean used_in_generation
        string generated_prompt_id FK
        text usage_context
        real effectiveness_score
        timestamp created_at
    }
    
    METRICS {
        string id PK
        string prompt_id FK
        real conversion_rate
        real engagement_score
        integer token_usage
        integer response_time
        integer usage_count
        timestamp created_at
        timestamp updated_at
    }
    
    CONTEXT {
        string id PK
        string prompt_id FK
        string context_type
        text content
        real relevance_score
        timestamp created_at
    }
    
    DATABASE_CONFIG {
        string key PK
        string value
        string description
        timestamp updated_at
    }
    
    PROMPTS ||--o{ MODEL_METADATA : "has"
    PROMPTS ||--o{ ENHANCEMENT_HISTORY : "tracks"
    PROMPTS ||--o{ PROMPT_RELATIONSHIPS : "relates_to"
    PROMPTS ||--o{ USAGE_ANALYTICS : "analyzes"
    PROMPTS ||--o{ METRICS : "measures"
    PROMPTS ||--o{ CONTEXT : "provides"
    PROMPTS ||--o| PROMPTS : "parent_of"
```

## 4. CLI Command Flow

The command-line interface provides various commands for prompt management:

```mermaid
graph TD
    A[CLI Entry Point] --> B{Command Router}
    
    B --> C[generate]
    B --> D[search]
    B --> E[optimize]
    B --> F[evaluate]
    B --> G[export]
    B --> H[config]
    B --> I[providers]
    B --> J[metrics]
    
    C --> K[Prompt Engine]
    K --> L[Phase Execution]
    L --> M[Provider Selection]
    M --> N[Generation Request]
    N --> O[Response Processing]
    O --> P[Storage & Ranking]
    P --> Q[Result Display]
    
    D --> R[Search Engine]
    R --> S{Search Type}
    S --> T[Text Search]
    S --> U[Semantic Search]
    S --> V[Hybrid Search]
    
    T --> W[SQL LIKE Query]
    U --> X[Vector Similarity]
    V --> Y[Combined Results]
    
    W --> Z[Search Results]
    X --> Z
    Y --> Z
    
    E --> AA[Optimization Engine]
    AA --> BB[Meta-Prompt Generation]
    BB --> CC[Provider Request]
    CC --> DD[Optimized Prompt]
    DD --> EE[Comparison & Storage]
    
    F --> FF[Evaluation Engine]
    FF --> GG[LLM-as-Judge]
    GG --> HH[Scoring Criteria]
    HH --> II[Evaluation Results]
    
    G --> JJ[Export Engine]
    JJ --> KK{Export Format}
    KK --> LL[JSON Export]
    KK --> MM[CSV Export]
    KK --> NN[Markdown Export]
    
    H --> OO[Configuration Manager]
    OO --> PP[Provider Settings]
    OO --> QQ[Phase Configuration]
    OO --> RR[Generation Settings]
    
    I --> SS[Provider Registry]
    SS --> TT[Health Checks]
    SS --> UU[Capability Discovery]
    
    J --> VV[Analytics Engine]
    VV --> WW[Usage Metrics]
    VV --> XX[Performance Stats]
    VV --> YY[Cost Analysis]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style K fill:#e8f5e8
    style R fill:#fff3e0
    style AA fill:#ffebee
    style FF fill:#f1f8e9
    style JJ fill:#fce4ec
    style OO fill:#e0f2f1
    style SS fill:#fff8e1
    style VV fill:#f3e5f5
```

## 5. Data Flow and Lifecycle Management

The system implements sophisticated lifecycle management for prompts:

```mermaid
graph TD
    A[New Prompt] --> B[Initial Processing]
    B --> C[Content Hashing]
    C --> D[Deduplication Check]
    D --> E{Duplicate Found?}
    
    E -->|Yes| F[Update Existing]
    E -->|No| G[Create New Entry]
    
    F --> H[Increment Usage Count]
    G --> I[Generate Embedding]
    
    H --> J[Update Relevance Score]
    I --> K[Store in Database]
    
    J --> L[Lifecycle Monitoring]
    K --> L
    
    L --> M[Usage Tracking]
    M --> N[Relevance Decay]
    N --> O[Performance Metrics]
    
    O --> P{Cleanup Criteria}
    P -->|Low Relevance| Q[Mark for Cleanup]
    P -->|High Usage| R[Boost Relevance]
    P -->|Inactive| S[Decay Score]
    
    Q --> T[Cleanup Process]
    R --> U[Optimization Candidate]
    S --> V[Archive Consideration]
    
    T --> W[Remove from Database]
    U --> X[Meta-Prompt Enhancement]
    V --> Y[Long-term Storage]
    
    X --> Z[Enhanced Prompt]
    Z --> AA[Relationship Tracking]
    AA --> BB[Performance Comparison]
    
    style A fill:#e8f5e8
    style L fill:#f3e5f5
    style T fill:#ffebee
    style U fill:#fff3e0
    style Z fill:#e1f5fe
```

## 6. Vector Embedding and Semantic Search

The system uses vector embeddings for semantic search capabilities:

```mermaid
graph TB
    A[Text Input] --> B[Embedding Generation]
    B --> C[Provider Selection]
    C --> D[OpenAI Embeddings]
    C --> E[Alternative Embeddings]
    
    D --> F[Vector Processing]
    E --> F
    
    F --> G[Dimensionality: 1536]
    G --> H[Normalization]
    H --> I[Binary Storage]
    
    I --> J[SQLite BLOB]
    J --> K[Indexed Storage]
    
    subgraph "Search Process"
        L[Query Input] --> M[Query Embedding]
        M --> N[Similarity Calculation]
        N --> O[Cosine Similarity]
        O --> P[Ranking by Score]
        P --> Q[Filtered Results]
    end
    
    K --> N
    
    subgraph "Optimization"
        R[Search Performance] --> S[Index Management]
        S --> T[Composite Indexes]
        T --> U[Query Optimization]
        U --> V[Result Caching]
    end
    
    Q --> R
    
    style A fill:#e3f2fd
    style F fill:#f1f8e9
    style J fill:#fff3e0
    style L fill:#e8f5e8
    style R fill:#ffebee
```

## 7. Ranking and Evaluation System

The ranking system evaluates prompts across multiple dimensions:

```mermaid
graph TD
    A[Generated Prompts] --> B[Ranking Engine]
    
    B --> C[Temperature Analysis]
    B --> D[Token Efficiency]
    B --> E[Context Relevance]
    B --> F[Historical Performance]
    B --> G[Semantic Quality]
    
    C --> H[Temperature Score]
    D --> I[Efficiency Score]
    E --> J[Relevance Score]
    F --> K[Performance Score]
    G --> L[Quality Score]
    
    H --> M[Weighted Scoring]
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Composite Score]
    N --> O[Rank Assignment]
    O --> P[Best Prompt Selection]
    
    subgraph "LLM-as-Judge Evaluation"
        Q[Evaluation Criteria] --> R[Judge Prompt]
        R --> S[LLM Evaluator]
        S --> T[Detailed Feedback]
        T --> U[Quantitative Scores]
        U --> V[Qualitative Analysis]
    end
    
    P --> Q
    V --> W[Enhanced Ranking]
    W --> X[Final Results]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style M fill:#e8f5e8
    style P fill:#fff3e0
    style S fill:#ffebee
    style X fill:#f1f8e9
```

## Key Features Illustrated

1. **Multi-Phase Generation**: Three distinct phases (Idea, Human, Precision) each optimizing for different qualities
2. **Provider Abstraction**: Unified interface supporting multiple LLM providers with different capabilities
3. **Vector-Enabled Storage**: SQLite with BLOB embeddings for semantic search and relationship tracking
4. **Lifecycle Management**: Automated relevance scoring, usage tracking, and cleanup processes
5. **Comprehensive Analytics**: Usage metrics, performance tracking, and cost analysis
6. **Flexible Command Interface**: Multiple CLI commands for different use cases
7. **Intelligent Ranking**: Multi-dimensional scoring with optional LLM-as-Judge evaluation

These diagrams provide a comprehensive view of how Prompt Alchemy orchestrates complex prompt engineering workflows while maintaining flexibility and extensibility.