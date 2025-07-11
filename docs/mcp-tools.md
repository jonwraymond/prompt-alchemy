---
layout: default
title: MCP Tools Reference
---

# MCP Tools Reference

This comprehensive reference covers all 17 MCP tools available in the Prompt Alchemy MCP server, providing detailed information about parameters, responses, and usage examples for AI assistant integration.

## Table of Contents

1. [Overview](#overview)
2. [Core Generation Tools](#core-generation-tools)
3. [Search & Discovery Tools](#search--discovery-tools)
4. [Management Tools](#management-tools)
5. [Analytics & Optimization Tools](#analytics--optimization-tools)
6. [Configuration & System Tools](#configuration--system-tools)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

The Prompt Alchemy MCP server provides **17 specialized tools** for AI assistants to interact with the prompt generation and management system. Each tool is designed for specific use cases in the alchemical prompt transformation process.

### Connection Information

```json
{
  "name": "prompt-alchemy",
  "command": "prompt-alchemy",
  "args": ["serve"],
  "description": "Prompt Alchemy MCP server with 17 tools for AI prompt generation and management"
}
```

## Core Generation Tools

### 1. generate_prompts

Generate AI prompts using the three-phase alchemical approach with multiple providers and personas.

#### Parameters

```json
{
  "idea": {
    "type": "string",
    "description": "The raw material for alchemical transformation",
    "required": true,
    "example": "Create a REST API for user authentication"
  },
  "provider": {
    "type": "string",
    "description": "LLM provider to use for generation",
    "required": false,
    "enum": ["openai", "anthropic", "google", "openrouter", "ollama"],
    "default": "openai"
  },
  "model": {
    "type": "string",
    "description": "Specific model to use",
    "required": false,
    "enum": ["o4-mini", "claude-3-5-sonnet-20241022", "gemini-2.5-flash", "openrouter/auto"],
    "default": "claude-3-5-sonnet-20241022"
  },
  "phases": {
    "type": "array",
    "description": "Alchemical phases to execute",
    "required": false,
    "items": {
      "type": "string",
      "enum": ["prima-materia", "solutio", "coagulatio"]
    },
    "default": ["prima-materia", "solutio", "coagulatio"]
  },
  "count": {
    "type": "integer",
    "description": "Number of prompt variations to generate",
    "required": false,
    "minimum": 1,
    "maximum": 10,
    "default": 3
  },
  "persona": {
    "type": "string",
    "description": "Persona for specialized generation",
    "required": false,
    "enum": ["technical", "creative", "analytical", "conversational"]
  },
  "context": {
    "type": "string",
    "description": "Additional context for generation",
    "required": false
  }
}
```

#### Response

```json
{
  "prompts": {
    "prima-materia": ["Raw essence prompt 1", "Raw essence prompt 2"],
    "solutio": ["Dissolved natural prompt 1", "Dissolved natural prompt 2"],
    "coagulatio": ["Crystallized precise prompt 1", "Crystallized precise prompt 2"]
  },
  "best_prompt": {
    "content": "Final optimized prompt selected by ranking system",
    "phase": "coagulatio",
    "score": 0.95,
    "criteria": {
      "clarity": 0.94,
      "precision": 0.96,
      "completeness": 0.95
    }
  },
  "metadata": {
    "total_tokens": 1247,
    "generation_time": 3.2,
    "provider_distribution": {
      "openai": 2,
      "anthropic": 1
    }
  }
}
```

### 2. batch_generate_prompts

Generate multiple prompts efficiently from various input formats including JSON, CSV, and text files.

#### Parameters

```json
{
  "input_data": {
    "type": "array",
    "description": "Array of prompt generation requests",
    "required": true,
    "items": {
      "type": "object",
      "properties": {
        "idea": {"type": "string"},
        "provider": {"type": "string"},
        "phases": {"type": "array"}
      }
    }
  },
  "parallel_count": {
    "type": "integer",
    "description": "Number of parallel processes",
    "required": false,
    "default": 3,
    "minimum": 1,
    "maximum": 10
  },
  "save_results": {
    "type": "boolean",
    "description": "Whether to save results to database",
    "required": false,
    "default": true
  }
}
```

### 3. optimize_prompt

Optimize existing prompts using AI-powered meta-prompting and self-improvement techniques.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "UUID of the prompt to optimize",
    "required": true
  },
  "optimization_type": {
    "type": "string",
    "description": "Type of optimization to apply",
    "required": false,
    "enum": ["clarity", "precision", "creativity", "completeness"],
    "default": "precision"
  },
  "target_criteria": {
    "type": "object",
    "description": "Target optimization criteria",
    "required": false,
    "properties": {
      "clarity": {"type": "number", "minimum": 0, "maximum": 1},
      "precision": {"type": "number", "minimum": 0, "maximum": 1},
      "creativity": {"type": "number", "minimum": 0, "maximum": 1}
    }
  }
}
```

## Search & Discovery Tools

### 4. search_prompts

Search existing prompts using text search, semantic search, or advanced filtering.

#### Parameters

```json
{
  "query": {
    "type": "string",
    "description": "Search query text",
    "required": true
  },
  "search_type": {
    "type": "string",
    "description": "Type of search to perform",
    "required": false,
    "enum": ["text", "semantic", "hybrid"],
    "default": "hybrid"
  },
  "phase": {
    "type": "string",
    "description": "Filter by alchemical phase",
    "required": false,
    "enum": ["prima-materia", "solutio", "coagulatio"]
  },
  "provider": {
    "type": "string",
    "description": "Filter by provider",
    "required": false,
    "enum": ["openai", "anthropic", "google", "openrouter", "ollama"]
  },
  "tags": {
    "type": "array",
    "description": "Filter by tags",
    "required": false,
    "items": {"type": "string"}
  },
  "limit": {
    "type": "integer",
    "description": "Maximum number of results",
    "required": false,
    "default": 10,
    "minimum": 1,
    "maximum": 100
  },
  "similarity_threshold": {
    "type": "number",
    "description": "Minimum similarity score for semantic search",
    "required": false,
    "default": 0.7,
    "minimum": 0,
    "maximum": 1
  }
}
```

### 5. get_prompt_by_id

Get detailed information about a specific prompt by its UUID.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "UUID of the prompt to retrieve",
    "required": true
  },
  "include_relationships": {
    "type": "boolean",
    "description": "Include related prompts and relationships",
    "required": false,
    "default": false
  },
  "include_analytics": {
    "type": "boolean",
    "description": "Include usage analytics and performance metrics",
    "required": false,
    "default": false
  }
}
```

### 6. track_prompt_relationship

Track relationships between prompts for enhanced discovery and organization.

#### Parameters

```json
{
  "source_prompt_id": {
    "type": "string",
    "description": "UUID of the source prompt",
    "required": true
  },
  "target_prompt_id": {
    "type": "string",
    "description": "UUID of the target prompt",
    "required": true
  },
  "relationship_type": {
    "type": "string",
    "description": "Type of relationship",
    "required": true,
    "enum": ["derived_from", "similar_to", "improved_by", "variant_of"]
  },
  "strength": {
    "type": "number",
    "description": "Strength of the relationship",
    "required": false,
    "default": 0.5,
    "minimum": 0,
    "maximum": 1
  }
}
```

## Management Tools

### 7. update_prompt

Update an existing prompt's content, tags, or metadata.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "UUID of the prompt to update",
    "required": true
  },
  "updates": {
    "type": "object",
    "description": "Fields to update",
    "required": true,
    "properties": {
      "content": {"type": "string"},
      "tags": {"type": "array", "items": {"type": "string"}},
      "persona": {"type": "string"},
      "context": {"type": "string"}
    }
  }
}
```

### 8. delete_prompt

Delete an existing prompt and its associated data.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "UUID of the prompt to delete",
    "required": true
  },
  "cascade": {
    "type": "boolean",
    "description": "Whether to delete related data",
    "required": false,
    "default": false
  }
}
```

### 9. run_lifecycle_maintenance

Run database lifecycle maintenance including relevance scoring and cleanup.

#### Parameters

```json
{
  "maintenance_type": {
    "type": "string",
    "description": "Type of maintenance to perform",
    "required": false,
    "enum": ["relevance_scoring", "cleanup", "optimization", "full"],
    "default": "relevance_scoring"
  },
  "dry_run": {
    "type": "boolean",
    "description": "Preview changes without applying them",
    "required": false,
    "default": false
  }
}
```

## Analytics & Optimization Tools

### 10. get_metrics

Get prompt performance metrics and analytics.

#### Parameters

```json
{
  "metric_type": {
    "type": "string",
    "description": "Type of metrics to retrieve",
    "required": false,
    "enum": ["performance", "usage", "provider", "phase"],
    "default": "performance"
  },
  "time_range": {
    "type": "string",
    "description": "Time range for metrics",
    "required": false,
    "enum": ["24h", "7d", "30d", "90d", "all"],
    "default": "7d"
  },
  "phase": {
    "type": "string",
    "description": "Filter by alchemical phase",
    "required": false,
    "enum": ["prima-materia", "solutio", "coagulatio"]
  },
  "provider": {
    "type": "string",
    "description": "Filter by provider",
    "required": false,
    "enum": ["openai", "anthropic", "google", "openrouter", "ollama"]
  }
}
```

### 11. get_database_stats

Get comprehensive database statistics including lifecycle information.

#### Parameters

```json
{
  "include_distribution": {
    "type": "boolean",
    "description": "Include data distribution statistics",
    "required": false,
    "default": true
  },
  "include_performance": {
    "type": "boolean",
    "description": "Include performance metrics",
    "required": false,
    "default": true
  }
}
```

## Configuration & System Tools

### 12. get_config

View current configuration settings and system status.

#### Parameters

```json
{
  "section": {
    "type": "string",
    "description": "Configuration section to retrieve",
    "required": false,
    "enum": ["providers", "generation", "database", "all"],
    "default": "all"
  },
  "include_sensitive": {
    "type": "boolean",
    "description": "Include sensitive configuration (API keys masked)",
    "required": false,
    "default": false
  }
}
```

### 13. get_providers

List available providers and their capabilities.

#### Parameters

```json
{
  "include_status": {
    "type": "boolean",
    "description": "Include provider status and health checks",
    "required": false,
    "default": true
  },
  "test_connectivity": {
    "type": "boolean",
    "description": "Test connectivity to providers",
    "required": false,
    "default": false
  }
}
```

### 14. test_providers

Test provider connectivity and functionality.

#### Parameters

```json
{
  "provider": {
    "type": "string",
    "description": "Specific provider to test",
    "required": false,
    "enum": ["openai", "anthropic", "google", "openrouter", "ollama"]
  },
  "test_type": {
    "type": "string",
    "description": "Type of test to perform",
    "required": false,
    "enum": ["connectivity", "generation", "full"],
    "default": "connectivity"
  }
}
```

### 15. validate_config

Validate configuration settings and provide optimization suggestions.

#### Parameters

```json
{
  "fix_issues": {
    "type": "boolean",
    "description": "Attempt to fix validation issues",
    "required": false,
    "default": false
  },
  "include_recommendations": {
    "type": "boolean",
    "description": "Include optimization recommendations",
    "required": false,
    "default": true
  }
}
```

### 16. get_version

Get version and build information.

#### Parameters

```json
{
  "format": {
    "type": "string",
    "description": "Output format",
    "required": false,
    "enum": ["json", "text"],
    "default": "json"
  },
  "include_build_info": {
    "type": "boolean",
    "description": "Include detailed build information",
    "required": false,
    "default": true
  }
}
```

## Error Handling

### Common Error Responses

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

### Error Codes

- `INVALID_PROMPT_ID`: Prompt not found
- `PROVIDER_UNAVAILABLE`: Provider service unavailable
- `INVALID_PARAMETERS`: Invalid or missing parameters
- `GENERATION_FAILED`: Prompt generation failed
- `DATABASE_ERROR`: Database operation failed
- `QUOTA_EXCEEDED`: API quota exceeded
- `VALIDATION_ERROR`: Data validation failed

## Best Practices

### 1. Efficient Prompt Generation

```javascript
// Generate with specific phases for targeted output
const result = await tools.generate_prompts({
  idea: "Design a microservices architecture",
  phases: ["prima-materia", "coagulatio"],
  provider: "anthropic",
  count: 2
});
```

### 2. Semantic Search for Discovery

```javascript
// Use semantic search for better discovery
const prompts = await tools.search_prompts({
  query: "API authentication patterns",
  search_type: "semantic",
  similarity_threshold: 0.8,
  limit: 5
});
```

### 3. Batch Processing for Efficiency

```javascript
// Process multiple prompts efficiently
const batch_result = await tools.batch_generate_prompts({
  input_data: [
    {idea: "User authentication system", provider: "openai"},
    {idea: "Database migration tool", provider: "anthropic"},
    {idea: "REST API documentation", provider: "google"}
  ],
  parallel_count: 3
});
```

### 4. Relationship Tracking for Organization

```javascript
// Track relationships between prompts
await tools.track_prompt_relationship({
  source_prompt_id: "original-prompt-id",
  target_prompt_id: "improved-prompt-id",
  relationship_type: "improved_by",
  strength: 0.8
});
```

### 5. Performance Monitoring

```javascript
// Monitor system performance
const metrics = await tools.get_metrics({
  metric_type: "performance",
  time_range: "7d",
  provider: "openai"
});

const stats = await tools.get_database_stats({
  include_distribution: true,
  include_performance: true
});
```

### 6. Configuration Management

```javascript
// Validate and optimize configuration
const validation = await tools.validate_config({
  fix_issues: false,
  include_recommendations: true
});

// Test provider connectivity
const provider_status = await tools.test_providers({
  test_type: "full"
});
```

This comprehensive MCP tools reference provides everything needed to effectively integrate with the Prompt Alchemy system through the Model Context Protocol.