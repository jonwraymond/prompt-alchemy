#!/bin/bash

# Setup Git Hooks with Auto-Documentation (Project-Specific)
# This script references the global Claude setup and configures local hooks

set -e

echo "🔧 Setting up project Git hooks with auto-documentation..."

# Check if global Claude setup exists
CLAUDE_HOOKS_SCRIPT="$HOME/.claude/scripts/setup-git-hooks.sh"

if [ -f "$CLAUDE_HOOKS_SCRIPT" ]; then
    echo "📚 Using global Claude git hooks setup..."
    bash "$CLAUDE_HOOKS_SCRIPT"
else
    echo "❌ Error: Claude git hooks setup not found at $CLAUDE_HOOKS_SCRIPT"
    echo "Please ensure Claude Code is properly configured with SuperClaude framework"
    exit 1
fi

echo ""
echo "🎉 Project git hooks configured successfully!"
echo "   Using global setup from: $CLAUDE_HOOKS_SCRIPT"
echo ""
echo "💡 To modify auto-documentation behavior, edit:"
echo "   $CLAUDE_HOOKS_SCRIPT"