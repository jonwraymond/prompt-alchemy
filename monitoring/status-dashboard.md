# Prompt Alchemy Status Dashboard

## Real-Time Component Status

### API Health Check
```bash
# Check API health
curl -s http://localhost:5747/health | jq .

# Check metrics
curl -s http://localhost:5747/metrics
```

### Docker Container Status
```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f prompt-alchemy-api
```

### Provider Status Check
```bash
# List available providers
curl -X POST http://localhost:5747/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Database Status
```bash
# Check database size and tables
sqlite3 ~/.prompt-alchemy/prompts.db ".tables"
sqlite3 ~/.prompt-alchemy/prompts.db "SELECT COUNT(*) FROM prompts;"
```

## Automated Monitoring Script

Create this script as `monitor.sh`:

```bash
#!/bin/bash

echo "=== Prompt Alchemy System Status ==="
echo "Time: $(date)"
echo ""

# API Health
echo "🔍 API Health Check:"
API_HEALTH=$(curl -s http://localhost:5747/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API is running"
    echo "$API_HEALTH" | jq -r '.status'
else
    echo "❌ API is not responding"
fi

# Docker Status
echo ""
echo "🐳 Docker Containers:"
docker-compose ps --services | while read service; do
    STATUS=$(docker-compose ps -q $service 2>/dev/null)
    if [ -n "$STATUS" ]; then
        echo "✅ $service is running"
    else
        echo "❌ $service is stopped"
    fi
done

# Provider Status
echo ""
echo "🔌 Provider Status:"
PROVIDERS=$(curl -s -X POST http://localhost:5747/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null | jq -r '.providers[]?.name' 2>/dev/null)
  
if [ -n "$PROVIDERS" ]; then
    echo "$PROVIDERS" | while read provider; do
        echo "✅ $provider available"
    done
else
    echo "⚠️  No providers configured"
fi

# Database Status
echo ""
echo "💾 Database Status:"
if [ -f ~/.prompt-alchemy/prompts.db ]; then
    PROMPT_COUNT=$(sqlite3 ~/.prompt-alchemy/prompts.db "SELECT COUNT(*) FROM prompts;" 2>/dev/null)
    echo "✅ Database exists with $PROMPT_COUNT prompts"
else
    echo "❌ Database not found"
fi

echo ""
echo "=== End Status Report ==="
```

## Critical Alerts Setup

Add to your `.bashrc` or `.zshrc`:

```bash
# Prompt Alchemy alerts
alias pa-status='bash ~/Projects/prompt-alchemy/monitoring/monitor.sh'
alias pa-logs='docker-compose logs -f --tail=100 prompt-alchemy-api'
alias pa-errors='docker-compose logs prompt-alchemy-api 2>&1 | grep -i error'
```

## Component Categories

### 🔐 Authentication & Security
- API key validation for providers
- Environment variable security
- No explicit auth system (relies on deployment security)

### 📊 Data Processing
- Three-phase transformation engine
- Embedding generation and storage
- Vector similarity search
- Historical data enhancement

### ⏱️ Scheduling & Background
- Learning engine (when enabled)
- No explicit scheduling system
- All operations are request-driven

### 🔌 Integration Points
- MCP server for Claude Desktop
- REST API for external clients
- Provider APIs (OpenAI, Anthropic, etc.)
- SQLite for persistence