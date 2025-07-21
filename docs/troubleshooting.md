---
layout: default
title: Troubleshooting Guide
description: Common issues and solutions for Prompt Alchemy. Find answers to configuration problems, API errors, and deployment challenges.
keywords: troubleshooting, errors, fixes, common issues, debug, problems, solutions
---

# Troubleshooting Guide

This guide helps you resolve common issues with Prompt Alchemy. Use the decision tree below to quickly find solutions.

## 🔍 Quick Diagnostics

<div class="diagnostic-tree">
  <details>
    <summary><strong>Installation Issues</strong></summary>
    
  - [Binary doesn't run](#binary-installation)
  - [Go installation fails](#go-installation)
  - [Permission denied errors](#permission-errors)
  - [Database initialization fails](#database-init)
  </details>

  <details>
    <summary><strong>API Provider Errors</strong></summary>
    
  - [401 Unauthorized errors](#api-authentication)
  - [Rate limiting issues](#rate-limiting)
  - [Provider not found](#provider-not-found)
  - [Embedding errors](#embedding-errors)
  </details>

  <details>
    <summary><strong>Configuration Problems</strong></summary>
    
  - [Config file not found](#config-not-found)
  - [Environment variables not working](#env-vars)
  - [Provider configuration issues](#provider-config)
  - [Phase provider errors](#phase-providers)
  </details>

  <details>
    <summary><strong>Server Mode Issues</strong></summary>
    
  - [MCP server won't start](#mcp-startup)
  - [HTTP server connection refused](#http-connection)
  - [Docker container exits](#docker-issues)
  - [Port already in use](#port-conflicts)
  </details>

  <details>
    <summary><strong>Generation Problems</strong></summary>
    
  - [No prompts generated](#no-prompts)
  - [Vector dimension mismatch](#vector-dimensions)
  - [Self-learning not working](#self-learning-issues)
  - [Optimization timeout](#optimization-timeout)
  </details>
</div>

## 📋 Common Issues and Solutions

### Installation Issues

#### <span id="binary-installation">Binary Installation Problems</span>

**Symptoms:**
- Downloaded binary won't execute
- "Command not found" error
- "Bad CPU type" error on Mac

**Solutions:**
```bash
# 1. Check architecture compatibility
uname -m  # Should match binary architecture

# 2. Make binary executable
chmod +x prompt-alchemy

# 3. Add to PATH
sudo mv prompt-alchemy /usr/local/bin/
# OR add current directory to PATH
export PATH=$PATH:$(pwd)

# 4. For Mac security issues
xattr -d com.apple.quarantine prompt-alchemy
```

#### <span id="go-installation">Go Installation Issues</span>

**Symptoms:**
- `go install` fails
- Module errors
- Build failures

**Solutions:**
```bash
# 1. Ensure Go 1.24+ is installed
go version  # Should show 1.24 or higher

# 2. Clear module cache
go clean -modcache

# 3. Install with verbose output
go install -v github.com/jonwraymond/prompt-alchemy/cmd/prompt-alchemy@latest

# 4. Build from source
git clone https://github.com/jonwraymond/prompt-alchemy
cd prompt-alchemy
make build
```

#### <span id="permission-errors">Permission Denied Errors</span>

**Symptoms:**
- Cannot write to ~/.prompt-alchemy
- Database access denied
- Config file permission errors

**Solutions:**
```bash
# 1. Fix directory permissions
mkdir -p ~/.prompt-alchemy
chmod 755 ~/.prompt-alchemy

# 2. Fix file permissions
chmod 644 ~/.prompt-alchemy/config.yaml
chmod 644 ~/.prompt-alchemy/prompts.db

# 3. Run with different data directory
prompt-alchemy --data-dir ./data generate "test"
```

#### <span id="database-init">Database Initialization Failures</span>

**Symptoms:**
- "Failed to initialize storage"
- SQLite errors
- Schema migration failures

**Solutions:**
```bash
# 1. Remove corrupted database
rm -rf ~/.prompt-alchemy/prompts.db
rm -rf ~/.prompt-alchemy/chromem-vectors/

# 2. Verify SQLite support
prompt-alchemy --log-level debug generate "test" 2>&1 | grep -i sqlite

# 3. Use alternative data directory
export PROMPT_ALCHEMY_DATA_DIR=/tmp/prompt-alchemy
prompt-alchemy generate "test"
```

### API Provider Errors

#### <span id="api-authentication">Authentication Errors (401)</span>

**Symptoms:**
- "401 Unauthorized" errors
- "Invalid API key" messages
- "Incorrect API key provided"

**Solutions:**
```bash
# 1. Verify API key is set correctly
echo $OPENAI_API_KEY | head -c 20  # Should show key prefix

# 2. Set API key properly
export OPENAI_API_KEY="sk-proj-..."  # No spaces, correct prefix

# 3. Use config file instead
cat >> ~/.prompt-alchemy/config.yaml << EOF
providers:
  openai:
    api_key: "sk-proj-..."
EOF

# 4. Test provider directly
prompt-alchemy providers --test --provider openai
```

#### <span id="rate-limiting">Rate Limiting Issues</span>

**Symptoms:**
- "429 Too Many Requests"
- "Rate limit exceeded"
- Slow response times

**Solutions:**
```yaml
# 1. Configure rate limiting in config.yaml
providers:
  openai:
    rate_limit:
      requests_per_minute: 50
      tokens_per_minute: 40000

# 2. Use different providers for phases
generation:
  phases:
    prima-materia:
      provider: openai
    solutio:
      provider: anthropic
    coagulatio:
      provider: google

# 3. Add delays between requests
generation:
  request_delay_ms: 1000
```

#### <span id="provider-not-found">Provider Not Found Errors</span>

**Symptoms:**
- "Provider not found: X"
- "No provider configured for phase"
- Missing provider in list

**Solutions:**
```bash
# 1. List available providers
prompt-alchemy providers

# 2. Check provider configuration
prompt-alchemy providers --test

# 3. Ensure API key is set
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="AIza..."

# 4. Use fallback provider
prompt-alchemy generate "test" --provider openai
```

#### <span id="embedding-errors">Embedding Provider Errors</span>

**Symptoms:**
- "Provider does not support embeddings"
- "No fallback embedding provider"
- Vector dimension mismatches

**Solutions:**
```yaml
# 1. Configure embedding provider
embeddings:
  provider: openai  # OpenAI supports embeddings
  model: text-embedding-3-small
  dimensions: 1536

# 2. Use provider with embedding support
providers:
  openai:
    api_key: "sk-..."
    supports_embeddings: true

# 3. Clear vector storage for dimension changes
rm -rf ~/.prompt-alchemy/chromem-vectors/
```

### Configuration Problems

#### <span id="config-not-found">Config File Not Found</span>

**Symptoms:**
- "Config File \"config\" Not Found"
- Settings not being applied
- Default values used instead

**Solutions:**
```bash
# 1. Create config directory
mkdir -p ~/.prompt-alchemy

# 2. Create minimal config
cat > ~/.prompt-alchemy/config.yaml << EOF
mode: local
providers:
  openai:
    api_key: "\${OPENAI_API_KEY}"
EOF

# 3. Specify config location
prompt-alchemy --config ./my-config.yaml generate "test"

# 4. Use environment variable
export PROMPT_ALCHEMY_CONFIG=/path/to/config.yaml
```

#### <span id="env-vars">Environment Variables Not Working</span>

**Symptoms:**
- API keys showing as ${VARIABLE_NAME}
- Environment overrides not applying
- Config not expanding variables

**Solutions:**
```bash
# 1. Export variables properly
export OPENAI_API_KEY="sk-proj-..."
source .env  # If using .env file

# 2. Check variable expansion in config
# Use quotes around ${VAR} in YAML
api_key: "${OPENAI_API_KEY}"

# 3. Use direct values for testing
api_key: "sk-proj-actual-key-here"

# 4. Debug environment
prompt-alchemy --log-level debug generate "test" 2>&1 | grep -i env
```

#### <span id="provider-config">Provider Configuration Issues</span>

**Symptoms:**
- Providers not initializing
- Wrong models being used
- Fallback providers not working

**Solutions:**
```yaml
# Complete provider configuration
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
    default_model: gpt-4o-mini
    supports_embeddings: true
  
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
    default_model: claude-3-5-sonnet-20241022
    supports_embeddings: false
  
  google:
    api_key: "${GOOGLE_API_KEY}"
    default_model: gemini-1.5-flash
    supports_embeddings: true
    embedding_fallback: openai

# Phase-specific providers
generation:
  phases:
    prima-materia:
      provider: anthropic
      model: claude-3-5-haiku-20241022
    solutio:
      provider: openai
      model: gpt-4o-mini
    coagulatio:
      provider: google
      model: gemini-1.5-flash
```

#### <span id="phase-providers">Phase Provider Errors</span>

**Symptoms:**
- "No provider configured for phase X"
- Phase-specific failures
- Inconsistent provider usage

**Solutions:**
```bash
# 1. Use single provider for all phases
prompt-alchemy generate "test" --provider openai

# 2. Configure default provider
export PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER=openai

# 3. Skip problematic phases
prompt-alchemy generate "test" --phases prima-materia,coagulatio

# 4. Use server mode with proper config
prompt-alchemy serve http --config config.yaml
```

### Server Mode Issues

#### <span id="mcp-startup">MCP Server Startup Problems</span>

**Symptoms:**
- MCP server exits immediately
- "Failed to start MCP server"
- No response from Claude Code

**Solutions:**
```bash
# 1. Test MCP server directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | prompt-alchemy serve mcp

# 2. Check Claude Code configuration
claude mcp list
claude mcp remove prompt-alchemy
claude mcp add prompt-alchemy /path/to/prompt-alchemy serve mcp

# 3. Use absolute paths
claude mcp add prompt-alchemy $(which prompt-alchemy) serve mcp

# 4. Add environment variables
claude mcp add prompt-alchemy /path/to/prompt-alchemy serve mcp \
  -e OPENAI_API_KEY="${OPENAI_API_KEY}"
```

#### <span id="http-connection">HTTP Server Connection Issues</span>

**Symptoms:**
- "Connection refused" errors
- Cannot reach http://localhost:8080
- Timeouts on API calls

**Solutions:**
```bash
# 1. Check if port is available
lsof -i :8080  # Should show nothing

# 2. Use different port
prompt-alchemy serve http --port 9090

# 3. Bind to all interfaces
prompt-alchemy serve http --host 0.0.0.0

# 4. Check firewall rules
sudo ufw allow 8080/tcp  # Ubuntu/Debian
```

#### <span id="docker-issues">Docker Container Exit Issues</span>

**Symptoms:**
- Container exits with code 1
- "No such file or directory"
- Init script failures

**Solutions:**
```bash
# 1. Check container logs
docker logs prompt-alchemy-mcp

# 2. Run without init script
docker run -it --entrypoint="" prompt-alchemy /bin/sh

# 3. Mount config file
docker run -v ~/.prompt-alchemy:/root/.prompt-alchemy \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  prompt-alchemy

# 4. Use docker-compose
docker-compose -f docker-compose.quickstart.yml up
```

#### <span id="port-conflicts">Port Already in Use</span>

**Symptoms:**
- "bind: address already in use"
- Cannot start server
- Port conflict errors

**Solutions:**
```bash
# 1. Find process using port
lsof -i :8080
# OR
netstat -tulpn | grep 8080

# 2. Kill the process
kill -9 <PID>

# 3. Use different port
prompt-alchemy serve http --port 8081

# 4. Configure in docker-compose
ports:
  - "9090:8080"  # Map to different external port
```

### Generation Problems

#### <span id="no-prompts">No Prompts Generated</span>

**Symptoms:**
- Empty results
- "Failed to generate prompts"
- Phase processing errors

**Solutions:**
```bash
# 1. Test with simple input
prompt-alchemy generate "test" --provider openai

# 2. Check provider connectivity
prompt-alchemy providers --test

# 3. Use verbose logging
prompt-alchemy --log-level debug generate "test"

# 4. Try single phase
prompt-alchemy generate "test" --phases prima-materia
```

#### <span id="vector-dimensions">Vector Dimension Mismatch</span>

**Symptoms:**
- "vectors must have the same length"
- Similarity search failures
- Historical data not loading

**Solutions:**
```bash
# 1. Clear vector storage
rm -rf ~/.prompt-alchemy/chromem-vectors/

# 2. Consistent embedding config
cat >> ~/.prompt-alchemy/config.yaml << EOF
embeddings:
  provider: openai
  model: text-embedding-3-small
  dimensions: 1536  # Must match across all uses
EOF

# 3. Rebuild embeddings
prompt-alchemy migrate rebuild-embeddings

# 4. Disable self-learning temporarily
export PROMPT_ALCHEMY_SELF_LEARNING_ENABLED=false
```

#### <span id="self-learning-issues">Self-Learning Not Working</span>

**Symptoms:**
- No historical enhancement
- "Failed to enhance with historical data"
- Similar prompts not found

**Solutions:**
```yaml
# 1. Enable self-learning
self_learning:
  enabled: true
  min_relevance_score: 0.5  # Lower threshold
  max_examples: 5

# 2. Configure embeddings properly
embeddings:
  provider: openai
  model: text-embedding-3-small
  dimensions: 1536

# 3. Build history first
# Generate multiple prompts to build database
for i in {1..10}; do
  prompt-alchemy generate "test prompt $i"
done

# 4. Check storage
sqlite3 ~/.prompt-alchemy/prompts.db "SELECT COUNT(*) FROM prompts;"
```

#### <span id="optimization-timeout">Optimization Timeout</span>

**Symptoms:**
- Optimization takes too long
- Command timeouts
- Stuck on "Starting optimization"

**Solutions:**
```bash
# 1. Reduce iterations
prompt-alchemy generate "test" --optimize \
  --optimize-max-iterations 2

# 2. Lower target score
prompt-alchemy generate "test" --optimize \
  --optimize-target-score 7.0

# 3. Increase timeout
prompt-alchemy --timeout 600 generate "test" --optimize

# 4. Use faster providers
prompt-alchemy generate "test" --optimize \
  --provider google  # Generally faster
```

## 🔧 Advanced Debugging

### Enable Debug Logging
```bash
# Maximum verbosity
export PROMPT_ALCHEMY_LOG_LEVEL=debug
prompt-alchemy generate "test" 2>&1 | tee debug.log

# Filter specific components
prompt-alchemy generate "test" 2>&1 | grep -E "(provider|storage|engine)"
```

### Test Individual Components
```bash
# Test storage
sqlite3 ~/.prompt-alchemy/prompts.db ".tables"

# Test embeddings
prompt-alchemy test embeddings --provider openai

# Test each phase
for phase in prima-materia solutio coagulatio; do
  echo "Testing $phase..."
  prompt-alchemy generate "test" --phases $phase
done
```

### Reset Everything
```bash
# Complete reset (WARNING: Deletes all data)
rm -rf ~/.prompt-alchemy
rm -rf ~/Library/Application\ Support/prompt-alchemy  # Mac
rm -rf ~/.config/prompt-alchemy  # Linux

# Reinstall
go install github.com/jonwraymond/prompt-alchemy/cmd/prompt-alchemy@latest
```

## 📞 Getting Help

If these solutions don't resolve your issue:

1. **Check existing issues**: [GitHub Issues](https://github.com/jonwraymond/prompt-alchemy/issues)
2. **Enable debug logging** and collect output
3. **Create a new issue** with:
   - Your configuration (without API keys)
   - Debug logs
   - Steps to reproduce
   - System information (OS, Go version)

## 🎯 Best Practices to Avoid Issues

1. **Always use absolute paths** in configurations
2. **Keep API keys in environment variables**, not config files
3. **Start with minimal configuration** and add complexity
4. **Test providers individually** before combining
5. **Monitor rate limits** and adjust accordingly
6. **Clear vector storage** when changing embedding settings
7. **Use consistent provider configurations** across phases
8. **Backup your database** before major changes

---

<style>
.diagnostic-tree details {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.diagnostic-tree summary {
  cursor: pointer;
  padding: 0.5rem;
  font-weight: 600;
}

.diagnostic-tree summary:hover {
  color: #C9A96E;
}

.diagnostic-tree ul {
  margin: 0.5rem 0 0 1rem;
}

code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

pre code {
  display: block;
  padding: 1rem;
  overflow-x: auto;
}
</style>