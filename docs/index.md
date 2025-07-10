---
layout: default
title: Home
---

# Prompt Alchemy

> Advanced AI Prompt Generation and Optimization CLI Tool

Prompt Alchemy is a sophisticated command-line tool designed for AI prompt engineering. It provides a multi-phased approach to prompt generation, supports multiple LLM providers, and includes advanced features like automated evaluation and optimization.

## Key Features

- 🚀 **Multi-Phase Prompt Generation**: Idea → Human → Precision phases
- 🤖 **Multiple LLM Providers**: OpenAI, Anthropic, Google, OpenRouter, Ollama
- 💾 **Smart Storage**: SQLite-based with vector embeddings for semantic search
- 📊 **Advanced Ranking**: Automated prompt evaluation and scoring
- 🔄 **Meta-Prompt Optimization**: Iterative prompt improvement
- 🎯 **Persona-Based Generation**: Tailored prompts for different use cases
- 🔍 **Semantic Search**: Find similar prompts using embeddings
- 📈 **Analytics & Metrics**: Track usage, costs, and performance

## Quick Start

```bash
# Install from source
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy
make build

# Set up configuration
make setup

# Generate your first prompt
./prompt-alchemy generate "Write a function to calculate fibonacci numbers"
```

## Why Prompt Alchemy?

Traditional prompt engineering is often ad-hoc and inconsistent. Prompt Alchemy brings structure and science to the process:

1. **Phased Approach**: Each phase refines the prompt for specific qualities
2. **Provider Flexibility**: Use the best LLM for each phase
3. **Data-Driven**: Track what works with built-in analytics
4. **Automated Optimization**: Let AI improve your prompts

## Documentation

- [Getting Started](./getting-started) - Installation and first steps
- [Installation Guide](./installation) - Detailed setup instructions
- [Usage Guide](./usage) - Command reference and examples
- [Architecture](./architecture) - Technical design and internals
- [Multi-Arch Builds](./multi-arch-builds) - Cross-platform build system and CI/CD
- [Renovate Setup](./renovate-setup) - Automated dependency updates
- [Release Automation](./release-automation) - Semantic versioning and GitHub releases
- [Diagrams](./diagrams) - Visual architecture and flow diagrams
- [Database](./database) - Database schema and implementation details
- [Vector Embeddings](./vector-embeddings) - Semantic search and vector storage implementation
- [MCP Integration](./mcp-integration) - Model Context Protocol server setup
- [MCP Tools](./mcp-tools) - Detailed MCP tools and resources reference
- [CLI Reference](./cli-reference) - Complete command-line interface documentation
- [API Reference](./api-reference) - Provider interfaces and models

## Support

- **Issues**: [GitHub Issues](https://github.com/jonwraymond/prompt-alchemy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jonwraymond/prompt-alchemy/discussions)
- **Contributing**: See [CONTRIBUTING.md](https://github.com/jonwraymond/prompt-alchemy/blob/main/CONTRIBUTING.md)

## License

Prompt Alchemy is open source software licensed under the MIT License.