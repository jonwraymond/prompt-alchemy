---
layout: default
title: Getting Started
---

# Getting Started with Prompt Alchemy

Welcome to Prompt Alchemy! This guide will help you get up and running quickly.

## Prerequisites

Before you begin, ensure you have:

- Go 1.24 or higher installed
- Git for cloning the repository
- At least one LLM provider API key (OpenAI, Anthropic, Google, OpenRouter, or Ollama setup)
- SQLite (usually pre-installed on most systems)

## Quick Installation

### Local Build

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Build the CLI tool
make build

# Set up configuration
make setup

# Edit configuration with your API keys
nano ~/.prompt-alchemy/config.yaml
```

### Docker Deployment

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Set up environment
cp docker.env.example .env
# Edit .env with your API keys

# Build and start
make docker-build
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs prompt-alchemy
```

For details on deploying with Docker, see the [Deployment Guide](./deployment-guide.md).

## Your First Prompt

Once configured, generate your first prompt:

```bash
./prompt-alchemy generate "Create a REST API endpoint for user management"
```

This will:
1. Process your request through three alchemical phases:
   - **prima-materia**: Brainstorm and extract the core idea
   - **solutio**: Transform into natural, conversational language
   - **coagulatio**: Refine for precision and technical accuracy
2. Store the results in a local database
3. Display the generated prompts with rankings

## Basic Commands

For complete command documentation, see the [CLI Reference](./cli-reference).

### Generate Prompts
```bash
# Basic generation
./prompt-alchemy generate "Your prompt idea here"

# With specific persona
./prompt-alchemy generate "Your idea" --persona code

# Using specific provider
./prompt-alchemy generate "Your idea" --provider openai

# Generate multiple variants
./prompt-alchemy generate "Your idea" --count 5
```

### Search Prompts
```bash
# Text search
./prompt-alchemy search "API endpoint"

# Semantic search (uses embeddings)
./prompt-alchemy search "user authentication" --semantic

# Filter by date
./prompt-alchemy search "API" --since 2024-01-01
```

## Configuration Basics

Your configuration file (`~/.prompt-alchemy/config.yaml`) controls:

- **API Keys**: For each provider
- **Default Models**: Which models to use
- **Alchemical Phases**: Which provider handles each transformation phase
- **Generation Settings**: Temperature, max tokens, etc.

Example configuration:
```yaml
providers:
  openai:
    api_key: "sk-..."
    model: "o4-mini"
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-3-5-sonnet-20241022"

phases:
  prima-materia:
    provider: openai      # Extract raw essence
  solutio:
    provider: anthropic   # Dissolve into natural form
  coagulatio:
    provider: google      # Crystallize to perfection

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-4-sonnet-20250522"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

## Automated Learning (Optional)

Prompt Alchemy includes a learning-to-rank system that improves prompt recommendations over time by analyzing user interactions.

```bash
# Run the nightly training job manually
./prompt-alchemy nightly

# Set up a daily scheduled job (e.g., at 2 AM)
./prompt-alchemy schedule --time "0 2 * * *"
```

The `schedule` command automatically detects your OS (macOS or Linux) and uses the appropriate system scheduler (launchd or cron).

## Next Steps

- Read the [Installation Guide](./installation) for detailed setup.
- Explore the [Usage Guide](./usage) for advanced features.
- Learn about the [Architecture](./architecture) to understand how it works.
- Understand the [Database Schema](./database-schema) and implementation.
- Set up [MCP Integration](./mcp-integration) for AI assistant connectivity.
- Review the [MCP API Reference](./mcp-api-reference) for detailed tool reference.

## Getting Help

If you run into issues:

1. Validate your configuration: `./prompt-alchemy validate`
2. Test your providers: `./prompt-alchemy test-providers`
3. See logs in `~/.prompt-alchemy/logs/`
4. Open an issue on GitHub

Happy prompting! 🚀