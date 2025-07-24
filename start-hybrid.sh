#!/bin/bash

# Start Prompt Alchemy in hybrid mode (API + Web UI)
echo "Starting Prompt Alchemy in hybrid mode..."
docker-compose --profile hybrid up -d

echo "Waiting for services to be ready..."
sleep 5

echo "Checking service status..."
docker-compose --profile hybrid ps

echo ""
echo "Services are running:"
echo "- API Server: http://localhost:8080"
echo "- Web UI: http://localhost:8090"
echo ""
echo "Health check:"
curl -s http://localhost:8080/health | jq . 2>/dev/null || curl -s http://localhost:8080/health