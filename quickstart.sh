#!/bin/bash
# Prompt Alchemy Quick Start Script
# This script makes it easy to get started with Prompt Alchemy

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Prompt Alchemy Quick Start"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}📋 Creating .env file from .env.example${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env and add at least ONE API key${NC}"
        echo "   Available providers:"
        echo "   - OpenAI: https://platform.openai.com/api-keys"
        echo "   - Anthropic: https://console.anthropic.com/settings/keys"
        echo "   - Google: https://aistudio.google.com/apikey"
        echo "   - Grok: https://console.x.ai/"
        echo ""
        read -p "Press Enter after adding your API key(s)..."
    else
        echo -e "${RED}❌ No .env.example file found!${NC}"
        exit 1
    fi
fi

# Check if at least one API key is configured
API_KEY_FOUND=false
if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null || \
   grep -q "ANTHROPIC_API_KEY=sk-" .env 2>/dev/null || \
   grep -q "GOOGLE_API_KEY=AI" .env 2>/dev/null || \
   grep -q "GROK_API_KEY=xai-" .env 2>/dev/null; then
    API_KEY_FOUND=true
fi

if [ "$API_KEY_FOUND" = false ]; then
    echo -e "${RED}❌ No API keys found in .env file!${NC}"
    echo "Please add at least one API key to the .env file."
    exit 1
fi

echo -e "${GREEN}✅ Configuration looks good!${NC}"

# Create data directory if it doesn't exist
mkdir -p data

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.quickstart.yml down 2>/dev/null || true

# Build and start the MCP server
echo "🔨 Building Prompt Alchemy container..."
docker-compose -f docker-compose.quickstart.yml build prompt-alchemy-mcp

echo "🚀 Starting MCP server..."
docker-compose -f docker-compose.quickstart.yml up -d prompt-alchemy-mcp

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Test the MCP server
echo "🧪 Testing MCP server..."
if echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp | grep -q "generate_prompts"; then
    echo -e "${GREEN}✅ MCP server is working!${NC}"
else
    echo -e "${RED}❌ MCP server test failed!${NC}"
    echo "Check logs with: docker logs prompt-alchemy-mcp"
    exit 1
fi

# Display configuration instructions
echo ""
echo -e "${GREEN}🎉 Success! Prompt Alchemy is ready!${NC}"
echo ""
echo "=== For Claude Desktop ==="
echo "Add this to your config:"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "prompt-alchemy": {'
echo '      "command": "docker",'
echo '      "args": ["exec", "-i", "prompt-alchemy-mcp", "prompt-alchemy", "serve", "mcp"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Config locations:"
echo "  - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "  - Windows: %APPDATA%\\Claude\\claude_desktop_config.json"
echo "  - Linux: ~/.config/Claude/claude_desktop_config.json"
echo ""
echo "=== For Claude Code (claude.ai/code) ==="
echo "Run this command:"
echo "  claude mcp add prompt-alchemy-docker -s user docker -- exec -i prompt-alchemy-mcp prompt-alchemy serve mcp"
echo ""
echo "Then restart Claude Code to load the configuration."
echo ""
echo "Useful commands:"
echo "  - View logs: docker logs prompt-alchemy-mcp"
echo "  - Stop server: docker-compose -f docker-compose.quickstart.yml down"
echo "  - Start API server: docker-compose -f docker-compose.quickstart.yml --profile api up -d"
echo ""