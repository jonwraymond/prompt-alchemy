#!/bin/bash
# failsafe.sh - Non-blocking, fail-safe workflow implementation

# Core failsafe execution function
with_failsafe() {
    local func_name="$1"
    shift
    local args=("$@")
    
    local max_retries=3
    local timeout=30
    local fallback_chain=("${SEMANTIC_FALLBACK_CHAIN[@]:-}")
    
    # Primary execution attempt
    if execute_with_timeout "$func_name" "$timeout" "${args[@]}"; then
        log_debug "Primary execution successful: $func_name"
        return 0
    fi
    
    log_warn "Primary execution failed: $func_name, attempting fallback"
    
    # Try fallback chain
    for fallback_tool in "${fallback_chain[@]}"; do
        log_debug "Attempting fallback with tool: $fallback_tool"
        
        # Modify function name to use fallback tool
        local fallback_func="${func_name}_fallback_${fallback_tool}"
        
        if type "$fallback_func" >/dev/null 2>&1; then
            if execute_with_timeout "$fallback_func" "$timeout" "${args[@]}"; then
                log_info "Fallback successful: $fallback_tool"
                return 0
            fi
        else
            # Generic fallback attempt
            if execute_generic_fallback "$func_name" "$fallback_tool" "${args[@]}"; then
                log_info "Generic fallback successful: $fallback_tool"
                return 0
            fi
        fi
    done
    
    # Final graceful degradation
    log_warn "All fallbacks failed for: $func_name, attempting graceful degradation"
    execute_graceful_degradation "$func_name" "${args[@]}"
}

execute_with_timeout() {
    local func_name="$1"
    local timeout="$2"
    shift 2
    local args=("$@")
    
    # Create a temporary file for the result
    local result_file=$(mktemp)
    local status_file=$(mktemp)
    
    # Execute function in background with timeout
    (
        if "$func_name" "${args[@]}" > "$result_file" 2>&1; then
            echo "0" > "$status_file"
        else
            echo "$?" > "$status_file"
        fi
    ) &
    
    local bg_pid=$!
    
    # Wait with timeout
    if timeout "$timeout" wait $bg_pid 2>/dev/null; then
        local exit_code=$(cat "$status_file" 2>/dev/null || echo "1")
        
        if [[ "$exit_code" == "0" ]]; then
            cat "$result_file"
            rm -f "$result_file" "$status_file"
            return 0
        fi
    else
        # Timeout occurred
        kill -9 $bg_pid 2>/dev/null || true
        log_warn "Function $func_name timed out after ${timeout}s"
    fi
    
    rm -f "$result_file" "$status_file"
    return 1
}

execute_generic_fallback() {
    local original_func="$1"
    local fallback_tool="$2"
    shift 2
    local args=("$@")
    
    log_debug "Executing generic fallback: $original_func with $fallback_tool"
    
    case "$original_func" in
        "get_file_semantic_context")
            generic_file_context_fallback "$fallback_tool" "${args[@]}"
            ;;
        "analyze_search_scope")
            generic_search_scope_fallback "$fallback_tool" "${args[@]}"
            ;;
        "get_project_semantic_overview")
            generic_project_overview_fallback "$fallback_tool" "${args[@]}"
            ;;
        *)
            log_warn "No generic fallback available for: $original_func"
            return 1
            ;;
    esac
}

execute_graceful_degradation() {
    local func_name="$1"
    shift
    local args=("$@")
    
    log_info "Executing graceful degradation for: $func_name"
    
    case "$func_name" in
        "get_file_semantic_context")
            graceful_file_context "${args[@]}"
            ;;
        "analyze_search_scope") 
            graceful_search_scope "${args[@]}"
            ;;
        "get_project_semantic_overview")
            graceful_project_overview "${args[@]}"
            ;;
        *)
            # Minimal fallback - just indicate the operation was attempted
            jq -n \
                --arg func "$func_name" \
                --arg status "degraded" \
                '{
                    function: $func,
                    status: $status,
                    message: "Operation completed with degraded functionality",
                    timestamp: now
                }'
            ;;
    esac
}

# Generic fallback implementations
generic_file_context_fallback() {
    local tool="$1"
    local file_path="$2"
    
    case "$tool" in
        "grep")
            # Use grep to find basic patterns
            local functions=$(grep -n "^[[:space:]]*\(func\|function\|def\|class\)" "$file_path" 2>/dev/null | head -10 || echo "")
            local imports=$(grep -n "^[[:space:]]*\(import\|from\|#include\)" "$file_path" 2>/dev/null | head -5 || echo "")
            
            jq -n \
                --arg file "$file_path" \
                --arg funcs "$functions" \
                --arg imports "$imports" \
                --arg tool "$tool" \
                '{
                    tool: $tool,
                    file_path: $file,
                    functions: $funcs,
                    imports: $imports,
                    analysis_type: "basic_grep",
                    estimated_tokens: 500
                }'
            ;;
        "basic")
            # Most basic file analysis
            local lines=$(wc -l < "$file_path" 2>/dev/null || echo "0")
            local size=$(wc -c < "$file_path" 2>/dev/null || echo "0")
            
            jq -n \
                --arg file "$file_path" \
                --argjson lines "$lines" \
                --argjson size "$size" \
                '{
                    tool: "basic",
                    file_path: $file,
                    line_count: $lines,
                    size_bytes: $size,
                    analysis_type: "minimal",
                    estimated_tokens: 100
                }'
            ;;
        *)
            return 1
            ;;
    esac
}

generic_search_scope_fallback() {
    local tool="$1"
    local pattern="$2"
    
    case "$tool" in
        "grep")
            # Estimate search complexity using grep
            local matches=$(grep -r "$pattern" . --include="*.go" --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | wc -l || echo "0")
            
            local complexity="low"
            if [[ $matches -gt 50 ]]; then
                complexity="high"
            elif [[ $matches -gt 10 ]]; then
                complexity="medium" 
            fi
            
            jq -n \
                --arg pattern "$pattern" \
                --argjson matches "$matches" \
                --arg complexity "$complexity" \
                --arg tool "$tool" \
                '{
                    tool: $tool,
                    pattern: $pattern,
                    estimated_matches: $matches,
                    complexity: $complexity,
                    optimization_hint: "Consider narrowing search scope",
                    estimated_tokens: 300
                }'
            ;;
        "basic")
            # Minimal pattern analysis
            jq -n \
                --arg pattern "$pattern" \
                '{
                    tool: "basic",
                    pattern: $pattern,
                    analysis_type: "minimal",
                    optimization_hint: "Use semantic tools for better analysis",
                    estimated_tokens: 50
                }'
            ;;
        *)
            return 1
            ;;
    esac
}

generic_project_overview_fallback() {
    local tool="$1"
    
    case "$tool" in
        "find")
            # Use find to get project structure
            local files=$(find . -type f -name "*.go" -o -name "*.js" -o -name "*.ts" -o -name "*.py" | head -20)
            local file_count=$(echo "$files" | wc -l)
            
            jq -n \
                --arg files "$files" \
                --argjson count "$file_count" \
                --arg tool "$tool" \
                '{
                    tool: $tool,
                    project_files: ($files | split("\n")),
                    file_count: $count,
                    analysis_type: "filesystem_only",
                    estimated_tokens: 1000
                }'
            ;;
        "basic")
            # Minimal project information
            local pwd_result=$(pwd)
            
            jq -n \
                --arg dir "$pwd_result" \
                '{
                    tool: "basic",
                    project_directory: $dir,
                    analysis_type: "minimal",
                    estimated_tokens: 50
                }'
            ;;
        *)
            return 1
            ;;
    esac
}

# Graceful degradation implementations
graceful_file_context() {
    local file_path="$1"
    
    # Absolute minimal file context
    if [[ -f "$file_path" ]]; then
        local lines=$(wc -l < "$file_path" 2>/dev/null || echo "0")
        local basename_result=$(basename "$file_path")
        
        jq -n \
            --arg file "$file_path" \
            --arg name "$basename_result" \
            --argjson lines "$lines" \
            '{
                status: "degraded",
                file_path: $file,
                file_name: $name,
                line_count: $lines,
                message: "Basic file information only",
                estimated_tokens: 30
            }'
    else
        jq -n \
            --arg file "$file_path" \
            '{
                status: "error",
                file_path: $file,
                message: "File not accessible",
                estimated_tokens: 20
            }'
    fi
}

graceful_search_scope() {
    local pattern="$1"
    
    jq -n \
        --arg pattern "$pattern" \
        '{
            status: "degraded",
            pattern: $pattern,
            message: "Search scope analysis unavailable",
            recommendation: "Proceed with caution",
            estimated_tokens: 25
        }'
}

graceful_project_overview() {
    local current_dir=$(pwd)
    local dir_name=$(basename "$current_dir")
    
    jq -n \
        --arg dir "$current_dir" \
        --arg name "$dir_name" \
        '{
            status: "degraded", 
            project_directory: $dir,
            project_name: $name,
            message: "Project overview unavailable",
            estimated_tokens: 30
        }'
}

# Health check functions
check_tool_health() {
    local tool="$1"
    
    case "$tool" in
        "serena")
            # Check if Serena MCP is responsive
            if command -v claude-mcp >/dev/null 2>&1; then
                if timeout 5 claude-mcp serena get_active_project >/dev/null 2>&1; then
                    echo "healthy"
                else
                    echo "unresponsive"
                fi
            else
                echo "unavailable"
            fi
            ;;
        "ast-grep")
            if command -v ast-grep >/dev/null 2>&1; then
                if timeout 5 ast-grep --version >/dev/null 2>&1; then
                    echo "healthy"
                else
                    echo "unresponsive"
                fi
            else
                echo "unavailable"
            fi
            ;;
        "code2prompt")
            if command -v code2prompt >/dev/null 2>&1; then
                if timeout 5 code2prompt --version >/dev/null 2>&1; then
                    echo "healthy"
                else
                    echo "unresponsive"
                fi
            else
                echo "unavailable"
            fi
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Circuit breaker implementation
check_circuit_breaker() {
    local tool="$1"
    local circuit_file="$CACHE_DIR/circuit-$tool"
    
    if [[ -f "$circuit_file" ]]; then
        local last_failure=$(cat "$circuit_file")
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_failure))
        
        # Circuit breaker timeout: 5 minutes
        if [[ $time_diff -lt 300 ]]; then
            log_debug "Circuit breaker active for $tool (${time_diff}s ago)"
            return 1
        else
            # Reset circuit breaker
            rm -f "$circuit_file"
        fi
    fi
    
    return 0
}

trip_circuit_breaker() {
    local tool="$1"
    local circuit_file="$CACHE_DIR/circuit-$tool"
    
    echo "$(date +%s)" > "$circuit_file"
    log_warn "Circuit breaker tripped for $tool"
}

# Recovery functions  
attempt_tool_recovery() {
    local tool="$1"
    
    log_info "Attempting recovery for tool: $tool"
    
    case "$tool" in
        "serena")
            # Try to restart Serena MCP connection
            if command -v claude-mcp >/dev/null 2>&1; then
                timeout 10 claude-mcp serena restart_language_server >/dev/null 2>&1 || true
            fi
            ;;
        "ast-grep")
            # ast-grep is stateless, no recovery needed
            ;;
        "code2prompt")
            # code2prompt is stateless, no recovery needed
            ;;
    esac
    
    # Verify recovery
    local health_status=$(check_tool_health "$tool")
    if [[ "$health_status" == "healthy" ]]; then
        log_info "Recovery successful for $tool"
        return 0
    else
        log_warn "Recovery failed for $tool"
        return 1
    fi
}