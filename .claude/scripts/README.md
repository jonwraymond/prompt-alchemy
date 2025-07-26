# Claude Scripts Directory Structure

This directory contains all Claude Code hook scripts and related files for the prompt-alchemy project, organized in a clear hierarchy for better maintainability.

## Directory Structure

```
.claude/scripts/
├── hooks/                    # Hook scripts organized by hook type
│   ├── user-prompt-submit/  # UserPromptSubmit hook scripts
│   │   └── query-router.sh  # Routes queries through semantic search hierarchy
│   ├── pre-tool-use/        # PreToolUse hook scripts
│   │   └── context-preparer.sh  # Prepares context using semantic tools
│   └── post-tool-use/       # PostToolUse hook scripts (reserved for future use)
├── lib/                     # Shared library functions
│   ├── config-simple.sh     # Configuration management (bash 3.2 compatible)
│   ├── logging-simple.sh    # Logging utilities (bash 3.2 compatible)
│   ├── tool-detection.sh    # Tool availability detection
│   ├── semantic-tools.sh    # Semantic tool wrappers
│   ├── failsafe.sh         # Error handling and recovery
│   └── token-optimizer.sh   # Token usage optimization
├── config/                  # Configuration files and templates
│   └── user-config-template.sh  # Template for user customization
├── docs/                    # Documentation
│   └── api-interface.md     # Hook API interface documentation
├── tools/                   # Management and utility scripts
│   ├── install.sh          # Installation script for hook system
│   ├── check-hooks.sh      # Status checking and diagnostics
│   ├── test-system.sh      # Automated testing suite
│   └── README.md           # This documentation file
└── tests/                   # Test fixtures and results (reserved)
```

## Hook Scripts

### UserPromptSubmit Hook (`hooks/user-prompt-submit/query-router.sh`)
- **Purpose**: Analyzes user queries and routes them through the semantic search hierarchy
- **Triggers**: When user submits a prompt in Claude Code
- **Features**: 
  - Query intent analysis
  - Tool selection based on complexity
  - Caching of routing decisions
  - Visible feedback in chat (configurable)

### PreToolUse Hook (`hooks/pre-tool-use/context-preparer.sh`)
- **Purpose**: Prepares semantic context before tool execution
- **Triggers**: Before Claude Code executes any tool
- **Features**:
  - File context preparation for Read/Edit/Write operations
  - Search context optimization for Grep/Glob operations
  - Command context analysis for Bash operations
  - Context caching for performance

## Library Components

### Configuration (`lib/config-simple.sh`)
- Bash 3.2 compatible configuration management
- Tool priorities and timeout settings
- Token budget management
- User configuration loading
- Environment detection

### Logging (`lib/logging-simple.sh`)
- Structured logging with multiple levels
- Visible output for Claude Code chat
- Performance metrics tracking
- Hook status reporting
- Debug mode support

### Tool Detection (`lib/tool-detection.sh`)
- Dynamic detection of available semantic tools
- Tool capability assessment
- Fallback chain management
- Integration status monitoring

## Management Tools

### Installation (`tools/install.sh`)
- Automated hook system installation
- Claude Code configuration updates
- Directory structure creation
- User configuration setup
- Dependency checking

### Status Checking (`tools/check-hooks.sh`)
- Hook configuration verification
- Tool availability assessment
- Recent activity monitoring
- Visibility settings display
- Quick diagnostic tests

### Testing (`tools/test-system.sh`)
- Comprehensive test suite
- Health checks
- Performance benchmarking
- Integration validation
- Mock testing support

## Configuration

### User Configuration
Create `~/.claude/semantic-search-config.sh` to customize behavior:

```bash
# Visibility settings
HOOK_VERBOSE="true"
SHOW_TOOL_SELECTION="true"
SHOW_PERFORMANCE="true"

# Tool preferences
TOOL_PRIORITY_SERENA=10
TOOL_PRIORITY_AST_GREP=7

# Performance settings
TOKEN_BUDGET_COMPLEX_QUERY=15000
TIMEOUT_SERENA=45
```

### Claude Code Integration
Hooks are automatically configured in `~/.claude/settings.local.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "command": "/path/to/.claude/scripts/hooks/user-prompt-submit/query-router.sh",
      "description": "Route queries through semantic search hierarchy",
      "timeout": 30
    }],
    "PreToolUse": [{
      "command": "/path/to/.claude/scripts/hooks/pre-tool-use/context-preparer.sh",
      "description": "Prepare context using semantic tools",
      "timeout": 45
    }]
  }
}
```

## Usage

### Installation
```bash
# Install the hook system
.claude/scripts/tools/install.sh

# Check installation status
.claude/scripts/tools/check-hooks.sh

# Run tests
.claude/scripts/tools/test-system.sh
```

### Monitoring
```bash
# Check hook status
.claude/scripts/tools/check-hooks.sh

# View logs
tail -f ~/.claude/semantic-search.log

# Run health check
.claude/scripts/tools/test-system.sh health
```

## Migration from Previous Structure

This reorganized structure replaces the previous flat organization in `scripts/semantic-search-hooks/`. Key changes:

1. **Organized by Function**: Scripts grouped by hook type and purpose
2. **Simplified Libraries**: Bash 3.2 compatible implementations
3. **Clear Separation**: Hooks, libraries, tools, and configuration clearly separated
4. **Improved Paths**: Logical relative path structure
5. **Better Documentation**: Comprehensive documentation and examples

The new structure provides better maintainability, clearer organization, and improved development workflow while maintaining full compatibility with the existing hook functionality.