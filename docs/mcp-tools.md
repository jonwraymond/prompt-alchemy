---
layout: default
title: MCP Tools Reference
---

# MCP Tools Reference

Complete reference for all 17 MCP tools available in the Prompt Alchemy MCP server.

## Table of Contents

1. [Overview](#overview)
2. [Tool Reference](#tool-reference)
   - [Generation Tools](#generation-tools)
   - [Search & Retrieval Tools](#search--retrieval-tools)
   - [Management Tools](#management-tools)
   - [Analytics Tools](#analytics-tools)
   - [System Tools](#system-tools)
3. [Usage Examples](#usage-examples)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

## Overview

The Prompt Alchemy MCP server provides 17 tools accessible via JSON-RPC 2.0 protocol over stdio. These tools enable AI agents to:

- Generate and optimize prompts
- Search and manage prompt databases
- Track relationships and analytics
- Manage system configuration
- Test provider connectivity

### Protocol Format

All tool calls use the standard MCP protocol:

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      // tool-specific arguments
    }
  }
}
```

## Tool Reference

### Generation Tools

#### 1. generate_prompts

Generate AI prompts using a phased approach with multiple providers and personas.

**Arguments:**
- `input` (string, required): The input text or idea to generate prompts for
- `phases` (string): Comma-separated phases to use (default: "idea,human,precision")
- `count` (integer): Number of prompt variants to generate (default: 3)
- `persona` (string): AI persona to use - code, writing, analysis, generic (default: "code")
- `provider` (string): Override provider for all phases
- `temperature` (number): Temperature for generation 0.0-1.0 (default: 0.7)
- `max_tokens` (integer): Maximum tokens for generation (default: 2000)
- `tags` (string): Comma-separated tags for organization
- `target_model` (string): Target model family for optimization
- `save` (boolean): Save generated prompts to database (default: true)
- `output_format` (string): Output format - console, json, markdown (default: "console")

**Example:**
```json
{
  "name": "generate_prompts",
  "arguments": {
    "input": "Create a REST API for user management",
    "phases": "idea,human,precision",
    "count": 3,
    "persona": "code",
    "temperature": 0.7,
    "tags": "api,backend"
  }
}
```

#### 2. batch_generate_prompts

Generate multiple prompts efficiently from various input formats.

**Arguments:**
- `inputs` (array, required): Array of input objects for batch processing
  - Each input object contains:
    - `id` (string, required): Unique identifier
    - `input` (string, required): The prompt text
    - `phases` (string): Phases to use
    - `count` (integer): Number of variants
    - `persona` (string): AI persona
    - `provider` (string): Override provider
    - `temperature` (number): Generation temperature
    - `max_tokens` (integer): Token limit
    - `tags` (string): Comma-separated tags
- `workers` (integer): Number of concurrent workers 1-20 (default: 3)
- `skip_errors` (boolean): Continue processing despite failures (default: false)
- `timeout` (integer): Per-job timeout in seconds (default: 300)
- `output_format` (string): Output format - json, summary (default: "json")

**Example:**
```json
{
  "name": "batch_generate_prompts",
  "arguments": {
    "inputs": [
      {
        "id": "job1",
        "input": "Create user authentication",
        "persona": "code"
      },
      {
        "id": "job2",
        "input": "Write API documentation",
        "persona": "writing"
      }
    ],
    "workers": 5
  }
}
```

#### 3. optimize_prompt

Optimize prompts using AI-powered meta-prompting and self-improvement.

**Arguments:**
- `prompt` (string, required): Prompt to optimize
- `task` (string, required): Task description for optimization context
- `persona` (string): AI persona to use (default: "code")
- `target_model` (string): Target model family for optimization
- `judge_provider` (string): Provider to use for evaluation (default: "openai")
- `max_iterations` (integer): Maximum optimization iterations (default: 3)
- `target_score` (number): Target quality score 0.0-1.0 (default: 0.8)
- `save` (boolean): Save optimization results (default: true)
- `output_format` (string): Output format - console, json, markdown (default: "console")

**Example:**
```json
{
  "name": "optimize_prompt",
  "arguments": {
    "prompt": "Write a function to validate email",
    "task": "Create robust email validation in Python",
    "persona": "code",
    "max_iterations": 5,
    "target_score": 0.9
  }
}
```

### Search & Retrieval Tools

#### 4. search_prompts

Search existing prompts using text or semantic search.

**Arguments:**
- `query` (string): Search query (optional for filtered searches)
- `semantic` (boolean): Use semantic search with embeddings (default: false)
- `similarity` (number): Minimum similarity threshold 0.0-1.0 (default: 0.5)
- `phase` (string): Filter by phase (idea, human, precision)
- `provider` (string): Filter by provider
- `tags` (string): Filter by tags (comma-separated)
- `since` (string): Filter by creation date (YYYY-MM-DD)
- `limit` (integer): Maximum number of results (default: 10)
- `output_format` (string): Output format - table, json, markdown (default: "table")

**Example:**
```json
{
  "name": "search_prompts",
  "arguments": {
    "query": "authentication",
    "semantic": true,
    "similarity": 0.7,
    "phase": "precision",
    "limit": 5
  }
}
```

#### 5. get_prompt_by_id

Get detailed information about a specific prompt.

**Arguments:**
- `prompt_id` (string, required): UUID of the prompt to retrieve
- `include_metrics` (boolean): Include performance metrics (default: true)
- `include_context` (boolean): Include context information (default: true)

**Example:**
```json
{
  "name": "get_prompt_by_id",
  "arguments": {
    "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
    "include_metrics": true
  }
}
```

### Management Tools

#### 6. update_prompt

Update an existing prompt's content, tags, or parameters.

**Arguments:**
- `prompt_id` (string, required): UUID of the prompt to update
- `content` (string): New content for the prompt
- `tags` (string): New tags (comma-separated)
- `temperature` (number): New temperature 0.0-1.0
- `max_tokens` (integer): New max tokens

**Example:**
```json
{
  "name": "update_prompt",
  "arguments": {
    "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
    "tags": "api,authentication,updated",
    "temperature": 0.8
  }
}
```

#### 7. delete_prompt

Delete an existing prompt and its associated data.

**Arguments:**
- `prompt_id` (string, required): UUID of the prompt to delete

**Example:**
```json
{
  "name": "delete_prompt",
  "arguments": {
    "prompt_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

#### 8. track_prompt_relationship

Track relationships between prompts for enhanced discovery.

**Arguments:**
- `source_prompt_id` (string, required): UUID of the source prompt
- `target_prompt_id` (string, required): UUID of the target prompt
- `relationship_type` (string, required): Type of relationship (derived_from, similar_to, inspired_by, merged_with)
- `strength` (number): Relationship strength 0.0-1.0 (default: 0.5)
- `context` (string): Context explaining the relationship

**Example:**
```json
{
  "name": "track_prompt_relationship",
  "arguments": {
    "source_prompt_id": "123e4567-e89b-12d3-a456-426614174000",
    "target_prompt_id": "987e6543-e21b-12d3-a456-426614174000",
    "relationship_type": "derived_from",
    "strength": 0.8,
    "context": "Enhanced version with better error handling"
  }
}
```

### Analytics Tools

#### 9. get_metrics

Get prompt performance metrics and analytics.

**Arguments:**
- `phase` (string): Filter by phase
- `provider` (string): Filter by provider
- `since` (string): Filter by creation date (YYYY-MM-DD)
- `limit` (integer): Maximum number of prompts to analyze (default: 100)
- `report` (string): Generate report (daily, weekly, monthly)
- `output_format` (string): Output format - table, json, markdown (default: "table")
- `export` (string): Export to file (csv, json, excel)

**Example:**
```json
{
  "name": "get_metrics",
  "arguments": {
    "report": "weekly",
    "provider": "openai",
    "output_format": "json"
  }
}
```

#### 10. get_database_stats

Get comprehensive database statistics including lifecycle information.

**Arguments:**
- `include_relationships` (boolean): Include prompt relationship statistics (default: true)
- `include_enhancements` (boolean): Include enhancement history statistics (default: true)
- `include_usage` (boolean): Include usage analytics (default: true)

**Example:**
```json
{
  "name": "get_database_stats",
  "arguments": {
    "include_relationships": true,
    "include_enhancements": true,
    "include_usage": true
  }
}
```

#### 11. run_lifecycle_maintenance

Run database lifecycle maintenance including relevance scoring and cleanup.

**Arguments:**
- `update_relevance` (boolean): Update relevance scores with decay (default: true)
- `cleanup_old` (boolean): Remove old and low-relevance prompts (default: true)
- `dry_run` (boolean): Show what would be cleaned up without doing it (default: false)

**Example:**
```json
{
  "name": "run_lifecycle_maintenance",
  "arguments": {
    "update_relevance": true,
    "cleanup_old": true,
    "dry_run": false
  }
}
```

### System Tools

#### 12. get_providers

List available providers and their capabilities.

**Arguments:** None

**Example:**
```json
{
  "name": "get_providers",
  "arguments": {}
}
```

#### 13. test_providers

Test provider connectivity and functionality.

**Arguments:**
- `providers` (array): Specific providers to test (empty for all)
- `test_generation` (boolean): Test generation capabilities (default: true)
- `test_embeddings` (boolean): Test embedding capabilities (default: true)
- `output_format` (string): Output format - json, table (default: "table")

**Example:**
```json
{
  "name": "test_providers",
  "arguments": {
    "providers": ["openai", "claude"],
    "test_generation": true,
    "test_embeddings": true
  }
}
```

#### 14. get_config

View current configuration settings and system status.

**Arguments:**
- `show_providers` (boolean): Include provider configurations (default: true)
- `show_phases` (boolean): Include phase assignments (default: true)
- `show_generation` (boolean): Include generation settings (default: true)

**Example:**
```json
{
  "name": "get_config",
  "arguments": {
    "show_providers": true,
    "show_phases": true,
    "show_generation": true
  }
}
```

#### 15. validate_config

Validate configuration settings and provide optimization suggestions.

**Arguments:**
- `categories` (array): Validation categories to check (default: ["all"])
  - Options: providers, phases, embeddings, generation, security, storage, all
- `fix` (boolean): Apply automatic fixes where possible (default: false)
- `output_format` (string): Output format - json, report (default: "report")

**Example:**
```json
{
  "name": "validate_config",
  "arguments": {
    "categories": ["providers", "embeddings"],
    "fix": true
  }
}
```

#### 16. get_version

Get version and build information.

**Arguments:**
- `detailed` (boolean): Include detailed build information (default: false)

**Example:**
```json
{
  "name": "get_version",
  "arguments": {
    "detailed": true
  }
}
```

## Usage Examples

### Basic Prompt Generation

```json
// Generate a simple prompt
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_prompts",
    "arguments": {
      "input": "Create a Python function to sort a list"
    }
  }
}
```

### Advanced Workflow

```json
// 1. Generate initial prompt
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_prompts",
    "arguments": {
      "input": "Build a secure authentication system",
      "persona": "code",
      "tags": "auth,security"
    }
  }
}

// 2. Search for similar prompts
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_prompts",
    "arguments": {
      "query": "authentication security",
      "semantic": true,
      "limit": 3
    }
  }
}

// 3. Optimize the best prompt
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "optimize_prompt",
    "arguments": {
      "prompt": "Create secure authentication...",
      "task": "Build production-ready auth system",
      "target_score": 0.9
    }
  }
}
```

### Batch Processing

```json
// Process multiple prompts concurrently
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "batch_generate_prompts",
    "arguments": {
      "inputs": [
        {"id": "1", "input": "User registration API"},
        {"id": "2", "input": "Password reset flow"},
        {"id": "3", "input": "OAuth integration"}
      ],
      "workers": 3,
      "output_format": "json"
    }
  }
}
```

### System Maintenance

```json
// Check system health
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "test_providers",
    "arguments": {}
  }
}

// Run maintenance
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "run_lifecycle_maintenance",
    "arguments": {
      "dry_run": true
    }
  }
}

// Get statistics
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_database_stats",
    "arguments": {}
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: error message"
      }
    ],
    "isError": true
  }
}
```

### Common Error Types

1. **Missing Required Arguments**
   - Error: "input is required"
   - Solution: Provide all required arguments

2. **Invalid UUID Format**
   - Error: "invalid prompt ID format"
   - Solution: Use valid UUID format

3. **Provider Not Found**
   - Error: "provider not found"
   - Solution: Check available providers with `get_providers`

4. **Invalid Argument Values**
   - Error: "temperature must be between 0.0 and 1.0"
   - Solution: Use valid parameter ranges

## Best Practices

### 1. Tool Selection

- Use `generate_prompts` for new prompt creation
- Use `search_prompts` before generating to avoid duplicates
- Use `optimize_prompt` to improve existing prompts
- Use `batch_generate_prompts` for multiple prompts

### 2. Performance Optimization

- Set appropriate `limit` values for searches
- Use `semantic` search for meaning-based queries
- Enable `save: false` for testing
- Use batch operations for multiple items

### 3. System Management

- Run `test_providers` regularly
- Use `validate_config` after configuration changes
- Schedule `run_lifecycle_maintenance` periodically
- Monitor with `get_database_stats`

### 4. Error Handling

- Always check `isError` in responses
- Implement retry logic for transient failures
- Validate UUIDs before using them
- Check provider availability before operations

### 5. Workflow Design

- Chain tools for complex operations
- Use relationships to track prompt evolution
- Tag prompts for better organization
- Export metrics for analysis

This reference provides complete documentation for all 17 MCP tools available in Prompt Alchemy, enabling effective integration with AI assistants and automation workflows.