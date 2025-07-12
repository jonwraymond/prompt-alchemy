---
layout: default
title: Home
---

# Prompt Alchemy

Prompt Alchemy transforms your raw ideas into high-quality prompts for AI systems. 

The tool uses a three-phase refinement process to create precise, effective prompts. You can use it as a command-line tool or integrate it with AI agents.

> **What you'll accomplish**: Generate better prompts, integrate with multiple AI providers, and improve results over time with machine learning.

## Key features

- **Three-phase prompt refinement**: Improves your prompts through idea extraction, natural language flow, and precision tuning
- **Multiple AI providers**: Works with OpenAI, Anthropic, Google, OpenRouter, and local Ollama models
- **Intelligent selection**: Uses AI to automatically choose the best prompt variants
- **Flexible deployment**: Run as a CLI tool for quick tasks or as a server for AI agent integration
- **Adaptive learning**: Improves recommendations over time based on your feedback
- **Local storage**: Keeps all your data in a local SQLite database for privacy and speed

## Quick start

### Generate a prompt (CLI)

```bash
# Generate a prompt with all three refinement phases
prompt-alchemy generate "A blog post about the future of AI" --persona=writing
```

### Start a server (for AI agents)

```bash
# Start the MCP server for AI agent integration
prompt-alchemy serve
```

AI agents can connect to the server using `stdin`/`stdout` and make JSON-RPC calls.

## How it works

Prompt Alchemy refines your ideas through three phases:

1. **Extract core concepts**: Identifies the key ideas from your input
2. **Create natural flow**: Transforms concepts into readable, flowing language  
3. **Add precision**: Refines the prompt for accuracy and effectiveness

Each phase can use a different AI provider for optimal results.

## Why use Prompt Alchemy?

Unlike manual prompt engineering, Prompt Alchemy provides a consistent, measurable approach:

- **Repeatable process**: Every prompt goes through the same proven refinement steps
- **Provider flexibility**: Use the best AI model for each phase of improvement  
- **Performance tracking**: Monitor success rates and identify what works best
- **Continuous improvement**: The system learns from your feedback to get better over time

## Documentation

### Getting Started
- [Getting Started](./getting-started) - Installation and first steps
- [Installation Guide](./installation) - Detailed setup instructions
- [Usage Guide](./usage) - Command reference and examples

### 🔄 Operational Modes
- **[On-Demand vs Server Mode](./on-demand-vs-server-mode)** - Comprehensive comparison of operational modes
- **[Mode Quick Reference](./mode-quick-reference)** - Quick decision guide and command reference
- **[Mode Selection FAQ](./mode-faq)** - Frequently asked questions about choosing a mode.
- **[Deployment Guide](./deployment-guide)** - Complete deployment strategies for both modes.

### Technical Documentation
- [Architecture](./architecture) - Technical design and internals
- [Database](./database) - Database schema and implementation details
- [Vector Embeddings](./vector-embeddings) - Semantic search and vector storage implementation
- [Diagrams](./diagrams) - Visual architecture and flow diagrams

### Server Mode & Integration
- [MCP Integration](./mcp-integration) - Model Context Protocol server setup
- [MCP API Reference](./mcp-api-reference) - Detailed reference for all 15 MCP tools.
- [Learning Mode](./learning-mode) - Adaptive learning configuration
- [HTTP API Reference](./http-api-reference) - RESTful API endpoints and models

### Development & Operations
- [CLI Reference](./cli-reference) - Complete command-line interface documentation
- [Automated Scheduling](./scheduling) - Set up nightly training jobs with cron/launchd
- [Multi-Arch Builds](./multi-arch-builds) - Cross-platform build system and CI/CD
- [Renovate Setup](./renovate-setup) - Automated dependency updates
- [Release Automation](./release-automation) - Semantic versioning and GitHub releases

## Support

- **Issues**: [GitHub Issues](https://github.com/jonwraymond/prompt-alchemy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jonwraymond/prompt-alchemy/discussions)
- **Contributing**: See [CONTRIBUTING.md](https://github.com/jonwraymond/prompt-alchemy/blob/main/CONTRIBUTING.md)

## License

Prompt Alchemy is open source software licensed under the MIT License.