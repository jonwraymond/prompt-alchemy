#!/bin/bash
# tool-detection.sh - Tool availability detection and health checking

# Check if a tool is available and functional
check_tool_availability() {
    local tools=("serena" "ast-grep" "code2prompt" "grep")
    local available_tools=()
    
    for tool in "${tools[@]}"; do
        if is_tool_available "$tool"; then
            available_tools+=("$tool")
        fi
    done
    
    # Return comma-separated list
    IFS=','
    echo "${available_tools[*]}"
    IFS=' '
}

# Check if a specific tool is available
is_tool_available() {
    local tool="$1"
    
    case "$tool" in
        "serena")
            check_serena_availability
            ;;
        "ast-grep")
            check_ast_grep_availability
            ;;
        "code2prompt")
            check_code2prompt_availability
            ;;
        "grep")
            check_grep_availability
            ;;
        *)
            return 1
            ;;
    esac
}

# Individual tool checks
check_serena_availability() {
    # Check if Serena MCP is available
    if command -v claude-mcp >/dev/null 2>&1; then
        # Test with a simple command
        if timeout 5 claude-mcp serena get_active_project >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Alternative: Check if we're in a Serena-compatible environment
    if [[ -n "${SERENA_MCP_SERVER:-}" ]] || [[ -f ".claude/serena-config.json" ]]; then
        return 0
    fi
    
    return 1
}

check_ast_grep_availability() {
    if command -v ast-grep >/dev/null 2>&1; then
        # Test with version check
        if timeout 3 ast-grep --version >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Alternative: Check for sg (alternative name)
    if command -v sg >/dev/null 2>&1; then
        if timeout 3 sg --version >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    return 1
}

check_code2prompt_availability() {
    if command -v code2prompt >/dev/null 2>&1; then
        # Test with version check
        if timeout 3 code2prompt --version >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    return 1
}

check_grep_availability() {
    # grep should always be available, but check for ripgrep first
    if command -v rg >/dev/null 2>&1; then
        if timeout 3 rg --version >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Fall back to standard grep
    if command -v grep >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Get tool capabilities and metadata
get_tool_capabilities() {
    local tool="$1"
    
    case "$tool" in
        "serena")
            get_serena_capabilities
            ;;
        "ast-grep")
            get_ast_grep_capabilities
            ;;
        "code2prompt")
            get_code2prompt_capabilities
            ;;
        "grep")
            get_grep_capabilities
            ;;
        *)
            echo "{\"error\": \"Unknown tool: $tool\"}"
            ;;
    esac
}

get_serena_capabilities() {
    local capabilities='{
        "name": "serena",
        "type": "semantic",
        "strengths": [
            "LSP-based symbol understanding",
            "Cross-file reference tracking", 
            "Precise symbol definitions",
            "Project memory management"
        ],
        "best_for": [
            "symbol_search",
            "reference_finding",
            "code_navigation",
            "project_analysis"
        ],
        "languages": ["go", "typescript", "javascript", "python", "rust", "java"],
        "performance": "high",
        "availability": "mcp_dependent"
    }'
    
    if is_tool_available "serena"; then
        echo "$capabilities" | jq '.status = "available"'
    else
        echo "$capabilities" | jq '.status = "unavailable" | .reason = "MCP server not accessible"'
    fi
}

get_ast_grep_capabilities() {
    local capabilities='{
        "name": "ast-grep", 
        "type": "structural",
        "strengths": [
            "AST-aware pattern matching",
            "Structural code search",
            "Multi-language support",
            "Fast pattern scanning"
        ],
        "best_for": [
            "pattern_matching",
            "structural_queries",
            "code_transformations",
            "syntax_analysis"
        ],
        "languages": ["go", "typescript", "javascript", "python", "rust", "java", "c", "cpp"],
        "performance": "very_high",
        "availability": "binary_dependent"
    }'
    
    if is_tool_available "ast-grep"; then
        local version=$(ast-grep --version 2>/dev/null | head -1 || echo "unknown")
        echo "$capabilities" | jq --arg v "$version" '.status = "available" | .version = $v'
    else
        echo "$capabilities" | jq '.status = "unavailable" | .reason = "Binary not found"'
    fi
}

get_code2prompt_capabilities() {
    local capabilities='{
        "name": "code2prompt",
        "type": "context_generator", 
        "strengths": [
            "Whole project context",
            "Git integration",
            "Template-based output",
            "Token counting"
        ],
        "best_for": [
            "project_overview",
            "context_generation", 
            "documentation_prep",
            "llm_prompts"
        ],
        "languages": ["all"],
        "performance": "medium",
        "availability": "binary_dependent"
    }'
    
    if is_tool_available "code2prompt"; then
        local version=$(code2prompt --version 2>/dev/null | head -1 || echo "unknown")
        echo "$capabilities" | jq --arg v "$version" '.status = "available" | .version = $v'
    else
        echo "$capabilities" | jq '.status = "unavailable" | .reason = "Binary not found"'
    fi
}

get_grep_capabilities() {
    local grep_tool="grep"
    local capabilities='{
        "name": "grep",
        "type": "text_search",
        "strengths": [
            "Fast text search",
            "Regex support",
            "Universal availability",
            "Low resource usage"
        ],
        "best_for": [
            "text_patterns",
            "simple_searches",
            "fallback_operations",
            "basic_filtering"
        ],
        "languages": ["all"],
        "performance": "high",
        "availability": "always"
    }'
    
    # Prefer ripgrep if available
    if command -v rg >/dev/null 2>&1; then
        grep_tool="ripgrep"
        capabilities=$(echo "$capabilities" | jq '.name = "ripgrep" | .performance = "very_high"')
    fi
    
    if is_tool_available "grep"; then
        echo "$capabilities" | jq '.status = "available"'
    else
        echo "$capabilities" | jq '.status = "unavailable" | .reason = "No text search tool found"'
    fi
}

# Comprehensive tool health check
perform_health_check() {
    local tools=("serena" "ast-grep" "code2prompt" "grep")
    local health_report='{
        "timestamp": '$(date +%s)',
        "overall_status": "unknown",
        "tools": {}
    }'
    
    local healthy_count=0
    local total_count=${#tools[@]}
    
    for tool in "${tools[@]}"; do
        local tool_health=$(check_individual_tool_health "$tool")
        health_report=$(echo "$health_report" | jq --argjson tool_data "$tool_health" ".tools.\"$tool\" = \$tool_data")
        
        local status=$(echo "$tool_health" | jq -r '.status')
        if [[ "$status" == "healthy" ]]; then
            ((healthy_count++))
        fi
    done
    
    # Determine overall status
    local overall_status="degraded"
    if [[ $healthy_count -eq $total_count ]]; then
        overall_status="healthy"
    elif [[ $healthy_count -eq 0 ]]; then
        overall_status="critical"
    fi
    
    echo "$health_report" | jq --arg status "$overall_status" '.overall_status = $status'
}

check_individual_tool_health() {
    local tool="$1"
    local start_time=$(date +%s%3N)
    
    local health_data='{
        "tool": "'$tool'",
        "available": false,
        "status": "unknown",
        "response_time_ms": 0,
        "error": null
    }'
    
    if is_tool_available "$tool"; then
        # Perform a simple operation to test responsiveness
        local test_result
        local error_msg=""
        
        case "$tool" in
            "serena")
                test_result=$(timeout 10 claude-mcp serena get_active_project 2>&1 || echo "error")
                ;;
            "ast-grep")
                test_result=$(timeout 5 ast-grep --help >/dev/null 2>&1 && echo "ok" || echo "error")
                ;;
            "code2prompt")
                test_result=$(timeout 5 code2prompt --help >/dev/null 2>&1 && echo "ok" || echo "error")
                ;;
            "grep")
                test_result=$(timeout 3 echo "test" | grep "test" >/dev/null 2>&1 && echo "ok" || echo "error")
                ;;
        esac
        
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [[ "$test_result" != "error" ]]; then
            health_data=$(echo "$health_data" | jq \
                --argjson rt "$response_time" \
                '.available = true | .status = "healthy" | .response_time_ms = $rt')
        else
            health_data=$(echo "$health_data" | jq \
                --argjson rt "$response_time" \
                --arg err "$test_result" \
                '.available = true | .status = "unresponsive" | .response_time_ms = $rt | .error = $err')
        fi
    else
        health_data=$(echo "$health_data" | jq '.status = "unavailable" | .error = "Tool not found or not accessible"')
    fi
    
    echo "$health_data"
}

# Tool recommendation engine
recommend_tools_for_task() {
    local task_type="$1"
    local available_tools="$2"  # comma-separated list
    
    # Convert to array
    IFS=',' read -ra available_array <<< "$available_tools"
    
    local recommendations=()
    
    case "$task_type" in
        "symbol_search")
            # Prefer semantic tools
            if [[ " ${available_array[*]} " =~ " serena " ]]; then
                recommendations+=("serena")
            fi
            if [[ " ${available_array[*]} " =~ " ast-grep " ]]; then
                recommendations+=("ast-grep")
            fi
            recommendations+=("grep")
            ;;
        "project_overview")
            # Prefer context generators
            if [[ " ${available_array[*]} " =~ " code2prompt " ]]; then
                recommendations+=("code2prompt")
            fi
            if [[ " ${available_array[*]} " =~ " serena " ]]; then
                recommendations+=("serena")
            fi
            recommendations+=("ast-grep" "grep")
            ;;
        "pattern_matching")
            # Prefer structural tools
            if [[ " ${available_array[*]} " =~ " ast-grep " ]]; then
                recommendations+=("ast-grep")
            fi
            if [[ " ${available_array[*]} " =~ " serena " ]]; then
                recommendations+=("serena")
            fi
            recommendations+=("grep")
            ;;
        "text_search")
            # Simple text search
            recommendations+=("grep")
            if [[ " ${available_array[*]} " =~ " serena " ]]; then
                recommendations+=("serena")
            fi
            ;;
        *)
            # Default fallback order
            recommendations+=("serena" "ast-grep" "code2prompt" "grep")
            ;;
    esac
    
    # Filter by actual availability
    local filtered_recommendations=()
    for tool in "${recommendations[@]}"; do
        if [[ " ${available_array[*]} " =~ " $tool " ]]; then
            filtered_recommendations+=("$tool")
        fi
    done
    
    # Output as JSON
    jq -n \
        --arg task "$task_type" \
        --argjson tools "$(printf '%s\n' "${filtered_recommendations[@]}" | jq -R . | jq -s .)" \
        '{
            task_type: $task,
            recommended_tools: $tools,
            primary_tool: $tools[0],
            fallback_chain: $tools[1:]
        }'
}

# Installation suggestions
suggest_tool_installation() {
    local tool="$1"
    
    case "$tool" in
        "serena")
            echo "Serena requires MCP server setup. Ensure Claude Desktop MCP integration is configured."
            ;;
        "ast-grep")
            echo "Install ast-grep: npm install -g @ast-grep/cli"
            ;;
        "code2prompt")
            echo "Install code2prompt: cargo install code2prompt"
            ;;
        "grep")
            echo "Install ripgrep (recommended): cargo install ripgrep"
            ;;
        *)
            echo "No installation suggestion available for: $tool"
            ;;
    esac
}

# Export all available tools and their capabilities
export_tool_inventory() {
    local tools=("serena" "ast-grep" "code2prompt" "grep")
    local inventory='{"tools": {}, "summary": {}}'
    
    local available_count=0
    local total_count=${#tools[@]}
    
    for tool in "${tools[@]}"; do
        local capabilities=$(get_tool_capabilities "$tool")
        inventory=$(echo "$inventory" | jq --argjson cap "$capabilities" ".tools.\"$tool\" = \$cap")
        
        local status=$(echo "$capabilities" | jq -r '.status')
        if [[ "$status" == "available" ]]; then
            ((available_count++))
        fi
    done
    
    # Add summary
    inventory=$(echo "$inventory" | jq \
        --argjson total "$total_count" \
        --argjson available "$available_count" \
        '.summary = {
            total_tools: $total,
            available_tools: $available,
            availability_rate: ($available / $total * 100 | floor)
        }')
    
    echo "$inventory"
}