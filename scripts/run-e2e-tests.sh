#!/bin/bash

# Comprehensive End-to-End Test Script for Prompt Alchemy
# This script tests all features and workflows of the Prompt Alchemy system
# Can be run locally or in CI environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BINARY_NAME="prompt-alchemy"
BINARY_PATH="$PROJECT_ROOT/$BINARY_NAME"
TEST_DATA_DIR="/tmp/prompt-alchemy-e2e-$(date +%s)"
TEST_CONFIG_DIR="$TEST_DATA_DIR/config"
TEST_RESULTS_DIR="$TEST_DATA_DIR/results"

# Test configuration
MOCK_MODE="${MOCK_MODE:-true}"
VERBOSE="${VERBOSE:-false}"
TEST_LEVEL="${TEST_LEVEL:-full}"  # smoke, full, comprehensive
CLEANUP="${CLEANUP:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Test tracking functions
start_test() {
    local test_name="$1"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    log_test "Starting: $test_name"
}

pass_test() {
    local test_name="$1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_success "PASSED: $test_name"
}

fail_test() {
    local test_name="$1"
    local error_msg="$2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$test_name: $error_msg")
    log_error "FAILED: $test_name - $error_msg"
}

# Utility functions
run_cmd() {
    local cmd="$1"
    local test_name="$2"
    local allow_failure="${3:-false}"
    
    if [ "$VERBOSE" = "true" ]; then
        log_info "Running: $cmd"
    fi
    
    if eval "$cmd" >/dev/null 2>&1; then
        return 0
    else
        local exit_code=$?
        if [ "$allow_failure" = "true" ]; then
            log_warning "Command failed (expected): $cmd"
            return $exit_code
        else
            fail_test "$test_name" "Command failed: $cmd"
            return $exit_code
        fi
    fi
}

run_cmd_with_output() {
    local cmd="$1"
    local test_name="$2"
    local output_file="$3"
    
    if [ "$VERBOSE" = "true" ]; then
        log_info "Running: $cmd"
    fi
    
    if eval "$cmd" > "$output_file" 2>&1; then
        return 0
    else
        local exit_code=$?
        fail_test "$test_name" "Command failed: $cmd (see $output_file)"
        return $exit_code
    fi
}

# Setup functions
setup_test_environment() {
    log_step "Setting up test environment"
    
    # Create test directories
    mkdir -p "$TEST_DATA_DIR"
    mkdir -p "$TEST_CONFIG_DIR"
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Create mock configuration
    cat > "$TEST_CONFIG_DIR/config.yaml" << 'EOF'
providers:
  openai:
    api_key: "mock-openai-key"
    model: "gpt-4o-mini"
    timeout: 30
  anthropic:
    api_key: "mock-anthropic-key"
    model: "claude-3-5-sonnet-20241022"
    timeout: 30
  google:
    api_key: "mock-google-key"
    model: "gemini-2.5-flash"
    timeout: 30
  openrouter:
    api_key: "mock-openrouter-key"
    model: "openrouter/auto"
    timeout: 30
  ollama:
    base_url: "http://localhost:11434"
    model: "llama2"
    timeout: 60

phases:
  idea:
    provider: "openai"
  human:
    provider: "anthropic"
  precision:
    provider: "google"

generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-3-5-sonnet-20241022"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536

embeddings:
  enabled: true
  standard_model: "text-embedding-3-small"
  standard_dimensions: 1536
EOF
    
    # Set environment variables for mock testing
    export PROMPT_ALCHEMY_MOCK_MODE="$MOCK_MODE"
    export PROMPT_ALCHEMY_TEST_MODE="true"
    
    log_success "Test environment setup complete"
}

build_binary() {
    log_step "Building Prompt Alchemy binary"
    
    cd "$PROJECT_ROOT"
    
    if ! make build >/dev/null 2>&1; then
        log_error "Failed to build binary"
        exit 1
    fi
    
    if [ ! -f "$BINARY_PATH" ]; then
        log_error "Binary not found at $BINARY_PATH"
        exit 1
    fi
    
    # Make binary executable
    chmod +x "$BINARY_PATH"
    
    # Test binary works
    if ! "$BINARY_PATH" version >/dev/null 2>&1; then
        log_error "Binary is not working"
        exit 1
    fi
    
    log_success "Binary built successfully"
}

# Test suites
test_basic_commands() {
    log_step "Testing Basic Commands"
    
    # Test version command
    start_test "version_command"
    if run_cmd "$BINARY_PATH version" "version_command"; then
        pass_test "version_command"
    fi
    
    start_test "version_short"
    if run_cmd "$BINARY_PATH version --short" "version_short"; then
        pass_test "version_short"
    fi
    
    start_test "version_json"
    if run_cmd "$BINARY_PATH version --json" "version_json"; then
        pass_test "version_json"
    fi
    
    # Test help system
    start_test "help_main"
    if run_cmd "$BINARY_PATH --help" "help_main"; then
        pass_test "help_main"
    fi
    
    start_test "help_generate"
    if run_cmd "$BINARY_PATH generate --help" "help_generate"; then
        pass_test "help_generate"
    fi
    
    start_test "help_search"
    if run_cmd "$BINARY_PATH search --help" "help_search"; then
        pass_test "help_search"
    fi
    
    # Test global flags
    start_test "global_flags"
    if run_cmd "$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --log-level debug version" "global_flags"; then
        pass_test "global_flags"
    fi
    
    start_test "data_dir_flag"
    if run_cmd "$BINARY_PATH --data-dir $TEST_DATA_DIR version" "data_dir_flag"; then
        pass_test "data_dir_flag"
    fi
}

test_generation_commands() {
    log_step "Testing Generation Commands"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Test basic generation
    start_test "basic_generation"
    if run_cmd "$base_cmd generate 'Create a REST API endpoint' --count 2 --output json --save=false" "basic_generation"; then
        pass_test "basic_generation"
    fi
    
    # Test personas
    for persona in code writing analysis generic; do
        start_test "persona_$persona"
        if run_cmd "$base_cmd generate 'Test prompt for $persona' --persona $persona --count 1 --save=false" "persona_$persona"; then
            pass_test "persona_$persona"
        fi
    done
    
    # Test phases
    start_test "custom_phases"
    if run_cmd "$base_cmd generate 'Test prompt' --phases 'idea,human' --save=false" "custom_phases"; then
        pass_test "custom_phases"
    fi
    
    # Test provider override
    start_test "provider_override"
    if run_cmd "$base_cmd generate 'Test prompt' --provider openai --save=false" "provider_override"; then
        pass_test "provider_override"
    fi
    
    # Test tags
    start_test "generation_tags"
    if run_cmd "$base_cmd generate 'Test prompt' --tags 'test,automation,e2e' --save=false" "generation_tags"; then
        pass_test "generation_tags"
    fi
    
    # Test temperature and max tokens
    start_test "generation_params"
    if run_cmd "$base_cmd generate 'Test prompt' --temperature 0.8 --max-tokens 1000 --save=false" "generation_params"; then
        pass_test "generation_params"
    fi
    
    # Test batch generation
    start_test "batch_generation"
    cat > "$TEST_DATA_DIR/batch-input.txt" << 'EOF'
Create a login form
Design a database schema
Write API documentation
EOF
    
    if run_cmd "$base_cmd batch --file $TEST_DATA_DIR/batch-input.txt --format text --workers 2 --dry-run" "batch_generation"; then
        pass_test "batch_generation"
    fi
}

test_search_commands() {
    log_step "Testing Search Commands"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Generate test data first
    log_info "Generating test data for search..."
    run_cmd "$base_cmd generate 'Create a user authentication system' --tags 'auth,security' --count 1" "search_test_data_1"
    run_cmd "$base_cmd generate 'Design a payment API' --tags 'api,payment' --count 1" "search_test_data_2"
    run_cmd "$base_cmd generate 'Build a dashboard' --tags 'ui,dashboard' --count 1" "search_test_data_3"
    
    # Test text search
    start_test "text_search"
    if run_cmd "$base_cmd search 'authentication' --limit 5 --output json" "text_search"; then
        pass_test "text_search"
    fi
    
    # Test search with filters
    start_test "search_with_tags"
    if run_cmd "$base_cmd search --tags 'auth' --limit 5" "search_with_tags"; then
        pass_test "search_with_tags"
    fi
    
    start_test "search_by_phase"
    if run_cmd "$base_cmd search --phase idea --limit 5" "search_by_phase"; then
        pass_test "search_by_phase"
    fi
    
    start_test "search_by_provider"
    if run_cmd "$base_cmd search --provider openai --limit 5" "search_by_provider"; then
        pass_test "search_by_provider"
    fi
    
    # Test semantic search (may fail if embeddings not available)
    start_test "semantic_search"
    if run_cmd "$base_cmd search 'user login' --semantic --similarity 0.7 --limit 3" "semantic_search" true; then
        pass_test "semantic_search"
    fi
    
    # Test combined filters
    start_test "combined_search_filters"
    if run_cmd "$base_cmd search --tags 'api' --phase idea --provider openai --limit 3" "combined_search_filters"; then
        pass_test "combined_search_filters"
    fi
}

test_management_commands() {
    log_step "Testing Management Commands"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Generate a test prompt for management
    log_info "Generating test prompt for management..."
    local output_file="$TEST_RESULTS_DIR/management_prompt.json"
    if run_cmd_with_output "$base_cmd generate 'Test prompt for management' --output json" "management_test_data" "$output_file"; then
        # Try to extract prompt ID (may not work with mocks)
        local prompt_id
        if command -v jq >/dev/null 2>&1 && [ -f "$output_file" ]; then
            prompt_id=$(jq -r '.prompts[0].id' "$output_file" 2>/dev/null || echo "")
        fi
        
        # Test update command (if we have a valid ID)
        if [ -n "$prompt_id" ] && [ "$prompt_id" != "null" ] && [ "$prompt_id" != "" ]; then
            start_test "update_command"
            if run_cmd "$base_cmd update '$prompt_id' --tags 'updated,test'" "update_command"; then
                pass_test "update_command"
            fi
        else
            log_warning "Skipping update test - no valid prompt ID"
        fi
    fi
    
    # Test metrics command
    start_test "metrics_command"
    if run_cmd "$base_cmd metrics --limit 10 --output json" "metrics_command"; then
        pass_test "metrics_command"
    fi
    
    start_test "metrics_with_filters"
    if run_cmd "$base_cmd metrics --phase idea --provider openai --limit 5" "metrics_with_filters"; then
        pass_test "metrics_with_filters"
    fi
    
    start_test "metrics_report"
    if run_cmd "$base_cmd metrics --report daily" "metrics_report"; then
        pass_test "metrics_report"
    fi
    
    # Test optimize command (may fail with mocks)
    start_test "optimize_command"
    if run_cmd "$base_cmd optimize --prompt 'Write a function to sort an array' --task 'Create efficient sorting algorithm' --max-iterations 2 --target-score 7.0" "optimize_command" true; then
        pass_test "optimize_command"
    fi
    
    # Test migrate command
    start_test "migrate_command"
    if run_cmd "$base_cmd migrate --dry-run --batch-size 5" "migrate_command"; then
        pass_test "migrate_command"
    fi
    
    # Test delete command (create a prompt first)
    log_info "Testing delete functionality..."
    if run_cmd_with_output "$base_cmd generate 'Prompt to delete' --output json" "delete_test_data" "$TEST_RESULTS_DIR/delete_prompt.json"; then
        if command -v jq >/dev/null 2>&1; then
            local delete_id
            delete_id=$(jq -r '.prompts[0].id' "$TEST_RESULTS_DIR/delete_prompt.json" 2>/dev/null || echo "")
            if [ -n "$delete_id" ] && [ "$delete_id" != "null" ]; then
                start_test "delete_command"
                if run_cmd "$base_cmd delete '$delete_id' --force" "delete_command"; then
                    pass_test "delete_command"
                fi
            fi
        fi
    fi
}

test_system_commands() {
    log_step "Testing System Commands"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Test config command
    start_test "config_command"
    if run_cmd "$base_cmd config" "config_command"; then
        pass_test "config_command"
    fi
    
    start_test "config_show"
    if run_cmd "$base_cmd config show" "config_show"; then
        pass_test "config_show"
    fi
    
    # Test providers command
    start_test "providers_command"
    if run_cmd "$base_cmd providers" "providers_command"; then
        pass_test "providers_command"
    fi
    
    # Test validate command
    start_test "validate_command"
    if run_cmd "$base_cmd validate --output json" "validate_command"; then
        pass_test "validate_command"
    fi
    
    start_test "validate_verbose"
    if run_cmd "$base_cmd validate --verbose" "validate_verbose"; then
        pass_test "validate_verbose"
    fi
    
    # Test validate with fix (dry run)
    start_test "validate_fix"
    if run_cmd "$base_cmd validate --fix" "validate_fix"; then
        pass_test "validate_fix"
    fi
}

test_mcp_server() {
    log_step "Testing MCP Server"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Test server startup and basic functionality
    start_test "mcp_server_startup"
    
    # Start server in background
    $base_cmd serve --host localhost --port 8080 &
    local mcp_pid=$!
    
    # Wait for server to start
    sleep 3
    
    # Test server health (if health endpoint exists)
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        pass_test "mcp_server_startup"
        
        # Test MCP endpoints
        start_test "mcp_endpoints"
        if curl -f http://localhost:8080/mcp/tools >/dev/null 2>&1; then
            pass_test "mcp_endpoints"
        else
            fail_test "mcp_endpoints" "MCP tools endpoint not responding"
        fi
        
        # Test specific MCP tools
        start_test "mcp_tools"
        local tool_test_result=0
        
        # Test get_version tool
        if ! curl -X POST http://localhost:8080/mcp/call \
            -H "Content-Type: application/json" \
            -d '{"method": "tools/call", "params": {"name": "get_version", "arguments": {}}}' \
            >/dev/null 2>&1; then
            tool_test_result=1
        fi
        
        # Test get_providers tool
        if ! curl -X POST http://localhost:8080/mcp/call \
            -H "Content-Type: application/json" \
            -d '{"method": "tools/call", "params": {"name": "get_providers", "arguments": {}}}' \
            >/dev/null 2>&1; then
            tool_test_result=1
        fi
        
        if [ $tool_test_result -eq 0 ]; then
            pass_test "mcp_tools"
        else
            fail_test "mcp_tools" "Some MCP tools are not responding"
        fi
    else
        fail_test "mcp_server_startup" "Server health check failed"
    fi
    
    # Stop server
    kill $mcp_pid >/dev/null 2>&1 || true
    wait $mcp_pid >/dev/null 2>&1 || true
}

test_integration_flows() {
    log_step "Testing Integration Flows"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Test complete prompt lifecycle
    start_test "prompt_lifecycle"
    local lifecycle_success=true
    
    # 1. Generate prompt
    local output_file="$TEST_RESULTS_DIR/lifecycle_prompt.json"
    if ! run_cmd_with_output "$base_cmd generate 'Create user registration API' --persona code --tags 'api,registration' --output json" "lifecycle_generate" "$output_file"; then
        lifecycle_success=false
    fi
    
    # 2. Search for prompt
    if ! run_cmd "$base_cmd search 'registration' --tags 'api' --limit 5" "lifecycle_search"; then
        lifecycle_success=false
    fi
    
    # 3. View metrics
    if ! run_cmd "$base_cmd metrics --limit 10" "lifecycle_metrics"; then
        lifecycle_success=false
    fi
    
    if [ "$lifecycle_success" = true ]; then
        pass_test "prompt_lifecycle"
    else
        fail_test "prompt_lifecycle" "One or more lifecycle steps failed"
    fi
    
    # Test multi-provider workflow
    start_test "multi_provider_workflow"
    local provider_success=true
    
    for provider in openai anthropic google; do
        if ! run_cmd "$base_cmd generate 'Test with $provider' --provider $provider --count 1 --save=false" "provider_$provider"; then
            provider_success=false
        fi
    done
    
    if [ "$provider_success" = true ]; then
        pass_test "multi_provider_workflow"
    else
        fail_test "multi_provider_workflow" "Some provider tests failed"
    fi
    
    # Test batch processing workflow
    start_test "batch_processing_workflow"
    
    # Create different format files
    cat > "$TEST_DATA_DIR/batch.json" << 'EOF'
[
  {"input": "Create login form", "persona": "code", "tags": ["ui", "auth"], "count": 1},
  {"input": "Write API docs", "persona": "writing", "tags": ["docs", "api"], "count": 1}
]
EOF
    
    cat > "$TEST_DATA_DIR/batch.csv" << 'EOF'
input,persona,tags,count
"Create dashboard","code","ui,dashboard",1
"Marketing copy","writing","marketing,email",1
EOF
    
    local batch_success=true
    
    # Test JSON batch
    if ! run_cmd "$base_cmd batch --file $TEST_DATA_DIR/batch.json --format json --workers 2 --dry-run" "batch_json"; then
        batch_success=false
    fi
    
    # Test CSV batch
    if ! run_cmd "$base_cmd batch --file $TEST_DATA_DIR/batch.csv --format csv --workers 2 --dry-run" "batch_csv"; then
        batch_success=false
    fi
    
    if [ "$batch_success" = true ]; then
        pass_test "batch_processing_workflow"
    else
        fail_test "batch_processing_workflow" "Batch processing tests failed"
    fi
}

test_error_handling() {
    log_step "Testing Error Handling"
    
    # Test invalid commands (these should fail)
    start_test "invalid_command"
    if run_cmd "$BINARY_PATH invalid-command" "invalid_command" true; then
        fail_test "invalid_command" "Invalid command should have failed"
    else
        pass_test "invalid_command"
    fi
    
    start_test "invalid_flag"
    if run_cmd "$BINARY_PATH generate --invalid-flag" "invalid_flag" true; then
        fail_test "invalid_flag" "Invalid flag should have failed"
    else
        pass_test "invalid_flag"
    fi
    
    start_test "missing_arguments"
    if run_cmd "$BINARY_PATH update" "missing_arguments" true; then
        fail_test "missing_arguments" "Missing arguments should have failed"
    else
        pass_test "missing_arguments"
    fi
    
    # Test invalid config
    start_test "invalid_config"
    echo "invalid: yaml: content:" > "$TEST_DATA_DIR/invalid-config.yaml"
    if run_cmd "$BINARY_PATH --config $TEST_DATA_DIR/invalid-config.yaml version" "invalid_config" true; then
        fail_test "invalid_config" "Invalid config should have failed"
    else
        pass_test "invalid_config"
    fi
    
    # Test invalid UUID
    start_test "invalid_uuid"
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    if run_cmd "$base_cmd update 'invalid-uuid' --tags 'test'" "invalid_uuid" true; then
        fail_test "invalid_uuid" "Invalid UUID should have failed"
    else
        pass_test "invalid_uuid"
    fi
}

test_performance() {
    log_step "Testing Performance (Basic)"
    
    local base_cmd="$BINARY_PATH --config $TEST_CONFIG_DIR/config.yaml --data-dir $TEST_DATA_DIR"
    
    # Test concurrent operations
    start_test "concurrent_operations"
    local concurrent_success=true
    
    # Run multiple generation commands in background
    for i in {1..3}; do
        $base_cmd generate "Concurrent test $i" --count 1 --save=false &
    done
    
    # Wait for all background jobs
    wait
    
    # Check if any failed
    if [ $? -eq 0 ]; then
        pass_test "concurrent_operations"
    else
        fail_test "concurrent_operations" "Some concurrent operations failed"
    fi
    
    # Test large input handling
    start_test "large_input"
    local large_input=$(printf 'A%.0s' {1..1000})  # 1000 character string
    if run_cmd "$base_cmd generate '$large_input' --save=false" "large_input"; then
        pass_test "large_input"
    fi
}

# Cleanup function
cleanup_test_environment() {
    if [ "$CLEANUP" = "true" ]; then
        log_step "Cleaning up test environment"
        rm -rf "$TEST_DATA_DIR"
        log_success "Cleanup complete"
    else
        log_info "Test data preserved at: $TEST_DATA_DIR"
    fi
}

# Report generation
generate_test_report() {
    log_step "Generating Test Report"
    
    local report_file="$TEST_RESULTS_DIR/test-report.txt"
    
    cat > "$report_file" << EOF
Prompt Alchemy End-to-End Test Report
=====================================

Date: $(date)
Test Level: $TEST_LEVEL
Mock Mode: $MOCK_MODE
Binary: $BINARY_PATH

Test Summary:
- Total Tests: $TESTS_TOTAL
- Passed: $TESTS_PASSED
- Failed: $TESTS_FAILED
- Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%

EOF

    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo "Failed Tests:" >> "$report_file"
        for failed_test in "${FAILED_TESTS[@]}"; do
            echo "- $failed_test" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi
    
    echo "Test Environment:" >> "$report_file"
    echo "- Test Data Dir: $TEST_DATA_DIR" >> "$report_file"
    echo "- Config Dir: $TEST_CONFIG_DIR" >> "$report_file"
    echo "- Results Dir: $TEST_RESULTS_DIR" >> "$report_file"
    
    log_info "Test report saved to: $report_file"
    
    # Display summary
    echo ""
    echo "========================================"
    echo "           TEST SUMMARY"
    echo "========================================"
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
    echo "========================================"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        echo ""
        log_error "Some tests failed. See details above."
        return 1
    else
        echo ""
        log_success "All tests passed!"
        return 0
    fi
}

# Main execution function
main() {
    echo "Prompt Alchemy End-to-End Test Suite"
    echo "====================================="
    echo ""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mock-mode)
                MOCK_MODE="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --test-level)
                TEST_LEVEL="$2"
                shift 2
                ;;
            --no-cleanup)
                CLEANUP="false"
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --mock-mode true|false    Use mock providers (default: true)"
                echo "  --verbose                 Enable verbose output"
                echo "  --test-level smoke|full|comprehensive  Test level (default: full)"
                echo "  --no-cleanup             Don't cleanup test data"
                echo "  --help                    Show this help"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    log_info "Starting E2E tests with configuration:"
    log_info "- Test Level: $TEST_LEVEL"
    log_info "- Mock Mode: $MOCK_MODE"
    log_info "- Verbose: $VERBOSE"
    log_info "- Cleanup: $CLEANUP"
    echo ""
    
    # Setup
    setup_test_environment
    build_binary
    
    # Run test suites based on test level
    case $TEST_LEVEL in
        smoke)
            test_basic_commands
            ;;
        full)
            test_basic_commands
            test_generation_commands
            test_search_commands
            test_management_commands
            test_system_commands
            test_integration_flows
            test_error_handling
            ;;
        comprehensive)
            test_basic_commands
            test_generation_commands
            test_search_commands
            test_management_commands
            test_system_commands
            test_mcp_server
            test_integration_flows
            test_error_handling
            test_performance
            ;;
        *)
            log_error "Invalid test level: $TEST_LEVEL"
            exit 1
            ;;
    esac
    
    # Generate report and cleanup
    local exit_code=0
    if ! generate_test_report; then
        exit_code=1
    fi
    
    cleanup_test_environment
    
    exit $exit_code
}

# Trap to ensure cleanup on exit
trap cleanup_test_environment EXIT

# Run main function
main "$@" 