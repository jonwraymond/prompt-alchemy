#!/bin/bash

# Start Prompt Alchemy API Server
echo "🚀 Starting Prompt Alchemy API Server..."
echo "   Mode: HTTP API"
echo "   Port: ${API_PORT:-8080}"
echo "   URL: http://localhost:${API_PORT:-8080}"
echo ""

# Set environment variables
export SERVE_MODE=api
export API_PORT=${API_PORT:-8080}

# Start with Docker Compose
docker-compose --profile api up -d

echo "✅ API Server started successfully!"
echo ""
echo "📖 Quick commands:"
echo "   Health check: curl http://localhost:${API_PORT:-8080}/health"
echo "   View logs: docker-compose logs -f prompt-alchemy"
echo "   Stop server: docker-compose down"
echo ""
echo "📚 Documentation: ./API_SETUP.md"