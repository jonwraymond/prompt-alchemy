# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Specialized Agent System for Accelerated Development

## GOLDEN RULES, SACRED DEVELOPER PACT OF TRUST
1. **ALWAYS USE SPECIALIZED AGENTS FIRST**: Before any task, identify and activate the appropriate specialized agent from `.claude/agents/`
2. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
3. The plan should have a list of todo items that you can check off as you complete them
4. Before you begin working, check in with me and I will verify the plan.
5. Then, begin working on the todo items, marking them as complete as you go.
6. Please every step of the way just give me a high level explanation of what changes you made
7. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
8. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.
9. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
10. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

## SPECIALIZED AGENT SYSTEM - YOUR PRIMARY DEVELOPMENT ACCELERATOR

**CRITICAL**: You have access to a sophisticated system of specialized agents in `.claude/agents/` that provide domain-specific expertise and can accelerate development by 40-80%. **ALWAYS use these agents proactively** for any task that falls within their domain.

### Available Specialized Agents

#### 🔧 **Core Development Agents**
- **`go-backend-specialist`**: Go backend development expert for the three-phase alchemical engine
- **`react-frontend-specialist`**: React frontend development with alchemy-themed UI and 3D visualizations
- **`provider-integration-specialist`**: LLM provider integration expert for multi-provider system

#### 🛠️ **Operations & Quality Agents**
- **`testing-qa-specialist`**: Testing and quality assurance expert for comprehensive testing strategy
- **`docker-devops-specialist`**: Docker and DevOps expert for containerized hybrid architecture
- **`mcp-integration-specialist`**: Model Context Protocol integration expert for Claude Desktop integration

### Agent Activation Guidelines

#### **Automatic Activation Triggers**
These keywords automatically activate the appropriate specialist:
- "add new provider" → `provider-integration-specialist`
- "fix React component" → `react-frontend-specialist`
- "Docker build issue" → `docker-devops-specialist`
- "test failure" → `testing-qa-specialist`
- "engine modification" → `go-backend-specialist`
- "MCP tool" → `mcp-integration-specialist`

#### **Explicit Agent Invocation**
Always request specific expertise when working on domain-specific tasks:
```
Use the go-backend-specialist to add a new phase to the engine
Have the react-frontend-specialist create a magical loading animation
Ask the mcp-integration-specialist to add a new tool
```

### Agent Benefits & Capabilities

#### **Domain Expertise Acceleration**
- **40-60% faster** backend development through Go expertise
- **50-70% faster** frontend development through React/3D specialization
- **60-80% faster** provider integration through established patterns
- **30-50% faster** testing through automated quality workflows
- **50-70% faster** deployment through Docker optimization
- **40-60% faster** Claude integration through MCP expertise

#### **Architecture-Specific Knowledge**
Each agent understands:
- **Three-Phase System**: Prima Materia → Solutio → Coagulatio
- **Provider Architecture**: Multi-provider system with embeddings fallback
- **Hybrid Architecture**: Containerized backend + React frontend
- **MCP Integration**: Claude Desktop tool development

### Multi-Agent Workflows

For complex tasks, coordinate multiple agents:

1. **New Feature Development**:
   - `go-backend-specialist` → Implements backend logic
   - `react-frontend-specialist` → Creates UI components
   - `testing-qa-specialist` → Adds comprehensive tests
   - `docker-devops-specialist` → Updates deployment

2. **Provider Integration**:
   - `provider-integration-specialist` → Implements provider
   - `testing-qa-specialist` → Creates provider tests
   - `mcp-integration-specialist` → Exposes via MCP tools

3. **Performance Optimization**:
   - `go-backend-specialist` → Optimizes engine performance
   - `react-frontend-specialist` → Optimizes UI performance
   - `docker-devops-specialist` → Optimizes container performance

## IMPORTANT: Serena MCP Integration for Memory and Semantic Code Operations


### Primary Tool: Serena MCP Server
**CRITICAL**: Serena is your primary tool for memory management and semantic code understanding. Based on the [official Serena documentation](https://github.com/oraios/serena?tab=readme-ov-file#full-list-of-tools), Serena provides the most comprehensive semantic code understanding through Language Server Protocol integration.

```yaml
serena_capabilities:
  memory_management:
    - write_memory: Store project-specific knowledge with named memories
    - read_memory: Retrieve stored information by memory name
    - list_memories: View all available memories in project
    - delete_memory: Remove outdated memories by name
  
  semantic_code_tools:
    - find_symbol: Search for symbols by name/type with LSP understanding
    - find_referencing_code_snippets: Find code using a symbol
    - find_referencing_symbols: Find symbols that reference a given symbol
    - get_symbols_overview: View file/directory structure
    - replace_symbol_body: Edit entire symbol definitions
    - insert_before_symbol: Insert content before symbol definition
    - insert_after_symbol: Insert content after symbol definition
    
  project_management:
    - activate_project: Switch between projects
    - get_active_project: Get current project and list existing projects
    - onboarding: Analyze project structure and identify essential tasks
    - check_onboarding_performed: Check if onboarding was already done
    - summarize_changes: Track modifications made to codebase
    
  file_operations:
    - read_file: Read files within project directory
    - create_text_file: Create/overwrite files in project directory
    - replace_lines: Replace specific line ranges
    - insert_at_line: Insert content at specific line
    - delete_lines: Delete specific line ranges
    
  thinking_tools:
    - think_about_collected_information: Assess completeness of gathered info
    - think_about_task_adherence: Determine if still on track with task
    - think_about_whether_you_are_done: Determine if task is truly completed
    
  shell_operations:
    - execute_shell_command: Execute shell commands
    - restart_language_server: Restart LSP when needed
```

### Memory Management System (via Serena)
**CRITICAL**: Always use Serena's memory tools for persistent, project-specific memory. According to the [official Serena documentation](https://github.com/oraios/serena?tab=readme-ov-file#full-list-of-tools), Serena provides project-specific memory that persists across conversations:

```yaml
memory_workflow:
  - Use Serena's `write_memory` to save learnings, patterns, and project knowledge with descriptive names
  - Use `read_memory` to retrieve specific memories by their exact name
  - Use `list_memories` to see all available memories in the current project
  - Use `delete_memory` when information becomes outdated or incorrect
  - Memories are project-specific and persist across conversations
  - Use descriptive, searchable names for memories to facilitate retrieval
```

### Autonomous Tool Usage Guidelines

**ALWAYS use tools independently during self-learning processes:**

1. **Specialized Agent Activation**: ALWAYS activate the appropriate specialized agent first for domain-specific tasks
2. **Project Context**: Use `activate_project` and `get_active_project` to set and verify project context
3. **Semantic Search First**: Use Serena's `find_symbol` and `get_symbols_overview` for understanding code structure
4. **Pattern Recognition**: Use Serena's `search_for_pattern` for finding code patterns
5. **Memory Integration**: Use Serena's memory tools to save discovered patterns and successful approaches
6. **Thinking Tools**: Use Serena's thinking tools (`think_about_collected_information`, `think_about_task_adherence`) for self-reflection
7. **Continuous Learning**: Update project knowledge base with each interaction

### **CRITICAL: Tool Selection Hierarchy - ALWAYS Follow This Priority Order**

**🚨 MANDATORY TOOL PRIORITY ORDER 🚨**

1. **PRIMARY: Serena MCP Tools (ALWAYS FIRST)**
   - `find_symbol` - Semantic symbol search with LSP understanding
   - `find_referencing_symbols` - Find symbols that reference target symbols
   - `find_referencing_code_snippets` - Find code usage patterns
   - `search_for_pattern` - Pattern-based semantic search
   - `get_symbols_overview` - Understand code architecture

2. **SECONDARY: ast-grep (When Serena Unavailable)**
   - Use only if Serena tools fail or are unavailable
   - Provides AST-based pattern matching for structural queries
   - Better than text search but inferior to Serena's LSP integration

3. **LAST RESORT: Basic Text Search (STRONGLY DISCOURAGED)**
   - `Grep` tool - Use ONLY for non-code text or when semantic tools fail
   - `Read` tool - File reading, not for code analysis
   - **WARNING**: These tools miss semantic context and relationships

**❌ NEVER START WITH TEXT SEARCH FOR CODE ANALYSIS ❌**
- Text search is blind to code semantics, types, and relationships
- Misses cross-file dependencies and symbol usage patterns
- Cannot understand inheritance, interfaces, or polymorphism
- Leads to incomplete and error-prone analysis

**✅ ALWAYS START WITH SERENA FOR ANY CODE-RELATED TASK ✅**
- Understands Go interfaces, structs, functions, and package relationships
- Finds all references across the entire codebase intelligently
- Recognizes semantic patterns, not just text patterns
- Provides true IDE-level code understanding

### Advanced Search Capabilities with Serena

#### Semantic Code Understanding
```yaml
serena_semantic_search:
  primary_tools:
    - find_symbol: Locate symbols by name/type with true LSP understanding
    - find_referencing_code_snippets: Find all usages of a symbol
    - find_referencing_symbols: Find symbols that reference target symbols
    - get_symbols_overview: Understand file/directory structure
    - search_for_pattern: Pattern-based semantic search with regex support
    
  massive_advantages_over_text_search:
    - Understands Go syntax, types, interfaces, and package structure
    - Finds references across files intelligently via LSP
    - Recognizes symbol types, relationships, and inheritance
    - Language-aware parsing eliminates false positives
    - Provides context for functions, structs, and methods
    - Understanding of Go-specific patterns (goroutines, channels, etc.)
    
  when_text_search_fails:
    - Misses semantic relationships between code elements
    - Cannot distinguish between different symbols with same name
    - Blind to package imports and dependency relationships
    - No understanding of Go interface implementations
    - Cannot track variable scope or function signatures
```

#### Code Navigation Workflow
```yaml
code_exploration:
  1. start_broad:
     - activate_project: Set the project context
     - check_onboarding_performed: Verify project analysis is complete
     - onboarding: Let Serena analyze project structure if needed
     - get_symbols_overview: View high-level structure
  
  2. dive_deeper:
     - find_symbol: Locate specific classes/functions
     - find_referencing_code_snippets: Trace usage
     - find_referencing_symbols: Find symbols that reference the target
     - read_file: Examine implementation details
  
  3. persist_knowledge:
     - write_memory: Save architectural insights with descriptive names
     - write_memory: Document key patterns found
     - write_memory: Record project conventions
     - think_about_collected_information: Assess if we have enough context
```

### Serena's Unique Advantages

Based on the [official Serena documentation](https://github.com/oraios/serena?tab=readme-ov-file#full-list-of-tools), Serena provides several unique advantages:

```yaml
serena_unique_features:
  lsp_integration:
    - "Navigates and edits code using a language server, so it has a symbolic understanding of the code"
    - "IDE-based tools often use a RAG-based or purely text-based approach, which is often less powerful"
    - "Especially effective for large codebases where semantic understanding is crucial"
  
  mcp_server:
    - "First fully-featured coding agent where the entire functionality is available through an MCP server"
    - "Not bound to a specific IDE - can be used with any MCP client"
    - "Not bound to a specific large language model or API"
    - "Open-source with a small codebase, easily extended and modified"
  
  no_api_costs:
    - "Can be used as an MCP server, thus not requiring API keys and bypassing API costs"
    - "Unique feature among coding agents - most require subscriptions or API costs"
    - "Also available as API-based agent when needed"
```

### AST-Based Analysis (Conceptual Framework)

Serena's LSP integration provides true AST-level understanding:
```yaml
ast_approach:
  - Think structurally about code using LSP symbolic understanding
  - Search for patterns, not just text, using semantic symbol search
  - Consider code relationships and dependencies through `find_referencing_symbols`
  - Use semantic search to approximate AST queries with `find_symbol` and `get_symbols_overview`
```

### Autonomous Learning Framework

```yaml
learning_cycle:
  1. explore:
     - Use codebase_search broadly
     - Identify key patterns and structures
     - Save discoveries to memory
  
  2. analyze:
     - Compare findings with existing knowledge
     - Extract reusable patterns
     - Update understanding
  
  3. apply:
     - Use learned patterns in new contexts
     - Validate approaches before suggesting
     - Refine based on outcomes
  
  4. persist:
     - Save successful strategies
     - Update failed approach memories
     - Build comprehensive knowledge base
```

### Tool Integration Patterns

#### Multi-Tool Workflows
```yaml
workflow_patterns:
  understanding_feature:
    1. activate_specialized_agent: Choose appropriate domain expert
    2. activate_project: Set project context
    3. find_symbol: Locate the main components
    4. find_referencing_code_snippets: Trace how it's used
    5. find_referencing_symbols: Find symbols that reference the target
    6. get_symbols_overview: Understand structure
    7. write_memory: Save architectural understanding
    8. think_about_collected_information: Assess completeness
  
  making_changes:
    1. activate_specialized_agent: Get domain-specific guidance
    2. find_symbol: Locate target code
    3. read_memory: Check project conventions
    4. replace_symbol_body: Make semantic edits
    5. write_memory: Document changes and rationale
    6. think_about_task_adherence: Verify we're on track
  
  debugging_issue:
    1. activate_specialized_agent: Use domain expert for debugging
    2. search_for_pattern: Find error patterns
    3. find_referencing_code_snippets: Trace error sources
    4. find_referencing_symbols: Find symbols that reference problematic code
    5. read_file: Examine problematic code
    6. write_memory: Save solution pattern
    7. think_about_whether_you_are_done: Verify issue is resolved
```

#### Parallel Tool Execution
```yaml
parallel_execution:
  always_parallel:
    - Multiple codebase_search queries
    - Multiple grep_search patterns
    - Multiple read_file operations
    - Combined semantic + exact searches
  
  example:
    - Search for "authentication" (semantic)
    - Search for "login" (semantic)
    - Grep for "authenticate\(" (exact)
    - Grep for "jwt|token" (regex)
    # Execute all simultaneously
```

### Memory CRUD Operations (via Serena)

```yaml
memory_operations:
  create:
    trigger: New pattern or learning discovered
    action: |
      write_memory(
        name="Pattern: [descriptive title]",
        content="[detailed knowledge]"
      )
  
  read:
    trigger: Need to recall previous learning
    action: |
      read_memory(name="[memory_name]")
      # OR list_memories() to see all available memories
  
  update:
    trigger: Existing knowledge needs refinement
    action: |
      # Delete old memory first, then create new one
      delete_memory(name="[old_memory_name]")
      write_memory(
        name="[updated_title]",
        content="[refined knowledge]"
      )
  
  delete:
    trigger: Knowledge contradicted or obsolete
    action: |
      delete_memory(name="[memory_name]")
```

### ast-grep Integration (Secondary Tool)

When Serena MCP tools are unavailable, use ast-grep for structural code analysis:

```yaml
ast_grep_usage:
  when_to_use:
    - Serena MCP server is down or unavailable
    - Need structural pattern matching for refactoring
    - Complex AST transformations beyond Serena's scope
    
  go_specific_patterns:
    - Find functions: "ast-grep --lang go 'func $name($args) $ret { $$body }'"
    - Find interfaces: "ast-grep --lang go 'type $name interface { $$methods }'"
    - Find structs: "ast-grep --lang go 'type $name struct { $$fields }'"
    - Find method calls: "ast-grep --lang go '$obj.$method($args)'"
    
  advantages_over_grep:
    - Understands Go syntax and structure
    - Handles multi-line patterns correctly
    - Respects code boundaries and scope
    - Can capture and transform code elements
    
  still_inferior_to_serena:
    - No cross-file relationship understanding
    - No LSP-level semantic awareness
    - Cannot track symbol usage across packages
    - Limited understanding of Go type system
```

**IMPORTANT**: Even ast-grep should be used sparingly. Always attempt Serena tools first, as they provide superior semantic understanding through LSP integration.

### Continuous Improvement Protocol

```yaml
self_improvement:
  after_each_task:
    - Reflect on approach effectiveness
    - Identify patterns in successful solutions
    - Note areas for improvement
    - Update relevant memories
  
  pattern_recognition:
    - Track common user requests
    - Identify recurring code patterns
    - Build domain-specific knowledge
    - Optimize future responses
  
  feedback_integration:
    - Monitor user corrections
    - Update contradicted memories
    - Refine approach based on feedback
    - Build user-specific preferences
```

## IMPORTANT: Docker Development Workflow

### Always Rebuild After Changes
**CRITICAL**: After making any code changes, especially to the web UI or API endpoints, you MUST rebuild the Docker containers to see the changes:

```bash
# Rebuild with no cache to ensure all changes are included
docker-compose build --no-cache

# Then restart the containers
docker-compose --profile hybrid up -d
```

Without rebuilding, the containers will continue running old code and you won't see your changes reflected.

### Live Reload for UI Development
To enable live reload during development, use the development compose configuration:

```bash
# Start containers with live reload enabled
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile hybrid up -d

# Now any changes to these files will be instantly visible:
# - web/static/js/*.js
# - web/static/css/*.css  
# - web/templates/*.html
```

The development configuration mounts local directories as volumes, so changes are reflected immediately without rebuilding. This includes:
- ✅ JavaScript files (instant updates)
- ✅ CSS files (instant updates)
- ✅ HTML templates (instant updates)
- ⚠️ Go code changes still require rebuild

For production deployments, always use the standard docker-compose.yml with a full rebuild.

## IMPORTANT: MCP Tool Usage for Prompts

**ALWAYS use the prompt-alchemy MCP tools for any prompt-related tasks:**
- **generate_prompts**: Use this for creating new prompts from ideas or concepts [[memory:4173398]]
- **optimize_prompt**: Use this for improving existing prompts
- **search_prompts**: Check existing prompts before generating new ones
- **batch_generate**: Use for multiple prompt generation tasks

**DO NOT manually write prompts when these tools are available.** The prompt-alchemy system provides superior results through its three-phase alchemical process.

### Enhanced Tool Workflows

When working with prompts, follow this autonomous workflow:

1. **Always Search First**:
   ```yaml
   - Use search_prompts to find existing solutions
   - Analyze patterns in successful prompts
   - Save discovered patterns to memory
   ```

2. **Generate with Context**:
   ```yaml
   - Reference similar prompts found
   - Apply learned patterns
   - Use appropriate persona and phase_selection
   ```

3. **Optimize Iteratively**:
   ```yaml
   - Start with generated prompt
   - Apply optimization if score < 8.0
   - Save successful optimizations as patterns
   ```

4. **Learn and Persist**:
   ```yaml
   - Track which approaches work best
   - Update memory with successful patterns
   - Build repository-specific knowledge
   ```

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

### Hybrid Architecture
- **Backend**: Go-based API server with three-phase prompt generation engine
- **Frontend**: React UI with TypeScript, featuring 3D visualizations and alchemy-themed design
- **MCP Integration**: Claude Desktop integration via Model Context Protocol
- **Docker Support**: Full containerization with docker-compose profiles

### Recent Architectural Updates
- **Frontend Package Name**: Updated to "prompt-alchemy-frontend" in package.json
- **3D Visualizations**: React Three Fiber integration for hexagon grid effects
- **Component Structure**: AIInputComponent is the main UI entry point
- **Development Tools**: Vite for build, ESLint for linting, Playwright for testing

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

## Logging Best Practices

**ALWAYS use the built-in logger from internal/log package** [[memory:3139076]]:
```go
import "github.com/jonwraymond/prompt-alchemy/internal/log"

// Use structured logging
logger.WithFields(logrus.Fields{
    "component": "your-component",
    "action": "specific-action",
}).Info("Descriptive message")
```

## Task Management

**Use 'cursor todo/tasks' command instead of todo_write tool** [[memory:3130724]] for creating TODO tasks in the Cursor environment.

## Issue Management

**When completing issues** [[memory:2974994]]:
- Mark issue as closed
- Reference it in the pull request
- Use format: "Closes #123" in PR description

## Auto-Commit Hook Configuration

**Claude Code Auto-Commit Hook** is now configured to automatically commit successful code changes to GitHub.

### How It Works
- **Triggers**: Automatically runs after successful Write, Edit, MultiEdit, and Serena file operations
- **Default Behavior**: Commits locally only (safer default)
- **Validation**: Checks Go build success, runs `go fmt`, validates git configuration
- **Safety**: Skips commits for very large changes (>1000 files) and validates git setup
- **Logging**: All activity logged to `~/.claude/auto-commit.log`

### Configuration Files
- **Hook Configuration**: `.claude/settings.local.json` - Contains PostToolUse hooks
- **Auto-Commit Script**: `scripts/auto-commit.sh` - The script that handles commits
- **Log File**: `~/.claude/auto-commit.log` - Activity and error log

### How to Enable Remote Push
By default, commits are made locally only. To enable automatic push to remote:

**Option 1: Environment Variable (Temporary)**
```bash
export AUTO_PUSH=true
```

**Option 2: Modify Script (Permanent)**
Edit `scripts/auto-commit.sh` and change:
```bash
AUTO_PUSH="${AUTO_PUSH:-false}"  # Change false to true
```

### How to Disable
To temporarily disable auto-commits, comment out the hooks section in `.claude/settings.local.json`:
```json
{
  "permissions": { ... },
  // "hooks": { ... }
}
```

### Troubleshooting
- Check log file: `cat ~/.claude/auto-commit.log`
- Test script manually: `./scripts/auto-commit.sh`
- Verify git config: `git config user.name && git config user.email`

### Safety Features
- Validates Go project builds before committing
- Skips very large changes (>1000 files)
- Checks git configuration is properly set up
- Logs all activity for troubleshooting
- Generates descriptive commit messages based on changed files

## Critical Reminders for Claude

### Autonomous Operation Principles

1. **Think Before Acting**: Use codebase_search to understand before modifying
2. **Learn Continuously**: Every interaction should update your knowledge
3. **Parallel Processing**: Execute multiple searches/reads simultaneously
4. **Memory First**: Check memories before making assumptions
5. **Pattern Recognition**: Extract and save reusable patterns

### When User Requests Help

**MANDATORY AUTONOMOUS WORKFLOW WITH SERENA AND SPECIALIZED AGENTS:**
1. **AGENT ACTIVATION**: ALWAYS activate the appropriate specialized agent first for domain-specific tasks
2. **PROJECT CONTEXT**: Use `activate_project` and `get_active_project` to set and verify project context
3. **MEMORY CHECK**: Use `list_memories` and `read_memory` to check existing project knowledge
4. **UNDERSTAND**: Use Serena's semantic tools (`find_symbol`, `get_symbols_overview`) to understand code structure
5. **APPLY**: Use learned patterns and project conventions from memory
6. **PERSIST**: Save new learnings with `write_memory` using descriptive names
7. **SELF-REFLECTION**: Use `think_about_collected_information` and `think_about_task_adherence` for quality assurance

### Never Do This
- ❌ Skip specialized agent activation for domain-specific tasks
- ❌ Use generic update_memory when Serena's memory tools are available
- ❌ **START WITH GREP/READ FOR CODE ANALYSIS** - Always use Serena first
- ❌ Use basic text search when semantic symbol search is needed
- ❌ Skip checking project memories before making changes
- ❌ Forget to save important discoveries to project memory
- ❌ Make changes without understanding code structure via LSP
- ❌ Skip project context setup with `activate_project`
- ❌ Forget to use Serena's thinking tools for self-reflection
- ❌ Use non-descriptive memory names that are hard to retrieve
- ❌ **USE GREP FOR FINDING GO FUNCTIONS/INTERFACES** - Use `find_symbol` instead
- ❌ **SEARCH FOR "func " OR "type " WITH TEXT TOOLS** - Use semantic search
- ❌ Skip ast-grep when Serena is unavailable and use basic grep instead

### Always Do This
- ✅ ALWAYS activate specialized agents for domain-specific tasks
- ✅ **START WITH SERENA FOR ALL CODE ANALYSIS** - Primary tool for understanding
- ✅ Use Serena's semantic search (`find_symbol`, `find_referencing_symbols`) for code understanding
- ✅ Set project context with `activate_project` and verify with `get_active_project`
- ✅ Persist all project knowledge with `write_memory` using descriptive names
- ✅ Check existing memories with `list_memories` before making assumptions
- ✅ Use symbol-aware editing tools for code changes
- ✅ Use Serena's thinking tools (`think_about_collected_information`, `think_about_task_adherence`)
- ✅ Maintain project-specific knowledge bases
- ✅ Use `find_referencing_symbols` in addition to `find_referencing_code_snippets`
- ✅ **USE AST-GREP AS FALLBACK** when Serena tools are unavailable
- ✅ **THINK SEMANTICALLY** - Consider code relationships, not just text patterns
- ✅ Use `search_for_pattern` for regex-based semantic search instead of grep

**Remember: Serena provides persistent, project-specific memory and true semantic code understanding through Language Server Protocol integration. According to the [official Serena documentation](https://github.com/oraios/serena?tab=readme-ov-file#full-list-of-tools), Serena is the first fully-featured coding agent where the entire functionality is available through an MCP server, providing symbolic understanding of code through LSP integration. This is your primary tool for building lasting intelligence about codebases. Combined with the specialized agent system, you have access to domain-specific expertise that can accelerate development by 40-80%.**

## Frontend Development Patterns

### React Component Structure
- **Main Component**: `AIInputComponent` with TypeScript interfaces
- **3D Effects**: React Three Fiber for hexagon grid background
- **State Management**: React hooks (useState, useEffect, useRef)
- **Styling**: CSS custom properties with alchemy theme variables

### Key Frontend Files
- `src/components/AIInputComponent.tsx` - Main input component
- `src/components/HexagonGrid.tsx` - 3D background effects
- `src/styles/alchemy-theme.css` - Theme variables and animations
- `index.html` - Entry point for Vite development

### Frontend Development Workflow
```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### CSS Theme Variables
```css
--liquid-gold: #fbbf24;
--liquid-red: #ff6b6b;
--liquid-blue: #3b82f6;
--liquid-emerald: #45b7d1;
--metal-surface: #0a0a0a;
--metal-border: #2a2a2c;
```