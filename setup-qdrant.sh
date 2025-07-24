#!/bin/bash

# Setup Qdrant Vector Database with Docker
# Based on https://qdrant.tech/documentation/quickstart/

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Setting up Qdrant Vector Database with Docker${NC}"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose not found, using 'docker compose'${NC}"
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p ./backups
mkdir -p ./qdrant-config

# Start Qdrant
echo -e "${GREEN}🚀 Starting Qdrant vector database...${NC}"
$COMPOSE_CMD -f docker-compose.qdrant.yml up -d

# Wait for Qdrant to be ready
echo -e "${YELLOW}⏳ Waiting for Qdrant to be ready...${NC}"
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:6333/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Qdrant is ready!${NC}"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ Timeout: Qdrant failed to start within $timeout seconds${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Qdrant Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Access Information:${NC}"
echo -e "  REST API: ${YELLOW}http://localhost:6333${NC}"
echo -e "  gRPC API: ${YELLOW}localhost:6334${NC}"
echo -e "  Health: ${YELLOW}http://localhost:6333/health${NC}"
echo ""
echo -e "${BLUE}🔧 Quick Commands:${NC}"
echo -e "  View logs: ${YELLOW}$COMPOSE_CMD -f docker-compose.qdrant.yml logs -f qdrant${NC}"
echo -e "  Stop Qdrant: ${YELLOW}$COMPOSE_CMD -f docker-compose.qdrant.yml down${NC}"
echo -e "  Backup data: ${YELLOW}$COMPOSE_CMD -f docker-compose.qdrant.yml --profile backup up qdrant-backup${NC}"
echo ""
echo -e "${BLUE}📖 Test the setup:${NC}"
echo -e "  ${YELLOW}curl http://localhost:6333/health${NC}"
echo -e "  ${YELLOW}curl http://localhost:6333/collections${NC}"
echo ""

# Test basic functionality
echo -e "${YELLOW}🧪 Testing basic functionality...${NC}"
response=$(curl -s http://localhost:6333/health)
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Show collections
collections=$(curl -s http://localhost:6333/collections)
echo -e "${BLUE}📦 Current collections: ${YELLOW}$collections${NC}"

echo ""
echo -e "${GREEN}🎯 Qdrant is ready for vector operations!${NC}"