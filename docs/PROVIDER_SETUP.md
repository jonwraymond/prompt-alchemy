# Provider Configuration Guide

## Quick Start

Prompt Alchemy requires at least one LLM provider to be configured. Here's how to set up each supported provider:

## Supported Providers

### 1. OpenAI (Recommended for Full Features)
**Features**: Text generation + Embeddings
```bash
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
```
- Get API key: https://platform.openai.com/api-keys
- Models: GPT-4, GPT-3.5-turbo
- Supports embeddings natively

### 2. Anthropic Claude
**Features**: Text generation only
```bash
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-..."
```
- Get API key: https://console.anthropic.com/account/keys
- Models: Claude 3 Opus, Sonnet, Haiku
- Falls back to OpenAI for embeddings

### 3. Google Gemini
**Features**: Text generation only
```bash
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="AIza..."
```
- Get API key: https://makersuite.google.com/app/apikey
- Models: Gemini Pro, Gemini Ultra
- Falls back to OpenAI for embeddings

### 4. Ollama (Local)
**Features**: Text generation + Embeddings
```bash
# No API key needed - runs locally
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL="http://localhost:11434"
```
- Install: https://ollama.ai
- Models: Llama 3, Mistral, etc.
- Free and private

### 5. OpenRouter
**Features**: Access to multiple models
```bash
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="sk-or-..."
```
- Get API key: https://openrouter.ai/keys
- Models: Access to 100+ models
- Pay per use

### 6. Grok (Limited Support)
**Features**: Text generation only
```bash
export PROMPT_ALCHEMY_PROVIDERS_GROK_API_KEY="xai-..."
```
- Get API key: https://console.x.ai
- Models: Grok-1
- Experimental support

## Configuration Methods

### Method 1: Environment Variables (Recommended)
```bash
# Add to ~/.bashrc or ~/.zshrc
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="your-key-here"
export PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER="openai"
```

### Method 2: .env File
Create `.env` in project root:
```env
PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=your-key-here
PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY=your-key-here
PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER=openai
```

### Method 3: Config File
Create `~/.prompt-alchemy/config.yaml`:
```yaml
providers:
  openai:
    api_key: "your-key-here"
  anthropic:
    api_key: "your-key-here"
  google:
    api_key: "your-key-here"

generation:
  default_provider: "openai"
  default_temperature: 0.7
```

### Method 4: Docker Compose
Add to `docker-compose.yml`:
```yaml
services:
  prompt-alchemy-api:
    environment:
      - PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=${OPENAI_API_KEY}
      - PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

## Verifying Configuration

### 1. Check Available Providers
```bash
# Using API
curl -X POST http://localhost:5747/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{}'

# Using CLI
prompt-alchemy providers --list
```

### 2. Test Provider Connection
```bash
# Test specific provider
prompt-alchemy providers --test --provider openai

# Test all configured providers
prompt-alchemy providers --test
```

### 3. Generate Test Prompt
```bash
# Using default provider
prompt-alchemy generate "test prompt"

# Using specific provider
prompt-alchemy generate "test prompt" --provider anthropic
```

## Multi-Provider Strategy

### Phase-Specific Providers
Configure different providers for each alchemical phase:
```yaml
phases:
  prima_materia:
    provider: "anthropic"  # Good at analysis
  solutio:
    provider: "openai"     # Natural language
  coagulatio:
    provider: "anthropic"  # Precise output
```

### Fallback Chain
Set up automatic fallbacks:
```yaml
generation:
  provider_fallback:
    - openai      # Primary
    - anthropic   # Fallback 1
    - ollama      # Fallback 2 (local)
```

## Cost Optimization

### Free Options
1. **Ollama** - Completely free, runs locally
2. **OpenAI** - Free tier available ($5 credit)
3. **Google** - Free tier with limits

### Cost-Effective Setup
```bash
# Use Ollama for development
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL="http://localhost:11434"
export PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER="ollama"

# Use OpenAI only for embeddings
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
export PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER="openai"
```

## Troubleshooting

### "No providers configured" Error
1. Check environment variables are set:
   ```bash
   env | grep PROMPT_ALCHEMY_PROVIDERS
   ```
2. Restart the application after setting variables
3. Check for typos in variable names

### "Invalid API key" Error
1. Verify key format:
   - OpenAI: Starts with `sk-`
   - Anthropic: Starts with `sk-ant-`
   - Google: Starts with `AIza`
2. Check key hasn't expired
3. Ensure no extra spaces or quotes

### Embeddings Not Working
- Only OpenAI and Ollama support native embeddings
- Other providers need OpenAI as fallback:
  ```bash
  export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
  ```

### Docker Issues
- Pass environment variables with `-e` flag:
  ```bash
  docker run -e PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..." ...
  ```
- Or use `--env-file .env` flag

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** instead of hardcoding
3. **Rotate keys regularly** (monthly recommended)
4. **Set up billing alerts** on provider dashboards
5. **Use separate keys** for dev/staging/production
6. **Store keys securely**:
   - macOS: Use Keychain
   - Linux: Use secret-tool or pass
   - All: Use environment management tools

## Example Full Setup

```bash
# 1. Set up primary provider (OpenAI)
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."

# 2. Set up secondary provider (Anthropic)
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-..."

# 3. Configure defaults
export PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER="openai"
export PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE="0.7"

# 4. Start the service
docker-compose --profile hybrid up -d

# 5. Verify setup
curl http://localhost:5747/health
curl -X POST http://localhost:5747/api/v1/providers -H "Content-Type: application/json" -d '{}'

# 6. Test generation
curl -X POST http://localhost:5747/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Create a Python function to sort a list"}'
```

## Next Steps

After configuring providers:
1. Run the monitoring script: `./monitoring/monitor.sh`
2. Test prompt generation through the UI
3. Set up the MCP integration for Claude Desktop
4. Configure phase-specific providers for optimal results