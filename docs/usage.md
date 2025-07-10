---
layout: default
title: Usage Guide
---

# Usage Guide

This guide covers all commands and features of Prompt Alchemy.

## Command Overview

```bash
prompt-alchemy [command] [flags]
```

Available commands:
- `generate` - Generate new prompts
- `search` - Search existing prompts
- `metrics` - View analytics and metrics
- `optimize` - Optimize existing prompts
- `providers` - List provider status
- `config` - Show configuration
- `update` - Update prompt metadata
- `delete` - Delete prompts
- `serve` - Start MCP server (experimental)

## Generate Command

The core command for creating new prompts.

### Basic Usage
```bash
prompt-alchemy generate "Your prompt idea"
```

### Flags
- `--persona, -p` - Generation persona (code, writing, analysis, generic)
- `--phases` - Phases to run (idea,human,precision)
- `--provider` - Override provider for all phases
- `--count, -c` - Number of prompts to generate
- `--temperature, -t` - Generation temperature (0.0-1.0)
- `--max-tokens, -m` - Maximum tokens per prompt
- `--target-model` - Target model family (gpt, claude, gemini)
- `--tags` - Comma-separated tags
- `--output, -o` - Output format (text, json, yaml)

### Examples
```bash
# Generate with specific persona
prompt-alchemy generate "Create a Python web scraper" --persona code

# Use specific phases only
prompt-alchemy generate "Essay outline" --phases idea,human

# Generate multiple variants
prompt-alchemy generate "Product description" --count 5 --temperature 0.9

# Tag for later retrieval
prompt-alchemy generate "API docs" --tags "documentation,api,rest"

# Output as JSON
prompt-alchemy generate "Test prompt" --output json > prompt.json
```

## Search Command

Find prompts using text or semantic search.

### Basic Usage
```bash
prompt-alchemy search "search query"
```

### Flags
- `--semantic, -s` - Use semantic search (requires embeddings)
- `--phase` - Filter by phase
- `--provider` - Filter by provider
- `--tags` - Filter by tags
- `--since` - Filter by date (YYYY-MM-DD)
- `--limit, -l` - Maximum results
- `--output, -o` - Output format

### Examples
```bash
# Semantic search
prompt-alchemy search "authentication flow" --semantic

# Filter by phase and provider
prompt-alchemy search "API" --phase precision --provider openai

# Search with tags
prompt-alchemy search "docs" --tags "api,reference"

# Recent prompts
prompt-alchemy search --since 2024-01-01 --limit 10
```

## Metrics Command

View analytics and usage statistics.

### Basic Usage
```bash
prompt-alchemy metrics
```

### Flags
- `--report, -r` - Report type (summary, daily, provider, phase)
- `--since` - Start date for metrics
- `--output, -o` - Output format

### Examples
```bash
# Daily activity report
prompt-alchemy metrics --report daily

# Provider usage breakdown
prompt-alchemy metrics --report provider

# Export last month's metrics
prompt-alchemy metrics --since 2024-01-01 --output json
```

### Available Reports
1. **Summary** - Overall statistics
2. **Daily** - Activity by day
3. **Provider** - Usage by provider
4. **Phase** - Distribution by phase
5. **Cost** - Cost analysis

## Optimize Command

Use AI to improve existing prompts.

### Basic Usage
```bash
prompt-alchemy optimize "Your prompt to optimize"
```

### Flags
- `--task` - Task description for context
- `--persona, -p` - Optimization persona
- `--provider` - LLM provider for optimization
- `--judge-provider` - Provider for evaluation
- `--max-iterations` - Maximum optimization cycles
- `--target-score` - Target quality score (1-10)

### Examples
```bash
# Basic optimization
prompt-alchemy optimize "Write unit tests" --task "Testing React components"

# With specific target
prompt-alchemy optimize "API prompt" --target-score 9.0 --max-iterations 5

# Use different providers
prompt-alchemy optimize "Prompt" --provider anthropic --judge-provider openai
```

## Update Command

Modify existing prompt metadata.

### Basic Usage
```bash
prompt-alchemy update [prompt-id] [flags]
```

### Flags
- `--content` - Update prompt content
- `--tags` - Update tags
- `--temperature` - Update temperature
- `--max-tokens` - Update max tokens

### Examples
```bash
# Update tags
prompt-alchemy update 123e4567-e89b-12d3 --tags "updated,important"

# Modify parameters
prompt-alchemy update 123e4567-e89b-12d3 --temperature 0.8 --max-tokens 3000
```

## Delete Command

Remove prompts from storage.

### Basic Usage
```bash
prompt-alchemy delete [prompt-id]
```

### Flags
- `--all` - Delete all prompts (requires confirmation)
- `--force, -f` - Skip confirmation

### Examples
```bash
# Delete specific prompt
prompt-alchemy delete 123e4567-e89b-12d3

# Delete all (with confirmation)
prompt-alchemy delete --all
```

## Advanced Features

### Personas

Personas optimize generation for specific use cases:

- **code** - Programming and technical prompts
- **writing** - Creative and content writing
- **analysis** - Data analysis and research
- **generic** - General-purpose (default)

### Phases

Each phase serves a specific purpose:

1. **idea** - Brainstorming and exploration
2. **human** - Natural, conversational refinement
3. **precision** - Technical accuracy and clarity

### Provider Selection

Override default providers:

```bash
# Single provider for all phases
prompt-alchemy generate "Prompt" --provider openai

# Per-phase configuration (in config.yaml)
phases:
  idea:
    provider: openai
  human:
    provider: anthropic
  precision:
    provider: google
```

### Embeddings

Enable semantic search and similarity:

```bash
# Configure in config.yaml
embeddings:
  enabled: true
  standard_model: "text-embedding-3-small"
  standard_dimensions: 1536
```

### Batch Processing

Process multiple prompts:

```bash
# From file
cat prompts.txt | xargs -I {} prompt-alchemy generate "{}"

# With parallel processing
prompt-alchemy generate "Base prompt" --count 10 --parallel
```

## Configuration Management

### View Configuration
```bash
prompt-alchemy config
```

### Initialize Configuration
```bash
prompt-alchemy config init
```

### Environment Variables
- `PROMPT_ALCHEMY_CONFIG` - Config file path
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google API key
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Tips and Best Practices

1. **Use Personas** - Match persona to your use case
2. **Tag Prompts** - Organize with meaningful tags
3. **Semantic Search** - More accurate than text search
4. **Optimize Iteratively** - Start with basic, then optimize
5. **Monitor Costs** - Use metrics to track spending
6. **Experiment** - Try different providers and settings

## Troubleshooting

### Common Issues

1. **No results from search**
   - Check if embeddings are enabled
   - Verify prompts exist: `prompt-alchemy metrics`

2. **Provider errors**
   - Verify API keys: `prompt-alchemy providers`
   - Check rate limits and quotas

3. **Slow generation**
   - Reduce max tokens
   - Use faster models (o4-mini, gemini-2.5-flash)
   - Disable parallel processing if needed

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
prompt-alchemy generate "Test" 2> debug.log
```

## Next Steps

- Explore [Architecture](./architecture) for technical details
- Read [API Reference](./api-reference) for development
- Join discussions on GitHub