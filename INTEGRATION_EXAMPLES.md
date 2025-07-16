# Prompt Alchemy Integration Examples

This guide provides comprehensive integration examples for popular AI development tools and platforms.

## Table of Contents

- [Claude Desktop](#claude-desktop)
- [Claude Code](#claude-code)
- [Cursor IDE](#cursor-ide)
- [Google Gemini](#google-gemini)
- [VS Code Extension](#vs-code-extension)
- [JetBrains IDEs](#jetbrains-ides)
- [Obsidian](#obsidian)
- [Raycast](#raycast)
- [Command Line Integrations](#command-line-integrations)

## Claude Desktop

Claude Desktop provides native MCP support for seamless integration.

### Installation

1. Install Prompt Alchemy:
```bash
go install github.com/jonwraymond/prompt-alchemy@latest
# Or download from releases
```

2. Configure Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "prompt-alchemy",
      "args": ["serve", "mcp"],
      "env": {
        "PROMPT_ALCHEMY_CONFIG": "/Users/username/.prompt-alchemy/config.yaml"
      }
    }
  }
}
```

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "C:\\Users\\username\\go\\bin\\prompt-alchemy.exe",
      "args": ["serve", "mcp"],
      "env": {
        "PROMPT_ALCHEMY_CONFIG": "C:\\Users\\username\\.prompt-alchemy\\config.yaml"
      }
    }
  }
}
```

### Usage Examples

**Generate Prompts:**
```
User: Generate 5 different prompts for creating a user authentication system

Claude: I'll use Prompt Alchemy to generate diverse prompts for a user authentication system.

[Uses generate_prompts tool with count=5, persona=code]
```

**Optimize Existing Prompt:**
```
User: Optimize this prompt: "Write code for login"

Claude: I'll optimize this prompt to be more specific and effective.

[Uses optimize_prompt tool with target_score=9.0]
```

**Search and Refine:**
```
User: Find existing prompts about API security and improve the best one

Claude: I'll search for API security prompts and optimize the most relevant one.

[Uses search_prompts followed by optimize_prompt]
```

## Claude Code

Claude Code (claude.ai/code) integrates with MCP for enhanced development workflows.

### Configuration

Create `~/.claude/mcp_server_config.json`:
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "/usr/local/bin/prompt-alchemy",
      "args": ["serve", "mcp"],
      "description": "AI prompt generation and optimization",
      "alwaysAllow": ["generate_prompts", "optimize_prompt", "search_prompts", "batch_generate"],
      "restartOnFailure": true,
      "timeout": 30000
    }
  }
}
```

### Docker Configuration

For Docker users:
```json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "docker",
      "args": ["exec", "-i", "prompt-alchemy-mcp", "prompt-alchemy", "serve", "mcp"],
      "description": "Prompt Alchemy via Docker",
      "env": {
        "DOCKER_HOST": "unix:///var/run/docker.sock"
      }
    }
  }
}
```

### Code Examples

**Batch Processing:**
```python
# Claude Code can process multiple prompts efficiently
results = mcp.call_tool("prompt-alchemy", "batch_generate", {
    "inputs": [
        {
            "id": "auth",
            "input": "Create JWT authentication middleware",
            "persona": "code"
        },
        {
            "id": "validation",
            "input": "Build input validation system",
            "persona": "code"
        },
        {
            "id": "error",
            "input": "Design error handling framework",
            "persona": "code"
        }
    ],
    "workers": 3
})
```

**Interactive Optimization:**
```python
# Start with a basic prompt
initial = "Write Python function"

# Iteratively optimize
for i in range(3):
    result = mcp.call_tool("prompt-alchemy", "optimize_prompt", {
        "prompt": initial,
        "task": "Create async web scraper with rate limiting and error handling",
        "persona": "code",
        "target_model": "claude-3-opus",
        "max_iterations": 2
    })
    initial = result["optimized_prompt"]
    print(f"Iteration {i+1}: Score {result['final_score']}")
```

## Cursor IDE

Cursor provides deep AI integration with MCP support.

### Setup

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Navigate to **AI → MCP Servers**
3. Add configuration:

```json
{
  "prompt-alchemy": {
    "command": "prompt-alchemy",
    "args": ["serve", "mcp"],
    "env": {
      "PROMPT_ALCHEMY_CONFIG": "${workspaceFolder}/.prompt-alchemy/config.yaml"
    },
    "triggers": ["@prompt", "@optimize", "@search"],
    "capabilities": {
      "tools": [
        {
          "name": "generate_prompts",
          "description": "Generate AI prompts for coding tasks",
          "shortcuts": ["@prompt", "@generate"],
          "defaultParams": {
            "persona": "code",
            "count": 3
          }
        },
        {
          "name": "optimize_prompt",
          "description": "Optimize prompts for better results",
          "shortcuts": ["@optimize"],
          "defaultParams": {
            "persona": "code",
            "max_iterations": 3
          }
        },
        {
          "name": "search_prompts",
          "description": "Search existing prompts",
          "shortcuts": ["@search"],
          "defaultParams": {
            "limit": 5
          }
        }
      ]
    },
    "autoStart": true,
    "restartOnCrash": true
  }
}
```

### Usage Patterns

**Inline Generation:**
```typescript
// Type in editor:
// @prompt create a React hook for infinite scrolling

// Cursor generates:
const useInfiniteScroll = (callback: () => void) => {
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // ... rest of implementation
};
```

**Context-Aware Optimization:**
```python
# Select code and type @optimize
# Original:
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

# Cursor optimizes the selected code using context
```

**Project-Specific Prompts:**
Create `.cursor/prompt-alchemy.json` in your project:
```json
{
  "defaults": {
    "persona": "code",
    "tags": ["project:myapp"],
    "context": "React TypeScript application with Redux"
  },
  "shortcuts": {
    "@component": {
      "template": "Create a React component for {input}",
      "persona": "code",
      "phases": "prima-materia,solutio,coagulatio"
    },
    "@test": {
      "template": "Write comprehensive tests for {input}",
      "persona": "code",
      "count": 1
    }
  }
}
```

## Google Gemini

While Gemini doesn't natively support MCP, you can integrate using various approaches.

### Option 1: MCP-Gemini Bridge

Install and configure the bridge:
```bash
pip install mcp-gemini-bridge
```

Configuration (`~/.mcp-gemini/config.yaml`):
```yaml
servers:
  prompt-alchemy:
    command: prompt-alchemy
    args: [serve, mcp]
    description: "AI prompt generation"
    startup_timeout: 10
    
gemini:
  api_key: ${GOOGLE_API_KEY}
  model: gemini-pro
  safety_settings:
    - category: HARM_CATEGORY_HARASSMENT
      threshold: BLOCK_NONE
  
routing:
  - pattern: "(?i)generate.*prompt"
    server: prompt-alchemy
    tool: generate_prompts
    param_mapping:
      text: input
      num_results: count
  - pattern: "(?i)optimize.*prompt"
    server: prompt-alchemy
    tool: optimize_prompt
  - pattern: "(?i)search.*prompt"
    server: prompt-alchemy
    tool: search_prompts
    
logging:
  level: INFO
  file: ~/.mcp-gemini/bridge.log
```

Usage:
```python
import google.generativeai as genai
from mcp_gemini_bridge import GeminiBridge

# Initialize bridge
bridge = GeminiBridge(config_path="~/.mcp-gemini/config.yaml")
bridge.start()

# Configure Gemini to use bridge
genai.configure(
    api_key=os.environ["GOOGLE_API_KEY"],
    transport="grpc",
    client_options={"api_endpoint": bridge.endpoint}
)

model = genai.GenerativeModel('gemini-pro')

# Natural language usage
response = model.generate_content(
    "Generate 3 different prompts for building a recommendation system"
)

# Function calling
response = model.generate_content(
    "Optimize this prompt for Claude: 'Write Python code'",
    tools=[bridge.get_tool_definitions()]
)
```

### Option 2: Direct API Integration

Create a wrapper for Gemini:
```python
import google.generativeai as genai
import requests
import json

class PromptAlchemyGemini:
    def __init__(self, pa_api_url="http://localhost:8080"):
        self.pa_api = pa_api_url
        self.model = genai.GenerativeModel('gemini-pro')
        
    def generate_with_prompts(self, task_description):
        # First, use Prompt Alchemy to generate optimized prompts
        response = requests.post(
            f"{self.pa_api}/api/v1/prompts/generate",
            json={"input": task_description, "count": 3}
        )
        prompts = response.json()["prompts"]
        
        # Then use the best prompt with Gemini
        best_prompt = max(prompts, key=lambda p: p["score"])
        return self.model.generate_content(best_prompt["final_prompt"])
    
    def optimize_for_gemini(self, prompt, task):
        # Optimize specifically for Gemini
        response = requests.post(
            f"{self.pa_api}/api/v1/prompts/optimize",
            json={
                "prompt": prompt,
                "task": task,
                "target_model": "gemini-pro",
                "persona": "generic"
            }
        )
        return response.json()["optimized_prompt"]

# Usage
pa_gemini = PromptAlchemyGemini()

# Generate content with optimized prompts
result = pa_gemini.generate_with_prompts(
    "Create a Python class for managing database connections"
)

# Optimize existing prompt for Gemini
optimized = pa_gemini.optimize_for_gemini(
    "Write code",
    "Implement connection pooling with thread safety"
)
```

### Option 3: Gemini Studio Integration

Create a custom Gemini Studio extension:
```javascript
// gemini-studio-extension.js
class PromptAlchemyExtension {
  constructor() {
    this.baseUrl = 'http://localhost:8080/api/v1';
  }
  
  async generatePrompts(input, options = {}) {
    const response = await fetch(`${this.baseUrl}/prompts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        count: options.count || 3,
        persona: options.persona || 'generic'
      })
    });
    return response.json();
  }
  
  async optimizePrompt(prompt, task, targetModel = 'gemini-pro') {
    const response = await fetch(`${this.baseUrl}/prompts/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, task, target_model: targetModel })
    });
    return response.json();
  }
}

// Register extension
window.promptAlchemy = new PromptAlchemyExtension();
```

## VS Code Extension

Create a VS Code extension for Prompt Alchemy:

`package.json`:
```json
{
  "name": "prompt-alchemy-vscode",
  "displayName": "Prompt Alchemy",
  "version": "1.0.0",
  "engines": { "vscode": "^1.80.0" },
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "promptAlchemy.generate",
        "title": "Generate AI Prompts"
      },
      {
        "command": "promptAlchemy.optimize",
        "title": "Optimize Selected Prompt"
      }
    ],
    "keybindings": [
      {
        "command": "promptAlchemy.generate",
        "key": "ctrl+shift+p g",
        "mac": "cmd+shift+p g"
      }
    ],
    "configuration": {
      "title": "Prompt Alchemy",
      "properties": {
        "promptAlchemy.serverUrl": {
          "type": "string",
          "default": "http://localhost:8080",
          "description": "Prompt Alchemy API server URL"
        }
      }
    }
  }
}
```

## JetBrains IDEs

For IntelliJ IDEA, PyCharm, WebStorm, etc.:

Create `.idea/prompt-alchemy.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="PromptAlchemySettings">
    <option name="mcpCommand" value="prompt-alchemy" />
    <option name="mcpArgs">
      <list>
        <option value="serve" />
        <option value="mcp" />
      </list>
    </option>
    <option name="triggers">
      <map>
        <entry key="@prompt" value="generate_prompts" />
        <entry key="@optimize" value="optimize_prompt" />
      </map>
    </option>
  </component>
</project>
```

## Obsidian

Create an Obsidian plugin for note-based prompt management:

```javascript
// obsidian-prompt-alchemy.js
class PromptAlchemyPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'generate-prompt',
      name: 'Generate AI Prompt',
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        const content = await this.app.vault.read(activeFile);
        
        const result = await this.callMCP('generate_prompts', {
          input: content,
          persona: 'writing'
        });
        
        // Insert results into note
        const prompts = result.prompts.map(p => 
          `## ${p.phase}\n${p.prompt}\n\nScore: ${p.score}\n`
        ).join('\n---\n');
        
        await this.app.vault.append(activeFile, `\n\n# Generated Prompts\n${prompts}`);
      }
    });
  }
}
```

## Raycast

Create a Raycast extension:

```typescript
// raycast-prompt-alchemy.tsx
import { ActionPanel, Action, List, showToast } from "@raycast/api";
import { useState } from "react";

export default function GeneratePrompts() {
  const [prompts, setPrompts] = useState([]);
  
  async function generate(input: string) {
    const proc = spawn('prompt-alchemy', ['serve', 'mcp']);
    // ... MCP communication
    setPrompts(result.prompts);
  }
  
  return (
    <List>
      {prompts.map((prompt) => (
        <List.Item
          key={prompt.id}
          title={prompt.phase}
          subtitle={prompt.prompt}
          accessories={[{ text: `Score: ${prompt.score}` }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={prompt.prompt} />
              <Action.Paste content={prompt.prompt} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

## Command Line Integrations

### Shell Functions

Add to `~/.bashrc` or `~/.zshrc`:
```bash
# Generate prompts quickly
prompt() {
  local input="$*"
  prompt-alchemy generate "$input" --output json | jq -r '.prompts[0].final_prompt'
}

# Optimize prompt
optimize() {
  local prompt="$1"
  local task="$2"
  prompt-alchemy optimize --prompt "$prompt" --task "$task" --output json | jq -r '.optimized_prompt'
}

# Search and copy best prompt
psearch() {
  local query="$1"
  prompt-alchemy search "$query" --limit 1 --output json | \
    jq -r '.prompts[0].final_prompt' | \
    pbcopy && echo "Prompt copied to clipboard!"
}
```

### Git Hooks

`.git/hooks/prepare-commit-msg`:
```bash
#!/bin/bash
# Generate better commit messages
COMMIT_MSG_FILE=$1
ORIGINAL_MSG=$(cat "$COMMIT_MSG_FILE")

if [ -z "$ORIGINAL_MSG" ]; then
  # Get staged changes summary
  CHANGES=$(git diff --cached --stat)
  
  # Generate commit message
  PROMPT=$(prompt-alchemy generate "Create commit message for: $CHANGES" \
    --persona writing --count 1 --output json | \
    jq -r '.prompts[0].final_prompt')
  
  echo "$PROMPT" > "$COMMIT_MSG_FILE"
fi
```

### Make Integration

`Makefile`:
```makefile
# Generate prompts for documentation
docs-prompt:
	@prompt-alchemy generate "Write comprehensive documentation for $(PROJECT)" \
		--persona writing \
		--output json | jq -r '.prompts[0].final_prompt' > docs-prompt.md

# Optimize existing prompts
optimize-prompts:
	@for file in prompts/*.txt; do \
		prompt-alchemy optimize \
			--prompt "$$(cat $$file)" \
			--task "$(TASK)" \
			--output json | jq -r '.optimized_prompt' > "$$file.optimized"; \
	done
```

## Best Practices

1. **Choose the Right Persona**
   - `code`: For programming tasks
   - `writing`: For documentation and content
   - `analysis`: For data analysis and research
   - `generic`: For general purposes

2. **Optimize for Target Models**
   - Specify the target model when optimizing
   - Different models respond better to different prompt styles

3. **Use Batch Processing**
   - Process multiple prompts together for efficiency
   - Configure worker count based on your needs

4. **Cache and Search**
   - Search existing prompts before generating new ones
   - Reuse successful prompts from the database

5. **Monitor Performance**
   - Check generation scores
   - Track which prompts work best
   - Use the optimization tool to improve weak prompts

## Troubleshooting

### Common Issues

**MCP Connection Failed**
```bash
# Check if server is running
ps aux | grep prompt-alchemy

# Test MCP directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  prompt-alchemy serve mcp
```

**Slow Generation**
- Reduce token limits
- Use faster providers for iteration
- Enable parallel processing

**Integration Not Working**
- Verify configuration paths
- Check API keys are set
- Review logs for errors

For more help, see the [main documentation](./README.md) or [file an issue](https://github.com/jonwraymond/prompt-alchemy/issues).