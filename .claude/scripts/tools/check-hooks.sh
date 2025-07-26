#!/bin/bash
# check-hooks.sh - Quick status check for semantic search hooks

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/config-simple.sh"
source "$SCRIPT_DIR/../lib/logging-simple.sh"
source "$SCRIPT_DIR/../lib/tool-detection.sh"

echo "🔍 Semantic Search Hooks Status Check"
echo "=================================="

# Check Claude Code hooks configuration
if [[ -f "$HOME/.claude/settings.local.json" ]]; then
    if jq -e '.hooks' "$HOME/.claude/settings.local.json" >/dev/null 2>&1; then
        echo "✅ Claude Code hooks configured"
        
        # Check if our hooks are configured
        if jq -e '.hooks.UserPromptSubmit[]? | select(.command | test("query-router"))' "$HOME/.claude/settings.local.json" >/dev/null 2>&1; then
            echo "✅ UserPromptSubmit hook active"
        else
            echo "⚠️ UserPromptSubmit hook not found"
        fi
        
        if jq -e '.hooks.PreToolUse[]? | select(.command | test("context-preparer"))' "$HOME/.claude/settings.local.json" >/dev/null 2>&1; then
            echo "✅ PreToolUse hook active"
        else
            echo "⚠️ PreToolUse hook not found"
        fi
    else
        echo "❌ No hooks configured in Claude Code"
    fi
else
    echo "❌ Claude Code settings file not found"
fi

echo ""

# Check tool availability
echo "🛠️ Tool Availability:"
available_tools=$(check_tool_availability)
if [[ -n "$available_tools" ]]; then
    IFS=',' read -ra tools_array <<< "$available_tools"
    for tool in "${tools_array[@]}"; do
        echo "  ✅ $tool"
    done
else
    echo "  ❌ No semantic tools available"
fi

echo ""

# Check recent activity
if [[ -f "$LOG_FILE" ]]; then
    echo "📋 Recent Hook Activity (last 5 entries):"
    tail -5 "$LOG_FILE" | while read line; do
        echo "  $line"
    done
else
    echo "⚠️ No log file found - hooks may not have run yet"
fi

echo ""

# Check visibility settings
echo "👁️ Visibility Settings:"
echo "  HOOK_VERBOSE: ${HOOK_VERBOSE:-false}"
echo "  HOOK_DEBUG: ${HOOK_DEBUG:-false}"
echo "  SHOW_TOOL_SELECTION: ${SHOW_TOOL_SELECTION:-false}"
echo "  SHOW_PERFORMANCE: ${SHOW_PERFORMANCE:-false}"

if [[ "${HOOK_VERBOSE:-false}" == "false" ]]; then
    echo ""
    echo "💡 To see hook activity in Claude Code chat, enable verbose mode:"
    echo "   Add to ~/.claude/semantic-search-config.sh:"
    echo "   HOOK_VERBOSE=\"true\""
    echo "   SHOW_TOOL_SELECTION=\"true\""
    echo "   SHOW_PERFORMANCE=\"true\""
fi

echo ""

# Performance summary
if [[ -f "$CACHE_DIR/performance.jsonl" ]] && [[ -s "$CACHE_DIR/performance.jsonl" ]]; then
    echo "⚡ Performance Summary (last 10 operations):"
    tail -10 "$CACHE_DIR/performance.jsonl" | jq -r '"  " + .operation + " (" + .tool + "): " + (.duration_ms|tostring) + "ms, " + (.tokens_used|tostring) + " tokens"' 2>/dev/null || echo "  Performance data available but could not parse"
else
    echo "⚡ No performance data available yet"
fi

echo ""
echo "🎯 Quick Tests:"
echo "  Run a test query: Ask Claude 'find authentication functions' and watch for hook activity"
echo "  Check logs: tail -f $LOG_FILE"
echo "  Test tools: $SCRIPT_DIR/test-system.sh health"