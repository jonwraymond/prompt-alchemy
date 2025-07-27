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

### GOLDEN RULE: SERENA MCP FIRST, ALWAYS

**NO project domain or code context exploration, structure mapping, or memory usage is allowed except via Serena MCP tools, unless and until explicit Serena error is logged, and then fallback is documented.**

### Core Tool Requirements

1. **SERENA MCP IS MANDATORY FOR ALL OPERATIONS**
   - **EVERY** session MUST start with: `serena activate_project`
   - **ALL** code search MUST use: `serena search_for_pattern` or `serena find_symbol`
   - **ALL** navigation MUST use: `serena get_symbols_overview`
   - **ALL** memory MUST use: `serena write_memory` and `serena read_memory`
   - **NEVER** use grep, cat, find, or any direct file operations without Serena failing first

2. **FALLBACK ONLY WITH EXPLICIT JUSTIFICATION**
   - If Serena MCP fails, you MUST document: `# SERENA_FALLBACK: [error and reason]`
   - Only after documented Serena failure may you use:
     - ast-grep for structural patterns (with justification)
     - code2prompt for context generation (with justification)
     - grep/ripgrep as absolute last resort (with detailed justification)

3. **Enforcement Hierarchy**:
   - **MANDATORY**: Serena MCP for ALL operations (search, navigate, memory, analysis)
   - **CONDITIONAL**: Other tools ONLY after Serena failure with documentation
   - **BLOCKED**: Direct file operations without Serena attempt and failure log

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
- Using cat, head, tail, less, more on code files
- Using find command for code discovery
- Direct grep usage without documented semantic tool failure

**🚨 Violation Consequences:**
- Pre-commit hooks will **BLOCK** non-compliant commits
- CI/CD pipeline will **FAIL** pull requests with violations
- Manual override requires documented exemption in `.semantic-exemptions`

### Enforcement & Validation

**Automated Enforcement:**
```bash
# Install compliance hooks (one-time setup)
./scripts/setup-semantic-hooks.sh

# Run manual compliance check
./scripts/semantic-search-hooks/validate-semantic-compliance.sh

# Check specific files before commit
git diff --cached --name-only | xargs ./scripts/semantic-search-hooks/pre-commit-semantic-validation.sh
```

**Compliance Reports:**
- Generated in `reports/semantic-compliance/`
- Include violations, warnings, and recommendations
- Tracked in CI/CD artifacts

**Emergency Bypass (NOT RECOMMENDED):**
```bash
# Only for critical hotfixes with manager approval
git commit --no-verify -m "EMERGENCY: [reason]"
# Must create exemption entry immediately after
```

### Quick Reference Commands - SERENA MCP FIRST

**MANDATORY Project Start Sequence:**
```bash
# 1. ALWAYS start with Serena activation
serena activate_project "/path/to/prompt-alchemy"

# 2. Run project onboarding
serena onboarding

# 3. List available memories
serena list_memories
```

**Code Analysis - SERENA FIRST:**
```bash
# Primary (REQUIRED FIRST):
serena search_for_pattern "pattern"
serena find_symbol "GeneratePrompt"
serena get_symbols_overview "internal/engine/"

# Fallback ONLY if Serena fails:
# SERENA_FALLBACK: Connection timeout after 3 retries
ast-grep run -p 'type $NAME struct { $$$ }' --lang go

# Last resort with detailed justification:
# SERENA_FALLBACK: Serena server unreachable, ast-grep pattern too complex
grep -r "pattern" . # AVOID unless absolutely necessary
```

**Memory Management - SERENA ONLY:**
```bash
# ALL memory operations MUST use Serena
serena write_memory "analysis-results" "content here"
serena read_memory "project-overview"
serena update_memory "key" "new content"
serena delete_memory "old-key"
serena list_memories

# NEVER use localStorage, files, or other storage without Serena
```

**Example Compliant Workflow:**
```bash
# 1. Start session
serena activate_project .

# 2. Search for function
serena find_symbol "handleRequest"

# 3. Get file overview
serena get_symbols_overview "pkg/handlers/"

# 4. Save findings
serena write_memory "analysis-2024-01-15" "Found 3 handlers needing update..."

# 5. If Serena fails, document and fallback
# SERENA_FALLBACK: Server error 500 on find_symbol
ast-grep run -p 'func handleRequest' --lang go
```

**Validation Commands:**
```bash
# Check compliance status
make semantic-validate

# View latest compliance report
ls -la reports/semantic-compliance/
```

For advanced usage, refer to:
- **Serena Documentation**: Full MCP tool reference and semantic capabilities
- **code2prompt Documentation**: Template customization and filtering options  
- **ast-grep Documentation**: Pattern syntax and rule configuration
- **Compliance Scripts**: `scripts/semantic-search-hooks/README.md`

## Project Overview

Prompt Alchemy is a sophisticated AI prompt generation system that transforms raw ideas into optimized prompts through a three-phase alchemical process (Prima Materia → Solutio → Coagulatio). It features both a Go backend API and a React frontend with TypeScript.

## Practical Workflow Examples

### Example 1: Feature Implementation with Semantic Tools
```bash
# 1. Activate project and generate context
serena activate_project /path/to/prompt-alchemy
code2prompt --include "internal/engine/**" --output engine-context.md

# 2. Find related symbols
serena find_symbol "GeneratePrompt"
ast-grep run -p 'func Generate$_($$$) { $$$ }' --lang go

# 3. Write implementation plan to memory
serena write_memory "feature-plan" "Implementing batch prompt generation..."

# 4. Implement with checkpoint commits
git commit -m "checkpoint: before adding batch processing"
# ... implement feature ...
git commit -m "feat: add batch prompt generation with parallel processing"
```

### Example 2: Automated Code Review Workflow
```bash
# 1. Pre-review analysis with semantic tools
serena search_for_pattern "TODO|FIXME|HACK"
ast-grep scan --rule security-rules.yml

# 2. Generate review summary
code2prompt --git-diff --output pr-review-context.md
serena write_memory "pr-123-review" "Security concerns found in auth module..."

# 3. Address review comments
serena read_memory "pr-123-review"
# ... make fixes based on review ...
```

### Example 3: Parallel Development with Sub-Agents
```bash
# 1. Break down complex task
serena write_memory "epic-breakdown" "1. API service 2. Frontend UI 3. Documentation"

# 2. Spawn specialized agents with semantic context
code2prompt --include "pkg/providers/**" | claude-code spawn api-developer
code2prompt --include "src/components/**" | claude-code spawn ui-developer
code2prompt --include "docs/**" | claude-code spawn doc-writer

# 3. Coordinate results
serena read_memory "api-developer-results"
serena read_memory "ui-developer-results"
serena read_memory "doc-writer-results"
```

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

## Anthropic Team Practices & Power Tips

*Based on insights from [How Anthropic Teams Use Claude Code](https://www.anthropic.com/news/how-anthropic-teams-use-claude-code)*

### Autonomous Development Workflows

**1. Auto-Accept Mode for Rapid Prototyping**
```bash
# Enable auto-accept for trusted operations
claude-code --auto-accept --task "implement user authentication"

# Set up self-verifying loops
claude-code --verify-loop "make test && make lint && make build"
```

**Key Practice**: Anthropic teams distinguish between tasks suitable for autonomous work (boilerplate, tests, documentation) vs. those requiring supervision (core business logic, security-critical code).

**2. Checkpoint-Based Development**
- Commit early and often to enable easy rollbacks
- Use descriptive commit messages for AI context
- Create "checkpoint" commits before major changes
```bash
git commit -m "checkpoint: before refactoring auth system"
```

### Collaborative Coding Strategies

**1. Detailed, Specific Prompting**
Instead of: "Fix the bug in authentication"
Use: "Fix the JWT token validation in internal/auth/validator.go that's causing 401 errors for valid tokens with custom claims"

**2. Synchronous Core Logic Development**
- Work alongside Claude Code for critical business logic
- Use periodic check-ins: "Show me what you've implemented so far"
- Guide when stuck: "Try using the Strategy pattern here instead"

**3. Initial Implementation + Manual Refinement**
```bash
# Phase 1: AI generates initial implementation
claude-code "implement REST API for user management with CRUD operations"

# Phase 2: Human refines edge cases and optimization
# Focus on: error handling, performance, security hardening
```

### Quality Assurance Workflows

**1. Automated Test Generation**
```bash
# Generate comprehensive unit tests
claude-code "generate unit tests for internal/engine/* with >90% coverage"

# Create integration test suites
claude-code "create integration tests for the three-phase engine workflow"
```

**2. GitHub Actions for PR Management**
```yaml
# .github/workflows/claude-pr-review.yml
on:
  issue_comment:
    types: [created]
jobs:
  address-pr-comments:
    if: contains(github.event.comment.body, '@claude-code')
    steps:
      - run: claude-code address-pr-comment "${{ github.event.comment.body }}"
```

### Documentation & Knowledge Management

**1. Living Documentation**
- Generate runbooks: `claude-code "create troubleshooting runbook for common API errors"`
- Update docs automatically: `claude-code "update API docs based on OpenAPI spec changes"`
- Synthesize knowledge: `claude-code "analyze support tickets and create FAQ"`

**2. CLAUDE.md as Team Contract**
- Document team-specific workflows
- Define quality standards and expectations
- Create custom slash commands for repetitive tasks

### Advanced Patterns from Anthropic Teams

**1. Parallel Task Management**
```bash
# Run multiple Claude Code instances for parallel work
claude-code --parallel "implement user service" "implement auth service" "implement notification service"
```

**2. Specialized Sub-Agent Architecture**
```bash
# Break complex tasks into specialized agents
claude-code spawn security-reviewer "review PR #123 for vulnerabilities"
claude-code spawn performance-optimizer "optimize database queries in reports module"
claude-code spawn doc-writer "generate user guide from API endpoints"
```

**3. Screenshot-Based Problem Solving**
- Paste UI screenshots for frontend debugging
- Share error screenshots for faster resolution
- Use visual feedback for design implementation

### Security & Compliance Practices

**1. MCP Servers for Sensitive Data**
```bash
# Use MCP for handling sensitive operations
prompt-alchemy serve-mcp --secure-mode --audit-log
```

**2. Security Review Workflows**
- Pre-commit security analysis
- Automated vulnerability scanning
- Custom access control implementation

### Team Collaboration Rituals

**1. Morning Standup with Claude Code**
```bash
# Generate daily summary
claude-code "summarize yesterday's commits and open PRs"
```

**2. Code Review Enhancement**
```bash
# Pre-review preparation
claude-code "analyze PR #456 and highlight potential issues"
```

**3. Cross-Functional Enablement**
- Enable non-technical staff to execute complex workflows
- Create guided experiences for routine tasks
- Document tribal knowledge in executable form

### Productivity Multipliers

**1. Custom Slash Commands**
```bash
# Define in CLAUDE.md or .claude/commands/
/cleanup-imports   # Remove unused imports across codebase
/add-telemetry    # Add observability to all API endpoints
/security-scan    # Run comprehensive security analysis
```

**2. Context Preservation**
- Use Serena memory for long-running tasks
- Maintain project context across sessions
- Create knowledge bases for specific domains

### Getting Started Recommendations

1. **Start Minimal**: Begin with simple, well-defined tasks
2. **Iterate Rapidly**: Treat Claude Code as an iterative partner
3. **Build Intuition**: Learn which tasks work best autonomously
4. **Refine Continuously**: Improve prompts based on outcomes

### Integration with Existing Policies

These Anthropic practices complement our semantic tool requirements:
- Use `code2prompt` to generate context for complex refactoring
- Leverage `ast-grep` for code review automation patterns
- Employ `Serena MCP` for maintaining context across parallel tasks

**Note**: All Anthropic practices must still comply with our AI Navigation & Memory Policy. When implementing these workflows, ensure semantic tools are used for code analysis and navigation.