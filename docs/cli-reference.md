---
layout: default
title: CLI Reference
---

# CLI Reference

Complete documentation for all Prompt Alchemy command-line interface options, flags, and usage patterns.

## Table of Contents

1. [Global Options](#global-options)
2. [Commands Overview](#commands-overview)
3. [generate](#generate)
4. [batch](#batch)
5. [search](#search)
6. [optimize](#optimize)
7. [update](#update)
8. [delete](#delete)
9. [metrics](#metrics)
10. [validate](#validate)
11. [config](#config)
12. [providers](#providers)
13. [migrate](#migrate)
14. [serve](#serve)
15. [test](#test)
16. [version](#version)
17. [Environment Variables](#environment-variables)
18. [Configuration Files](#configuration-files)

## Global Options

These flags are available for all commands:

| Flag | Default | Description |
|------|---------|-------------|
| `--config` | `$HOME/.github.com/jonwraymond/prompt-alchemy/config.yaml` | Configuration file path |
| `--data-dir` | `$HOME/.prompt-alchemy` | Data directory for database and storage |
| `--log-level` | `info` | Logging level (debug, info, warn, error) |

### Examples

```bash
# Use custom config file
prompt-alchemy --config /path/to/config.yaml generate "API design"

# Set data directory
prompt-alchemy --data-dir /custom/data generate "prompt"

# Enable debug logging
prompt-alchemy --log-level debug generate "test prompt"
```

## Commands Overview

| Command | Description |
|---------|-------------|
| `generate` | Generate AI prompts using phased approach (idea → human → precision) |
| `batch` | Generate multiple prompts efficiently using batch processing |
| `search` | Search existing prompts using text-based or semantic search |
| `optimize` | Optimize prompts using AI-powered meta-prompting and self-improvement |
| `update` | Update an existing prompt's content, tags, or parameters |
| `delete` | Delete an existing prompt and all associated data |
| `metrics` | View prompt performance metrics and analytics |
| `validate` | Validate and optimize Prompt Alchemy configuration |
| `config` | Manage Prompt Alchemy configuration |
| `providers` | List available providers and their capabilities |
| `migrate` | Migrate prompts to use standardized embedding dimensions |
| `serve` | Start MCP server for AI agents |
| `test` | Test prompt variants (A/B testing) - Not yet implemented |
| `version` | Show version information |

## generate

Generate AI prompts using a phased approach (idea → human → precision).

### Usage
```bash
prompt-alchemy generate [flags] [input]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--phases` | `-p` | string | `idea,human,precision` | Phases to use (comma-separated) |
| `--count` | `-c` | int | `3` | Number of prompt variants to generate |
| `--temperature` | `-t` | float | `0.7` | Temperature for generation (0.0-1.0) |
| `--max-tokens` | `-m` | int | `2000` | Maximum tokens for generation |
| `--tags` | | string | | Tags for the prompt (comma-separated) |
| `--context` | | stringSlice | | Context files to include |
| `--provider` | | string | | Override default provider for all phases |
| `--output` | `-o` | string | `text` | Output format (text, json, yaml) |
| `--save` | | bool | `true` | Save generated prompts to database |
| `--persona` | | string | `code` | AI persona (code, writing, analysis, generic) |
| `--target-model` | | string | | Target model family for optimization |
| `--embedding-dimensions` | | int | `1536` | Embedding dimensions for similarity search |

### Examples

```bash
# Basic generation
prompt-alchemy generate "Create a REST API for user management"

# Custom phases and count
prompt-alchemy generate -p "idea,precision" -c 5 "Database schema design"

# With specific provider and tags
prompt-alchemy generate --provider openai --tags "api,backend" "Authentication system"

# Include context files
prompt-alchemy generate --context schema.sql --context requirements.txt "API design"

# Generate for specific persona
prompt-alchemy generate --persona writing "Marketing copy for SaaS product"

# JSON output format
prompt-alchemy generate -o json "Code review checklist"

# Target specific model family
prompt-alchemy generate --target-model claude-3-opus "Complex reasoning task"
```

## batch

Generate multiple prompts efficiently using batch processing with concurrent workers.

### Usage
```bash
prompt-alchemy batch [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--file` | `-f` | string | | Input file path (JSON, CSV, or text) |
| `--format` | | string | `auto` | Input format (json, csv, text, auto) |
| `--output` | `-o` | string | `batch_TIMESTAMP.json` | Output file path |
| `--workers` | `-w` | int | `3` | Number of concurrent workers |
| `--timeout` | | int | `300` | Timeout per job in seconds |
| `--dry-run` | | bool | `false` | Validate inputs without generating |
| `--progress` | | bool | `true` | Show progress bar |
| `--resume` | | string | | Resume from previous batch results file |
| `--skip-errors` | | bool | `false` | Continue processing on errors |
| `--interactive` | `-i` | bool | `false` | Interactive batch input mode |

### Examples

```bash
# Process JSON file with 5 workers
prompt-alchemy batch -f inputs.json -w 5

# CSV input with custom output
prompt-alchemy batch -f prompts.csv -o results.json

# Dry run to validate inputs
prompt-alchemy batch -f inputs.json --dry-run

# Resume previous batch
prompt-alchemy batch --resume batch_20240110_143022.json

# Interactive mode
prompt-alchemy batch -i

# Skip errors and continue processing
prompt-alchemy batch -f inputs.json --skip-errors
```

## search

Search existing prompts using text-based or semantic search with advanced filtering.

### Usage
```bash
prompt-alchemy search [flags] [query]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--phase` | string | | Filter by phase (idea, human, precision) |
| `--provider` | string | | Filter by provider (openai, anthropic, google, openrouter, ollama) |
| `--model` | string | | Filter by model |
| `--tags` | string | | Filter by tags (comma-separated) |
| `--since` | string | | Filter by creation date (YYYY-MM-DD) |
| `--limit` | int | `10` | Maximum number of results |
| `--semantic` | bool | `false` | Use semantic search with embeddings |
| `--similarity` | float | `0.5` | Minimum similarity threshold (0.0-1.0) |
| `--output` | string | `text` | Output format (text, json) |

### Examples

```bash
# Basic text search
prompt-alchemy search "API design"

# Semantic search with embeddings
prompt-alchemy search --semantic --similarity 0.7 "user authentication"

# Filter by phase and provider
prompt-alchemy search --phase human --provider anthropic "natural language"

# Filter by model
prompt-alchemy search --model "claude-3-5-sonnet" "code generation"

# Filter by tags
prompt-alchemy search --tags "api,backend" "database"

# Filter by date
prompt-alchemy search --since 2024-01-01 "recent prompts"

# Multiple filters combined
prompt-alchemy search --phase precision --provider openai --tags "optimization" --limit 20 "performance"
```

## optimize

Optimize existing prompts using AI-powered meta-prompting and iterative self-improvement.

### Usage
```bash
prompt-alchemy optimize [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--prompt` | `-p` | string | | Prompt to optimize (required) |
| `--task` | `-t` | string | | Task description for testing (required) |
| `--persona` | | string | `code` | AI persona (code, writing, analysis, generic) |
| `--target-model` | | string | | Target model for optimization (auto-detected if not specified) |
| `--max-iterations` | | int | `5` | Maximum optimization iterations |
| `--target-score` | | float | `8.5` | Target quality score (1-10) |
| `--provider` | | string | | Provider to use for optimization |
| `--judge-provider` | | string | | Provider to use for evaluation (defaults to main provider) |
| `--embedding-dimensions` | | int | `1536` | Embedding dimensions for similarity search |

### Examples

```bash
# Basic optimization
prompt-alchemy optimize -p "Write code" -t "Generate Python function"

# With specific persona and target model
prompt-alchemy optimize -p "Create API docs" -t "Document REST endpoints" --persona writing --target-model claude-3-opus

# Multiple iterations with target score
prompt-alchemy optimize -p "Code review" -t "Review JavaScript code" --max-iterations 10 --target-score 9.0

# Use different provider for evaluation
prompt-alchemy optimize -p "Debug code" -t "Find Python bugs" --provider openai --judge-provider anthropic
```

## update

Update an existing prompt's content, tags, or generation parameters.

### Usage
```bash
prompt-alchemy update [flags] <prompt-id>
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--content` | string | | New content for the prompt |
| `--tags` | string | | New tags (comma-separated) |
| `--temperature` | float | `-1` | New temperature (0.0-1.0) |
| `--max-tokens` | int | `-1` | New max tokens |

### Examples

```bash
# Update prompt content
prompt-alchemy update abc123 --content "Updated prompt text"

# Update tags
prompt-alchemy update abc123 --tags "api,backend,v2"

# Update temperature
prompt-alchemy update abc123 --temperature 0.8

# Update multiple properties
prompt-alchemy update abc123 --content "New content" --tags "updated,improved" --temperature 0.5 --max-tokens 3000
```

## delete

Delete an existing prompt and all its associated data with safety checks.

### Usage
```bash
prompt-alchemy delete [flags] [prompt-id]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | bool | `false` | Skip confirmation prompt |
| `--all` | bool | `false` | Delete ALL prompts (DANGEROUS!) |

### Examples

```bash
# Delete specific prompt with confirmation
prompt-alchemy delete abc123-def456-789

# Force delete without confirmation
prompt-alchemy delete --force abc123-def456-789

# Delete all prompts (dangerous!)
prompt-alchemy delete --all --force
```

## metrics

View prompt performance metrics and analytics with comprehensive reporting.

### Usage
```bash
prompt-alchemy metrics [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--phase` | string | | Filter by phase (idea, human, precision) |
| `--provider` | string | | Filter by provider |
| `--since` | string | | Filter by creation date (YYYY-MM-DD) |
| `--limit` | int | `100` | Maximum number of prompts to analyze |
| `--output` | string | `text` | Output format (text, json) |
| `--report` | string | | Generate report (daily, weekly, monthly) |

### Examples

```bash
# Basic metrics
prompt-alchemy metrics

# Filter by phase and provider
prompt-alchemy metrics --phase human --provider anthropic

# Generate weekly report
prompt-alchemy metrics --report weekly

# Recent metrics in JSON format
prompt-alchemy metrics --since 2024-01-01 --output json

# Limited analysis with specific filters
prompt-alchemy metrics --provider openai --limit 50 --output json
```

## validate

Validate and optimize Prompt Alchemy configuration with automatic fixing capabilities.

### Usage
```bash
prompt-alchemy validate [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--fix` | bool | `false` | Automatically fix issues where possible |
| `--output` | string | `text` | Output format (text, json) |
| `--verbose` | bool | `false` | Show detailed validation information |

### Examples

```bash
# Basic validation
prompt-alchemy validate

# Auto-fix issues
prompt-alchemy validate --fix

# Detailed validation with JSON output
prompt-alchemy validate --verbose --output json
```

## config

Manage Prompt Alchemy configuration settings and initialization.

### Usage
```bash
prompt-alchemy config [subcommand]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `show` | Show current configuration (default) |
| `init` | Initialize configuration file |

### Examples

```bash
# Show current configuration
prompt-alchemy config
prompt-alchemy config show

# Initialize configuration file
prompt-alchemy config init

# Show config with custom config file
prompt-alchemy --config /path/to/config.yaml config
```

## providers

List configured providers and their capabilities, configuration status, and phase assignments.

### Usage
```bash
prompt-alchemy providers [flags]
```

### Examples

```bash
# List all providers
prompt-alchemy providers

# With custom configuration
prompt-alchemy --config custom-config.yaml providers
```

## migrate

Migrate prompts to use standardized embedding dimensions and perform data migrations.

### Usage
```bash
prompt-alchemy migrate [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | bool | `false` | Preview migration without making changes |
| `--batch-size` | int | `10` | Number of prompts to process in each batch |
| `--force` | bool | `false` | Force migration even if already completed |

### Examples

```bash
# Preview migration
prompt-alchemy migrate --dry-run

# Run migration with custom batch size
prompt-alchemy migrate --batch-size 25

# Force migration
prompt-alchemy migrate --force
```

## serve

Start MCP (Model Context Protocol) server for AI agents with 17 available tools.

### Usage
```bash
prompt-alchemy serve [flags]
```

### Available MCP Tools

The MCP server provides 17 tools for AI agent integration:

1. **generate_prompts** - Generate AI prompts with phased approach
2. **batch_generate_prompts** - Generate multiple prompts efficiently  
3. **search_prompts** - Search existing prompts
4. **get_prompt_by_id** - Get detailed prompt information
5. **optimize_prompt** - Optimize prompts using AI
6. **update_prompt** - Update existing prompt
7. **delete_prompt** - Delete existing prompt
8. **track_prompt_relationship** - Track prompt relationships
9. **get_metrics** - Get prompt performance metrics
10. **get_database_stats** - Get database statistics
11. **run_lifecycle_maintenance** - Run database maintenance
12. **get_providers** - List available providers
13. **test_providers** - Test provider connectivity
14. **get_config** - View current configuration
15. **validate_config** - Validate configuration
16. **get_version** - Get version information

### Examples

```bash
# Start MCP server
prompt-alchemy serve

# Start with custom configuration
prompt-alchemy --config custom-config.yaml serve
```

## test

Test prompt variants using A/B testing methodology.

### Usage
```bash
prompt-alchemy test [flags]
```

**Status**: Not yet implemented

### Examples

```bash
# A/B test prompt variants (when implemented)
prompt-alchemy test
```

## version

Show version information including build details and system metadata.

### Usage
```bash
prompt-alchemy version [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--short` | `-s` | bool | `false` | Show only version number |
| `--json` | `-j` | bool | `false` | Output version information as JSON |

### Examples

```bash
# Show full version information
prompt-alchemy version

# Show only version number
prompt-alchemy version --short

# JSON output
prompt-alchemy version --json
```

## Environment Variables

All configuration options can be set via environment variables with the `PROMPT_ALCHEMY_` prefix:

### Core Settings
- `PROMPT_ALCHEMY_DATA_DIR` - Data directory path
- `PROMPT_ALCHEMY_LOG_LEVEL` - Logging level

### Provider Configuration
- `PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY` - OpenAI API key
- `PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL` - OpenAI model name
- `PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY` - Anthropic API key
- `PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_MODEL` - Anthropic model name
- `PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY` - Google API key
- `PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MODEL` - Google model name
- `PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY` - OpenRouter API key
- `PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_MODEL` - OpenRouter model name
- `PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL` - Ollama base URL
- `PROMPT_ALCHEMY_PROVIDERS_OLLAMA_MODEL` - Ollama model name
- `PROMPT_ALCHEMY_PROVIDERS_OLLAMA_TIMEOUT` - Ollama timeout

### Generation Settings
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE` - Default temperature
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_MAX_TOKENS` - Default max tokens
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_COUNT` - Default variant count
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_TARGET_MODEL` - Default target model
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_EMBEDDING_MODEL` - Default embedding model
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_EMBEDDING_DIMENSIONS` - Default embedding dimensions

### Example
```bash
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="gpt-4"
export PROMPT_ALCHEMY_GENERATION_DEFAULT_TARGET_MODEL="claude-3-5-sonnet-20241022"
export PROMPT_ALCHEMY_LOG_LEVEL="debug"

prompt-alchemy generate "test prompt"
```

## Configuration Files

### YAML Configuration
Default location: `$HOME/.github.com/jonwraymond/prompt-alchemy/config.yaml`

```yaml
providers:
  openai:
    api_key: "sk-..."
    model: "gpt-4"
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-3-5-sonnet-20241022"
  google:
    api_key: "..."
    model: "gemini-1.5-pro"
  openrouter:
    api_key: "sk-or-..."
    model: "openrouter/auto"
  ollama:
    base_url: "http://localhost:11434"
    model: "gemma3:4b"
    timeout: 120

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-3-5-sonnet-20241022"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536

phases:
  idea:
    provider: "openai"
  human:
    provider: "anthropic"
  precision:
    provider: "google"
```

### Priority Order
1. Command-line flags (highest priority)
2. Environment variables
3. Configuration file
4. Built-in defaults (lowest priority)

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
| 4 | Provider error |
| 5 | Database error |

## Tips and Best Practices

### Performance
- Use `--semantic` search for better relevance when searching large prompt databases
- Set appropriate `--limit` values to avoid overwhelming output
- Use `--dry-run` for migrations and batch operations to preview changes
- Use batch processing for multiple prompt generation to improve efficiency

### Workflow
- Start with `prompt-alchemy config` to verify setup
- Use `prompt-alchemy providers` to check provider status
- Use `prompt-alchemy validate --fix` to optimize configuration
- Generate prompts with `--save=false` for testing
- Use tags consistently for better organization

### Integration
- Use JSON output format (`-o json`) for scripting
- Combine multiple filters in search for precise results
- Use the MCP server (`serve`) for AI agent integration
- Use semantic search with appropriate similarity thresholds

### Debugging
- Enable debug logging with `--log-level debug`
- Use `--dry-run` flags where available
- Check provider status with `providers` command
- Use `validate --verbose` for detailed configuration analysis