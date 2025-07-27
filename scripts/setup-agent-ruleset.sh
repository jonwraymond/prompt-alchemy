#!/bin/bash

# Agent Ruleset Setup Script (Project-Specific)
# This script references the global Claude setup and configures local agent rulesets

set -e

echo "🔧 Setting up project agent ruleset..."

# Check if global Claude setup exists
CLAUDE_AGENT_SCRIPT="$HOME/.claude/scripts/setup-agent-ruleset.sh"

if [ -f "$CLAUDE_AGENT_SCRIPT" ]; then
    echo "📚 Using global Claude agent ruleset setup..."
    bash "$CLAUDE_AGENT_SCRIPT"
else
    echo "❌ Error: Claude agent ruleset setup not found at $CLAUDE_AGENT_SCRIPT"
    echo "Please ensure Claude Code is properly configured with SuperClaude framework"
    exit 1
fi

echo ""
echo "🎉 Project agent ruleset configured successfully!"
echo "   Using global setup from: $CLAUDE_AGENT_SCRIPT"
echo ""
echo "💡 To modify agent behavior, edit:"
echo "   $CLAUDE_AGENT_SCRIPT"