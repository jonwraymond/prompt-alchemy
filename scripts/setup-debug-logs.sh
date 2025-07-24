#!/bin/bash

# Setup script for debug logging directories and permissions
# Run this before starting containers with debug logging

echo "🔧 Setting up debug logging directories..."

# Create log directory structure
mkdir -p logs/{api,web,mcp,ollama}/{requests,errors,metrics,access,static,protocol,messages}

# Create component-specific log directories
mkdir -p logs/api/{engine,providers,storage,http,templates,ranking,learning}

# Set permissions (adjust based on your needs)
chmod -R 755 logs/

# Create initial log files to avoid permission issues
touch logs/prompt-alchemy.log
touch logs/api/engine.log
touch logs/api/providers.log
touch logs/api/storage.log
touch logs/api/http.log
touch logs/api/templates.log
touch logs/api/ranking.log
touch logs/api/learning.log
touch logs/metrics.log

# Create .gitignore for logs directory
cat > logs/.gitignore << 'EOF'
# Ignore all log files
*.log
*.log.*
*.out
*.err

# But keep directory structure
!.gitignore
!*/
EOF

echo "✅ Debug log directories created successfully!"
echo ""
echo "📝 Usage instructions:"
echo "1. Start with debug logging:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.debug.yml --profile hybrid up"
echo ""
echo "2. View real-time logs:"
echo "   # All services:"
echo "   docker-compose logs -f"
echo ""
echo "   # Specific service:"
echo "   docker-compose logs -f prompt-alchemy"
echo "   docker-compose logs -f prompt-alchemy-web"
echo ""
echo "3. View log files:"
echo "   # API logs:"
echo "   tail -f logs/api/*.log"
echo ""
echo "   # Web UI logs:"
echo "   tail -f logs/web/*.log"
echo ""
echo "   # Provider-specific logs:"
echo "   tail -f logs/api/providers.log"
echo ""
echo "4. Search logs:"
echo "   # Find errors:"
echo "   grep -r 'ERROR' logs/"
echo ""
echo "   # Find specific request:"
echo "   grep -r 'request_id' logs/"
echo ""
echo "5. Parse JSON logs:"
echo "   # Pretty print JSON logs:"
echo "   cat logs/api/http.log | jq '.'"