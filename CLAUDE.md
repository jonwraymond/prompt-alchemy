# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: MCP Tool Usage for Prompts

**ALWAYS use the prompt-alchemy MCP tools for any prompt-related tasks:**
- **generate_prompts**: Use this for creating new prompts from ideas or concepts
- **optimize_prompt**: Use this for improving existing prompts
- **search_prompts**: Check existing prompts before generating new ones
- **batch_generate**: Use for multiple prompt generation tasks

**DO NOT manually write prompts when these tools are available.** The prompt-alchemy system provides superior results through its three-phase alchemical process.

### Example Workflows

1. **User asks for a prompt to create a REST API:**
   ```
   // CORRECT approach:
   await use_mcp_tool("prompt-alchemy", "generate_prompts", {
     input: "Create a REST API for user management",
     persona: "code",
     phase_selection: "best"
   });
   
   // INCORRECT approach:
   // Manually writing: "Write a REST API that handles user CRUD operations..."
   ```

2. **User wants to improve an existing prompt:**
   ```
   // CORRECT approach:
   await use_mcp_tool("prompt-alchemy", "optimize_prompt", {
     prompt: "Write Python code",
     task: "Create a web scraper",
     target_score: 9.0
   });
   ```

3. **User needs multiple related prompts:**
   ```
   // CORRECT approach:
   await use_mcp_tool("prompt-alchemy", "batch_generate", {
     inputs: [
       { input: "Unit test for authentication", persona: "code" },
       { input: "Integration test for API", persona: "code" },
       { input: "E2E test for login flow", persona: "code" }
     ]
   });
   ```

### Tool Selection Guidelines

- **ALWAYS check existing prompts first**: Use `search_prompts` before generating
- **Use generate_prompts for**: New ideas, concepts, or requirements
- **Use optimize_prompt for**: Improving clarity, specificity, or effectiveness
- **Use batch_generate for**: Multiple related tasks, variations, or test sets
- **Check providers first**: Use `list_providers` if generation fails

## Project Overview

Prompt Alchemy is a sophisticated AI prompt generation system written in Go that transforms raw ideas into optimized prompts through a three-phase alchemical process. It supports multiple LLM providers (OpenAI, Anthropic, Google, OpenRouter, Ollama) and features intelligent ranking, learning capabilities, and both CLI and server modes.

## Key Architecture Concepts

### Three-Phase Alchemical Process
The core transformation happens through three sequential phases, each potentially using different LLM providers:
1. **Prima Materia** - Extracts raw essence and structures ideas (brainstorming)
2. **Solutio** - Dissolves into natural, flowing language 
3. **Coagulatio** - Crystallizes into precise, production-ready form

### Provider System
- All providers implement the `Provider` interface in `pkg/providers/provider.go`
- Provider registry manages available providers and fallbacks
- Supports embeddings through provider fallback mechanism (e.g., Google uses OpenAI for embeddings)

### Storage and Learning
- SQLite database stores prompts, embeddings, and metrics
- Learning engine processes feedback to improve ranking weights
- Vector similarity search using embeddings stored in SQLite

## Essential Commands

### Build and Run
```bash
# Build the binary
make build

# Install dependencies and build
make deps build

# Run tests
make test              # All tests (unit + integration)
make test-unit         # Unit tests only
make test-integration  # Integration tests
make test-e2e          # End-to-end tests
make coverage          # Generate coverage report

# Run a single test
go test -v -run TestFunctionName ./path/to/package

# Build for all platforms
make build-all
```

### Development Workflow
```bash
# Format code
make fmt

# Lint code (requires golangci-lint)
make lint

# Security scan (requires gosec)
make security

# Clean build artifacts
make clean

# Run benchmarks
make bench
```

### Testing Providers
```bash
# Test specific provider integration
go test -v ./pkg/providers -run TestGoogleProvider

# Test with environment variables
PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="test-key" go test ./pkg/providers

# Run provider tests with mock mode
MOCK_MODE=true make test-e2e
```

## Configuration System

The system uses hierarchical configuration:
1. Default values in code
2. `~/.prompt-alchemy/config.yaml` file
3. Environment variables (prefix: `PROMPT_ALCHEMY_`)
4. Command-line flags

Example environment variable mapping:
- `providers.google.api_key` → `PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY`
- `generation.default_temperature` → `PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE`

## Code Organization

### Core Components
- `internal/engine/` - Main generation engine orchestrating phases
- `internal/phases/` - Phase handlers (Prima Materia, Solutio, Coagulatio)
- `internal/templates/` - Template system for phase prompts
- `internal/ranking/` - Prompt ranking and scoring system
- `internal/learning/` - Learning engine for feedback processing
- `internal/storage/` - Database abstraction and operations

### Provider Integration Points
- `pkg/providers/` - Provider implementations
- Each provider has its own file (e.g., `google.go`, `openai.go`)
- Mock provider available for testing

### Command Structure
- `cmd/` - CLI command implementations
- `cmd/prompt-alchemy/main.go` - Entry point
- Each command is a separate file (e.g., `generate.go`, `search.go`)

## Testing Patterns

### Provider Tests
Provider tests should handle both success and error cases:
```go
// Test with/without API key
// Test placeholder implementations
// Test error responses
// Accept multiple possible error messages for flexibility
```

### Integration Tests
- Located in `scripts/integration-test.sh`
- Test full workflows with mock providers
- Validate CLI output and database operations

## Common Development Tasks

### Adding a New Provider
1. Create `pkg/providers/newprovider.go` implementing the Provider interface
2. Add provider constants to `pkg/providers/provider.go`
3. Register in provider factory
4. Create tests in `pkg/providers/newprovider_test.go`
5. Update configuration examples

### Modifying Phase Logic
1. Phase handlers are in `internal/phases/`
2. Templates are in `internal/templates/templates/phases/`
3. Update both handler logic and templates
4. Test with `go test ./internal/phases`

### Database Schema Changes
1. Schema defined in `internal/storage/schema.sql`
2. Migration logic in `internal/storage/migrations.go`
3. Update models in `pkg/models/`
4. Test migrations with integration tests

## Debugging Tips

### Enable Debug Logging
```bash
# Via environment variable
export LOG_LEVEL=debug

# Via command flag
prompt-alchemy --log-level debug generate "test"
```

### Test Database Operations
```bash
# Check database location
ls -la ~/.prompt-alchemy/

# Inspect database
sqlite3 ~/.prompt-alchemy/prompts.db ".schema"
```

### Provider Connectivity
```bash
# Test provider availability
prompt-alchemy providers --test

# Test specific provider
prompt-alchemy providers --test --provider google
```

## Important Files and Patterns

### Error Handling
- Always wrap provider errors with context
- Use structured logging with logrus
- Return user-friendly error messages

### Concurrency
- Engine supports parallel phase processing
- Use sync.WaitGroup for coordination
- Mutex protection for shared state

### Template System
- Templates use Go text/template syntax
- Context passed through PhaseContext struct
- Fallback to embedded strings if template loading fails

## Release Process

1. Run pre-release checks: `make pre-release`
2. Create tag: `make tag TAG=v1.0.0`
3. Build releases: `make release`
4. Archives created in `bin/` directory

## Critical Reminders for Claude

### When User Requests Prompt Help

**MANDATORY WORKFLOW:**
1. **FIRST**: Check if similar prompts exist with `search_prompts`
2. **THEN**: Generate new prompts with `generate_prompts` if needed
3. **FINALLY**: Optimize if requested with `optimize_prompt`

### Common Scenarios

**Scenario**: "Help me write a prompt for..."
**Action**: Use `generate_prompts` with appropriate persona and phase_selection

**Scenario**: "This prompt isn't working well..."
**Action**: Use `optimize_prompt` to improve it systematically

**Scenario**: "I need prompts for testing different approaches..."
**Action**: Use `batch_generate` for variations

**Scenario**: "What prompts have worked for similar tasks?"
**Action**: Use `search_prompts` to find existing solutions

### Never Do This
- ❌ Manually write prompts when MCP tools are available
- ❌ Skip checking existing prompts with search_prompts
- ❌ Ignore the three-phase alchemical process
- ❌ Use generic prompts when optimized ones are possible

### Always Do This
- ✅ Use prompt-alchemy MCP tools for ALL prompt-related tasks
- ✅ Leverage the learning system by using existing prompts
- ✅ Apply the three-phase process for better results
- ✅ Optimize critical prompts for maximum effectiveness

**Remember: The prompt-alchemy system is specifically designed to outperform manual prompt writing through systematic, AI-powered refinement.**