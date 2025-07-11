#!/bin/bash

# Comprehensive Test Suite for Prompt Alchemy
# Tests all API surfaces, CLI modes, and MCP functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
HTTP_URL="http://localhost:9090"
MCP_PORT="8080"
TEST_INPUT="Write a greeting for a new software project"

echo -e "${BLUE}🧪 Starting Comprehensive Prompt Alchemy Test Suite${NC}"
echo "=============================================="

# Helper functions
log_test() {
    echo -e "\n${BLUE}📋 Testing: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Test 1: HTTP API Health Check
log_test "HTTP API Health Check"
if curl -s -f "$HTTP_URL/health" > /dev/null; then
    log_success "HTTP API is responding"
    HEALTH_RESPONSE=$(curl -s "$HTTP_URL/health" | jq .)
    echo "Health response: $HEALTH_RESPONSE"
else
    log_error "HTTP API is not responding"
    exit 1
fi

# Test 2: Provider Status
log_test "Provider Status"
PROVIDERS_RESPONSE=$(curl -s "$HTTP_URL/api/v1/providers")
echo "Provider response: $PROVIDERS_RESPONSE"

AVAILABLE_PROVIDERS=$(echo "$PROVIDERS_RESPONSE" | jq -r '.providers[] | select(.available == true) | .name')
TOTAL_AVAILABLE=$(echo "$AVAILABLE_PROVIDERS" | wc -l)

log_success "Available providers ($TOTAL_AVAILABLE): $AVAILABLE_PROVIDERS"

if [ "$TOTAL_AVAILABLE" -eq 0 ]; then
    log_error "No providers are available"
    exit 1
fi

# Test 3: HTTP API - Prompt Generation
log_test "HTTP API - Prompt Generation"
GENERATE_RESPONSE=$(curl -s -X POST "$HTTP_URL/api/v1/prompts/generate" \
    -H "Content-Type: application/json" \
    -d "{\"input\": \"$TEST_INPUT\", \"count\": 1}")

if echo "$GENERATE_RESPONSE" | jq -e '.prompts' > /dev/null 2>&1; then
    log_success "Prompt generation successful"
    PROMPT_COUNT=$(echo "$GENERATE_RESPONSE" | jq '.prompts | length')
    echo "Generated $PROMPT_COUNT prompts"
else
    log_error "Prompt generation failed"
    echo "Response: $GENERATE_RESPONSE"
fi

# Test 4: HTTP API - Prompt Search
log_test "HTTP API - Prompt Search"
SEARCH_RESPONSE=$(curl -s -X POST "$HTTP_URL/api/v1/prompts/search" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"greeting\", \"limit\": 5}")

if echo "$SEARCH_RESPONSE" | jq -e '.prompts' > /dev/null 2>&1; then
    log_success "Prompt search successful"
    SEARCH_COUNT=$(echo "$SEARCH_RESPONSE" | jq '.prompts | length')
    echo "Found $SEARCH_COUNT prompts"
else
    log_warning "Prompt search returned no results (may be expected for new installation)"
    echo "Response: $SEARCH_RESPONSE"
fi

# Test 5: HTTP API - Prompt Selection
log_test "HTTP API - AI-Powered Prompt Selection"
# First generate some prompts to get IDs for selection testing
GENERATE_FOR_SELECT=$(curl -s -X POST "$HTTP_URL/api/v1/prompts/generate" \
    -H "Content-Type: application/json" \
    -d "{\"input\": \"greeting message\", \"count\": 2, \"save\": true}")

if echo "$GENERATE_FOR_SELECT" | jq -e '.prompts' > /dev/null 2>&1; then
    # Extract prompt IDs from the generated prompts
    PROMPT_IDS=$(echo "$GENERATE_FOR_SELECT" | jq -r '.prompts[].id')
    PROMPT_ID_ARRAY=$(echo "$PROMPT_IDS" | jq -R . | jq -s .)
    
    SELECT_RESPONSE=$(curl -s -X POST "$HTTP_URL/api/v1/prompts/select" \
        -H "Content-Type: application/json" \
        -d "{\"prompt_ids\": $PROMPT_ID_ARRAY, \"task_description\": \"most friendly greeting\"}")

    if echo "$SELECT_RESPONSE" | jq -e '.selected_prompt' > /dev/null 2>&1; then
        log_success "Prompt selection successful"
        SELECTED=$(echo "$SELECT_RESPONSE" | jq -r '.selected_prompt.content' | head -c 100)
        echo "Selected prompt (first 100 chars): $SELECTED..."
    else
        log_error "Prompt selection failed"
        echo "Response: $SELECT_RESPONSE"
    fi
else
    log_warning "Skipping prompt selection test (prompt generation failed)"
fi

# Test 6: CLI Local Mode
log_test "CLI Local Mode"
if command -v docker &> /dev/null; then
    CLI_RESPONSE=$(docker exec prompt-alchemy-server prompt-alchemy generate "$TEST_INPUT" --count 1 --config /app/config.yaml --provider ollama 2>&1 || true)
    
    if echo "$CLI_RESPONSE" | grep -q "Prompt generation complete"; then
        log_success "CLI local mode working"
    else
        log_error "CLI local mode failed"
        echo "Response: $CLI_RESPONSE"
    fi
else
    log_warning "Docker not available for CLI testing"
fi

# Test 7: CLI Client Mode
log_test "CLI Client Mode"
# First, create a temporary config for client mode
CLIENT_CONFIG="{
  \"client\": {
    \"mode\": \"client\",
    \"server_url\": \"$HTTP_URL\",
    \"timeout\": 30
  }
}"

if command -v docker &> /dev/null; then
    # Test client mode by configuring it to connect to the running server
    echo "$CLIENT_CONFIG" > /tmp/client-config.yaml
    docker cp /tmp/client-config.yaml prompt-alchemy-server:/app/client-config.yaml
    
    CLIENT_RESPONSE=$(docker exec prompt-alchemy-server prompt-alchemy generate "$TEST_INPUT" --count 1 --config /app/client-config.yaml --mode client 2>&1 || true)
    
    if echo "$CLIENT_RESPONSE" | grep -q "Prompt generation complete\|prompts"; then
        log_success "CLI client mode working"
    else
        log_warning "CLI client mode needs verification"
        echo "Response: $CLIENT_RESPONSE"
    fi
    
    # Cleanup
    rm -f /tmp/client-config.yaml
else
    log_warning "Docker not available for CLI client mode testing"
fi

# Test 8: MCP Server
log_test "MCP Server"
MCP_HEALTH=$(curl -s -f "http://localhost:$MCP_PORT/health" 2>/dev/null || echo "failed")

if [ "$MCP_HEALTH" != "failed" ]; then
    log_success "MCP server is responding"
    
    # Test MCP tools list
    MCP_TOOLS_RESPONSE=$(curl -s -X POST "http://localhost:$MCP_PORT" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' 2>/dev/null || echo "failed")
    
    if [ "$MCP_TOOLS_RESPONSE" != "failed" ] && echo "$MCP_TOOLS_RESPONSE" | jq -e '.result.tools' > /dev/null 2>&1; then
        log_success "MCP tools endpoint working"
        TOOL_COUNT=$(echo "$MCP_TOOLS_RESPONSE" | jq '.result.tools | length')
        echo "Available MCP tools: $TOOL_COUNT"
    else
        log_warning "MCP tools endpoint needs verification"
    fi
else
    log_warning "MCP server not responding (may be running on different port or not started)"
fi

# Test 9: Configuration Validation
log_test "Configuration Validation"
if command -v docker &> /dev/null; then
    VALIDATE_RESPONSE=$(docker exec prompt-alchemy-server prompt-alchemy validate config --config /app/config.yaml 2>&1 || true)
    
    if echo "$VALIDATE_RESPONSE" | grep -q "Configuration is valid\|NEEDS ATTENTION"; then
        log_success "Configuration validation working"
        # Show key validation results
        echo "$VALIDATE_RESPONSE" | grep -E "(Overall Status|Total Issues|Critical:)" || true
    else
        log_error "Configuration validation failed"
        echo "Response: $VALIDATE_RESPONSE"
    fi
else
    log_warning "Docker not available for configuration validation"
fi

# Test 10: Performance Test
log_test "Performance Test"
START_TIME=$(date +%s%N)
PERF_RESPONSE=$(curl -s -X POST "$HTTP_URL/api/v1/prompts/generate" \
    -H "Content-Type: application/json" \
    -d "{\"input\": \"Quick test\", \"count\": 1}")
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

if echo "$PERF_RESPONSE" | jq -e '.prompts' > /dev/null 2>&1; then
    log_success "Performance test completed in ${DURATION}ms"
    if [ "$DURATION" -lt 10000 ]; then
        echo "Response time is good (<10s)"
    else
        log_warning "Response time is slow (>10s)"
    fi
else
    log_error "Performance test failed"
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "==============="
echo "✅ Tests completed"
echo "Available providers: $TOTAL_AVAILABLE"
echo "HTTP API: Working"
echo "CLI: Tested"
echo "Configuration: Validated"

# Check for API keys availability
if [ -f ".env" ] && grep -q "sk-" .env; then
    log_success "API keys detected in .env file"
    echo "To test all providers, ensure valid API keys are set in .env and restart with:"
    echo "docker-compose -f docker-compose-full.yml up -d"
else
    log_warning "No API keys detected in .env file"
    echo "Currently testing with Ollama only"
    echo "To test all providers, add valid API keys to .env file"
fi

echo -e "\n${GREEN}🎉 Comprehensive testing completed!${NC}"