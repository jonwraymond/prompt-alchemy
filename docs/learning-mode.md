---
layout: default
title: Learning Mode
---

# Learning Mode

Prompt Alchemy's learning mode implements a feedback-driven system to improve prompt quality over time.

### Process
1. Collect feedback (internal/judge/evaluator.go) via LLM scores
2. Rank prompts (internal/ranking/ranker.go) using weights/features
3. Train model nightly (cmd/nightly.go) with XGBoost stub

### Usage
promgen nightly --train

// Update any inaccurate descriptions

## Overview

When learning mode is enabled, PromGen:
- Tracks prompt effectiveness through user feedback
- Identifies successful patterns in prompt generation
- Adjusts relevance scores based on usage
- Provides AI-powered recommendations
- Maintains usage analytics for continuous improvement

## Config Example
learning:
  enabled: true
  learning_rate: 0.1
  min_samples: 100

## MCP Server Mode

The learning features are exposed through the MCP server when enabled:

```bash
# Start MCP server with learning enabled
prompt-alchemy serve

# Or with explicit config
PROMPT_ALCHEMY_LEARNING_ENABLED=true prompt-alchemy serve
```

## Available Tools

### 1. record_feedback

Records user feedback about prompt effectiveness:

```json
{
  "tool": "record_feedback",
  "arguments": {
    "prompt_id": "b17deed2-f9f7-443f-a879-ca87941c9308",
    "effectiveness": 0.85,
    "rating": 4,
    "session_id": "session-123",
    "context": "Used for API documentation generation"
  }
}
```

### 2. get_recommendations

Get AI-powered prompt recommendations based on learned patterns:

```json
{
  "tool": "get_recommendations",
  "arguments": {
    "input": "Create a chatbot for customer service",
    "limit": 5
  }
}
```

### 3. get_learning_stats

View current learning statistics:

```json
{
  "tool": "get_learning_stats",
  "arguments": {
    "include_patterns": true
  }
}
```

## How It Works

### Pattern Recognition

The learning engine identifies patterns in:
- **Success patterns**: Prompts with effectiveness > 0.8
- **Failure patterns**: Prompts with effectiveness < 0.3
- **Optimization patterns**: Improvements between prompt versions

### Relevance Scoring

Relevance scores are updated based on:
- Usage frequency
- User feedback ratings
- Effectiveness scores
- Time decay (older unused prompts decay)

### Adaptive Ranking

The system uses exponential moving averages to track:
- Success rates
- Average latency
- User satisfaction
- Context matches

## Background Processes

When learning mode is enabled, three background processes run:

1. **Relevance Decay**: Hourly process that reduces relevance of unused prompts
2. **Pattern Consolidation**: 6-hour process that merges similar patterns
3. **Metrics Cleanup**: Daily process that removes old metrics data

## Database Schema

Learning mode uses additional tables:

### usage_analytics
- Tracks how prompts are used
- Records effectiveness scores
- Links generated prompts to source prompts

### Automatic Triggers
- Updates usage count on prompt access
- Increases relevance score with usage
- Timestamps all interactions

## Best Practices

1. **Consistent Feedback**: Encourage users to provide feedback regularly
2. **Meaningful Ratings**: Use the full 1-5 scale for ratings
3. **Context Matters**: Always provide context with feedback
4. **Monitor Patterns**: Review learning stats periodically
5. **Adjust Parameters**: Fine-tune learning rate and decay rate based on usage

## Example Workflow

```bash
# 1. Generate prompt
./prompt-alchemy generate "Create API documentation"

# 2. Use the prompt and evaluate effectiveness
# (Prompt ID: abc-123)

# 3. Record feedback
curl -X POST http://localhost:8080/mcp \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "record_feedback",
      "arguments": {
        "prompt_id": "abc-123",
        "effectiveness": 0.9,
        "rating": 5,
        "context": "Worked perfectly for REST API docs"
      }
    }
  }'

# 4. Get recommendations for similar tasks
curl -X POST http://localhost:8080/mcp \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_recommendations",
      "arguments": {
        "input": "Create GraphQL documentation",
        "limit": 3
      }
    }
  }'
```

## Performance Considerations

- Learning mode adds ~10-15% overhead to prompt generation
- Background processes use minimal resources
- Pattern storage is capped at 10,000 patterns
- Metrics are automatically cleaned after feedback window

## Privacy & Security

- All learning data stays local to your instance
- No external services are used for learning
- Feedback data can be exported/deleted anytime
- Learning can be disabled without data loss

## Usage Examples
promgen nightly

curl -X POST localhost:8080/mcp -d '{"method":"record_feedback","params":{"prompt_id":"uuid","score":0.8}}'

## Troubleshooting
- No improvements: Check feedback collection
- High CPU: Reduce training frequency

## Future Enhancements

- Machine learning model integration
- Cross-session pattern sharing
- A/B testing framework
- Automated prompt optimization
- Multi-user collaboration features