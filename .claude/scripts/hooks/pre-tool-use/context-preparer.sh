#!/bin/bash
# context-preparer.sh - Prepare context using semantic tools
# Hook: PreToolUse

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="$HOME/.claude/semantic-search-cache"
LOG_FILE="$HOME/.claude/semantic-search.log"

source "$SCRIPT_DIR/../../lib/config-simple.sh"
source "$SCRIPT_DIR/../../lib/logging-simple.sh"
source "$SCRIPT_DIR/../../lib/semantic-tools.sh"
source "$SCRIPT_DIR/../../lib/failsafe.sh"

# Function to get current prompt hash (placeholder - would need real implementation)
get_current_prompt_hash() {
    # In a real implementation, this would get the hash from the current session
    # For now, return a default hash
    echo "default-hash"
}

# Function to generate default routing
generate_default_routing() {
    local tool="$1"
    jq -n \
        --arg tool "$tool" \
        '{
            primary_tool: "serena",
            context_tool: "code2prompt",
            fallback_chain: ["ast-grep", "grep"],
            token_budget: 5000,
            timestamp: now
        }'
}

prepare_file_context() {
    local args="$1"
    local primary_tool="$2"
    local budget="$3"
    
    # Extract file path
    local file_path=$(echo "$args" | jq -r '.file_path // .path // empty')
    
    if [[ -z "$file_path" || ! -f "$file_path" ]]; then
        log_debug "No valid file path found: $file_path"
        return 0
    fi
    
    log_info "Preparing context for file: $file_path"
    
    # Use semantic tools to understand file context
    local context_result
    context_result=$(with_failsafe "get_file_semantic_context" "$file_path" "$primary_tool" "$budget")
    
    if [[ $? -eq 0 && -n "$context_result" ]]; then
        # Cache the context for potential use
        local cache_key=$(echo "$file_path" | sha256sum | cut -d' ' -f1)
        echo "$context_result" > "$CACHE_DIR/file-context-$cache_key.json"
        log_debug "Cached semantic context for file: $file_path"
        
        # Provide minimal hint to Claude about available context
        echo "Semantic context prepared for $file_path ($(echo "$context_result" | jq -r '.symbol_count // 0') symbols)"
    fi
}

prepare_search_context() {
    local args="$1"
    local primary_tool="$2"
    local budget="$3"
    
    # Extract search pattern
    local pattern=$(echo "$args" | jq -r '.pattern // .query // empty')
    
    if [[ -z "$pattern" ]]; then
        log_debug "No search pattern found"
        return 0
    fi
    
    log_info "Preparing semantic search context for pattern: $pattern"
    
    # Pre-analyze search scope with semantic tools
    local scope_result
    scope_result=$(with_failsafe "analyze_search_scope" "$pattern" "$primary_tool" "$budget")
    
    if [[ $? -eq 0 && -n "$scope_result" ]]; then
        # Cache scope analysis
        local cache_key=$(echo "$pattern" | sha256sum | cut -d' ' -f1)
        echo "$scope_result" > "$CACHE_DIR/search-scope-$cache_key.json"
        
        # Suggest optimized search strategy
        local suggestion=$(echo "$scope_result" | jq -r '.optimization_hint // empty')
        if [[ -n "$suggestion" ]]; then
            echo "Search optimization: $suggestion"
        fi
    fi
}

prepare_command_context() {
    local args="$1"
    local primary_tool="$2"
    local budget="$3"
    
    local command=$(echo "$args" | jq -r '.command // empty')
    
    if [[ -z "$command" ]]; then
        log_debug "No command found"
        return 0
    fi
    
    # Analyze if command might benefit from semantic context
    if echo "$command" | grep -qE "(find|grep|search|ls).*\.(go|js|ts|py|rs|java)"; then
        log_info "Command appears to be code-related, preparing semantic context"
        
        local context_result
        context_result=$(with_failsafe "get_project_semantic_overview" "$primary_tool" "$((budget / 2))")
        
        if [[ $? -eq 0 && -n "$context_result" ]]; then
            echo "$context_result" > "$CACHE_DIR/project-overview.json"
            echo "Project semantic overview prepared for command execution"
        fi
    fi
}

# Main execution
# Read input from stdin
input=$(cat)

# Parse tool information
tool_name=$(echo "$input" | jq -r '.tool // empty')
tool_args=$(echo "$input" | jq -r '.arguments // .params // {}')

if [[ -z "$tool_name" ]]; then
    log_debug "No tool name found, skipping context preparation"
    exit 0
fi

show_hook_status "PreToolUse" "started" "Context preparation for $tool_name"
log_info "Preparing context for tool: $tool_name"
output_visible "Preparing context for $tool_name tool" "info"

# Check if we have a cached routing decision
user_prompt_hash=$(get_current_prompt_hash)
routing_file="$CACHE_DIR/routing-$user_prompt_hash.json"

if [[ -f "$routing_file" ]]; then
    routing_decision=$(cat "$routing_file")
    log_debug "Found cached routing decision"
else
    log_debug "No cached routing decision, using defaults"
    routing_decision=$(generate_default_routing "$tool_name")
fi

# Extract routing parameters
primary_tool=$(echo "$routing_decision" | jq -r '.primary_tool // "serena"')
token_budget=$(echo "$routing_decision" | jq -r '.token_budget // 5000')
context_tool=$(echo "$routing_decision" | jq -r '.context_tool // "code2prompt"')

# Prepare semantic context based on tool being used
case "$tool_name" in
    "Read"|"Edit"|"MultiEdit"|"Write")
        prepare_file_context "$tool_args" "$primary_tool" "$token_budget"
        ;;
    "Grep"|"Search*")
        prepare_search_context "$tool_args" "$primary_tool" "$token_budget"
        ;;
    "Bash"|"Execute*")
        prepare_command_context "$tool_args" "$primary_tool" "$token_budget"
        ;;
    *)
        log_debug "No special context preparation for tool: $tool_name"
        ;;
esac

# Show performance metrics if enabled
if [[ "$SHOW_PERFORMANCE" == "true" ]]; then
    local end_time=$(date +%s%N)
    local duration=$((($end_time - ${START_TIME:-$end_time}) / 1000000))
    output_visible "Context preparation took ${duration}ms" "debug"
fi

log_info "Context preparation completed for $tool_name"
show_hook_status "PreToolUse" "completed" "Ready for $tool_name"

exit 0