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
- **Docker**: Required for containerized deployment (Docker Desktop or Engine)

## Installation Methods

### 1. Docker (Recommended for Production)

1. Clone the repository:
   ```bash
   git clone https://github.com/jonwraymond/prompt-alchemy.git
   cd prompt-alchemy
   ```

2. Copy and edit environment file:
   ```bash
   cp docker.env.example .env
   # Edit .env with your API keys
   ```

3. Build and start:
   ```bash
   make docker-build
   docker-compose up -d
   ```

4. Verify:
   ```bash
   docker-compose ps  # Should show running and healthy
   docker-compose logs prompt-alchemy  # Check for successful startup
   ```

For detailed deployment instructions, see the main [Deployment Guide](./deployment-guide).

### 2. Build from Source (Recommended)

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

### 3. Pre-built Binaries

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

### 4. Using Go Install

```bash
go install github.com/jonwraymond/prompt-alchemy/cmd/prompt-alchemy@latest
```

## Configuration Setup

### 1. Initialize Configuration

```bash
# Create config directory and copy example
make setup

# Or manually:
mkdir -p ~/.prompt-alchemy
cp example-config.yaml ~/.prompt-alchemy/config.yaml
```

### 2. Add API Keys

Edit `~/.prompt-alchemy/config.yaml`:

```yaml
providers:
  openai:
    api_key: "your-openai-api-key"
    model: "o4-mini"
    
  anthropic:
    api_key: "your-anthropic-api-key"
    model: "claude-3-5-sonnet-20241022"
    
  google:
    api_key: "your-google-api-key"
    model: "gemini-2.5-flash"
    
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openrouter/auto"

phases:
  prima-materia:
    provider: openai      # Extract raw essence
  solutio:
    provider: anthropic   # Dissolve into natural form
  coagulatio:
    provider: google      # Crystallize to perfection

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-4-sonnet-20250522"
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
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to config or environment
3. Supports both generation and embeddings

### Anthropic
1. Get API key from [Anthropic Console](https://console.anthropic.com/dashboard)
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

After installation, verify everything works from the project's root directory:

```bash
# Check version
./prompt-alchemy version

# Validate your configuration file
./prompt-alchemy validate

# Test provider connectivity
./prompt-alchemy test-providers

# Generate a test prompt
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
   - Ensure Go version is 1.23+

### Debug Mode

Enable debug logging using the global flag:
```bash
./prompt-alchemy --log-level debug generate "a test"
```

Or by setting the environment variable:
```bash
export PROMPT_ALCHEMY_LOG_LEVEL=debug
./prompt-alchemy generate "a test"
```

## Updating

To update Prompt Alchemy:

```bash
# From source
git pull origin main
make clean
make build

# Using go install
go install github.com/jonwraymond/prompt-alchemy/cmd@latest
```

## Uninstalling

```bash
# Remove binary
rm $(which prompt-alchemy)

# Remove configuration (optional)
rm -rf ~/.prompt-alchemy

# Remove from GOPATH (if installed via go)
rm -rf $(go env GOPATH)/bin/prompt-alchemy
```

## Next Steps

- Follow the [Getting Started](./getting-started) guide
- Read the [Usage Guide](./usage) for command details
- Configure providers using the [CLI Reference](./cli-reference) for command details