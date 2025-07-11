---
layout: default
title: MCP API Reference
---

# MCP API Reference

This document provides a comprehensive reference for the Model Context Protocol (MCP) server API implemented by Prompt Alchemy. The MCP server provides 17 tools for AI agents to interact with the prompt generation and management system.

## Overview

Prompt Alchemy implements an MCP server that exposes its functionality through standardized tools. AI agents can connect to this server to generate, search, optimize, and manage prompts programmatically.

**Protocol**: Model Context Protocol (MCP) 2024-11-05  
**Transport**: JSON-RPC 2.0 over stdin/stdout  
**Server Command**: `prompt-alchemy serve`

## Connection

To connect an AI agent to the Prompt Alchemy MCP server:

```bash
# Start the MCP server
prompt-alchemy serve

# Connect via MCP client
# The server accepts JSON-RPC 2.0 messages over stdin/stdout
```

## Tool Categories

The 17 MCP tools are organized into the following categories:

- **[Generation Tools](#generation-tools)** - Create and generate prompts
- **[Search & Retrieval Tools](#search--retrieval-tools)** - Find and retrieve prompts
- **[Optimization Tools](#optimization-tools)** - Improve and enhance prompts
- **[Management Tools](#management-tools)** - Update, delete, and maintain prompts
- **[Analytics Tools](#analytics-tools)** - Get metrics and statistics
- **[System Tools](#system-tools)** - Configuration and system information

---

## Generation Tools

### generate_prompts

Generate AI prompts using a phased approach with multiple providers and personas.

**Parameters:**
- `input` (string, required) - The input text or idea to generate prompts for
- `phases` (string, default: "idea,human,precision") - Comma-separated phases to use
- `count` (integer, default: 3) - Number of prompt variants to generate
- `persona` (string, default: "code") - AI persona to use (code, writing, analysis, generic)
- `provider` (string, optional) - Override provider for all phases (openai, anthropic, google, openrouter)
- `temperature` (number, default: 0.7) - Temperature for generation (0.0-1.0)
- `max_tokens` (integer, default: 2000) - Maximum tokens for generation
- `tags` (string, optional) - Comma-separated tags for organization
- `target_model` (string, optional) - Target model family for optimization
- `save` (boolean, default: true) - Save generated prompts to database
- `output_format` (string, default: "console") - Output format (console, json, markdown)

**Usage Example:**
```json
{
  "input": "Create a function to parse JSON data",
  "phases": "idea,precision",
  "count": 5,
  "persona": "code",
  "provider": "openai",
  "temperature": 0.8,
  "tags": "json,parsing,functions"
}
```

**Returns:** Generated prompts with metadata, rankings, and performance metrics.

### batch_generate_prompts

Generate multiple prompts efficiently from various input formats with concurrent processing.

**Parameters:**
- `inputs` (array, required) - Array of input objects for batch processing
  - Each input object contains: `id`, `input`, `phases`, `count`, `persona`, `provider`, `temperature`, `max_tokens`, `tags`
- `workers` (integer, default: 3) - Number of concurrent workers (1-20)
- `skip_errors` (boolean, default: false) - Continue processing despite individual failures
- `timeout` (integer, default: 300) - Per-job timeout in seconds
- `output_format` (string, default: "json") - Output format (json, summary)

**Usage Example:**
```json
{
  "inputs": [
    {
      "id": "task1",
      "input": "Create a login form",
      "persona": "code",
      "count": 3
    },
    {
      "id": "task2", 
      "input": "Write documentation",
      "persona": "writing",
      "count": 2
    }
  ],
  "workers": 5,
  "skip_errors": true
}
```

**Returns:** Batch processing results with individual outcomes and summary statistics.

---

## Search & Retrieval Tools

### search_prompts

Search existing prompts using text or semantic search with advanced filtering.

**Parameters:**
- `query` (string, optional) - Search query
- `semantic` (boolean, default: false) - Use semantic search with embeddings
- `similarity` (number, default: 0.5) - Minimum similarity threshold (0.0-1.0)
- `phase` (string, optional) - Filter by phase (idea, human, precision)
- `provider` (string, optional) - Filter by provider
- `tags` (string, optional) - Filter by tags (comma-separated)
- `since` (string, optional) - Filter by creation date (YYYY-MM-DD)
- `limit` (integer, default: 10) - Maximum number of results
- `output_format` (string, default: "table") - Output format (table, json, markdown)

**Usage Example:**
```json
{
  "query": "authentication system",
  "semantic": true,
  "similarity": 0.7,
  "tags": "security,auth",
  "limit": 15
}
```

**Returns:** Search results with matching prompts, relevance scores, and metadata.

### get_prompt_by_id

Get detailed information about a specific prompt including metrics and context.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to retrieve
- `include_metrics` (boolean, default: true) - Include performance metrics
- `include_context` (boolean, default: true) - Include context information

**Usage Example:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "include_metrics": true,
  "include_context": true
}
```

**Returns:** Complete prompt information with metrics, context, and related data.

---

## Optimization Tools

### optimize_prompt

Optimize prompts using AI-powered meta-prompting and iterative self-improvement.

**Parameters:**
- `prompt` (string, required) - Prompt to optimize
- `task` (string, required) - Task description for optimization context
- `persona` (string, default: "code") - AI persona to use
- `target_model` (string, optional) - Target model family for optimization
- `judge_provider` (string, default: "openai") - Provider to use for evaluation
- `max_iterations` (integer, default: 3) - Maximum optimization iterations
- `target_score` (number, default: 0.8) - Target quality score (0.0-1.0)
- `save` (boolean, default: true) - Save optimization results
- `output_format` (string, default: "console") - Output format (console, json, markdown)

**Usage Example:**
```json
{
  "prompt": "Write a function to sort an array",
  "task": "Generate Python code that is efficient and well-documented",
  "persona": "code",
  "target_model": "gpt-4",
  "target_score": 0.9,
  "max_iterations": 5
}
```

**Returns:** Optimization analysis with improved prompts and performance scores.

---

## Management Tools

### update_prompt

Update an existing prompt's content, tags, or generation parameters.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to update
- `content` (string, optional) - New content for the prompt
- `tags` (string, optional) - New tags (comma-separated)
- `temperature` (number, optional) - New temperature (0.0-1.0)
- `max_tokens` (integer, optional) - New max tokens

**Usage Example:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Updated prompt content with better instructions",
  "tags": "updated,improved,v2"
}
```

**Returns:** Updated prompt details with confirmation.

### delete_prompt

Delete an existing prompt and all its associated data.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to delete

**Usage Example:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Returns:** Deletion confirmation with affected data summary.

### track_prompt_relationship

Track relationships between prompts for enhanced discovery and organization.

**Parameters:**
- `source_prompt_id` (string, required) - UUID of the source prompt
- `target_prompt_id` (string, required) - UUID of the target prompt
- `relationship_type` (string, required) - Type of relationship (derived_from, similar_to, inspired_by, merged_with)
- `strength` (number, default: 0.5) - Relationship strength (0.0-1.0)
- `context` (string, optional) - Context explaining the relationship

**Usage Example:**
```json
{
  "source_prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_prompt_id": "660e8400-e29b-41d4-a716-446655440000",
  "relationship_type": "derived_from",
  "strength": 0.8,
  "context": "Optimized version with better error handling"
}
```

**Returns:** Relationship tracking confirmation with metadata.

### run_lifecycle_maintenance

Run database lifecycle maintenance including relevance scoring and cleanup.

**Parameters:**
- `update_relevance` (boolean, default: true) - Update relevance scores with decay
- `cleanup_old` (boolean, default: true) - Remove old and low-relevance prompts
- `dry_run` (boolean, default: false) - Show what would be cleaned up without doing it

**Usage Example:**
```json
{
  "update_relevance": true,
  "cleanup_old": true,
  "dry_run": true
}
```

**Returns:** Maintenance operation results with cleanup summary.

---

## Analytics Tools

### get_metrics

Get prompt performance metrics and analytics with comprehensive reporting.

**Parameters:**
- `phase` (string, optional) - Filter by phase
- `provider` (string, optional) - Filter by provider
- `since` (string, optional) - Filter by creation date (YYYY-MM-DD)
- `limit` (integer, default: 100) - Maximum number of prompts to analyze
- `report` (string, optional) - Generate report (daily, weekly, monthly)
- `output_format` (string, default: "table") - Output format (table, json, markdown)
- `export` (string, optional) - Export to file (csv, json, excel)

**Usage Example:**
```json
{
  "provider": "openai",
  "since": "2024-01-01",
  "report": "weekly",
  "output_format": "json"
}
```

**Returns:** Comprehensive metrics analysis with performance breakdowns.

### get_database_stats

Get comprehensive database statistics including lifecycle and relationship information.

**Parameters:**
- `include_relationships` (boolean, default: true) - Include prompt relationship statistics
- `include_enhancements` (boolean, default: true) - Include enhancement history statistics
- `include_usage` (boolean, default: true) - Include usage analytics

**Usage Example:**
```json
{
  "include_relationships": true,
  "include_enhancements": true,
  "include_usage": true
}
```

**Returns:** Comprehensive database statistics with detailed breakdowns.

---

## System Tools

### get_providers

List available providers and their capabilities, configuration status, and phase assignments.

**Parameters:** None required.

**Usage Example:**
```json
{}
```

**Returns:** Provider list with capabilities, status, and configuration details.

### get_config

View current configuration settings and system status.

**Parameters:**
- `show_providers` (boolean, default: true) - Include provider configurations
- `show_phases` (boolean, default: true) - Include phase assignments
- `show_generation` (boolean, default: true) - Include generation settings

**Usage Example:**
```json
{
  "show_providers": true,
  "show_phases": true,
  "show_generation": true
}
```

**Returns:** Complete configuration overview with all settings.

### validate_config

Validate configuration settings and provide optimization suggestions.

**Parameters:**
- `categories` (array, default: ["all"]) - Validation categories (providers, phases, embeddings, generation, security, storage, all)
- `fix` (boolean, default: false) - Apply automatic fixes where possible
- `output_format` (string, default: "report") - Output format (json, report)

**Usage Example:**
```json
{
  "categories": ["providers", "security"],
  "fix": true,
  "output_format": "report"
}
```

**Returns:** Validation results with suggestions and fix confirmations.

### test_providers

Test provider connectivity and functionality for generation and embeddings.

**Parameters:**
- `providers` (array, optional) - Specific providers to test (openai, anthropic, google, openrouter)
- `test_generation` (boolean, default: true) - Test generation capabilities
- `test_embeddings` (boolean, default: true) - Test embedding capabilities
- `output_format` (string, default: "table") - Output format (json, table)

**Usage Example:**
```json
{
  "providers": ["openai", "anthropic"],
  "test_generation": true,
  "test_embeddings": true
}
```

**Returns:** Provider test results with connectivity and capability status.

### get_version

Get version and build information for the Prompt Alchemy system.

**Parameters:**
- `detailed` (boolean, default: false) - Include detailed build information

**Usage Example:**
```json
{
  "detailed": true
}
```

**Returns:** Version information with build details and system metadata.

---

## Response Format

All MCP tools return responses in the standardized MCPToolResult format:

```typescript
interface MCPToolResult {
  content: MCPContent[]
  isError: boolean
}

interface MCPContent {
  type: string
  text: string
}
```

**Successful Response Example:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Generated 3 prompts successfully with average score 8.5/10"
    }
  ],
  "isError": false
}
```

**Error Response Example:**
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Error: Invalid prompt_id format. Expected UUID."
    }
  ],
  "isError": true
}
```

## Error Handling

Common error conditions across all tools:

- **Invalid Parameters**: Malformed UUIDs, invalid enum values, out-of-range numbers
- **Resource Not Found**: Prompt IDs that don't exist in the database
- **Provider Errors**: API connectivity issues, authentication failures
- **Database Errors**: Storage access failures, transaction issues
- **Processing Timeouts**: Long-running operations that exceed configured limits

All errors are returned with `isError: true` and descriptive error messages in the content field.

## Best Practices

1. **Batch Operations**: Use `batch_generate_prompts` for multiple prompt generation to improve efficiency
2. **Semantic Search**: Enable semantic search for better content discovery with `semantic: true`
3. **Error Handling**: Always check the `isError` field in responses
4. **Resource Management**: Use lifecycle maintenance tools to keep the database optimized
5. **Configuration Validation**: Regularly validate configuration with `validate_config`
6. **Provider Testing**: Test provider connectivity before critical operations

This API reference provides complete documentation for integrating AI agents with the Prompt Alchemy MCP server for advanced prompt generation and management workflows.