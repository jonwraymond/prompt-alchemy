#!/bin/bash
# logging.sh - Logging utilities for semantic search hooks

# Ensure log directory exists
LOG_DIR="$(dirname "$LOG_FILE")"
mkdir -p "$LOG_DIR"

# Log levels (numeric for comparison)
declare -A LOG_LEVELS=(
    ["debug"]=0
    ["info"]=1
    ["warn"]=2
    ["error"]=3
)

# Get numeric log level
get_log_level_num() {
    echo "${LOG_LEVELS[${LOG_LEVEL:-info}]:-1}"
}

# Core logging function
write_log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local caller="${BASH_SOURCE[2]##*/}:${BASH_LINENO[1]}"
    
    # Check if we should log this level
    local level_num="${LOG_LEVELS[$level]:-1}"
    local current_level_num=$(get_log_level_num)
    
    if [[ $level_num -ge $current_level_num ]]; then
        # Format: [TIMESTAMP] [LEVEL] [CALLER] MESSAGE
        printf "[%s] [%s] [%s] %s\n" "$timestamp" "${level^^}" "$caller" "$message" >> "$LOG_FILE"
        
        # Also output to stderr for warn/error
        if [[ "$level" == "warn" || "$level" == "error" ]]; then
            printf "[%s] %s\n" "${level^^}" "$message" >&2
        fi
    fi
}

# Convenience logging functions
log_debug() {
    write_log "debug" "$1"
}

log_info() {
    write_log "info" "$1"
}

log_warn() {
    write_log "warn" "$1"
}

log_error() {
    write_log "error" "$1"
}

# Structured logging for performance metrics
log_performance() {
    local operation="$1"
    local duration="$2"
    local tool="$3"
    local status="${4:-success}"
    local tokens_used="${5:-0}"
    
    local perf_data=$(jq -n \
        --arg op "$operation" \
        --argjson duration "$duration" \
        --arg tool "$tool" \
        --arg status "$status" \
        --argjson tokens "$tokens_used" \
        '{
            timestamp: now,
            operation: $op,
            duration_ms: $duration,
            tool: $tool,
            status: $status,
            tokens_used: $tokens
        }')
    
    # Write to performance log
    echo "$perf_data" >> "$CACHE_DIR/performance.jsonl"
    
    # Also log as info
    log_info "Performance: $operation ($tool) - ${duration}ms, $tokens_used tokens, $status"
}

# Log tool availability and health
log_tool_status() {
    local tool="$1"
    local status="$2"
    local details="${3:-}"
    
    local status_data=$(jq -n \
        --arg tool "$tool" \
        --arg status "$status" \
        --arg details "$details" \
        '{
            timestamp: now,
            tool: $tool,
            status: $status,
            details: $details
        }')
    
    echo "$status_data" >> "$CACHE_DIR/tool-status.jsonl"
    
    case "$status" in
        "healthy")
            log_debug "Tool status: $tool is $status"
            ;;
        "degraded"|"unresponsive")
            log_warn "Tool status: $tool is $status - $details"
            ;;
        "unavailable")
            log_error "Tool status: $tool is $status - $details"
            ;;
    esac
}

# Log semantic search operations
log_semantic_operation() {
    local operation_type="$1"
    local tool_used="$2"
    local input_params="$3"
    local result_summary="$4"
    local token_usage="$5"
    
    local operation_data=$(jq -n \
        --arg type "$operation_type" \
        --arg tool "$tool_used" \
        --argjson params "$input_params" \
        --arg result "$result_summary" \
        --argjson tokens "$token_usage" \
        '{
            timestamp: now,
            operation_type: $type,
            tool_used: $tool,
            input_params: $params,
            result_summary: $result,
            token_usage: $tokens
        }')
    
    echo "$operation_data" >> "$CACHE_DIR/semantic-operations.jsonl"
    
    log_info "Semantic operation: $operation_type using $tool_used - $result_summary ($token_usage tokens)"
}

# Log failsafe activations
log_failsafe_activation() {
    local primary_tool="$1"
    local fallback_tool="$2"
    local reason="$3"
    local success="${4:-false}"
    
    local failsafe_data=$(jq -n \
        --arg primary "$primary_tool" \
        --arg fallback "$fallback_tool" \
        --arg reason "$reason" \
        --argjson success "$success" \
        '{
            timestamp: now,
            primary_tool: $primary,
            fallback_tool: $fallback,
            activation_reason: $reason,
            fallback_success: $success
        }')
    
    echo "$failsafe_data" >> "$CACHE_DIR/failsafe-activations.jsonl"
    
    if [[ "$success" == "true" ]]; then
        log_info "Failsafe activation: $primary_tool -> $fallback_tool successful ($reason)"
    else
        log_warn "Failsafe activation: $primary_tool -> $fallback_tool failed ($reason)"
    fi
}

# Generate log summaries
generate_log_summary() {
    local hours="${1:-24}"  # Default to last 24 hours
    local since_time=$(date -d "$hours hours ago" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v-${hours}H '+%Y-%m-%d %H:%M:%S')
    
    # Count log entries by level since specified time
    local summary=$(awk -v since="$since_time" '
        $0 ~ since {start=1}
        start && /\[DEBUG\]/ {debug++}
        start && /\[INFO\]/ {info++}
        start && /\[WARN\]/ {warn++}
        start && /\[ERROR\]/ {error++}
        END {
            printf "{\"debug\":%d,\"info\":%d,\"warn\":%d,\"error\":%d}\n", 
                   debug+0, info+0, warn+0, error+0
        }
    ' "$LOG_FILE" 2>/dev/null || echo '{"debug":0,"info":0,"warn":0,"error":0}')
    
    # Performance summary
    local perf_summary="{}"
    if [[ -f "$CACHE_DIR/performance.jsonl" ]]; then
        perf_summary=$(tail -100 "$CACHE_DIR/performance.jsonl" | jq -s '{
            total_operations: length,
            avg_duration: (map(.duration_ms) | add / length // 0),
            success_rate: (map(select(.status == "success")) | length) / length,
            operations_by_tool: (group_by(.tool) | map({
                tool: .[0].tool,
                count: length,
                avg_duration: (map(.duration_ms) | add / length)
            }))
        }' 2>/dev/null || echo '{}')
    fi
    
    # Tool status summary
    local tool_summary="{}"
    if [[ -f "$CACHE_DIR/tool-status.jsonl" ]]; then
        tool_summary=$(tail -50 "$CACHE_DIR/tool-status.jsonl" | jq -s '
            group_by(.tool) | map({
                tool: .[0].tool,
                current_status: .[-1].status,
                status_changes: length
            })' 2>/dev/null || echo '[]')
    fi
    
    # Combine summaries
    jq -n \
        --argjson logs "$summary" \
        --argjson perf "$perf_summary" \
        --argjson tools "$tool_summary" \
        --arg period "${hours}h" \
        '{
            summary_period: $period,
            generated_at: now,
            log_counts: $logs,
            performance: $perf,
            tool_status: $tools
        }'
}

# Clean old logs
cleanup_logs() {
    local retention_days="${1:-7}"  # Default 7 days
    
    # Rotate main log file if it's too large (>10MB)
    if [[ -f "$LOG_FILE" ]] && [[ $(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null || echo 0) -gt 10485760 ]]; then
        local backup_file="${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        mv "$LOG_FILE" "$backup_file"
        gzip "$backup_file" 2>/dev/null || true
        log_info "Rotated log file to $backup_file.gz"
    fi
    
    # Clean old JSONL files
    find "$CACHE_DIR" -name "*.jsonl" -mtime +$retention_days -delete 2>/dev/null || true
    
    # Clean old backup logs
    find "$LOG_DIR" -name "*.log.*.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    log_info "Cleaned logs older than $retention_days days"
}

# Error context logging
log_error_context() {
    local error_message="$1"
    local operation="$2"
    local context_data="$3"
    
    local error_context=$(jq -n \
        --arg error "$error_message" \
        --arg op "$operation" \
        --argjson context "$context_data" \
        '{
            timestamp: now,
            error_message: $error,
            operation: $op,
            context: $context,
            environment: {
                pwd: env.PWD,
                user: env.USER,
                shell: env.SHELL
            }
        }')
    
    echo "$error_context" >> "$CACHE_DIR/error-contexts.jsonl"
    
    log_error "Operation failed: $operation - $error_message"
}

# Hook execution logging
log_hook_execution() {
    local hook_type="$1"
    local hook_command="$2"
    local duration="$3"
    local exit_code="$4"
    local output_size="${5:-0}"
    
    local hook_data=$(jq -n \
        --arg type "$hook_type" \
        --arg command "$hook_command" \
        --argjson duration "$duration" \
        --argjson exit_code "$exit_code" \
        --argjson output_size "$output_size" \
        '{
            timestamp: now,
            hook_type: $type,
            command: $command,
            duration_ms: $duration,
            exit_code: $exit_code,
            output_size_bytes: $output_size,
            success: ($exit_code == 0)
        }')
    
    echo "$hook_data" >> "$CACHE_DIR/hook-executions.jsonl"
    
    if [[ $exit_code -eq 0 ]]; then
        log_info "Hook execution: $hook_type completed successfully (${duration}ms)"
    else
        log_warn "Hook execution: $hook_type failed with exit code $exit_code (${duration}ms)"
    fi
}

# Initialize logging
init_logging() {
    # Ensure log file is writable
    if ! touch "$LOG_FILE" 2>/dev/null; then
        echo "Warning: Cannot write to log file $LOG_FILE" >&2
        LOG_FILE="/tmp/semantic-search-hooks.log"
        echo "Using fallback log file: $LOG_FILE" >&2
    fi
    
    # Create JSONL log directory
    mkdir -p "$CACHE_DIR"
    
    # Log initialization
    log_info "Semantic search hooks logging initialized (level: $LOG_LEVEL)"
    
    # Schedule log cleanup (if running interactively)
    if [[ -t 0 ]]; then
        # Clean up logs older than 7 days on initialization
        cleanup_logs 7 >/dev/null 2>&1 &
    fi
}

# Visible output functions for Claude Code chat
output_visible() {
    local message="$1"
    local level="${2:-info}"
    
    # Only output if visibility is enabled
    if [[ "$HOOK_VERBOSE" == "true" ]]; then
        case "$level" in
            "info")
                echo "🔍 $message"
                ;;
            "success")
                echo "✅ $message"
                ;;
            "warning")
                echo "⚠️ $message"
                ;;
            "error")
                echo "❌ $message"
                ;;
            "debug")
                if [[ "$HOOK_DEBUG" == "true" ]]; then
                    echo "🐛 $message"
                fi
                ;;
            *)
                echo "$message"
                ;;
        esac
    fi
    
    # Always log to file
    write_log "$level" "$message"
}

# Tool selection visibility
show_tool_selection() {
    local operation="$1"
    local primary_tool="$2"
    local fallback_tools="$3"
    
    if [[ "$SHOW_TOOL_SELECTION" == "true" ]]; then
        echo "🛠️ Semantic Search: $operation using $primary_tool"
        if [[ -n "$fallback_tools" ]]; then
            echo "   └── Fallbacks: $fallback_tools"
        fi
    fi
}

# Performance visibility
show_performance() {
    local operation="$1"
    local duration="$2"
    local tokens="$3"
    local tool="$4"
    
    if [[ "$SHOW_PERFORMANCE" == "true" ]]; then
        echo "⚡ Performance: $operation ($tool) - ${duration}ms, $tokens tokens"
    fi
}

# Hook execution status
show_hook_status() {
    local hook_type="$1"
    local status="$2"
    local details="$3"
    
    case "$status" in
        "started")
            output_visible "Hook $hook_type activated" "info"
            ;;
        "completed")
            output_visible "Hook $hook_type completed: $details" "success"
            ;;
        "failed")
            output_visible "Hook $hook_type failed: $details" "error"
            ;;
        "degraded")
            output_visible "Hook $hook_type running in degraded mode: $details" "warning"
            ;;
    esac
}

# Quick status check function
check_hook_status() {
    local recent_entries=$(tail -20 "$LOG_FILE" 2>/dev/null | grep -E "(UserPromptSubmit|PreToolUse|PostToolUse)" | tail -5)
    
    if [[ -n "$recent_entries" ]]; then
        echo "🔍 Recent Hook Activity:"
        echo "$recent_entries" | while read line; do
            echo "   $line"
        done
    else
        echo "⚠️ No recent hook activity found"
    fi
    
    # Tool health
    local available_tools=$(check_tool_availability)
    echo "🛠️ Available Tools: $available_tools"
}

# Call initialization
init_logging