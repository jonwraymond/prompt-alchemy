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
4. `search_prompts` - Text/semantic search

#### Data Management
5. `update_prompt` - Modify content/metadata
6. `delete_prompt` - Safe deletion
7. `get_prompt_by_id` - Detailed retrieval
8. `track_prompt_relationship` - Ancestry tracking

#### Analytics
9. `get_metrics` - Performance analytics
10. `get_database_stats` - Database health
11. `run_lifecycle_maintenance` - Cleanup

#### System Management
12. `get_providers` - Provider information
13. `test_providers` - Connectivity testing
14. `get_config` - Configuration status
15. `validate_config` - Validation with auto-fixes
16. `get_version` - Version information

#### Additional Tools
17. `batch_operations` - Bulk operations
18. `export_data` - Data export

## Test Results and Reporting

### Test Output

Tests provide detailed reporting:
```
======================================
           TEST SUMMARY
======================================
Total Tests: 156
Passed: 154
Failed: 2
Success Rate: 98%
======================================
```

### Artifacts

Generated test artifacts:
- Test results and logs
- Performance metrics
- Error reports
- Configuration snapshots

### CI Integration

Results integrated with GitHub:
- ✅ Status checks on PRs
- 📊 Test result artifacts
- 📈 Performance trends
- 🔍 Detailed failure analysis

## Debugging Test Failures

### Local Debugging

1. **Run with verbose output**:
   ```bash
   scripts/run-e2e-tests.sh --verbose
   ```

2. **Preserve test data**:
   ```bash
   scripts/run-e2e-tests.sh --no-cleanup
   ```

3. **Run specific test level**:
   ```bash
   scripts/run-e2e-tests.sh --test-level smoke
   ```

### Common Issues

#### Mock Provider Failures
- **Cause**: Mock responses not configured
- **Solution**: Check mock setup in test config

#### Database Errors
- **Cause**: Permissions or disk space
- **Solution**: Verify test directory permissions

#### Network Timeouts
- **Cause**: MCP server startup delays
- **Solution**: Increase wait times in tests

#### Binary Not Found
- **Cause**: Build failure
- **Solution**: Run `make build` manually

### Test Data Inspection

Test data preserved at:
```
/tmp/prompt-alchemy-e2e-<timestamp>/
├── config/           # Test configuration
├── results/          # Test outputs
└── test-report.txt   # Detailed report
```

## Contributing to Tests

### Adding New Tests

1. **Update test scripts**:
   - Add test functions to `scripts/run-e2e-tests.sh`
   - Follow existing naming conventions

2. **Update CI workflows**:
   - Add new test jobs if needed
   - Update artifact collection

3. **Update documentation**:
   - Document new test coverage
   - Update this guide

### Test Guidelines

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Determinism**: Tests should be repeatable
4. **Speed**: Optimize for fast execution
5. **Coverage**: Test both success and failure paths

### Mock Development

When adding new features:
1. Update mock providers in `internal/mocks/`
2. Add corresponding test scenarios
3. Verify both mock and real provider paths

## Performance Benchmarks

### Target Metrics

| Operation | Target Time | Max Memory |
|-----------|-------------|------------|
| Generate (1 prompt) | < 2s | < 50MB |
| Search (100 prompts) | < 500ms | < 100MB |
| Batch (10 prompts) | < 10s | < 200MB |
| MCP server startup | < 3s | < 30MB |

### Monitoring

Performance tracked across:
- Response times
- Memory usage
- Database operations
- Concurrent operations

## Future Enhancements

### Planned Improvements

1. **Visual Testing**: UI component testing for web interface
2. **Load Testing**: High-volume concurrent user simulation  
3. **Security Testing**: Automated security vulnerability scanning
4. **Cross-Platform**: Windows and macOS specific testing
5. **Real Provider Matrix**: Automated testing with actual APIs

### Test Infrastructure

1. **Parallel Execution**: Matrix testing across environments
2. **Test Sharding**: Distribute tests across multiple runners
3. **Smart Retries**: Automatic retry of flaky tests
4. **Historical Tracking**: Performance trend analysis

---

This comprehensive testing system ensures Prompt Alchemy maintains high quality and reliability across all features and use cases. The multi-level approach balances thorough coverage with execution speed, making it suitable for both development and production validation. 