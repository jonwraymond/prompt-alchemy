#!/bin/bash

# Agent Rules Validation Script (Project-Specific)
# This script references the global Claude validation and runs local checks

set -e

echo "🔧 Validating project agent rules..."

# Check if global Claude validation exists
CLAUDE_VALIDATION_SCRIPT="$HOME/.claude/scripts/validate-agent-rules.sh"

if [ -f "$CLAUDE_VALIDATION_SCRIPT" ]; then
    echo "📚 Using global Claude agent validation..."
    bash "$CLAUDE_VALIDATION_SCRIPT"
else
    echo "❌ Error: Claude agent validation not found at $CLAUDE_VALIDATION_SCRIPT"
    echo "Please ensure Claude Code is properly configured with SuperClaude framework"
    exit 1
fi

echo ""
echo "🎉 Project agent validation completed successfully!"
echo "   Using global validation from: $CLAUDE_VALIDATION_SCRIPT"