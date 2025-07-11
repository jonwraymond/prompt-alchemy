---
layout: default
title: Testing Guide
---

# Comprehensive Testing Guide

This document describes the complete testing infrastructure for Prompt Alchemy, covering the test architecture, mock implementations, and execution workflows for ensuring code quality and reliability.

## 1. Testing Architecture

The testing system is structured into multiple levels to validate functionality, from quick checks to comprehensive end-to-end scenarios.

### Test Levels

| Level | Duration | Coverage | Use Case |
|---|---|---|---|
| `smoke` | ~2 min | Core commands | Quick validation, PR checks |
| `full` | ~10 min | All features | CI/CD pipeline |
| `comprehensive` | ~20 min | Performance & stress | Nightly builds |

### E2E Test Categories

- **Core CLI Commands**: Validates all 13 CLI commands (`generate`, `search`, etc.).
- **MCP Server**: Tests server startup, protocol compliance, and all 15 MCP tools.
- **Integration Flows**: Covers the full prompt lifecycle (generate → search → optimize → update).
- **Error Handling**: Verifies resilience against invalid inputs, config errors, and network issues.
- **Performance**: Measures concurrency, memory usage, and database performance.

---

## 2. Mock Infrastructure

To ensure fast, deterministic, and isolated tests, the project uses a comprehensive mock infrastructure for all external dependencies.

### Mock HTTP Client

A mock HTTP client is used to simulate API calls to LLM providers.

- **Request Recording**: Captures all outgoing requests for inspection.
- **Custom Responses**: Allows setting specific JSON responses for given URLs.
- **Error Simulation**: Can simulate network errors and timeouts.
- **Response Builders**: Provides helpers to construct valid JSON responses for providers like OpenAI and Anthropic.

### Mock Storage

An in-memory storage mock replaces the SQLite database for tests.

- **Full Interface Implementation**: Mocks all `Storage` methods (`SavePrompt`, `SearchPrompts`, etc.).
- **Embedding Simulation**: Simulates storing and retrieving vector embeddings.
- **Error Injection**: Allows forcing errors on specific calls (e.g., `SetFailOnNextCall`) to test resilience.

### Mock Providers

Each LLM provider has a corresponding mock implementation.

- **Custom Responses**: Set specific `GenerateResponse` or `Embedding` results for given inputs.
- **Failure Simulation**: Configure a failure rate (e.g., `SetFailureRate(0.3)`) to test retry logic.
- **Latency Simulation**: Add artificial delays (`SetResponseDelay`) to test timeouts.
- **Call Inspection**: Track call history, count, and success rates for verification.

### Standard Mock Registry

A pre-configured registry of all mock providers is available for easy test setup.

| Provider | Mock Available | Embeddings | Default Model |
|---|---|---|---|
| openai | ✅ | ✅ | o4-mini |
| anthropic | ✅ | ✅ | claude-3-5-sonnet |
| google | ✅ | ❌ | gemini-2.5-flash |
| openrouter | ✅ | ✅ | openrouter/auto |
| ollama | ✅ (disabled by default) | ✅ | llama2 |

---

## 3. Running Tests

### Makefile Commands

The `Makefile` provides the simplest interface for running tests.

- **Quick Smoke Test**:
  ```bash
  make test-smoke
  ```
- **Full Integration Test**:
  ```bash
  make test-integration
  ```
- **Comprehensive E2E Test**:
  ```bash
  make test-e2e
  ```
- **Learning-to-Rank Test Pipeline**:
  ```bash
  make test-ltr
  ```

### Manual Script Execution

The core test script allows for more granular control.

- **Basic Usage**:
  ```bash
  scripts/run-e2e-tests.sh
  ```
- **Run Comprehensive Tests with Verbose Output**:
  ```bash
  scripts/run-e2e-tests.sh --test-level comprehensive --verbose
  ```
- **Run Against Real Providers** (requires API keys):
  ```bash
  export OPENAI_API_KEY="your-key"
  scripts/run-e2e-tests.sh --mock-mode false
  ```

### Go Test Commands

For running specific tests or debugging.

- **Run all tests with mocks**:
  ```bash
  go test ./...
  ```
- **Run only fast tests** (skips tests with external dependencies):
  ```bash
  go test -short ./...
  ```
- **Run tests in a specific package with coverage**:
  ```bash
  go test -cover ./internal/mocks/
  ```

---

## 4. Best Practices

- **Test Isolation**: Use `t.Cleanup` to reset mocks and ensure tests do not interfere with each other.
- **Determinism**: Set specific, predictable responses in mocks to avoid flaky tests.
- **Error Scenarios**: Explicitly test for error conditions, timeouts, and provider failures.
- **Shared Fixtures**: Use shared test fixtures for creating common objects like prompts and embeddings to reduce code duplication. 