#!/bin/bash

# Start Prompt Alchemy MCP Server
echo "🧠 Starting Prompt Alchemy MCP Server..."
echo "   Mode: Model Context Protocol"
echo "   Protocol: JSON-RPC 2.0 over stdin/stdout"
echo "   For: AI agents (Claude, etc.)"
echo ""

# Start with Docker Compose
docker-compose --profile mcp up -d

echo "✅ MCP Server started successfully!"
echo ""
echo "📖 Quick commands:"
echo "   Test MCP: docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp < test-input.json"
echo "   View logs: docker-compose logs -f prompt-alchemy-mcp"
echo "   Stop server: docker-compose down"
echo ""
echo "📚 Documentation: ./MCP_SETUP.md"
echo ""
echo "🔧 Add to Claude Desktop config:"
echo "   Container: prompt-alchemy-mcp"
echo "   Command: [\"docker\", \"exec\", \"-i\", \"prompt-alchemy-mcp\", \"prompt-alchemy\", \"serve\", \"mcp\"]"