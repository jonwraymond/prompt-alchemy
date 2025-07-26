#!/bin/bash
# query-router.sh - Route user queries through semantic search hierarchy
# Hook: UserPromptSubmit

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
CACHE_DIR="$HOME/.claude/semantic-search-cache"
LOG_FILE="$HOME/.claude/semantic-search.log"

# Ensure directories exist
mkdir -p "$CACHE_DIR" "$CONFIG_DIR"

# Load configuration
source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/logging.sh"
source "$SCRIPT_DIR/lib/tool-detection.sh"

# Read input from stdin (Claude hook input)
input=$(cat)

# Parse user prompt from JSON input
user_prompt=$(echo "$input" | jq -r '.prompt // empty')

if [[ -z "$user_prompt" ]]; then
    log_debug "No user prompt found in input, skipping routing"
    exit 0
fi

show_hook_status "UserPromptSubmit" "started" "Query analysis"
log_info "Processing user query: ${user_prompt:0:100}..."
output_visible "Query: ${user_prompt:0:50}..." "info"

# Analyze query intent and complexity
intent_analysis=$(analyze_query_intent "$user_prompt")
complexity_score=$(echo "$intent_analysis" | jq -r '.complexity_score')
query_type=$(echo "$intent_analysis" | jq -r '.query_type')
suggested_tools=$(echo "$intent_analysis" | jq -r '.suggested_tools[]')

log_debug "Query analysis: type=$query_type, complexity=$complexity_score"

# Check tool availability
available_tools=$(check_tool_availability)
log_debug "Available tools: $available_tools"

# Generate routing decision
routing_decision=$(generate_routing_decision "$query_type" "$complexity_score" "$available_tools")

# Cache routing decision for PreToolUse hook
cache_key=$(echo "$user_prompt" | sha256sum | cut -d' ' -f1)
echo "$routing_decision" > "$CACHE_DIR/routing-$cache_key.json"

# Show tool selection if enabled
primary_tool=$(echo "$routing_decision" | jq -r '.primary_tool')
fallback_tools=$(echo "$routing_decision" | jq -r '.fallback_chain | join(" → ")')
show_tool_selection "$query_type" "$primary_tool" "$fallback_tools"

# Output routing information for Claude
echo "$routing_decision" | jq -r '.claude_context // empty'

log_info "Query routed: $primary_tool -> $fallback_tools"
show_hook_status "UserPromptSubmit" "completed" "Routed to $primary_tool"

exit 0

# Functions
analyze_query_intent() {
    local prompt="$1"
    
    # Simple intent analysis based on keywords and patterns
    local complexity=1
    local type="unknown"
    local tools=()
    
    # Code analysis patterns
    if echo "$prompt" | grep -qiE "(find|search|analyze|understand|explain).*function|method|class|interface"; then
        type="code_analysis"
        complexity=3
        tools=("serena" "ast-grep" "code2prompt")
    # Refactoring patterns
    elif echo "$prompt" | grep -qiE "refactor|improve|optimize|restructure|clean"; then
        type="refactoring"
        complexity=4
        tools=("serena" "code2prompt" "ast-grep")
    # Documentation patterns
    elif echo "$prompt" | grep -qiE "document|readme|guide|explain.*codebase"; then
        type="documentation"
        complexity=2
        tools=("code2prompt" "serena")
    # Bug fixing patterns
    elif echo "$prompt" | grep -qiE "bug|error|fix|debug|issue"; then
        type="debugging"
        complexity=3
        tools=("serena" "ast-grep")
    # General code queries
    elif echo "$prompt" | grep -qiE "code|function|class|method|variable"; then
        type="code_query"
        complexity=2
        tools=("serena" "ast-grep")
    fi
    
    # Increase complexity for broad scope indicators
    if echo "$prompt" | grep -qiE "entire|all|whole|project|codebase"; then
        complexity=$((complexity + 2))
        tools=("code2prompt" "${tools[@]}")
    fi
    
    # Output JSON
    jq -n \
        --arg type "$type" \
        --argjson complexity "$complexity" \
        --argjson tools "$(printf '%s\n' "${tools[@]}" | jq -R . | jq -s .)" \
        '{
            query_type: $type,
            complexity_score: $complexity,
            suggested_tools: $tools,
            timestamp: now
        }'
}

generate_routing_decision() {
    local query_type="$1"
    local complexity="$2"
    local available_tools="$3"
    
    # Default routing
    local primary_tool="serena"
    local fallback_chain=("ast-grep" "grep")
    local context_tool="code2prompt"
    local token_budget=5000
    
    # Adjust based on query type and complexity
    case "$query_type" in
        "code_analysis")
            if [[ $complexity -gt 3 ]]; then
                primary_tool="code2prompt"
                fallback_chain=("serena" "ast-grep" "grep")
                token_budget=8000
            fi
            ;;
        "refactoring")
            primary_tool="serena"
            context_tool="code2prompt"
            token_budget=10000
            ;;
        "documentation")
            primary_tool="code2prompt"
            fallback_chain=("serena" "grep")
            token_budget=6000
            ;;
        "debugging")
            primary_tool="serena"
            fallback_chain=("ast-grep" "grep")
            token_budget=4000
            ;;
    esac
    
    # Filter tools by availability
    available_array=($(echo "$available_tools" | tr ',' ' '))
    filtered_chain=()
    
    for tool in "${fallback_chain[@]}"; do
        if [[ " ${available_array[*]} " =~ " $tool " ]]; then
            filtered_chain+=("$tool")
        fi
    done
    
    # Generate Claude context hint
    local claude_context=""
    if [[ $complexity -gt 3 ]]; then
        claude_context="Complex $query_type query detected. Using semantic search hierarchy with $primary_tool as primary tool."
    fi
    
    # Output JSON
    jq -n \
        --arg primary "$primary_tool" \
        --arg context "$context_tool" \
        --argjson chain "$(printf '%s\n' "${filtered_chain[@]}" | jq -R . | jq -s .)" \
        --argjson budget "$token_budget" \
        --arg claude_ctx "$claude_context" \
        '{
            primary_tool: $primary,
            context_tool: $context,
            fallback_chain: $chain,
            token_budget: $budget,
            claude_context: $claude_ctx,
            timestamp: now
        }'
}