---
layout: default
title: MCP Server Integration
---

# Model Context Protocol (MCP) Integration Guide

This guide covers integrating the Prompt Alchemy MCP server with AI assistants and IDEs.

## Overview

Prompt Alchemy's MCP server exposes prompt management capabilities via the Model Context Protocol. It runs as a Docker container providing 19+ tools for prompt generation, search, optimization, and more.

## Setup

Follow the [Docker Deployment Guide](./docker-hybrid-deployment.md) to start the MCP server.

Once running, the server accepts JSON-RPC over stdio in the container.

## Available Tools

See [MCP Tools Reference](./mcp-tools.md) for the full list of 19 tools, including schemas and usage.

## Integrating with Hosts

### Claude Desktop

Configure Claude Desktop to run:
```bash
docker exec -i prompt-alchemy-mcp prompt-alchemy serve
```

### VS Code / Cursor / Zed

Configure your IDE's MCP settings to execute the docker exec command above.

## Testing Integration

Use the test script:
```bash
python3 test-mcp.py
```

This verifies:
- Protocol initialization
- Tool listing
- Tool calling

## Best Practices

- Use docker-compose for management
- Monitor logs for issues
- Update config via mounted docker-config.yaml

For custom integrations, use the JSON-RPC protocol directly as shown in the test script.