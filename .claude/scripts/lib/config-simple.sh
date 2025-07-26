#!/bin/bash
# config-simple.sh - Simplified configuration management for bash 3.2 compatibility

# Default configuration
SEMANTIC_SEARCH_CONFIG_VERSION="1.0.0"

# Tool priorities (higher number = higher priority)
TOOL_PRIORITY_SERENA=10
TOOL_PRIORITY_AST_GREP=7
TOOL_PRIORITY_CODE2PROMPT=5
TOOL_PRIORITY_GREP=3
TOOL_PRIORITY_BASIC=1

# Default fallback chain
SEMANTIC_FALLBACK_CHAIN=("ast-grep" "grep" "basic")

# Token budgets by operation type
TOKEN_BUDGET_FILE_CONTEXT=3000
TOKEN_BUDGET_SEARCH_SCOPE=2000
TOKEN_BUDGET_PROJECT_OVERVIEW=8000
TOKEN_BUDGET_SIMPLE_QUERY=1000
TOKEN_BUDGET_COMPLEX_QUERY=10000

# Timeout settings (seconds)
TIMEOUT_SERENA=30
TIMEOUT_AST_GREP=15
TIMEOUT_CODE2PROMPT=45
TIMEOUT_GREP=10
TIMEOUT_BASIC=5

# Cache settings
CACHE_TTL=3600  # 1 hour
CACHE_MAX_SIZE=100  # Max cached items per type
CACHE_DIR="${CACHE_DIR:-$HOME/.claude/semantic-search-cache}"

# Log settings
LOG_FILE="${LOG_FILE:-$HOME/.claude/semantic-search.log}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Visibility settings - Show hook activity in Claude Code chat
HOOK_VERBOSE="${HOOK_VERBOSE:-false}"  # Set to "true" to see hook activity
HOOK_DEBUG="${HOOK_DEBUG:-false}"      # Set to "true" for detailed debugging
SHOW_TOOL_SELECTION="${SHOW_TOOL_SELECTION:-false}"  # Show which tools are chosen
SHOW_PERFORMANCE="${SHOW_PERFORMANCE:-false}"        # Show timing and token usage

# Tool availability detection
check_tool_priority() {
    local tool="$1"
    case "$tool" in
        "serena") echo "$TOOL_PRIORITY_SERENA" ;;
        "ast-grep") echo "$TOOL_PRIORITY_AST_GREP" ;;
        "code2prompt") echo "$TOOL_PRIORITY_CODE2PROMPT" ;;
        "grep") echo "$TOOL_PRIORITY_GREP" ;;
        "basic") echo "$TOOL_PRIORITY_BASIC" ;;
        *) echo "0" ;;
    esac
}

get_token_budget() {
    local operation="$1"
    case "$operation" in
        "file_context") echo "$TOKEN_BUDGET_FILE_CONTEXT" ;;
        "search_scope") echo "$TOKEN_BUDGET_SEARCH_SCOPE" ;;
        "project_overview") echo "$TOKEN_BUDGET_PROJECT_OVERVIEW" ;;
        "simple_query") echo "$TOKEN_BUDGET_SIMPLE_QUERY" ;;
        "complex_query") echo "$TOKEN_BUDGET_COMPLEX_QUERY" ;;
        *) echo "5000" ;;
    esac
}

get_tool_timeout() {
    local tool="$1"
    case "$tool" in
        "serena") echo "$TIMEOUT_SERENA" ;;
        "ast-grep") echo "$TIMEOUT_AST_GREP" ;;
        "code2prompt") echo "$TIMEOUT_CODE2PROMPT" ;;
        "grep") echo "$TIMEOUT_GREP" ;;
        "basic") echo "$TIMEOUT_BASIC" ;;
        *) echo "30" ;;
    esac
}

# Load user configuration if available
if [[ -f "$HOME/.claude/semantic-search-config.sh" ]]; then
    source "$HOME/.claude/semantic-search-config.sh"
fi

# Initialize configuration
init_config() {
    # Ensure required directories exist
    mkdir -p "$CACHE_DIR"
    
    # Setup log file
    touch "$LOG_FILE"
    
    return 0
}