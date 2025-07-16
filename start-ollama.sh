#!/bin/bash

# Start Prompt Alchemy with Ollama (local AI)
echo "🦙 Starting Prompt Alchemy with Ollama (Local AI)..."
echo "   Mode: API Server + Ollama"
echo "   API Port: ${API_PORT:-8080}"
echo "   API URL: http://localhost:${API_PORT:-8080}"
echo "   Ollama Port: 11434"
echo "   Ollama URL: http://localhost:11434"
echo ""

# Set environment variables
export SERVE_MODE=api
export API_PORT=${API_PORT:-8080}

# Start with Docker Compose
docker-compose --profile api --profile ollama up -d

echo "✅ Servers started successfully!"
echo ""
echo "📖 Quick commands:"
echo "   API Health: curl http://localhost:${API_PORT:-8080}/health"
echo "   Ollama Status: curl http://localhost:11434/api/version"
echo "   View logs: docker-compose logs -f"
echo "   Stop servers: docker-compose down"
echo ""
echo "🔧 First time setup (run in separate terminal):"
echo "   docker exec -it prompt-alchemy-ollama ollama pull llama3.1:8b"
echo "   docker exec -it prompt-alchemy-ollama ollama pull nomic-embed-text"
echo ""
echo "📚 Documentation: ./API_SETUP.md"