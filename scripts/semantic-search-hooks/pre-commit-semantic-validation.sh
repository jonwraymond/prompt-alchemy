#!/bin/bash

# Pre-commit hook to enforce Serena MCP-first semantic tool usage compliance
# This hook validates that ALL code navigation, analysis, and memory operations use Serena MCP

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Running Serena MCP-First Compliance Check..."

# Configuration
COMPLIANCE_LOG="/tmp/semantic-compliance-$(date +%s).log"
FALLBACK_LOG="/tmp/semantic-fallback-$(date +%s).log"
VIOLATIONS_FOUND=0
SERENA_VIOLATIONS=0

# Define prohibited patterns that indicate non-Serena operations
PROHIBITED_PATTERNS=(
    # Direct file operations without Serena MCP
    "cat\s+[^|]*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "head\s+[^|]*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "tail\s+[^|]*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "less\s+[^|]*\.(go|ts|tsx|js|jsx|py|sh|md)"
    "more\s+[^|]*\.(go|ts|tsx|js|jsx|py|sh|md)"
    
    # Direct grep usage without Serena search_for_pattern
    "grep\s+-[^|]*\s+['\"].*['\"]"
    "egrep\s+"
    "fgrep\s+"
    "ripgrep\s+"
    "rg\s+"
    
    # Manual directory traversal without Serena
    "find\s+\.\s+-name"
    "find\s+\./\s+-type"
    "ls\s+-[la]*\s+[^|]*/"
    
    # Direct file reading in code
    "open\(['\"].*\.(go|ts|tsx|js|jsx|py)['\"]"
    "readFile.*\.(go|ts|tsx|js|jsx|py)"
    "fs\.read.*\.(go|ts|tsx|js|jsx)"
    "File\.read"
    "with\s+open"
    
    # Direct memory/storage access without Serena
    "localStorage\."
    "sessionStorage\."
    "fs\.write.*memory"
    "save.*context"
    "store.*knowledge"
)

# Define required Serena MCP patterns
REQUIRED_SERENA_PATTERNS=(
    "serena.*activate_project"
    "serena.*find_symbol"
    "serena.*get_symbols_overview"
    "serena.*search_for_pattern"
    "serena.*write_memory"
    "serena.*read_memory"
    "serena.*list_memories"
    "serena.*onboarding"
)

# Define fallback justification patterns
FALLBACK_PATTERNS=(
    "# semantic-fallback:"
    "# SERENA_FALLBACK:"
    "# Serena failed:"
    "# Serena unavailable:"
)

# Function to check for Serena-first compliance
check_serena_first() {
    local file="$1"
    local line_num="$2"
    local violation="$3"
    
    # Check if there's a fallback justification within 5 lines
    local start_line=$((line_num - 5))
    local end_line=$((line_num + 5))
    
    if [ $start_line -lt 1 ]; then
        start_line=1
    fi
    
    local context=$(sed -n "${start_line},${end_line}p" "$file")
    
    for pattern in "${FALLBACK_PATTERNS[@]}"; do
        if echo "$context" | grep -E "$pattern" > /dev/null 2>&1; then
            echo -e "${YELLOW}ℹ️  Fallback justified in $file:$line_num${NC}" | tee -a "$FALLBACK_LOG"
            return 0
        fi
    done
    
    # Check if Serena was attempted first
    local serena_found=0
    for pattern in "${REQUIRED_SERENA_PATTERNS[@]}"; do
        if echo "$context" | grep -E "$pattern" > /dev/null 2>&1; then
            serena_found=1
            break
        fi
    done
    
    if [ $serena_found -eq 0 ]; then
        echo -e "${RED}❌ SERENA VIOLATION in $file:$line_num${NC}" | tee -a "$COMPLIANCE_LOG"
        echo "   Operation without Serena MCP: $violation" | tee -a "$COMPLIANCE_LOG"
        ((SERENA_VIOLATIONS++))
        return 1
    fi
    
    return 0
}

# Function to check for violations in a file
check_file_compliance() {
    local file="$1"
    local file_violations=0
    
    # Skip non-script and non-code files
    if [[ ! "$file" =~ \.(sh|bash|go|ts|tsx|js|jsx|py|md|yml|yaml)$ ]]; then
        return 0
    fi
    
    # Check for Serena project activation at file start
    if [[ "$file" =~ \.(sh|bash|py)$ ]]; then
        if ! head -20 "$file" | grep -E "serena.*activate_project|SERENA.*PROJECT.*ACTIVATED" > /dev/null 2>&1; then
            echo -e "${RED}❌ Missing Serena activation in $file${NC}" | tee -a "$COMPLIANCE_LOG"
            echo "   Scripts must activate Serena project at start" | tee -a "$COMPLIANCE_LOG"
            ((file_violations++))
            ((SERENA_VIOLATIONS++))
        fi
    fi
    
    # Check for prohibited patterns with line numbers
    for pattern in "${PROHIBITED_PATTERNS[@]}"; do
        while IFS=: read -r line_num line_content; do
            if [ ! -z "$line_num" ]; then
                check_serena_first "$file" "$line_num" "$pattern"
                if [ $? -ne 0 ]; then
                    ((file_violations++))
                fi
            fi
        done < <(grep -n -E "$pattern" "$file" 2>/dev/null || true)
    done
    
    # Check for memory operations without Serena
    if grep -E "(memory|context|knowledge|state).*\.(save|write|store|read|load|get)" "$file" > /dev/null 2>&1; then
        if ! grep -E "serena.*(write|read)_memory" "$file" > /dev/null 2>&1; then
            echo -e "${RED}❌ Memory operation without Serena in $file${NC}" | tee -a "$COMPLIANCE_LOG"
            ((file_violations++))
            ((SERENA_VIOLATIONS++))
        fi
    fi
    
    # Check for code analysis without Serena
    if grep -E "(analyze|search|find|locate|navigate|explore|scan).*\.(code|project|codebase|repo)" "$file" > /dev/null 2>&1; then
        local has_serena=0
        for pattern in "${REQUIRED_SERENA_PATTERNS[@]}"; do
            if grep -E "$pattern" "$file" > /dev/null 2>&1; then
                has_serena=1
                break
            fi
        done
        
        if [ $has_serena -eq 0 ]; then
            echo -e "${RED}❌ Code analysis without Serena MCP in $file${NC}" | tee -a "$COMPLIANCE_LOG"
            ((file_violations++))
            ((SERENA_VIOLATIONS++))
        fi
    fi
    
    return $file_violations
}

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check each staged file
for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        check_file_compliance "$file"
        VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + $?))
    fi
done

# Generate compliance report
echo "═══════════════════════════════════════════" | tee -a "$COMPLIANCE_LOG"
echo "Serena MCP-First Compliance Report" | tee -a "$COMPLIANCE_LOG"
echo "═══════════════════════════════════════════" | tee -a "$COMPLIANCE_LOG"
echo "Timestamp: $(date)" | tee -a "$COMPLIANCE_LOG"
echo "Total violations: $VIOLATIONS_FOUND" | tee -a "$COMPLIANCE_LOG"
echo "Serena MCP violations: $SERENA_VIOLATIONS" | tee -a "$COMPLIANCE_LOG"

# Check for exemptions
EXEMPTION_FILE=".semantic-exemptions"
if [ -f "$EXEMPTION_FILE" ] && [ $VIOLATIONS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}Checking for approved exemptions...${NC}"
    # Process exemptions here if needed
fi

# Log fallback justifications if any
if [ -f "$FALLBACK_LOG" ] && [ -s "$FALLBACK_LOG" ]; then
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}Fallback Justifications Found:${NC}"
    cat "$FALLBACK_LOG"
fi

# Final decision - Serena violations are critical
if [ $SERENA_VIOLATIONS -gt 0 ]; then
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ COMMIT BLOCKED: Serena MCP-First violations detected${NC}"
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo ""
    echo "MANDATORY: All operations MUST use Serena MCP first:"
    echo ""
    echo "1. START with: serena activate_project"
    echo "2. SEARCH with: serena search_for_pattern / find_symbol"
    echo "3. BROWSE with: serena get_symbols_overview"
    echo "4. MEMORY with: serena write_memory / read_memory"
    echo ""
    echo "Fallback to other tools ONLY if Serena fails, with justification:"
    echo "   # SERENA_FALLBACK: [error message and reason]"
    echo ""
    echo "Logs:"
    echo "- Violations: $COMPLIANCE_LOG"
    echo "- Fallbacks: $FALLBACK_LOG"
    echo ""
    echo "To bypass (REQUIRES MANAGER APPROVAL): git commit --no-verify"
    exit 1
elif [ $VIOLATIONS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Non-critical violations found. Review recommended.${NC}"
    echo "See $COMPLIANCE_LOG for details"
    # Allow commit but warn
else
    echo -e "${GREEN}✅ All Serena MCP-First compliance checks passed!${NC}"
    echo "Logs saved to: $COMPLIANCE_LOG"
fi

exit 0