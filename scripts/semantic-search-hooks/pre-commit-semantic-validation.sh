#!/bin/bash

# Pre-commit hook to provide helpful suggestions for semantic tool usage
# This hook offers guidance on using Serena MCP, ast-grep, and code2prompt effectively

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Semantic Tools Helper - Pre-commit Check..."

# Configuration
SUGGESTIONS_LOG="/tmp/semantic-suggestions-$(date +%s).log"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
CODE_FILES=0
LARGE_CHANGES=0
COMPLEX_PATTERNS=0

# Patterns that could benefit from semantic tools
CODE_NAVIGATION_PATTERNS=(
    "find.*-name.*\.(go|ts|tsx|js|jsx|py)"
    "grep.*-r.*function"
    "grep.*-r.*class"
    "grep.*-r.*interface"
    "cat.*\|.*grep"
    "find.*\|.*xargs.*grep"
)

# Patterns suggesting complex code analysis
COMPLEX_ANALYSIS_PATTERNS=(
    "TODO|FIXME|HACK|BUG|XXX"
    "refactor|improve|optimize|cleanup"
    "analyze|investigate|debug|trace"
    "import.*from|require\(|use\s+"
)

# Good practices we want to encourage
GOOD_PRACTICES=(
    "serena.*find_symbol"
    "serena.*search_for_pattern"
    "ast-grep.*run.*-p"
    "code2prompt.*--pattern"
    "serena.*write_memory"
    "serena.*read_memory"
)

# Function to analyze files and provide suggestions
analyze_files() {
    # Count code files and changes
    for file in $STAGED_FILES; do
        if [[ "$file" =~ \.(go|ts|tsx|js|jsx|py)$ ]]; then
            ((CODE_FILES++))
        fi
        
        # Check for large changes
        local lines_changed=$(git diff --cached --numstat "$file" 2>/dev/null | awk '{print $1 + $2}')
        if [ "$lines_changed" -gt 50 ] 2>/dev/null; then
            ((LARGE_CHANGES++))
        fi
    done
    
    # Check for patterns that could use semantic tools
    for file in $STAGED_FILES; do
        if [ -f "$file" ]; then
            for pattern in "${CODE_NAVIGATION_PATTERNS[@]}"; do
                if grep -E "$pattern" "$file" > /dev/null 2>&1; then
                    ((COMPLEX_PATTERNS++))
                    break
                fi
            done
        fi
    done
}

# Function to check for good practices and provide encouragement
check_good_practices() {
    local good_practice_count=0
    
    for file in $STAGED_FILES; do
        if [ -f "$file" ]; then
            for pattern in "${GOOD_PRACTICES[@]}"; do
                if grep -E "$pattern" "$file" > /dev/null 2>&1; then
                    ((good_practice_count++))
                fi
            done
        fi
    done
    
    if [ $good_practice_count -gt 0 ]; then
        echo -e "${GREEN}🎉 Great job! Found $good_practice_count uses of semantic tools!${NC}"
        echo "   Keep leveraging these powerful tools for better code navigation."
        echo ""
    fi
}

# Analyze staged files
analyze_files

# Check for good practices
check_good_practices

# Provide helpful suggestions based on the analysis
if [ $CODE_FILES -gt 5 ] || [ $LARGE_CHANGES -gt 0 ] || [ $COMPLEX_PATTERNS -gt 0 ]; then
    echo -e "${BLUE}💡 Semantic Tools Suggestions${NC}"
    echo "═══════════════════════════════════════════"
    
    if [ $CODE_FILES -gt 5 ]; then
        echo -e "${YELLOW}📁 You're modifying $CODE_FILES code files.${NC}"
        echo "   Consider using these tools for better accuracy:"
        echo "   • Serena: 'Find all references to [function]' for impact analysis"
        echo "   • ast-grep: 'ast-grep run -p [pattern]' for structural search"
        echo "   • code2prompt: Generate comprehensive context"
        echo ""
    fi
    
    if [ $LARGE_CHANGES -gt 0 ]; then
        echo -e "${YELLOW}📊 You have large changes in $LARGE_CHANGES files.${NC}"
        echo "   Tips for managing large changes:"
        echo "   • Use 'serena write_memory \"refactoring-notes\" \"[summary]\"' to track changes"
        echo "   • Run 'code2prompt --git-diff' to review all modifications"
        echo "   • Consider breaking into smaller, focused commits"
        echo ""
    fi
    
    if [ $COMPLEX_PATTERNS -gt 0 ]; then
        echo -e "${YELLOW}🔍 Found code navigation patterns that could use semantic tools.${NC}"
        echo "   Instead of grep/find, try:"
        echo "   • 'serena find_symbol [name]' for precise symbol location"
        echo "   • 'serena search_for_pattern [regex]' for semantic search"
        echo "   • 'ast-grep run -p [pattern]' for AST-based matching"
        echo ""
    fi
fi

# Check for TODOs/FIXMEs in changes
if git diff --cached | grep -E "(TODO|FIXME|HACK|BUG|XXX)" > /dev/null 2>&1; then
    echo -e "${BLUE}📝 Found TODO/FIXME markers in your changes.${NC}"
    echo "   Track them project-wide with:"
    echo "   • 'serena search_for_pattern \"TODO|FIXME|HACK\"'"
    echo "   • 'ast-grep run -p \"// TODO: \$\$\$\"' for comment patterns"
    echo ""
fi

# Provide quick reference if no specific suggestions
if [ $CODE_FILES -eq 0 ] || ([ $LARGE_CHANGES -eq 0 ] && [ $COMPLEX_PATTERNS -eq 0 ]); then
    echo -e "${GREEN}✅ Commit looks good!${NC}"
    echo ""
    echo -e "${BLUE}Quick Semantic Tools Reference:${NC}"
    echo "  🔍 Serena: Symbol navigation and project memory"
    echo "  🌳 ast-grep: AST pattern matching and refactoring"
    echo "  📄 code2prompt: Context generation for AI assistants"
fi

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

# Always exit successfully - this is a helper, not a blocker
exit 0