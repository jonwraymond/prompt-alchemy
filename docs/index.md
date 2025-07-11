---
layout: default
title: Home
---

# Prompt Alchemy

<div style="text-align: center; margin: 30px 0;">
  <img src="/assets/prompt_alchemy2.png" alt="Prompt Alchemy Logo" style="max-width: 400px; border-radius: 15px; box-shadow: 0 8px 20px rgba(218, 165, 32, 0.4);">
</div>

> Transform raw ideas into golden prompts through the ancient art of linguistic alchemy

<div class="alchemical-process">
Prompt Alchemy is a sophisticated AI system that transmutes concepts through three sacred phases of refinement. Like the ancient alchemists who sought to transform base metals into gold, we transform raw ideas into potent, precisely-crafted prompts ready for any AI system.
</div>

## Features
- ⚗️ **Alchemical Phases**: Prima Materia (raw essence extraction), Solutio (natural language flow), Coagulatio (precision crystallization)
- 🤖 **Multi-Provider**: OpenAI (GPT), Anthropic (Claude), Google (Gemini), OpenRouter, Ollama with fallback
- 🏆 **AI Selection**: LLM-as-Judge in internal/selection/ with criteria/weights
- 🔄 **Modes**: On-Demand (CLI), Server (HTTP/MCP with serve command)
- 📈 **Learning-to-Rank**: Feedback via judge/evaluator, ranking in ranker.go, nightly training
- 💾 **Storage**: SQLite with prompts, metrics, embeddings for semantic search

## Quick Start
# On-Demand
prompt-alchemy generate "Blog post idea" --phases=prima-materia,solutio,coagulatio --persona=writing --count=3 --auto-select --provider=openai
# Server
prompt-alchemy serve
curl -X POST http://localhost:8080/api/v1/prompts/generate -d '{"input":"Code optimization","phases":"coagulatio"}'

## The Alchemical Process
Transform ideas through:
1. **Prima Materia**: Extract essence
2. **Solutio**: Create natural flow
3. **Coagulatio**: Achieve precision

## The Alchemical Advantage

Traditional prompt engineering is like working with raw metals - unpredictable and inconsistent. Prompt Alchemy brings the ancient wisdom of transformation to modern AI:

1. **Sacred Phases**: Each alchemical phase refines specific qualities - from raw potential to crystallized perfection
2. **Multi-Provider Mastery**: Harness different AI providers' unique strengths for each transformation phase
3. **Empirical Wisdom**: Track successful transmutations with comprehensive analytics and metrics
4. **Self-Improving System**: Let the system learn and optimize its own alchemical processes

## Documentation

### Getting Started
- [Getting Started](./getting-started) - Installation and first steps
- [Installation Guide](./installation) - Detailed setup instructions
- [Usage Guide](./usage) - Command reference and examples

### 🔄 Operational Modes
- **[On-Demand vs Server Mode](./on-demand-vs-server-mode)** - Comprehensive comparison of operational modes
- **[Mode Quick Reference](./mode-quick-reference)** - Quick decision guide and command reference
- **[Mode Selection FAQ](./mode-faq)** - Frequently asked questions about choosing modes
- **[Deployment Guide](./deployment-guide)** - Complete deployment strategies for both modes

### Technical Documentation
- [Architecture](./architecture) - Technical design and internals
- [Database](./database) - Database schema and implementation details
- [Vector Embeddings](./vector-embeddings) - Semantic search and vector storage implementation
- [Diagrams](./diagrams) - Visual architecture and flow diagrams

### Server Mode & Integration
- [MCP Integration](./mcp-integration) - Model Context Protocol server setup
- [MCP Tools](./mcp-tools) - Detailed MCP tools and resources reference
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