---
layout: default
title: MCP API Reference
---

# MCP API Reference

This document provides a comprehensive reference for the Model Context Protocol (MCP) server API implemented by Prompt Alchemy. The MCP server provides 15 tools for AI agents to interact with the prompt generation and management system.

## Overview

Prompt Alchemy implements an MCP server that exposes its functionality through standardized tools. AI agents can connect to this server to generate, search, optimize, and manage prompts programmatically.

**Protocol**: Model Context Protocol (MCP) 2024-11-05
**Transport**: JSON-RPC 2.0 over stdin/stdout
**Server Command**: `prompt-alchemy serve`

## Tool Categories

The 15 MCP tools are organized into the following categories:

- **[Generation Tools](#generation-tools)** - Create and generate prompts
- **[Search & Retrieval Tools](#search--retrieval-tools)** - Find and retrieve prompts
- **[Optimization & Analysis Tools](#optimization--analysis-tools)** - Improve and analyze prompts
- **[Management Tools](#management-tools)** - Update and track prompts
- **[System Tools](#system-tools)** - Configuration and system information
- **[Learning Tools](#learning-tools)** - Provide feedback and get recommendations

---

## Generation Tools

### generate_prompts

Generate AI prompts using a phased approach with multiple providers and personas.

**Parameters:**
- `input` (string, required) - The input text or idea to generate prompts for.
- `phases` (string, default: "idea,human,precision") - Comma-separated phases to use.
- `count` (integer, default: 3) - Number of prompt variants to generate.
- `persona` (string, default: "code") - AI persona to use (code, writing, analysis, generic).
- `provider` (string, optional) - Override provider for all phases.
- `temperature` (number, default: 0.7) - Temperature for generation (0.0-1.0).
- `max_tokens` (integer, default: 2000) - Maximum tokens for generation.
- `tags` (string, optional) - Comma-separated tags for organization.
- `target_model` (string, optional) - Target model family for optimization.
- `save` (boolean, default: true) - Save generated prompts to the database.

### batch_generate_prompts

Generate multiple prompts efficiently from a list of inputs.

**Parameters:**
- `inputs` (array, required) - An array of objects, each with `id`, `input`, and optional generation parameters.
- `workers` (integer, default: 3) - Number of concurrent workers (1-20).
- `skip_errors` (boolean, default: false) - Continue processing even if some jobs fail.
- `timeout` (integer, default: 300) - Timeout in seconds for each job.

---

## Search & Retrieval Tools

### search_prompts

Search existing prompts using text or semantic search with advanced filtering.

**Parameters:**
- `query` (string, optional) - Search query.
- `semantic` (boolean, default: false) - Use semantic search.
- `similarity` (number, default: 0.5) - Minimum similarity threshold for semantic search.
- `phase`, `provider`, `tags`, `since` (string, optional) - Filtering options.
- `limit` (integer, default: 10) - Maximum number of results.

### get_prompt_by_id

Get detailed information about a specific prompt by its UUID.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt.
- `include_metrics` (boolean, default: true) - Include performance metrics.
- `include_context` (boolean, default: true) - Include contextual information.

### ai_select_prompt

Use AI to intelligently select the best prompt from a list based on specified criteria.

**Parameters:**
- `prompt_ids` (array, required) - Array of prompt UUIDs to select from.
- `task_description` (string, required) - Description of the task for which the prompt is needed.
- `persona` (string, default: "generic") - The evaluation persona to use (e.g., `code`, `writing`).
- `target_audience` (string, default: "general audience") - The intended audience for the prompt.
- `required_tone` (string, default: "professional") - The desired tone for the prompt.
- `preferred_length` (string, default: "medium") - The preferred length (`short`, `medium`, `long`).
- `specific_requirements` (array, optional) - A list of specific requirements the prompt must meet.
- `model_family` (string, default: "claude") - The model family to use for evaluation.
- `selection_provider` (string, default: "openai") - The provider to use for the selection process.

---

## Optimization & Analysis Tools

### optimize_prompt

Optimize a prompt using AI-powered meta-prompting and iterative self-improvement.

**Parameters:**
- `prompt` (string, required) - The prompt content to optimize.
- `task` (string, required) - A description of the task for optimization context.
- `persona` (string, default: "code") - AI persona to use.
- `max_iterations` (integer, default: 3) - Maximum optimization iterations.
- `target_score` (number, default: 0.8) - Target quality score to achieve.

### analyze_code_patterns

Analyze existing prompts to identify patterns and suggest improvements, especially for coding tasks.

**Parameters:**
- `analysis_type` (string, default: "patterns") - Type of analysis: `patterns`, `effectiveness`, `gaps`, `optimization`.
- `persona_filter` (string, default: "code") - Focus analysis on a specific persona.
- `sample_size` (integer, default: 50) - Number of prompts to analyze.
- `include_recommendations` (boolean, default: true) - Include AI-generated recommendations.
- `context` (array, optional) - A list of strings providing additional context for the analysis.

---

## Management Tools

### update_prompt

Update an existing prompt's content, tags, or generation parameters.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to update.
- `content` (string, optional) - New content for the prompt.
- `tags` (string, optional) - New comma-separated tags.
- `temperature`, `max_tokens` (optional) - New generation parameters.

### track_prompt_relationship

Track a relationship (e.g., 'derived_from') between two prompts.

**Parameters:**
- `source_prompt_id` (string, required) - UUID of the source prompt.
- `target_prompt_id` (string, required) - UUID of the target prompt.
- `relationship_type` (string, required) - The type of relationship (e.g., `derived_from`, `similar_to`).
- `strength` (number, default: 0.5) - The strength of the relationship (0.0-1.0).
- `context` (string, optional) - Text explaining the context of the relationship.

---

## System Tools

### validate_config

Validate system configuration settings and provide optimization suggestions.

**Parameters:**
- `categories` (array, default: ["all"]) - Categories to validate (e.g., `providers`, `storage`).
- `fix` (boolean, default: false) - Apply automatic fixes where possible.

### test_providers

Test connectivity and functionality of the configured LLM providers.

**Parameters:**
- `providers` (array, optional) - Specific providers to test. If empty, all are tested.
- `test_generation` (boolean, default: true) - Test text generation capabilities.
- `test_embeddings` (boolean, default: true) - Test embedding capabilities.

### get_version

Get the version and build information for the Prompt Alchemy system.

**Parameters:**
- `detailed` (boolean, default: false) - Include detailed build information.

---

## Learning Tools

These tools are available when learning mode is enabled.

### record_feedback

Record user feedback on the effectiveness of a prompt to improve future recommendations.

**Parameters:**
- `prompt_id` (string, required) - UUID of the prompt to provide feedback on.
- `effectiveness` (number, required) - An effectiveness score between 0.0 and 1.0.
- `session_id` (string, optional) - The session ID to group feedback.
- `rating` (integer, optional) - A 1-5 star rating.
- `helpful` (boolean, optional) - Whether the prompt was helpful.
- `context` (string, optional) - Additional text context about the usage.

### get_recommendations

Get AI-powered prompt recommendations based on learned patterns from user feedback.

**Parameters:**
- `input` (string, required) - The input text or idea to get recommendations for.
- `limit` (integer, default: 5) - The maximum number of recommendations to return.

### get_learning_stats

Get current statistics and patterns from the learning engine.

**Parameters:**
- `include_patterns` (boolean, default: false) - Include a detailed pattern breakdown in the statistics.

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