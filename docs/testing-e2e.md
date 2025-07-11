---
layout: default
title: End-to-End Testing
---

# End-to-End Testing Guide

This document describes the comprehensive end-to-end (E2E) testing system for Prompt Alchemy, covering all features, workflows, and integration scenarios.

## Overview

The E2E testing system validates the complete functionality of Prompt Alchemy through multiple test levels:

- **Smoke Tests**: Quick validation of core functionality
- **Integration Tests**: Basic CLI command validation
- **Full E2E Tests**: Comprehensive feature and workflow testing
- **Comprehensive Tests**: Performance and stress testing

## Test Architecture

### Test Levels

| Level | Duration | Coverage | Use Case |
|-------|----------|----------|----------|
| `smoke` | ~2 min | Core commands only | Quick validation, PR checks |
| `full` | ~10 min | All features & workflows | CI/CD pipeline |
| `comprehensive` | ~20 min | Performance & stress tests | Nightly builds |

### Test Categories

#### 1. Core CLI Commands (13 commands)
- **Basic Commands**: `version`, `help`, global flags
- **Generation Commands**: `generate`, `batch` with all options
- **Search Commands**: text, semantic, filtered search
- **Management Commands**: `update`, `metrics`, `optimize`, `migrate`
- **System Commands**: `config`, `providers`, `validate`

#### 2. MCP Server Tests
- Server startup and health checks
- MCP protocol endpoint validation
- All 18 MCP tools functionality
- JSON-RPC API testing

#### 3. Integration Flow Tests
- **Prompt Lifecycle**: Generate → Search → Update → Metrics
- **Multi-Provider Workflow**: Test all 5 providers
- **Batch Processing**: JSON, CSV, text formats
- **Search & Optimize**: Complete discovery workflow

#### 4. Error Handling Tests
- Invalid commands and arguments
- Configuration errors
- File system permissions
- Network timeouts
- Resource limits

#### 5. Performance Tests
- Concurrent operations
- Memory usage monitoring
- Database performance
- Large input handling

## Learning-to-Rank Testing

The learning-to-rank system has dedicated end-to-end testing:

### Running LTR Tests

```bash
make test-ltr
```

This runs the complete learning-to-rank pipeline test:
- Sets up test environment with ranking config
- Builds the binary
- Tests initial ranking
- Simulates user interactions
- Creates mock feedback data
- Runs nightly training job
- Verifies weight changes
- Tests improved ranking quality
- Generates test report

The test validates the full feedback loop from user interactions to adaptive ranking improvements.

For details, see the [test script](scripts/test-learning-to-rank.sh).

## Running Tests

### Local Testing

#### Quick Smoke Test
```bash
make test-smoke
```

#### Full Integration Test
```bash
make test-integration
```

#### Comprehensive E2E Test
```bash
make test-e2e
```

#### All Tests with Performance
```bash
make test-comprehensive
```

### Manual Script Execution

#### Basic Usage
```bash
# Run full test suite
scripts/run-e2e-tests.sh

# Run with options
scripts/run-e2e-tests.sh --test-level comprehensive --verbose

# Run with real providers (requires API keys)
scripts/run-e2e-tests.sh --mock-mode false
```

#### Script Options
- `--test-level`: `smoke`, `full`, `comprehensive`
- `--mock-mode`: `true` (default), `false`
- `--verbose`: Enable detailed output
- `--no-cleanup`: Preserve test data for debugging

### CI/CD Integration

#### GitHub Actions Workflows

**Standard CI Pipeline** (`.github/workflows/ci.yml`)
- Runs on every push/PR
- Includes smoke tests and integration tests
- Uses mock providers for speed

**Comprehensive E2E Pipeline** (`.github/workflows/e2e-tests.yml`)
- Triggered manually or on schedule
- Full feature matrix testing
- Performance validation

#### Triggers
- **Push/PR**: Smoke + Integration tests
- **Nightly**: Comprehensive tests
- **Manual**: Configurable test level

## Test Configuration

### Mock Mode (Default)

Tests run with mock providers to ensure:
- No external API dependencies
- Fast execution
- Deterministic results
- No API costs

```yaml
providers:
  openai:
    api_key: "mock-openai-key"
    model: "gpt-4o-mini"
  anthropic:
    api_key: "mock-anthropic-key"
    model: "claude-3-5-sonnet-20241022"
```

### Real Provider Mode

For testing with actual APIs:
```bash
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
scripts/run-e2e-tests.sh --mock-mode false
```

## Test Coverage

### CLI Commands Tested

| Command | Basic | Advanced | Error Cases | Performance |
|---------|-------|----------|-------------|-------------|
| `generate` | ✅ | ✅ | ✅ | ✅ |
| `batch` | ✅ | ✅ | ✅ | ✅ |
| `search` | ✅ | ✅ | ✅ | ✅ |
| `metrics` | ✅ | ✅ | ✅ | ✅ |
| `optimize` | ✅ | ✅ | ✅ | ❌ |
| `providers` | ✅ | ✅ | ✅ | ❌ |
| `config` | ✅ | ✅ | ✅ | ❌ |
| `validate` | ✅ | ✅ | ✅ | ❌ |
| `update` | ✅ | ✅ | ✅ | ❌ |
| `delete` | ✅ | ✅ | ✅ | ❌ |
| `migrate` | ✅ | ✅ | ✅ | ❌ |
| `serve` | ✅ | ✅ | ✅ | ✅ |
| `version` | ✅ | ✅ | ✅ | ❌ |

### Feature Coverage

#### Providers (5 providers)
- OpenAI: Generation + Embeddings
- Anthropic: Generation only
- Google: Generation only  
- OpenRouter: Generation + Embeddings
- Ollama: Local generation + embeddings

#### Phases (3 phases)
- Idea: Creative brainstorming
- Human: Natural refinement
- Precision: Technical optimization

#### Personas (4 personas)
- Code: Programming tasks
- Writing: Content creation
- Analysis: Data analysis
- Generic: General purpose

#### Output Formats
- Text: Human-readable output
- JSON: Machine-readable data
- YAML: Configuration format

### MCP Tools Tested (18 tools)

#### Core Generation
1. `generate_prompts` - Multi-phase generation
2. `batch_generate_prompts` - Bulk processing
3. `optimize_prompt` - AI enhancement
4. `search_prompts`