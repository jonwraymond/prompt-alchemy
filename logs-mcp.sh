#!/bin/bash

# View logs for the Prompt Alchemy MCP server

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q "prompt-alchemy-mcp-server"; then
    echo -e "${RED}Error: MCP server container is not running${NC}"
    echo -e "Start it with: ${YELLOW}./start-mcp.sh${NC}"
    exit 1
fi

# Show usage options
echo -e "${GREEN}Prompt Alchemy MCP Server Logs${NC}"
echo -e "Press ${YELLOW}Ctrl+C${NC} to exit"
echo -e ""
echo -e "Options:"
echo -e "  ${YELLOW}./logs-mcp.sh${NC}          - Follow logs in real-time"
echo -e "  ${YELLOW}./logs-mcp.sh -n 50${NC}    - Show last 50 lines"
echo -e "  ${YELLOW}./logs-mcp.sh --since 5m${NC} - Show logs from last 5 minutes"
echo -e ""
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e ""

# Pass all arguments to docker logs
docker logs prompt-alchemy-mcp-server "$@" -f