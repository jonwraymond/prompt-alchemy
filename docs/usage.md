---
layout: default
title: Usage Guide
---

# Usage Guide

This guide covers how to use Prompt Alchemy effectively for both command-line and server-based workflows.

## Quick Start

### Command Line Interface

Generate your first prompt:

```bash
prompt-alchemy generate "Create a REST API endpoint for user management"
```

Start the MCP server for AI agent integration:

```bash
prompt-alchemy serve
```

## Command Line Usage

### Basic Prompt Generation

```bash
# Simple prompt generation
prompt-alchemy generate "Your prompt idea here"

# With specific persona
prompt-alchemy generate "Write a blog post about AI" --persona=writing

# Using specific provider
prompt-alchemy generate "Debug this code" --provider=openai

# Generate multiple variants
prompt-alchemy generate "API documentation" --count=5
```

### Advanced Generation Options

```bash
# Use specific phases only
prompt-alchemy generate "Code review" --phases=prima-materia,coagulatio

# Set custom parameters
prompt-alchemy generate "Creative story" --temperature=0.8 --max-tokens=1500

# Add context and tags
prompt-alchemy generate "Database query" --context="PostgreSQL" --tags="sql,database"

# Auto-select best variant
prompt-alchemy generate "Email template" --auto-select
```

### Searching and Retrieval

```bash
# Basic text search
prompt-alchemy search "API design"

# Semantic search with embeddings
prompt-alchemy search "user authentication" --semantic

# Filter by various criteria
prompt-alchemy search "code generation" --phase=coagulatio --provider=anthropic

# Filter by date and tags
prompt-alchemy search "database" --since=2024-01-01 --tags="sql,postgres"
```

### Prompt Optimization

```bash
# Basic optimization
prompt-alchemy optimize -p "Write code" -t "Generate Python function"

# With specific persona and iterations
prompt-alchemy optimize -p "Create API docs" -t "Document REST endpoints" \
  --persona=writing --max-iterations=10

# Use different providers for generation and evaluation
prompt-alchemy optimize -p "Debug code" -t "Find Python bugs" \
  --provider=openai --judge-provider=anthropic
```

### Management Commands

```bash
# View metrics and reports
prompt-alchemy metrics

# Update prompt metadata
prompt-alchemy update <prompt-id> --tags="new-tag" --notes="Updated notes"

# Delete prompts
prompt-alchemy delete <prompt-id>

# Validate configuration
prompt-alchemy validate

# Test provider connectivity
prompt-alchemy test-providers
```

## Server Mode Usage

### MCP Server (AI Agent Integration)

Start the MCP server:

```bash
prompt-alchemy serve
```

The server runs on `stdin`/`stdout` and accepts JSON-RPC calls. AI agents can connect and use all 15 available tools.

### HTTP REST API Server

Start the HTTP server:

```bash
prompt-alchemy http-server
```

Default configuration:
- **Port**: 8080
- **Host**: localhost
- **Base Path**: `/api/v1`

### API Examples

Generate prompts via HTTP:

```bash
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a Python function for data validation",
    "persona": "code",
    "count": 3
  }'
```

Search prompts:

```bash
curl -X GET "http://localhost:8080/api/v1/prompts/search?q=API+design&semantic=true"
```

Get prompt details:

```bash
curl -X GET http://localhost:8080/api/v1/prompts/{prompt-id}
```

## MCP Integration

Prompt Alchemy provides 15 MCP tools for AI agent integration:

### Generation Tools
- `generate_prompts` - Create new prompts through the alchemical process
- `generate_prompt_variants` - Generate multiple variants of a prompt
- `optimize_prompt` - Optimize existing prompts using meta-prompting

### Search & Retrieval Tools
- `search_prompts` - Text-based prompt search
- `semantic_search_prompts` - Semantic search using embeddings
- `get_prompt_details` - Retrieve detailed prompt information
- `list_prompts` - List prompts with filtering options

### Analysis Tools
- `analyze_prompt_performance` - Analyze prompt effectiveness
- `get_prompt_metrics` - Retrieve performance metrics
- `compare_prompts` - Compare multiple prompts

### Management Tools
- `update_prompt` - Update prompt metadata
- `delete_prompt` - Remove prompts from database
- `export_prompts` - Export prompts in various formats

### System Tools
- `get_system_info` - Retrieve system configuration
- `validate_configuration` - Validate current setup
- `get_provider_status` - Check AI provider connectivity

## Learning Mode

Enable adaptive learning to improve recommendations:

```bash
# Run nightly training manually
prompt-alchemy nightly

# Schedule automated training
prompt-alchemy schedule --time "0 2 * * *"  # Daily at 2 AM

# Check learning status
prompt-alchemy metrics --learning
```

## Batch Processing

Process multiple inputs efficiently:

```bash
# From file
prompt-alchemy batch --input-file=prompts.txt --output-file=results.json

# From stdin
echo "prompt1\nprompt2\nprompt3" | prompt-alchemy batch

# With custom settings
prompt-alchemy batch --input-file=ideas.txt --persona=writing --count=3
```

## Configuration Management

View and modify configuration:

```bash
# Show current config
prompt-alchemy config show

# Set configuration values
prompt-alchemy config set providers.openai.model "o4-mini"

# Validate configuration
prompt-alchemy config validate

# Export configuration
prompt-alchemy config export > config-backup.yaml
```

## Best Practices

### Prompt Generation
1. **Be specific**: Provide clear, detailed input for better results
2. **Use personas**: Match persona to your use case (code, writing, analysis)
3. **Leverage phases**: Use specific phases when you need particular improvements
4. **Add context**: Include relevant background information
5. **Use tags**: Tag prompts for better organization and searchability

### Search and Retrieval
1. **Use semantic search**: For finding conceptually similar prompts
2. **Combine filters**: Use multiple filters for precise results
3. **Regular cleanup**: Delete outdated or ineffective prompts
4. **Export important prompts**: Backup valuable prompts regularly

### Server Deployment
1. **Use Docker**: For consistent deployment across environments
2. **Monitor health**: Regular health checks for production servers
3. **Secure API keys**: Use environment variables for sensitive data
4. **Backup database**: Regular backups of your prompt database

## Troubleshooting

### Common Issues

**Configuration errors**:
```bash
prompt-alchemy validate
prompt-alchemy test-providers
```

**Database issues**:
```bash
prompt-alchemy migrate
```

**Server connectivity**:
```bash
prompt-alchemy health --url=http://localhost:8080
```

### Logs and Debugging

Enable debug logging:
```bash
prompt-alchemy --log-level=debug generate "test prompt"
```

View logs:
```bash
# Local logs
tail -f ~/.prompt-alchemy/logs/prompt-alchemy.log

# Docker logs
docker-compose logs -f prompt-alchemy
```

## Next Steps

- Read the [CLI Reference]({{ site.baseurl }}/cli-reference) for complete command documentation
- Explore [MCP Integration]({{ site.baseurl }}/mcp-integration) for AI agent setup
- Review the [Architecture]({{ site.baseurl }}/architecture) to understand the system design
- Check [Deployment Guide]({{ site.baseurl }}/deployment-guide) for production setup