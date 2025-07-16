# Prompt Alchemy Quick Reference

## Server Modes

### 🚀 Quick Start (Docker)
```bash
# Copy environment file and add your API keys
cp .env.example .env

# Choose your mode:
./start-api.sh      # API Server (Web Apps)
./start-mcp.sh      # MCP Server (AI Agents)  
./start-hybrid.sh   # Both (Development)
./start-ollama.sh   # API + Local AI
```

### Manual Commands

#### MCP Server (for AI Agents)
```bash
# Standalone MCP server
prompt-alchemy serve mcp

# Through Docker
docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

#### HTTP API Server
```bash
# Local API server
prompt-alchemy serve api --port 8080

# Docker API
docker-compose --profile api up -d
```

#### Hybrid Mode (Both)
```bash
# Run both MCP and HTTP
prompt-alchemy serve hybrid --port 8080
```

**⚠️ WARNING:** Hybrid mode has a critical limitation - HTTP server logs interfere with MCP's JSON-RPC protocol, causing parsing errors. Use separate processes for production (see MCP_SETUP.md for details).

## MCP Tools Summary

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `generate_prompts` | Create new prompts | input, phases, count, persona |
| `optimize_prompt` | Improve existing prompts | prompt, task, max_iterations, target_score |
| `search_prompts` | Find stored prompts | query, limit |
| `batch_generate` | Process multiple inputs | inputs[], workers |
| `get_prompt` | Retrieve by ID | id |
| `list_providers` | Show AI providers | (none) |

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/v1/prompts/generate` | Generate prompts |
| POST | `/api/v1/prompts/optimize` | Optimize prompt |
| GET | `/api/v1/prompts/search` | Search prompts |
| GET | `/api/v1/prompts/{id}` | Get prompt by ID |
| GET | `/api/v1/providers` | List providers |
| POST | `/api/v1/prompts/batch` | Batch generation |

## Configuration

### Minimal Config (`~/.prompt-alchemy/config.yaml`)
```yaml
providers:
  openai:
    api_key: "sk-..."
    
generation:
  default_provider: "openai"
```

### Docker Config (`docker-config.yaml`)
```yaml
data_dir: /app/data
log_level: info

providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
  google:
    api_key: "${GOOGLE_API_KEY}"
  ollama:
    base_url: "http://host.docker.internal:11434"

http:
  host: "0.0.0.0"
  port: 8080
```

## Environment Variables

```bash
# Provider API Keys
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-..."
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-..."
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="..."

# Server Configuration
export PROMPT_ALCHEMY_HTTP_PORT=8080
export PROMPT_ALCHEMY_LOG_LEVEL=debug

# Generation Defaults
export PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER=openai
export PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE=0.7
```

## Quick Test Commands

### Test MCP
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  prompt-alchemy serve mcp | jq
```

### Test API
```bash
# Health check
curl http://localhost:8080/health

# Generate prompt
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Test prompt"}'
```

### Test Docker
```bash
# API through Docker
curl http://localhost:8080/api/v1/providers

# MCP through Docker
docker exec -i prompt-alchemy-mcp \
  prompt-alchemy serve mcp < test-input.json
```

## Common Workflows

### 1. Generate and Optimize
```python
# Generate initial prompts
prompts = generate_prompts("Create user auth system")

# Optimize the best one
optimized = optimize_prompt(
    prompts[0]["content"],
    task="Implement secure JWT authentication"
)
```

### 2. Batch Processing
```python
batch_generate({
    "inputs": [
        {"id": "1", "input": "Logging system"},
        {"id": "2", "input": "Cache layer"},
        {"id": "3", "input": "Queue processor"}
    ],
    "workers": 3
})
```

### 3. Search and Reuse
```python
# Find similar prompts
results = search_prompts("authentication jwt")

# Get full details
prompt = get_prompt(results[0]["id"])
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No providers available | Check API keys in config |
| Connection refused | Verify server is running on correct port |
| MCP protocol error | Use protocol version "2024-11-05" |
| Docker not responding | Check container logs: `docker logs <container>` |
| Rate limited | Reduce request frequency or increase limits |

## Performance Tips

1. **Batch Operations**: Use `batch_generate` for multiple prompts
2. **Provider Selection**: 
   - Fast iteration: Ollama, GPT-3.5
   - High quality: GPT-4, Claude Opus
3. **Caching**: Results automatically cached in SQLite
4. **Parallel Processing**: Set appropriate worker counts

## Security Checklist

- [ ] API keys in secure config files
- [ ] Use HTTPS in production
- [ ] Enable authentication for public endpoints
- [ ] Set rate limits appropriately
- [ ] Regular security updates
- [ ] Monitor access logs

## Resources

- [Full Documentation](./README.md)
- [MCP Setup Guide](./MCP_SETUP.md)
- [API Setup Guide](./API_SETUP.md)
- [Configuration Reference](./docs/configuration.md)