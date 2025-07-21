#!/bin/bash

# Stop the Prompt Alchemy MCP server

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Prompt Alchemy MCP Server...${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    exit 1
fi

# Check if container exists and is running
if docker ps | grep -q "prompt-alchemy-mcp-server"; then
    docker stop prompt-alchemy-mcp-server
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Container stopped${NC}"
    else
        echo -e "${RED}Failed to stop container${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Container is not running${NC}"
fi

# Remove the container if it exists
if docker ps -a | grep -q "prompt-alchemy-mcp-server"; then
    docker rm prompt-alchemy-mcp-server
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Container removed${NC}"
    else
        echo -e "${RED}Failed to remove container${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}MCP server stopped successfully${NC}"