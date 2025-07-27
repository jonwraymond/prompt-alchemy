# Provider Troubleshooting Guide

## Overview

This guide provides comprehensive prompts to help you diagnose and fix issues with your Prompt Alchemy provider configuration. Whether you're setting up providers for the first time or troubleshooting existing issues, these prompts will give you detailed, actionable solutions.

## Quick Start

### For Immediate Issues
Use the **Quick Provider Diagnostic Prompt** (`docs/quick-provider-diagnostic.md`):
- Simple, fast diagnosis
- Basic status check
- Quick fix commands
- Perfect for urgent problems

### For Comprehensive Analysis
Use the **Provider Troubleshooting Prompt** (`docs/provider-troubleshooting-prompt.md`):
- Detailed provider analysis
- Root cause identification
- Step-by-step remediation
- System optimization recommendations

## Supported Providers

| Provider | API Key Format | Capabilities | Common Issues |
|----------|----------------|--------------|---------------|
| **OpenAI** | `sk-...` | Generation + Embeddings | Rate limits, billing |
| **Anthropic** | `sk-ant-...` | Generation only | Invalid key format |
| **Google** | `AIza...` | Generation only | API not enabled |
| **OpenRouter** | `sk-or-...` | Generation only | Insufficient credits |
| **Ollama** | None (local) | Generation + Embeddings | Service not running |
| **Grok** | `xai-...` | Generation only | Limited availability |

## Common Provider Issues

### 1. Missing API Keys
**Symptoms:**
- Provider shows as "Not Configured"
- Error: "No API key found"

**Solutions:**
```bash
# Set environment variable
export OPENAI_API_KEY="sk-your-key-here"

# Or add to config file
echo "providers:\n  openai:\n    api_key: \"sk-your-key-here\"" >> ~/.prompt-alchemy/config.yaml
```

### 2. Invalid API Key Format
**Symptoms:**
- Error: "Invalid API key"
- Provider shows as "Down"

**Solutions:**
- **OpenAI**: Must start with `sk-`
- **Anthropic**: Must start with `sk-ant-`
- **Google**: Must start with `AIza`
- **OpenRouter**: Must start with `sk-or-`
- **Grok**: Must start with `xai-`

### 3. Rate Limiting
**Symptoms:**
- Error: "429 Too Many Requests"
- Provider shows as "Degraded"

**Solutions:**
- Check provider dashboard for usage
- Implement request delays
- Use multiple providers as fallbacks
- Upgrade billing plan if needed

### 4. Network Issues
**Symptoms:**
- Error: "Connection refused"
- Timeout errors

**Solutions:**
- Check internet connectivity
- Verify firewall settings
- Test with `curl` or provider's API directly
- Check DNS resolution

### 5. Service Availability
**Symptoms:**
- Error: "Service unavailable"
- Provider shows as "Down"

**Solutions:**
- Check provider status page
- Wait for service restoration
- Use alternative providers
- Check maintenance schedules

## Using the Troubleshooting Prompts

### Step 1: Choose Your Prompt
- **Quick Diagnostic**: For immediate issues
- **Comprehensive Analysis**: For thorough investigation

### Step 2: Customize the Prompt
Replace the bracketed sections with your details:
```
**My environment:** macOS 14.0, Prompt Alchemy v1.1.0
**Error messages:** "Invalid API key format for Anthropic"
**Use case:** Development and testing
```

### Step 3: Run the Prompt
Execute the prompt through your AI assistant to get:
- Complete provider status analysis
- Specific error identification
- Actionable fix commands
- Verification steps

### Step 4: Follow the Fixes
1. **Fix critical issues first** (missing keys, invalid formats)
2. **Test each provider** using verification commands
3. **Configure fallbacks** for reliability
4. **Optimize for your use case**

## Verification Commands

### Basic Provider Check
```bash
# List all providers
prompt-alchemy providers

# Test all providers
prompt-alchemy providers --test

# Test specific provider
prompt-alchemy providers --test --provider openai
```

### Configuration Validation
```bash
# Validate configuration
prompt-alchemy validate

# Check health
prompt-alchemy health

# List available models
prompt-alchemy providers --models
```

### API Testing
```bash
# Test via HTTP API
curl -X GET http://localhost:8080/api/v1/providers

# Test health endpoint
curl -X GET http://localhost:8080/health
```

## Provider-Specific Troubleshooting

### OpenAI
```bash
# Check API key format
echo $OPENAI_API_KEY | grep -E "^sk-"

# Test with curl
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### Anthropic
```bash
# Check API key format
echo $ANTHROPIC_API_KEY | grep -E "^sk-ant-"

# Test with curl
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages
```

### Google (Gemini)
```bash
# Check API key format
echo $GOOGLE_API_KEY | grep -E "^AIza"

# Verify API is enabled
# Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
```

### Ollama (Local)
```bash
# Check if service is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Pull required model
ollama pull llama3
```

## Best Practices

### 1. Environment Variables
```bash
# Set in shell profile
echo 'export OPENAI_API_KEY="sk-your-key"' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Configuration Files
```yaml
# ~/.prompt-alchemy/config.yaml
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
    model: "gpt-4o-mini"
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
    model: "claude-3-5-sonnet-20241022"
```

### 3. Fallback Strategy
```yaml
# Configure fallbacks
generation:
  provider_fallback:
    - openai      # Primary
    - anthropic   # Backup 1
    - ollama      # Backup 2 (local)
```

### 4. Security
- Never commit API keys to version control
- Use environment variables instead of hardcoded values
- Rotate keys regularly
- Set up billing alerts

## Troubleshooting Flow

1. **Identify the Problem**
   - Use the diagnostic prompts
   - Check error messages
   - Verify provider status

2. **Apply Fixes**
   - Follow step-by-step instructions
   - Use exact commands provided
   - Test each fix immediately

3. **Verify Solutions**
   - Run verification commands
   - Test provider functionality
   - Check system health

4. **Optimize Setup**
   - Configure fallbacks
   - Set up monitoring
   - Implement best practices

## Getting Help

If the prompts don't resolve your issue:

1. **Check the documentation**: [docs/troubleshooting.md](docs/troubleshooting.md)
2. **Review provider setup**: [docs/PROVIDER_SETUP.md](docs/PROVIDER_SETUP.md)
3. **Enable debug logging**: `prompt-alchemy --log-level debug`
4. **Create an issue**: Include error logs and configuration details

## Example Usage

### Quick Fix Example
```
User: "My Anthropic provider isn't working"

1. Run Quick Diagnostic Prompt
2. Get response: "Anthropic API key invalid format"
3. Fix: export ANTHROPIC_API_KEY="sk-ant-your-key"
4. Test: prompt-alchemy providers --test --provider anthropic
5. Verify: Provider shows as "Working"
```

### Comprehensive Analysis Example
```
User: "Multiple providers are failing"

1. Run Comprehensive Troubleshooting Prompt
2. Get detailed analysis of all providers
3. Receive prioritized fix list
4. Follow systematic remediation plan
5. Configure optimized provider setup
```

This guide ensures you can quickly identify and resolve any provider configuration issues, getting your Prompt Alchemy setup working efficiently. 