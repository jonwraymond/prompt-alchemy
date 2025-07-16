#!/bin/bash

# Start Prompt Alchemy Hybrid Server
echo "🔄 Starting Prompt Alchemy Hybrid Server..."
echo "   Mode: Both API and MCP"
echo "   API Port: ${API_PORT:-8080}"
echo "   API URL: http://localhost:${API_PORT:-8080}"
echo "   MCP: JSON-RPC 2.0 over stdin/stdout"
echo ""
echo "⚠️  WARNING: Hybrid mode has limitations (log mixing with MCP)."
echo "   For production, use separate API and MCP servers."
echo ""

# Set environment variables
export SERVE_MODE=hybrid
export API_PORT=${API_PORT:-8080}

# Start with Docker Compose
docker-compose --profile hybrid up -d

echo "✅ Hybrid Server started successfully!"
echo ""
echo "📖 Quick commands:"
echo "   API Health: curl http://localhost:${API_PORT:-8080}/health"
echo "   MCP Test: docker exec -i prompt-alchemy-server prompt-alchemy serve mcp < test-input.json"
echo "   View logs: docker-compose logs -f prompt-alchemy"
echo "   Stop server: docker-compose down"
echo ""
echo "📚 Documentation: ./MCP_SETUP.md (see hybrid mode section)"