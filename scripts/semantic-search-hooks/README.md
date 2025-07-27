# Semantic Search Hooks (Project Reference)

This directory contains references to the global Claude semantic search hook system.

## Global Location

The actual semantic search hooks are located at:
```
~/.claude/scripts/semantic-search-hooks/
```

## Usage

For setup and configuration, use the global scripts:

```bash
# Install and configure hooks
~/.claude/scripts/semantic-search-hooks/install.sh

# Test the system
~/.claude/scripts/semantic-search-hooks/test-system.sh

# Check hook status
~/.claude/scripts/semantic-search-hooks/check-hooks.sh
```

## Integration

The hooks integrate with Claude Code via `.claude/settings.local.json` configuration.

See the global README for complete documentation:
```bash
cat ~/.claude/scripts/semantic-search-hooks/README.md
```