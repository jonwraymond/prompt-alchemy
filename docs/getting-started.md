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

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Build the CLI tool
make build

# Set up configuration
make setup

# Edit configuration with your API keys
nano ~/.github.com/jonwraymond/prompt-alchemy/config.yaml
```

## Your First Prompt

Once configured, generate your first prompt:

```bash
./prompt-alchemy generate "Create a REST API endpoint for user management"
```

This will:
1. Process your request through three phases (idea, human, precision)
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

### View Analytics
```bash
# View daily metrics
./prompt-alchemy metrics --report daily

# View provider usage
./prompt-alchemy metrics --report provider

# Export as JSON
./prompt-alchemy metrics --output json > metrics.json
```

## Configuration Basics

Your configuration file (`~/.github.com/jonwraymond/prompt-alchemy/config.yaml`) controls:

- **API Keys**: For each provider
- **Default Models**: Which models to use
- **Phases**: Which provider handles each phase
- **Generation Settings**: Temperature, max tokens, etc.

Example configuration:
```yaml
providers:
  openai:
    api_key: "sk-..."
    model: "gpt-4o-mini"
  claude:
    api_key: "sk-ant-..."
    model: "claude-3-5-sonnet-20241022"
  gemini:
    api_key: "..."
    model: "gemini-2.5-flash"

phases:
  idea:
    provider: "openai"
  human:
    provider: "claude"
  precision:
    provider: "gemini"

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-3-5-sonnet-20241022"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

## Next Steps

- Read the [Installation Guide](./installation) for detailed setup
- Explore the [Usage Guide](./usage) for advanced features
- Learn about [Architecture](./architecture) to understand how it works
- View [Diagrams](./diagrams) for visual architecture overview
- Understand the [Database](./database) schema and implementation
- Set up [MCP Integration](./mcp-integration) for AI assistant connectivity
- Review [MCP Tools](./mcp-tools) for detailed tool reference
- Check [API Reference](./api-reference) for extending functionality

## Getting Help

If you run into issues:

1. Check the configuration: `./prompt-alchemy config`
2. Verify providers: `./prompt-alchemy providers`
3. Enable debug logging: `./prompt-alchemy --log-level debug`
4. Open an issue on GitHub

Happy prompting! 🚀