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

# Define required semantic tool patterns
REQUIRED_PATTERNS=(
    "serena.*activate_project"
    "serena.*find_symbol"
    "serena.*search_for_pattern"
    "code2prompt"
    "ast-grep"
)

# Function to check for violations in a file
check_file_compliance() {
    local file="$1"
    local file_violations=0
    
    # Skip non-script and non-code files
    if [[ ! "$file" =~ \.(sh|bash|go|ts|tsx|js|jsx|py)$ ]]; then
        return 0
    fi
    
    # Check for prohibited patterns
    for pattern in "${PROHIBITED_PATTERNS[@]}"; do
        if grep -E "$pattern" "$file" > /dev/null 2>&1; then
            echo -e "${RED}❌ Violation found in $file:${NC}" | tee -a "$COMPLIANCE_LOG"
            echo "   Prohibited pattern: $pattern" | tee -a "$COMPLIANCE_LOG"
            grep -n -E "$pattern" "$file" | tee -a "$COMPLIANCE_LOG"
            ((file_violations++))
        fi
    done
    
    # Check if file contains code navigation but lacks semantic tools
    if grep -E "(search|find|locate|analyze|navigate)" "$file" > /dev/null 2>&1; then
        local has_semantic_tool=0
        for pattern in "${REQUIRED_PATTERNS[@]}"; do
            if grep -E "$pattern" "$file" > /dev/null 2>&1; then
                has_semantic_tool=1
                break
            fi
        done
        
        if [ $has_semantic_tool -eq 0 ]; then
            echo -e "${YELLOW}⚠️  Warning: $file contains navigation/search but no semantic tools${NC}" | tee -a "$COMPLIANCE_LOG"
            ((file_violations++))
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
echo "Semantic Tool Compliance Report" | tee -a "$COMPLIANCE_LOG"
echo "═══════════════════════════════════════════" | tee -a "$COMPLIANCE_LOG"
echo "Timestamp: $(date)" | tee -a "$COMPLIANCE_LOG"
echo "Total violations found: $VIOLATIONS_FOUND" | tee -a "$COMPLIANCE_LOG"

# Check for exemptions
EXEMPTION_FILE=".semantic-exemptions"
if [ -f "$EXEMPTION_FILE" ] && [ $VIOLATIONS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}Checking for approved exemptions...${NC}"
    # Process exemptions here if needed
fi

# Final decision
if [ $VIOLATIONS_FOUND -gt 0 ]; then
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ COMMIT BLOCKED: Semantic tool compliance violations detected${NC}"
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Replace direct file operations with Serena MCP tools"
    echo "2. Use code2prompt for codebase context generation"
    echo "3. Use ast-grep for pattern matching instead of grep"
    echo "4. Activate project in Serena before navigation"
    echo ""
    echo "See $COMPLIANCE_LOG for details"
    echo ""
    echo "To bypass (NOT RECOMMENDED), use: git commit --no-verify"
    exit 1
else
    echo -e "${GREEN}✅ All semantic tool compliance checks passed!${NC}"
    echo "Compliance log saved to: $COMPLIANCE_LOG"
fi

exit 0