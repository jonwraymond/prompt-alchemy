---
layout: default
title: MCP Tools Reference
---

# MCP Tools Reference

This comprehensive reference covers all available MCP tools, resources, and prompts for Prompt Alchemy integration.

## Table of Contents

1. [Overview](#overview)
2. [Core Tools](#core-tools)
3. [Resources](#resources)
4. [Prompts](#prompts)
5. [Advanced Usage](#advanced-usage)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Overview

The Prompt Alchemy MCP server provides three main types of capabilities:

- **Tools**: Functions that AI assistants can call to perform actions
- **Resources**: Data sources that can be queried and accessed
- **Prompts**: Pre-defined templates for common operations

## Core Tools

### 1. generate_prompt

Generates a multi-phase prompt using the Prompt Alchemy engine.

#### Parameters

```json
{
  "idea": {
    "type": "string",
    "description": "The initial prompt idea or concept",
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
  "persona": {
    "type": "string",
    "description": "Persona to apply for generation",
    "required": false,
    "enum": ["code", "creative", "analytical", "technical", "business"],
    "default": "code"
  },
  "temperature": {
    "type": "number",
    "description": "Temperature for generation (0.0-1.0)",
    "required": false,
    "minimum": 0.0,
    "maximum": 1.0,
    "default": 0.7
  },
  "max_tokens": {
    "type": "integer",
    "description": "Maximum tokens for generation",
    "required": false,
    "minimum": 100,
    "maximum": 4000,
    "default": 2000
  },
  "phases": {
    "type": "array",
    "description": "Specific phases to run",
    "required": false,
    "items": {
      "enum": ["idea", "human", "precision"]
    },
    "default": ["idea", "human", "precision"]
  },
  "context": {
    "type": "string",
    "description": "Additional context for prompt generation",
    "required": false
  },
  "target_model": {
    "type": "string",
    "description": "Target model for prompt optimization",
    "required": false,
    "enum": ["o4-mini", "claude-sonnet-4-20250514", "gemini-2.5-flash", "openrouter/auto"]
  }
}
```

#### Response

```json
{
  "status": "success",
  "prompt_id": "prompt_abc123",
  "phases": {
    "idea": {
      "content": "Generated idea phase prompt",
      "provider": "openai",
      "model": "o4-mini",
      "tokens_used": 150,
      "processing_time": 1200
    },
    "human": {
      "content": "Generated human-centric prompt",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "tokens_used": 200,
      "processing_time": 1500
    },
    "precision": {
      "content": "Generated precision-focused prompt",
      "provider": "openai",
      "model": "o4-mini",
      "tokens_used": 180,
      "processing_time": 1100
    }
  },
  "best_prompt": {
    "content": "Final optimized prompt selected by ranking system",
    "phase": "precision",
    "score": 0.95,
    "criteria": {
      "temperature": 0.92,
      "token_efficiency": 0.96,
      "context_relevance": 0.97,
      "clarity": 0.94
    }
  },
  "ranking": [
    {
      "phase": "precision",
      "score": 0.95,
      "rank": 1
    },
    {
      "phase": "human",
      "score": 0.87,
      "rank": 2
    },
    {
      "phase": "idea",
      "score": 0.82,
      "rank": 3
    }
  ],
  "metadata": {
    "total_tokens": 530,
    "total_cost": 0.0053,
    "processing_time": 3800,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Usage Examples

**Basic Generation:**
```javascript
// In Claude Desktop or any MCP client
await callTool("generate_prompt", {
  "idea": "Write a Python function to calculate fibonacci numbers"
});
```

**Advanced Generation:**
```javascript
await callTool("generate_prompt", {
  "idea": "Create a microservice architecture for e-commerce",
  "provider": "anthropic",
  "persona": "technical",
  "temperature": 0.5,
  "max_tokens": 3000,
  "phases": ["idea", "precision"],
  "context": "Focus on scalability and security",
  "target_model": "claude-3-opus"
});
```

### 2. search_prompts

Searches existing prompts in the database using text or semantic search.

#### Parameters

```json
{
  "query": {
    "type": "string",
    "description": "Search query string",
    "required": true,
    "example": "API authentication security"
  },
  "search_type": {
    "type": "string",
    "description": "Type of search to perform",
    "required": false,
    "enum": ["text", "semantic", "hybrid"],
    "default": "hybrid"
  },
  "limit": {
    "type": "integer",
    "description": "Maximum number of results to return",
    "required": false,
    "minimum": 1,
    "maximum": 100,
    "default": 10
  },
  "offset": {
    "type": "integer",
    "description": "Number of results to skip (for pagination)",
    "required": false,
    "minimum": 0,
    "default": 0
  },
  "filters": {
    "type": "object",
    "description": "Filters to apply to search results",
    "required": false,
    "properties": {
      "provider": {
        "type": "string",
        "enum": ["openai", "anthropic", "google", "openrouter", "ollama"]
      },
      "phase": {
        "type": "string",
        "enum": ["idea", "human", "precision"]
      },
      "persona": {
        "type": "string",
        "enum": ["code", "creative", "analytical", "technical", "business"]
      },
      "min_score": {
        "type": "number",
        "minimum": 0.0,
        "maximum": 1.0
      },
      "date_range": {
        "type": "object",
        "properties": {
          "start": {"type": "string", "format": "date-time"},
          "end": {"type": "string", "format": "date-time"}
        }
      },
      "tags": {
        "type": "array",
        "items": {"type": "string"}
      }
    }
  },
  "sort": {
    "type": "string",
    "description": "Sort order for results",
    "required": false,
    "enum": ["relevance", "date", "score", "usage"],
    "default": "relevance"
  },
  "include_metadata": {
    "type": "boolean",
    "description": "Include detailed metadata in results",
    "required": false,
    "default": false
  }
}
```

#### Response

```json
{
  "status": "success",
  "total_results": 25,
  "page": 1,
  "per_page": 10,
  "results": [
    {
      "id": "prompt_xyz789",
      "content": "Create a secure REST API endpoint for user authentication...",
      "phase": "precision",
      "provider": "openai",
      "model": "o4-mini",
      "score": 0.95,
      "similarity_score": 0.87,
      "usage_count": 15,
      "last_used": "2024-01-14T15:20:00Z",
      "created_at": "2024-01-10T09:15:00Z",
      "tags": ["api", "authentication", "security", "rest"],
      "metadata": {
        "tokens_used": 250,
        "cost": 0.0025,
        "temperature": 0.7,
        "persona": "technical"
      }
    }
  ],
  "search_metadata": {
    "query_processed": "API authentication security",
    "search_type": "hybrid",
    "embedding_model": "text-embedding-3-small",
    "processing_time": 150
  }
}
```

#### Usage Examples

**Basic Search:**
```javascript
await callTool("search_prompts", {
  "query": "user authentication"
});
```

**Advanced Semantic Search:**
```javascript
await callTool("search_prompts", {
  "query": "secure login system with JWT tokens",
  "search_type": "semantic",
  "limit": 5,
  "filters": {
    "provider": "anthropic",
    "phase": "precision",
    "min_score": 0.8,
    "tags": ["security", "jwt"]
  },
  "sort": "score",
  "include_metadata": true
});
```

### 3. optimize_prompt

Optimizes an existing prompt using meta-prompting techniques.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "ID of the prompt to optimize",
    "required": true,
    "example": "prompt_abc123"
  },
  "optimization_criteria": {
    "type": "array",
    "description": "Criteria for optimization",
    "required": false,
    "items": {
      "enum": ["clarity", "conciseness", "specificity", "effectiveness", "token_efficiency"]
    },
    "default": ["clarity", "effectiveness"]
  },
  "target_model": {
    "type": "string",
    "description": "Target model for optimization",
    "required": false,
    "enum": ["o4-mini", "claude-sonnet-4-20250514", "gemini-2.5-flash", "openrouter/auto"]
  },
  "optimization_provider": {
    "type": "string",
    "description": "Provider to use for optimization",
    "required": false,
    "enum": ["openai", "anthropic", "google"],
    "default": "openai"
  },
  "context": {
    "type": "string",
    "description": "Additional context for optimization",
    "required": false
  },
  "max_iterations": {
    "type": "integer",
    "description": "Maximum optimization iterations",
    "required": false,
    "minimum": 1,
    "maximum": 5,
    "default": 3
  },
  "preserve_intent": {
    "type": "boolean",
    "description": "Whether to preserve original intent",
    "required": false,
    "default": true
  }
}
```

#### Response

```json
{
  "status": "success",
  "optimization_id": "opt_def456",
  "original_prompt": {
    "id": "prompt_abc123",
    "content": "Original prompt content...",
    "score": 0.75
  },
  "optimized_prompt": {
    "id": "prompt_ghi789",
    "content": "Optimized prompt content...",
    "score": 0.92
  },
  "improvements": {
    "clarity": {
      "before": 0.70,
      "after": 0.90,
      "improvement": 0.20
    },
    "conciseness": {
      "before": 0.65,
      "after": 0.85,
      "improvement": 0.20
    },
    "specificity": {
      "before": 0.80,
      "after": 0.95,
      "improvement": 0.15
    },
    "effectiveness": {
      "before": 0.75,
      "after": 0.92,
      "improvement": 0.17
    },
    "token_efficiency": {
      "before": 0.60,
      "after": 0.88,
      "improvement": 0.28
    }
  },
  "optimization_steps": [
    {
      "iteration": 1,
      "changes": ["Improved clarity", "Reduced verbosity"],
      "score": 0.82
    },
    {
      "iteration": 2,
      "changes": ["Enhanced specificity", "Better structure"],
      "score": 0.89
    },
    {
      "iteration": 3,
      "changes": ["Final polish", "Token optimization"],
      "score": 0.92
    }
  ],
  "metadata": {
    "optimization_provider": "openai",
    "target_model": "gpt-4",
    "iterations": 3,
    "total_tokens": 450,
    "processing_time": 2500,
    "cost": 0.0045,
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

### 4. evaluate_prompt

Evaluates a prompt using LLM-as-a-Judge methodology.

#### Parameters

```json
{
  "prompt_id": {
    "type": "string",
    "description": "ID of the prompt to evaluate",
    "required": true
  },
  "evaluation_criteria": {
    "type": "array",
    "description": "Criteria for evaluation",
    "required": false,
    "items": {
      "enum": ["clarity", "specificity", "completeness", "coherence", "effectiveness"]
    },
    "default": ["clarity", "specificity", "effectiveness"]
  },
  "judge_provider": {
    "type": "string",
    "description": "Provider to use for evaluation",
    "required": false,
    "enum": ["openai", "anthropic", "google"],
    "default": "openai"
  },
  "test_cases": {
    "type": "array",
    "description": "Test cases to evaluate against",
    "required": false,
    "items": {
      "type": "object",
      "properties": {
        "input": {"type": "string"},
        "expected_output": {"type": "string"},
        "context": {"type": "string"}
      }
    }
  }
}
```

### 5. export_prompts

Exports prompts in various formats.

#### Parameters

```json
{
  "format": {
    "type": "string",
    "description": "Export format",
    "required": false,
    "enum": ["json", "csv", "markdown", "yaml"],
    "default": "json"
  },
  "filters": {
    "type": "object",
    "description": "Filters for export",
    "required": false
  },
  "include_metadata": {
    "type": "boolean",
    "description": "Include metadata in export",
    "required": false,
    "default": true
  }
}
```

### 6. get_analytics

Retrieves analytics and metrics data.

#### Parameters

```json
{
  "report_type": {
    "type": "string",
    "description": "Type of analytics report",
    "required": false,
    "enum": ["usage", "performance", "cost", "provider", "daily", "weekly", "monthly"],
    "default": "usage"
  },
  "date_range": {
    "type": "object",
    "description": "Date range for analytics",
    "required": false,
    "properties": {
      "start": {"type": "string", "format": "date"},
      "end": {"type": "string", "format": "date"}
    }
  },
  "grouping": {
    "type": "string",
    "description": "How to group results",
    "required": false,
    "enum": ["provider", "phase", "persona", "day", "week", "month"]
  }
}
```

### 7. manage_tags

Manages tags for prompt organization.

#### Parameters

```json
{
  "action": {
    "type": "string",
    "description": "Action to perform",
    "required": true,
    "enum": ["add", "remove", "list", "update"]
  },
  "prompt_id": {
    "type": "string",
    "description": "ID of the prompt (required for add/remove)",
    "required": false
  },
  "tags": {
    "type": "array",
    "description": "Tags to add or remove",
    "required": false,
    "items": {"type": "string"}
  }
}
```

## Resources

### 1. prompt-alchemy://prompts

Provides access to the prompt database.

#### Capabilities
- **Read**: Access prompt content and metadata
- **Query**: Search and filter prompts
- **Subscribe**: Get notifications on prompt updates

#### Usage

```javascript
// Access prompt database
const prompts = await readResource("prompt-alchemy://prompts");

// Query specific prompts
const filteredPrompts = await readResource("prompt-alchemy://prompts?filter=phase:precision&limit=5");

// Access prompt by ID
const prompt = await readResource("prompt-alchemy://prompts/prompt_abc123");
```

### 2. prompt-alchemy://metrics

Provides access to usage metrics and analytics.

#### Capabilities
- **Usage Statistics**: Token usage, API calls, costs
- **Performance Metrics**: Response times, success rates
- **Trend Analysis**: Usage patterns over time

#### Usage

```javascript
// Get overall metrics
const metrics = await readResource("prompt-alchemy://metrics");

// Get provider-specific metrics
const providerMetrics = await readResource("prompt-alchemy://metrics/providers");

// Get daily usage
const dailyUsage = await readResource("prompt-alchemy://metrics/daily");
```

### 3. prompt-alchemy://providers

Provides information about LLM provider status and configuration.

#### Capabilities
- **Status Checks**: Provider availability and health
- **Configuration**: Model settings and capabilities
- **Usage Limits**: Rate limits and quotas

#### Usage

```javascript
// Get all provider status
const providers = await readResource("prompt-alchemy://providers");

// Get specific provider info
const openaiStatus = await readResource("prompt-alchemy://providers/openai");

// Check provider capabilities
const capabilities = await readResource("prompt-alchemy://providers/capabilities");
```

### 4. prompt-alchemy://config

Provides access to system configuration.

#### Capabilities
- **Settings**: Current configuration values
- **Validation**: Configuration validation
- **Updates**: Configuration change notifications

### 5. prompt-alchemy://history

Provides access to prompt generation history.

#### Capabilities
- **Timeline**: Chronological prompt history
- **Relationships**: Prompt derivation chains
- **Analytics**: Historical trends and patterns

## Prompts

### 1. generate-code-prompt

Pre-configured prompt for code generation tasks.

#### Parameters
- `language`: Programming language
- `framework`: Framework/library
- `complexity`: Simple, medium, complex
- `style`: Code style preferences

#### Usage

```javascript
await usePrompt("generate-code-prompt", {
  language: "python",
  framework: "fastapi",
  complexity: "medium",
  style: "clean"
});
```

### 2. optimize-for-model

Prompt template for model-specific optimization.

#### Parameters
- `target_model`: Target model name
- `optimization_type`: Speed, accuracy, cost
- `constraints`: Specific constraints

### 3. evaluate-quality

Prompt template for quality evaluation.

#### Parameters
- `criteria`: Evaluation criteria
- `context`: Evaluation context
- `benchmark`: Comparison benchmark

## Advanced Usage

### Chaining Tools

```javascript
// Generate, then optimize, then evaluate
const generated = await callTool("generate_prompt", {
  idea: "Create a chatbot for customer support"
});

const optimized = await callTool("optimize_prompt", {
  prompt_id: generated.prompt_id,
  optimization_criteria: ["clarity", "effectiveness"]
});

const evaluation = await callTool("evaluate_prompt", {
  prompt_id: optimized.optimized_prompt.id,
  evaluation_criteria: ["clarity", "specificity", "effectiveness"]
});
```

### Batch Operations

```javascript
// Search and optimize multiple prompts
const searchResults = await callTool("search_prompts", {
  query: "authentication",
  limit: 5
});

const optimizations = await Promise.all(
  searchResults.results.map(prompt => 
    callTool("optimize_prompt", {
      prompt_id: prompt.id,
      optimization_criteria: ["token_efficiency"]
    })
  )
);
```

### Workflow Automation

```javascript
// Automated prompt improvement workflow
async function improvePrompt(idea) {
  // Generate initial prompt
  const generated = await callTool("generate_prompt", { idea });
  
  // Search for similar prompts
  const similar = await callTool("search_prompts", {
    query: idea,
    search_type: "semantic",
    limit: 3
  });
  
  // Optimize based on best practices
  const optimized = await callTool("optimize_prompt", {
    prompt_id: generated.prompt_id,
    optimization_criteria: ["clarity", "effectiveness", "token_efficiency"]
  });
  
  // Evaluate final result
  const evaluation = await callTool("evaluate_prompt", {
    prompt_id: optimized.optimized_prompt.id
  });
  
  return {
    original: generated,
    optimized: optimized,
    evaluation: evaluation
  };
}
```

## Error Handling

### Common Error Types

1. **ValidationError**: Invalid parameters
2. **NotFoundError**: Prompt/resource not found
3. **AuthenticationError**: API key issues
4. **RateLimitError**: Rate limit exceeded
5. **ProcessingError**: Generation/optimization failed

### Error Response Format

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid parameter: temperature must be between 0.0 and 1.0",
    "code": "INVALID_PARAMETER",
    "details": {
      "parameter": "temperature",
      "value": 1.5,
      "expected": "number between 0.0 and 1.0"
    }
  }
}
```

### Error Handling Best Practices

```javascript
try {
  const result = await callTool("generate_prompt", params);
  return result;
} catch (error) {
  switch (error.type) {
    case "ValidationError":
      console.error("Parameter validation failed:", error.message);
      break;
    case "RateLimitError":
      console.error("Rate limit exceeded, retrying in:", error.retry_after);
      break;
    case "ProcessingError":
      console.error("Generation failed:", error.message);
      break;
    default:
      console.error("Unexpected error:", error);
  }
}
```

## Best Practices

### 1. Tool Selection

- Use **generate_prompt** for new prompt creation
- Use **search_prompts** to find existing solutions
- Use **optimize_prompt** to improve existing prompts
- Use **evaluate_prompt** for quality assessment

### 2. Parameter Optimization

- Start with default parameters
- Adjust temperature based on creativity needs
- Use appropriate providers for different tasks
- Set reasonable token limits

### 3. Resource Management

- Cache frequently accessed resources
- Use pagination for large result sets
- Monitor API usage and costs
- Implement retry logic for failures

### 4. Security

- Validate all inputs
- Use environment variables for API keys
- Implement rate limiting
- Log security-relevant events

### 5. Performance

- Use batch operations when possible
- Implement caching strategies
- Monitor response times
- Optimize database queries

This comprehensive reference provides detailed information about all available MCP tools, their parameters, responses, and usage patterns for effective Prompt Alchemy integration.