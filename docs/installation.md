---
layout: default
title: Installation Guide
---

# Installation Guide

This guide covers all installation methods for Prompt Alchemy.

## System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Go**: Version 1.24 or higher
- **Database**: SQLite3 (usually pre-installed)
- **Memory**: At least 512MB RAM
- **Storage**: 100MB for application + space for prompt database

## Installation Methods

### 1. Build from Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Install dependencies
make deps

# Build the binary
make build

# Install to system (optional)
sudo make install
```

### 2. Pre-built Binaries

Download the latest release for your platform:

```bash
# macOS (Apple Silicon)
curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-darwin-arm64 -o prompt-alchemy
chmod +x prompt-alchemy

# macOS (Intel)
curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-darwin-amd64 -o prompt-alchemy
chmod +x prompt-alchemy

# Linux (AMD64)
curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-linux-amd64 -o prompt-alchemy
chmod +x prompt-alchemy

# Windows
# Download prompt-alchemy-windows-amd64.exe from releases page
```

### 3. Using Go Install

```bash
go install github.com/jonwraymond/prompt-alchemy@latest
```

## Configuration Setup

### 1. Initialize Configuration

```bash
# Create config directory and copy example
make setup

# Or manually:
mkdir -p ~/.github.com/jonwraymond/prompt-alchemy
cp example-config.yaml ~/.github.com/jonwraymond/prompt-alchemy/config.yaml
```

### 2. Add API Keys

Edit `~/.github.com/jonwraymond/prompt-alchemy/config.yaml`:

```yaml
providers:
  openai:
    api_key: "your-openai-api-key"
    model: "gpt-4o-mini"
    
  claude:
    api_key: "your-anthropic-api-key"
    model: "claude-3-5-sonnet-20241022"
    
  gemini:
    api_key: "your-google-api-key"
    model: "gemini-2.5-flash"
    
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openrouter/auto"
    
  ollama:
    base_url: "http://localhost:11434"
    model: "gemma3:4b"
    timeout: 60

phases:
  idea:
    provider: "openai"
  human:
    provider: "claude"
  precision:
    provider: "gemini"

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-3-5-sonnet-20241022"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

### 3. Environment Variables (Alternative)

You can also use environment variables:

```bash
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"
```

## Provider-Specific Setup

### OpenAI
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to config or environment
3. Supports both generation and embeddings

### Anthropic
1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to config or environment
3. Generation only (uses OpenAI for embeddings)

### Google (Gemini)
1. Get API key from [makersuite.google.com](https://makersuite.google.com)
2. Add to config or environment
3. Generation only

### Ollama (Local)
1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Start service: `ollama serve`
3. Pull models: `ollama pull llama2`
4. No API key needed

### OpenRouter
1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Supports many models through unified API
3. Both generation and embeddings

## Verification

After installation, verify everything works:

```bash
# Check version
./prompt-alchemy --version

# Show configuration
./prompt-alchemy config

# Test providers
./prompt-alchemy providers

# Generate test prompt
./prompt-alchemy generate "Hello, world!"
```

## Troubleshooting

### Common Issues

1. **"command not found"**
   - Add binary location to PATH
   - Or use full path: `./prompt-alchemy`

2. **"API key not found"**
   - Check config file location
   - Verify environment variables
   - Run `prompt-alchemy config` to debug

3. **"connection refused"**
   - For Ollama: ensure service is running
   - Check network/firewall settings

4. **"module not found"**
   - Run `make deps` or `go mod download`
   - Ensure Go version is 1.24+

### Debug Mode

Enable debug logging:

```bash
# Set log level
export LOG_LEVEL=debug

# Or in config.yaml
logging:
  level: debug
  file: ~/.github.com/jonwraymond/prompt-alchemy/debug.log
```

## Updating

To update Prompt Alchemy:

```bash
# From source
git pull origin main
make clean
make build

# Using go install
go install github.com/jonwraymond/prompt-alchemy@latest
```

## Uninstalling

```bash
# Remove binary
rm $(which prompt-alchemy)

# Remove configuration (optional)
rm -rf ~/.github.com/jonwraymond/prompt-alchemy

# Remove from GOPATH (if installed via go)
rm -rf $(go env GOPATH)/bin/prompt-alchemy
```

## Next Steps

- Follow the [Getting Started](./getting-started) guide
- Read the [Usage Guide](./usage) for command details
- Configure providers in [Configuration](./configuration)