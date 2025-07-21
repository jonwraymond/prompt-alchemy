# MCP Docker Setup Instructions

## Building the Docker Image

```bash
# Build the MCP-optimized Docker image
docker build -f Dockerfile.mcp -t prompt-alchemy-mcp:latest .
```

## Updating MCP Server in Claude Desktop

### Option 1: Using Docker (Recommended for isolation)

1. Open Claude Desktop settings
2. Go to Developer → Edit Config
3. Add or update the MCP server configuration:

```json
{
  "mcpServers": {
    "prompt-alchemy-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v", "${HOME}/.prompt-alchemy:/app/data",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=${OPENAI_API_KEY}",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY=${GOOGLE_API_KEY}",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_GROK_API_KEY=${GROK_API_KEY}",
        "-e", "PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER=openai",
        "-e", "PROMPT_ALCHEMY_EMBEDDINGS_MODEL=text-embedding-3-small",
        "-e", "PROMPT_ALCHEMY_EMBEDDINGS_DIMENSIONS=1536",
        "-e", "PROMPT_ALCHEMY_SELF_LEARNING_ENABLED=true",
        "-e", "PROMPT_ALCHEMY_SELF_LEARNING_MIN_RELEVANCE_SCORE=0.7",
        "-e", "PROMPT_ALCHEMY_SELF_LEARNING_MAX_EXAMPLES=3",
        "-e", "LOG_LEVEL=info",
        "prompt-alchemy-mcp:latest"
      ]
    }
  }
}
```

### Option 2: Using Local Binary (Direct execution)

```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "/Users/jraymond/Projects/prompt-alchemy/prompt-alchemy",
      "args": ["serve", "mcp"],
      "env": {
        "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
        "PROMPT_ALCHEMY_PROVIDERS_GROK_API_KEY": "${GROK_API_KEY}",
        "PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER": "openai",
        "PROMPT_ALCHEMY_EMBEDDINGS_MODEL": "text-embedding-3-small",
        "PROMPT_ALCHEMY_EMBEDDINGS_DIMENSIONS": "1536",
        "PROMPT_ALCHEMY_SELF_LEARNING_ENABLED": "true",
        "PROMPT_ALCHEMY_SELF_LEARNING_MIN_RELEVANCE_SCORE": "0.7",
        "PROMPT_ALCHEMY_SELF_LEARNING_MAX_EXAMPLES": "3",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Testing the MCP Server

### 1. Restart Claude Desktop after updating the configuration

### 2. Ensure API keys are set in your environment or Claude Desktop config

The Docker container needs access to your API keys. You can either:
- Set them in your shell: `export OPENAI_API_KEY="your-key-here"`
- Add them to Claude Desktop's environment configuration
- Use a `.env` file with your Docker setup

### 3. Test the enhanced features:

```javascript
// Test phase selection (best strategy)
await use_mcp_tool("prompt-alchemy-docker", "generate_prompts", {
  input: "Create a function that calculates fibonacci numbers",
  count: 3,
  phase_selection: "best",
  temperature: 0.7,
  max_tokens: 500
});

// Test cascade strategy
await use_mcp_tool("prompt-alchemy-docker", "generate_prompts", {
  input: "Design a REST API for a todo application",
  count: 2,
  phase_selection: "cascade",
  optimize: true
});

// Test optimization with proper scoring
await use_mcp_tool("prompt-alchemy-docker", "optimize_prompt", {
  prompt: "Write a Python function",
  target_score: 9.0,
  max_iterations: 5
});
```

## Key Improvements in This Version

1. **Phase Selection Strategies**
   - `best`: Generates variants for each phase, selects the best from each (reduces 9→3 prompts)
   - `cascade`: Uses output from each phase as input to the next
   - `all`: Returns all generated prompts (original behavior)

2. **AI Judge Implementation**
   - Properly evaluates and selects best prompts using LLM
   - Falls back to internal ranking if AI judge fails

3. **Enhanced Parameters**
   - `temperature`: Control creativity (0.0-1.0)
   - `max_tokens`: Control response length
   - `optimize`: Apply optimization after generation
   - `persona`: Specify target persona for generation

4. **Fixed Issues**
   - Scoring now displays as X/10 instead of 0.X
   - All logs go to stderr for clean JSON output
   - Self-learning integration works automatically

## Docker Benefits

- **Isolation**: Runs in container, no system dependencies
- **Persistence**: Data stored in `~/.prompt-alchemy` volume
- **Portability**: Same behavior across different systems
- **Easy Updates**: Just rebuild the image

## Troubleshooting

If the MCP server doesn't appear in Claude:
1. Check Docker is running: `docker version`
2. Verify image exists: `docker images | grep prompt-alchemy-mcp`
3. Test manually: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | docker run --rm -i prompt-alchemy-mcp:latest`
4. Check Claude logs: Help → Toggle Developer Tools → Console