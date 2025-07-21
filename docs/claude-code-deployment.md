# Claude Code Deployment Guide

## Quick Setup

The prompt-alchemy MCP server is now configured and ready to use with Claude Code!

### ✅ **Current Status**
- MCP server: **Configured** (`.mcp.json` created)
- Binary: **Built** (`./prompt-alchemy`)
- Tools: **6 tools available**
- Self-learning: **Enabled**
- Storage: **Hybrid SQLite + chromem-go**

### 🔧 **Setup Required**

1. **Set API Keys** (Required for operation):
   ```bash
   export OPENAI_API_KEY='your-key-here'
   export ANTHROPIC_API_KEY='your-key-here'
   export GOOGLE_API_KEY='your-key-here'
   ```

2. **Restart Claude Code** to pick up the new MCP server configuration

3. **Test the tools** in your next conversation

## Available Tools

### 🚀 **generate_prompts**
Generate AI prompts with self-learning enhancement
- **Input**: Your prompt idea
- **Output**: Enhanced prompts through 3 alchemical phases
- **Self-learning**: Automatically improves based on historical data

### 🔍 **search_prompts**
Search existing prompts using vector similarity
- **Input**: Search query
- **Output**: Similar prompts from your history

### ⚡ **optimize_prompt**
Optimize prompts using AI-powered meta-prompting
- **Input**: Prompt to optimize
- **Output**: Improved prompt with scoring

### 🔄 **batch_generate**
Generate multiple prompts concurrently
- **Input**: Multiple prompt requests
- **Output**: Parallel generation results

### 📝 **get_prompt**
Retrieve specific prompt by ID
- **Input**: Prompt ID
- **Output**: Full prompt details

### 📊 **list_providers**
List available LLM providers
- **Output**: Available providers (OpenAI, Anthropic, Google, etc.)

## Self-Learning Features

The system automatically:
- **Learns from your prompts** - Each generation improves future results
- **Finds similar patterns** - Uses vector embeddings to find relevant history
- **Extracts successful patterns** - Identifies what works best
- **Provides insights** - Shows which providers, temperatures, etc. work best

## Configuration Files

### Project Configuration (`.mcp.json`)
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": {
        "program": "/Users/jraymond/Projects/prompt-alchemy/prompt-alchemy",
        "args": ["serve", "mcp"]
      },
      "env": {
        "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "PROMPT_ALCHEMY_SELF_LEARNING_ENABLED": "true",
        "PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER": "openai"
      }
    }
  }
}
```

### User Configuration (`~/.prompt-alchemy/config.yaml`)
The server uses your existing configuration with enhanced self-learning settings.

## Usage Examples

### Example 1: Generate Code Prompts
```
Can you use the generate_prompts tool to create prompts for "Build a REST API for user authentication"?
```

### Example 2: Search Your History
```
Use search_prompts to find similar prompts to "database design patterns"
```

### Example 3: Optimize a Prompt
```
Use optimize_prompt to improve this prompt: "Write Python code"
```

### Example 4: Batch Generation
```
Use batch_generate to create prompts for multiple tasks: API design, database schema, and user interface
```

## Storage and Data

### Database Location
- **SQLite**: `~/.prompt-alchemy/prompts.db`
- **Vector Store**: `~/.prompt-alchemy/chromem-vectors/`

### Data Persistence
- All prompts are saved automatically
- Self-learning data accumulates over time
- Better results with more usage

## Troubleshooting

### 1. Tools Not Available
- **Solution**: Restart Claude Code after adding the MCP server
- **Check**: Verify `.mcp.json` exists in the project root

### 2. Provider Errors
- **Solution**: Set API keys in environment variables
- **Check**: `echo $OPENAI_API_KEY` should show your key

### 3. Self-Learning Not Working
- **Solution**: Generate a few prompts first to build history
- **Check**: Database files exist in `~/.prompt-alchemy/`

### 4. Performance Issues
- **Solution**: Self-learning improves with more data
- **Check**: Look for "enhanced prompt" messages in logs

## Advanced Configuration

### Custom Embedding Model
```bash
export PROMPT_ALCHEMY_EMBEDDINGS_MODEL="text-embedding-3-large"
export PROMPT_ALCHEMY_EMBEDDINGS_DIMENSIONS="3072"
```

### Adjust Learning Parameters
```bash
export PROMPT_ALCHEMY_SELF_LEARNING_MIN_RELEVANCE_SCORE="0.8"
export PROMPT_ALCHEMY_SELF_LEARNING_MAX_EXAMPLES="5"
```

### Debug Mode
```bash
export LOG_LEVEL="debug"
```

## Next Steps

1. **Set your API keys** in environment variables
2. **Restart Claude Code** to load the MCP server
3. **Start generating prompts** to build your learning history
4. **Experiment with different tools** to explore capabilities
5. **Monitor improvements** as the system learns your patterns

The more you use prompt-alchemy, the better it becomes at generating prompts tailored to your specific needs and style!

## Support

- **Project**: [prompt-alchemy](https://github.com/jonwraymond/prompt-alchemy)
- **Issues**: Report problems via GitHub issues
- **Documentation**: `/docs` directory contains detailed guides