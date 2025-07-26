#!/bin/bash
# semantic-tools.sh - Semantic tool integration library

# Tool interface functions with consistent error handling and token management

get_file_semantic_context() {
    local file_path="$1"
    local tool="$2"
    local budget="${3:-5000}"
    
    case "$tool" in
        "serena")
            get_serena_file_context "$file_path" "$budget"
            ;;
        "ast-grep")
            get_astgrep_file_context "$file_path" "$budget"
            ;;
        "code2prompt")
            get_code2prompt_file_context "$file_path" "$budget"
            ;;
        *)
            log_warn "Unknown semantic tool: $tool"
            return 1
            ;;
    esac
}

analyze_search_scope() {
    local pattern="$1"
    local tool="$2"
    local budget="${3:-3000}"
    
    case "$tool" in
        "serena")
            analyze_serena_search_scope "$pattern" "$budget"
            ;;
        "ast-grep")
            analyze_astgrep_search_scope "$pattern" "$budget"
            ;;
        "code2prompt")
            analyze_code2prompt_search_scope "$pattern" "$budget"
            ;;
        *)
            log_warn "Unknown semantic tool: $tool"
            return 1
            ;;
    esac
}

get_project_semantic_overview() {
    local tool="$1"
    local budget="${2:-8000}"
    
    case "$tool" in
        "serena")
            get_serena_project_overview "$budget"
            ;;
        "code2prompt")
            get_code2prompt_project_overview "$budget"
            ;;
        "ast-grep")
            get_astgrep_project_overview "$budget"
            ;;
        *)
            log_warn "Unknown semantic tool: $tool"
            return 1
            ;;
    esac
}

# Serena integration functions
get_serena_file_context() {
    local file_path="$1"
    local budget="$2"
    
    # Use Serena MCP to get semantic context
    # This would typically involve calling the Serena MCP server
    local symbols_output
    local references_output
    
    # Mock implementation - replace with actual Serena MCP calls
    if command -v claude-mcp >/dev/null 2>&1; then
        symbols_output=$(timeout 30 claude-mcp serena get_symbols_overview --relative_path "$file_path" 2>/dev/null || echo "{}")
        
        # Get key symbols and their references
        local key_symbols=$(echo "$symbols_output" | jq -r 'keys[] | select(. != "error")' | head -5)
        
        references_output="[]"
        while IFS= read -r symbol; do
            if [[ -n "$symbol" ]]; then
                local refs=$(timeout 15 claude-mcp serena find_referencing_symbols --name_path "$symbol" --relative_path "$file_path" 2>/dev/null || echo "[]")
                references_output=$(echo "$references_output" | jq ". + [$refs]")
            fi
        done <<< "$key_symbols"
    else
        # Fallback to basic file analysis
        symbols_output=$(analyze_file_basic "$file_path")
        references_output="[]"
    fi
    
    # Format output with token budgeting
    jq -n \
        --argjson symbols "$symbols_output" \
        --argjson references "$references_output" \
        --argjson budget "$budget" \
        --arg file "$file_path" \
        '{
            tool: "serena",
            file_path: $file,
            symbols: $symbols,
            references: $references,
            symbol_count: ($symbols | length),
            estimated_tokens: ($budget * 0.7 | floor),
            timestamp: now
        }'
}

analyze_serena_search_scope() {
    local pattern="$1"
    local budget="$2"
    
    # Analyze what the search pattern might be looking for
    local search_type="unknown"
    local optimization_hint=""
    
    if echo "$pattern" | grep -qE "^[A-Z][a-zA-Z]*$"; then
        search_type="type_name"
        optimization_hint="Use find_symbol for precise type search"
    elif echo "$pattern" | grep -qE "^[a-z][a-zA-Z]*$"; then
        search_type="function_name"  
        optimization_hint="Use find_symbol with function filter"
    elif echo "$pattern" | grep -qE "\(.*\)"; then
        search_type="function_call"
        optimization_hint="Use find_referencing_symbols to trace usage"
    else
        search_type="pattern"
        optimization_hint="Use search_for_pattern for complex patterns"
    fi
    
    jq -n \
        --arg type "$search_type" \
        --arg hint "$optimization_hint" \
        --arg pattern "$pattern" \
        --argjson budget "$budget" \
        '{
            tool: "serena",
            search_type: $type,
            pattern: $pattern,
            optimization_hint: $hint,
            estimated_tokens: ($budget * 0.5 | floor),
            timestamp: now
        }'
}

get_serena_project_overview() {
    local budget="$1"
    
    # Get high-level project structure using Serena
    local overview_output="{}"
    
    if command -v claude-mcp >/dev/null 2>&1; then
        overview_output=$(timeout 60 claude-mcp serena get_symbols_overview --relative_path "." 2>/dev/null || echo "{}")
    fi
    
    jq -n \
        --argjson overview "$overview_output" \
        --argjson budget "$budget" \
        '{
            tool: "serena",
            project_overview: $overview,
            file_count: ($overview | length),
            estimated_tokens: ($budget * 0.8 | floor),
            timestamp: now
        }'
}

# ast-grep integration functions
get_astgrep_file_context() {
    local file_path="$1"
    local budget="$2"
    
    if ! command -v ast-grep >/dev/null 2>&1; then
        log_warn "ast-grep not available"
        return 1
    fi
    
    # Get file structure using ast-grep
    local lang=$(detect_file_language "$file_path")
    local structure_output="[]"
    
    if [[ "$lang" != "unknown" ]]; then
        # Get functions/methods
        case "$lang" in
            "go")
                structure_output=$(ast-grep --lang go 'func $name($$$) $$$ { $$$ }' "$file_path" --json 2>/dev/null || echo "[]")
                ;;
            "javascript"|"typescript")
                structure_output=$(ast-grep --lang js 'function $name($$$) { $$$ }' "$file_path" --json 2>/dev/null || echo "[]")
                ;;
            "python")
                structure_output=$(ast-grep --lang py 'def $name($$$): $$$' "$file_path" --json 2>/dev/null || echo "[]")
                ;;
        esac
    fi
    
    jq -n \
        --argjson structure "$structure_output" \
        --arg lang "$lang" \
        --arg file "$file_path" \
        --argjson budget "$budget" \
        '{
            tool: "ast-grep",
            file_path: $file,
            language: $lang,
            structure: $structure,
            function_count: ($structure | length),
            estimated_tokens: ($budget * 0.6 | floor),
            timestamp: now
        }'
}

analyze_astgrep_search_scope() {
    local pattern="$1"
    local budget="$2"
    
    # Determine if pattern is suitable for ast-grep
    local suitability="low"
    local optimization_hint="Pattern may be better suited for text search"
    
    if echo "$pattern" | grep -qE "(function|method|class|struct|interface)"; then
        suitability="high"
        optimization_hint="Use ast-grep with structural patterns"
    elif echo "$pattern" | grep -qE "[a-zA-Z_][a-zA-Z0-9_]*\s*\("; then
        suitability="medium" 
        optimization_hint="Use ast-grep for function call patterns"
    fi
    
    jq -n \
        --arg suitability "$suitability" \
        --arg hint "$optimization_hint" \
        --arg pattern "$pattern" \
        --argjson budget "$budget" \
        '{
            tool: "ast-grep",
            suitability: $suitability,
            pattern: $pattern,
            optimization_hint: $hint,
            estimated_tokens: ($budget * 0.3 | floor),
            timestamp: now
        }'
}

get_astgrep_project_overview() {
    local budget="$1"
    
    if ! command -v ast-grep >/dev/null 2>&1; then
        log_warn "ast-grep not available"
        return 1
    fi
    
    # Get basic project structure
    local file_types=$(find . -name "*.go" -o -name "*.js" -o -name "*.ts" -o -name "*.py" | head -20)
    local overview="[]"
    
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            local lang=$(detect_file_language "$file")
            local item=$(jq -n --arg f "$file" --arg l "$lang" '{file: $f, language: $l}')
            overview=$(echo "$overview" | jq ". + [$item]")
        fi
    done <<< "$file_types"
    
    jq -n \
        --argjson overview "$overview" \
        --argjson budget "$budget" \
        '{
            tool: "ast-grep", 
            project_files: $overview,
            file_count: ($overview | length),
            estimated_tokens: ($budget * 0.4 | floor),
            timestamp: now
        }'
}

# code2prompt integration functions
get_code2prompt_file_context() {
    local file_path="$1"
    local budget="$2"
    
    if ! command -v code2prompt >/dev/null 2>&1; then
        log_warn "code2prompt not available"
        return 1
    fi
    
    # Get file context using code2prompt
    local output
    output=$(timeout 30 code2prompt --include "$file_path" --no-codeblock --line-number 2>/dev/null || echo "")
    
    local token_count=0
    if [[ -n "$output" ]]; then
        token_count=$(echo "$output" | wc -w)
    fi
    
    jq -n \
        --arg file "$file_path" \
        --arg content "$output" \
        --argjson tokens "$token_count" \
        --argjson budget "$budget" \
        '{
            tool: "code2prompt",
            file_path: $file,
            content_preview: ($content | .[0:200]),
            estimated_tokens: $tokens,
            within_budget: ($tokens <= $budget),
            timestamp: now
        }'
}

analyze_code2prompt_search_scope() {
    local pattern="$1" 
    local budget="$2"
    
    # code2prompt is good for broad context, less for specific searches
    local optimization_hint="Use code2prompt for broad context, then narrow with specific tools"
    
    jq -n \
        --arg pattern "$pattern" \
        --arg hint "$optimization_hint" \
        --argjson budget "$budget" \
        '{
            tool: "code2prompt",
            pattern: $pattern,
            optimization_hint: $hint,
            suitability: "context_generation",
            estimated_tokens: ($budget * 0.9 | floor),
            timestamp: now
        }'
}

get_code2prompt_project_overview() {
    local budget="$1"
    
    if ! command -v code2prompt >/dev/null 2>&1; then
        log_warn "code2prompt not available"
        return 1
    fi
    
    # Get project tree structure only
    local tree_output
    tree_output=$(timeout 30 code2prompt --tree-only --no-codeblock 2>/dev/null || echo "")
    
    local token_count=0
    if [[ -n "$tree_output" ]]; then
        token_count=$(echo "$tree_output" | wc -w)
    fi
    
    jq -n \
        --arg tree "$tree_output" \
        --argjson tokens "$token_count" \
        --argjson budget "$budget" \
        '{
            tool: "code2prompt",
            project_tree: $tree,
            estimated_tokens: $tokens,
            within_budget: ($tokens <= $budget),
            timestamp: now
        }'
}

# Utility functions
detect_file_language() {
    local file_path="$1"
    local ext="${file_path##*.}"
    
    case "$ext" in
        "go") echo "go" ;;
        "js") echo "javascript" ;;
        "ts") echo "typescript" ;;
        "py") echo "python" ;;
        "rs") echo "rust" ;;
        "java") echo "java" ;;
        "cpp"|"cc"|"cxx") echo "cpp" ;;
        "c") echo "c" ;;
        *) echo "unknown" ;;
    esac
}

analyze_file_basic() {
    local file_path="$1"
    
    # Basic file analysis fallback
    local functions=$(grep -n "^func\|^function\|^def\|^class" "$file_path" 2>/dev/null | head -10 || echo "")
    local lines=$(wc -l < "$file_path" 2>/dev/null || echo "0")
    
    jq -n \
        --arg file "$file_path" \
        --arg funcs "$functions" \
        --argjson lines "$lines" \
        '{
            file_path: $file,
            functions_preview: $funcs,
            line_count: $lines,
            analysis_type: "basic"
        }'
}