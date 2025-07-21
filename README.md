<p align="center">
  <img src="docs/assets/prompt_alchemy2.png" alt="Prompt Alchemy" width="300"/>
</p>

<h1 align="center">Prompt Alchemy</h1>

<p align="center">
  <strong>Transform raw ideas into refined, effective prompts through a systematic three-phase process. An AI-powered system that improves prompt quality through structured refinement stages.</strong>
</p>

<p align="center">
    <a href="https://github.com/jonwraymond/prompt-alchemy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://github.com/jonwraymond/prompt-alchemy/issues"><img src="https://img.shields.io/github/issues/jonwraymond/prompt-alchemy" alt="Issues"></a>
</p>

---

## Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Quick Start](#-quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security Best Practices](#-security-best-practices)
- [Usage](#usage)
- [Integration Scenarios](#integration-scenarios)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [The Three-Phase Process](#the-three-phase-process)
- [Testing](#testing)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **⚗️ Three-Phase Refinement Process**: Systematic prompt improvement through distinct stages
  - **Prima Materia**: Extract core concepts and brainstorm possibilities
  - **Solutio**: Convert ideas into natural, conversational language
  - **Coagulatio**: Refine to precise, actionable prompts
- **🤖 Multi-Provider Support**: OpenAI, Claude (via Anthropic), Gemini, OpenRouter, Grok, and Ollama (local AI)
- **💾 Smart Storage**: SQLite database with context accumulation and search capabilities
- **🎯 Intelligent Ranking**: Advanced scoring system for prompt quality assessment
- **📊 Performance Tracking**: Monitor generation success rates and usage metrics
- **🔌 MCP Integration**: AI agent-friendly interface for seamless integration
- **⚡ Fast & Efficient**: Parallel processing for faster generation
- **📈 Detailed Metadata**: Complete generation records including costs and timing
- **🕒 Automated Scheduling**: Easy setup of nightly training jobs via cron/launchd

## AI Integration Examples

### 🤖 Claude Desktop
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "/path/to/prompt-alchemy",
      "args": ["serve", "mcp"]
    }
  }
}
```
**Usage**: Ask Claude to "generate prompts for creating a REST API" or "optimize this prompt for better results"

**Docker Setup** (Recommended for isolation):
```json
{
  "mcpServers": {
    "prompt-alchemy-docker": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${HOME}/.prompt-alchemy:/app/data",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=${OPENAI_API_KEY}",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}",
        "-e", "PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY=${GOOGLE_API_KEY}",
        "prompt-alchemy-mcp:latest"
      ]
    }
  }
}
```

### 💻 Claude Code (claude.ai/code)
```json
// ~/.claude/mcp_server_config.json
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "/usr/local/bin/prompt-alchemy",
      "args": ["serve", "mcp"],
      "alwaysAllow": ["generate_prompts", "optimize_prompt"]
    }
  }
}
```

### 🎯 Cursor IDE
```json
// Cursor Settings → AI → MCP Servers
{
  "prompt-alchemy": {
    "command": "prompt-alchemy",
    "args": ["serve", "mcp"],
    "triggers": ["@prompt", "@optimize"]
  }
}
```
**Usage**: Type `@prompt create a React component` in your code

**Advanced Setup with Environment Variables**:
```json
{
  "prompt-alchemy": {
    "command": "prompt-alchemy",
    "args": ["serve", "mcp"],
    "env": {
      "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY": "${OPENAI_API_KEY}",
      "PROMPT_ALCHEMY_SELF_LEARNING_ENABLED": "true"
    },
    "triggers": ["@prompt", "@optimize", "@alchemy"]
  }
}
```

### 🧠 Google Gemini (via Bridge)
```python
# Using MCP-Gemini Bridge
import google.generativeai as genai

model = genai.GenerativeModel('gemini-pro')
response = model.generate_content(
    "Generate prompts for user authentication",
    tools=[{"function_declarations": [{
        "name": "generate_prompts",
        "parameters": {
            "type": "object",
            "properties": {
                "input": {"type": "string"},
                "count": {"type": "integer"}
            }
        }
    }]}]
)
```

### 🤖 Grok (xAI)
```python
# Direct API integration with Grok optimization
import requests

response = requests.post("http://localhost:8080/api/v1/prompts/optimize", json={
    "prompt": "Write Python code",
    "task": "Create async task queue",
    "target_model": "grok-2",
    "persona": "code"
})
optimized_prompt = response.json()["optimized_prompt"]
```

For detailed integration guides, see [MCP Setup Documentation](./MCP_SETUP.md) and [Integration Examples](./INTEGRATION_EXAMPLES.md).

## System Requirements

### Minimum Requirements
- **Go**: Version 1.23 or higher
- **Operating System**: Linux, macOS, or Windows
- **Memory**: 256 MB RAM minimum, 512 MB recommended
- **Storage**: 100 MB free disk space for application and database
- **Network**: Internet connection required for AI provider access

### Supported Platforms
- **Linux**: x86_64, ARM64 (Ubuntu 20.04+, RHEL 8+, or equivalent)
- **macOS**: Intel and Apple Silicon (macOS 11.0+)
- **Windows**: x86_64 (Windows 10+)

### Dependencies
- **SQLite**: Embedded database (included, no separate installation required)
- **Git**: Required for cloning the repository
- **Make**: Required for using build commands (optional, can build with `go build` directly)
- **No additional system libraries**: Self-contained binary with minimal dependencies

### AI Provider Requirements

To use Prompt Alchemy, you need API access to at least one AI provider:

#### Required API Keys (Choose one or more)
- **OpenAI**: API key from [platform.openai.com](https://platform.openai.com)
  - Supports: GPT models, text embeddings
  - Billing: Pay-per-use, requires credit card
  - Rate limits: Varies by tier
  
- **Anthropic (Claude)**: API key from [console.anthropic.com](https://console.anthropic.com)
  - Supports: Claude models (Sonnet, Haiku, Opus)
  - Billing: Pay-per-use
  - Rate limits: Generous for most use cases
  
- **Google (Gemini)**: API key from [Google AI Studio](https://aistudio.google.com)
  - Supports: Gemini models (Pro, Flash)
  - Billing: Free tier available, then pay-per-use
  - Rate limits: Generous free tier
  
- **OpenRouter**: API key from [openrouter.ai](https://openrouter.ai)
  - Supports: Access to multiple model providers through one API
  - Billing: Pay-per-use with competitive pricing
  - Rate limits: Varies by underlying provider
  
- **Ollama**: Local installation (no API key needed)
  - Supports: Local model execution
  - Requirements: Additional 4-8 GB RAM for models
  - Setup: Install from [ollama.ai](https://ollama.ai)
  
- **Grok**: API key from [platform.grok.com](https://platform.grok.com)
  - Supports: Grok models with conversational AI
  - Billing: Pay-per-use
  - Rate limits: Standard for most use cases

#### Regional Availability
- OpenAI: Available in most countries (check OpenAI's usage policies)
- Anthropic: Available in US, UK, and select regions
- Google: Available globally with some regional restrictions
- OpenRouter: Global availability (depends on underlying providers)
- Ollama: No restrictions (runs locally)
- Grok: Check platform.grok.com for current availability

### Development Requirements (For Contributors)
- **Go**: Version 1.23+ with modules enabled
- **Git**: For version control and contributions
- **Make**: For build automation and testing
- **golangci-lint**: For code quality checks (optional)
- **gosec**: For security scanning (optional)

### Docker Requirements (Optional)
If using Docker deployment:
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+ (for multi-container setups)
- **Memory**: 512 MB RAM minimum for container
- **Storage**: 200 MB for Docker image

### Performance Recommendations

#### For Light Usage (< 100 prompts/day)
- 1 CPU core, 512 MB RAM
- Any supported AI provider
- Standard internet connection

#### For Heavy Usage (1000+ prompts/day)
- 2+ CPU cores, 1 GB+ RAM
- Multiple AI provider accounts for redundancy
- Stable, fast internet connection
- Consider local Ollama for reduced API costs

#### For Production Deployment
- 4+ CPU cores, 2 GB+ RAM
- Load balancer for high availability
- Database backup strategy
- Monitoring and alerting setup
- Multiple API keys for rate limit distribution
- **Security hardening**: Firewall rules, network segmentation
- **Access control**: Authentication, authorization, audit logging
- **Secret management**: Secure vault for API keys, regular rotation
- **Container security**: Use non-root user, scan for vulnerabilities
- **HTTPS only**: TLS termination, secure headers

## 🚀 Quick Start

**Get up and running in 5 minutes!** See [QUICKSTART.md](./QUICKSTART.md) for comprehensive setup instructions covering:

- **Docker deployment** (recommended) - One-command setup
- **Local installation** - Build from source or download binary
- **All modes**: API server, MCP server, hybrid mode, and Ollama integration
- **Both deployment types** with troubleshooting guides

### Super Quick Docker Start
```bash
# 1. Setup
cp .env.example .env
# Edit .env with your API keys

# 2. Choose your mode
./start-api.sh      # API Server (Web Apps)
./start-mcp.sh      # MCP Server (AI Agents)
./start-hybrid.sh   # Both (Development)
./start-ollama.sh   # Local AI
```

## Installation

For detailed installation instructions, see [QUICKSTART.md](./QUICKSTART.md). Quick options:

```bash
# Docker (Recommended)
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy
cp .env.example .env
# Edit .env with your API keys
./start-api.sh

# Local Build
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy
make build
prompt-alchemy serve api
```

### Docker Management Scripts

Easy-to-use scripts for managing the MCP server:

- **start-mcp-docker.sh**: Start the MCP server using Docker
- **stop-mcp.sh**: Stop the running MCP server
- **logs-mcp.sh**: View logs for the MCP server

```bash
# Start MCP server with Docker
./start-mcp-docker.sh

# View logs
./logs-mcp.sh

# View last 50 lines
./logs-mcp.sh -n 50

# Stop the server
./stop-mcp.sh
```

### Docker Compose Usage

For production deployments, use Docker Compose:

```bash
# Start with docker-compose
docker-compose up -d

# Use the quickstart configuration
docker-compose -f docker-compose.quickstart.yml up -d

# Start with HTTP API enabled
docker-compose -f docker-compose.quickstart.yml --profile with-api up -d

# View logs
docker-compose logs -f prompt-alchemy-mcp

# Stop all services
docker-compose down
```

## Configuration

Create a configuration file at `~/.prompt-alchemy/config.yaml`:

```yaml
# Provider configurations
providers:
  openai:
    api_key: "your-openai-api-key"
    model: "o4-mini"
  
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openrouter/auto"  # Auto-select best available model
    fallback_models:
      - "anthropic/claude-sonnet-4"
      - "anthropic/claude-3.5-sonnet"
      - "openai/o4-mini"
  
  claude:
    api_key: "your-anthropic-api-key"
    model: "claude-sonnet-4-20250514"  # Latest Claude 4 Sonnet
  
  gemini:
    api_key: "your-google-api-key"
    model: "gemini-2.5-flash"
    timeout: 60  # HTTP timeout in seconds
    safety_threshold: "BLOCK_MEDIUM_AND_ABOVE"  # Safety filter threshold
    max_pro_tokens: 1024   # Max tokens for Pro models
    max_flash_tokens: 512  # Max tokens for Flash models
    default_tokens: 256    # Default token limit
    max_temperature: 2.0   # Maximum temperature allowed

  ollama:
    base_url: "http://localhost:11434"
    model: "gemma3:4b"
    timeout: 60  # HTTP timeout in seconds
    default_embedding_model: "nomic-embed-text"  # Default embedding model
    embedding_timeout: 5     # Embedding timeout in seconds
    generation_timeout: 120  # Generation timeout in seconds

  grok:
    api_key: "your-grok-api-key"
    model: "grok-2-1212"

# Alchemical phase configurations
phases:
  prima-materia:
    provider: "openai"     # Extract raw essence
  solutio:
    provider: "anthropic"  # Dissolve into natural form
  coagulatio:
    provider: "google"     # Crystallize to perfection

# Generation settings
generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-sonnet-4-20250514"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

### Environment Variables

Alternatively, use environment variables (create a `.env` file or export directly):

```bash
# OpenAI Configuration
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-your-openai-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="o4-mini"

# OpenRouter Configuration
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="sk-or-your-openrouter-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_MODEL="openrouter/auto"

# Anthropic (Claude) Configuration
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_MODEL="claude-sonnet-4-20250514"

# Google (Gemini) Configuration
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="your-google-api-key"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MODEL="gemini-2.5-flash"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_SAFETY_THRESHOLD="BLOCK_MEDIUM_AND_ABOVE"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_PRO_TOKENS="1024"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_FLASH_TOKENS="512"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_DEFAULT_TOKENS="256"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_TEMPERATURE="2.0"

# Ollama Configuration (Local AI)
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_MODEL="gemma3:4b"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL="http://localhost:11434"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_DEFAULT_EMBEDDING_MODEL="nomic-embed-text"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_EMBEDDING_TIMEOUT="5"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_GENERATION_TIMEOUT="120"

# Grok Configuration
export PROMPT_ALCHEMY_PROVIDERS_GROK_API_KEY="your-grok-api-key"
export PROMPT_ALCHEMY_PROVIDERS_GROK_MODEL="grok-2-1212"
```

**`.env` File Example:** Copy the above exports to a `.env` file (without `export`) for automatic loading.

### 🔐 Security Best Practices

**⚠️ API Key Security**
- Never commit API keys to version control
- Use environment variables or secure configuration files
- Keep `.env` files in `.gitignore` (already configured)
- Rotate API keys regularly
- Use least-privilege access when possible
- Monitor API usage for unexpected activity

**🛡️ Additional Security Measures**
- Run local Ollama for privacy-sensitive prompts
- Use network isolation for production deployments
- Implement rate limiting if exposing API publicly
- Regular security updates and dependency scanning
- Audit logs for sensitive operations

## Usage

### Generate Prompts

#### Basic Generation

Generate prompts using the three alchemical phases:

```bash
prompt-alchemy generate "Create a REST API endpoint for user authentication"
```

**Sample Output:**
```
🔬 Prima Materia (OpenAI GPT-4o-mini)
Raw essence: Authentication endpoint requirements, security considerations, HTTP methods, 
request/response structure, validation logic, error handling, token management...

🌊 Solutio (Anthropic Claude-4-Sonnet)  
Natural flow: You need to build a secure login system that handles user credentials safely.
Think about POST requests to /auth/login, validating email/password, generating JWT tokens,
and returning appropriate success or error responses...

⚗️ Coagulatio (Google Gemini-2.5-Flash)
Crystallized form: Create a POST /api/auth/login endpoint that accepts {email, password},
validates credentials against database, generates JWT token on success, returns
{token, user_id, expires_at} or {error, message} with appropriate HTTP status codes.
```

#### Advanced Generation Options

**Multiple Transmutations:**
```bash
prompt-alchemy generate --count 5 "Design a caching strategy"
```
Generates 5 different prompt variations, ranked by quality score.

**Custom Phases:**
```bash
# Skip Prima Materia, go straight to refinement
prompt-alchemy generate --phases "solutio,coagulatio" "Optimize database queries"

# Only extract raw concepts
prompt-alchemy generate --phases "prima-materia" "Machine learning workflow"
```

**Provider-Specific Generation:**
```bash
# Use OpenRouter for all phases (access to multiple models)
prompt-alchemy generate --provider openrouter "Create a microservice architecture"

# Use local Ollama for privacy-sensitive prompts
prompt-alchemy generate --provider ollama "Handle customer data processing"
```

**Temperature and Token Control:**
```bash
# More creative output
prompt-alchemy generate --temperature 0.9 --max-tokens 3000 "Write a creative story prompt"

# More focused, deterministic output  
prompt-alchemy generate --temperature 0.3 --max-tokens 1000 "Create unit test cases"
```

**Tagging and Organization:**
```bash
# Add tags for later retrieval
prompt-alchemy generate --tags "api,security,backend" "OAuth2 implementation guide"

# Multiple tags for complex categorization
prompt-alchemy generate --tags "frontend,react,testing,e2e" "Component testing strategy"
```

**JSON Output for Integration:**
```bash
prompt-alchemy generate --output json "Database migration strategy" | jq '.prompts[0].content'
```

#### Persona-Based Generation

Different personas optimize for different use cases:

```bash
# Technical documentation persona
prompt-alchemy generate --persona technical "Implement Redis caching"
```
**Output Focus:** Code examples, technical accuracy, implementation details

```bash
# Creative writing persona  
prompt-alchemy generate --persona creative "User onboarding experience"
```
**Output Focus:** Narrative flow, user experience, emotional engagement

```bash
# Business strategy persona
prompt-alchemy generate --persona business "Feature prioritization framework"
```
**Output Focus:** ROI considerations, stakeholder impact, business metrics

### Search Prompts

#### Basic Search

**Text-Based Search:**
```bash
prompt-alchemy search "authentication"
```

**Sample Output:**
```
┌────┬─────────────────────────────────┬──────────┬─────────────┬───────────────┐
│ ID │ Content Preview                 │ Score    │ Tags        │ Created       │
├────┼─────────────────────────────────┼──────────┼─────────────┼───────────────┤
│ 42 │ Create JWT authentication...    │ 0.95     │ auth,api    │ 2 hours ago   │
│ 38 │ OAuth2 implementation guide... │ 0.87     │ auth,oauth  │ 1 day ago     │
│ 29 │ User session management...      │ 0.82     │ auth,users  │ 3 days ago    │
└────┴─────────────────────────────────┴──────────┴─────────────┴───────────────┘
```

#### Advanced Search Options

**Tag-Based Filtering:**
```bash
# Find all security-related prompts
prompt-alchemy search --tags "security" "password"

# Multiple tag filtering (AND operation)
prompt-alchemy search --tags "api,testing" "integration"
```

**Phase-Specific Search:**
```bash
# Find only crystallized (final) prompts
prompt-alchemy search --phase coagulatio "database design"

# Find raw concepts for inspiration
prompt-alchemy search --phase prima-materia "machine learning"
```

**Model-Specific Search:**
```bash
# Find prompts generated by specific models
prompt-alchemy search --model "claude-4-sonnet" "code review"
prompt-alchemy search --model "o4-mini" "documentation"
```

**Semantic Search (Similarity-Based):**
```bash
# Find conceptually similar prompts
prompt-alchemy search --semantic --similarity 0.7 "user interface design"
```

**Sample Semantic Search Output:**
```
┌────┬─────────────────────────────────┬───────────┬─────────────┬───────────────┐
│ ID │ Content Preview                 │ Similarity│ Tags        │ Created       │
├────┼─────────────────────────────────┼───────────┼─────────────┼───────────────┤
│ 67 │ Create responsive web layout... │ 0.89      │ ui,frontend │ 1 hour ago    │
│ 45 │ Mobile app navigation design... │ 0.76      │ ui,mobile   │ 2 days ago    │
│ 33 │ Dashboard wireframe creation... │ 0.71      │ ui,admin    │ 1 week ago    │
└────┴─────────────────────────────────┴───────────┴─────────────┴───────────────┘
```

#### Search Limitations

**Current Status:**
- ✅ **Text Search**: Full-text search across prompt content
- ✅ **Tag Filtering**: Filter by assigned tags
- ✅ **Phase Filtering**: Filter by alchemical phase
- ✅ **Model Filtering**: Filter by generation model
- 🚧 **Semantic Search**: In development (basic similarity matching available)
- 🚧 **Advanced Filters**: Date ranges, score thresholds (coming soon)
- 📅 **Planned**: Natural language queries, context-aware search

### Automated Learning

#### Schedule Setup

**Basic Scheduling:**
```bash
# Install nightly learning at 2 AM
prompt-alchemy schedule --time "0 2 * * *"
```

**Custom Scheduling:**
```bash
# Run every 6 hours for active development
prompt-alchemy schedule --time "0 */6 * * *"

# Weekly training on Sundays at 3 AM
prompt-alchemy schedule --time "0 3 * * 0"
```

**System-Specific Methods:**
```bash
# Force use of cron (Linux/macOS)
prompt-alchemy schedule --time "0 2 * * *" --method cron

# Force use of launchd (macOS only, more reliable)
prompt-alchemy schedule --time "0 2 * * *" --method launchd

# Preview what would be installed
prompt-alchemy schedule --time "0 2 * * *" --dry-run
```

#### Manual Training

```bash
# Run training immediately
prompt-alchemy nightly

# Training with verbose output
prompt-alchemy nightly --verbose

# Training with specific parameters
prompt-alchemy nightly --learning-rate 0.01 --epochs 10
```

### Integration Scenarios

#### 1. Claude Desktop Integration (MCP)
```bash
# Setup MCP server for Claude Desktop
prompt-alchemy serve mcp

# Configure Claude Desktop MCP settings
{
  "mcpServers": {
    "prompt-alchemy": {
      "command": "prompt-alchemy",
      "args": ["serve", "mcp"]
    }
  }
}
```

#### 2. Web Application Integration (REST API)
```bash
# Start API server
prompt-alchemy serve api --port 8080

# Generate prompts via REST API
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Create authentication system", "count": 3}'

# Search existing prompts
curl "http://localhost:8080/api/v1/prompts/search?query=auth&limit=5"
```

#### 3. CI/CD Pipeline Integration
```bash
# Add to your CI/CD pipeline
name: Generate Documentation Prompts
jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate prompts
        run: |
          echo "${{ secrets.OPENAI_API_KEY }}" | prompt-alchemy generate \
            --tags "docs,ci" "Generate API documentation for ${{ github.repository }}"
```

#### 4. Automated Content Generation
```bash
# Schedule nightly prompt generation
prompt-alchemy schedule --time "0 2 * * *"

# Batch generate prompts for content calendar
prompt-alchemy batch generate \
  --input-file content-ideas.txt \
  --output-file generated-prompts.json \
  --workers 5
```

#### 5. Docker Production Deployment
```bash
# Production API server
docker-compose -f docker-compose.yml up -d

# Production MCP server
docker run -d \
  --name prompt-alchemy-mcp \
  --env-file .env \
  prompt-alchemy:latest serve mcp
```

#### 6. Multi-Environment Setup
```bash
# Development environment
PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="gpt-4o-mini" \
  prompt-alchemy serve api --port 8080

# Staging environment
PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="gpt-4o" \
  prompt-alchemy serve api --port 8081

# Production environment
PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="gpt-4o" \
  prompt-alchemy serve api --port 8082
```

#### 7. Webhook Integration
```bash
# Setup webhook endpoint (requires reverse proxy)
prompt-alchemy serve api --port 8080 --host 0.0.0.0

# Process webhook data
curl -X POST http://your-domain.com/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Process webhook: ${webhook_data}", "tags": ["webhook", "auto"]}'
```

#### 8. Monitoring and Observability
```bash
# Enable debug logging
export LOG_LEVEL=debug
prompt-alchemy serve api --log-level debug

# Monitor API performance
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/providers

# Database monitoring
sqlite3 ~/.prompt-alchemy/prompts.db "SELECT COUNT(*) FROM prompts;"
```

#### 9. Kubernetes Deployment
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prompt-alchemy-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prompt-alchemy-api
  template:
    metadata:
      labels:
        app: prompt-alchemy-api
    spec:
      containers:
      - name: prompt-alchemy
        image: prompt-alchemy:latest
        command: ["prompt-alchemy", "serve", "api"]
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-key
```

#### 10. Cloud Function Integration
```javascript
// Google Cloud Function
exports.generatePrompt = async (req, res) => {
  const { spawn } = require('child_process');
  
  const prompt = spawn('prompt-alchemy', ['generate', req.body.input]);
  let output = '';
  
  prompt.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  prompt.on('close', (code) => {
    res.json({ result: output, status: code });
  });
};
```

#### 11. Infrastructure as Code (Terraform)
```hcl
# terraform/main.tf
resource "aws_ecs_task_definition" "prompt_alchemy" {
  family                   = "prompt-alchemy"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  
  container_definitions = jsonencode([
    {
      name  = "prompt-alchemy"
      image = "prompt-alchemy:latest"
      command = ["prompt-alchemy", "serve", "api"]
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }
      ]
    }
  ])
}
```

#### 12. Serverless Integration (AWS Lambda)
```python
# lambda_function.py
import json
import subprocess
import os

def lambda_handler(event, context):
    # Set environment variables
    os.environ['OPENAI_API_KEY'] = os.environ['OPENAI_API_KEY']
    
    # Generate prompt
    result = subprocess.run([
        'prompt-alchemy', 'generate', 
        event['input']
    ], capture_output=True, text=True)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'result': result.stdout,
            'error': result.stderr
        })
    }
```

### Common Workflows

#### 1. New Project Setup
```bash
# Generate initial architecture prompt
prompt-alchemy generate --tags "architecture,planning" \
  "Design microservices architecture for e-commerce platform"

# Generate development workflow
prompt-alchemy generate --tags "workflow,development" \
  "Establish CI/CD pipeline for microservices"

# Search for related patterns
prompt-alchemy search --tags "architecture" "microservices"
```

#### 2. Feature Development
```bash
# Generate feature specification
prompt-alchemy generate --persona business --tags "feature,spec" \
  "User notification system requirements"

# Generate technical implementation
prompt-alchemy generate --persona technical --tags "feature,implementation" \
  "Real-time notification service architecture"

# Generate testing strategy
prompt-alchemy generate --tags "testing,feature" \
  "Notification system test coverage plan"
```

#### 3. Code Review Process
```bash
# Generate review checklist
prompt-alchemy generate --tags "review,checklist" \
  "Code review criteria for security features"

# Find existing review patterns
prompt-alchemy search --tags "review" "security"

# Generate documentation prompts
prompt-alchemy generate --persona technical --tags "docs,review" \
  "API documentation standards for security endpoints"
```

### Best Practices

#### Effective Prompt Generation
- **Be Specific**: Include context, constraints, and desired outcomes
- **Use Tags**: Organize prompts for easy retrieval and categorization
- **Iterate**: Generate multiple variations and refine based on results
- **Choose Appropriate Phases**: Use all three for complex topics, specific phases for focused needs

#### Tagging Strategy
- **Hierarchical Tags**: Use broad categories (api, frontend, testing) and specific ones (jwt, react, unit)
- **Consistent Naming**: Establish tag conventions across your team
- **Context Tags**: Include project, team, or client-specific tags

#### Provider Selection
- **OpenAI**: Best for code generation and technical accuracy
- **Anthropic**: Excellent for natural language and explanations  
- **Google**: Fast responses and good for general-purpose tasks
- **OpenRouter**: Access to latest models and fallback options
- **Grok**: Conversational AI with unique personality and approach
- **Ollama**: Privacy-focused, offline usage, cost-effective for development

#### Performance Optimization
- **Batch Similar Requests**: Generate multiple prompts in one session
- **Use Appropriate Models**: Faster models for development, premium models for production
- **Monitor Costs**: Track API usage and optimize model selection
- **Cache Results**: Save frequently used prompts to avoid regeneration
- **Parallel Processing**: Enable `use_parallel: true` for faster generation
- **Provider Selection**: Use local Ollama for development, cloud providers for production
- **Token Optimization**: Set appropriate max_tokens based on use case
- **Network Optimization**: Use providers with lowest latency for your region

### Error Handling Examples

#### Common Generation Errors
```bash
# API rate limit
$ prompt-alchemy generate "test prompt"
Error: rate limit exceeded for provider 'openai'
Solution: Wait 60 seconds or switch providers with --provider flag

# Invalid configuration
$ prompt-alchemy generate "test prompt"  
Error: no valid providers configured
Solution: Check config.yaml or set environment variables

# Network timeout
$ prompt-alchemy generate "test prompt"
Error: timeout connecting to api.anthropic.com
Solution: Check internet connection or try --provider ollama for offline use
```

#### Search Error Examples
```bash
# Empty database
$ prompt-alchemy search "test query"
No prompts found. Generate some prompts first with 'prompt-alchemy generate'

# Invalid similarity threshold
$ prompt-alchemy search --similarity 1.5 "test"
Error: similarity must be between 0.0 and 1.0
```

### Output Formats

#### Default Human-Readable Output
- Color-coded phases with emoji indicators
- Formatted text with proper spacing
- Metadata summary (tokens, cost, timing)

#### JSON Output for Integration
```bash
prompt-alchemy generate --output json "test prompt" | jq '.'
```

**Sample JSON Structure:**
```json
{
  "prompts": [
    {
      "id": "abc123",
      "content": "Crystallized prompt content...",
      "phase": "coagulatio", 
      "provider": "anthropic",
      "model": "claude-4-sonnet",
      "score": 0.92,
      "metadata": {
        "tokens": 150,
        "cost": 0.003,
        "duration_ms": 1200
      },
      "tags": ["api", "security"],
      "created_at": "2025-01-11T09:15:30Z"
    }
  ],
  "summary": {
    "total_prompts": 1,
    "total_cost": 0.003,
    "total_duration_ms": 1200
  }
}
```

#### Table Output for Analysis
```bash
prompt-alchemy search --output table "authentication" --limit 10
```

Displays results in a formatted table with columns for ID, content preview, score, tags, and timestamps.

## Best Practices for Managing Persistent Containers

### Docker Volume Management

Always use Docker volumes to persist your data across container restarts:

```bash
# Recommended: Use named volumes
docker run -v ~/.prompt-alchemy:/app/data prompt-alchemy-mcp:latest

# This ensures:
# - Database persistence (prompts.db)
# - Vector embeddings persistence
# - Learning data accumulation
# - Configuration persistence
```

### Container Lifecycle Management

```bash
# Rebuild after updates
docker build -f Dockerfile.mcp -t prompt-alchemy-mcp:latest .

# Clean up old containers
docker container prune

# Clean up unused images
docker image prune -a

# Monitor resource usage
docker stats prompt-alchemy-mcp-server
```

### Environment Configuration

1. **Use .env files** for sensitive data:
```bash
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

2. **Never commit .env files** to version control
3. **Use environment-specific configs**:
   - `.env.development`
   - `.env.production`
   - `.env.local`

### Backup Strategy

```bash
# Backup your data regularly
tar -czf prompt-alchemy-backup-$(date +%Y%m%d).tar.gz ~/.prompt-alchemy/

# Restore from backup
tar -xzf prompt-alchemy-backup-20240315.tar.gz -C ~/
```

### Monitoring and Logging

```bash
# Real-time log monitoring
docker logs -f prompt-alchemy-mcp-server

# Export logs for analysis
docker logs prompt-alchemy-mcp-server > prompt-alchemy-$(date +%Y%m%d).log

# Check container health
docker inspect prompt-alchemy-mcp-server | jq '.[0].State.Health'
```

### Security Best Practices

1. **Run containers with least privilege**:
```bash
docker run --read-only --tmpfs /tmp prompt-alchemy-mcp:latest
```

2. **Limit resources**:
```bash
docker run --memory="512m" --cpus="1.0" prompt-alchemy-mcp:latest
```

3. **Use secrets management** for production:
   - Docker Secrets
   - Kubernetes Secrets
   - HashiCorp Vault

## Troubleshooting

### Configuration Validation

#### Validate Configuration File
```bash
# Validate configuration syntax and structure
prompt-alchemy config --validate

# Test all configured providers
prompt-alchemy providers --test

# Check specific provider connectivity
prompt-alchemy providers --test --provider openai

# Debug configuration loading
prompt-alchemy --log-level debug config --show
```

#### Common Configuration Issues
- **Invalid YAML Syntax**: Use [yamllint.com](https://yamllint.com) to validate your `config.yaml`
- **Wrong Indentation**: YAML requires consistent spacing (use spaces, not tabs)
- **Missing API Keys**: Ensure all required providers have valid API keys
- **Incorrect Model Names**: Verify model names match provider documentation

### Error Handling Guide

#### API Key Errors
```bash
# Error: Invalid OpenAI API key
Error: authentication failed: invalid API key

# Solutions:
1. Check API key in config.yaml or environment variables
2. Verify key hasn't expired or been revoked
3. Ensure key has correct permissions
4. Test key directly with provider's API
```

#### Network Connectivity Errors
```bash
# Error: Failed to connect to provider
Error: network timeout: failed to connect to api.openai.com

# Solutions:
1. Check internet connection
2. Verify firewall/proxy settings
3. Test DNS resolution: nslookup api.openai.com
4. Try different network or VPN
5. Check provider status pages
```

#### Provider-Specific Errors
```bash
# OpenAI Errors
Error: rate limit exceeded (429)
Solution: Wait and retry, or upgrade API plan

Error: model not found (404)
Solution: Check model name in configuration

# Anthropic Errors  
Error: invalid request format (400)
Solution: Check prompt length and formatting

# Google Errors
Error: safety filter triggered
Solution: Adjust safety_threshold in config

# Ollama Errors
Error: connection refused (localhost:11434)
Solution: Start Ollama service: ollama serve

# Grok Errors
Error: authentication failed (401)
Solution: Check API key and account status
```

#### Database and Storage Errors
```bash
# Error: Database locked
Error: database is locked

# Solutions:
1. Close other instances of prompt-alchemy
2. Check file permissions on database directory
3. Ensure sufficient disk space

# Error: Permission denied
Error: permission denied: ~/.prompt-alchemy/

# Solutions:
1. Check directory permissions: ls -la ~/.prompt-alchemy/
2. Create directory manually: mkdir -p ~/.prompt-alchemy/
3. Fix permissions: chmod 755 ~/.prompt-alchemy/
```

#### MCP Server Errors
```bash
# Error: JSON-RPC parse error
Error: invalid JSON-RPC request format

# Solutions:
1. Verify JSON-RPC 2.0 format compliance
2. Check for proper Content-Type headers
3. Ensure stdin/stdout are not mixed with logs

# Error: Method not found
Error: method 'invalid_method' not found

# Solutions:
1. Use supported methods: tools/list, tools/call
2. Check MCP protocol documentation
3. Verify method spelling and parameters

# Error: Hybrid mode output mixing
Warning: HTTP logs mixed with MCP JSON-RPC

# Solutions:
1. Use separate processes for production
2. Redirect logs to file: --log-level warn
3. Use dedicated MCP or API mode instead

# Error: Claude Desktop connection failed
Error: MCP server not responding

# Solutions:
1. Check Claude Desktop MCP configuration
2. Verify binary path and permissions
3. Test MCP server manually: echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | prompt-alchemy serve mcp
```

### Debug and Logging

#### Enable Debug Mode
```bash
# Enable debug logging for all commands
export LOG_LEVEL=debug
prompt-alchemy generate "test prompt"

# Or use flag for single command
prompt-alchemy --log-level debug generate "test prompt"

# Enable verbose output
prompt-alchemy --verbose generate "test prompt"
```

#### Log File Locations
- **Linux/macOS**: `~/.prompt-alchemy/logs/`
- **Windows**: `%USERPROFILE%\.prompt-alchemy\logs\`
- **Docker**: `/app/logs/` (if volume mounted)

#### Analyzing Logs
```bash
# View recent logs
tail -f ~/.prompt-alchemy/logs/prompt-alchemy.log

# Search for errors
grep -i error ~/.prompt-alchemy/logs/prompt-alchemy.log

# Filter by provider
grep "openai" ~/.prompt-alchemy/logs/prompt-alchemy.log
```

### Troubleshooting Steps

#### 1. Check Configuration
```bash
# Step 1: Validate YAML syntax
yamllint ~/.prompt-alchemy/config.yaml

# Step 2: Test configuration loading
prompt-alchemy config --show

# Step 3: Validate provider settings
prompt-alchemy providers --list

# Step 4: Test provider connections
prompt-alchemy providers --test
```

#### 2. Test Individual Components
```bash
# Test database connectivity
prompt-alchemy search --query "test" --dry-run

# Test specific provider
prompt-alchemy generate --provider openai --dry-run "test"

# Test embeddings
prompt-alchemy --log-level debug search "test query"
```

#### 3. Check System Health
```bash
# Check disk space
df -h ~/.prompt-alchemy/

# Check memory usage
ps aux | grep prompt-alchemy

# Check network connectivity
curl -I https://api.openai.com/v1/models

# Check Go version
go version
```

### Common Issues and Solutions

#### CLI Command Errors
```bash
# Issue: Command not found
Error: prompt-alchemy: command not found

# Solution:
1. Check installation: which prompt-alchemy
2. Add to PATH: export PATH=$PATH:/path/to/prompt-alchemy
3. Use full path: /path/to/prompt-alchemy generate "test"
4. For Docker: Use docker-compose or startup scripts

# Issue: Invalid flag
Error: unknown flag: --invalid-flag

# Solution:
1. Check available flags: prompt-alchemy generate --help
2. Verify flag spelling and format
3. Use proper flag syntax: --flag=value or --flag value

# Issue: Invalid phase name
Error: unknown phase: "invalid-phase"

# Solution:
1. Use valid phases: prima-materia, solutio, coagulatio
2. Check phase spelling (use hyphens, not underscores)
3. List available phases: prompt-alchemy generate --help
```

#### Installation Issues
```bash
# Issue: Go version too old
Error: go: go.mod requires go >= 1.23

# Solution: Update Go
1. Download latest Go from golang.org
2. Update PATH environment variable
3. Verify: go version

# Issue: Build fails
Error: package not found

# Solution: Clean and rebuild
go clean -modcache
go mod download
go build -o prompt-alchemy cmd/prompt-alchemy/main.go

# Issue: Docker build fails
Error: failed to solve: executor failed running [/bin/sh -c go build]

# Solution: 
1. Check Docker daemon is running
2. Clear Docker cache: docker system prune -a
3. Rebuild with --no-cache flag
4. Check available disk space

# Issue: Docker container won't start
Error: container exits immediately

# Solution:
1. Check logs: docker-compose logs
2. Verify environment variables in .env file
3. Check port conflicts: lsof -i :8080
4. Ensure API keys are properly set
```

#### Runtime Issues
```bash
# Issue: Slow response times
# Solutions:
1. Check network latency to providers
2. Use faster models (e.g., GPT-4o-mini vs GPT-4)
3. Reduce max_tokens in configuration
4. Use local Ollama for faster responses

# Issue: High API costs
# Solutions:
1. Use cheaper models in configuration
2. Reduce generation count
3. Implement local Ollama for development
4. Monitor usage with provider dashboards
```

#### Provider-Specific Setup Issues
```bash
# OpenAI Setup
1. Create account at platform.openai.com
2. Add payment method (required for API access)
3. Generate API key in API Keys section
4. Test: curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models

# Anthropic Setup  
1. Join waitlist at console.anthropic.com (if required)
2. Create API key in account settings
3. Test: curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/models

# Google Setup
1. Visit aistudio.google.com
2. Create or select project
3. Enable Generative AI API
4. Create API key in credentials
5. Test: curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY"

# Ollama Setup
1. Install from ollama.ai
2. Start service: ollama serve
3. Pull model: ollama pull gemma3:4b
4. Test: curl http://localhost:11434/api/tags

# Grok Setup
1. Visit platform.grok.com
2. Create account and get API key
3. Test: curl -H "Authorization: Bearer YOUR_KEY" https://api.grok.com/v1/models
```

### Performance Optimization

#### Speed Improvements
- **Model Selection**: Use faster models (Flash vs Pro, GPT-4o-mini vs GPT-4)
- **Token Limits**: Reduce max_tokens for shorter responses (256 for summaries, 1024 for code)
- **Parallel Processing**: Enable `use_parallel: true` in config for concurrent generation
- **Local Ollama**: Use for development to avoid API latency
- **Prompt Caching**: Cache frequently used prompts to avoid regeneration
- **Provider Fallbacks**: Configure multiple providers for automatic failover
- **Phase Optimization**: Use selective phases (e.g., only coagulatio for final refinement)

#### Cost Optimization  
- **Development vs Production**: Use cheaper models for development (GPT-4o-mini, Gemini Flash)
- **Prompt Caching**: Implement caching to avoid duplicate API calls
- **Token Monitoring**: Track usage with `--verbose` flag and provider dashboards
- **Free Tiers**: Utilize Google Gemini free tier for development
- **Batch Operations**: Use batch_generate MCP tool for multiple requests
- **Provider Selection**: Compare costs across providers (OpenRouter often cheaper)
- **Smart Routing**: Use OpenRouter's auto-routing for cost optimization

#### Memory Optimization
- **Concurrent Limits**: Set appropriate worker counts in batch operations
- **Database Maintenance**: Regularly clean old entries with cleanup commands
- **SQLite Optimization**: Monitor database size and implement rotation
- **Streaming Responses**: Use streaming when available for large outputs
- **Connection Pooling**: Reuse HTTP connections for multiple requests
- **Embedding Optimization**: Use standardized dimensions (1536) for efficient storage

#### Latency Optimization
- **Geographic Proximity**: Choose providers with servers closest to your region
- **Connection Reuse**: Implement HTTP keep-alive for multiple requests
- **Timeout Configuration**: Set appropriate timeouts (30s for most, 60s for complex tasks)
- **Network Optimization**: Use CDN or edge computing for global deployments
- **Load Balancing**: Distribute requests across multiple provider instances

### Getting Help

#### Before Reporting Issues
1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Enable debug logging and collect logs
4. Test with minimal configuration
5. Verify all prerequisites are met

#### When Reporting Issues
Include the following information:
- Operating system and version
- Go version (`go version`)
- Prompt Alchemy version (`prompt-alchemy version`)
- Configuration file (with API keys redacted)
- Complete error message and stack trace
- Steps to reproduce the issue
- Debug logs (with sensitive data removed)

#### Community Resources
- **GitHub Issues**: [Report bugs and request features](https://github.com/jonwraymond/prompt-alchemy/issues)
- **Discussions**: [Ask questions and share tips](https://github.com/jonwraymond/prompt-alchemy/discussions)
- **Documentation**: [Complete documentation](https://jonwraymond.github.io/prompt-alchemy/)

## The Three-Phase Process

Prompt Alchemy uses a structured three-phase approach to systematically improve prompts:

1. **Prima Materia (Ideation Phase)** - Extract and explore core concepts
   - *What it does*: Brainstorming and initial idea extraction
   - *Purpose*: Captures the core concept and explores possibilities

2. **Solutio (Refinement Phase)** - Convert ideas into natural language
   - *What it does*: Converting ideas into conversational, human-readable language
   - *Purpose*: Makes prompts natural and accessible

3. **Coagulatio (Finalization Phase)** - Polish to final, actionable form
   - *What it does*: Refining for technical accuracy, precision, and clarity
   - *Purpose*: Creates the final, polished prompt ready for use

Each phase can use different AI providers, allowing you to optimize for different strengths (e.g., creativity vs. precision).

## Testing

Prompt Alchemy includes a comprehensive testing suite to ensure reliability and quality across all components.

### Test Types

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test provider integrations and database operations  
- **End-to-End Tests**: Test complete workflows from CLI to storage
- **Learning Tests**: Test the learning-to-rank system and feedback loops
- **Mock Tests**: Test with simulated provider responses for consistent results

### Running Tests

#### Basic Test Commands
```bash
# Run all tests (unit + integration)
make test

# Run unit tests only
make test-unit

# Run integration tests
make test-integration

# Run CI tests (optimized for automated environments)
make test-ci
```

#### Advanced Test Commands
```bash
# Run end-to-end tests
make test-e2e

# Run learning-to-rank tests
make test-ltr

# Run smoke tests (quick validation)
make test-smoke

# Run comprehensive tests (all features)
make test-comprehensive

# Generate coverage report
make coverage
```

#### Test Management
```bash
# Setup test environment
make test-setup

# Clean test artifacts
make test-clean

# View test results
make test-report
```

### Test Structure

The test suite is organized across several directories:

- **Unit Tests**: Located alongside source files (`*_test.go`)
  - `internal/engine/engine_test.go` - Core generation engine tests
  - `internal/ranking/ranker_test.go` - Prompt ranking algorithm tests
  - `internal/judge/evaluator_test.go` - Quality evaluation tests
  - `internal/learning/learner_test.go` - Learning system tests
  - `pkg/providers/*_test.go` - Provider implementation tests
  - `pkg/models/prompt_test.go` - Data model tests

- **Integration Tests**: `scripts/integration-test.sh`
  - Provider connectivity and API integration
  - Database operations and migrations
  - Configuration loading and validation

- **End-to-End Tests**: `scripts/run-e2e-tests.sh`
  - Complete CLI workflows
  - Multi-phase prompt generation
  - Storage and retrieval operations
  - MCP server functionality

- **Learning Tests**: `scripts/test-learning-to-rank.sh`
  - Feedback processing and pattern detection
  - Ranking weight updates and optimization
  - Nightly training job validation

### Test Configuration

Tests support multiple execution modes:

```bash
# Mock mode (default) - uses simulated responses
make test-e2e

# Live mode - uses real provider APIs (requires API keys)
MOCK_MODE=false make test-e2e

# Specific test levels
make test-smoke      # Basic functionality only
make test-comprehensive  # All features including performance
```

### Coverage

- **Target**: 80%+ code coverage across all components
- **Current Coverage**: Run `make coverage` to generate detailed reports
- **Coverage Reports**: Generated as `coverage.html` for detailed analysis

### CI/CD Pipeline

Automated testing runs on every push and pull request through GitHub Actions:

#### Workflows

- **`test.yml`**: Core testing pipeline
  - Runs on Go 1.23+ across Linux, macOS, and Windows
  - Executes unit, integration, and smoke tests
  - Generates coverage reports
  - Validates code formatting and linting

- **`e2e-tests.yml`**: End-to-end testing
  - Comprehensive workflow testing
  - Provider integration validation
  - Performance benchmarking
  - Learning system verification

- **`ci.yml`**: Continuous integration checks
  - Code quality analysis
  - Security scanning
  - Dependency validation
  - Build verification

- **`release.yml`**: Release automation
  - Multi-platform builds
  - Integration test validation
  - Automated deployment
  - Version tagging

#### Quality Gates

All tests must pass before:
- Merging pull requests
- Creating releases
- Deploying documentation

### Writing Tests

#### Unit Test Example
```go
func TestPromptGeneration(t *testing.T) {
    engine := NewEngine(mockRegistry, logger)
    
    opts := models.GenerateOptions{
        Request: models.PromptRequest{
            Input: "test input",
            Phases: []models.Phase{models.PhasePrimaMaterial},
        },
    }
    
    result, err := engine.Generate(context.Background(), opts)
    assert.NoError(t, err)
    assert.NotEmpty(t, result.Prompts)
}
```

#### Integration Test Guidelines
- Use real database connections with test isolation
- Mock external API calls when possible
- Clean up test data after execution
- Test error conditions and edge cases

#### Test Utilities
- **Mocks**: Located in `internal/mocks/` for consistent test data
- **Fixtures**: Test configurations and sample prompts
- **Helpers**: Common test setup and teardown functions

### Debugging Test Failures

```bash
# Run tests with verbose output
make test-verbose

# Run specific test files
go test -v ./internal/engine/

# Run tests with race detection
go test -race ./...

# Debug with additional logging
LOG_LEVEL=debug make test
```

### Performance Testing

```bash
# Run benchmarks
make bench

# Performance profiling
go test -bench=. -benchmem -cpuprofile=cpu.prof ./...
```

## Architecture

See [ARCHITECTURE.md](docs/architecture.md) for a detailed overview of the system architecture.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.