---
layout: default
title: Architecture
---

# Prompt Alchemy Architecture

This document provides a comprehensive overview of the system architecture, design decisions, and implementation details.

## System Overview

Prompt Alchemy follows a modular, layered architecture with a complete storage implementation and enhanced model tracking. The system can operate in three primary modes:

- **On-Demand Mode**: Standard CLI for single-task execution.
- **MCP Server Mode**: A persistent server for AI agent integration via `stdin`/`stdout`.
- **HTTP Server Mode**: A persistent server exposing a RESTful API.

### Recent Architecture Enhancements

- **Complete Storage API**: Fully implemented ListPrompts, GetPrompt, and SearchPrompts methods
- **Enhanced Model Tracking**: New ModelMetadata entity tracks cost, performance, and token usage
- **Type Consolidation**: Unified GenerateRequest/Response types across API layers
- **Improved Search**: Text-based search across prompt content and metadata
- **Code Quality**: Resolved technical debt with 17 TODO items and consolidated duplicate types

```mermaid
graph TB
    subgraph "User & Agent Interfaces"
        User["`👤 **User**`"]
        Agent["`🤖 **AI Agent**`"]
        WebClient["`🌐 **Web Client**`"]
    end
    
    subgraph "Application Layer"
        CLI["`🖥️ **CLI Interface**`"]
        MCPServer["`🔌 **MCP Server**`"]
        HTTPServer["`🌍 **HTTP Server**`"]
    end
    
    subgraph "Core Logic"
        Engine[Generation Engine]
        Learner[Learning Engine]
        Ranker[Ranking System]
    end
    
    subgraph "Provider Layer"
        Providers[Provider Registry]
    end
    
    subgraph "Data Layer"
        SQLite[(SQLite Database)]
        Embeddings[Vector Store (in DB)]
    end
    
    User --> CLI
    Agent --> MCPServer
    WebClient --> HTTPServer
    
    CLI --> Engine
    MCPServer --> Engine
    HTTPServer --> Engine
    
    Engine --> Learner
    Engine --> Ranker
    Engine --> Providers
    Engine --> SQLite
    
    Learner --> SQLite
    Ranker --> Embeddings
    
    classDef interface fill:#e1f5fe
    classDef core fill:#f3e5f5
    classDef provider fill:#e8f5e8
    classDef data fill:#fff3e0
    
    class CLI,MCPServer,HTTPServer,User,Agent,WebClient interface
    class Engine,Learner,Ranker core
    class Providers provider
    class SQLite,Embeddings data
```

## Core Components

- **Generation Engine**: Orchestrates the multi-phase prompt generation process.
- **Provider Registry**: A unified abstraction layer for all external LLM APIs.
- **Learning Engine**: Processes user feedback to adapt and improve ranking over time.
- **Ranking System**: Scores and ranks prompts based on quality and learned weights.
- **Storage Layer**: A local SQLite database that stores prompts, feedback, and vector embeddings.

## Alchemical Process

The core of Prompt Alchemy is its three-phase transformation process:

1.  **Prima Materia**: Extracts the raw essence and core concepts from an idea.
2.  **Solutio**: Dissolves rigid structures into natural, flowing, human-readable language.
3.  **Coagulatio**: Crystallizes the prompt into a precise, production-ready form.

This process allows for leveraging the unique strengths of different AI providers at each stage of refinement.

## Storage Layer

The storage layer uses **SQLite** for its simplicity, performance, and portability. All data, including prompts, metrics, and vector embeddings, is stored in a single database file.

### Recent Storage Enhancements

- **Complete API Implementation**: Fully implemented ListPrompts, GetPrompt, and SearchPrompts methods
- **Enhanced Model Tracking**: New ModelMetadata table tracks detailed usage metrics including:
  - Token usage (input, output, total)
  - Processing time and performance metrics
  - Cost tracking in USD
  - Model and provider versions
- **Improved Search**: Text-based search across prompt content and original input
- **Better Pagination**: Proper pagination support for large prompt collections

### Core Storage Features

- **Vector Embeddings**: Semantic search using embeddings stored directly in SQLite
- **Prompt Lifecycle**: Complete tracking from creation to usage analytics
- **Performance Metrics**: Real-time tracking of token costs and processing time
- **Relationship Tracking**: Parent-child relationships for prompt derivations

For a detailed, up-to-date view of the database structure, please see the **[Database Schema Reference]({{ site.baseurl }}/database)**.

## Learning System

The learning system is designed to improve prompt ranking over time by analyzing user feedback.

- **Feedback Collection**: The `record_feedback` MCP tool allows users or agents to submit effectiveness scores for prompts.
- **Nightly Training**: The `nightly` command processes this feedback, identifies correlations between prompt features and success, and updates the ranking weights in the `config.yaml` file.
- **Adaptive Ranking**: The `Ranking Engine` uses these updated weights to provide more relevant search results over time.

For more details, see the **[Learning Mode Guide]({{ site.baseurl }}/learning-mode)**.

## Server Integrations

Prompt Alchemy offers two distinct server modes for programmatic integration.

### 1. MCP Server (`serve` command)

This server communicates over **stdin/stdout** using the Model Context Protocol (MCP). It is designed for deep integration with a single AI agent or parent application.

- **[MCP Integration Guide]({{ site.baseurl }}/mcp-integration)**
- **[MCP API Reference]({{ site.baseurl }}/mcp-api-reference)**

### 2. HTTP Server (`http-server` command)

This server exposes a **RESTful API** over HTTP, allowing for broader integration with web services and other clients.

- **[HTTP API Reference]({{ site.baseurl }}/http-api-reference)**

## Configuration System

The system uses a hierarchical configuration system that reads from a `config.yaml` file, environment variables, and command-line flags, providing flexible setup options.

## Security

The current security model is simple and designed for local, trusted environments.

- **API Key Handling**: API keys are loaded from the configuration file or environment variables and are passed directly to the provider SDKs. They are not stored in the database.
- **No Network Exposure (Default)**: The CLI and MCP server do not open any network ports by default, minimizing the attack surface.
- **HTTP Server**: The `http-server` command opens a network port and should be deployed behind a reverse proxy with proper security controls (like TLS and authentication) in a production environment.

## Performance

- **Concurrency**: The `generate` command can process alchemical phases in parallel to speed up generation.
- **Database**: The SQLite database is optimized with indexes on frequently queried columns.
- **No Caching**: The current version does not implement a response caching layer.

## Deployment

Deployment strategies vary by mode.

-   **On-Demand/CLI**: Deployment involves placing the single `prompt-alchemy` binary in the system's `PATH`.
-   **Server Modes**: The `serve` or `http-server` commands can be run as persistent services using tools like `systemd` or within a Docker container. See the **[Deployment Guide]({{ site.baseurl }}/deployment-guide)** for detailed examples.
