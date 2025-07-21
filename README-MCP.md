# 🧪 Prompt Alchemy MCP Server

> **AI prompt generation with self-learning capabilities for Claude Code**

## Quick Start

The prompt-alchemy MCP server is **ready to use** with Claude Code! 

### 1. Set API Keys
```bash
export OPENAI_API_KEY='your-key-here'
export ANTHROPIC_API_KEY='your-key-here'  # Optional
export GOOGLE_API_KEY='your-key-here'     # Optional
```

### 2. Restart Claude Code
The server is already configured via `.mcp.json` - just restart Claude Code to activate it.

### 3. Use the Tools
Try these commands in your next conversation:
- `generate_prompts` - Create enhanced prompts with self-learning
- `search_prompts` - Find similar prompts in your history
- `optimize_prompt` - Improve prompts with meta-prompting
- `batch_generate` - Generate multiple prompts at once

## ✨ Self-Learning Features

The system automatically gets better with each use:
- **Learns from your patterns** - Identifies what works best for you
- **Finds similar context** - Uses vector embeddings to enhance prompts
- **Extracts successful patterns** - Recognizes effective structures and phrases
- **Provides insights** - Shows which providers and settings work best

## 🛠️ Available Tools

| Tool | Description | Self-Learning |
|------|-------------|---------------|
| `generate_prompts` | Generate AI prompts through 3 alchemical phases | ✅ Enhanced with historical data |
| `search_prompts` | Search existing prompts using vector similarity | ✅ Uses embedding search |
| `optimize_prompt` | Optimize prompts with AI-powered meta-prompting | ✅ Learns from optimization results |
| `batch_generate` | Generate multiple prompts concurrently | ✅ Parallel self-learning |
| `get_prompt` | Retrieve specific prompt by ID | - |
| `list_providers` | List available LLM providers | - |

## 📊 How Self-Learning Works

1. **First Use**: System generates basic prompts
2. **Learning Phase**: Each prompt adds to your history
3. **Pattern Recognition**: System identifies successful patterns
4. **Enhancement**: Future prompts incorporate learned insights
5. **Continuous Improvement**: Quality increases with usage

### Example Enhancement
```
Original Input: "Create a function to calculate fibonacci numbers"

Enhanced Input (after learning):
- Historical insights about best providers
- Successful patterns (numbered lists, step-by-step)
- Reference examples from high-scoring prompts
- Optimal temperature and parameter settings
```

## 🔧 Configuration

The server is pre-configured with optimal settings:
- **Storage**: Hybrid SQLite + chromem-go vector database
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Learning**: Enabled with 0.7 relevance threshold
- **Providers**: OpenAI, Anthropic, Google, Grok, Ollama, OpenRouter

## 📈 Usage Tips

1. **Start Simple**: Generate a few basic prompts to build history
2. **Be Consistent**: Use similar personas and patterns for better learning
3. **Iterate**: Use optimize_prompt to refine your prompts
4. **Explore**: Try different providers and settings
5. **Monitor**: Watch for "enhanced prompt" messages in logs

## 🎯 Example Workflows

### Code Generation
```
Use generate_prompts to create prompts for:
"Build a REST API with user authentication, rate limiting, and database integration"
```

### Content Creation
```
Use generate_prompts with persona="writing" for:
"Create technical documentation for a new API"
```

### Optimization
```
Use optimize_prompt to improve:
"Write Python code for data processing"
```

### Batch Processing
```
Use batch_generate for multiple tasks:
- API design
- Database schema
- User interface mockups
```

## 📁 Data Storage

- **Database**: `~/.prompt-alchemy/prompts.db`
- **Vectors**: `~/.prompt-alchemy/chromem-vectors/`
- **Config**: `~/.prompt-alchemy/config.yaml`

All data persists between sessions and improves with usage.

## 🚀 Ready to Use!

The prompt-alchemy MCP server is configured and ready. Just:
1. Set your API keys
2. Restart Claude Code
3. Start generating better prompts with self-learning!

---

*For detailed documentation, see `/docs/claude-code-deployment.md`*