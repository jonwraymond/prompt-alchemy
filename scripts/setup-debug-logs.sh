#!/bin/bash

# Debug Logs Setup Script (Project-Specific)
# This script references the global Claude debug setup and configures local logging

set -e

echo "🔧 Setting up project debug logs..."

# Check if global Claude debug setup exists
CLAUDE_DEBUG_SCRIPT="$HOME/.claude/scripts/setup-debug-logs.sh"

if [ -f "$CLAUDE_DEBUG_SCRIPT" ]; then
    echo "📚 Using global Claude debug setup..."
    bash "$CLAUDE_DEBUG_SCRIPT"
else
    echo "❌ Error: Claude debug setup not found at $CLAUDE_DEBUG_SCRIPT"
    echo "Please ensure Claude Code is properly configured with SuperClaude framework"
    exit 1
fi

echo ""
echo "🎉 Project debug logs configured successfully!"
echo "   Using global setup from: $CLAUDE_DEBUG_SCRIPT"