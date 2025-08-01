---
layout: default
title: CLI Reference
---

# CLI Reference

Complete documentation for all Prompt Alchemy command-line interface options, flags, and usage patterns.

## Recent CLI Enhancements (v1.1.0)

- **Enhanced Search**: Improved `search` command with text-based search across content and metadata
- **Better Metrics**: `metrics` command now displays comprehensive model usage and cost data
- **Improved Output**: All commands now support enhanced JSON output with ModelMetadata
- **Storage Completion**: All storage operations now fully implemented (list, get, search)
- **Type Safety**: Consolidated request/response types for better error handling

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
13. [http-server](#http-server)
14. [health](#health)
15. [nightly](#nightly)
16. [schedule](#schedule)
17. [batch](#batch)
18. [validate](#validate)
19. [version](#version)
20. [Environment Variables](#environment-variables)
21. [Configuration Files](#configuration-files)

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
| generate | Generate refined prompts via phases |
| search | Search stored prompts semantically |
| optimize | Optimize prompts using meta-prompting |
| delete | Delete specific prompts |
| update | Update prompt metadata |
| metrics | View prompt metrics and reports |
| migrate | Run database migrations |
| config | Manage configuration |
| providers | List AI providers |
| serve | Start MCP server for AI agent integration |
| http-server | Start HTTP REST API server |
| health | Check the health of a running HTTP server |
| nightly | Run learning training job |
| schedule | Schedule nightly jobs |
| batch | Batch process inputs |
| validate | Validate config/settings |
| version | Display version info |

## generate

Generate refined prompts through the alchemical process.

### Usage
```bash
prompt-alchemy generate <input> [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--phases` | | string | | Comma-separated phases (prima-materia, solutio, coagulatio) |
| `--persona` | | string | | AI persona (code, writing, analysis, generic) |
| `--auto-select` | | bool | `false` | Automatically select best variant |
| `--count` | | int | `3` | Number of variants to generate |
| `--temperature` | | float | `0.7` | Generation temperature |
| `--max-tokens` | | int | `2000` | Maximum tokens per response |
| `--tags` | | string | | Comma-separated tags |
| `--context` | | []string | | Additional context strings |
| `--provider` | | string | | Override default provider |

### Examples

```bash
# Basic generation
prompt-alchemy generate "Create a REST API endpoint"

# With specific phases
prompt-alchemy generate "API design" --phases=prima-materia,coagulatio --auto-select

# With persona and multiple variants
prompt-alchemy generate "Write a blog post" --persona=writing --count=5

# With custom parameters
prompt-alchemy generate "Debug code" --temperature=0.8 --max-tokens=1500

# With tags and context
prompt-alchemy generate "Database query" --tags="sql,postgres" --context="PostgreSQL 15"
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
| `--phase` | | string | | Filter by phase (prima-materia, solutio, coagulatio) |
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
prompt-alchemy search --phase solutio --provider anthropic "natural language"

# Filter by model
prompt-alchemy search --model "o4-mini" "code generation"

# Filter by tags
prompt-alchemy search --tags "api,backend" "database"

# Filter by date
prompt-alchemy search --since 2024-01-01 "recent prompts"

# Limit results and JSON output
prompt-alchemy search --limit 5 --output json "REST API"

# Multiple filters combined
prompt-alchemy search --phase coagulatio --provider openai --tags "optimization" --limit 20 "performance"
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
prompt-alchemy optimize -p "Create API docs" -t "Document REST endpoints" --persona writing --target-model claude-3-5-sonnet-20241022

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
| `--phase` | | string | | Filter by phase (prima-materia, solutio, coagulatio) |
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
prompt-alchemy metrics --phase solutio --provider anthropic

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

Starts the Model Context Protocol (MCP) server. This is a long-running process that communicates over **stdin/stdout** and is intended for integration with a single AI agent or parent application. It does **not** open any network ports.

### Usage
```bash
prompt-alchemy serve [flags]
```

### Flags
| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--learning-enabled` | | bool | `false` | Enable the learning tools and features. |

## http-server

Starts a RESTful HTTP API server. This is a long-running process that listens on a network port and is intended for providing prompt generation as a service to multiple clients.

### Usage
```bash
prompt-alchemy http-server [flags]
```

### Flags
| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--host` | | string | `localhost` | The host address to bind the server to. |
| `--port` | | int | `3456` | The port to listen on. |

## health

Checks the health status of a running `http-server` instance.

### Usage
```bash
prompt-alchemy health [flags]
```

### Flags
| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--server` | | string | | The base URL of the server to check (e.g., `http://localhost:3456`). Overrides the URL in the config file. |

## nightly

Run the nightly training job to update ranking weights based on user interactions.

### Usage
```bash
prompt-alchemy nightly [flags]
```

### Flags
- `--dry-run` - Preview training without updating weights
- `--force` - Force training even if insufficient data

### Examples
```bash
# Run nightly training
prompt-alchemy nightly

# Dry run to preview changes
prompt-alchemy nightly --dry-run

# Force training
prompt-alchemy nightly --force
```

## schedule

Install, uninstall, or manage scheduled nightly training jobs using cron or launchd.

### Usage
```bash
prompt-alchemy schedule [flags]
```

### Flags
- `--time` - Schedule time in cron format (default: "0 2 * * *" for 2 AM daily)
- `--method` - Scheduling method: auto, cron, or launchd (default: auto)
- `--uninstall` - Uninstall the scheduled job
- `--list` - List current scheduled jobs
- `--dry-run` - Show what would be done without making changes

### Examples
```bash
# Install nightly job at 2 AM using auto-detected method
prompt-alchemy schedule --time "0 2 * * *"

# Install job at 3:30 AM using cron specifically
prompt-alchemy schedule --time "30 3 * * *" --method cron

# Install job using launchd on macOS
prompt-alchemy schedule --time "0 2 * * *" --method launchd

# List current scheduled jobs
prompt-alchemy schedule --list

# Uninstall scheduled job
prompt-alchemy schedule --uninstall

# Dry run to see what would be installed
prompt-alchemy schedule --time "0 2 * * *" --dry-run
```

### Scheduling Methods

**Auto (default)**: Automatically detects the best method for your system:
- macOS: Prefers launchd, falls back to cron
- Linux: Uses cron

**Cron**: Traditional Unix cron scheduler
- Works on Linux and macOS
- Uses standard cron syntax
- Managed via `crontab`

**Launchd**: macOS system scheduler
- Native macOS scheduling service
- More reliable than cron on macOS
- Creates plist files in `~/Library/LaunchAgents/`
- Logs output to `/tmp/prompt-alchemy-nightly.log`

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
    model: "claude-4-sonnet-20250522"

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-4-sonnet-20250522"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536

phases:
  prima-materia:
    provider: "openai"
  solutio:
    provider: "anthropic"
  coagulatio:
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

## batch

Process multiple prompts from various input sources including JSON files, CSV files, and text files.

### Usage
```bash
prompt-alchemy batch [flags] <input-file>
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--format` | `-f` | string | `auto` | Input format (json, csv, text, auto) |
| `--output` | `-o` | string | `json` | Output format (json, yaml, text) |
| `--phases` | `-p` | string | `prima-materia,solutio,coagulatio` | Alchemical phases to use |
| `--parallel` | | int | `3` | Number of parallel processes |
| `--save` | | bool | `true` | Save results to database |

### Examples
```bash
# Process JSON file with multiple prompts
prompt-alchemy batch --format json prompts.json

# Process CSV with custom phases
prompt-alchemy batch --phases prima-materia,coagulatio --format csv prompts.csv

# Process text file with parallel execution
prompt-alchemy batch --parallel 5 prompts.txt
```

## validate

Validate configuration settings and prompt data integrity.

### Usage
```bash
prompt-alchemy validate [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--config` | `-c` | bool | `true` | Validate configuration |
| `--data` | `-d` | bool | `false` | Validate database data |
| `--fix` | | bool | `false` | Attempt to fix validation issues |
| `--phases` | `-p` | string | | Validate specific phases only |

### Examples
```bash
# Validate configuration only
prompt-alchemy validate --config

# Validate database data
prompt-alchemy validate --data

# Validate and fix issues
prompt-alchemy validate --data --fix

# Validate specific phases
prompt-alchemy validate --phases prima-materia,solutio
```

## version

Show version and build information for the Prompt Alchemy CLI.

### Usage
```bash
prompt-alchemy version [flags]
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--format` | `-f` | string | `text` | Output format (text, json, yaml) |
| `--short` | `-s` | bool | `false` | Show only version number |

### Examples
```bash
# Show full version information
prompt-alchemy version

# Show version in JSON format
prompt-alchemy version --format json

# Show only version number
prompt-alchemy version --short
```