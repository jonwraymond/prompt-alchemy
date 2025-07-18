# 🚀 Prompt Alchemy Quick Start

Get Prompt Alchemy running in under 2 minutes!

## 🎯 Fastest Setup (Under 2 Minutes!)

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- At least one AI provider API key

### Three Simple Steps

#### 1️⃣ Clone and Configure
```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Copy and edit the environment file
cp .env.example .env
# Edit .env and add at least ONE API key
```

**Get API Keys (choose one):**
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google**: https://aistudio.google.com/apikey
- **Grok**: https://console.x.ai/

#### 2️⃣ Run Quick Start
```bash
./quickstart.sh
```

#### 3️⃣ Configure Your Claude Client

**For Claude Desktop:**
Add this to your Claude Desktop config:
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

**Config locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**For Claude Code (claude.ai/code):**
Run this command:
```bash
claude mcp add prompt-alchemy-docker -s user docker -- exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

Then restart Claude Code to load the new configuration.

That's it! You're ready to use Prompt Alchemy! 🎉

## 🔧 Configuration

### 1. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

**Required API Keys (add at least one):**
- `OPENAI_API_KEY=sk-your-openai-key-here`
- `ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here`
- `GOOGLE_API_KEY=your-google-key-here`

### 2. Local Configuration (Local Install Only)
```bash
# Copy example config
cp example-config.yaml ~/.prompt-alchemy/config.yaml

# Edit config file
nano ~/.prompt-alchemy/config.yaml
```

## 🐳 Docker Deployment (Recommended)

### 🌐 API Server (Web Apps)
```bash
./start-api.sh
```
- **Use for**: Web applications, REST API clients
- **Access**: http://localhost:8080
- **Test**: `curl http://localhost:8080/health`

### 🧠 MCP Server (AI Agents)
```bash
./start-mcp.sh
```
- **Use for**: Claude Desktop, AI agents
- **Protocol**: JSON-RPC 2.0 over stdin/stdout
- **Test**: `docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp`

### 🔄 Hybrid Mode (Both)
```bash
./start-hybrid.sh
```
- **Use for**: Development, testing both interfaces
- **⚠️ Warning**: Has limitations (see MCP_SETUP.md)
- **Access**: API at http://localhost:8080, MCP via stdin/stdout

### 🦙 With Ollama (Local AI)
```bash
./start-ollama.sh
```
- **Use for**: Local AI without internet dependency
- **Includes**: API server + Ollama local AI
- **Setup**: Follow the post-start instructions

## 💻 Local Installation

### 1. Install Prompt Alchemy
```bash
# Option 1: Build from source
git clone https://github.com/your-org/prompt-alchemy
cd prompt-alchemy
make build

# Option 2: Download binary (when available)
# curl -L https://github.com/your-org/prompt-alchemy/releases/latest/download/prompt-alchemy-linux-amd64 -o prompt-alchemy
# chmod +x prompt-alchemy
# sudo mv prompt-alchemy /usr/local/bin/
```

### 2. Choose Your Mode

#### 🌐 API Server (Web Apps)
```bash
# Start API server
prompt-alchemy serve api --port 8080

# Test
curl http://localhost:8080/health
```

#### 🧠 MCP Server (AI Agents)
```bash
# Start MCP server
prompt-alchemy serve mcp

# Test (in separate terminal)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  prompt-alchemy serve mcp
```

#### 🔄 Hybrid Mode (Both)
```bash
# Start both API and MCP
prompt-alchemy serve hybrid --port 8080

# ⚠️ Warning: Has log mixing limitations
# For production, use separate processes
```

#### 🦙 With Ollama (Local AI)
```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Start Ollama
ollama serve

# 3. Pull models (in separate terminal)
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# 4. Start Prompt Alchemy
prompt-alchemy serve api --port 8080
```

### 3. Local Development Setup
```bash
# For development with live reload
make dev

# Run tests
make test

# Build all platforms
make build-all
```

## 📖 Quick Examples

### API Usage
```bash
# Generate a prompt
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Create a login system"}'

# List providers
curl http://localhost:8080/api/v1/providers

# Search prompts
curl "http://localhost:8080/api/v1/prompts/search?query=auth&limit=5"
```

### MCP Usage (for AI agents)
```bash
# Test MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

## 🛠 Management Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Update to latest version
docker-compose pull && docker-compose up -d
```

## 🔧 Claude Desktop Integration

### Docker MCP Integration
Add to your Claude Desktop MCP configuration:

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

### Local MCP Integration
For local installation:

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

**Note**: Make sure `prompt-alchemy` is in your PATH or use the full path to the binary.

## 📚 Next Steps

- **Full Documentation**: [README.md](./README.md)
- **API Reference**: [API_SETUP.md](./API_SETUP.md)
- **MCP Guide**: [MCP_SETUP.md](./MCP_SETUP.md)
- **Configuration**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## 🆘 Troubleshooting

### Docker Issues

**API not responding**
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs prompt-alchemy
```

**MCP not working**
```bash
# Check MCP container
docker-compose ps prompt-alchemy-mcp

# Test MCP manually
docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

**Missing API keys**
```bash
# Verify environment variables
docker-compose exec prompt-alchemy env | grep API_KEY
```

**Port conflicts**
```bash
# Change port in .env file
echo "API_PORT=8081" >> .env
docker-compose up -d
```

### Local Installation Issues

**Binary not found**
```bash
# Check if binary exists
which prompt-alchemy

# Add to PATH or use full path
export PATH=$PATH:/path/to/prompt-alchemy
```

**API not responding**
```bash
# Check if process is running
ps aux | grep prompt-alchemy

# Check logs
prompt-alchemy serve api --log-level debug
```

**MCP not working**
```bash
# Test MCP manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  prompt-alchemy serve mcp
```

**Configuration issues**
```bash
# Check config file
cat ~/.prompt-alchemy/config.yaml

# Validate configuration
prompt-alchemy config validate
```

**Provider errors**
```bash
# List available providers
prompt-alchemy providers

# Test specific provider
prompt-alchemy generate "test prompt" --provider openai
```

## 🎯 What's Next?

1. **Explore the API** - Try different endpoints and parameters
2. **Integrate with Claude** - Set up MCP for AI agent workflows  
3. **Customize Configuration** - Adjust settings in docker-config.yaml
4. **Scale Up** - Use separate API and MCP servers for production

Happy prompting! 🎉