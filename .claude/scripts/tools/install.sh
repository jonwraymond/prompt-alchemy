#!/bin/bash
# install.sh - Installation script for semantic search hooks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Installation paths
CLAUDE_DIR="$HOME/.claude"
HOOKS_DIR="$CLAUDE_DIR/scripts"
SETTINGS_FILE="$CLAUDE_DIR/settings.local.json"

echo -e "${BLUE}Semantic Search Hooks Installation${NC}"
echo "=================================="

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}"
    
    local missing_tools=()
    
    # Check for jq
    if ! command -v jq >/dev/null 2>&1; then
        missing_tools+=("jq")
    fi
    
    # Check for basic Unix tools
    if ! command -v grep >/dev/null 2>&1; then
        missing_tools+=("grep")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo -e "${RED}Missing required tools:${NC}"
        printf '%s\n' "${missing_tools[@]}"
        echo ""
        echo "Please install missing tools and run again."
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
}

# Install semantic tools
install_semantic_tools() {
    echo -e "\n${BLUE}Installing semantic tools...${NC}"
    
    # Check and suggest installation for semantic tools
    local tools_to_install=()
    
    if ! command -v ast-grep >/dev/null 2>&1; then
        tools_to_install+=("ast-grep")
    fi
    
    if ! command -v code2prompt >/dev/null 2>&1; then
        tools_to_install+=("code2prompt")
    fi
    
    if ! command -v rg >/dev/null 2>&1; then
        tools_to_install+=("ripgrep")
    fi
    
    if [[ ${#tools_to_install[@]} -gt 0 ]]; then
        echo -e "${YELLOW}Optional semantic tools not found:${NC}"
        for tool in "${tools_to_install[@]}"; do
            case "$tool" in
                "ast-grep")
                    echo "  - ast-grep: npm install -g @ast-grep/cli"
                    ;;
                "code2prompt")
                    echo "  - code2prompt: cargo install code2prompt"
                    ;;
                "ripgrep")
                    echo "  - ripgrep: cargo install ripgrep"
                    ;;
            esac
        done
        echo ""
        echo "These tools will enhance functionality but are not required."
        echo "The system will work with basic tools and graceful fallbacks."
    else
        echo -e "${GREEN}✓ All recommended semantic tools are available${NC}"
    fi
}

# Setup directory structure
setup_directories() {
    echo -e "\n${BLUE}Setting up directory structure...${NC}"
    
    # Create directories
    mkdir -p "$CLAUDE_DIR"
    mkdir -p "$HOOKS_DIR"
    mkdir -p "$HOOKS_DIR/lib"
    mkdir -p "$HOOKS_DIR/docs" 
    mkdir -p "$HOOKS_DIR/config"
    mkdir -p "$HOOKS_DIR/tests"
    
    # Create cache directory
    mkdir -p "$CLAUDE_DIR/semantic-search-cache"
    
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Copy hook files
copy_hook_files() {
    echo -e "\n${BLUE}Copying hook files...${NC}"
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local parent_dir="$(dirname "$script_dir")"
    
    # Copy hook scripts to their dedicated directories
    mkdir -p "$HOOKS_DIR/hooks/user-prompt-submit" "$HOOKS_DIR/hooks/pre-tool-use"
    cp "$parent_dir/hooks/user-prompt-submit/query-router.sh" "$HOOKS_DIR/hooks/user-prompt-submit/"
    cp "$parent_dir/hooks/pre-tool-use/context-preparer.sh" "$HOOKS_DIR/hooks/pre-tool-use/"
    
    # Copy library files
    mkdir -p "$HOOKS_DIR/lib"
    cp -r "$parent_dir/lib/"* "$HOOKS_DIR/lib/"
    
    # Copy configuration files
    mkdir -p "$HOOKS_DIR/config"
    cp -r "$parent_dir/config/"* "$HOOKS_DIR/config/"
    
    # Copy documentation
    mkdir -p "$HOOKS_DIR/docs"
    cp -r "$parent_dir/docs/"* "$HOOKS_DIR/docs/" 2>/dev/null || true
    
    # Copy tools
    mkdir -p "$HOOKS_DIR/tools"
    cp "$script_dir/test-system.sh" "$HOOKS_DIR/tools/"
    cp "$script_dir/check-hooks.sh" "$HOOKS_DIR/tools/"
    cp "$script_dir/README.md" "$HOOKS_DIR/tools/" 2>/dev/null || true
    
    # Make scripts executable
    chmod +x "$HOOKS_DIR/hooks"/*/*.sh "$HOOKS_DIR/tools"/*.sh
    
    echo -e "${GREEN}✓ Hook files copied${NC}"
}

# Configure Claude Code hooks
configure_claude_hooks() {
    echo -e "\n${BLUE}Configuring Claude Code hooks...${NC}"
    
    # Create default settings if file doesn't exist
    if [[ ! -f "$SETTINGS_FILE" ]]; then
        echo '{}' > "$SETTINGS_FILE"
    fi
    
    # Backup existing settings
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Add hooks configuration
    local hooks_config=$(jq --arg hooks_dir "$HOOKS_DIR" '.hooks = {
        "UserPromptSubmit": [
            {
                "command": ($hooks_dir + "/hooks/user-prompt-submit/query-router.sh"),
                "description": "Route queries through semantic search hierarchy",
                "timeout": 30
            }
        ],
        "PreToolUse": [
            {
                "command": ($hooks_dir + "/hooks/pre-tool-use/context-preparer.sh"),
                "description": "Prepare context using semantic tools", 
                "timeout": 45
            }
        ]
    }' "$SETTINGS_FILE")
    
    echo "$hooks_config" > "$SETTINGS_FILE"
    
    echo -e "${GREEN}✓ Claude Code hooks configured${NC}"
    echo -e "${YELLOW}Settings saved to: $SETTINGS_FILE${NC}"
}

# Create user configuration
create_user_config() {
    echo -e "\n${BLUE}Creating user configuration...${NC}"
    
    local user_config="$CLAUDE_DIR/semantic-search-config.sh"
    
    if [[ ! -f "$user_config" ]]; then
        cat > "$user_config" << 'EOF'
# Semantic Search Hooks User Configuration
# This file is sourced to customize hook behavior

# ============================================
# VISIBILITY SETTINGS - See hook activity in Claude Code chat
# ============================================
# Enable to see when hooks are working:
HOOK_VERBOSE="true"
SHOW_TOOL_SELECTION="true"
SHOW_PERFORMANCE="false"

# For debugging (more detailed output):
# HOOK_DEBUG="true"

# ============================================
# TOOL AND PERFORMANCE SETTINGS
# ============================================

# Logging level (debug, info, warn, error)
LOG_LEVEL="info"

# Tool priorities (higher = preferred)
# TOOL_PRIORITIES["serena"]=10
# TOOL_PRIORITIES["ast-grep"]=7  
# TOOL_PRIORITIES["code2prompt"]=5

# Token budgets by operation
# TOKEN_BUDGETS["file_context"]=3000
# TOKEN_BUDGETS["project_overview"]=8000

# Fallback chain customization
# SEMANTIC_FALLBACK_CHAIN=("ast-grep" "grep" "basic")

# Cache settings
# CACHE_TTL=3600  # 1 hour
# CACHE_MAX_SIZE=100

# Environment-specific settings
# SEMANTIC_SEARCH_ENV="development"  # development, testing, production
EOF
        
        echo -e "${GREEN}✓ User configuration created${NC}"
        echo -e "${YELLOW}Edit $user_config to customize behavior${NC}"
    else
        echo -e "${YELLOW}User configuration already exists${NC}"
    fi
}

# Run initial tests
run_initial_tests() {
    echo -e "\n${BLUE}Running initial tests...${NC}"
    
    # Run basic health check
    if "$HOOKS_DIR/test-system.sh" health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ System health check passed${NC}"
    else
        echo -e "${YELLOW}⚠ System health check had issues (check logs for details)${NC}"
    fi
    
    # Test tool availability
    cd "$HOOKS_DIR"
    source lib/tool-detection.sh
    
    local available_tools=$(check_tool_availability)
    echo -e "${GREEN}Available tools: $available_tools${NC}"
    
    if [[ -n "$available_tools" ]]; then
        echo -e "${GREEN}✓ At least one semantic tool is available${NC}"
    else
        echo -e "${YELLOW}⚠ No semantic tools detected - system will use basic fallbacks${NC}"
    fi
}

# Print post-installation instructions
print_instructions() {
    echo -e "\n${GREEN}Installation Complete!${NC}"
    echo "======================"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Restart Claude Code to load the new hooks"
    echo "2. Test the system with a query like 'find authentication functions'"
    echo "3. Watch for hook activity in the chat (🔍 symbols indicate hooks working)"
    echo ""
    echo -e "${BLUE}Visibility Settings:${NC}"
    echo "- Default: Hook activity is visible in chat"
    echo "- Check status: $HOOKS_DIR/check-hooks.sh"
    echo "- Customize visibility: Edit $CLAUDE_DIR/semantic-search-config.sh"
    echo ""
    echo -e "${BLUE}Configuration Files:${NC}"
    echo "- Claude hooks: $SETTINGS_FILE"
    echo "- User config: $CLAUDE_DIR/semantic-search-config.sh"
    echo "- Hook scripts: $HOOKS_DIR/"
    echo ""
    echo -e "${BLUE}Testing & Monitoring:${NC}"
    echo "- Check hook status: $HOOKS_DIR/check-hooks.sh"
    echo "- Run full tests: $HOOKS_DIR/test-system.sh"
    echo "- Check health: $HOOKS_DIR/test-system.sh health"
    echo "- View logs: tail -f $CLAUDE_DIR/semantic-search.log"
    echo ""
    echo -e "${BLUE}Optional Tool Installation:${NC}"
    echo "- ast-grep: npm install -g @ast-grep/cli"
    echo "- code2prompt: cargo install code2prompt"
    echo "- ripgrep: cargo install ripgrep"
    echo ""
    echo -e "${YELLOW}Note: Restart Claude Code to activate the hooks!${NC}"
}

# Uninstall function
uninstall() {
    echo -e "${BLUE}Uninstalling semantic search hooks...${NC}"
    
    # Backup settings and remove hooks configuration
    if [[ -f "$SETTINGS_FILE" ]]; then
        cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        jq 'del(.hooks)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
        echo -e "${GREEN}✓ Hooks removed from Claude settings${NC}"
    fi
    
    # Remove hook files
    if [[ -d "$HOOKS_DIR" ]]; then
        rm -rf "$HOOKS_DIR"
        echo -e "${GREEN}✓ Hook files removed${NC}"
    fi
    
    # Clean cache
    rm -rf "$CLAUDE_DIR/semantic-search-cache" 2>/dev/null || true
    
    # Remove logs
    rm -f "$CLAUDE_DIR/semantic-search.log"* 2>/dev/null || true
    
    echo -e "${GREEN}Uninstallation complete${NC}"
    echo -e "${YELLOW}Restart Claude Code to complete removal${NC}"
}

# Update function
update() {
    echo -e "${BLUE}Updating semantic search hooks...${NC}"
    
    # Backup current installation
    if [[ -d "$HOOKS_DIR" ]]; then
        mv "$HOOKS_DIR" "$HOOKS_DIR.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✓ Current installation backed up${NC}"
    fi
    
    # Reinstall
    setup_directories
    copy_hook_files
    
    # Don't reconfigure hooks - preserve existing settings
    echo -e "${GREEN}✓ Hook files updated${NC}"
    echo -e "${YELLOW}Configuration preserved - restart Claude Code to use updates${NC}"
}

# Main function
main() {
    local command="${1:-install}"
    
    case "$command" in
        "install")
            check_prerequisites
            install_semantic_tools
            setup_directories
            copy_hook_files
            configure_claude_hooks
            create_user_config
            run_initial_tests
            print_instructions
            ;;
        "uninstall")
            uninstall
            ;;
        "update")
            update
            ;;
        "test")
            if [[ -f "$HOOKS_DIR/test-system.sh" ]]; then
                "$HOOKS_DIR/test-system.sh"
            else
                echo -e "${RED}Hooks not installed. Run: $0 install${NC}"
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 [install|uninstall|update|test]"
            echo ""
            echo "Commands:"
            echo "  install   - Install semantic search hooks (default)"
            echo "  uninstall - Remove semantic search hooks"
            echo "  update    - Update hook files (preserve config)"
            echo "  test      - Run test suite"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"