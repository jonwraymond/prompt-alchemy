#!/bin/bash

# Agent Ruleset Validation Script
# Validates compliance with the comprehensive agent ruleset

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$HOME/.claude/agent-rules-validation.log"
VALIDATION_RESULTS_DIR="$PROJECT_ROOT/validation-results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AGENT-RULES-VALIDATION] $1" | tee -a "$LOG_FILE"
}

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_test() { echo -e "${PURPLE}[TEST]${NC} $1"; }

# Validation counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Test tracking functions
start_test() {
    local test_name="$1"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_test "Starting: $test_name"
}

pass_test() {
    local test_name="$1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    print_success "PASSED: $test_name"
}

fail_test() {
    local test_name="$1"
    local error_msg="$2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$test_name: $error_msg")
    print_error "FAILED: $test_name - $error_msg"
}

# Setup validation environment
setup_validation() {
    log "Setting up agent ruleset validation environment"
    
    # Create validation results directory
    mkdir -p "$VALIDATION_RESULTS_DIR"
    
    # Create log file if it doesn't exist
    touch "$LOG_FILE"
    
    print_success "Validation environment setup complete"
}

# Test 1: Agent Directory Structure
test_agent_directory_structure() {
    start_test "agent_directory_structure"
    
    local agents_dir="$PROJECT_ROOT/.claude/agents"
    local required_files=("README.md" "go-backend-specialist.md" "react-frontend-specialist.md" "provider-integration-specialist.md" "testing-qa-specialist.md" "docker-devops-specialist.md" "mcp-integration-specialist.md")
    
    if [ ! -d "$agents_dir" ]; then
        fail_test "agent_directory_structure" "Agents directory not found at $agents_dir"
        return
    fi
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [ ! -f "$agents_dir/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        pass_test "agent_directory_structure"
    else
        fail_test "agent_directory_structure" "Missing required agent files: ${missing_files[*]}"
    fi
}

# Test 2: Agent Metadata Structure
test_agent_metadata_structure() {
    start_test "agent_metadata_structure"
    
    local agents_dir="$PROJECT_ROOT/.claude/agents"
    local agent_files=("go-backend-specialist.md" "react-frontend-specialist.md" "provider-integration-specialist.md" "testing-qa-specialist.md" "docker-devops-specialist.md" "mcp-integration-specialist.md")
    
    local metadata_errors=()
    
    for agent_file in "${agent_files[@]}"; do
        local file_path="$agents_dir/$agent_file"
        
        if [ -f "$file_path" ]; then
            # Check for YAML frontmatter (should start with ---)
            if ! head -1 "$file_path" | grep -q "^---$"; then
                metadata_errors+=("$agent_file: Missing YAML frontmatter")
            fi
            
            # Check for required metadata fields
            if ! grep -q "^name:" "$file_path"; then
                metadata_errors+=("$agent_file: Missing 'name' field")
            fi
            
            if ! grep -q "^description:" "$file_path"; then
                metadata_errors+=("$agent_file: Missing 'description' field")
            fi
            
            if ! grep -q "^tools:" "$file_path"; then
                metadata_errors+=("$agent_file: Missing 'tools' field")
            fi
            
            # Check for core responsibilities section
            if ! grep -q "## Core Responsibilities" "$file_path"; then
                metadata_errors+=("$agent_file: Missing 'Core Responsibilities' section")
            fi
            
            # Check for architecture understanding section (some agents might have different names)
            if ! grep -q "Architecture Understanding\|Key Architecture Understanding\|MCP Architecture Understanding\|Provider System Architecture\|Testing Architecture" "$file_path"; then
                metadata_errors+=("$agent_file: Missing 'Architecture Understanding' section")
            fi
        fi
    done
    
    if [ ${#metadata_errors[@]} -eq 0 ]; then
        pass_test "agent_metadata_structure"
    else
        fail_test "agent_metadata_structure" "Metadata structure errors: ${metadata_errors[*]}"
    fi
}

# Test 3: Configuration File Structure
test_configuration_structure() {
    start_test "configuration_structure"
    
    local config_file="$PROJECT_ROOT/.claude/settings.local.json"
    
    if [ ! -f "$config_file" ]; then
        fail_test "configuration_structure" "Configuration file not found at $config_file"
        return
    fi
    
    # Check if it's valid JSON
    if ! jq . "$config_file" >/dev/null 2>&1; then
        fail_test "configuration_structure" "Configuration file is not valid JSON"
        return
    fi
    
    # Check for required sections
    local config_errors=()
    
    if ! jq -e '.permissions' "$config_file" >/dev/null 2>&1; then
        config_errors+=("Missing 'permissions' section")
    fi
    
    if ! jq -e '.hooks' "$config_file" >/dev/null 2>&1; then
        config_errors+=("Missing 'hooks' section")
    fi
    
    if ! jq -e '.hooks.PostToolUse' "$config_file" >/dev/null 2>&1; then
        config_errors+=("Missing 'PostToolUse' hooks")
    fi
    
    if [ ${#config_errors[@]} -eq 0 ]; then
        pass_test "configuration_structure"
    else
        fail_test "configuration_structure" "Configuration structure errors: ${config_errors[*]}"
    fi
}

# Test 4: Script Structure Compliance
test_script_structure() {
    start_test "script_structure"
    
    local scripts_dir="$PROJECT_ROOT/scripts"
    local script_files=("auto-commit.sh" "setup-provider.sh" "debug-helper.sh" "integration-test.sh" "run-e2e-tests.sh")
    
    local script_errors=()
    
    for script_file in "${script_files[@]}"; do
        local file_path="$scripts_dir/$script_file"
        
        if [ -f "$file_path" ]; then
            # Check for shebang
            if ! head -1 "$file_path" | grep -q "^#!/bin/bash"; then
                script_errors+=("$script_file: Missing shebang")
            fi
            
            # Check for set -e
            if ! grep -q "set -e" "$file_path"; then
                script_errors+=("$script_file: Missing 'set -e'")
            fi
            
            # Check for logging function (more flexible pattern)
            if ! grep -q "log()" "$file_path"; then
                script_errors+=("$script_file: Missing logging function")
            fi
            
            # Check for configuration section (more flexible pattern)
            if ! grep -q "Configuration\|LOG_FILE\|PROJECT_DIR" "$file_path"; then
                script_errors+=("$script_file: Missing configuration section")
            fi
        else
            script_errors+=("$script_file: File not found")
        fi
    done
    
    if [ ${#script_errors[@]} -eq 0 ]; then
        pass_test "script_structure"
    else
        fail_test "script_structure" "Script structure errors: ${script_errors[*]}"
    fi
}

# Test 5: Naming Convention Compliance
test_naming_conventions() {
    start_test "naming_conventions"
    
    local naming_errors=()
    
    # Check agent file naming
    local agents_dir="$PROJECT_ROOT/.claude/agents"
    if [ -d "$agents_dir" ]; then
        for file in "$agents_dir"/*.md; do
            if [ -f "$file" ]; then
                local basename=$(basename "$file" .md)
                # Allow README.md as an exception
                if [[ "$basename" != "README" && ! "$basename" =~ ^[a-z-]+-specialist$ ]]; then
                    naming_errors+=("Agent file '$file' doesn't follow naming convention")
                fi
            fi
        done
    fi
    
    # Check script naming
    local scripts_dir="$PROJECT_ROOT/scripts"
    if [ -d "$scripts_dir" ]; then
        for file in "$scripts_dir"/*.sh; do
            if [ -f "$file" ]; then
                local basename=$(basename "$file" .sh)
                # More flexible pattern for script naming, allow run-e2e-tests as exception
                if [[ ! "$basename" =~ ^[a-z-]+(-[a-z-]+)*$ ]] && [[ "$basename" != "run-e2e-tests" ]]; then
                    naming_errors+=("Script file '$file' doesn't follow naming convention")
                fi
            fi
        done
    fi
    
    if [ ${#naming_errors[@]} -eq 0 ]; then
        pass_test "naming_conventions"
    else
        fail_test "naming_conventions" "Naming convention errors: ${naming_errors[*]}"
    fi
}

# Test 6: Documentation Compliance
test_documentation_compliance() {
    start_test "documentation_compliance"
    
    local doc_errors=()
    
    # Check for README files
    local required_readmes=(".claude/agents/README.md" "README.md" "CLAUDE.md")
    
    for readme in "${required_readmes[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$readme" ]; then
            doc_errors+=("Missing required documentation: $readme")
        fi
    done
    
    # Check for agent documentation
    local agents_dir="$PROJECT_ROOT/.claude/agents"
    if [ -d "$agents_dir" ]; then
        for agent_file in "$agents_dir"/*.md; do
            if [ -f "$agent_file" ] && [ "$(basename "$agent_file")" != "README.md" ]; then
                # Check for core responsibilities section
                if ! grep -q "## Core Responsibilities" "$agent_file"; then
                    doc_errors+=("$(basename "$agent_file"): Missing Core Responsibilities section")
                fi
                
                # Check for workflow process section (more flexible)
                if ! grep -q "Workflow Process\|Development Workflow\|## Workflow Process" "$agent_file"; then
                    doc_errors+=("$(basename "$agent_file"): Missing Workflow Process section")
                fi
            fi
        done
    fi
    
    if [ ${#doc_errors[@]} -eq 0 ]; then
        pass_test "documentation_compliance"
    else
        fail_test "documentation_compliance" "Documentation compliance errors: ${doc_errors[*]}"
    fi
}

# Test 7: Security and Permission Compliance
test_security_compliance() {
    start_test "security_compliance"
    
    local security_errors=()
    
    # Check configuration file permissions
    local config_file="$PROJECT_ROOT/.claude/settings.local.json"
    if [ -f "$config_file" ]; then
        # Handle both macOS and Linux stat commands
        local perms
        if [[ "$OSTYPE" == "darwin"* ]]; then
            perms=$(stat -f "%Lp" "$config_file")
        else
            perms=$(stat -c "%a" "$config_file")
        fi
        
        if [ "$perms" != "600" ] && [ "$perms" != "644" ]; then
            security_errors+=("Configuration file has insecure permissions: $perms")
        fi
    fi
    
    # Check for explicit allow/deny lists in configuration
    if [ -f "$config_file" ]; then
        if ! jq -e '.permissions.allow' "$config_file" >/dev/null 2>&1; then
            security_errors+=("Missing explicit allow list in permissions")
        fi
        
        if ! jq -e '.permissions.deny' "$config_file" >/dev/null 2>&1; then
            security_errors+=("Missing explicit deny list in permissions")
        fi
    fi
    
    if [ ${#security_errors[@]} -eq 0 ]; then
        pass_test "security_compliance"
    else
        fail_test "security_compliance" "Security compliance errors: ${security_errors[*]}"
    fi
}

# Test 8: Automation Hook Compliance
test_automation_hooks() {
    start_test "automation_hooks"
    
    local hook_errors=()
    
    local config_file="$PROJECT_ROOT/.claude/settings.local.json"
    if [ -f "$config_file" ]; then
        # Check for PostToolUse hooks
        if ! jq -e '.hooks.PostToolUse' "$config_file" >/dev/null 2>&1; then
            hook_errors+=("Missing PostToolUse hooks")
        else
            # Check for auto-commit hook (more flexible pattern)
            if ! jq -e '.hooks.PostToolUse[] | select(.matcher | contains("Write") or contains("Edit") or contains("MultiEdit"))' "$config_file" >/dev/null 2>&1; then
                hook_errors+=("Missing auto-commit hook for file operations")
            fi
        fi
    else
        hook_errors+=("Configuration file not found")
    fi
    
    # Check if auto-commit script exists
    if [ ! -f "$PROJECT_ROOT/scripts/auto-commit.sh" ]; then
        hook_errors+=("Auto-commit script not found")
    fi
    
    if [ ${#hook_errors[@]} -eq 0 ]; then
        pass_test "automation_hooks"
    else
        fail_test "automation_hooks" "Automation hook errors: ${hook_errors[*]}"
    fi
}

# Generate validation report
generate_validation_report() {
    log "Generating agent ruleset validation report"
    
    local report_file="$VALIDATION_RESULTS_DIR/agent-rules-validation-report.txt"
    
    cat > "$report_file" << EOF
Agent Ruleset Validation Report
===============================

Date: $(date)
Project: $PROJECT_ROOT
Validation Results Directory: $VALIDATION_RESULTS_DIR

Test Summary:
- Total Tests: $TESTS_TOTAL
- Passed: $TESTS_PASSED
- Failed: $TESTS_FAILED
- Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%

Test Results:
EOF

    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo "" >> "$report_file"
        echo "Failed Tests:" >> "$report_file"
        for failed_test in "${FAILED_TESTS[@]}"; do
            echo "- $failed_test" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi
    
    echo "Validation Details:" >> "$report_file"
    echo "- Agent Directory Structure: Validates .claude/agents/ directory and required files" >> "$report_file"
    echo "- Agent Metadata Structure: Validates YAML frontmatter and required sections" >> "$report_file"
    echo "- Configuration Structure: Validates .claude/settings.local.json format" >> "$report_file"
    echo "- Script Structure: Validates script patterns and conventions" >> "$report_file"
    echo "- Naming Conventions: Validates file naming patterns" >> "$report_file"
    echo "- Documentation Compliance: Validates required documentation" >> "$report_file"
    echo "- Security Compliance: Validates security and permission settings" >> "$report_file"
    echo "- Automation Hooks: Validates hook configuration and scripts" >> "$report_file"
    
    echo "" >> "$report_file"
    echo "Recommendations:" >> "$report_file"
    if [ $TESTS_FAILED -gt 0 ]; then
        echo "- Fix failed tests to ensure full compliance" >> "$report_file"
        echo "- Review and update agent definitions as needed" >> "$report_file"
        echo "- Update configuration files to match requirements" >> "$report_file"
    else
        echo "- All tests passed! Agent ruleset is fully compliant" >> "$report_file"
        echo "- Continue monitoring for any deviations" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "Report Generated: $(date)" >> "$report_file"
    
    log "Validation report saved to: $report_file"
    
    # Display summary
    echo ""
    echo "========================================"
    echo "        VALIDATION SUMMARY"
    echo "========================================"
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
    echo "========================================"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        echo ""
        print_error "Some validation tests failed. See report for details."
        return 1
    else
        echo ""
        print_success "All validation tests passed! Agent ruleset is compliant."
        return 0
    fi
}

# Main validation function
main() {
    echo "Agent Ruleset Validation Suite"
    echo "=============================="
    echo ""
    
    log "Starting agent ruleset validation"
    
    # Setup validation environment
    setup_validation
    
    # Run all validation tests
    test_agent_directory_structure
    test_agent_metadata_structure
    test_configuration_structure
    test_script_structure
    test_naming_conventions
    test_documentation_compliance
    test_security_compliance
    test_automation_hooks
    
    # Generate validation report
    local exit_code=0
    if ! generate_validation_report; then
        exit_code=1
    fi
    
    log "Agent ruleset validation completed"
    exit $exit_code
}

# Run main function
main "$@" 