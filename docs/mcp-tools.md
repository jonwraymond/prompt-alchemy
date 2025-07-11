---
layout: default
title: MCP Tools Reference
---

# MCP Tools Reference

This comprehensive reference covers all 20 MCP tools available in the Prompt Alchemy MCP server, providing detailed information about parameters, responses, and usage examples for AI assistant integration.

## Table of Contents

1. [Overview](#overview)
2. [Generation Tools](#generation-tools)
3. [Search & Retrieval Tools](#search--retrieval-tools)
4. [Management Tools](#management-tools)
5. [Analytics Tools](#analytics-tools)
6. [System Tools](#system-tools)
7. [Learning Tools](#learning-tools)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

## Overview

The Prompt Alchemy MCP server provides 20 specialized tools for AI assistants to interact with the prompt generation and management system. Each tool is designed for specific use cases in the alchemical prompt transformation process. Tools are divided into categories for better organization.

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

---

## Generation Tools

### generate_prompts

Generate AI prompts using a phased approach with multiple providers and personas.

**Parameters:**
- `input` (string, required) - The input text or idea to generate prompts for
- `phases` (string, default: "idea,human,precision") - Comma-separated phases to use (idea, human, precision)
- `count` (integer, default: 3) - Number of prompt variants to generate
- `persona` (string, default: "code") - AI persona to use (code, writing, analysis, generic)
- `provider` (string, optional) - Override provider for all phases (openai, anthropic, google, openrouter)
- `temperature` (number, default: 0.7) - Temperature for generation (0.0-1.0)
- `max_tokens` (integer, default: 2000) - Maximum tokens for generation
- `tags` (string, optional) - Comma-separated tags for organization
- `target_model` (string, optional) - Target model family for optimization (claude-3-5-sonnet-20241022, gpt-4o-mini, gemini-2.5-flash)
- `save` (boolean, default: true) - Save generated prompts to database
- `output_format` (string, default: "console") - Output format (console, json, markdown)

**Returns:** Generated prompts with metadata, rankings, and performance metrics.

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

### batch_generate_prompts

Generate multiple prompts efficiently from various input formats with concurrent processing.

**Parameters:**
- `inputs` (array, required) - Array of input objects for batch processing
  - Each item is an object with:
    - `id` (string, required) - Unique identifier for this input
    - `input` (string, required) - The input text or idea to generate prompts for
    - `phases` (string, default: "idea,human,precision") - Comma-separated phases to use
    - `count` (integer, default: 3) - Number of prompt variants to generate
    - `persona` (string, default: "code") - AI persona to use
    - `provider` (string, optional) - Override provider for all phases
    - `temperature` (number, default: 0.7) - Temperature for generation (0.0-1.0)
    - `max_tokens` (integer, default: 2000) - Maximum tokens for generation
    - `tags` (string, optional) - Comma-separated tags for organization
- `workers` (integer, default: 3) - Number of concurrent workers (1-20)
- `skip_errors` (boolean, default: false) - Continue processing despite individual failures
- `timeout` (integer, default: 300) - Per-job timeout in seconds
- `output_format` (string, default: "json") - Output format (json, summary)

**Returns:** Batch processing results with individual outcomes and summary statistics.

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

### optimize_prompt

Optimize prompts using AI-powered meta-prompting and self-improvement.

**Parameters:**
- `prompt` (string, required) - Prompt to optimize
- `task` (string, required) - Task description for optimization context
- `persona` (string, default: "code") - AI persona to use (code, writing, analysis, generic)
- `target_model` (string, optional) - Target model family for optimization
- `judge_provider` (string, default: "openai") - Provider to use for evaluation
- `max_iterations` (integer, default: 3) - Maximum optimization iterations
- `target_score` (number, default: 0.8) - Target quality score (0.0-1.0)
- `save` (boolean, default: true) - Save optimization results
- `output_format` (string, default: "console") - Output format (console, json, markdown)

**Returns:** Optimized prompt with improvement history and scores.

**Usage Example:**
```json
{
  "prompt": "Write a simple function",
  "task": "Code optimization",
  "persona": "code",
  "max_iterations": 5
}
```

---

## Search & Retrieval Tools

### search_prompts

Search existing prompts using text or semantic search.

**Parameters:**
- `query` (string, optional) - Search query (optional for filtered searches)
- `semantic` (boolean, default: false) - Use semantic search with embeddings
- `similarity` (number, default: 0.5) - Minimum similarity threshold for semantic search (0.0-1.0)
- `phase` (string, optional) - Filter by phase (idea, human, precision)
- `provider` (string, optional) - Filter by provider
- `tags` (string, optional) - Filter by tags (comma-separated)
- `since` (string, optional) - Filter by creation date (YYYY-MM-DD)
- `limit` (integer, default: 10) - Maximum number of results
- `output_format` (string, default: "table") - Output format (table, json, markdown)

**Returns:** List of matching prompts with metadata.

**Usage Example:**
```json
{
  "query": "JSON parsing",
  "semantic": true,
  "similarity": 0.7,
  "limit": 5
}
```

### get_prompt_by_id

Get detailed information about a specific prompt.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to retrieve
- `include_metrics` (boolean, default: true) - Include performance metrics
- `include_context` (boolean, default: true) - Include context information

**Returns:** Detailed prompt information, optionally with metrics and context.

**Usage Example:**
```json
{
  "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
  "include_metrics": true
}
```

### ai_select_prompt

Use AI to intelligently select the best prompt from a list based on specified criteria.

**Parameters:**
- `prompt_ids` (array, required) - Array of prompt UUIDs to select from (items: string)
- `task_description` (string, optional) - Description of the task the prompt will be used for
- `target_audience` (string, default: "general audience") - Target audience for the prompt (e.g., developers, business users)
- `required_tone` (string, default: "professional") - Required tone (e.g., professional, casual, technical)
- `preferred_length` (string, default: "medium") - Preferred length (short, medium, long)
- `specific_requirements` (array, optional) - List of specific requirements the prompt must meet (items: string)
- `persona` (string, default: "generic") - Evaluation persona (code, writing, analysis, generic)
- `model_family` (string, default: "claude") - Model family for evaluation (claude, gpt, gemini)
- `selection_provider` (string, default: "openai") - Provider to use for selection (openai, anthropic, google)

**Returns:** Selected prompt with reasoning and confidence score.

**Usage Example:**
```json
{
  "prompt_ids": ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"],
  "task_description": "Write API documentation",
  "persona": "writing"
}
```

---

## Management Tools

### update_prompt

Update an existing prompt's content, tags, or parameters.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to update
- `content` (string, optional) - New content for the prompt
- `tags` (string, optional) - New tags (comma-separated)
- `temperature` (number, optional) - New temperature (0.0-1.0)
- `max_tokens` (integer, optional) - New max tokens

**Returns:** Updated prompt details.

**Usage Example:**
```json
{
  "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Updated prompt content",
  "tags": "updated,tag"
}
```

### delete_prompt

Delete an existing prompt and its associated data.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to delete

**Returns:** Confirmation of deletion with deleted prompt details.

**Usage Example:**
```json
{
  "prompt_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### track_prompt_relationship

Track relationships between prompts for enhanced discovery.

**Parameters:**
- `source_prompt_id` (string, required) - UUID of the source prompt
- `target_prompt_id` (string, required) - UUID of the target prompt
- `relationship_type` (string, required) - Type of relationship (derived_from, similar_to, inspired_by, merged_with)
- `strength` (number, default: 0.5) - Relationship strength (0.0-1.0)
- `context` (string, optional) - Context explaining the relationship

**Returns:** Confirmation of tracked relationship.

**Usage Example:**
```json
{
  "source_prompt_id": "123e4567-e89b-12d3-a456-426614174000",
  "target_prompt_id": "123e4567-e89b-12d3-a456-426614174001",
  "relationship_type": "derived_from",
  "strength": 0.8
}
```

### run_lifecycle_maintenance

Run database lifecycle maintenance including relevance scoring and cleanup.

**Parameters:**
- `update_relevance` (boolean, default: true) - Update relevance scores with decay
- `cleanup_old` (boolean, default: true) - Remove old and low-relevance prompts
- `dry_run` (boolean, default: false) - Show what would be cleaned up without doing it

**Returns:** Maintenance results and summary.

**Usage Example:**
```json
{
  "dry_run": true
}
```

---

## Analytics Tools

### get_metrics

Get prompt performance metrics and analytics.

**Parameters:**
- `phase` (string, optional) - Filter by phase (idea, human, precision)
- `provider` (string, optional) - Filter by provider
- `since` (string, optional) - Filter by creation date (YYYY-MM-DD)
- `limit` (integer, default: 100) - Maximum number of prompts to analyze
- `report` (string, optional) - Generate report (daily, weekly, monthly)
- `output_format` (string, default: "table") - Output format (table, json, markdown)
- `export` (string, optional) - Export to file (csv, json, excel)

**Returns:** Metrics and analytics data.

**Usage Example:**
```json
{
  "report": "weekly",
  "output_format": "json"
}
```

### get_database_stats

Get comprehensive database statistics including lifecycle information.

**Parameters:**
- `include_relationships` (boolean, default: true) - Include prompt relationship statistics
- `include_enhancements` (boolean, default: true) - Include enhancement history statistics
- `include_usage` (boolean, default: true) - Include usage analytics

**Returns:** Database statistics and metrics.

**Usage Example:**
```json
{
  "include_relationships": true
}
```

---

## System Tools

### get_providers

List available providers and their capabilities.

**Parameters:** None

**Returns:** List of available providers with status and capabilities.

**Usage Example:**
```json
{}
```

### get_config

View current configuration settings and system status.

**Parameters:**
- `show_providers` (boolean, default: true) - Include provider configurations
- `show_phases` (boolean, default: true) - Include phase assignments
- `show_generation` (boolean, default: true) - Include generation settings

**Returns:** Configuration details.

**Usage Example:**
```json
{
  "show_providers": true
}
```

### validate_config

Validate configuration settings and provide optimization suggestions.

**Parameters:**
- `categories` (array, default: ["all"]) - Validation categories to check (providers, phases, embeddings, generation, security, storage, all)
- `fix` (boolean, default: false) - Apply automatic fixes where possible
- `output_format` (string, default: "report") - Output format (json, report)

**Returns:** Validation results with issues and suggestions.

**Usage Example:**
```json
{
  "categories": ["providers", "storage"],
  "fix": true
}
```

### test_providers

Test provider connectivity and functionality.

**Parameters:**
- `providers` (array, optional) - Specific providers to test (empty for all) (items: string, enum: openai, anthropic, google, openrouter)
- `test_generation` (boolean, default: true) - Test generation capabilities
- `test_embeddings` (boolean, default: true) - Test embedding capabilities
- `output_format` (string, default: "table") - Output format (json, table)

**Returns:** Test results for providers.

**Usage Example:**
```json
{
  "providers": ["openai", "anthropic"],
  "test_embeddings": false
}
```

### get_version

Get version and build information.

**Parameters:**
- `detailed` (boolean, default: false) - Include detailed build information

**Returns:** Version information.

**Usage Example:**
```json
{
  "detailed": true
}
```

---

## Learning Tools

These tools are available when learning is enabled in the configuration.

### record_feedback

Record user feedback for prompt effectiveness (enables learning).

**Parameters:**
- `prompt_id` (string, required) - ID of the prompt to provide feedback for
- `session_id` (string, optional) - Session ID for tracking context
- `rating` (integer, optional) - Rating from 1-5 (minimum: 1, maximum: 5)
- `effectiveness` (number, required) - Effectiveness score (0.0-1.0) (minimum: 0.0, maximum: 1.0)
- `helpful` (boolean, optional) - Was the prompt helpful?
- `context` (string, optional) - Additional context about usage

**Returns:** Confirmation of recorded feedback.

**Usage Example:**
```json
{
  "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
  "effectiveness": 0.85,
  "rating": 4,
  "helpful": true
}
```

### get_recommendations

Get AI-powered prompt recommendations based on learning.

**Parameters:**
- `input` (string, required) - Input text to get recommendations for
- `limit` (integer, default: 5) - Maximum number of recommendations

**Returns:** List of recommended prompts.

**Usage Example:**
```json
{
  "input": "Code review process",
  "limit": 3
}
```

### get_learning_stats

Get current learning statistics and patterns.

**Parameters:**
- `include_patterns` (boolean, default: false) - Include pattern details

**Returns:** Learning statistics.

**Usage Example:**
```json
{
  "include_patterns": true
}
```

---

## Error Handling

Common error response format:

```json
{
  "error": {
    "code": "INVALID_PROMPT_ID",
    "message": "Prompt with ID 'xyz' not found",
    "details": {
      "prompt_id": "xyz",
      "suggestions": ["Check prompt ID format", "Use search_prompts to find valid IDs"]
    }
  }
}
```

Common error codes:
- `INVALID_PROMPT_ID`: Prompt not found
- `PROVIDER_UNAVAILABLE`: Provider service unavailable
- `INVALID_PARAMETERS`: Invalid or missing parameters
- `GENERATION_FAILED`: Prompt generation failed
- `DATABASE_ERROR`: Database operation failed
- `QUOTA_EXCEEDED`: API quota exceeded
- `VALIDATION_ERROR`: Data validation failed

## Best Practices

1. **Efficient Prompt Generation:** Use specific phases and providers for targeted outputs.
2. **Semantic Search:** Leverage semantic search for better discovery of similar prompts.
3. **Batch Processing:** Use batch generation for multiple inputs to improve efficiency.
4. **Relationship Tracking:** Track prompt relationships to build a knowledge graph.
5. **Performance Monitoring:** Regularly check metrics and run maintenance.
6. **Configuration Management:** Validate and test configurations periodically.
7. **Feedback Loop:** Record feedback to enable learning and improvements.

This reference provides everything needed to effectively integrate with the Prompt Alchemy system through the Model Context Protocol.