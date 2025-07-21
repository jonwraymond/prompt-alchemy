#!/bin/bash

# Start the Prompt Alchemy MCP server using Docker (standalone, no docker-compose)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Prompt Alchemy MCP Server...${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if the image exists
if ! docker images | grep -q "prompt-alchemy-mcp"; then
    echo -e "${YELLOW}Docker image not found. Building...${NC}"
    docker build -f Dockerfile.mcp -t prompt-alchemy-mcp:latest .
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build Docker image${NC}"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. API keys must be set in environment.${NC}"
    echo "Create a .env file with your API keys:"
    echo "  OPENAI_API_KEY=your-key-here"
    echo "  ANTHROPIC_API_KEY=your-key-here"
    echo "  GOOGLE_API_KEY=your-key-here"
fi

# Source .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if container is already running
if docker ps | grep -q "prompt-alchemy-mcp-server"; then
    echo -e "${YELLOW}Container is already running. Stopping it first...${NC}"
    docker stop prompt-alchemy-mcp-server
    docker rm prompt-alchemy-mcp-server
fi

# Run the container
echo -e "${GREEN}Starting container...${NC}"
docker run -d \
    --name prompt-alchemy-mcp-server \
    -v "${HOME}/.prompt-alchemy:/app/data" \
    -e PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="${OPENAI_API_KEY}" \
    -e PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
    -e PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="${GOOGLE_API_KEY}" \
    -e PROMPT_ALCHEMY_PROVIDERS_GROK_API_KEY="${GROK_API_KEY}" \
    -e PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
    -e PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER=openai \
    -e PROMPT_ALCHEMY_EMBEDDINGS_MODEL=text-embedding-3-small \
    -e PROMPT_ALCHEMY_EMBEDDINGS_DIMENSIONS=1536 \
    -e PROMPT_ALCHEMY_SELF_LEARNING_ENABLED=true \
    -e PROMPT_ALCHEMY_SELF_LEARNING_MIN_RELEVANCE_SCORE=0.7 \
    -e PROMPT_ALCHEMY_SELF_LEARNING_MAX_EXAMPLES=3 \
    -e LOG_LEVEL=info \
    prompt-alchemy-mcp:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MCP server started successfully${NC}"
    echo -e "Container name: prompt-alchemy-mcp-server"
    echo -e "Data directory: ~/.prompt-alchemy"
    echo -e ""
    echo -e "To view logs, run: ${YELLOW}./logs-mcp.sh${NC}"
    echo -e "To stop, run: ${YELLOW}./stop-mcp.sh${NC}"
else
    echo -e "${RED}Failed to start container${NC}"
    exit 1
fi