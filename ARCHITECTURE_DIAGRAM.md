
# Prompt Alchemy Architecture Diagram

This document contains a detailed Mermaid diagram that illustrates the architecture of the Prompt Alchemy system.

```mermaid
graph TD
    subgraph User Interaction
        User[👤 User]
    end

    subgraph Core Application
        CLI[💻 CLI]
        Engine[⚙️ Prompt Engine]
        Storage[🗄️ Storage Layer (SQLite)]
        Ranker[🏆 Ranking System]
        Judge[⚖️ LLM-as-a-Judge]
        Optimizer[✨ Meta-Prompt Optimizer]
    end

    subgraph Provider Layer
        Registry[🔌 Provider Registry]
        subgraph Providers
            OpenAI[OpenAI API]
            Anthropic[Anthropic API]
            Google[Google API]
            OpenRouter[OpenRouter API]
            Ollama[Ollama (Local)]
        end
    end

    subgraph External Services
        ExternalAPIs(🌐 External LLM APIs)
    end

    %% Data Flow and Interactions
    User -- Prompts/Commands --> CLI
    CLI -- Invokes --> Engine
    CLI -- Invokes --> Judge
    CLI -- Invokes --> Optimizer
    CLI -- Manages --> Storage

    Engine -- Uses --> Registry
    Engine -- Saves/Retrieves --> Storage
    Engine -- Uses --> Ranker

    Registry -- Manages --> Providers
    Providers -- Calls --> ExternalAPIs

    Ranker -- Reads Data --> Storage

    Judge -- Uses --> Registry
    Judge -- Evaluates Prompts --> Storage

    Optimizer -- Uses --> Judge
    Optimizer -- Uses --> Registry
    Optimizer -- Refines Prompts --> Storage

    %% Styling
    classDef core fill:#f9f,stroke:#333,stroke-width:2px;
    classDef providers fill:#bbf,stroke:#333,stroke-width:2px;
    classDef user fill:#ff9,stroke:#333,stroke-width:2px;
    classDef storage fill:#9f9,stroke:#333,stroke-width:2px;

    class User user;
    class CLI,Engine,Ranker,Judge,Optimizer core;
    class Registry,Providers providers;
    class Storage storage;
```
