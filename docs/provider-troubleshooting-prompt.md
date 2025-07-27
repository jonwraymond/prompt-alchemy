# Provider Troubleshooting Prompt

## Overview
This prompt is designed to help you diagnose and resolve issues with your configured AI providers in Prompt Alchemy. It will provide a complete analysis of your provider setup, identify problems, and offer specific solutions.

## Prompt Template

```
Please analyze my Prompt Alchemy provider configuration and provide a comprehensive troubleshooting report.

## Request Details

### 1. Complete Provider Status Analysis
- List ALL currently configured providers (OpenAI, Anthropic, Google, OpenRouter, Ollama, Grok)
- For each provider, show:
  - **Status**: Working ✅ / Not Working ❌ / Missing Configuration ⚠️
  - **Configuration**: API key present/absent, model specified, base URL (if applicable)
  - **Capabilities**: Generation support, Embedding support
  - **Error Details**: Specific error messages or failure reasons

### 2. Detailed Problem Identification
For each non-working provider, provide:
- **Root Cause**: Missing API key, invalid key format, network issues, rate limiting, etc.
- **Error Messages**: Exact error text from logs or API responses
- **Configuration Issues**: Missing required fields, incorrect format, environment variable problems

### 3. Actionable Troubleshooting Steps
For each problematic provider, provide:
- **Immediate Fix**: Step-by-step instructions to resolve the issue
- **Verification Steps**: How to test if the fix worked
- **Alternative Solutions**: Backup approaches if the primary fix doesn't work

### 4. Provider-Specific Guidance

#### OpenAI
- Check API key format (should start with `sk-`)
- Verify key hasn't expired or been revoked
- Check rate limits and billing status
- Test with simple API call

#### Anthropic
- Check API key format (should start with `sk-ant-`)
- Verify key is from correct region/account
- Check Claude model availability
- Test with basic generation request

#### Google (Gemini)
- Check API key format (should start with `AIza`)
- Verify API is enabled in Google Cloud Console
- Check quota limits and billing
- Test with Gemini API directly

#### OpenRouter
- Check API key format (should start with `sk-or-`)
- Verify account has sufficient credits
- Check model availability and routing
- Test with OpenRouter dashboard

#### Ollama (Local)
- Verify Ollama service is running (`ollama serve`)
- Check if required models are pulled (`ollama list`)
- Verify base URL is accessible (`http://localhost:11434`)
- Test with `ollama run` command

#### Grok (xAI)
- Check API key format (should start with `xai-`)
- Verify access to Grok models
- Check rate limits and availability
- Test with xAI console

### 5. Configuration Verification
- Check environment variables are properly set
- Verify config file syntax and location
- Confirm API keys are not in version control
- Test provider connectivity individually

### 6. System-Wide Recommendations
- **Priority Order**: Which providers to fix first based on your use case
- **Fallback Strategy**: How to configure automatic fallbacks
- **Cost Optimization**: Which providers to use for different tasks
- **Security Best Practices**: How to secure your API keys

### 7. Testing and Validation
- Provide commands to test each provider
- Show expected output for successful configuration
- Include error message interpretation
- Offer debugging commands and logs to check

## Expected Output Format

Please structure your response as follows:

### 🔍 **Provider Status Summary**
```
Provider    | Status    | Generation | Embeddings | Issues
-----------|-----------|------------|------------|--------
OpenAI     | ✅ Working | ✅ Yes     | ✅ Yes     | None
Anthropic  | ❌ Failed  | ❌ No      | ❌ No      | Invalid API key
Google     | ⚠️ Partial | ✅ Yes     | ❌ No      | Rate limited
```

### 🚨 **Critical Issues Found**
1. **Anthropic API Key Invalid**
   - **Problem**: Key format incorrect
   - **Solution**: Replace with valid `sk-ant-...` key
   - **Command**: `export ANTHROPIC_API_KEY="sk-ant-your-key-here"`

2. **Google Rate Limited**
   - **Problem**: Exceeded quota
   - **Solution**: Check billing or wait for reset
   - **Command**: Check Google Cloud Console

### 🛠️ **Step-by-Step Fixes**

#### Fix Anthropic Provider
1. Get new API key from [Anthropic Console](https://console.anthropic.com)
2. Set environment variable: `export ANTHROPIC_API_KEY="sk-ant-..."`
3. Test: `prompt-alchemy providers --test --provider anthropic`
4. Verify: Should show "✅ Anthropic: Available"

#### Fix Google Provider
1. Check [Google Cloud Console](https://console.cloud.google.com) billing
2. Verify API is enabled for Gemini
3. Test: `prompt-alchemy providers --test --provider google`
4. Verify: Should show "✅ Google: Available"

### 📋 **Verification Commands**
```bash
# Test all providers
prompt-alchemy providers --test

# Test specific provider
prompt-alchemy providers --test --provider openai

# Check configuration
prompt-alchemy validate

# List available providers
prompt-alchemy providers
```

### 💡 **Recommendations**
- **Primary Provider**: Use OpenAI for full functionality (generation + embeddings)
- **Backup Provider**: Configure Anthropic for generation fallback
- **Local Option**: Set up Ollama for offline development
- **Cost Control**: Use OpenRouter for pay-per-use access to multiple models

### 🔒 **Security Notes**
- Never commit API keys to version control
- Use environment variables instead of config files
- Rotate keys regularly
- Set up billing alerts on provider dashboards

## Additional Context
- **Environment**: [Your OS/environment details]
- **Prompt Alchemy Version**: [Version you're using]
- **Use Case**: [What you're trying to accomplish]
- **Error Logs**: [Any specific error messages you're seeing]

Please provide this comprehensive analysis and ensure all troubleshooting steps are specific, actionable, and include the exact commands needed to resolve each issue.
```

## Usage Instructions

1. **Copy the prompt template** above
2. **Replace the bracketed sections** with your specific details
3. **Run the prompt** through your AI assistant
4. **Follow the step-by-step instructions** provided in the response
5. **Use the verification commands** to confirm fixes work

## Expected Benefits

This prompt will help you:
- ✅ **Identify all provider issues** systematically
- ✅ **Get specific error messages** and root causes
- ✅ **Receive actionable fixes** with exact commands
- ✅ **Verify solutions work** with testing steps
- ✅ **Optimize your setup** for cost and performance
- ✅ **Secure your configuration** properly

## Troubleshooting Flow

1. **Run the prompt** to get comprehensive analysis
2. **Fix critical issues first** (missing API keys, invalid formats)
3. **Test each provider** using the verification commands
4. **Configure fallbacks** for reliability
5. **Optimize for your use case** (cost, performance, features)

This prompt ensures you get a complete, actionable troubleshooting report that will resolve your provider configuration issues efficiently. 