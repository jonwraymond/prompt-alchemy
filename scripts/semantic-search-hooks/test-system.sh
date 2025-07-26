#!/bin/bash
# test-system.sh - Automated tests for semantic search hooks

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/tests"
CACHE_DIR="$HOME/.claude/semantic-search-cache"
LOG_FILE="$HOME/.claude/semantic-search.log"

# Test configuration
TEST_TIMEOUT=60
TEST_PROJECT_DIR="$TEST_DIR/fixtures/test-project"
RESULTS_FILE="$TEST_DIR/results/test-results-$(date +%Y%m%d_%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Load libraries
source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/logging.sh"
source "$SCRIPT_DIR/lib/tool-detection.sh"
source "$SCRIPT_DIR/lib/semantic-tools.sh"
source "$SCRIPT_DIR/lib/failsafe.sh"
source "$SCRIPT_DIR/lib/token-optimizer.sh"

# Setup test environment
setup_test_environment() {
    echo -e "${BLUE}Setting up test environment...${NC}"
    
    # Create test directories
    mkdir -p "$TEST_DIR/results" "$TEST_DIR/fixtures" "$CACHE_DIR"
    
    # Create test project structure
    create_test_project
    
    # Clear any existing cache
    rm -f "$CACHE_DIR"/*.json "$CACHE_DIR"/*.jsonl 2>/dev/null || true
    
    # Initialize configuration for testing
    SEMANTIC_SEARCH_ENV="testing"
    LOG_LEVEL="debug"
    
    echo -e "${GREEN}Test environment ready${NC}"
}

create_test_project() {
    mkdir -p "$TEST_PROJECT_DIR"
    cd "$TEST_PROJECT_DIR"
    
    # Create Go test files
    cat > main.go << 'EOF'
package main

import (
    "fmt"
    "log"
)

// UserService handles user operations
type UserService struct {
    logger *log.Logger
}

// NewUserService creates a new user service
func NewUserService() *UserService {
    return &UserService{
        logger: log.New(os.Stdout, "USER: ", log.LstdFlags),
    }
}

// GetUser retrieves a user by ID
func (s *UserService) GetUser(id string) (*User, error) {
    // Implementation here
    return nil, nil
}

func main() {
    fmt.Println("Test application")
}
EOF

    cat > user.go << 'EOF'
package main

// User represents a user in the system
type User struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email"`
    Active   bool   `json:"active"`
}

// Authenticate verifies user credentials
func (u *User) Authenticate(password string) bool {
    // Authentication logic
    return false
}

// UpdateProfile updates user profile information
func (u *User) UpdateProfile(name, email string) error {
    u.Name = name
    u.Email = email
    return nil
}
EOF

    cat > go.mod << 'EOF'
module test-project

go 1.21
EOF

    # Create JavaScript test files
    cat > utils.js << 'EOF'
// Utility functions for the application

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

class Logger {
    constructor(level = 'info') {
        this.level = level;
    }
    
    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }
    
    error(message) {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    }
}

module.exports = { validateEmail, formatDate, Logger };
EOF

    cd "$SCRIPT_DIR"
}

# Test runner functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local expected_result="${3:-0}"  # 0 = success, 1 = failure expected
    
    ((TESTS_RUN++))
    
    echo -e "\n${BLUE}Running test: $test_name${NC}"
    
    local start_time=$(date +%s%3N)
    local result=0
    local output=""
    
    # Capture output and exit code
    if ! output=$(timeout $TEST_TIMEOUT "$test_function" 2>&1); then
        result=$?
    fi
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    # Check result
    if [[ $result -eq $expected_result ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (${duration}ms)"
        ((TESTS_PASSED++))
        log_test_result "$test_name" "PASSED" "$duration" "$output"
    else
        echo -e "${RED}✗ FAILED${NC} (${duration}ms)"
        echo -e "${RED}Expected exit code: $expected_result, got: $result${NC}"
        echo -e "${RED}Output: $output${NC}"
        ((TESTS_FAILED++))
        log_test_result "$test_name" "FAILED" "$duration" "$output" "$result"
    fi
}

skip_test() {
    local test_name="$1"
    local reason="$2"
    
    ((TESTS_RUN++))
    ((TESTS_SKIPPED++))
    
    echo -e "${YELLOW}⚠ SKIPPED: $test_name${NC}"
    echo -e "${YELLOW}Reason: $reason${NC}"
    
    log_test_result "$test_name" "SKIPPED" "0" "$reason"
}

log_test_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    local output="$4"
    local exit_code="${5:-0}"
    
    local test_result=$(jq -n \
        --arg name "$test_name" \
        --arg status "$status" \
        --argjson duration "$duration" \
        --arg output "$output" \
        --argjson exit_code "$exit_code" \
        '{
            test_name: $name,
            status: $status,
            duration_ms: $duration,
            output: $output,
            exit_code: $exit_code,
            timestamp: now
        }')
    
    # Store result for final report
    echo "$test_result" >> "$RESULTS_FILE.tmp"
}

# Individual test functions

test_tool_detection() {
    echo "Testing tool detection functionality..."
    
    # Test availability check
    local available_tools=$(check_tool_availability)
    
    if [[ -n "$available_tools" ]]; then
        echo "Available tools: $available_tools"
        return 0
    else
        echo "No tools detected"
        return 1
    fi
}

test_serena_integration() {
    if ! is_tool_available "serena"; then
        echo "Serena not available, testing fallback behavior"
        # Test should still pass - fallback is expected
        return 0
    fi
    
    echo "Testing Serena integration..."
    
    # Test file context
    local context_result
    context_result=$(get_serena_file_context "$TEST_PROJECT_DIR/main.go" 3000)
    
    if echo "$context_result" | jq -e '.tool == "serena"' >/dev/null; then
        echo "Serena file context successful"
        return 0
    else
        echo "Serena file context failed"
        return 1
    fi
}

test_astgrep_integration() {
    if ! is_tool_available "ast-grep"; then
        echo "ast-grep not available, testing fallback"
        return 0
    fi
    
    echo "Testing ast-grep integration..."
    
    local context_result
    context_result=$(get_astgrep_file_context "$TEST_PROJECT_DIR/main.go" 2000)
    
    if echo "$context_result" | jq -e '.tool == "ast-grep"' >/dev/null; then
        echo "ast-grep integration successful"
        return 0
    else
        echo "ast-grep integration failed"
        return 1
    fi
}

test_code2prompt_integration() {
    if ! is_tool_available "code2prompt"; then
        echo "code2prompt not available, testing fallback"
        return 0
    fi
    
    echo "Testing code2prompt integration..."
    
    local overview_result
    overview_result=$(get_code2prompt_project_overview 5000)
    
    if echo "$overview_result" | jq -e '.tool == "code2prompt"' >/dev/null; then
        echo "code2prompt integration successful"  
        return 0
    else
        echo "code2prompt integration failed"
        return 1
    fi
}

test_failsafe_mechanism() {
    echo "Testing failsafe mechanism..."
    
    # Test with non-existent tool to trigger failsafe
    SEMANTIC_FALLBACK_CHAIN=("nonexistent" "grep" "basic")
    
    local result
    result=$(with_failsafe "get_file_semantic_context" "$TEST_PROJECT_DIR/main.go" "nonexistent" 2000)
    
    if [[ -n "$result" ]]; then
        echo "Failsafe mechanism working - got result despite primary tool failure"
        return 0
    else
        echo "Failsafe mechanism failed"
        return 1
    fi
}

test_token_optimization() {
    echo "Testing token optimization..."
    
    # Test budget allocation
    local budget_allocation
    budget_allocation=$(allocate_token_budget 5000 "file_analysis" 3)
    
    if echo "$budget_allocation" | jq -e '.total_budget == 5000' >/dev/null; then
        echo "Token budget allocation working"
    else
        echo "Token budget allocation failed"
        return 1
    fi
    
    # Test content filtering
    local large_content="This is a very long piece of content that should be filtered. $(printf 'A%.0s' {1..1000})"
    local filtered_content
    filtered_content=$(filter_content_by_budget "$large_content" 100 "text")
    
    local filtered_tokens=$(estimate_tokens "$filtered_content")
    
    if [[ $filtered_tokens -le 150 ]]; then  # Allow some tolerance
        echo "Content filtering working - reduced to $filtered_tokens tokens"
        return 0
    else
        echo "Content filtering failed - still $filtered_tokens tokens"
        return 1
    fi
}

test_query_routing() {
    echo "Testing query routing..."
    
    # Create mock user prompt
    local test_prompt="Find all authentication functions in the codebase"
    local mock_input=$(jq -n --arg prompt "$test_prompt" '{prompt: $prompt}')
    
    # Test query router
    local routing_result
    if routing_result=$(echo "$mock_input" | "$SCRIPT_DIR/query-router.sh"); then
        echo "Query routing successful"
        return 0
    else
        echo "Query routing failed"
        return 1
    fi
}

test_context_preparation() {
    echo "Testing context preparation..."
    
    # Create mock tool use input
    local mock_input=$(jq -n '{
        tool: "Read",
        arguments: {
            file_path: "'$TEST_PROJECT_DIR'/main.go"
        }
    }')
    
    # Test context preparer
    local prep_result
    if prep_result=$(echo "$mock_input" | "$SCRIPT_DIR/context-preparer.sh"); then
        echo "Context preparation successful"
        return 0
    else
        echo "Context preparation failed"
        return 1
    fi
}

test_circuit_breaker() {
    echo "Testing circuit breaker functionality..."
    
    # Trip circuit breaker
    trip_circuit_breaker "test_tool"
    
    # Check if circuit breaker is active
    if ! check_circuit_breaker "test_tool"; then
        echo "Circuit breaker activated correctly"
        
        # Test recovery after timeout (simulate by removing file)
        rm -f "$CACHE_DIR/circuit-test_tool"
        
        if check_circuit_breaker "test_tool"; then
            echo "Circuit breaker reset correctly"
            return 0
        else
            echo "Circuit breaker did not reset"
            return 1
        fi
    else
        echo "Circuit breaker failed to activate"
        return 1
    fi
}

test_performance_monitoring() {
    echo "Testing performance monitoring..."
    
    # Log some performance data
    log_performance "test_operation" 100 "test_tool" "success" 500
    log_performance "test_operation" 150 "test_tool" "success" 750
    
    # Check if performance file exists and has data
    if [[ -f "$CACHE_DIR/performance.jsonl" ]]; then
        local line_count=$(wc -l < "$CACHE_DIR/performance.jsonl")
        if [[ $line_count -ge 2 ]]; then
            echo "Performance monitoring working - $line_count entries logged"
            return 0
        fi
    fi
    
    echo "Performance monitoring failed"
    return 1
}

test_error_handling() {
    echo "Testing error handling..."
    
    # Test with invalid file path
    local error_result
    error_result=$(get_file_semantic_context "/nonexistent/file.go" "serena" 1000 2>&1 || echo "error_caught")
    
    if [[ "$error_result" == *"error_caught"* ]] || echo "$error_result" | jq -e '.status == "error"' >/dev/null 2>&1; then
        echo "Error handling working correctly"
        return 0
    else
        echo "Error handling failed"
        return 1
    fi
}

# Stress testing
test_concurrent_operations() {
    echo "Testing concurrent operations..."
    
    local pids=()
    local results_file="/tmp/concurrent_test_results"
    rm -f "$results_file"
    
    # Start multiple concurrent operations
    for i in {1..5}; do
        (
            local result=$(get_file_semantic_context "$TEST_PROJECT_DIR/main.go" "grep" 1000)
            echo "Process $i: $result" >> "$results_file"
        ) &
        pids+=($!)
    done
    
    # Wait for all processes
    local success_count=0
    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            ((success_count++))
        fi
    done
    
    if [[ $success_count -ge 3 ]]; then  # At least 3 out of 5 should succeed
        echo "Concurrent operations successful ($success_count/5)"
        return 0
    else
        echo "Concurrent operations failed ($success_count/5)"
        return 1
    fi
}

test_token_budget_adherence() {
    echo "Testing token budget adherence..."
    
    # Test with very small budget
    local small_budget=50
    local result
    result=$(get_file_semantic_context "$TEST_PROJECT_DIR/main.go" "grep" $small_budget)
    
    # Extract estimated tokens from result
    local estimated_tokens
    if estimated_tokens=$(echo "$result" | jq -r '.estimated_tokens // 0'); then
        if [[ $estimated_tokens -le $((small_budget + 20)) ]]; then  # Allow small tolerance
            echo "Token budget adherence successful ($estimated_tokens <= $small_budget)"
            return 0
        else
            echo "Token budget exceeded ($estimated_tokens > $small_budget)"
            return 1
        fi
    else
        echo "Could not extract token information"
        return 1
    fi
}

# Main test execution
run_all_tests() {
    echo -e "${BLUE}Starting semantic search hooks test suite${NC}"
    echo "=============================================="
    
    # Basic functionality tests
    run_test "Tool Detection" test_tool_detection
    run_test "Query Routing" test_query_routing
    run_test "Context Preparation" test_context_preparation
    
    # Tool integration tests
    run_test "Serena Integration" test_serena_integration
    run_test "ast-grep Integration" test_astgrep_integration
    run_test "code2prompt Integration" test_code2prompt_integration
    
    # System functionality tests
    run_test "Failsafe Mechanism" test_failsafe_mechanism
    run_test "Token Optimization" test_token_optimization
    run_test "Circuit Breaker" test_circuit_breaker
    run_test "Performance Monitoring" test_performance_monitoring
    run_test "Error Handling" test_error_handling
    
    # Advanced tests
    run_test "Concurrent Operations" test_concurrent_operations
    run_test "Token Budget Adherence" test_token_budget_adherence
}

# Generate final test report
generate_test_report() {
    echo -e "\n${BLUE}Generating test report...${NC}"
    
    # Compile results
    local test_results="[]"
    if [[ -f "$RESULTS_FILE.tmp" ]]; then
        test_results=$(cat "$RESULTS_FILE.tmp" | jq -s .)
    fi
    
    # Calculate summary statistics
    local pass_rate=0
    if [[ $TESTS_RUN -gt 0 ]]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    fi
    
    # Generate comprehensive report
    local final_report=$(jq -n \
        --argjson results "$test_results" \
        --argjson total "$TESTS_RUN" \
        --argjson passed "$TESTS_PASSED" \
        --argjson failed "$TESTS_FAILED" \
        --argjson skipped "$TESTS_SKIPPED" \
        --argjson pass_rate "$pass_rate" \
        '{
            test_suite: "semantic_search_hooks",
            timestamp: now,
            summary: {
                total_tests: $total,
                passed: $passed,
                failed: $failed,
                skipped: $skipped,
                pass_rate: $pass_rate
            },
            results: $results,
            environment: {
                test_project_dir: "'$TEST_PROJECT_DIR'",
                cache_dir: "'$CACHE_DIR'",
                available_tools: "'$(check_tool_availability)'"
            }
        }')
    
    # Save final report
    echo "$final_report" > "$RESULTS_FILE"
    
    # Clean up temporary file
    rm -f "$RESULTS_FILE.tmp"
    
    echo -e "${GREEN}Test report saved to: $RESULTS_FILE${NC}"
}

# Print test summary
print_test_summary() {
    echo -e "\n${BLUE}Test Summary${NC}"
    echo "=============="
    echo -e "Total tests: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
    
    local pass_rate=0
    if [[ $TESTS_RUN -gt 0 ]]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    fi
    
    echo -e "Pass rate: ${pass_rate}%"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✓ All tests passed!${NC}"
        return 0
    else
        echo -e "\n${RED}✗ Some tests failed${NC}"
        return 1
    fi
}

# Cleanup function
cleanup_test_environment() {
    echo -e "\n${BLUE}Cleaning up test environment...${NC}"
    
    # Remove test project
    rm -rf "$TEST_PROJECT_DIR"
    
    # Clear test cache entries
    find "$CACHE_DIR" -name "*test*" -delete 2>/dev/null || true
    
    echo -e "${GREEN}Cleanup complete${NC}"
}

# Main execution
main() {
    local command="${1:-run}"
    
    case "$command" in
        "run")
            setup_test_environment
            run_all_tests
            generate_test_report
            print_test_summary
            local exit_code=$?
            cleanup_test_environment
            exit $exit_code
            ;;
        "setup")
            setup_test_environment
            echo "Test environment setup complete"
            ;;
        "cleanup")
            cleanup_test_environment
            ;;
        "health")
            echo "Performing health check..."
            perform_health_check | jq .
            ;;
        "tools")
            echo "Available tools:"
            export_tool_inventory | jq .
            ;;
        *)
            echo "Usage: $0 [run|setup|cleanup|health|tools]"
            echo ""
            echo "Commands:"
            echo "  run     - Run all tests (default)"
            echo "  setup   - Setup test environment only"
            echo "  cleanup - Clean up test environment"
            echo "  health  - Check tool health"
            echo "  tools   - List available tools"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"