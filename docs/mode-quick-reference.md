---
layout: default
title: Mode Quick Reference
---

# Mode Quick Reference Card

## Decision Matrix

| If you need... | Use Mode | Why |
|----------------|----------|-----|
| **One-time prompt generation** | On-Demand | No persistent process needed |
| **CI/CD integration** | On-Demand | Clean process lifecycle |
| **AI agent integration** | Server | MCP protocol support |
| **Learning from usage** | Server | Requires persistent state |
| **Minimal resources** | On-Demand | Zero idle consumption |
| **< 1 request/minute** | On-Demand | Startup overhead acceptable |
| **> 10 requests/minute** | Server | Amortize startup cost |
| **Scripting/automation** | On-Demand | Shell-friendly interface |
| **Real-time features** | Server | WebSocket support |
| **Multi-user access** | Server | Session management |

## Command Comparison

### On-Demand Mode
```bash
# Single operations
prompt-alchemy generate "Create a REST API"
prompt-alchemy search "authentication" --limit 5
prompt-alchemy validate prompt.yaml
prompt-alchemy batch process batch.json
prompt-alchemy export --format json > prompts.json

# Scripting
for topic in "auth" "api" "database"; do
  prompt-alchemy generate "Create $topic module" > "$topic.md"
done

# Pipeline
cat ideas.txt | xargs -I {} prompt-alchemy generate "{}"
```

### Server Mode
```bash
# Start server
prompt-alchemy serve
prompt-alchemy serve --port 8080 --learning-enabled
prompt-alchemy serve --config server.yaml

# MCP client usage (JavaScript)
const client = new MCPClient('http://localhost:8080');

// Generate with learning
const result = await client.call('generate_prompt', {
  input: "Create a REST API",
  context: { project: "e-commerce" }
});

// Get recommendations
const suggestions = await client.call('get_recommendations', {
  input: "authentication system",
  limit: 5
});

// Record feedback
await client.call('record_feedback', {
  prompt_id: result.prompt_id,
  effectiveness: 0.9,
  rating: 5
});
```

## Resource Requirements

### On-Demand Mode
- **CPU**: 1 core (when running)
- **Memory**: 50-100MB (when running)
- **Disk**: 100MB (installation + database)
- **Network**: API calls only

### Server Mode
- **CPU**: 1-2 cores recommended
- **Memory**: 200-500MB recommended
- **Disk**: 100MB + cache/logs
- **Network**: Listening port + API calls

## Configuration Examples

### On-Demand Config
```yaml
# ~/.prompt-alchemy/config.yaml
mode: cli
providers:
  openai:
    api_key: ${OPENAI_API_KEY}
storage:
  database: ~/.prompt-alchemy/prompts.db
```

### Server Mode Config
```yaml
# ~/.prompt-alchemy/config.yaml
mode: server
server:
  host: 0.0.0.0
  port: 8080
  max_connections: 100
  
learning:
  enabled: true
  learning_rate: 0.1
  decay_rate: 0.01
  min_confidence: 0.6
  
cache:
  enabled: true
  ttl: 3600
  max_size: 1000

providers:
  openai:
    api_key: ${OPENAI_API_KEY}
```

## Environment Setup

### On-Demand Mode
```bash
# Basic setup
export OPENAI_API_KEY="sk-..."
export PROMPT_ALCHEMY_CONFIG="$HOME/.prompt-alchemy/config.yaml"

# Alias for convenience
alias pa='prompt-alchemy'
alias pagen='prompt-alchemy generate'
alias pasearch='prompt-alchemy search'
```

### Server Mode
```bash
# Systemd service
cat > /etc/systemd/system/prompt-alchemy.service << EOF
[Unit]
Description=Prompt Alchemy Server
After=network.target

[Service]
Type=simple
User=promptalchemy
Environment="OPENAI_API_KEY=sk-..."
ExecStart=/usr/local/bin/prompt-alchemy serve
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Docker compose
cat > docker-compose.yaml << EOF
version: '3.8'
services:
  prompt-alchemy:
    image: prompt-alchemy:latest
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LEARNING_ENABLED=true
    volumes:
      - ./data:/data
    restart: unless-stopped
EOF
```

## Monitoring

### On-Demand Mode
```bash
# Check version
prompt-alchemy version

# Test configuration
prompt-alchemy config test

# View logs
tail -f ~/.prompt-alchemy/logs/prompt-alchemy.log

# Database stats
prompt-alchemy stats
```

### Server Mode
```bash
# Health check
curl http://localhost:8080/health

# Metrics endpoint
curl http://localhost:8080/metrics

# Learning stats
curl http://localhost:8080/api/learning/stats

# Live logs
journalctl -u prompt-alchemy -f

# Performance monitoring
curl http://localhost:8080/api/performance
```

## Migration Checklist

### On-Demand → Server
- [ ] Export existing prompts: `prompt-alchemy export`
- [ ] Update configuration for server mode
- [ ] Set up process management (systemd/docker)
- [ ] Configure monitoring/alerts
- [ ] Test MCP client connectivity
- [ ] Enable learning features
- [ ] Import existing prompts

### Server → On-Demand
- [ ] Export learned patterns: `GET /api/export`
- [ ] Save usage analytics
- [ ] Stop server gracefully
- [ ] Update configuration for CLI mode
- [ ] Test CLI commands
- [ ] Update scripts/automation

## Common Issues

### On-Demand Mode
| Issue | Solution |
|-------|----------|
| Slow startup | Use `--no-update-check` flag |
| API timeouts | Increase timeout in config |
| Memory errors | Process smaller batches |

### Server Mode
| Issue | Solution |
|-------|----------|
| Port in use | Change port or kill process |
| High memory | Reduce cache size, adjust learning window |
| Slow responses | Check provider latency, enable caching |
| Learning not working | Verify `learning.enabled: true` |

## Performance Tips

### On-Demand Mode
1. Use batch processing for multiple prompts
2. Cache API keys in environment
3. Minimize provider switches
4. Use local Ollama for development

### Server Mode
1. Enable caching for frequent queries
2. Configure appropriate connection limits
3. Use relevance decay to manage database size
4. Monitor pattern storage growth
5. Set up regular metrics cleanup

---

*For detailed documentation, see [On-Demand vs Server Mode](./on-demand-vs-server-mode)*