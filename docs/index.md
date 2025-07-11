---
layout: default
title: Home
---

# Prompt Alchemy

<div style="text-align: center; margin: 30px 0;">
  <img src="/prompt-alchemy/assets/prompt_alchemy2.png" alt="Prompt Alchemy Logo" style="max-width: 400px; border-radius: 15px; box-shadow: 0 8px 20px rgba(218, 165, 32, 0.4);">
</div>

> Transform raw ideas into golden prompts through the ancient art of linguistic alchemy

<div class="alchemical-process">
Prompt Alchemy is a sophisticated AI system that transmutes concepts through three sacred phases of refinement. Like the ancient alchemists who sought to transform base metals into gold, we transform raw ideas into potent, precisely-crafted prompts ready for any AI system.
</div>

## Features
- ⚗️ **Alchemical Phases**: `prima-materia` (raw essence), `solutio` (natural flow), and `coagulatio` (precision).
- 🤖 **Multi-Provider**: OpenAI, Anthropic, Google, OpenRouter, and local Ollama models.
- 🏆 **AI Selection**: An LLM-as-Judge system to intelligently select the best prompt variants.
- 🔄 **Modes**: A powerful CLI for on-demand use and an MCP server for AI agent integration.
- 📈 **Learning-to-Rank**: An adaptive system that learns from user feedback to improve results over time.
- 💾 **Local-First Storage**: All data is stored in a local SQLite database, including prompts, metrics, and vector embeddings.

## Quick Start

### On-Demand Generation
```bash
# Generate a prompt using the three alchemical phases
prompt-alchemy generate "A blog post about the future of AI" --phases="prima-materia,solutio,coagulatio" --persona=writing
```

### Server for AI Agents
```bash
# Start the MCP server to allow AI agents to connect
prompt-alchemy serve
```
An AI agent can then connect to the server's `stdin`/`stdout` to make JSON-RPC calls.

## The Alchemical Process

Prompt Alchemy transforms ideas through three sacred phases:
1.  **Prima Materia**: Extracts the raw essence and core concepts from an idea.
2.  **Solutio**: Dissolves rigid structures into natural, flowing, human-readable language.
3.  **Coagulatio**: Crystallizes the prompt into a precise, production-ready form.

## Why Prompt Alchemy?

Prompt Alchemy brings a structured, repeatable process to prompt engineering:

1. **Systematic Refinement**: Each alchemical phase improves a specific quality of the prompt.
2. **Provider Optimization**: Use the best AI provider for each specific phase of refinement.
3. **Data-Driven Improvement**: Track successes and failures with comprehensive local analytics.
4. **Adaptive Learning**: The system learns from your feedback to improve its own processes over time.

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
- [API Reference](./api-reference) - Provider interfaces and models

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