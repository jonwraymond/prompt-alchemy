#!/bin/bash

# Semantic Tools Helper Hook
# This hook provides helpful suggestions for using semantic tools without blocking

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Semantic Tools Helper${NC}"

# Check if any of the staged files could benefit from semantic tools
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
CODE_FILES=0
LARGE_CHANGES=0

for file in $STAGED_FILES; do
    if [[ "$file" =~ \.(go|ts|tsx|js|jsx|py)$ ]]; then
        ((CODE_FILES++))
    fi
    
    # Check for large changes
    LINES_CHANGED=$(git diff --cached --numstat "$file" | awk '{print $1 + $2}')
    if [ "$LINES_CHANGED" -gt 50 ]; then
        ((LARGE_CHANGES++))
    fi
done

# Provide helpful suggestions based on the changes
if [ $CODE_FILES -gt 5 ]; then
    echo -e "${YELLOW}💡 Tip: You're modifying $CODE_FILES code files.${NC}"
    echo "   Consider using these semantic tools for better accuracy:"
    echo "   • Serena: 'Find references to [function]' for impact analysis"
    echo "   • ast-grep: Search for structural patterns across files"
    echo "   • code2prompt: Generate context for large changes"
    echo ""
fi

if [ $LARGE_CHANGES -gt 0 ]; then
    echo -e "${YELLOW}💡 Tip: You have large changes in $LARGE_CHANGES files.${NC}"
    echo "   Consider:"
    echo "   • Using Serena memory to document the changes"
    echo "   • Running 'code2prompt --git-diff' to review the full context"
    echo ""
fi

# Check for common patterns that could use semantic tools
if git diff --cached | grep -E "(TODO|FIXME|HACK)" > /dev/null 2>&1; then
    echo -e "${BLUE}📝 Note: Found TODO/FIXME markers in your changes.${NC}"
    echo "   You can use: serena search_for_pattern 'TODO|FIXME|HACK'"
    echo "   to find all such markers in the project."
    echo ""
fi

# Always exit successfully - this is just a helper, not a blocker
echo -e "${GREEN}✅ Semantic tools helper check complete.${NC}"
exit 0