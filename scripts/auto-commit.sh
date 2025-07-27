#!/bin/bash

# Auto-commit script (Project-Specific)
# This script references the global Claude auto-commit and runs local behavior

set -e

echo "🔧 Running project auto-commit..."

# Check if global Claude auto-commit exists
CLAUDE_AUTOCOMMIT_SCRIPT="$HOME/.claude/scripts/auto-commit.sh"

if [ -f "$CLAUDE_AUTOCOMMIT_SCRIPT" ]; then
    echo "📚 Using global Claude auto-commit..."
    bash "$CLAUDE_AUTOCOMMIT_SCRIPT"
else
    echo "❌ Error: Claude auto-commit not found at $CLAUDE_AUTOCOMMIT_SCRIPT"
    echo "Please ensure Claude Code is properly configured with SuperClaude framework"
    exit 1
fi