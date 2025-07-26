# Semantic Search Hook System

An efficient, token-conservative system leveraging semantic search and hooks, combining code2prompt, Serena, and ast-grep with graceful degradation and minimal resource usage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Claude Code Hook System                   │
├─────────────────────────────────────────────────────────────┤
│  Semantic Search Layer (Primary Filter)                    │
│  ├── Serena LSP (High Precision)                          │
│  ├── ast-grep (Structural Fallback)                       │
│  └── code2prompt (Context Generation)                     │
├─────────────────────────────────────────────────────────────┤
│  Hook Integration Points                                    │
│  ├── PreToolUse: Context preparation & tool selection     │
│  ├── PostToolUse: Result processing & caching            │
│  └── UserPromptSubmit: Query analysis & routing          │
├─────────────────────────────────────────────────────────────┤
│  Failsafe & Degradation Logic                             │
│  ├── Tool availability checking                           │
│  ├── Fallback chain execution                            │
│  └── Graceful error handling                             │
└─────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Semantic Search Hierarchy
- **Primary**: Serena (LSP-based semantic understanding)
- **Secondary**: ast-grep (structural pattern matching)
- **Tertiary**: code2prompt (broad context generation)
- **Fallback**: Basic text search (grep/ripgrep)

### 2. Hook Integration Points
- **Context Generation**: Pre-analyze user intent
- **Tool Selection**: Choose optimal tool chain
- **Result Processing**: Filter and optimize output
- **Caching**: Store successful patterns

### 3. Token Conservation Strategies
- **Semantic Filtering**: Reduce data volume before processing
- **Context-Based Queries**: Retrieve only necessary information
- **Result Caching**: Avoid redundant operations
- **Progressive Enhancement**: Start minimal, expand as needed

## Quick Start

1. Install components:
   ```bash
   # Install code2prompt
   cargo install code2prompt
   
   # Serena should already be available via MCP
   # ast-grep installation
   npm install -g @ast-grep/cli
   ```

2. Configure hooks in `.claude/settings.local.json`:
   ```json
   {
     "hooks": {
       "UserPromptSubmit": [
         {
           "command": "./scripts/semantic-search-hooks/query-router.sh",
           "description": "Route queries through semantic search hierarchy"
         }
       ],
       "PreToolUse": [
         {
           "command": "./scripts/semantic-search-hooks/context-preparer.sh",
           "description": "Prepare context using semantic tools"
         }
       ],
       "PostToolUse": [
         {
           "command": "./scripts/semantic-search-hooks/result-processor.sh",
           "description": "Process and cache results"
         }
       ]
     }
   }
   ```

3. Run tests:
   ```bash
   ./scripts/semantic-search-hooks/test-system.sh
   ```

## Usage Examples

### Example 1: Code Analysis Query
```
User: "Find all authentication functions and their usage patterns"
├── Hook detects code analysis intent
├── Routes to Serena for semantic symbol search
├── Falls back to ast-grep if Serena unavailable
├── Uses code2prompt for broader context if needed
└── Returns filtered, token-optimized results
```

### Example 2: Refactoring Task
```
User: "Refactor the user management module"
├── Hook analyzes scope and complexity
├── Prepares context using code2prompt (module overview)
├── Uses Serena for detailed symbol analysis
├── Caches successful patterns for future use
└── Provides minimal, targeted information to Claude
```

## Configuration

See individual component documentation:
- [Hook Configuration](./docs/hook-configuration.md)
- [Tool Integration](./docs/tool-integration.md)
- [Performance Tuning](./docs/performance-tuning.md)
- [Testing Guide](./docs/testing-guide.md)

## Monitoring & Debugging

System provides comprehensive logging and monitoring:
- Hook execution metrics
- Tool performance tracking
- Token usage analytics
- Error pattern analysis

See [Monitoring Guide](./docs/monitoring.md) for details.