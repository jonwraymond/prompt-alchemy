# Prompt Alchemy Architecture

## 1. Overview

Prompt Alchemy is a powerful, multi-faceted system designed for the sophisticated generation, management, and optimization of AI prompts. It is built with a modular architecture that supports a phased approach to prompt engineering, multiple Language Learning Model (LLM) providers, and a robust data layer for storage, ranking, and lifecycle management. The system is designed to be extensible, allowing for the addition of new providers, ranking algorithms, and optimization strategies.

<p align="center">
  <img src="assets/prompt-alchemy-logo.png" alt="Prompt Alchemy" width="500"/>
</p>

## 2. Core Components

The system is composed of several key components that work together to provide a comprehensive prompt engineering workflow:

### 2.1. Command-Line Interface (CLI)

- **Location**: `internal/cmd/`
- **Purpose**: The CLI serves as the primary user interface for interacting with the system. It provides commands for generating, searching, and managing prompts, as well as for system configuration and maintenance.

### 2.2. Prompt Engine

- **Location**: `internal/engine/`
- **Purpose**: The Prompt Engine is the heart of the system, responsible for the phased generation of prompts. It orchestrates the entire prompt creation process, from initial idea to final, optimized prompt.

### 2.3. Provider Registry

- **Location**: `internal/providers/`
- **Purpose**: The Provider Registry is an abstraction layer that allows for the seamless integration of multiple LLM providers. It provides a common interface for interacting with different LLMs, making the system provider-agnostic.
- **Supported Providers**:
    - OpenAI (GPT-4, GPT-4o, GPT-3.5) - with embeddings support
    - Anthropic (Claude 3, Claude 3.5) - generation only
    - Google (Gemini) - generation only
    - OpenRouter (Universal API) - with embeddings support
    - Ollama (Local Models) - generation only

### 2.4. Storage Layer

- **Location**: `internal/storage/`
- **Purpose**: The Storage Layer is responsible for the persistent storage of all system data, including prompts, model metadata, and performance metrics. It uses a SQLite database with a sophisticated schema that supports vector embeddings for semantic search and advanced lifecycle management.

### 2.5. Ranking System

- **Location**: `internal/ranking/`
- **Purpose**: The Ranking System evaluates and scores generated prompts based on a variety of factors, including temperature, token efficiency, context relevance, and historical performance. This allows the system to identify the most effective prompts for a given task.

### 2.6. LLM-as-a-Judge Evaluator

- **Location**: `internal/judge/`
- **Purpose**: The LLM-as-a-Judge (LLMJ) Evaluator provides an automated, objective assessment of prompt quality. It uses an LLM to evaluate generated responses against a set of predefined criteria, providing a score and detailed feedback for each prompt.

### 2.7. Meta-Prompt Optimizer

- **Location**: `internal/optimizer/`
- **Purpose**: The Meta-Prompt Optimizer uses an LLM to iteratively refine and improve prompts. It takes an existing prompt and a set of evaluation criteria and generates a new, optimized prompt that is more effective and efficient.

## 3. Data Flow

The data flow within Prompt Alchemy is designed to be a continuous cycle of generation, evaluation, and optimization.

1.  **Prompt Generation**: The user initiates the process by providing a prompt idea to the CLI. The Prompt Engine then uses the configured providers to generate a set of prompt variants through a series of phases.
2.  **Storage and Embedding**: The generated prompts, along with their metadata, are stored in the database. If embeddings are enabled, the system generates a vector embedding for each prompt and stores it in the database.
3.  **Ranking**: The Ranking System scores each prompt based on a variety of factors, and the best prompt is presented to the user.
4.  **Evaluation**: The user can choose to evaluate the generated prompts using the LLM-as-a-Judge Evaluator, which provides a detailed analysis of each prompt's quality.
5.  **Optimization**: Based on the evaluation results, the user can use the Meta-Prompt Optimizer to automatically generate an improved version of the prompt.
6.  **Lifecycle Management**: Over time, the system automatically manages the lifecycle of prompts, decaying the relevance of unused prompts and cleaning up old or ineffective ones.

## 4. Key Data Structures

The system uses a set of well-defined data structures to manage prompts and their associated data.

- **`models.Prompt`**: The core data structure for representing a prompt, including its content, metadata, and embedding.
- **`models.ModelMetadata`**: Stores detailed information about the model used to generate a prompt, including token usage and cost.
- **`models.PromptRanking`**: Contains the ranking scores for a prompt, including temperature, token efficiency, and context relevance.
- **`models.EvaluationResult`**: Stores the results of a prompt evaluation, including the overall score, criteria scores, and detailed feedback.
- **`models.OptimizationResult`**: Contains the results of a prompt optimization, including the original and optimized prompts, and the improvement in score.

## 5. Configuration

The system is configured using a YAML file located at `~/.prompt-alchemy/config.yaml`. This file allows the user to configure the providers, phases, and generation settings.

## 6. Database Schema

The database schema is defined in `internal/storage/schema.sql`. It is designed to support the entire prompt engineering lifecycle, from generation to optimization and lifecycle management. The schema includes tables for prompts, model metadata, metrics, context, and more. It also includes support for vector embeddings, allowing for powerful semantic search capabilities.

## 7. Extensibility

Prompt Alchemy is designed to be extensible, allowing for the addition of new providers, ranking algorithms, and optimization strategies. To add a new provider, you simply need to implement the `Provider` interface and register it with the Provider Registry. New ranking algorithms and optimization strategies can be added by implementing the appropriate interfaces and integrating them into the system.