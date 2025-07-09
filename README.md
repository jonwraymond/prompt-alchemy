# Prompt Alchemy

A sophisticated AI prompt generation system that uses a phased approach to create, refine, and optimize prompts for maximum effectiveness.

## Features

- **🔄 Phased Generation**: Three-phase approach (Idea → Human → Precision)
- **🤖 Multi-Provider Support**: OpenAI, Claude (via Anthropic), Gemini, and OpenRouter
- **💾 Smart Storage**: SQLite-based prompt catalog with context accumulation
- **🎯 Intelligent Ranking**: Advanced scoring based on temperature, tokens, and context
- **📊 Performance Tracking**: A/B testing and metrics for continuous improvement
- **🔌 MCP Integration**: AI agent-friendly interface for seamless integration
- **⚡ Fast & Efficient**: Parallel processing and optimized for speed
- **📈 Detailed Metadata**: Complete model usage tracking including costs and performance

## Installation

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Build the CLI
go build -o prompt-alchemy cmd/main.go

# Or install directly
go install github.com/jonwraymond/prompt-alchemy/cmd@latest
```

## Configuration

Create a configuration file at `~/.prompt-alchemy/config.yaml`:

```yaml
# Provider configurations
providers:
  openai:
    api_key: "your-openai-api-key"
    model: "gpt-4-turbo-preview"
  
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openai/gpt-4-turbo-preview"
  
  claude:
    api_key: "your-anthropic-api-key"
    model: "claude-3-opus-20240229"
  
  gemini:
    api_key: "your-google-api-key"
    model: "gemini-pro"

# Phase configurations
phases:
  idea:
    provider: "openai"
  human:
    provider: "claude"
  precision:
    provider: "gemini"

# Generation settings
generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
```

Alternatively, use environment variables:
```bash
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="your-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="your-key"
```

## Usage

### Generate Prompts

Basic usage:
```bash
prompt-alchemy generate "Create a prompt for writing technical documentation"
```

Example output:
```
Generated Prompts:
================================================================================

[1] Phase: idea | Provider: openai | Model: gpt-4-turbo-preview
----------------------------------------
You are an expert prompt engineer. Create a comprehensive prompt that generates content for general audience, using professional tone, focusing on Create a prompt for writing...

Model Details:
  Generation Model: gpt-4-turbo-preview (openai)
  Embedding Model: text-embedding-ada-002 (openai)
  Processing Time: 1247 ms
  Tokens: 89 input, 156 output, 156 total
  Estimated Cost: $0.004680

Ranking Score: 0.85
- Temperature Score: 1.00
- Token Score: 0.92
- Context Score: 0.78

[2] Phase: human | Provider: claude | Model: claude-3-opus-20240229
----------------------------------------
I want you to help me write technical documentation that really connects with readers...

Model Details:
  Generation Model: claude-3-opus-20240229 (claude)
  Processing Time: 1523 ms
  Tokens: 156 input, 203 output, 203 total
  Estimated Cost: $0.015225

Ranking Score: 0.91
================================================================================
Total Estimated Cost: $0.024561
----------------------------------------

Best Prompt (Score: 0.91):
Model: claude-3-opus-20240229 | Phase: human
----------------------------------------
I want you to help me write technical documentation that really connects with readers...

Cost: $0.015225 | Tokens: 203 | Time: 1523 ms
```

Advanced options:
```bash
# Specify phases
prompt-alchemy generate --phases "idea,human" "Your prompt idea"

# Generate multiple variants
prompt-alchemy generate --count 5 "Your prompt idea"

# Custom temperature and tokens
prompt-alchemy generate --temperature 0.8 --max-tokens 3000 "Your prompt idea"

# Add tags for organization
prompt-alchemy generate --tags "technical,documentation" "Your prompt idea"

# Use specific provider for all phases
prompt-alchemy generate --provider openrouter "Your prompt idea"

# Output as JSON with full metadata
prompt-alchemy generate --output json "Your prompt idea"
```

### Search Prompts

```bash
# Search by content (coming soon)
prompt-alchemy search "authentication flow"

# Filter by tags
prompt-alchemy search --tags "technical" "documentation"

# Filter by phase
prompt-alchemy search --phase human "natural language"

# Filter by model
prompt-alchemy search --model "gpt-4-turbo-preview"
```

### View Metrics

```bash
# View performance metrics (coming soon)
prompt-alchemy metrics --report weekly

# View metrics for specific prompt
prompt-alchemy metrics --prompt-id <uuid>
```

### MCP Server Mode

For AI agents:
```bash
# Start MCP server (coming soon)
prompt-alchemy serve --mcp
```

## Architecture

### Phased Approach

1. **Idea Phase**: Creates comprehensive base prompts with clear structure
2. **Human Phase**: Adds natural language and emotional resonance  
3. **Precision Phase**: Optimizes for clarity, token efficiency, and effectiveness

### Model Metadata Tracking

Every prompt generation captures detailed metadata:

- **Generation Details**: Model used, provider, processing time
- **Token Usage**: Input tokens, output tokens, total consumption
- **Cost Tracking**: Estimated costs based on current provider pricing
- **Embedding Information**: Models and providers used for embeddings
- **Performance Metrics**: Response times and efficiency scores

### Data Storage

Prompts are stored in `~/.prompt-alchemy/prompts.db` with:
- Full prompt content and metadata
- Detailed model usage information
- Embeddings for semantic search
- Performance metrics and cost tracking
- Context relationships

Database schema includes:
- `prompts` table with basic prompt info and model references
- `model_metadata` table with detailed generation information
- `metrics` table for performance tracking
- `context` table for relationship mapping

### Ranking System

Prompts are ranked based on:
- **Temperature Score** (20%): Optimal around 0.7
- **Token Efficiency** (20%): Balanced length preference  
- **Context Relevance** (40%): Similarity to input
- **Historical Performance** (20%): Past success metrics

## Development

### Project Structure

```
prompt-alchemy/
├── cmd/                    # CLI entry point
├── internal/
│   ├── cmd/               # Command implementations
│   ├── engine/            # Core generation engine
│   ├── providers/         # LLM provider implementations
│   ├── storage/           # Database layer with metadata support
│   ├── ranking/           # Prompt ranking system
│   ├── embedding/         # Embedding operations
│   ├── metrics/           # Performance tracking
│   └── mcp/              # MCP server implementation
└── pkg/
    ├── models/           # Data models with metadata support
    └── config/           # Configuration structures
```

### Adding a Provider

1. Implement the `Provider` interface in `internal/providers/`
2. Ensure `GenerateResponse` includes model information
3. Register in `initializeProviders()` in `internal/cmd/generate.go`
4. Add cost calculation in `calculateCost()` function
5. Add configuration to `config.yaml`

### Building

```bash
# Run tests
go test ./...

# Build binary
go build -o prompt-alchemy cmd/main.go

# Run with race detector
go run -race cmd/main.go generate "test prompt"
```

## Cost Tracking

Prompt Alchemy automatically tracks estimated costs for:

| Provider | Model | Input Cost | Output Cost |
|----------|-------|------------|-------------|
| OpenAI | GPT-4 Turbo | $0.01/1K | $0.03/1K |
| OpenAI | GPT-3.5 Turbo | $0.001/1K | $0.002/1K |
| Claude | Opus | $0.015/1K | $0.075/1K |
| Claude | Sonnet | $0.003/1K | $0.015/1K |
| Gemini | Pro | $0.0005/1K | $0.0015/1K |

*Costs are estimates and may vary. Check provider websites for current pricing.*

## Roadmap

- [ ] Semantic search with embeddings
- [ ] Full MCP server implementation
- [ ] A/B testing framework
- [ ] Web UI dashboard with cost analytics
- [ ] Plugin system for custom phases
- [ ] Export/import prompt libraries
- [ ] Team collaboration features
- [ ] Advanced cost optimization recommendations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details 