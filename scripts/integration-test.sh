#!/bin/bash
# Integration Test for Prompt Alchemy
# Tests basic functionality to ensure the system works end-to-end

set -euo pipefail

# ==================== Configuration ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BINARY_NAME="prompt-alchemy"
BINARY_PATH="$PROJECT_ROOT/$BINARY_NAME"
TEST_DIR="/tmp/prompt-alchemy-integration-$(date +%s)"
LOG_DIR="${LOG_DIR:-$HOME/.prompt-alchemy/logs}"
LOG_FILE="$LOG_DIR/integration-test.log"
FEATURE_TOGGLE="${FEATURE_TOGGLE:-false}"
VERBOSE="${VERBOSE:-false}"

# ==================== Colors ====================
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# ==================== Functions ====================
# Ensure log directory exists
ensure_log_dir() {
    mkdir -p "$LOG_DIR"
}

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "$timestamp [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        INFO)
            echo -e "${YELLOW}[INFO]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        DEBUG)
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
    esac
}

# Error handling function
handle_error() {
    log ERROR "$1"
    exit 1
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ -d "$TEST_DIR" ]]; then
        log DEBUG "Cleaning up test directory: $TEST_DIR"
        rm -rf "$TEST_DIR"
    fi
    if [[ $exit_code -eq 0 ]]; then
        log SUCCESS "Integration tests completed successfully"
    else
        log ERROR "Integration tests failed with exit code: $exit_code"
    fi
}

# Validation function
validate_environment() {
    log INFO "Validating environment..."
    
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        handle_error "Invalid project directory: $PROJECT_ROOT"
    fi
    
    if [[ ! -f "$PROJECT_ROOT/go.mod" ]]; then
        handle_error "go.mod not found in project root: $PROJECT_ROOT"
    fi
    
    if ! command -v go &> /dev/null; then
        handle_error "Go is not installed or not in PATH"
    fi
    
    log SUCCESS "Environment validation passed"
}

# Build binary if needed
ensure_binary() {
    if [[ ! -f "$BINARY_PATH" ]]; then
        log INFO "Binary not found, building..."
        cd "$PROJECT_ROOT"
        if make build; then
            log SUCCESS "Binary built successfully"
        else
            handle_error "Failed to build binary"
        fi
    else
        log DEBUG "Binary already exists: $BINARY_PATH"
    fi
}

# Create test configuration
create_test_config() {
    cat > "$TEST_DIR/config.yaml" << 'EOF'
providers:
  openai:
    api_key: "test-key-openai"
    model: "gpt-4o-mini"
    enabled: true
  anthropic:
    api_key: "test-key-anthropic"
    model: "claude-3-sonnet-20240229"
    enabled: true

phases:
  prima_materia:
    provider: "openai"
    temperature: 0.7
  solutio:
    provider: "anthropic"
    temperature: 0.5
  coagulatio:
    provider: "openai"
    temperature: 0.3

generation:
  default_provider: "openai"
  default_temperature: 0.7
  default_max_tokens: 1000
  default_count: 1
  timeout: 30s

storage:
  type: "sqlite"
  path: ":memory:"

logging:
  level: "info"
  format: "text"
EOF
}

# Test runner function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-success}"
    
    log INFO "Running test: $test_name"
    
    if [[ "$VERBOSE" == "true" ]]; then
        log DEBUG "Command: $test_command"
    fi
    
    local output
    local exit_code=0
    
    output=$(eval "$test_command" 2>&1) || exit_code=$?
    
    if [[ "$expected_result" == "success" && $exit_code -eq 0 ]]; then
        log SUCCESS "$test_name passed"
        return 0
    elif [[ "$expected_result" == "failure" && $exit_code -ne 0 ]]; then
        log SUCCESS "$test_name passed (expected failure)"
        return 0
    else
        log ERROR "$test_name failed (exit code: $exit_code)"
        log ERROR "Output: $output"
        return 1
    fi
}

# ==================== Main ====================
main() {
    # Set up error handling
    trap cleanup EXIT
    
    # Initialize
    ensure_log_dir
    
    echo "Prompt Alchemy Integration Test"
    echo "==============================="
    echo ""
    log INFO "Starting integration tests"
    log INFO "Log file: $LOG_FILE"
    
    # Validate environment
    validate_environment
    
    # Set up test environment
    log INFO "Setting up test environment..."
    mkdir -p "$TEST_DIR"
    create_test_config
    
    # Ensure binary exists
    ensure_binary
    
    # Export test environment variables
    export PROMPT_ALCHEMY_CONFIG="$TEST_DIR/config.yaml"
    export PROMPT_ALCHEMY_DATA_DIR="$TEST_DIR/data"
    export PROMPT_ALCHEMY_MOCK_MODE=true
    
    # Run tests
    local failed_tests=0
    
    # Test 1: Version command
    run_test "Version command" \
        "$BINARY_PATH version" \
        "success" || ((failed_tests++))
    
    # Test 2: Help command
    run_test "Help command" \
        "$BINARY_PATH --help" \
        "success" || ((failed_tests++))
    
    # Test 3: Config validation
    run_test "Config validation" \
        "$BINARY_PATH validate --config $TEST_DIR/config.yaml" \
        "success" || ((failed_tests++))
    
    # Test 4: Provider listing
    run_test "Provider listing" \
        "$BINARY_PATH providers --config $TEST_DIR/config.yaml" \
        "success" || ((failed_tests++))
    
    # Test 5: Phase information
    run_test "Phase information" \
        "$BINARY_PATH phases --config $TEST_DIR/config.yaml" \
        "success" || ((failed_tests++))
    
    # Test 6: Basic generation (mock mode)
    run_test "Basic generation (mock)" \
        "$BINARY_PATH generate 'Create a hello world function' --config $TEST_DIR/config.yaml --save=false" \
        "success" || ((failed_tests++))
    
    # Test 7: Search functionality
    run_test "Search (empty results expected)" \
        "$BINARY_PATH search 'test' --config $TEST_DIR/config.yaml" \
        "success" || ((failed_tests++))
    
    # Test 8: List prompts (empty expected)
    run_test "List prompts" \
        "$BINARY_PATH list --config $TEST_DIR/config.yaml" \
        "success" || ((failed_tests++))
    
    # Test 9: Server health check (start and stop)
    if [[ "$FEATURE_TOGGLE" == "true" ]]; then
        log INFO "Starting server for health check..."
        $BINARY_PATH serve --config "$TEST_DIR/config.yaml" --port 18080 &
        SERVER_PID=$!
        sleep 2
        
        run_test "Server health check" \
            "curl -s http://localhost:18080/health | grep -q 'ok'" \
            "success" || ((failed_tests++))
        
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    
    # Summary
    echo ""
    if [[ $failed_tests -eq 0 ]]; then
        log SUCCESS "All integration tests passed!"
        return 0
    else
        log ERROR "$failed_tests tests failed"
        return 1
    fi
}

# ==================== Script Entry Point ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi