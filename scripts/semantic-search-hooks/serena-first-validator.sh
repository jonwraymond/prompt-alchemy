#!/bin/bash

# Serena MCP Best Practices Validator
# Provides helpful guidance on optimal Serena MCP usage patterns

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}              Serena MCP Best Practices Analyzer                 ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Configuration
REPORT_DIR="reports/serena-compliance"
REPORT_FILE="$REPORT_DIR/serena-report-$(date +%Y%m%d-%H%M%S).md"
GOOD_PRACTICES=0
IMPROVEMENT_OPPORTUNITIES=0
FALLBACK_COUNT=0
SCANNED_FILES=0

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Serena MCP Best Practices Report

**Generated**: $(date)  
**Project**: $(basename $(pwd))  
**Purpose**: Analyze Serena MCP usage patterns and provide improvement suggestions

## Best Practices Summary

This report identifies opportunities to better leverage Serena MCP for code navigation and memory management.

---

## Good Practices Found 🎉

EOF

# Serena-specific patterns
SERENA_PATTERNS=(
    "serena activate_project"
    "serena onboarding"
    "serena find_symbol"
    "serena get_symbols_overview"
    "serena search_for_pattern"
    "serena write_memory"
    "serena read_memory"
    "serena list_memories"
    "serena update_memory"
    "serena delete_memory"
)

# Operations that could benefit from Serena
COULD_USE_SERENA=(
    # File operations
    "cat .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "head .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "tail .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    
    # Search operations
    "grep -[rRn]"
    "find .* -name"
    "rg .*pattern"
    
    # Code analysis
    "analyze.*code"
    "search.*function"
    "find.*symbol"
)

# Valid fallback markers
FALLBACK_MARKERS=(
    "SERENA_FALLBACK:"
    "Serena failed:"
    "Serena error:"
    "ast-grep alternative:"
    "code2prompt fallback:"
)

# Function to check for Serena usage patterns
analyze_serena_usage() {
    local file="$1"
    local has_serena=false
    local suggestions=""
    
    # Check for any Serena usage
    for pattern in "${SERENA_PATTERNS[@]}"; do
        if grep -F "$pattern" "$file" > /dev/null 2>&1; then
            has_serena=true
            ((GOOD_PRACTICES++))
            echo -e "- Found \`$pattern\` usage in \`$file\` ✅" >> "$REPORT_FILE"
        fi
    done
    
    # Check for operations that could use Serena
    for pattern in "${COULD_USE_SERENA[@]}"; do
        while IFS=: read -r line_num line_content; do
            if [ ! -z "$line_num" ]; then
                # Check if there's a fallback marker nearby
                local context_start=$((line_num > 5 ? line_num - 5 : 1))
                local context=$(sed -n "${context_start},$((line_num + 5))p" "$file")
                
                local has_fallback=false
                for marker in "${FALLBACK_MARKERS[@]}"; do
                    if echo "$context" | grep -F "$marker" > /dev/null 2>&1; then
                        has_fallback=true
                        ((FALLBACK_COUNT++))
                        break
                    fi
                done
                
                if ! $has_fallback && ! $has_serena; then
                    ((IMPROVEMENT_OPPORTUNITIES++))
                    suggestions="${suggestions}\n- Line $line_num: Consider using Serena instead of \`$pattern\`"
                fi
            fi
        done < <(grep -n -E "$pattern" "$file" 2>/dev/null || true)
    done
    
    # Add suggestions to report if any
    if [ ! -z "$suggestions" ] && [ $IMPROVEMENT_OPPORTUNITIES -gt 0 ]; then
        echo -e "\n### Improvement Opportunity: \`$file\`" >> "$REPORT_FILE"
        echo -e "$suggestions" >> "$REPORT_FILE"
    fi
}

# Function to validate a file
validate_file() {
    local file="$1"
    
    # Skip irrelevant files
    if [[ ! "$file" =~ \.(sh|bash|py|go|ts|tsx|js|jsx|md|yml|yaml)$ ]]; then
        return
    fi
    
    ((SCANNED_FILES++))
    
    # Analyze Serena usage
    analyze_serena_usage "$file"
    
    # Show progress
    if [ $((SCANNED_FILES % 10)) -eq 0 ]; then
        echo -ne "\rAnalyzed: $SCANNED_FILES files..."
    fi
}

# Main validation loop
echo -e "${YELLOW}Analyzing Serena MCP usage patterns...${NC}"

# Find all relevant files
while IFS= read -r -d '' file; do
    validate_file "$file"
done < <(find . -type f \
    \( -name "*.sh" -o -name "*.bash" -o -name "*.py" \
       -o -name "*.go" -o -name "*.ts" -o -name "*.tsx" \
       -o -name "*.js" -o -name "*.jsx" -o -name "*.md" \
       -o -name "*.yml" -o -name "*.yaml" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -not -path "./bin/*" \
    -not -path "./build/*" \
    -print0)

echo -e "\n"

# Add improvement opportunities section
if [ $IMPROVEMENT_OPPORTUNITIES -gt 0 ]; then
    cat >> "$REPORT_FILE" << EOF

---

## Improvement Opportunities 💡

Found $IMPROVEMENT_OPPORTUNITIES places where Serena MCP could enhance your workflow:

EOF
fi

# Add summary
cat >> "$REPORT_FILE" << EOF

---

## Summary Statistics

- **Files Analyzed**: $SCANNED_FILES
- **Good Practices**: $GOOD_PRACTICES (Serena usage found)
- **Improvement Opportunities**: $IMPROVEMENT_OPPORTUNITIES
- **Documented Fallbacks**: $FALLBACK_COUNT

## Recommendations

### When to Use Serena MCP

1. **Symbol Navigation**:
   \`\`\`bash
   serena find_symbol "GeneratePrompt"  # Instead of grep -r
   serena get_symbols_overview "internal/engine/"  # Instead of ls -la
   \`\`\`

2. **Pattern Search**:
   \`\`\`bash
   serena search_for_pattern "TODO|FIXME"  # Instead of grep
   \`\`\`

3. **Project Memory**:
   \`\`\`bash
   serena write_memory "refactoring-plan" "content"
   serena read_memory "project-notes"
   \`\`\`

### When to Use Other Tools

- **ast-grep**: For AST-based refactoring and structural patterns
- **code2prompt**: For generating comprehensive context for AI
- **grep/ripgrep**: When Serena is unavailable or for simple text search

### Best Practice: Document Fallbacks

When Serena isn't suitable, document why:
\`\`\`bash
# SERENA_FALLBACK: Using grep for log files (not code)
grep -r "ERROR" logs/
\`\`\`

EOF

# Display results
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Analysis Summary                             ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Files Analyzed: ${GREEN}$SCANNED_FILES${NC}"
echo -e "Good Practices Found: ${GREEN}$GOOD_PRACTICES${NC}"
echo -e "Improvement Opportunities: $([ $IMPROVEMENT_OPPORTUNITIES -eq 0 ] && echo "${GREEN}$IMPROVEMENT_OPPORTUNITIES${NC}" || echo "${YELLOW}$IMPROVEMENT_OPPORTUNITIES${NC}")"
echo -e "Documented Fallbacks: ${BLUE}$FALLBACK_COUNT${NC}"
echo ""

if [ $GOOD_PRACTICES -gt 0 ]; then
    echo -e "${GREEN}✅ Great job using Serena MCP!${NC}"
    echo -e "   Found $GOOD_PRACTICES instances of Serena usage"
fi

if [ $IMPROVEMENT_OPPORTUNITIES -gt 0 ]; then
    echo -e "${YELLOW}💡 Found $IMPROVEMENT_OPPORTUNITIES opportunities to leverage Serena${NC}"
    echo -e "   See detailed suggestions in the report"
else
    echo -e "${GREEN}✨ Excellent! No obvious missed opportunities for Serena usage${NC}"
fi

echo ""
echo -e "Full report: ${MAGENTA}$REPORT_FILE${NC}"
echo ""
echo -e "${BLUE}Remember: Use the right tool for the job!${NC}"
echo -e "  • Serena for semantic code navigation and project memory"
echo -e "  • ast-grep for AST pattern matching"
echo -e "  • code2prompt for AI context generation"

# Always exit successfully - this is a helper, not a blocker
exit 0