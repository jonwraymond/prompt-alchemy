# Repository Structure

## Root Directory (Production Ready)

### 🚀 Quick Start
```bash
# 1. Setup
cp .env.example .env        # Configure API keys
./start-api.sh             # Start API server
./start-mcp.sh             # Start MCP server  
./start-hybrid.sh          # Start both (dev)
./start-ollama.sh          # Start with local AI
```

### 📦 Core Application Files
- `go.mod` - Go module definition
- `go.sum` - Go module checksums
- `Makefile` - Build automation
- `Dockerfile` - Container configuration
- `docker-entrypoint.sh` - Docker entry point

### 🔧 Configuration Files
- `.env.example` - Environment variables template
- `docker-config.yaml` - Docker configuration
- `docker-compose.yml` - **UNIFIED** Docker Compose file
- `example-config.yaml` - Application configuration template
- `claude-desktop-config.json` - Claude Desktop MCP integration

### 🚀 Startup Scripts
- `start-api.sh` - Start HTTP API server
- `start-mcp.sh` - Start MCP server for AI agents
- `start-hybrid.sh` - Start both API and MCP (development)
- `start-ollama.sh` - Start with local Ollama AI

### 📚 Documentation
- `README.md` - Main documentation
- `QUICKSTART.md` - **5-minute setup guide**
- `API_SETUP.md` - HTTP API documentation
- `MCP_SETUP.md` - MCP server documentation
- `QUICK_REFERENCE.md` - Quick command reference
- `CLAUDE.md` - Development guide
- `CHANGELOG.md` - Version history
- `CODE_OF_CONDUCT.md` - Community guidelines
- `CONTRIBUTING.md` - Contribution guide

### 🔍 Development Files
- `.gitignore` - Git ignore rules
- `.gitmessage` - Git commit template
- `renovate.json` - Automated dependency updates
- `LICENSE` - MIT license

### 📁 Directories
- `cmd/` - CLI command implementations
- `internal/` - Internal application code
- `pkg/` - Public Go packages
- `docs/` - Extended documentation
- `scripts/` - Build and deployment scripts
- `data/` - Application data directory
- `temp/` - Temporary files (not tracked)

## What Was Moved to `temp/`

**113 files** moved to keep root clean:
- All test files and results
- Build artifacts and binaries
- Temporary documentation
- Development configuration files
- Log files and cache
- Old Docker Compose files
- Internal implementation documents

## Key Improvements

### ✅ Single Source of Truth
- **1 Docker Compose file** instead of 5
- **1 Docker config file** instead of 4
- **Clear startup scripts** instead of complex commands

### ✅ User Experience
- **5-minute quickstart** with `QUICKSTART.md`
- **Simple commands**: `./start-api.sh`, `./start-mcp.sh`
- **Clear documentation** with obvious next steps
- **Production warnings** where appropriate

### ✅ Developer Experience
- **Clean repository** with only essential files
- **Comprehensive .gitignore** prevents future issues
- **Proper file organization** with clear purposes
- **Maintained backward compatibility**

## Usage Examples

### For Web Applications
```bash
cp .env.example .env
# Edit .env with your API keys
./start-api.sh
# API available at http://localhost:8080
```

### For AI Agents (Claude, etc.)
```bash
cp .env.example .env
# Edit .env with your API keys
./start-mcp.sh
# MCP server available via docker exec
```

### For Development
```bash
cp .env.example .env
# Edit .env with your API keys
./start-hybrid.sh
# Both API and MCP available (with limitations)
```

## Next Steps

1. **Choose your mode** - API, MCP, or hybrid
2. **Follow QUICKSTART.md** for 5-minute setup
3. **Read relevant docs** - API_SETUP.md or MCP_SETUP.md
4. **Start building** with the comprehensive API or MCP interface

The repository is now production-ready with a clean structure, clear documentation, and simple deployment options!