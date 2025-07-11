<p align="center">
  <img src="docs/assets/prompt_alchemy.png" alt="Prompt Alchemy" width="300"/>
</p>

<h1 align="center">Prompt Alchemy</h1>

<p align="center">
  <strong>Transform raw ideas into golden prompts through the ancient art of linguistic alchemy. A sophisticated AI system that transmutes concepts through three sacred phases of refinement.</strong>
</p>

<p align="center">
    <a href="https://github.com/jonwraymond/prompt-alchemy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://github.com/jonwraymond/prompt-alchemy/issues"><img src="https://img.shields.io/github/issues/jonwraymond/prompt-alchemy" alt="Issues"></a>
</p>

---

## Features

- **⚗️ Alchemical Transformation**: Three sacred phases of transmutation
  - **Prima Materia**: Extract pure essence from raw materials
  - **Solutio**: Dissolve into flowing, natural language
  - **Coagulatio**: Crystallize into refined, potent form
- **🤖 Multi-Provider Support**: OpenAI, Claude (via Anthropic), Gemini, and OpenRouter
- **💾 Smart Storage**: SQLite-based grimoire with context accumulation
- **🎯 Intelligent Ranking**: Advanced scoring based on alchemical principles
- **📊 Performance Tracking**: Track transmutation success rates
- **🔌 MCP Integration**: AI agent-friendly interface for seamless integration
- **⚡ Fast & Efficient**: Parallel alchemical processing
- **📈 Detailed Metadata**: Complete transmutation records including costs

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
    model: "o4-mini"
  
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openrouter/auto"  # Auto-select best available model
    fallback_models:
      - "anthropic/claude-sonnet-4"
      - "anthropic/claude-3.5-sonnet"
      - "openai/o4-mini"
  
  claude:
    api_key: "your-anthropic-api-key"
    model: "claude-sonnet-4-20250514"  # Latest Claude 4 Sonnet
  
  gemini:
    api_key: "your-google-api-key"
    model: "gemini-2.5-flash"
    timeout: 60  # HTTP timeout in seconds
    safety_threshold: "BLOCK_MEDIUM_AND_ABOVE"  # Safety filter threshold
    max_pro_tokens: 1024   # Max tokens for Pro models
    max_flash_tokens: 512  # Max tokens for Flash models
    default_tokens: 256    # Default token limit
    max_temperature: 2.0   # Maximum temperature allowed

  ollama:
    base_url: "http://localhost:11434"
    model: "gemma3:4b"
    timeout: 60  # HTTP timeout in seconds
    default_embedding_model: "nomic-embed-text"  # Default embedding model
    embedding_timeout: 5     # Embedding timeout in seconds
    generation_timeout: 120  # Generation timeout in seconds

# Alchemical phase configurations
phases:
  prima-materia:
    provider: "openai"     # Extract raw essence
  solutio:
    provider: "anthropic"  # Dissolve into natural form
  coagulatio:
    provider: "google"     # Crystallize to perfection

# Generation settings
generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-sonnet-4-20250514"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

### Environment Variables

Alternatively, use environment variables (create a `.env` file or export directly):

```bash
# OpenAI Configuration
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-your-openai-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="o4-mini"

# OpenRouter Configuration  
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="sk-or-your-openrouter-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_MODEL="openrouter/auto"

# Anthropic (Claude) Configuration
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_MODEL="claude-sonnet-4-20250514"

# Google (Gemini) Configuration
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="your-google-api-key"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MODEL="gemini-2.5-flash"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_SAFETY_THRESHOLD="BLOCK_MEDIUM_AND_ABOVE"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_PRO_TOKENS="1024"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_FLASH_TOKENS="512"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_DEFAULT_TOKENS="256"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_TEMPERATURE="2.0"

# Ollama Configuration (Local AI)
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_MODEL="gemma3:4b"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL="http://localhost:11434"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_DEFAULT_EMBEDDING_MODEL="nomic-embed-text"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_EMBEDDING_TIMEOUT="5"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_GENERATION_TIMEOUT="120"
```

**`.env` File Example:** Copy the above exports to a `.env` file (without `export`) for automatic loading.

## Usage

### Generate Prompts

Basic usage:
```bash
prompt-alchemy generate "Create a prompt for writing technical documentation"
```

Advanced options:
```bash
# Specify alchemical phases
prompt-alchemy generate --phases "prima-materia,solutio" "Your raw material"

# Generate multiple transmutations
prompt-alchemy generate --count 5 "Your raw material"

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

# Filter by alchemical phase
prompt-alchemy search --phase solutio "natural language"

# Filter by model
prompt-alchemy search --model "o4-mini"
```

## The Alchemical Process

Prompt Alchemy follows the ancient principles of transformation through three sacred phases:

1. **Prima Materia (First Matter)** - The raw, unformed potential of your ideas
   - *In practice*: Brainstorming and initial idea extraction
   - *Purpose*: Captures the core concept and explores possibilities

2. **Solutio (Dissolution)** - Breaking down rigid structures into fluid, natural expression  
   - *In practice*: Converting ideas into conversational, human-readable language
   - *Purpose*: Makes prompts natural and accessible

3. **Coagulatio (Crystallization)** - Solidifying the essence into its most potent form
   - *In practice*: Refining for technical accuracy, precision, and clarity
   - *Purpose*: Creates the final, polished prompt ready for use

Each phase can be powered by different AI providers, creating a unique alchemical blend optimized for different strengths.

## Architecture

See [ARCHITECTURE.md](docs/architecture.md) for a detailed overview of the alchemical laboratory.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.