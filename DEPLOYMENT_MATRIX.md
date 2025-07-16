# Deployment Matrix

## 🚀 All Deployment Options

| **Deployment** | **Mode** | **Docker Command** | **Local Command** | **Use Case** |
|----------------|----------|-------------------|-------------------|--------------|
| **API Server** | HTTP REST API | `./start-api.sh` | `prompt-alchemy serve api` | Web apps, REST clients |
| **MCP Server** | JSON-RPC stdin/stdout | `./start-mcp.sh` | `prompt-alchemy serve mcp` | AI agents, Claude Desktop |
| **Hybrid Mode** | Both API + MCP | `./start-hybrid.sh` | `prompt-alchemy serve hybrid` | Development, testing |
| **With Ollama** | API + Local AI | `./start-ollama.sh` | Manual setup | Local AI, no internet |

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- API keys configured in `.env` file

### Quick Commands
```bash
# Setup (once)
cp .env.example .env
# Edit .env with your API keys

# Deploy
./start-api.sh      # API Server on port 8080
./start-mcp.sh      # MCP Server (no ports)
./start-hybrid.sh   # Both API + MCP
./start-ollama.sh   # API + Ollama local AI

# Manage
docker-compose logs -f     # View logs
docker-compose down        # Stop all
docker-compose restart     # Restart
```

### Access
- **API**: `http://localhost:8080`
- **MCP**: `docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp`
- **Hybrid**: API + MCP both available

## 💻 Local Installation

### Prerequisites
- Go 1.21+ installed
- Configuration file at `~/.prompt-alchemy/config.yaml`

### Installation Options
```bash
# Option 1: Build from source
git clone https://github.com/your-org/prompt-alchemy
cd prompt-alchemy
make build

# Option 2: Download binary (when available)
curl -L https://github.com/your-org/prompt-alchemy/releases/latest/download/prompt-alchemy-linux-amd64 -o prompt-alchemy
chmod +x prompt-alchemy
sudo mv prompt-alchemy /usr/local/bin/
```

### Deploy
```bash
# API Server
prompt-alchemy serve api --port 8080

# MCP Server
prompt-alchemy serve mcp

# Hybrid Mode
prompt-alchemy serve hybrid --port 8080

# With Ollama (requires separate Ollama installation)
ollama serve  # In one terminal
prompt-alchemy serve api --port 8080  # In another terminal
```

### Access
- **API**: `http://localhost:8080`
- **MCP**: Direct stdin/stdout communication
- **Hybrid**: Both available with limitations

## 🧠 Claude Desktop Integration

### Docker MCP
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "docker",
      "args": ["exec", "-i", "prompt-alchemy-mcp", "prompt-alchemy", "serve", "mcp"]
    }
  }
}
```

### Local MCP
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "prompt-alchemy",
      "args": ["serve", "mcp"]
    }
  }
}
```

## 🔧 Configuration

### Docker Configuration
- **Environment**: `.env` file with API keys
- **Config**: `docker-config.yaml` mounted in container
- **Data**: `./data/` volume for persistence

### Local Configuration
- **Environment**: System environment variables or `.env` file
- **Config**: `~/.prompt-alchemy/config.yaml`
- **Data**: `~/.prompt-alchemy/` directory

## 🎯 Choosing Your Deployment

### Use Docker When:
- ✅ You want the simplest setup
- ✅ You need consistent environment
- ✅ You're deploying to production
- ✅ You want easy updates
- ✅ You have Docker available

### Use Local When:
- ✅ You're developing on the project
- ✅ You need maximum performance
- ✅ You want to integrate with local tools
- ✅ Docker isn't available
- ✅ You need custom build configurations

## 📊 Feature Comparison

| **Feature** | **Docker** | **Local** |
|-------------|------------|-----------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐ Moderate |
| **Performance** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Isolation** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| **Development** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Production** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Updates** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐ Manual |

## 🆘 Troubleshooting Quick Reference

### Docker Issues
```bash
docker-compose ps              # Check running containers
docker-compose logs -f         # View logs
docker-compose down            # Stop all
docker-compose up -d           # Restart
```

### Local Issues
```bash
which prompt-alchemy           # Check binary location
prompt-alchemy --help          # Verify installation
prompt-alchemy config validate # Check configuration
prompt-alchemy providers       # List available providers
```

## 🚀 Next Steps

1. **Choose your deployment** - Docker (recommended) or Local
2. **Pick your mode** - API, MCP, or Hybrid
3. **Follow QUICKSTART.md** for detailed setup
4. **Read the docs** - API_SETUP.md or MCP_SETUP.md
5. **Start building** - Integrate with your applications or AI agents

Happy prompting! 🎉