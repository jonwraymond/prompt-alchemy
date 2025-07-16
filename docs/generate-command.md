# Generate Command: Complete Guide

The `generate` command is Prompt Alchemy's unified prompt generation engine, combining alchemical transformation, optimization, and historical context retrieval into a single powerful workflow.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Alchemical Phases](#alchemical-phases)  
4. [Command Options](#command-options)
5. [Advanced Features](#advanced-features)
6. [Configuration](#configuration)
7. [Examples](#examples)
8. [Performance & Scaling](#performance--scaling)
9. [Security & Best Practices](#security--best-practices)
10. [Integration Guide](#integration-guide)
11. [FAQ](#faq)
12. [Reference](#reference)
13. [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Generation
```bash
# Simple prompt generation
prompt-alchemy generate "Create a function to sort an array"

# Generate with optimization
prompt-alchemy generate "Write API documentation" --optimize

# Use historical context
prompt-alchemy generate "Debug memory leaks" --use-history --optimize
```

## Architecture Overview

### Generation Pipeline Flow

```
Input → History Enhancement → Multi-Cycle Generation → Meta-Judge → Best Prompt
  ↓           ↓                      ↓                    ↓           ↓
User Text   RAG Search         Alchemical Phases    AI Selection  Output
            ↓                      ↓                    ↓
         Similar Prompts    Prima→Solutio→Coagulatio  Ranking
            ↓                      ↓                    ↓  
         Patterns          Optimization (optional)  Quality Score
```

### Component Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Input Parser   │───▶│ History         │───▶│ Generation      │
│  - User text    │    │ Enhancer        │    │ Engine          │
│  - Flags        │    │ - RAG search    │    │ - Phase exec    │
│  - Config       │    │ - Patterns      │    │ - Parallel      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Output         │◀───│ Meta-Judge      │◀───│ Optimizer       │
│  - Best prompt  │    │ - AI selection  │    │ - LLM judge     │
│  - Ranking      │    │ - Confidence    │    │ - Iterations    │
│  - Metadata     │    │ - Reasoning     │    │ - Scoring       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Input Processing**: Parse user input and configuration
2. **Context Enhancement**: Retrieve and analyze historical prompts (optional)
3. **Multi-Cycle Generation**: Execute N complete generation cycles
4. **Phase Transformation**: Apply alchemical phases to each cycle
5. **Optimization**: Iteratively improve prompts (optional)
6. **Meta-Judge Selection**: AI-driven selection of best candidate
7. **Output Generation**: Format and return results with metadata

## Alchemical Phases

The generate command uses a three-phase alchemical transformation process:

### 1. Prima Materia (Brainstorming)
- **Purpose**: Extract pure essence from raw ideas
- **Approach**: Open-ended exploration and creative expansion
- **Output**: Multiple creative interpretations of the input

### 2. Solutio (Natural Flow)  
- **Purpose**: Dissolve rigid structures into flowing language
- **Approach**: Analytical refinement and natural language processing
- **Output**: Well-structured, coherent prompts

### 3. Coagulatio (Precision)
- **Purpose**: Crystallize essence into potent, refined form  
- **Approach**: Focused optimization and actionable output
- **Output**: Precise, actionable final prompts

## Command Options

### Generation Control
| Flag | Default | Description |
|------|---------|-------------|
| `--phases, -p` | `"prima-materia,solutio,coagulatio"` | Comma-separated transformation phases |
| `--count, -c` | `3` | Number of complete generation cycles |
| `--provider` | From config | Override provider for all phases |
| `--persona` | `"code"` | AI persona (code, writing, analysis, etc.) |
| `--target-model` | From config | Target model family for optimization |

### Quality & Optimization  
| Flag | Default | Description |
|------|---------|-------------|
| `--optimize` | `false` | Enable iterative prompt optimization |
| `--optimize-iterations` | `3` | Maximum optimization iterations per cycle |
| `--target-score` | `0.8` | Target quality score (0.0-1.0) |
| `--use-history` | `false` | Enable RAG-based historical enhancement |
| `--similarity-threshold` | `0.7` | Similarity threshold for history retrieval |

### Model Parameters
| Flag | Default | Description |
|------|---------|-------------|
| `--temperature, -t` | `0.7` | Generation temperature (0.0-2.0) |
| `--max-tokens, -m` | `2000` | Maximum tokens per generation |
| `--embedding-dimensions` | From config | Custom embedding dimensions |

### Output & Storage
| Flag | Default | Description |
|------|---------|-------------|
| `--output, -o` | `"text"` | Output format (text, json, yaml) |
| `--save` | `true` | Save generated prompts to database |
| `--tags` | `""` | Comma-separated tags for organization |
| `--context` | `[]` | Context files to include |

### Client Mode
| Flag | Default | Description |
|------|---------|-------------|
| `--server` | From config | Server URL for client mode |

## Advanced Features

### Unified Generation Workflow
The generate command runs multiple cycles and returns **ONE** best prompt:

1. **Cycle Execution**: Run N cycles (--count)
2. **History Enhancement**: Augment input with similar historical prompts (--use-history)
3. **Phase Processing**: Execute all specified alchemical phases
4. **Optimization**: Iteratively improve prompts (--optimize)
5. **AI Meta-Judge**: Select single best prompt from all candidates
6. **Quality Ranking**: Score and rank final selection

### RAG-Based History Enhancement
When `--use-history` is enabled:
- Searches for semantically similar historical prompts
- Extracts successful patterns and approaches
- Enhances input with contextual insights
- Suggests proven effective structures

### Iterative Optimization
When `--optimize` is enabled:
- Evaluates each generated prompt using LLM-as-a-Judge
- Optimizes prompts below target score threshold
- Uses meta-prompting for iterative improvement
- Tracks optimization improvements and reasoning

### AI Meta-Judge Selection
The Meta-Judge analyzes all candidates across cycles and selects the best prompt based on:
- Quality scores from optimization
- Semantic relevance to user intent
- Historical performance patterns
- Structural effectiveness

## Configuration

### Configuration File (config.yaml)
```yaml
generation:
  default_phases: "prima-materia,solutio,coagulatio"
  default_count: 3
  default_temperature: 0.7
  default_max_tokens: 2000
  default_persona: "code"
  default_target_model: "claude-sonnet-4-20250514"
  default_embedding_dimensions: 1536
  use_parallel: true
  optimize_default: false
  use_history_default: false
  optimize_iterations_default: 3
  target_score_default: 0.8
  history_similarity_threshold: 0.7
```

### Environment Variables
```bash
export PROMPT_ALCHEMY_DEFAULT_PROVIDER="openai"
export PROMPT_ALCHEMY_DEFAULT_PERSONA="code"
export PROMPT_ALCHEMY_USE_OPTIMIZATION="true"

# Provider configurations
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export GOOGLE_API_KEY="your-google-key"

# Advanced settings
export PROMPT_ALCHEMY_DATA_DIR="/custom/data/path"
export PROMPT_ALCHEMY_LOG_LEVEL="debug"
export PROMPT_ALCHEMY_TIMEOUT="300"
```

### Advanced Configuration

#### Custom Phase Configurations
```yaml
generation:
  phase_configs:
    prima-materia:
      provider: "openai"
      model: "gpt-4"
      temperature: 0.9
      max_tokens: 1000
    solutio:
      provider: "anthropic"
      model: "claude-3-sonnet"
      temperature: 0.7
      max_tokens: 1500
    coagulatio:
      provider: "openai" 
      model: "gpt-4-turbo"
      temperature: 0.5
      max_tokens: 800
```

#### Multi-Provider Routing
```yaml
providers:
  routing:
    enabled: true
    strategy: "fallback" # or "load_balance", "cost_optimize"
    fallback_order:
      - "openai"
      - "anthropic"
      - "google"
    cost_optimization:
      enabled: true
      max_cost_per_token: 0.00002
```

#### Embedding Configuration
```yaml
embeddings:
  provider: "openai"
  model: "text-embedding-3-large"
  dimensions: 1536
  batch_size: 100
  cache_enabled: true
  cache_ttl: 3600
```

### Migration from Optimize Command

The generate command now includes all optimize functionality. Here's how to migrate:

#### Before (Separate Commands)
```bash
# Old workflow
prompt-alchemy generate "input" --count 3
prompt-alchemy optimize --prompt-id abc123 --iterations 5
```

#### After (Unified Command)
```bash
# New unified workflow
prompt-alchemy generate "input" \
  --count 3 \
  --optimize \
  --optimize-iterations 5 \
  --target-score 0.8
```

#### Migration Mapping
| Old Optimize Flag | New Generate Flag | Notes |
|-------------------|-------------------|-------|
| `--iterations` | `--optimize-iterations` | Max optimization rounds |
| `--target-score` | `--target-score` | Same functionality |
| `--model-family` | `--target-model` | Renamed for clarity |
| `--prompt-id` | N/A | Now works on generated prompts |

## Examples

### Basic Examples
```bash
# Simple generation
prompt-alchemy generate "Write a Python function to validate email addresses"

# Multiple cycles for better results
prompt-alchemy generate "Create REST API endpoints" --count 5

# Specific persona and provider
prompt-alchemy generate "Write technical documentation" --persona writing --provider anthropic
```

### Advanced Examples
```bash
# Full optimization pipeline
prompt-alchemy generate "Debug performance issues in React app" \
  --optimize \
  --use-history \
  --optimize-iterations 5 \
  --target-score 0.9 \
  --count 3

# Custom phases for specific workflow
prompt-alchemy generate "Create test cases" \
  --phases "prima-materia,coagulatio" \
  --optimize \
  --tags "testing,automation"

# JSON output for API integration
prompt-alchemy generate "Design database schema" \
  --output json \
  --optimize \
  --target-model "claude-sonnet-4" \
  --save false
```

### Client-Server Mode
```bash
# Use remote server
prompt-alchemy generate "Build microservice" \
  --server "https://api.example.com" \
  --optimize \
  --use-history
```

## Troubleshooting

### Common Issues

**No prompts generated**: Check provider configuration and API keys
**Low quality results**: Enable optimization with `--optimize`
**Slow performance**: Reduce `--count` or disable `--use-history`
**Memory issues**: Lower `--max-tokens` or `--embedding-dimensions`

### Debug Mode
```bash
export LOG_LEVEL=debug
prompt-alchemy generate "your input" --optimize --use-history
```

### Performance Tips
- Use `--count 1` for faster results during development
- Enable `--use-history` only when you have sufficient historical data
- Start with `--target-score 0.7` and increase as needed
- Use `--optimize-iterations 2` for faster optimization

## Performance & Scaling

### Execution Time Analysis

| Configuration | Typical Time | Use Case |
|---------------|--------------|----------|
| Basic (`--count 1`) | 5-15s | Development, quick tests |
| Standard (`--count 3`) | 15-45s | General usage |
| Optimized (`--count 3 --optimize`) | 1-3 minutes | High-quality prompts |
| Full Pipeline (`--count 5 --optimize --use-history`) | 3-8 minutes | Production workflows |

### Resource Usage

- **Memory**: 100-500MB depending on model and embedding size
- **Network**: 1-10MB per cycle (varies by provider and model)
- **Storage**: 1-5KB per generated prompt (if --save enabled)
- **CPU**: Minimal (mostly I/O bound to AI providers)

### Optimization Strategies

#### For Development
```bash
# Fast iteration
prompt-alchemy generate "test input" \
  --count 1 \
  --phases "coagulatio" \
  --target-score 0.6
```

#### For Production
```bash  
# Maximum quality
prompt-alchemy generate "production prompt" \
  --count 5 \
  --optimize \
  --use-history \
  --target-score 0.9 \
  --optimize-iterations 3
```

#### For Multiple Prompts
```bash
# Generate multiple variations efficiently
prompt-alchemy generate "Create REST API" \
  --count 5 \
  --output json \
  --save true
```

### Use Cases by Domain

#### Software Development
```bash
# Code generation
prompt-alchemy generate "Create a REST API for user management" \
  --persona code \
  --optimize \
  --tags "api,backend"

# Debugging assistance  
prompt-alchemy generate "Debug React component performance" \
  --use-history \
  --target-model "claude-sonnet-4" \
  --tags "debug,react"
```

#### Technical Writing
```bash
# Documentation
prompt-alchemy generate "Write API documentation for authentication" \
  --persona writing \
  --phases "solutio,coagulatio" \
  --optimize

# User guides
prompt-alchemy generate "Create installation guide for developers" \
  --persona technical \
  --use-history \
  --tags "documentation,guide"
```

#### Business Analysis
```bash
# Requirements gathering
prompt-alchemy generate "Analyze market requirements for mobile app" \
  --persona analysis \
  --count 3 \
  --optimize \
  --tags "requirements,mobile"

# Strategic planning
prompt-alchemy generate "Develop go-to-market strategy" \
  --persona business \
  --use-history \
  --target-score 0.8
```

#### Creative Writing
```bash
# Story development
prompt-alchemy generate "Create compelling character backstory" \
  --persona creative \
  --temperature 0.9 \
  --phases "prima-materia,solutio" \
  --tags "creative,writing"
```

## Security & Best Practices

### Input Sanitization

Prompt Alchemy automatically sanitizes sensitive data in logs and outputs:

- **API Keys**: Automatically masked in logs as `***`
- **Passwords**: Detected and redacted from prompt content
- **Email Addresses**: Partially masked for privacy
- **URLs**: Sensitive parameters stripped

### Secure Configuration

#### API Key Management
```bash
# Use environment variables (recommended)
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"

# Or use config file with restricted permissions
chmod 600 ~/.prompt-alchemy/config.yaml
```

#### Network Security
```bash
# Use HTTPS endpoints only
prompt-alchemy generate "input" --server "https://secure-api.example.com"

# Configure timeout to prevent hanging
export PROMPT_ALCHEMY_TIMEOUT=30
```

### Best Practices

#### Prompt Design
1. **Be Specific**: Vague inputs produce vague outputs
2. **Use Context**: Leverage `--context` for file-based context
3. **Iterate Gradually**: Start simple, add optimization as needed
4. **Tag Consistently**: Use consistent tagging for better history retrieval

#### Development Workflow
```bash
# 1. Start with basic generation
prompt-alchemy generate "basic requirement"

# 2. Add optimization for quality
prompt-alchemy generate "basic requirement" --optimize

# 3. Enable history for production
prompt-alchemy generate "basic requirement" --optimize --use-history
```

#### Production Guidelines
- Always use `--save true` to build historical knowledge
- Set reasonable `--target-score` values (0.7-0.8 for most use cases)
- Monitor token usage and costs with multiple providers
- Use `--tags` for categorization and retrieval
- Enable logging for audit trails

### Privacy Considerations

#### Data Handling
- Generated prompts are stored locally by default
- Use `--save false` for sensitive content
- Historical data is used for RAG enhancement
- No data is shared between different users/instances

#### Client-Server Mode
- Server mode processes data remotely
- Ensure secure connections (HTTPS)
- Consider data residency requirements
- Implement proper access controls

## Integration Guide

### CI/CD Integration

#### GitHub Actions
```yaml
name: Generate Documentation Prompts
on: [push]

jobs:
  generate-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Prompt Alchemy
        run: |
          wget https://releases.example.com/prompt-alchemy
          chmod +x prompt-alchemy
      - name: Generate Prompts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          ./prompt-alchemy generate "Create API docs for ${{ github.event.repository.name }}" \
            --output json \
            --optimize \
            --tags "ci,docs" > docs/generated-prompts.json
```

#### GitLab CI
```yaml
generate-prompts:
  stage: build
  script:
    - prompt-alchemy generate "Review code quality" --optimize --output json
  artifacts:
    reports:
      junit: prompts-report.xml
```

### API Integration

#### REST API Mode
```bash
# Start server
prompt-alchemy serve --transport sse --sse-port 8090

# Use via HTTP
curl -X POST http://localhost:8090/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Create API endpoint", "optimize": true}'
```

#### MCP Protocol
```bash
# Start MCP server
prompt-alchemy serve --transport stdio

# Integrate with Claude Desktop or other MCP clients
```

### Programming Language Integration

#### Python
```python
import subprocess
import json

def generate_prompt(text, optimize=False):
    cmd = ["prompt-alchemy", "generate", text, "--output", "json"]
    if optimize:
        cmd.extend(["--optimize"])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

# Usage
prompt_data = generate_prompt("Create Python function", optimize=True)
best_prompt = prompt_data["prompts"][0]["content"]
```

#### Node.js
```javascript
const { exec } = require('child_process');

function generatePrompt(text, options = {}) {
    return new Promise((resolve, reject) => {
        let cmd = `prompt-alchemy generate "${text}" --output json`;
        
        if (options.optimize) cmd += ' --optimize';
        if (options.useHistory) cmd += ' --use-history';
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(JSON.parse(stdout));
        });
    });
}

// Usage
generatePrompt("Create React component", { optimize: true })
    .then(data => console.log(data.prompts[0].content));
```

#### Shell Scripts
```bash
#!/bin/bash

# Multiple prompt generation
generate_multiple() {
    local base_prompt="$1"
    local count="$2"
    local output_dir="$3"
    
    prompt-alchemy generate "$base_prompt" \
        --count "$count" \
        --output json \
        --optimize \
        --save true > "${output_dir}/prompts.json"
}

# Usage
generate_multiple "Create API endpoints" 5 "output/"
```

### Monitoring & Analytics

#### Metrics Collection
```bash
# Generate with timing
time prompt-alchemy generate "input" --optimize > results.txt

# Extract metrics from JSON output
prompt-alchemy generate "input" --output json | jq '.metadata.processing_time'
```

#### Cost Tracking
```bash
# Monitor token usage
prompt-alchemy generate "input" --output json | \
  jq '.prompts[].model_metadata | {tokens: .total_tokens, cost: .cost}'
```

#### Performance Monitoring
```bash
# Log performance metrics
export LOG_LEVEL=info
prompt-alchemy generate "input" --optimize 2>&1 | \
  grep -E "(processing_time|tokens|cost)" > metrics.log
```

## FAQ

### General Questions

**Q: What's the difference between count and cycles?**
A: They're the same thing. `--count 3` runs 3 complete generation cycles, each executing all specified phases.

**Q: Why use generate instead of the old optimize command?**
A: The generate command now includes all optimization functionality, providing a unified workflow that's more efficient and easier to use.

**Q: How does the AI Meta-Judge work?**
A: The Meta-Judge is an AI system that analyzes all generated prompt candidates and selects the single best one based on quality, relevance, and user intent.

**Q: When should I enable --use-history?**
A: Enable history when you have generated similar prompts before. It requires existing data in your database to be effective.

### Performance Questions

**Q: Why is generation slow with --optimize enabled?**
A: Optimization involves multiple LLM calls for evaluation and improvement. Use `--optimize-iterations 2` for faster results.

**Q: How can I reduce token usage and costs?**
A: Use lower `--count` values, disable `--use-history` for simple tasks, and set appropriate `--max-tokens` limits.

**Q: What's the recommended configuration for production?**
A: Use `--count 3 --optimize --target-score 0.8` with consistent `--tags` for optimal balance of quality and performance.

### Technical Questions

**Q: Can I use different providers for different phases?**
A: Yes, configure per-phase providers in the config file under `generation.phase_configs`.

**Q: How does semantic similarity search work?**
A: It uses vector embeddings to find historically successful prompts with similar meaning to your input.

**Q: Can I run generate in client-server mode?**
A: Yes, start a server with `prompt-alchemy serve` and use `--server` flag in generate commands.

### Error Questions

**Q: "No providers configured" error?**
A: Set at least one provider's API key in environment variables or config file. Check `prompt-alchemy test-providers`.

**Q: "Failed to get embedding" error with --use-history?**
A: Ensure your provider supports embeddings (OpenAI) or configure a separate embedding provider.

**Q: Generation hangs or times out?**
A: Check network connectivity and provider status. Set `PROMPT_ALCHEMY_TIMEOUT` environment variable.

## Reference

### Complete Flag Reference

#### Core Generation
```
--phases, -p string     Transformation phases (default: "prima-materia,solutio,coagulatio")
--count, -c int         Number of generation cycles (default: 3)
--provider string       Provider override for all phases
--persona string        AI persona: code, writing, analysis, generic, creative, business, technical (default: "code")
--target-model string   Target model family for optimization
```

#### Quality & Optimization
```
--optimize                    Enable iterative optimization (default: false)
--optimize-iterations int     Max optimization rounds per cycle (default: 3)
--target-score float         Quality score target 0.0-1.0 (default: 0.8)
--use-history                Enable RAG historical enhancement (default: false)  
--similarity-threshold float  History similarity threshold 0.0-1.0 (default: 0.7)
```

#### Model Parameters
```
--temperature, -t float      Generation temperature 0.0-2.0 (default: 0.7)
--max-tokens, -m int        Maximum tokens per generation (default: 2000)
--embedding-dimensions int   Custom embedding dimensions (default: from config)
```

#### Input/Output
```
--context strings           Context files to include
--tags string              Comma-separated tags for organization  
--output, -o string        Output format: text, json, yaml (default: "text")
--save                     Save prompts to database (default: true)
```

#### Client Mode
```
--server string            Server URL for client mode (overrides config)
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Provider configuration error |
| 4 | Network/API error |
| 5 | Storage error |

### Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI authentication | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic authentication | `sk-ant-...` |
| `GOOGLE_API_KEY` | Google AI authentication | `AI...` |
| `PROMPT_ALCHEMY_DATA_DIR` | Custom data directory | `/data/prompts` |
| `PROMPT_ALCHEMY_LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` |
| `PROMPT_ALCHEMY_TIMEOUT` | Request timeout seconds | `300` |
| `PROMPT_ALCHEMY_CONFIG` | Custom config file path | `/etc/prompt-alchemy.yaml` |

### Supported Personas

| Persona | Best For | Characteristics |
|---------|----------|----------------|
| `code` | Software development | Technical precision, structured output |
| `writing` | Documentation, content | Natural flow, readability focus |
| `analysis` | Research, evaluation | Analytical depth, evidence-based |
| `creative` | Brainstorming, ideation | Open exploration, innovative thinking |
| `business` | Strategy, planning | Goal-oriented, actionable outcomes |
| `technical` | Technical writing | Accuracy, detail, process-focused |
| `generic` | General purpose | Balanced approach for mixed tasks |

### Supported Providers

| Provider | Models | Embeddings | Notes |
|----------|--------|------------|--------|
| OpenAI | GPT-4, GPT-3.5 | ✅ | Full feature support |
| Anthropic | Claude 3.5 Sonnet, Haiku | ❌ | High quality, no embeddings |
| Google | Gemini 1.5 Pro, Flash | ❌ | Fast, cost-effective |
| OpenRouter | Multiple models | ❌ | Access to various providers |
| Grok | Grok models | ❌ | Real-time capabilities |
| Ollama | Local models | ❌ | Privacy, no API costs |

### Configuration Schema

The complete configuration file schema with all available options:

```yaml
# Core settings
data_dir: "~/.prompt-alchemy/data"
log_level: "info"

# Generation defaults
generation:
  default_phases: "prima-materia,solutio,coagulatio"
  default_count: 3
  default_temperature: 0.7
  default_max_tokens: 2000
  default_provider: "openai"
  default_persona: "code"
  default_target_model: ""
  default_embedding_dimensions: 1536
  use_parallel: true
  optimize_default: false
  use_history_default: false
  optimize_iterations_default: 3
  target_score_default: 0.8
  history_similarity_threshold: 0.7

# Provider configurations
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
    model: "gpt-4"
    base_url: ""
    timeout: 120
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"  
    model: "claude-3-5-sonnet-20241022"
    base_url: ""
    timeout: 120
  google:
    api_key: "${GOOGLE_API_KEY}"
    model: "gemini-1.5-pro"
    base_url: ""
    timeout: 120

# Client mode
client:
  mode: "local"  # or "client"
  server_url: "http://localhost:8080"

# HTTP server
http:
  host: "0.0.0.0"
  port: 8080
  enabled: false

# Learning system
learning:
  enabled: true
  update_interval: "24h"
  min_interactions: 10
```