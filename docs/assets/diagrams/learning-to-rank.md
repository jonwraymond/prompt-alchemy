# Learning-to-Rank Flow

```mermaid
graph TD
    User[User Interactions] -->|Select/ Skip Prompts| Track[Track Feedback]
    Track -->|Store| DB[Database]
    DB -->|Nightly Job| Train[Train Model]
    Train -->|Update Weights| Config[Config File]
    Config -->|Hot Reload| Ranker[Ranking System]
    Ranker -->|Improved Ranking| Search[Prompt Search]
    Search --> User
    
    subgraph "Feedback Loop"
        User --> Track
        Search --> User
    end
    
    subgraph "Learning Pipeline"
        DB --> Train
        Train --> Config
        Config --> Ranker
    end
    
    style User fill:#4CAF50,stroke:#333,color:#fff
    style DB fill:#2196F3,stroke:#333,color:#fff
    style Train fill:#FF6B35,stroke:#333,color:#fff
    style Config fill:#FFC107,stroke:#333,color:#fff
    style Ranker fill:#9C27B0,stroke:#333,color:#fff
    style Search fill:#03A9F4,stroke:#333,color:#fff
```

## Key Components

### User Interactions
- Captured during interactive prompt selection
- Tracks 'chosen' vs 'skipped' prompts per session
- Includes scores and timestamps

### Training Process
- Runs nightly
- Analyzes correlations in feedback
- Computes feature importances
- Updates ranking weights atomically

### Hot Reload
- Watches config file changes
- Thread-safe weight updates
- No restart required

### Improved Ranking
- Uses learned weights for better relevance
- Adapts to user preferences over time
- Enhances search results automatically 