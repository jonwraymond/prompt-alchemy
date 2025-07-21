# MCP Server Quickstart Guide

## Overview

This guide helps you quickly set up and use prompt-alchemy's MCP server with self-learning capabilities.

## Quick Setup

### 1. Using Docker (Recommended)

```bash
# Build the Docker image
docker build -f Dockerfile.quickstart -t prompt-alchemy:latest .

# Run with environment variables
docker run -it \
  -e PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="your-key" \
  -e PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="your-key" \
  -v prompt-alchemy-data:/app/data \
  prompt-alchemy:latest serve mcp
```

### 2. Local Installation

```bash
# Build the binary
make build

# Create config directory
mkdir -p ~/.prompt-alchemy

# Copy quickstart config
cp config.quickstart.yaml ~/.prompt-alchemy/config.yaml

# Edit config with your API keys
vim ~/.prompt-alchemy/config.yaml

# Run MCP server
./prompt-alchemy serve mcp
```

## MCP Tools Reference

### 1. generate_prompts

Generate AI prompts with self-learning enhancement:

```json
{
  "name": "generate_prompts",
  "arguments": {
    "input": "Create a REST API for user management",
    "phases": "prima-materia,solutio,coagulatio",
    "count": 3,
    "persona": "code"
  }
}
```

**Self-Learning Features:**
- Searches for similar historical prompts
- Extracts successful patterns
- Includes best examples as context
- Provides learning insights

### 2. search_prompts

Search existing prompts using vector similarity:

```json
{
  "name": "search_prompts",
  "arguments": {
    "query": "API design patterns",
    "limit": 5
  }
}
```

### 3. optimize_prompt

Optimize prompts using AI-powered meta-prompting:

```json
{
  "name": "optimize_prompt",
  "arguments": {
    "prompt": "Write code",
    "task": "Create a Python function",
    "target_model": "claude-4-sonnet-20250522",
    "max_iterations": 5,
    "target_score": 8.5
  }
}
```

### 4. batch_generate

Generate multiple prompts concurrently:

```json
{
  "name": "batch_generate",
  "arguments": {
    "inputs": [
      {
        "input": "Design a database schema",
        "persona": "code"
      },
      {
        "input": "Write user documentation",
        "persona": "writing"
      }
    ],
    "workers": 3
  }
}
```

## Self-Learning Configuration

### Enable Self-Learning

Self-learning is enabled by default when historical data exists. Configure via:

```yaml
# config.yaml
self_learning:
  enabled: true
  min_relevance_score: 0.7
  max_examples: 3
  use_patterns: true
  use_insights: true

embeddings:
  provider: "openai"
  model: "text-embedding-3-small"
  dimensions: 1536
```

### Environment Variables

```bash
# Enable self-learning
export PROMPT_ALCHEMY_SELF_LEARNING_ENABLED=true

# Configure embedding provider
export PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER="openai"
export PROMPT_ALCHEMY_EMBEDDINGS_MODEL="text-embedding-3-small"

# Set relevance threshold
export PROMPT_ALCHEMY_SELF_LEARNING_MIN_RELEVANCE_SCORE=0.7
```

## Understanding Self-Learning Output

When self-learning is active, you'll see enhanced prompts that include:

### 1. Historical Insights
```
Provider 'openai' has been most successful for prima-materia phase (8/10 prompts)
Average successful prompt length: 450 tokens
Average successful temperature: 0.75
```

### 2. Successful Patterns
```
- Numbered lists are effective (70% success rate)
- Phrase 'step by step' appears frequently (60% success rate)
- Section headers improve clarity (80% success rate)
```

### 3. Reference Examples
```
Example 1 (Score: 0.95):
Design a RESTful API with the following requirements:
1. User authentication and authorization
2. CRUD operations for user management...
```

## Building Your Prompt History

The more you use prompt-alchemy, the better it gets:

1. **Generate Prompts**: Each generation adds to your history
2. **Rate Success**: High-scoring prompts influence future generations
3. **Consistent Usage**: Patterns emerge from repeated use
4. **Domain Expertise**: The system learns your specific domain patterns

## Monitoring Self-Learning

Check the logs for self-learning activity:

```
INFO[0001] Enhancing prompt with historical data
INFO[0002] Successfully enhanced prompt with historical data
  enhanced_length=850 
  examples_found=3 
  insights_found=3 
  patterns_found=5
```

## Best Practices

1. **Start Simple**: Begin with basic prompts to build history
2. **Use Personas**: Consistent persona usage improves pattern recognition
3. **Provide Feedback**: Rate prompts to improve learning
4. **Regular Use**: More data leads to better self-learning
5. **Domain Focus**: Specialized use cases benefit most

## Troubleshooting

### No Historical Enhancement

If prompts aren't being enhanced:
- Check that you have existing prompts in the database
- Verify embedding provider is configured
- Ensure API keys are valid
- Look for errors in logs

### Poor Pattern Recognition

If patterns aren't helpful:
- Generate more prompts (aim for 10+ per phase)
- Ensure diverse prompt types
- Check relevance scores of existing prompts

## Example Session

```bash
# Start MCP server
./prompt-alchemy serve mcp

# In another terminal, send a request
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_prompts",
    "arguments": {
      "input": "Build a machine learning pipeline",
      "persona": "code"
    }
  }
}' | nc localhost 8080
```

## Next Steps

1. **Explore Tools**: Try all available MCP tools
2. **Build History**: Generate prompts in your domain
3. **Optimize**: Use the optimize_prompt tool for refinement
4. **Monitor**: Watch how self-learning improves results
5. **Customize**: Adjust configuration for your needs

With self-learning enabled, prompt-alchemy becomes more effective with each use, learning from your successes to generate increasingly better prompts tailored to your specific needs.