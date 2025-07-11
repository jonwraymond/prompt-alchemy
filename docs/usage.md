---
layout: default
title: Usage Guide
---

# Usage

## CLI
promgen generate 'Story idea' --phases=prima-materia,solutio --persona=writing --auto-select

## Server
promgen serve
curl -X POST localhost:8080/api/v1/prompts/generate -d '{"input":"Code snippet"}'

## MCP Integration
Use tools like generate_prompts via MCP protocol.