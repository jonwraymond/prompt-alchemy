# Quick Provider Diagnostic Prompt

## Simple Version

```
Please diagnose my Prompt Alchemy provider setup and provide a quick fix guide.

**What I need:**
1. List all my configured providers and their current status
2. Identify which ones are broken and why
3. Give me the exact commands to fix each problem
4. Show me how to test if the fixes worked

**Provider Status Check:**
- OpenAI (API key format: sk-...)
- Anthropic (API key format: sk-ant-...)
- Google (API key format: AIza...)
- OpenRouter (API key format: sk-or-...)
- Ollama (local, no API key needed)
- Grok (API key format: xai-...)

**Common Issues to Check:**
- Missing API keys
- Invalid key formats
- Network connectivity
- Rate limiting
- Service availability

**Please provide:**
- Status table showing Working/Broken/Missing for each provider
- Specific error messages for broken providers
- Step-by-step fix commands
- Test commands to verify fixes

**My environment:** [Your OS/version]
**Error messages:** [Any specific errors you're seeing]
```

## Advanced Version

```
Please perform a comprehensive diagnostic of my Prompt Alchemy provider configuration and provide detailed troubleshooting.

**Diagnostic Requirements:**

### 1. Provider Inventory
- Scan for all 6 supported providers (OpenAI, Anthropic, Google, OpenRouter, Ollama, Grok)
- Check configuration status (configured/not configured)
- Verify API key presence and format
- Test connectivity and availability

### 2. Status Classification
For each provider, determine:
- **✅ Operational**: Fully working, can generate and embed
- **⚠️ Degraded**: Partially working (generation only, rate limited, etc.)
- **❌ Down**: Not working (missing key, invalid key, network issues)
- **🔍 Unknown**: Cannot determine status

### 3. Problem Analysis
For each non-operational provider:
- **Root Cause**: Missing key, invalid format, network issue, rate limit, service down
- **Error Details**: Exact error messages and codes
- **Impact**: What functionality is affected
- **Priority**: How critical this provider is for your workflow

### 4. Remediation Plan
For each issue:
- **Immediate Action**: Quick fix commands
- **Verification**: How to test the fix
- **Fallback**: Alternative solutions if primary fix fails
- **Prevention**: How to avoid this issue in the future

### 5. System Optimization
- **Provider Priority**: Which to fix first based on your needs
- **Fallback Strategy**: How to configure automatic provider switching
- **Cost Optimization**: Most efficient provider combinations
- **Security**: Best practices for API key management

**Expected Output Format:**

```
## 🔍 Provider Status Report

| Provider   | Status      | Generation | Embeddings | Issues                    |
|------------|-------------|------------|------------|---------------------------|
| OpenAI     | ✅ Working  | ✅ Yes     | ✅ Yes     | None                      |
| Anthropic  | ❌ Down     | ❌ No      | ❌ No      | Invalid API key format    |
| Google     | ⚠️ Degraded | ✅ Yes     | ❌ No      | Rate limited              |
| OpenRouter | ❌ Down     | ❌ No      | ❌ No      | Missing API key           |
| Ollama     | ✅ Working  | ✅ Yes     | ✅ Yes     | None                      |
| Grok       | 🔍 Unknown  | ❓ Unknown | ❓ Unknown | Not configured            |

## 🚨 Critical Issues

1. **Anthropic API Key Invalid**
   - Problem: Key doesn't start with 'sk-ant-'
   - Fix: `export ANTHROPIC_API_KEY="sk-ant-your-key-here"`
   - Test: `prompt-alchemy providers --test --provider anthropic`

2. **OpenRouter Missing Key**
   - Problem: No API key configured
   - Fix: Get key from https://openrouter.ai/keys
   - Test: `prompt-alchemy providers --test --provider openrouter`

## 🛠️ Fix Commands

```bash
# Fix Anthropic
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
prompt-alchemy providers --test --provider anthropic

# Fix OpenRouter  
export OPENROUTER_API_KEY="sk-or-your-key-here"
prompt-alchemy providers --test --provider openrouter

# Test all providers
prompt-alchemy providers --test

# Verify configuration
prompt-alchemy validate
```

## 💡 Recommendations

- **Primary**: Use OpenAI + Ollama for full functionality
- **Backup**: Fix Anthropic for generation fallback
- **Cost**: Use OpenRouter for pay-per-use access
- **Security**: Store keys in environment variables, not config files
```

## Usage

1. **Copy the appropriate prompt** (simple or advanced)
2. **Fill in your environment details** and any error messages
3. **Run it through your AI assistant**
4. **Follow the provided fix commands**
5. **Use the test commands to verify everything works**

## Quick Commands Reference

```bash
# Check all providers
prompt-alchemy providers

# Test specific provider
prompt-alchemy providers --test --provider openai

# Validate configuration
prompt-alchemy validate

# Check health
prompt-alchemy health

# List available models
prompt-alchemy providers --models
``` 