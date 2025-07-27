#!/bin/bash

# Comprehensive validation script for semantic tool compliance across the codebase
# This script audits the entire codebase for non-compliant navigation patterns

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Semantic Tool Compliance Validator for Prompt Alchemy      ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Configuration
REPORT_DIR="reports/semantic-compliance"
REPORT_FILE="$REPORT_DIR/compliance-report-$(date +%Y%m%d-%H%M%S).md"
VIOLATIONS_COUNT=0
WARNINGS_COUNT=0
SCANNED_FILES=0

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Semantic Tool Compliance Report

**Generated**: $(date)  
**Project**: Prompt Alchemy  
**Policy**: AI Navigation & Memory Policy (CLAUDE.md)

## Executive Summary

This report validates compliance with the mandatory semantic tool usage policy defined in CLAUDE.md.

### Required Tools:
- **Serena MCP**: Primary tool for project activation, symbol search, and memory operations
- **code2prompt CLI**: Codebase context generation
- **ast-grep**: Structural pattern matching
- **grep/ripgrep**: Only as last resort with justification

---

## Violations Found

EOF

# Function to scan a file for violations
scan_file() {
    local file="$1"
    local violations=""
    local warnings=""
    
    # Skip binary files and non-relevant extensions
    if [[ ! "$file" =~ \.(go|ts|tsx|js|jsx|sh|bash|py|md)$ ]]; then
        return
    fi
    
    ((SCANNED_FILES++))
    
    # Check for direct file reading patterns
    if grep -n -E "(cat|head|tail|less|more)\s+[^|]*\.(go|ts|tsx|js|jsx)" "$file" 2>/dev/null; then
        violations="${violations}### File: \`$file\`\n"
        violations="${violations}**Violation**: Direct file reading without semantic tools\n"
        violations="${violations}\`\`\`\n"
        violations="${violations}$(grep -n -E "(cat|head|tail|less|more)\s+[^|]*\.(go|ts|tsx|js|jsx)" "$file")\n"
        violations="${violations}\`\`\`\n\n"
        ((VIOLATIONS_COUNT++))
    fi
    
    # Check for grep usage without semantic tools
    if grep -n -E "^[^#]*\b(grep|egrep|fgrep)\s+" "$file" 2>/dev/null | grep -v "ast-grep" | grep -v "# Last Resort"; then
        local grep_lines=$(grep -n -E "^[^#]*\b(grep|egrep|fgrep)\s+" "$file" | grep -v "ast-grep" | grep -v "# Last Resort")
        if [ ! -z "$grep_lines" ]; then
            warnings="${warnings}### File: \`$file\`\n"
            warnings="${warnings}**Warning**: grep usage without semantic tool attempt\n"
            warnings="${warnings}\`\`\`\n"
            warnings="${warnings}${grep_lines}\n"
            warnings="${warnings}\`\`\`\n\n"
            ((WARNINGS_COUNT++))
        fi
    fi
    
    # Check for find command usage
    if grep -n -E "find\s+[./].*\s+-name" "$file" 2>/dev/null; then
        violations="${violations}### File: \`$file\`\n"
        violations="${violations}**Violation**: Using find instead of semantic search\n"
        violations="${violations}\`\`\`\n"
        violations="${violations}$(grep -n -E "find\s+[./].*\s+-name" "$file")\n"
        violations="${violations}\`\`\`\n\n"
        ((VIOLATIONS_COUNT++))
    fi
    
    # Check scripts that perform code analysis without semantic tools
    if [[ "$file" =~ \.(sh|bash)$ ]]; then
        if grep -E "(analyze|search|scan).*\.(go|ts|tsx)" "$file" > /dev/null 2>&1; then
            if ! grep -E "(serena|code2prompt|ast-grep)" "$file" > /dev/null 2>&1; then
                warnings="${warnings}### File: \`$file\`\n"
                warnings="${warnings}**Warning**: Script performs code analysis without semantic tools\n\n"
                ((WARNINGS_COUNT++))
            fi
        fi
    fi
    
    # Append to report if violations found
    if [ ! -z "$violations" ]; then
        echo -e "$violations" >> "$REPORT_FILE"
    fi
    
    if [ ! -z "$warnings" ]; then
        echo -e "\n## Warnings\n\n$warnings" >> "$REPORT_FILE"
    fi
}

# Function to check for positive compliance patterns
check_positive_compliance() {
    local file="$1"
    local compliant_patterns=0
    
    # Check for Serena usage
    if grep -q "serena.*activate_project\|serena.*find_symbol\|serena.*search_for_pattern" "$file" 2>/dev/null; then
        ((compliant_patterns++))
    fi
    
    # Check for code2prompt usage
    if grep -q "code2prompt" "$file" 2>/dev/null; then
        ((compliant_patterns++))
    fi
    
    # Check for ast-grep usage
    if grep -q "ast-grep" "$file" 2>/dev/null; then
        ((compliant_patterns++))
    fi
    
    echo $compliant_patterns
}

# Main scanning loop
echo -e "${YELLOW}Scanning codebase for compliance...${NC}"

# Scan all relevant files
while IFS= read -r -d '' file; do
    scan_file "$file"
    
    # Show progress
    if [ $((SCANNED_FILES % 10)) -eq 0 ]; then
        echo -ne "\rScanned: $SCANNED_FILES files..."
    fi
done < <(find . -type f \( -name "*.go" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.sh" -o -name "*.bash" -o -name "*.py" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./bin/*" -print0)

echo -e "\n"

# Add summary to report
cat >> "$REPORT_FILE" << EOF

---

## Summary Statistics

- **Total Files Scanned**: $SCANNED_FILES
- **Critical Violations**: $VIOLATIONS_COUNT
- **Warnings**: $WARNINGS_COUNT
- **Compliance Status**: $([ $VIOLATIONS_COUNT -eq 0 ] && echo "✅ COMPLIANT" || echo "❌ NON-COMPLIANT")

## Recommendations

1. **Replace Direct File Operations**:
   - Use \`serena.find_symbol\` instead of grep for symbol search
   - Use \`serena.search_for_pattern\` for pattern matching
   - Use \`code2prompt\` for generating codebase context

2. **Memory Operations**:
   - Always use \`serena.write_memory\` for saving context
   - Use \`serena.read_memory\` for retrieving saved information
   - Never store context in raw files

3. **Project Activation**:
   - Start every session with \`serena.activate_project\`
   - Ensure project is activated before any navigation

## Enforcement

To enable automatic enforcement, run:
\`\`\`bash
./scripts/setup-semantic-hooks.sh
\`\`\`

This will install pre-commit hooks that block non-compliant commits.

EOF

# Display results
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Compliance Report Summary                    ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Files Scanned: ${GREEN}$SCANNED_FILES${NC}"
echo -e "Critical Violations: $([ $VIOLATIONS_COUNT -eq 0 ] && echo "${GREEN}$VIOLATIONS_COUNT${NC}" || echo "${RED}$VIOLATIONS_COUNT${NC}")"
echo -e "Warnings: $([ $WARNINGS_COUNT -eq 0 ] && echo "${GREEN}$WARNINGS_COUNT${NC}" || echo "${YELLOW}$WARNINGS_COUNT${NC}")"
echo ""

if [ $VIOLATIONS_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ COMPLIANT: No critical violations found!${NC}"
else
    echo -e "${RED}❌ NON-COMPLIANT: Critical violations detected!${NC}"
    echo -e "${RED}   See detailed report: $REPORT_FILE${NC}"
fi

echo ""
echo -e "Full report saved to: ${MAGENTA}$REPORT_FILE${NC}"

# Return appropriate exit code
[ $VIOLATIONS_COUNT -eq 0 ] && exit 0 || exit 1