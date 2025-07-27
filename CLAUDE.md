# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

##  GOLDEN RULES: MUST NEVER BE SKIP!

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

## AI NAVIGATION & MEMORY POLICY: NON-NEGOTIABLE STANDARDS

**⚠️ CRITICAL: These rules are MANDATORY for all codebase operations. Non-compliance is unacceptable.**

### Core Tool Requirements

1. **ALWAYS use code2prompt CLI, Serena MCP, or ast-grep for ALL codebase analysis, navigation, and decision-making**
   - **NEVER** navigate code manually without these tools
   - **PRIORITIZE** Serena and code2prompt above other navigation/editing tools
   - Use semantic tools as default for all code search flows; fallback to grep only when absolutely necessary

2. **MANDATORY Memory Operations via Serena**
   - **ALL** memory operations (save, read, update, delete) MUST use Serena's memory APIs
   - **ALWAYS** activate the relevant project in Serena during operations
   - **REQUIRED**: Use Serena's project activation and memory CRUD tools for context retention

3. **Semantic Search Hierarchy** (in order of preference):
   - **Primary**: Serena MCP tools (`find_symbol`, `get_symbols_overview`, `search_for_pattern`)
   - **Secondary**: ast-grep for structural code analysis (`ast-grep run -p 'pattern'`)
   - **Tertiary**: code2prompt CLI for codebase context generation
   - **Last Resort**: grep/ripgrep for text-based search only

### Tool Definitions & Usage

**code2prompt CLI**: Convert entire codebase into structured LLM prompts
```bash
# Generate codebase context
code2prompt --pattern "*.go,*.ts" --output context.md

# Include git information
code2prompt --git-diff --git-log-since "1 week ago"

# Filter specific directories
code2prompt --include "internal/**" --exclude "node_modules/**"
```

**Serena MCP**: Semantic code analysis and memory management via Model Context Protocol
```bash
# Essential Serena operations (via MCP tools):
activate_project         # Activate project by path or name
find_symbol              # Search symbols globally or locally
get_symbols_overview     # Get file/directory symbol overview
search_for_pattern       # Pattern search across project
write_memory            # Save context to project memory
read_memory             # Retrieve saved context
list_memories           # List available memories
onboarding              # Perform project onboarding
```

**ast-grep**: Structural pattern matching for code analysis
```bash
# Find function definitions
ast-grep run -p 'func $NAME($ARGS) { $$$ }' --lang go

# Find specific patterns
ast-grep run -p 'if ($COND) { $$$ }' --json

# Scan with custom rules
ast-grep scan --rule custom-rule.yml
```

### Compliance Requirements

**✅ Required Actions:**
- Start every coding session by activating the project in Serena
- Use Serena's memory system to maintain context across sessions
- Leverage semantic tools for all code exploration and analysis
- Generate structured context with code2prompt for complex analysis

**❌ Prohibited Actions:**
- Manual file browsing without semantic tools
- Text-based searches without attempting semantic search first
- Ignoring Serena's memory APIs for context management
- Operating without activating the relevant project in Serena

**🚨 Violation Consequences:**
Any agent, script, or contributor not following these standards is **OUT OF COMPLIANCE** and must immediately correct their approach before proceeding.

### Quick Reference Commands

**Project Setup:**
```bash
# Activate project in Serena (via MCP)
"Activate the project /path/to/prompt-alchemy"

# Generate initial context
code2prompt --include "**/*.go" --include "**/*.ts" --output project-context.md
```

**Code Analysis:**
```bash
# Serena semantic search
find_symbol "GeneratePrompt"
get_symbols_overview "internal/engine/"

# ast-grep pattern matching  
ast-grep run -p 'type $NAME struct { $$$ }' --lang go
```

**Memory Management:**
```bash
# Serena memory operations (via MCP)
write_memory "analysis-results" "content here"
read_memory "project-overview"
list_memories
```

For advanced usage, refer to:
- **Serena Documentation**: Full MCP tool reference and semantic capabilities
- **code2prompt Documentation**: Template customization and filtering options  
- **ast-grep Documentation**: Pattern syntax and rule configuration

## Project Overview

Prompt Alchemy is a sophisticated AI prompt generation system that transforms raw ideas into optimized prompts through a three-phase alchemical process (Prima Materia → Solutio → Coagulatio). It features both a Go backend API and a React frontend with TypeScript.

## Build and Development Commands

### Go Backend
```bash
# Build the main binary
make build

# Build monolithic binary (all services in one process)
make build-mono

# Run unit tests
make test-unit

# Run integration tests
make test-integration

# Run all tests
make test

# Run quick development cycle
make dev

# Format and lint code
make fmt
make lint

# Security scanning
make security

# Generate coverage report
make coverage

# Build for all platforms
make build-all
```

### Frontend (React/TypeScript)
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint TypeScript/React code
npm run lint
```

### Docker
```bash
# Start full stack (backend + frontend)
docker-compose --profile hybrid up -d

# Start backend only
docker-compose up -d prompt-alchemy-api

# Build Docker image
make docker-build
```

### Testing Commands
```bash
# Run single test file
go test ./internal/engine/...

# Run specific test function
go test -run TestGeneratePrompt ./internal/engine/

# Run benchmarks
make bench

# Run E2E tests
make test-e2e

# Run smoke tests
make test-smoke
```

## High-Level Architecture

### Core Components

**Three-Phase Engine** (`internal/engine/`):
- **Prima Materia**: Raw input processing and initial transformation
- **Solutio**: Context analysis and prompt refinement  
- **Coagulatio**: Final optimization and output generation

**Provider System** (`pkg/providers/`):
- Abstracted interface supporting OpenAI, Anthropic, Google, OpenRouter, Ollama
- Unified error handling and response formatting
- Rate limiting and retry logic

**Storage Layer** (`internal/storage/`):
- SQLite-based persistence with chromem-go vector embeddings
- Prompt versioning, metadata tracking, and search capabilities
- Schema migrations and data integrity

**Learning Engine** (`internal/learning/`):
- Feedback processing and model performance tracking
- Ranking system with ML-based optimization
- Historical analysis and pattern recognition

### Operation Modes

1. **CLI Mode**: Direct command execution (`prompt-alchemy generate "prompt"`)
2. **HTTP Server**: REST API on port 8080 (`prompt-alchemy serve`)
3. **MCP Server**: Model Context Protocol integration (`prompt-alchemy serve-mcp`)

### Data Flow
```
User Input → Prima Materia → Provider Registry → Solutio → Learning Engine → Coagulatio → Ranked Results
```

### Key Directories
- `cmd/`: CLI commands and entry points
- `internal/`: Core business logic (not importable)
- `pkg/`: Public packages (importable)
- `src/`: React frontend components
- `docs/`: Architecture and API documentation
- `scripts/`: Build and deployment automation

## Development Guidelines

### Code Organization
- Use domain-driven design in `internal/domain/`
- Implement interfaces in `pkg/interfaces/`
- Provider implementations in `pkg/providers/`
- HTTP handlers in `internal/http/handlers/`

### Configuration
- Main config: `~/.prompt-alchemy/config.yaml`
- Example config: `example-config.yaml`
- Environment variables: `PROMPT_ALCHEMY_*` prefix
- Docker environment variables for containerized deployment

### Testing Structure
- Unit tests: `*_test.go` files alongside source
- Integration tests: `scripts/integration-test.sh`
- E2E tests: `scripts/run-e2e-tests.sh`
- API tests: `tests/api/` directory

### Database Migrations
Located in `internal/storage/schema.sql`. Run migrations with:
```bash
prompt-alchemy migrate
```

### MCP Integration
The system serves as an MCP server for Claude Desktop integration:
```bash
prompt-alchemy serve-mcp
```

### Frontend Architecture
- **React + TypeScript** with Vite build system
- **Components**: Modular design in `src/components/`
- **API Integration**: Centralized in `src/utils/api.ts`
- **3D Visualizations**: React Three Fiber hexagon grid effects
- **Styling**: CSS modules with alchemy-inspired dark theme

### Provider Implementation
When adding new providers:
1. Implement `Provider` interface in `pkg/providers/`
2. Add to provider registry in `internal/registry/`
3. Update configuration schema
4. Add integration tests

### Monitoring and Observability
- Prometheus metrics on `/metrics` endpoint
- Structured logging with logrus
- Health checks on `/health` endpoint
- Request tracing and performance monitoring