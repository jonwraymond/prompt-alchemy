# Semantic Search Hooks API Interface

Comprehensive API documentation for the semantic search hook system, ensuring clear, maintainable integration and extensibility.

## Table of Contents

1. [Hook Configuration](#hook-configuration)
2. [Core APIs](#core-apis)
3. [Tool Integration](#tool-integration)
4. [Token Management](#token-management)
5. [Failsafe System](#failsafe-system)
6. [Monitoring & Logging](#monitoring--logging)
7. [Extension Points](#extension-points)

## Hook Configuration

### Claude Code Hook Setup

Configure hooks in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "command": "./scripts/semantic-search-hooks/query-router.sh",
        "description": "Route queries through semantic search hierarchy",
        "timeout": 30
      }
    ],
    "PreToolUse": [
      {
        "command": "./scripts/semantic-search-hooks/context-preparer.sh", 
        "description": "Prepare context using semantic tools",
        "timeout": 45
      }
    ],
    "PostToolUse": [
      {
        "command": "./scripts/semantic-search-hooks/result-processor.sh",
        "description": "Process and cache results",
        "timeout": 15
      }
    ]
  }
}
```

### Hook Input/Output Protocol

All hooks receive JSON input via stdin and can output text/JSON to stdout.

#### UserPromptSubmit Hook

**Input:**
```json
{
  "prompt": "user's input text",
  "timestamp": 1234567890,
  "session_id": "session-uuid"
}
```

**Output:**
```text
Optional context hint for Claude (plain text)
```

#### PreToolUse Hook

**Input:**
```json
{
  "tool": "tool_name",
  "arguments": {
    "arg1": "value1",
    "arg2": "value2"
  },
  "timestamp": 1234567890
}
```

**Output:**
```text
Optional context information (plain text)
```

#### PostToolUse Hook

**Input:**
```json
{
  "tool": "tool_name",
  "arguments": {...},
  "result": "tool execution result",
  "success": true,
  "timestamp": 1234567890
}
```

**Output:**
```text
Optional processed result or caching information
```

## Core APIs

### Tool Detection API

```bash
# Check available tools
check_tool_availability()
# Returns: "serena,ast-grep,code2prompt,grep"

# Check specific tool
is_tool_available "serena"
# Returns: 0 (available) or 1 (unavailable)

# Get tool capabilities
get_tool_capabilities "serena"
# Returns: JSON with tool metadata
```

**Example Capabilities Response:**
```json
{
  "name": "serena",
  "type": "semantic",
  "strengths": ["LSP-based symbol understanding", "Cross-file reference tracking"],
  "best_for": ["symbol_search", "reference_finding"],
  "languages": ["go", "typescript", "javascript"],
  "performance": "high",
  "status": "available",
  "version": "1.0.0"
}
```

### Semantic Tool Integration API

```bash
# File context analysis
get_file_semantic_context "file_path" "tool_name" "token_budget"

# Search scope analysis  
analyze_search_scope "pattern" "tool_name" "token_budget"

# Project overview
get_project_semantic_overview "tool_name" "token_budget"
```

**Standard Response Format:**
```json
{
  "tool": "tool_name",
  "status": "success|error|degraded",
  "data": {...},
  "estimated_tokens": 1500,
  "timestamp": 1234567890,
  "error": "error_message_if_applicable"
}
```

### Failsafe Execution API

```bash
# Execute with automatic failover
with_failsafe "function_name" "arg1" "arg2" "..."

# Check circuit breaker status
check_circuit_breaker "tool_name"

# Manual recovery attempt
attempt_tool_recovery "tool_name"
```

## Tool Integration

### Serena Integration

**Available Functions:**
- `get_serena_file_context(file_path, budget)`
- `analyze_serena_search_scope(pattern, budget)`
- `get_serena_project_overview(budget)`

**MCP Command Mapping:**
```bash
# Symbol search
claude-mcp serena find_symbol --name_path "function_name"

# References
claude-mcp serena find_referencing_symbols --name_path "symbol" --relative_path "file"

# Overview
claude-mcp serena get_symbols_overview --relative_path "."
```

### ast-grep Integration

**Available Functions:**
- `get_astgrep_file_context(file_path, budget)`
- `analyze_astgrep_search_scope(pattern, budget)`

**Pattern Examples:**
```bash
# Go functions
ast-grep --lang go 'func $name($$$) $$$ { $$$ }' file.go

# JavaScript functions
ast-grep --lang js 'function $name($$$) { $$$ }' file.js

# Python methods
ast-grep --lang py 'def $name($$$): $$$' file.py
```

### code2prompt Integration

**Available Functions:**
- `get_code2prompt_file_context(file_path, budget)`
- `get_code2prompt_project_overview(budget)`

**Command Options:**
```bash
# File-specific context
code2prompt --include "file_path" --no-codeblock --line-number

# Project tree
code2prompt --tree-only --no-codeblock

# With filters
code2prompt --include "**/*.go" --exclude "*_test.go"
```

## Token Management

### Budget Allocation API

```bash
# Allocate budget by operation type
allocate_token_budget "total_budget" "operation_type" "complexity_score"

# Filter content to fit budget
filter_content_by_budget "content" "budget" "content_type"

# Track actual usage
track_token_usage "operation" "actual_tokens" "budget" "efficiency"
```

**Budget Allocation Response:**
```json
{
  "total_budget": 5000,
  "context_budget": 1500,
  "search_budget": 2500,
  "result_budget": 1000,
  "operation_type": "file_analysis",
  "complexity_score": 3,
  "allocation_ratios": {
    "context": 30,
    "search": 50,
    "result": 20
  }
}
```

### Content Filtering API

**Supported Content Types:**
- `file_content`: Prioritizes functions, classes, imports
- `search_results`: Reduces context per match
- `json_data`: Removes verbose fields, truncates arrays
- `text`: Simple character-based truncation

**Filtering Options:**
```bash
# File content filtering
filter_file_content "content" "budget"

# Search results filtering  
filter_search_results "content" "budget"

# JSON data compression
filter_json_data "json_string" "budget"

# Semantic context compression
compress_semantic_context "context_data" "budget"
```

## Failsafe System

### Execution Flow

1. **Primary Tool Attempt**: Execute with timeout
2. **Fallback Chain**: Try alternative tools in order
3. **Graceful Degradation**: Minimal functionality fallback
4. **Circuit Breaker**: Prevent repeated failures

### Circuit Breaker API

```bash
# Check if tool is blocked
check_circuit_breaker "tool_name"
# Returns: 0 (OK) or 1 (blocked)

# Manually trip circuit breaker
trip_circuit_breaker "tool_name"

# Get circuit breaker status
get_circuit_status "tool_name"
```

**Circuit Breaker States:**
- **Closed**: Normal operation
- **Open**: Tool blocked due to failures (5-minute timeout)
- **Half-Open**: Testing tool recovery

### Generic Fallback Functions

```bash
# Generic fallbacks for each operation type
generic_file_context_fallback "tool" "file_path"
generic_search_scope_fallback "tool" "pattern"
generic_project_overview_fallback "tool"

# Graceful degradation
graceful_file_context "file_path"
graceful_search_scope "pattern"
graceful_project_overview
```

## Monitoring & Logging

### Log Levels and Output

**Log Levels:**
- `debug`: Detailed execution information
- `info`: General operation status
- `warn`: Degraded functionality or performance issues
- `error`: Failed operations or system errors

**Log Destinations:**
- Main log: `~/.claude/semantic-search.log`
- Performance metrics: `~/.claude/semantic-search-cache/performance.jsonl`
- Tool status: `~/.claude/semantic-search-cache/tool-status.jsonl`

### Structured Logging API

```bash
# Performance logging
log_performance "operation" "duration_ms" "tool" "status" "tokens_used"

# Tool status logging
log_tool_status "tool" "status" "details"

# Semantic operation logging
log_semantic_operation "type" "tool" "params" "result" "tokens"

# Failsafe activation logging
log_failsafe_activation "primary" "fallback" "reason" "success"

# Hook execution logging
log_hook_execution "hook_type" "command" "duration" "exit_code" "output_size"
```

### Monitoring Functions

```bash
# Generate usage summary
generate_log_summary "hours"

# Analyze token efficiency
analyze_token_efficiency

# Get tool health report
perform_health_check

# Export tool inventory
export_tool_inventory
```

## Extension Points

### Adding New Tools

1. **Tool Detection**: Add to `tool-detection.sh`
```bash
check_newtool_availability() {
    # Implementation
}

get_newtool_capabilities() {
    # Return capabilities JSON
}
```

2. **Semantic Integration**: Add to `semantic-tools.sh`
```bash
get_newtool_file_context() {
    # Implementation
}
```

3. **Failsafe Support**: Add to `failsafe.sh`
```bash
generic_file_context_fallback() {
    case "$tool" in
        "newtool")
            # Fallback implementation
            ;;
    esac
}
```

### Custom Hook Types

Create new hooks by following the same pattern:

```bash
#!/bin/bash
# custom-hook.sh

set -euo pipefail

# Load libraries
source "$(dirname "$0")/lib/config.sh"
source "$(dirname "$0")/lib/logging.sh"

# Read input
input=$(cat)

# Process input
# ... implementation ...

# Output result
echo "result"
```

### Configuration Extensions

Add custom configuration in project-specific files:
- `.claude/semantic-search-config.sh`: Project overrides
- `~/.claude/semantic-search-config.sh`: User defaults

**Example Custom Configuration:**
```bash
# Custom tool priorities
TOOL_PRIORITIES["custom_tool"]=15

# Custom token budgets
TOKEN_BUDGETS["custom_operation"]=8000

# Custom fallback chain
SEMANTIC_FALLBACK_CHAIN=("custom_tool" "serena" "ast-grep")
```

## Error Handling

### Standard Error Codes

- `0`: Success
- `1`: General error
- `2`: Tool unavailable
- `3`: Timeout
- `4`: Budget exceeded
- `5`: Configuration error

### Error Response Format

```json
{
  "error": true,
  "error_code": 2,
  "error_message": "Tool unavailable",
  "tool": "tool_name",
  "fallback_attempted": true,
  "timestamp": 1234567890
}
```

### Error Recovery Strategies

1. **Tool Failures**: Automatic fallback to alternative tools
2. **Timeout Errors**: Reduce scope and retry
3. **Budget Exceeded**: Apply content filtering
4. **Configuration Errors**: Use safe defaults

## Performance Considerations

### Optimization Guidelines

1. **Parallel Execution**: Use background processes for independent operations
2. **Caching**: Store successful results for reuse
3. **Token Budgeting**: Allocate tokens based on operation complexity
4. **Circuit Breaking**: Prevent cascade failures
5. **Graceful Degradation**: Always provide minimal functionality

### Resource Limits

- **Hook Timeout**: 60 seconds default
- **Tool Timeout**: 30 seconds default
- **Cache TTL**: 1 hour default
- **Max Cache Size**: 100 items per type
- **Token Warning**: 8000 tokens

### Performance Monitoring

Track key metrics:
- Hook execution time
- Tool response time
- Token usage efficiency
- Cache hit rates
- Failover frequency

## Security Considerations

### Input Validation

- Sanitize file paths to prevent directory traversal
- Validate tool commands before execution
- Limit resource usage (time, memory)
- Use timeouts for all external tool calls

### Safe Defaults

- Conservative token budgets
- Restricted file access patterns
- Fallback to read-only operations
- Circuit breakers for unstable tools

### Audit Trail

All operations are logged with:
- Timestamp
- User context
- Tools used
- Results produced
- Performance metrics