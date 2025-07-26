#!/bin/bash
# logging-simple.sh - Simplified logging utilities compatible with bash 3.2

# Ensure log directory exists
LOG_DIR="$(dirname "$LOG_FILE")"
mkdir -p "$LOG_DIR"

# Log levels (simplified)
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_WARN=2
LOG_LEVEL_ERROR=3

# Get numeric log level
get_log_level_num() {
    case "${LOG_LEVEL:-info}" in
        "debug") echo "$LOG_LEVEL_DEBUG" ;;
        "info") echo "$LOG_LEVEL_INFO" ;;
        "warn") echo "$LOG_LEVEL_WARN" ;;
        "error") echo "$LOG_LEVEL_ERROR" ;;
        *) echo "$LOG_LEVEL_INFO" ;;
    esac
}

# Check if we should log this level
should_log() {
    local level="$1"
    local level_num
    case "$level" in
        "debug") level_num="$LOG_LEVEL_DEBUG" ;;
        "info") level_num="$LOG_LEVEL_INFO" ;;
        "warn") level_num="$LOG_LEVEL_WARN" ;;
        "error") level_num="$LOG_LEVEL_ERROR" ;;
        *) level_num="$LOG_LEVEL_INFO" ;;
    esac
    
    local current_level_num=$(get_log_level_num)
    [[ $level_num -ge $current_level_num ]]
}

# Basic logging functions
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if should_log "$level"; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

log_debug() {
    log_message "debug" "$1"
}

log_info() {
    log_message "info" "$1"
}

log_warn() {
    log_message "warn" "$1"
}

log_error() {
    log_message "error" "$1"
}

# Visibility functions for Claude Code chat
output_visible() {
    local message="$1"
    local level="${2:-info}"
    
    if [[ "$HOOK_VERBOSE" == "true" ]]; then
        case "$level" in
            "info") echo "🔍 $message" ;;
            "success") echo "✅ $message" ;;
            "warning") echo "⚠️ $message" ;;
            "error") echo "❌ $message" ;;
            "debug")
                if [[ "$HOOK_DEBUG" == "true" ]]; then
                    echo "🐛 $message"
                fi ;;
        esac
    fi
}

show_hook_status() {
    local hook_type="$1"
    local status="$2" 
    local operation="$3"
    
    if [[ "$HOOK_VERBOSE" == "true" ]]; then
        case "$status" in
            "started") echo "🔧 $hook_type: $operation" ;;
            "completed") echo "✅ $hook_type: $operation" ;;
            "failed") echo "❌ $hook_type: $operation" ;;
        esac
    fi
    
    log_info "$hook_type hook $status: $operation"
}

show_tool_selection() {
    local query_type="$1"
    local primary_tool="$2"
    local fallback_tools="$3"
    
    if [[ "$SHOW_TOOL_SELECTION" == "true" ]]; then
        echo "🎯 Query: $query_type → Primary: $primary_tool | Fallback: $fallback_tools"
    fi
    
    log_debug "Tool selection: query_type=$query_type, primary=$primary_tool, fallback=$fallback_tools"
}

show_performance() {
    local operation="$1"
    local tool="$2"
    local duration_ms="$3"
    local tokens_used="$4"
    
    if [[ "$SHOW_PERFORMANCE" == "true" ]]; then
        echo "⚡ $operation ($tool): ${duration_ms}ms, ${tokens_used} tokens"
    fi
    
    log_info "Performance: $operation ($tool): ${duration_ms}ms, ${tokens_used} tokens"
}