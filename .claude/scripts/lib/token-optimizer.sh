#!/bin/bash
# token-optimizer.sh - Token usage optimization and management

# Token estimation functions
estimate_tokens() {
    local text="$1"
    local estimation_method="${2:-rough}"
    
    case "$estimation_method" in
        "rough")
            # Rough estimation: ~4 characters per token
            local char_count=${#text}
            echo $((char_count / 4))
            ;;
        "word_based")
            # More accurate: ~0.75 tokens per word
            local word_count=$(echo "$text" | wc -w)
            echo $((word_count * 3 / 4))
            ;;
        "precise")
            # Use tiktoken if available
            if command -v tiktoken >/dev/null 2>&1; then
                echo "$text" | tiktoken count 2>/dev/null || estimate_tokens "$text" "word_based"
            else
                estimate_tokens "$text" "word_based"
            fi
            ;;
        *)
            estimate_tokens "$text" "rough"
            ;;
    esac
}

# Context-aware token budgeting
allocate_token_budget() {
    local total_budget="$1"
    local operation_type="$2"
    local complexity_score="${3:-3}"  # 1-5 scale
    
    # Base allocations by operation type
    local context_ratio search_ratio result_ratio
    
    case "$operation_type" in
        "file_analysis")
            context_ratio=30  # 30% for context
            search_ratio=50   # 50% for search/analysis
            result_ratio=20   # 20% for results
            ;;
        "project_overview")
            context_ratio=20
            search_ratio=60
            result_ratio=20
            ;;
        "code_search")
            context_ratio=25
            search_ratio=55
            result_ratio=20
            ;;
        "debugging")
            context_ratio=35
            search_ratio=45
            result_ratio=20
            ;;
        *)
            context_ratio=25
            search_ratio=50
            result_ratio=25
            ;;
    esac
    
    # Adjust based on complexity
    if [[ $complexity_score -gt 3 ]]; then
        # More complex operations need more context
        context_ratio=$((context_ratio + 10))
        search_ratio=$((search_ratio - 5))
        result_ratio=$((result_ratio - 5))
    elif [[ $complexity_score -lt 3 ]]; then
        # Simpler operations can use less context
        context_ratio=$((context_ratio - 5))
        search_ratio=$((search_ratio + 5))
    fi
    
    # Calculate actual allocations
    local context_budget=$((total_budget * context_ratio / 100))
    local search_budget=$((total_budget * search_ratio / 100))
    local result_budget=$((total_budget * result_ratio / 100))
    
    # Output JSON allocation
    jq -n \
        --argjson total "$total_budget" \
        --argjson context "$context_budget" \
        --argjson search "$search_budget" \
        --argjson result "$result_budget" \
        --arg operation "$operation_type" \
        --argjson complexity "$complexity_score" \
        '{
            total_budget: $total,
            context_budget: $context,
            search_budget: $search,
            result_budget: $result,
            operation_type: $operation,
            complexity_score: $complexity,
            allocation_ratios: {
                context: ($context * 100 / $total),
                search: ($search * 100 / $total),
                result: ($result * 100 / $total)
            }
        }'
}

# Progressive content filtering
filter_content_by_budget() {
    local content="$1"
    local budget="$2"
    local content_type="${3:-text}"
    
    local estimated_tokens=$(estimate_tokens "$content" "word_based")
    
    if [[ $estimated_tokens -le $budget ]]; then
        # Content fits within budget
        echo "$content"
        return 0
    fi
    
    log_debug "Content exceeds budget ($estimated_tokens > $budget), applying filters"
    
    case "$content_type" in
        "file_content")
            filter_file_content "$content" "$budget"
            ;;
        "search_results")
            filter_search_results "$content" "$budget"
            ;;
        "json_data")
            filter_json_data "$content" "$budget"
            ;;
        *)
            # Generic text truncation
            filter_generic_text "$content" "$budget"
            ;;
    esac
}

filter_file_content() {
    local content="$1"
    local budget="$2"
    
    # Priority order for file content:
    # 1. Function/class definitions
    # 2. Important comments (TODO, FIXME, etc.)
    # 3. Imports/includes
    # 4. Other content
    
    local filtered_content=""
    local current_tokens=0
    
    # Extract and prioritize functions/classes
    local functions=$(echo "$content" | grep -n "^[[:space:]]*\(func\|function\|def\|class\|interface\|type\)" | head -20)
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            local line_tokens=$(estimate_tokens "$line")
            if [[ $((current_tokens + line_tokens)) -le $budget ]]; then
                filtered_content="$filtered_content$line\n"
                current_tokens=$((current_tokens + line_tokens))
            else
                break
            fi
        fi
    done <<< "$functions"
    
    # Add imports if budget allows
    if [[ $current_tokens -lt $((budget * 8 / 10)) ]]; then
        local imports=$(echo "$content" | grep -n "^[[:space:]]*\(import\|from\|#include\|use\)" | head -10)
        
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                local line_tokens=$(estimate_tokens "$line")
                if [[ $((current_tokens + line_tokens)) -le $budget ]]; then
                    filtered_content="$filtered_content$line\n"
                    current_tokens=$((current_tokens + line_tokens))
                else
                    break
                fi
            fi
        done <<< "$imports"
    fi
    
    # Add metadata
    local metadata="[Filtered content: $current_tokens/$budget tokens, focusing on key definitions]\n"
    echo -e "$metadata$filtered_content"
}

filter_search_results() {
    local content="$1"
    local budget="$2"
    
    # For search results, prioritize by relevance and reduce context
    local lines_array=()
    while IFS= read -r line; do
        lines_array+=("$line")
    done <<< "$content"
    
    local filtered_lines=()
    local current_tokens=0
    
    # Sort by relevance (lines with matches first)
    for line in "${lines_array[@]}"; do
        # Reduce context for each line
        local simplified_line=$(echo "$line" | cut -c1-100)
        local line_tokens=$(estimate_tokens "$simplified_line")
        
        if [[ $((current_tokens + line_tokens)) -le $budget ]]; then
            filtered_lines+=("$simplified_line")
            current_tokens=$((current_tokens + line_tokens))
        else
            break
        fi
    done
    
    printf "%s\n" "${filtered_lines[@]}"
    echo "[Results truncated to fit $current_tokens/$budget token budget]"
}

filter_json_data() {
    local content="$1"
    local budget="$2"
    
    # For JSON data, remove less important fields and truncate arrays
    local filtered_json
    
    if ! filtered_json=$(echo "$content" | jq -c '{
        # Keep essential fields
        tool: .tool,
        status: .status,
        file_path: .file_path,
        function_count: .function_count,
        symbol_count: .symbol_count,
        estimated_tokens: .estimated_tokens,
        # Truncate arrays
        symbols: (.symbols[:5] // []),
        functions: (.functions[:5] // []),
        # Remove verbose fields
        } | del(.content_preview, .raw_output, .detailed_analysis)' 2>/dev/null); then
        # If JSON parsing fails, fall back to generic text filtering
        filter_generic_text "$content" "$budget"
        return
    fi
    
    local tokens=$(estimate_tokens "$filtered_json")
    
    if [[ $tokens -le $budget ]]; then
        echo "$filtered_json"
    else
        # Further reduce by removing more fields
        echo "$filtered_json" | jq -c '{
            tool: .tool,
            status: .status,
            file_path: .file_path,
            estimated_tokens: .estimated_tokens
        }'
    fi
}

filter_generic_text() {
    local content="$1"
    local budget="$2"
    
    # Simple truncation based on character count
    local max_chars=$((budget * 4))  # Rough 4 chars per token
    
    if [[ ${#content} -le $max_chars ]]; then
        echo "$content"
    else
        echo "${content:0:$max_chars}..."
        echo "[Content truncated to fit token budget]"
    fi
}

# Token usage tracking
track_token_usage() {
    local operation="$1"
    local actual_tokens="$2"
    local budget="$3"
    local efficiency="$4"  # tokens_used / budget
    
    # Log to token usage file
    local usage_file="$CACHE_DIR/token-usage.jsonl"
    
    jq -n \
        --arg op "$operation" \
        --argjson actual "$actual_tokens" \
        --argjson budget "$budget" \
        --argjson efficiency "$efficiency" \
        '{
            timestamp: now,
            operation: $op,
            actual_tokens: $actual,
            budget_tokens: $budget,
            efficiency: $efficiency,
            over_budget: ($actual > $budget)
        }' >> "$usage_file"
    
    # Warn if significantly over budget
    if [[ $actual_tokens -gt $((budget * 12 / 10)) ]]; then
        log_warn "Token usage exceeded budget: $actual_tokens > $budget for $operation"
    fi
}

# Budget optimization recommendations
analyze_token_efficiency() {
    local usage_file="$CACHE_DIR/token-usage.jsonl"
    
    if [[ ! -f "$usage_file" ]]; then
        echo "No token usage data available"
        return 1
    fi
    
    # Analyze recent usage patterns
    local recent_entries=$(tail -50 "$usage_file")
    
    # Calculate statistics using jq
    local stats=$(echo "$recent_entries" | jq -s '{
        total_operations: length,
        avg_efficiency: (map(.efficiency) | add / length),
        over_budget_count: (map(select(.over_budget)) | length),
        operations_by_type: (group_by(.operation) | map({
            operation: .[0].operation,
            count: length,
            avg_efficiency: (map(.efficiency) | add / length)
        }))
    }')
    
    # Generate recommendations
    local recommendations=()
    
    local avg_efficiency=$(echo "$stats" | jq -r '.avg_efficiency')
    local over_budget_rate=$(echo "$stats" | jq -r '.over_budget_count / .total_operations')
    
    if (( $(echo "$avg_efficiency > 0.9" | bc -l) )); then
        recommendations+=("Consider increasing token budgets - high efficiency suggests under-allocation")
    elif (( $(echo "$avg_efficiency < 0.6" | bc -l) )); then
        recommendations+=("Token budgets may be too high - consider reducing for efficiency")
    fi
    
    if (( $(echo "$over_budget_rate > 0.2" | bc -l) )); then
        recommendations+=("High over-budget rate detected - review content filtering strategies")
    fi
    
    # Output analysis
    jq -n \
        --argjson stats "$stats" \
        --argjson recommendations "$(printf '%s\n' "${recommendations[@]}" | jq -R . | jq -s .)" \
        '{
            analysis_date: now,
            statistics: $stats,
            recommendations: $recommendations
        }'
}

# Adaptive budget adjustment
adjust_budgets_based_on_usage() {
    local analysis_result="$1"
    
    if [[ -z "$analysis_result" ]]; then
        analysis_result=$(analyze_token_efficiency)
    fi
    
    local avg_efficiency=$(echo "$analysis_result" | jq -r '.statistics.avg_efficiency // 0.7')
    local over_budget_rate=$(echo "$analysis_result" | jq -r '.statistics.over_budget_count / .statistics.total_operations // 0')
    
    # Adjust global token budgets
    if (( $(echo "$avg_efficiency > 0.85" | bc -l) )); then
        # Increase budgets by 20%
        for operation in "${!TOKEN_BUDGETS[@]}"; do
            TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 12 / 10))
        done
        log_info "Increased token budgets by 20% due to high efficiency"
    elif (( $(echo "$over_budget_rate > 0.3" | bc -l) )); then
        # Increase budgets by 10% to reduce over-budget occurrences
        for operation in "${!TOKEN_BUDGETS[@]}"; do
            TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 11 / 10))
        done
        log_info "Increased token budgets by 10% due to high over-budget rate"
    elif (( $(echo "$avg_efficiency < 0.5" | bc -l) )); then
        # Decrease budgets by 15% for efficiency
        for operation in "${!TOKEN_BUDGETS[@]}"; do
            TOKEN_BUDGETS["$operation"]=$((TOKEN_BUDGETS["$operation"] * 85 / 100))
        done
        log_info "Decreased token budgets by 15% due to low efficiency"
    fi
}

# Context compression for semantic data
compress_semantic_context() {
    local context_data="$1"
    local target_budget="$2"
    
    # Try to extract the most important information
    local compressed_context
    
    if compressed_context=$(echo "$context_data" | jq -c '{
        # Keep essential identification
        tool: .tool,
        file_path: .file_path,
        # Summarize symbols
        symbol_summary: {
            count: (.symbols | length // 0),
            types: (.symbols | map(.kind) | group_by(.) | map({type: .[0], count: length}) // [])
        },
        # Keep critical metrics
        estimated_tokens: .estimated_tokens,
        # Preserve key recommendations
        optimization_hint: .optimization_hint,
        # Remove verbose content
        timestamp: .timestamp
    }' 2>/dev/null); then
        
        local compressed_tokens=$(estimate_tokens "$compressed_context")
        
        if [[ $compressed_tokens -le $target_budget ]]; then
            echo "$compressed_context"
            return 0
        fi
    fi
    
    # If still too large, create minimal summary
    jq -n \
        --arg tool "$(echo "$context_data" | jq -r '.tool // "unknown"')" \
        --arg status "compressed" \
        --argjson budget "$target_budget" \
        '{
            tool: $tool,
            status: $status,
            message: "Context compressed due to token budget constraints",
            estimated_tokens: $budget
        }'
}