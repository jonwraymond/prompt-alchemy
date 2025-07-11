# Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Layer"
        CLI["`🖥️ **CLI Commands**
        User Interface`"]
        Config["`⚙️ **Configuration**
        API Keys & Settings`"]
        Batch["`📋 **Batch Files**
        JSON/CSV/Text`"]
    end
    
    subgraph "Processing Engine"
        Router["`🎯 **Request Router**
        Command Dispatcher`"]
        Validator["`✅ **Input Validator**
        Schema Checking`"]
        Generator["`⚗️ **Prompt Generator**
        Alchemical Engine`"]
        Optimizer["`🔄 **Optimizer**
        Iterative Improvement`"]
    end
    
    subgraph "Provider APIs"
        OpenAI_API["`🤖 **OpenAI API**
        GPT + Embeddings`"]
        Anthropic_API["`🧠 **Anthropic API**
        Claude Models`"]
        Google_API["`🌟 **Google API**
        Gemini Models`"]
        Router_API["`🔗 **OpenRouter API**
        Multi-Provider`"]
        Local_API["`🏠 **Ollama API**
        Local Inference`"]
    end
    
    subgraph "Data Storage"
        PromptDB["`📝 **Prompts Table**
        Core Prompt Data`"]
        MetricsDB["`📊 **Metrics Table**
        Performance Data`"]
        EmbedDB["`🧮 **Embeddings Table**
        Vector Storage`"]
        ConfigDB["`⚙️ **Config Table**
        User Preferences`"]
    end
    
    subgraph "Output Layer"
        Display["`📺 **Console Output**
        Formatted Results`"]
        JSON_Out["`📄 **JSON Export**
        Structured Data`"]
        Files["`💾 **File Output**
        Batch Results`"]
    end
    
    %% Input connections
    CLI --> Router
    Config --> Validator
    Batch --> Validator
    
    %% Processing flow
    Router --> Validator
    Validator --> Generator
    Generator --> Optimizer
    
    %% Provider connections
    Generator --> OpenAI_API
    Generator --> Anthropic_API
    Generator --> Google_API
    Generator --> Router_API
    Generator --> Local_API
    
    %% Data storage connections
    Generator --> PromptDB
    Generator --> MetricsDB
    Generator --> EmbedDB
    Validator --> ConfigDB
    
    %% Output connections
    Generator --> Display
    Optimizer --> JSON_Out
    Generator --> Files
    
    %% Feedback loops
    MetricsDB -.-> Optimizer
    EmbedDB -.-> Generator
    PromptDB -.-> Optimizer
    
    style CLI fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff
    style Generator fill:#FF6B35,stroke:#333,stroke-width:3px,color:#fff
    style PromptDB fill:#2196F3,stroke:#333,stroke-width:2px,color:#fff
    style Display fill:#9C27B0,stroke:#333,stroke-width:2px,color:#fff
```

## Data Flow Patterns

### 1. Simple Generation Flow
```
User Input → Validation → Generation → Storage → Output
```

### 2. Batch Processing Flow
```
Batch File → Parse → Validate → Queue → Process → Aggregate → Export
```

### 3. Optimization Flow
```
Existing Prompt → Analyze → Generate Variants → Evaluate → Select Best → Store
```

### 4. Search Flow
```
Query → Embedding → Vector Search → Rank Results → Format → Display
```

## Data Transformations

### Input Processing
- **CLI Arguments**: Parsed into structured request objects
- **Configuration**: Merged with defaults and validated
- **Batch Data**: Parsed from JSON/CSV into uniform format

### Generation Pipeline
- **Request Object**: Contains all generation parameters
- **Phase Results**: Structured outputs from each alchemical phase
- **Embeddings**: Vector representations for semantic operations
- **Metrics**: Performance and cost tracking data

### Storage Format
- **Prompts**: UUID, content, metadata, embeddings
- **Metrics**: Timestamps, costs, performance indicators
- **Relations**: Links between prompts, variants, and optimizations

### Output Formatting
- **Console**: Colorized, structured text output
- **JSON**: Machine-readable structured data
- **Files**: Batch processing results in various formats