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
- `generate` - Generate new prompts using phased approach
- `batch` - Generate multiple prompts efficiently
- `search` - Search existing prompts
- `optimize` - Optimize existing prompts using AI
- `update` - Update prompt metadata
- `delete` - Delete prompts
- `metrics` - View analytics and metrics
- `validate` - Validate configuration
- `config` - Show/manage configuration
- `providers` - List provider status
- `migrate` - Migrate database and embeddings
- `serve` - Start MCP server for AI agents
- `test` - Test prompt variants (not yet implemented)
- `version` - Show version information

## Generate Command

The core command for creating new prompts.

### Basic Usage
```bash
prompt-alchemy generate "Your prompt idea"
```

### Flags
- `--persona, -p` - Generation persona (code, writing, analysis, generic)
- `--phases` - Alchemical phases to run (prima-materia,solutio,coagulatio)
- `--provider` - Override provider for all phases
- `--count, -c` - Number of prompts to generate
- `--temperature, -t` - Generation temperature (0.0-1.0)
- `--max-tokens, -m` - Maximum tokens per prompt
- `--target-model` - Target model family for optimization
- `--tags` - Comma-separated tags
- `--output, -o` - Output format (text, json, yaml)

### Examples
```bash
# Generate with specific persona
prompt-alchemy generate "Create a Python web scraper" --persona code

# Use specific phases only
prompt-alchemy generate "Essay outline" --phases prima-materia,solutio

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
- `--semantic` - Use semantic search (requires embeddings)
- `--similarity` - Minimum similarity threshold (0.0-1.0)
- `--phase` - Filter by phase (idea, human, precision)
- `--provider` - Filter by provider
- `--model` - Filter by model
- `--tags` - Filter by tags (comma-separated)
- `--since` - Filter by date (YYYY-MM-DD)
- `--limit` - Maximum results (default: 10)
- `--output` - Output format (text, json)

### Examples
```bash
# Semantic search
prompt-alchemy search "authentication flow" --semantic

# Filter by phase and provider
prompt-alchemy search "API" --phase coagulatio --provider openai

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
- `--phase` - Filter by phase
- `--provider` - Filter by provider
- `--since` - Filter by creation date (YYYY-MM-DD)
- `--limit` - Maximum number of prompts to analyze (default: 100)
- `--report` - Generate report (daily, weekly, monthly)
- `--output` - Output format (text, json)

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
prompt-alchemy optimize --prompt "Your prompt" --task "Task description"
```

### Flags
- `--prompt, -p` - Prompt to optimize (required)
- `--task, -t` - Task description for testing (required)
- `--persona` - AI persona (code, writing, analysis, generic)
- `--target-model` - Target model for optimization
- `--provider` - Provider to use for optimization
- `--judge-provider` - Provider to use for evaluation
- `--max-iterations` - Maximum optimization iterations (default: 5)
- `--target-score` - Target quality score 1-10 (default: 8.5)
- `--embedding-dimensions` - Embedding dimensions (default: 1536)

### Examples
```bash
# Basic optimization
prompt-alchemy optimize -p "Write unit tests" -t "Testing React components"

# With specific target
prompt-alchemy optimize -p "API prompt" -t "Generate REST API" --target-score 9.0 --max-iterations 5

# Use different providers
prompt-alchemy optimize -p "Create docs" -t "API documentation" --provider anthropic --judge-provider openai
```

## Batch Command

Generate multiple prompts efficiently using batch processing.

### Basic Usage
```bash
prompt-alchemy batch --file inputs.json
```

### Flags
- `--file, -f` - Input file path (JSON, CSV, or text)
- `--format` - Input format (json, csv, text, auto)
- `--output, -o` - Output file path
- `--workers, -w` - Number of concurrent workers (default: 3)
- `--timeout` - Timeout per job in seconds (default: 300)
- `--dry-run` - Validate inputs without generating
- `--progress` - Show progress bar (default: true)
- `--resume` - Resume from previous batch results file
- `--skip-errors` - Continue processing on errors
- `--interactive, -i` - Interactive batch input mode

### Examples
```bash
# Process JSON file with multiple workers
prompt-alchemy batch -f inputs.json -w 5

# CSV input with custom output
prompt-alchemy batch -f prompts.csv -o results.json

# Dry run to validate
prompt-alchemy batch -f inputs.json --dry-run

# Interactive mode
prompt-alchemy batch -i
```

## Validate Command

Validate and optimize configuration settings.

### Basic Usage
```bash
prompt-alchemy validate
```

### Flags
- `--fix` - Automatically fix issues where possible
- `--output` - Output format (text, json)
- `--verbose` - Show detailed validation information

### Examples
```bash
# Basic validation
prompt-alchemy validate

# Auto-fix issues
prompt-alchemy validate --fix

# Detailed validation with JSON output
prompt-alchemy validate --verbose --output json
```

## Migrate Command

Migrate prompts to use standardized embedding dimensions.

### Basic Usage
```bash
prompt-alchemy migrate
```

### Flags
- `--dry-run` - Preview migration without making changes
- `--batch-size` - Number of prompts to process in each batch (default: 10)
- `--force` - Force migration even if already completed

### Examples
```bash
# Preview migration
prompt-alchemy migrate --dry-run

# Run migration with custom batch size
prompt-alchemy migrate --batch-size 25

# Force migration
prompt-alchemy migrate --force
```

## Version Command

Show version and build information.

### Basic Usage
```bash
prompt-alchemy version
```

### Flags
- `--short, -s` - Show only version number
- `--json, -j` - Output version information as JSON

### Examples
```bash
# Full version information
prompt-alchemy version

# Just version number
prompt-alchemy version --short

# JSON output
prompt-alchemy version --json
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

## Serve Command

Start MCP (Model Context Protocol) server for AI agent integration.

### Basic Usage
```bash
prompt-alchemy serve
```

The MCP server provides 17 tools for AI agents to interact with Prompt Alchemy.

### Examples
```bash
# Start MCP server
prompt-alchemy serve

# Start with debug logging
prompt-alchemy --log-level debug serve
```

### Available MCP Tools
- `generate_prompts` - Generate AI prompts
- `batch_generate_prompts` - Batch prompt generation
- `search_prompts` - Search existing prompts
- `get_prompt_by_id` - Get prompt details
- `optimize_prompt` - Optimize prompts
- `update_prompt` - Update prompt metadata
- `delete_prompt` - Delete prompts
- `track_prompt_relationship` - Track relationships
- `get_metrics` - Get performance metrics
- `get_database_stats` - Get database statistics
- `run_lifecycle_maintenance` - Run maintenance
- `get_providers` - List providers
- `test_providers` - Test connectivity
- `get_config` - View configuration
- `validate_config` - Validate configuration
- `get_version` - Get version info

## Advanced Features

### Personas

Personas optimize generation for specific use cases:

- **code** - Programming and technical prompts
- **writing** - Creative and content writing
- **analysis** - Data analysis and research
- **generic** - General-purpose (default)

### Alchemical Phases

Each phase represents a transformation in the alchemical process:

1. **prima-materia** (First Matter) - Raw essence extraction and exploration - brainstorming and capturing the core idea
2. **solutio** (Dissolution) - Dissolution into natural, flowing language - making it conversational and human-readable
3. **coagulatio** (Crystallization) - Crystallization into precise, potent form - refining for technical accuracy and clarity

### Provider Selection

Override default providers:

```bash
# Single provider for all phases
prompt-alchemy generate "Prompt" --provider openai

# Per-phase configuration (in config.yaml)
phases:
  prima-materia:
    provider: openai      # Extract raw essence
  solutio:
    provider: anthropic   # Dissolve into natural form
  coagulatio:
    provider: google      # Crystallize to perfection
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

Use the batch command for efficient processing:

```bash
# Process from JSON file
prompt-alchemy batch -f inputs.json

# Process from CSV with multiple workers
prompt-alchemy batch -f prompts.csv -w 5

# Interactive batch mode
prompt-alchemy batch -i
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
All configuration options can be set via environment variables with the `PROMPT_ALCHEMY_` prefix:
- `PROMPT_ALCHEMY_DATA_DIR` - Data directory path
- `PROMPT_ALCHEMY_LOG_LEVEL` - Logging level
- `PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY` - OpenAI API key
- `PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY` - Anthropic API key
- `PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY` - Google API key
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE` - Default temperature
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_MAX_TOKENS` - Default max tokens

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
   - Use faster models (gpt-4o-mini, gemini-2.5-flash)
   - Disable parallel processing if needed

### Debug Mode

```bash
# Enable debug logging
export PROMPT_ALCHEMY_LOG_LEVEL=debug
prompt-alchemy generate "Test"

# Or use command-line flag
prompt-alchemy --log-level debug generate "Test"
```

## Next Steps

- Explore [Architecture](./architecture) for technical details
- Read [API Reference](./api-reference) for development
- Join discussions on GitHub