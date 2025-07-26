# Prompt Alchemy Quick Start Guide 🚀

## 1. Prerequisites
- Docker and Docker Compose installed
- At least one LLM provider API key (or use Ollama for free local generation)

## 2. Setup Provider (Required)
Run our interactive setup wizard:
```bash
./scripts/setup-provider.sh
```

This will guide you through configuring your first provider. Options include:
- **OpenAI** (Recommended) - Full features including embeddings
- **Anthropic Claude** - Powerful reasoning
- **Google Gemini** - Free tier available
- **Ollama** - Completely free, runs locally
- **OpenRouter** - Access to 100+ models

## 3. Start the System
```bash
# Start all services
docker-compose --profile hybrid up -d

# Check status
./monitoring/monitor.sh
```

## 4. Access the UI
Open your browser to: http://localhost:5173

## 5. Generate Your First Prompt
```bash
# Using the CLI
prompt-alchemy generate "Create a Python web scraper"

# Using the API
curl -X POST http://localhost:5747/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Create a Python web scraper"}'
```

## 6. Monitor System Health
```bash
# Quick status check
./monitoring/monitor.sh

# Start continuous monitoring (optional)
./monitoring/health-alerts
```

## Troubleshooting

### No Providers Configured
Run `./scripts/setup-provider.sh` to configure at least one provider.

### Container Not Starting
```bash
# Check logs
docker-compose logs prompt-alchemy-api

# Rebuild if needed
docker-compose build --no-cache
docker-compose --profile hybrid up -d
```

### Can't Access UI
1. Ensure containers are running: `docker-compose ps`
2. Check if port 5173 is available: `lsof -i :5173`
3. Try accessing the API directly: `curl http://localhost:5747/health`

## Next Steps
- Configure additional providers for redundancy
- Set up the MCP integration for Claude Desktop
- Explore phase-specific provider configuration
- Enable monitoring alerts with Slack integration

For detailed documentation, see:
- Provider Setup: `docs/PROVIDER_SETUP.md`
- Monitoring Guide: `monitoring/README.md`
- Full Documentation: `README.md`