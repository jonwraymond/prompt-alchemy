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

# Git Status Check
echo ""
echo "📝 Git Status:"
DELETED_FILES=$(git ls-files --deleted 2>/dev/null)
if [ -n "$DELETED_FILES" ]; then
    echo "⚠️  Deleted files detected:"
    echo "$DELETED_FILES" | sed 's/^/   - /'
else
    echo "✅ No deleted files"
fi

echo ""
echo "=== End Status Report ==="