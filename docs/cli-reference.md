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
4. [search](#search)
5. [optimize](#optimize)
6. [delete](#delete)
7. [update](#update)
8. [metrics](#metrics)
9. [migrate](#migrate)
10. [config](#config)
11. [providers](#providers)
12. [serve](#serve)
13. [Environment Variables](#environment-variables)
14. [Configuration Files](#configuration-files)

## Global Options

These flags are available for all commands:

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | | `$HOME/.prompt-alchemy/config.yaml` | Configuration file path |
| `--data-dir` | | `$HOME/.prompt-alchemy` | Data directory for database and storage |
| `--log-level` | | `info` | Logging level (debug, info, warn, error) |

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
| `generate` | Generate AI prompts using phased approach |
| `search` | Search existing prompts with filters |
| `optimize` | Optimize existing prompts using meta-prompting |
| `delete` | Delete prompts from the database |
| `update` | Update existing prompt properties |
| `metrics` | Analyze prompt performance and usage |
| `migrate` | Migrate database schema or data |
| `config` | Show current configuration |
| `providers` | List configured providers and status |
| `serve` | Start MCP server for IDE integration |

## generate

Generate AI prompts through a sophisticated phased approach.

### Usage
```bash
prompt-alchemy generate [flags] <input>
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
| `--persona` | | string | `code` | AI persona to use (code, writing, analysis, generic) |
| `--target-model` | | string | | Target model family for optimization |
| `--embedding-dimensions` | | int | `0` | Embedding dimensions for similarity search |

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

## search

Search existing prompts with various filters and options.

### Usage
```bash
prompt-alchemy search [flags] <query>
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--phase` | | string | | Filter by phase (idea, human, precision) |
| `--provider` | | string | | Filter by provider (openai, anthropic, google, openrouter) |
| `--model` | | string | | Filter by model |
| `--tags` | | string | | Filter by tags (comma-separated) |
| `--since` | | string | | Filter by creation date (YYYY-MM-DD) |
| `--limit` | | int | `10` | Maximum number of results |
| `--semantic` | | bool | `false` | Use semantic search with embeddings |
| `--output` | | string | `text` | Output format (text, json) |

### Examples

```bash
# Basic text search
prompt-alchemy search "API design"

# Semantic search with embeddings
prompt-alchemy search --semantic "user authentication"

# Filter by phase and provider
prompt-alchemy search --phase human --provider anthropic "natural language"

# Filter by model
prompt-alchemy search --model "o4-mini" "code generation"

# Filter by tags
prompt-alchemy search --tags "api,backend" "database"

# Filter by date
prompt-alchemy search --since 2024-01-01 "recent prompts"

# Limit results and JSON output
prompt-alchemy search --limit 5 --output json "REST API"

# Multiple filters combined
prompt-alchemy search --phase precision --provider openai --tags "optimization" --limit 20 "performance"
```

## optimize

Optimize existing prompts using meta-prompting techniques.

### Usage
```bash
prompt-alchemy optimize [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--prompt` | `-p` | string | | Prompt to optimize (required) |
| `--task` | `-t` | string | | Task description for testing (required) |
| `--persona` | | string | `code` | AI persona to use (code, writing, analysis, generic) |
| `--target-model` | | string | | Target model for optimization (auto-detected if not specified) |
| `--max-iterations` | | int | `5` | Maximum optimization iterations |
| `--provider` | | string | | Provider to use for optimization |
| `--judge-provider` | | string | | Provider to use for evaluation (defaults to main provider) |
| `--embedding-dimensions` | | int | `0` | Embedding dimensions for similarity search |

### Examples

```bash
# Basic optimization
prompt-alchemy optimize -p "Write code" -t "Generate Python function"

# With specific persona and target model
prompt-alchemy optimize -p "Create API docs" -t "Document REST endpoints" --persona writing --target-model claude-3-opus

# Multiple iterations with custom provider
prompt-alchemy optimize -p "Code review" -t "Review JavaScript code" --max-iterations 10 --provider anthropic

# Use different provider for evaluation
prompt-alchemy optimize -p "Debug code" -t "Find Python bugs" --provider openai --judge-provider anthropic
```

## delete

Delete prompts from the database with safety checks.

### Usage
```bash
prompt-alchemy delete [flags] <prompt-id>
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--force` | | bool | `false` | Skip confirmation prompt |
| `--all` | | bool | `false` | Delete ALL prompts (DANGEROUS!) |

### Examples

```bash
# Delete specific prompt with confirmation
prompt-alchemy delete abc123-def456-789

# Force delete without confirmation
prompt-alchemy delete --force abc123-def456-789

# Delete all prompts (dangerous!)
prompt-alchemy delete --all --force
```

## update

Update existing prompt properties and metadata.

### Usage
```bash
prompt-alchemy update [flags] <prompt-id>
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--content` | | string | | New content for the prompt |
| `--tags` | | string | | New tags (comma-separated) |
| `--max-tokens` | | int | `-1` | New max tokens |

### Examples

```bash
# Update prompt content
prompt-alchemy update abc123 --content "Updated prompt text"

# Update tags
prompt-alchemy update abc123 --tags "api,backend,v2"

# Update max tokens
prompt-alchemy update abc123 --max-tokens 4000

# Update multiple properties
prompt-alchemy update abc123 --content "New content" --tags "updated,improved" --max-tokens 3000
```

## metrics

Analyze prompt performance and generate usage reports.

### Usage
```bash
prompt-alchemy metrics [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--phase` | | string | | Filter by phase (idea, human, precision) |
| `--provider` | | string | | Filter by provider |
| `--since` | | string | | Filter by creation date (YYYY-MM-DD) |
| `--limit` | | int | `100` | Maximum number of prompts to analyze |
| `--output` | | string | `text` | Output format (text, json) |
| `--report` | | string | | Generate report (daily, weekly, monthly) |

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

## migrate

Migrate database schema or perform data migrations.

### Usage
```bash
prompt-alchemy migrate [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--dry-run` | | bool | `false` | Preview migration without making changes |
| `--batch-size` | | int | `10` | Number of prompts to process in each batch |
| `--force` | | bool | `false` | Force migration even if already completed |

### Examples

```bash
# Preview migration
prompt-alchemy migrate --dry-run

# Run migration with custom batch size
prompt-alchemy migrate --batch-size 25

# Force migration
prompt-alchemy migrate --force
```

## config

Display current configuration and settings.

### Usage
```bash
prompt-alchemy config [flags]
```

### Examples

```bash
# Show current configuration
prompt-alchemy config

# Show config with custom config file
prompt-alchemy --config /path/to/config.yaml config
```

## providers

List configured providers and their status.

### Usage
```bash
prompt-alchemy providers [flags]
```

### Examples

```bash
# List all providers
prompt-alchemy providers

# Check provider status
prompt-alchemy providers --status
```

## serve

Start MCP (Model Context Protocol) server for IDE integration.

### Usage
```bash
prompt-alchemy serve [flags]
```

### Examples

```bash
# Start MCP server
prompt-alchemy serve

# Start with custom port
prompt-alchemy --config custom-config.yaml serve
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

### Generation Settings
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE` - Default temperature
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_MAX_TOKENS` - Default max tokens
- `PROMPT_ALCHEMY_GENERATION_DEFAULT_COUNT` - Default variant count

### Example
```bash
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="o4-mini"
export PROMPT_ALCHEMY_LOG_LEVEL="debug"

prompt-alchemy generate "test prompt"
```

## Configuration Files

### YAML Configuration
Default location: `~/.prompt-alchemy/config.yaml`

```yaml
providers:
  openai:
    api_key: "sk-..."
    model: "o4-mini"
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-sonnet-4-20250514"

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-sonnet-4-20250514"
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
- Use `--dry-run` for migrations to preview changes

### Workflow
- Start with `prompt-alchemy config` to verify setup
- Use `prompt-alchemy providers` to check provider status
- Generate prompts with `--save=false` for testing
- Use tags consistently for better organization

### Integration
- Use JSON output format (`-o json`) for scripting
- Combine multiple filters in search for precise results
- Use the MCP server (`serve`) for IDE integration

### Debugging
- Enable debug logging with `--log-level debug`
- Use `--dry-run` flags where available
- Check provider status with `providers` command