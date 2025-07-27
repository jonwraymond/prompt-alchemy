#!/bin/bash

# Serena MCP-First Validator
# Rigorous enforcement of Serena MCP usage for all operations

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}              Serena MCP-First Compliance Validator              ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Configuration
REPORT_DIR="reports/serena-compliance"
REPORT_FILE="$REPORT_DIR/serena-report-$(date +%Y%m%d-%H%M%S).md"
VIOLATIONS_COUNT=0
CRITICAL_VIOLATIONS=0
FALLBACK_COUNT=0
SCANNED_FILES=0

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Serena MCP-First Compliance Report

**Generated**: $(date)  
**Project**: $(basename $(pwd))  
**Policy**: SERENA MCP FIRST, ALWAYS

## Enforcement Summary

All code operations MUST use Serena MCP as the primary tool. Fallbacks are only permitted with explicit error documentation.

---

## Critical Violations (Blocking)

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

# Operations that MUST use Serena
MUST_USE_SERENA=(
    # File operations
    "cat .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "head .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "tail .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "less .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "more .*\.(go|ts|tsx|js|jsx|py|sh|md)"
    
    # Search operations
    "grep -[rRn]"
    "find .* -name"
    "ls -[la]"
    
    # Code analysis
    "analyze.*code"
    "search.*project"
    "scan.*codebase"
    "explore.*repo"
    
    # Memory operations
    "save.*context"
    "store.*memory"
    "write.*knowledge"
    "read.*state"
)

# Valid fallback markers
FALLBACK_MARKERS=(
    "SERENA_FALLBACK:"
    "Serena failed:"
    "Serena error:"
    "Serena unavailable:"
    "Serena timeout:"
)

# Function to check if Serena was used first
check_serena_first() {
    local file="$1"
    local operation="$2"
    local line_num="$3"
    
    # Get context around the operation (20 lines before)
    local start_line=$((line_num > 20 ? line_num - 20 : 1))
    local context=$(sed -n "${start_line},$((line_num))p" "$file")
    
    # Check if Serena was attempted
    local serena_found=false
    for pattern in "${SERENA_PATTERNS[@]}"; do
        if echo "$context" | grep -F "$pattern" > /dev/null 2>&1; then
            serena_found=true
            break
        fi
    done
    
    # Check for fallback justification
    local fallback_found=false
    for marker in "${FALLBACK_MARKERS[@]}"; do
        if echo "$context" | grep -F "$marker" > /dev/null 2>&1; then
            fallback_found=true
            ((FALLBACK_COUNT++))
            break
        fi
    done
    
    if ! $serena_found && ! $fallback_found; then
        echo -e "\n### CRITICAL: Operation without Serena MCP" >> "$REPORT_FILE"
        echo -e "**File**: \`$file:$line_num\`" >> "$REPORT_FILE"
        echo -e "**Operation**: \`$operation\`" >> "$REPORT_FILE"
        echo -e "**Status**: ❌ No Serena attempt or fallback justification\n" >> "$REPORT_FILE"
        ((CRITICAL_VIOLATIONS++))
        return 1
    elif ! $serena_found && $fallback_found; then
        echo -e "${YELLOW}⚠️  Fallback found in $file:$line_num${NC}"
        return 0
    else
        return 0
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
    
    # Check for script activation requirement
    if [[ "$file" =~ \.(sh|bash|py)$ ]]; then
        if ! head -30 "$file" | grep -E "serena activate_project" > /dev/null 2>&1; then
            echo -e "\n### Missing Serena Activation" >> "$REPORT_FILE"
            echo -e "**File**: \`$file\`" >> "$REPORT_FILE"
            echo -e "**Issue**: Script does not activate Serena project at start" >> "$REPORT_FILE"
            echo -e "**Required**: \`serena activate_project .\` at script beginning\n" >> "$REPORT_FILE"
            ((VIOLATIONS_COUNT++))
        fi
    fi
    
    # Check each must-use-Serena pattern
    for pattern in "${MUST_USE_SERENA[@]}"; do
        while IFS=: read -r line_num line_content; do
            if [ ! -z "$line_num" ]; then
                check_serena_first "$file" "$pattern" "$line_num"
                if [ $? -ne 0 ]; then
                    ((VIOLATIONS_COUNT++))
                fi
            fi
        done < <(grep -n -E "$pattern" "$file" 2>/dev/null || true)
    done
    
    # Show progress
    if [ $((SCANNED_FILES % 10)) -eq 0 ]; then
        echo -ne "\rScanned: $SCANNED_FILES files... (Violations: $VIOLATIONS_COUNT)"
    fi
}

# Main validation loop
echo -e "${YELLOW}Validating Serena MCP-First compliance...${NC}"

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

# Add summary
cat >> "$REPORT_FILE" << EOF

---

## Summary Statistics

- **Files Scanned**: $SCANNED_FILES
- **Total Violations**: $VIOLATIONS_COUNT
- **Critical Violations**: $CRITICAL_VIOLATIONS (operations without Serena)
- **Documented Fallbacks**: $FALLBACK_COUNT
- **Compliance Status**: $([ $CRITICAL_VIOLATIONS -eq 0 ] && echo "✅ COMPLIANT" || echo "❌ NON-COMPLIANT")

## Required Actions

1. **All Operations Must Start with Serena**:
   \`\`\`bash
   serena activate_project .
   serena search_for_pattern "pattern"
   serena get_symbols_overview "path/"
   \`\`\`

2. **Fallbacks Require Documentation**:
   \`\`\`bash
   # SERENA_FALLBACK: Connection refused after 3 retries
   grep -r "pattern" .  # Only after Serena failure
   \`\`\`

3. **Memory Operations Are Serena-Only**:
   \`\`\`bash
   serena write_memory "key" "value"
   serena read_memory "key"
   \`\`\`

## Enforcement

Pre-commit hooks will **BLOCK** any commits with critical violations.
Use \`git commit --no-verify\` only with manager approval and documented justification.

EOF

# Display results
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  Serena MCP-First Report Summary                ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Files Scanned: ${GREEN}$SCANNED_FILES${NC}"
echo -e "Total Violations: $([ $VIOLATIONS_COUNT -eq 0 ] && echo "${GREEN}$VIOLATIONS_COUNT${NC}" || echo "${YELLOW}$VIOLATIONS_COUNT${NC}")"
echo -e "Critical Violations: $([ $CRITICAL_VIOLATIONS -eq 0 ] && echo "${GREEN}$CRITICAL_VIOLATIONS${NC}" || echo "${RED}$CRITICAL_VIOLATIONS${NC}")"
echo -e "Documented Fallbacks: ${BLUE}$FALLBACK_COUNT${NC}"
echo ""

if [ $CRITICAL_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ SERENA MCP-FIRST COMPLIANT${NC}"
    echo -e "${GREEN}   All operations properly use Serena or have documented fallbacks${NC}"
else
    echo -e "${RED}❌ SERENA MCP-FIRST VIOLATIONS DETECTED${NC}"
    echo -e "${RED}   $CRITICAL_VIOLATIONS operations found without Serena MCP usage${NC}"
    echo -e "${RED}   See detailed report: $REPORT_FILE${NC}"
fi

echo ""
echo -e "Full report: ${MAGENTA}$REPORT_FILE${NC}"

# Exit with error if critical violations
[ $CRITICAL_VIOLATIONS -eq 0 ] && exit 0 || exit 1