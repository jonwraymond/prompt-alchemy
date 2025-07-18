# Model Context Protocol (MCP) Setup Guide

## Overview

Prompt Alchemy implements the Model Context Protocol (MCP) to enable AI agents to interact with its capabilities through a standardized interface. MCP uses JSON-RPC 2.0 over stdin/stdout for communication.

## Available Tools

### 1. generate_prompts
Generate AI prompts using the three-phase alchemical approach.

**Parameters:**
- `input` (string, required): Input text or idea
- `phases` (string): Comma-separated phases (default: "prima-materia,solutio,coagulatio")
- `count` (integer): Number of variants (default: 3)
- `persona` (string): AI persona (default: "code")

**Example:**
```json
{
  "name": "generate_prompts",
  "arguments": {
    "input": "Create a function to validate email addresses",
    "phases": "prima-materia,solutio,coagulatio",
    "count": 3,
    "persona": "code"
  }
}
```

### 2. search_prompts
Search existing prompts in the database.

**Parameters:**
- `query` (string, required): Search query
- `limit` (integer): Max results (default: 10)

**Example:**
```json
{
  "name": "search_prompts",
  "arguments": {
    "query": "email validation",
    "limit": 5
  }
}
```

### 3. get_prompt
Retrieve a specific prompt by ID.

**Parameters:**
- `id` (string, required): Prompt ID (UUID)

**Example:**
```json
{
  "name": "get_prompt",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 4. list_providers
List available AI providers and their capabilities.

**Parameters:** None

**Example:**
```json
{
  "name": "list_providers",
  "arguments": {}
}
```

### 5. optimize_prompt
Optimize a prompt using AI-powered meta-prompting and iterative improvement.

**Parameters:**
- `prompt` (string, required): Prompt to optimize
- `task` (string): Task description for the prompt
- `persona` (string): AI persona (code, writing, analysis, generic) (default: "code")
- `target_model` (string): Target model for optimization
- `max_iterations` (integer): Maximum optimization iterations (default: 5)
- `target_score` (number): Target quality score 1-10 (default: 8.5)

**Example:**
```json
{
  "name": "optimize_prompt",
  "arguments": {
    "prompt": "Write a function to validate email",
    "task": "Create a robust email validation function with proper error handling",
    "persona": "code",
    "max_iterations": 3,
    "target_score": 9.0
  }
}
```

### 6. batch_generate
Generate multiple prompts in batch mode with concurrent processing.

**Parameters:**
- `inputs` (array, required): Array of prompt inputs
  - `id` (string): Unique ID for this input
  - `input` (string, required): Input text or idea
  - `phases` (string): Comma-separated phases
  - `count` (integer): Number of variants
  - `persona` (string): AI persona
- `workers` (integer): Number of concurrent workers (default: 3)

**Example:**
```json
{
  "name": "batch_generate",
  "arguments": {
    "inputs": [
      {
        "id": "task1",
        "input": "Create a logging utility",
        "count": 2,
        "persona": "code"
      },
      {
        "id": "task2",
        "input": "Design a caching system",
        "count": 3,
        "persona": "code"
      }
    ],
    "workers": 2
  }
}
```

## Local Setup

### 1. Build the Binary
```bash
make build
```

### 2. Configure Providers
Create or edit `~/.prompt-alchemy/config.yaml`:

```yaml
providers:
  openai:
    api_key: "your-openai-key"
    model: "gpt-4"
  anthropic:
    api_key: "your-anthropic-key"
    model: "claude-3-opus-20240229"
  google:
    api_key: "your-google-key"
    model: "gemini-pro"
  ollama:
    base_url: "http://localhost:11434"
    model: "llama2"

generation:
  default_provider: "openai"
  
optimize:
  judge_provider: "anthropic"
```

### 3. Run MCP Server
```bash
# Start MCP server (stdin/stdout)
prompt-alchemy serve mcp

# Or use the default serve command
prompt-alchemy serve
```

### 4. Test MCP Locally
Use the provided test script:

```python
#!/usr/bin/env python3
import json
import subprocess

# Initialize request
init_req = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "test-client", "version": "1.0"}
    }
}

# Tool call request
tool_req = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
        "name": "generate_prompts",
        "arguments": {
            "input": "Create a REST API endpoint"
        }
    }
}

# Send requests
proc = subprocess.Popen(
    ["prompt-alchemy", "serve", "mcp"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True
)

# Send and receive
proc.stdin.write(json.dumps(init_req) + "\n")
proc.stdin.write(json.dumps(tool_req) + "\n")
proc.stdin.flush()

# Read responses
for _ in range(2):
    response = proc.stdout.readline()
    print(json.dumps(json.loads(response), indent=2))
```

## Docker Setup

### 1. Using Startup Scripts (Recommended)

```bash
# Copy environment file and configure API keys
cp .env.example .env
# Edit .env with your API keys

# Start MCP server
./start-mcp.sh

# Test MCP through Docker
docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

### 2. Using Docker Compose Directly

```bash
# Start MCP server with profile
docker-compose --profile mcp up -d

# Access MCP through Docker
docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

### 3. Using Docker Run

```bash
# Build the image
docker build -t prompt-alchemy:latest .

# Run MCP server
docker run -d \
  --name prompt-alchemy-mcp \
  -v $(pwd)/docker-config.yaml:/app/config.yaml:ro \
  -v prompt-alchemy-data:/app/data \
  prompt-alchemy:latest serve mcp
```

### 4. Docker MCP Client Example

```python
import json
import subprocess

def call_mcp_in_docker(requests):
    """Call MCP through Docker container."""
    cmd = [
        "docker", "exec", "-i",
        "prompt-alchemy-mcp",
        "prompt-alchemy", "serve", "mcp"
    ]
    
    proc = subprocess.run(
        cmd,
        input="\n".join(json.dumps(r) for r in requests),
        capture_output=True,
        text=True
    )
    
    responses = []
    for line in proc.stdout.strip().split('\n'):
        if line.startswith('{'):
            responses.append(json.loads(line))
    
    return responses

# Example usage
requests = [
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {"protocolVersion": "2024-11-05"}
    },
    {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
]

responses = call_mcp_in_docker(requests)
for resp in responses:
    print(json.dumps(resp, indent=2))
```

## Integration with AI Agents

### Claude Desktop

Claude Desktop supports MCP servers natively. Add to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

**For Docker Setup:**
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

**For Local Setup:**
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "prompt-alchemy",
      "args": ["serve", "mcp"],
      "env": {
        "PROMPT_ALCHEMY_CONFIG": "/path/to/config.yaml"
      }
    }
  }
}
```

**Usage in Claude Desktop:**
- The tools will appear automatically in Claude's tool selector
- Simply ask Claude to "generate prompts for X" or "optimize this prompt"
- Claude will automatically use the appropriate MCP tools

### Claude Code (claude.ai/code)

Claude Code integrates with MCP servers for enhanced development capabilities.

**Configuration via CLI (Recommended):**

For Docker setup:
```bash
claude mcp add prompt-alchemy-docker -s user docker -- exec -i prompt-alchemy-mcp prompt-alchemy serve mcp
```

For local installation:
```bash
claude mcp add prompt-alchemy -s user /usr/local/bin/prompt-alchemy serve mcp
```

**Note:** After adding the MCP server, restart Claude Code to load the configuration.

**Alternative Manual Configuration:** 
If you prefer manual configuration, you can edit the MCP settings directly, but using the CLI is recommended for proper integration.

**Usage Examples in Claude Code:**
```python
# Claude Code can directly call MCP tools
# Example: Generate prompts for a coding task
result = mcp.call_tool("prompt-alchemy", "generate_prompts", {
    "input": "Create a Redis caching layer for REST API",
    "persona": "code",
    "count": 3
})

# Example: Optimize an existing prompt
optimized = mcp.call_tool("prompt-alchemy", "optimize_prompt", {
    "prompt": "Write Python code",
    "task": "Create async web scraper with rate limiting",
    "target_model": "claude-3-opus",
    "target_score": 9.0
})
```

### Cursor IDE

Cursor IDE supports MCP through its AI features configuration.

**Setup in Cursor:**
1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Navigate to AI → MCP Servers
3. Add configuration:

```json
{
  "prompt-alchemy": {
    "command": "prompt-alchemy",
    "args": ["serve", "mcp"],
    "env": {
      "PROMPT_ALCHEMY_CONFIG": "${workspaceFolder}/.prompt-alchemy/config.yaml"
    },
    "triggers": ["@prompt", "@optimize"],
    "capabilities": {
      "tools": [
        {
          "name": "generate_prompts",
          "description": "Generate AI prompts for coding tasks",
          "shortcuts": ["@prompt", "@generate"]
        },
        {
          "name": "optimize_prompt",
          "description": "Optimize prompts for better results",
          "shortcuts": ["@optimize"]
        }
      ]
    }
  }
}
```

**Docker Setup for Cursor:**
```json
{
  "prompt-alchemy": {
    "command": "docker",
    "args": ["exec", "-i", "prompt-alchemy-mcp", "prompt-alchemy", "serve", "mcp"],
    "restartOnCrash": true,
    "env": {
      "DOCKER_HOST": "unix:///var/run/docker.sock"
    }
  }
}
```

**Usage in Cursor:**
- Use `@prompt` to generate prompts inline
- Use `@optimize` to improve existing prompts
- Example: Type `@prompt create a React hook for API calls` in editor
- Cursor will automatically invoke the MCP tool and insert results

### Google Gemini (via MCP Bridge)

While Gemini doesn't natively support MCP, you can use a bridge adapter:

**1. Install MCP-Gemini Bridge:**
```bash
pip install mcp-gemini-bridge
```

**2. Configure Bridge:**
Create `~/.mcp-gemini/config.yaml`:
```yaml
servers:
  prompt-alchemy:
    command: prompt-alchemy
    args: [serve, mcp]
    description: "AI prompt generation"
    
gemini:
  api_key: ${GOOGLE_API_KEY}
  model: gemini-pro
  
routing:
  - pattern: "generate.*prompt"
    server: prompt-alchemy
    tool: generate_prompts
  - pattern: "optimize.*prompt"
    server: prompt-alchemy
    tool: optimize_prompt
```

**3. Start Bridge:**
```bash
mcp-gemini-bridge --config ~/.mcp-gemini/config.yaml
```

**4. Use with Gemini:**
```python
import google.generativeai as genai

# Configure with bridge endpoint
genai.configure(
    api_key=os.environ["GOOGLE_API_KEY"],
    transport="grpc",
    client_options={"api_endpoint": "localhost:8080"}
)

model = genai.GenerativeModel('gemini-pro')

# The bridge translates function calls to MCP
response = model.generate_content(
    "Generate 3 prompts for creating a REST API authentication system",
    tools=[{
        "function_declarations": [{
            "name": "generate_prompts",
            "description": "Generate AI prompts",
            "parameters": {
                "type": "object",
                "properties": {
                    "input": {"type": "string"},
                    "count": {"type": "integer"},
                    "persona": {"type": "string"}
                }
            }
        }]
    }]
)
```

### Custom Integration

```python
import asyncio
import json
from subprocess import PIPE

class PromptAlchemyMCP:
    def __init__(self):
        self.process = None
        
    async def start(self):
        self.process = await asyncio.create_subprocess_exec(
            'prompt-alchemy', 'serve', 'mcp',
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE
        )
        
        # Initialize
        await self.call_method("initialize", {
            "protocolVersion": "2024-11-05"
        })
    
    async def call_method(self, method, params=None):
        request = {
            "jsonrpc": "2.0",
            "id": str(asyncio.current_task().get_name()),
            "method": method,
            "params": params or {}
        }
        
        # Send request
        self.process.stdin.write((json.dumps(request) + '\n').encode())
        await self.process.stdin.drain()
        
        # Read response
        line = await self.process.stdout.readline()
        return json.loads(line.decode())
    
    async def generate_prompts(self, input_text, **kwargs):
        return await self.call_method("tools/call", {
            "name": "generate_prompts",
            "arguments": {"input": input_text, **kwargs}
        })

# Usage
async def main():
    mcp = PromptAlchemyMCP()
    await mcp.start()
    
    result = await mcp.generate_prompts(
        "Create a user authentication system",
        persona="code",
        count=3
    )
    print(json.dumps(result, indent=2))

asyncio.run(main())
```

## Server Modes

### 1. MCP Only (stdin/stdout)
```bash
prompt-alchemy serve mcp
```

### 2. HTTP API Only
```bash
prompt-alchemy serve api --port 8080
```

### 3. Hybrid Mode (Both MCP and HTTP)
```bash
prompt-alchemy serve hybrid --port 8080
```

**⚠️ IMPORTANT LIMITATION:** Hybrid mode has a critical limitation where HTTP server logs interfere with MCP's JSON-RPC communication over stdin/stdout. This causes:
- MCP clients to receive mixed output (logs + JSON responses)
- JSON parsing errors in MCP clients
- Failed MCP communication

**Example of the problem:**
```
INFO[0000] Starting HTTP API server                      port=8892
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05"}}
```

**Recommended Solution:** For production use, always run MCP and API as separate processes:
```bash
# Terminal 1: MCP Server (clean stdout for JSON-RPC)
prompt-alchemy serve mcp

# Terminal 2: API Server (logs freely to stdout)
prompt-alchemy serve api --port 8080
```

## Best Practices

1. **Tool Selection**: Use the most specific tool for your needs:
   - `generate_prompts` for new prompt creation
   - `optimize_prompt` for improving existing prompts
   - `batch_generate` for processing multiple inputs efficiently

2. **Error Handling**: Always check for error responses:
   ```python
   if "error" in response:
       print(f"Error: {response['error']['message']}")
   ```

3. **Batch Processing**: Use `batch_generate` for multiple prompts to improve performance

4. **Provider Configuration**: Configure multiple providers for fallback support

5. **Persona Selection**: Choose appropriate personas:
   - `code`: Programming and technical tasks
   - `writing`: Creative and content writing
   - `analysis`: Data analysis and research
   - `generic`: General-purpose tasks

## Troubleshooting

### Common Issues

1. **No providers available**
   - Check your config.yaml has valid API keys
   - Ensure at least one provider is configured

2. **MCP protocol errors**
   - Verify you're using protocol version "2024-11-05"
   - Check JSON formatting in requests

3. **Docker connection issues**
   - Ensure container is running: `docker ps`
   - Check logs: `docker logs prompt-alchemy-mcp`

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug prompt-alchemy serve mcp
```

Or in Docker:
```yaml
environment:
  - LOG_LEVEL=debug
```

## Security Considerations

1. **API Keys**: Store API keys securely in config files with proper permissions
2. **Docker**: Use read-only mounts for config files
3. **Network**: In production, use HTTPS for API endpoints
4. **Access Control**: Implement authentication for production deployments

## Performance Tips

### Batch Operations
- **Use batch_generate**: Process multiple prompts efficiently with configurable worker counts
- **Optimal Worker Count**: Start with 3-5 workers, adjust based on provider rate limits
- **Request Grouping**: Group similar requests to benefit from connection reuse

### Provider Optimization
- **Speed vs Quality**: Use faster providers (Gemini Flash, GPT-4o-mini) for iterations
- **Final Quality**: Use premium providers (Claude Sonnet, GPT-4) for final output
- **Geographic Selection**: Choose providers with servers closest to your region
- **Rate Limit Management**: Distribute requests across multiple providers

### Caching Strategy
- **Database Caching**: Results automatically cached in SQLite database
- **Embedding Reuse**: Standardized 1536-dimension embeddings for efficient similarity search
- **Search Optimization**: Use semantic search before generating new prompts

### Resource Management
- **Timeout Configuration**: Set appropriate timeouts (30s standard, 60s for complex tasks)
- **Token Limits**: Optimize max_tokens based on use case (256 for summaries, 1024 for code)
- **Memory Usage**: Monitor SQLite database size and implement rotation if needed
- **Connection Pooling**: MCP reuses connections for multiple tool calls

### Claude Desktop Integration
- **Startup Time**: Keep MCP server running to avoid cold starts
- **Tool Selection**: Use specific tools rather than generic generate for better performance
- **Error Handling**: Implement retry logic for transient failures

## Further Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Prompt Alchemy Documentation](./README.md)
- [API Reference](./API_REFERENCE.md)