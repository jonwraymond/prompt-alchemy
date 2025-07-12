---
layout: default
title: MCP Server Integration
---

# Model Context Protocol (MCP) Integration Guide

This guide covers integrating the Prompt Alchemy MCP server with AI assistants and IDEs.

## Overview

Prompt Alchemy's MCP server exposes prompt management capabilities via the Model Context Protocol. It runs as a Docker container providing 19+ tools for prompt generation, search, optimization, and more.

## Setup

The server can be run locally or deployed using Docker. See the [Deployment Guide](./deployment-guide) for detailed instructions.

## Available Tools

The MCP server exposes all 15 core tools of Prompt Alchemy. For a complete list, including request/response schemas, please see the **[MCP API Reference](./mcp-api-reference)**.

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