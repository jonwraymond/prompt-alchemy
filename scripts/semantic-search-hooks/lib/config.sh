#!/bin/bash
# config.sh - Configuration management for semantic search hooks

# Default configuration
SEMANTIC_SEARCH_CONFIG_VERSION="1.0.0"

# Tool priorities (higher number = higher priority)
declare -A TOOL_PRIORITIES=(
    ["serena"]=10
    ["ast-grep"]=7
    ["code2prompt"]=5
    ["grep"]=3
    ["basic"]=1
)

# Default fallback chain
SEMANTIC_FALLBACK_CHAIN=("ast-grep" "grep" "basic")

# Token budgets by operation type
declare -A TOKEN_BUDGETS=(
    ["file_context"]=3000
    ["search_scope"]=2000
    ["project_overview"]=8000
    ["simple_query"]=1000
    ["complex_query"]=10000
)

# Timeout settings (seconds)
declare -A TIMEOUTS=(
    ["serena"]=30
    ["ast-grep"]=15
    ["code2prompt"]=45
    ["grep"]=10
    ["basic"]=5
)

# Cache settings
CACHE_TTL=3600  # 1 hour
CACHE_MAX_SIZE=100  # Max cached items per type

# Logging configuration
LOG_LEVEL="${SEMANTIC_SEARCH_LOG_LEVEL:-info}"
LOG_FILE="${SEMANTIC_SEARCH_LOG_FILE:-$HOME/.claude/semantic-search.log}"

# Visibility settings - Show hook activity in Claude Code chat
HOOK_VERBOSE="${HOOK_VERBOSE:-false}"  # Set to "true" to see hook activity
HOOK_DEBUG="${HOOK_DEBUG:-false}"      # Set to "true" for detailed debugging
SHOW_TOOL_SELECTION="${SHOW_TOOL_SELECTION:-false}"  # Show which tools are chosen
SHOW_PERFORMANCE="${SHOW_PERFORMANCE:-false}"        # Show timing and token usage

# Performance thresholds
MAX_FILE_SIZE=1048576  # 1MB
MAX_PROJECT_FILES=1000
TOKEN_WARNING_THRESHOLD=8000

# Load user configuration if it exists
USER_CONFIG_FILE="$HOME/.claude/semantic-search-config.sh"
if [[ -f "$USER_CONFIG_FILE" ]]; then
    source "$USER_CONFIG_FILE"
fi

# Project-specific configuration
PROJECT_CONFIG_FILE="./.claude/semantic-search-config.sh"
if [[ -f "$PROJECT_CONFIG_FILE" ]]; then
    source "$PROJECT_CONFIG_FILE"
fi

# Validation functions
validate_config() {
    local errors=0
    
    # Validate tool priorities
    for tool in "${!TOOL_PRIORITIES[@]}"; do
        if [[ ! "${TOOL_PRIORITIES[$tool]}" =~ ^[0-9]+$ ]]; then
            echo "Error: Invalid priority for $tool: ${TOOL_PRIORITIES[$tool]}" >&2
            ((errors++))
        fi
    done
    
    # Validate token budgets
    for operation in "${!TOKEN_BUDGETS[@]}"; do
        if [[ ! "${TOKEN_BUDGETS[$operation]}" =~ ^[0-9]+$ ]]; then
            echo "Error: Invalid token budget for $operation: ${TOKEN_BUDGETS[$operation]}" >&2
            ((errors++))
        fi
    done
    
    # Validate cache settings
    if [[ ! "$CACHE_TTL" =~ ^[0-9]+$ ]] || [[ $CACHE_TTL -lt 60 ]]; then
        echo "Error: Invalid cache TTL: $CACHE_TTL (minimum 60 seconds)" >&2
        ((errors++))
    fi
    
    return $errors
}

# Configuration utility functions
get_tool_priority() {
    local tool="$1"
    echo "${TOOL_PRIORITIES[$tool]:-0}"
}

get_token_budget() {
    local operation="$1"
    echo "${TOKEN_BUDGETS[$operation]:-5000}"
}

get_timeout() {
    local tool="$1"
    echo "${TIMEOUTS[$tool]:-30}"
}

set_tool_priority() {
    local tool="$1"
    local priority="$2"
    
    if [[ "$priority" =~ ^[0-9]+$ ]]; then
        TOOL_PRIORITIES["$tool"]="$priority"
    else
        echo "Error: Priority must be a number" >&2
        return 1
    fi
}

# Dynamic configuration adjustment
adjust_config_for_performance() {
    local current_load="$1"  # 0-100
    
    if [[ $current_load -gt 80 ]]; then
        # High load - reduce timeouts and token budgets
        for tool in "${!TIMEOUTS[@]}"; do
            TIMEOUTS["$tool"]=$((TIMEOUTS["$tool"] / 2))
        done
        
        for operation in "${!TOKEN_BUDGETS[@]}"; do
            TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 2 / 3))
        done
        
        log_info "Performance adjustment: Reduced timeouts and token budgets due to high load ($current_load%)"
    elif [[ $current_load -lt 30 ]]; then
        # Low load - can be more generous
        for tool in "${!TIMEOUTS[@]}"; do
            TIMEOUTS["$tool"]=$((TIMEOUTS["$tool"] * 3 / 2))
        done
        
        log_debug "Performance adjustment: Increased timeouts due to low load ($current_load%)"
    fi
}

# Project-specific configuration detection
detect_project_config() {
    local project_dir="${1:-$(pwd)}"
    
    # Go project
    if [[ -f "$project_dir/go.mod" ]]; then
        TOOL_PRIORITIES["serena"]=15  # Go has excellent Serena support
        TOOL_PRIORITIES["ast-grep"]=10
        SEMANTIC_FALLBACK_CHAIN=("ast-grep" "grep")
        return 0
    fi
    
    # Node.js project
    if [[ -f "$project_dir/package.json" ]]; then
        TOOL_PRIORITIES["ast-grep"]=12  # JavaScript/TypeScript
        TOOL_PRIORITIES["serena"]=8
        return 0
    fi
    
    # Python project
    if [[ -f "$project_dir/requirements.txt" ]] || [[ -f "$project_dir/pyproject.toml" ]]; then
        TOOL_PRIORITIES["serena"]=12
        TOOL_PRIORITIES["ast-grep"]=9
        return 0
    fi
    
    # Rust project
    if [[ -f "$project_dir/Cargo.toml" ]]; then
        TOOL_PRIORITIES["serena"]=14
        TOOL_PRIORITIES["ast-grep"]=11
        return 0
    fi
    
    # Generic project
    return 1
}

# Environment-specific adjustments
adjust_for_environment() {
    local env_type="$1"  # development, testing, production
    
    case "$env_type" in
        "development")
            # More aggressive timeouts and higher token budgets for dev
            for tool in "${!TIMEOUTS[@]}"; do
                TIMEOUTS["$tool"]=$((TIMEOUTS["$tool"] * 2))
            done
            
            for operation in "${!TOKEN_BUDGETS[@]}"; do
                TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 3 / 2))
            done
            ;;
        "testing")
            # Balanced settings
            ;;
        "production")
            # Conservative settings
            for operation in "${!TOKEN_BUDGETS[@]}"; do
                TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 2 / 3))
            done
            
            CACHE_TTL=$((CACHE_TTL * 2))  # Longer cache in production
            ;;
    esac
}

# Configuration export/import
export_config() {
    local output_file="$1"
    
    {
        echo "# Semantic Search Hooks Configuration"
        echo "# Generated on $(date)"
        echo "SEMANTIC_SEARCH_CONFIG_VERSION='$SEMANTIC_SEARCH_CONFIG_VERSION'"
        echo
        
        echo "# Tool Priorities"
        echo "declare -A TOOL_PRIORITIES=("
        for tool in "${!TOOL_PRIORITIES[@]}"; do
            echo "    [\"$tool\"]=${TOOL_PRIORITIES[$tool]}"
        done
        echo ")"
        echo
        
        echo "# Token Budgets"
        echo "declare -A TOKEN_BUDGETS=("
        for operation in "${!TOKEN_BUDGETS[@]}"; do
            echo "    [\"$operation\"]=${TOKEN_BUDGETS[$operation]}"
        done
        echo ")"
        echo
        
        echo "# Timeouts"
        echo "declare -A TIMEOUTS=("
        for tool in "${!TIMEOUTS[@]}"; do
            echo "    [\"$tool\"]=${TIMEOUTS[$tool]}"
        done
        echo ")"
        echo
        
        echo "# Other Settings"
        echo "SEMANTIC_FALLBACK_CHAIN=($(printf '"%s" ' "${SEMANTIC_FALLBACK_CHAIN[@]}"))"
        echo "CACHE_TTL=$CACHE_TTL"
        echo "CACHE_MAX_SIZE=$CACHE_MAX_SIZE"
        echo "LOG_LEVEL='$LOG_LEVEL'"
        
    } > "$output_file"
}

# Initialize configuration
init_config() {
    # Detect project type and adjust accordingly
    detect_project_config
    
    # Adjust for current environment
    local env_type="${SEMANTIC_SEARCH_ENV:-development}"
    adjust_for_environment "$env_type"
    
    # Validate final configuration
    if ! validate_config; then
        echo "Configuration validation failed" >&2
        return 1
    fi
    
    log_debug "Configuration initialized successfully"
    return 0
}

# Call initialization
init_config