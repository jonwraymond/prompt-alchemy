#!/bin/bash
# Test script for MCP server enhancements

echo "=== Testing Prompt Alchemy MCP Server Enhancements ==="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS=0
PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    TESTS=$((TESTS + 1))
    echo -e "${YELLOW}Test $TESTS: $test_name${NC}"
    echo "Command: $command"
    
    # Run the command and capture output
    output=$(eval "$command" 2>&1)
    
    if echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Expected pattern: $expected_pattern"
        echo "Actual output: $output"
        FAILED=$((FAILED + 1))
    fi
    echo
}

# Test 1: Basic generation with default phase selection (best)
run_test "Basic generation with 'best' phase selection" \
    'echo '"'"'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a hello world function","count":2,"phase_selection":"best"}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text" | head -1' \
    "Generated.*total.*selected.*final prompts using 'best' strategy"

# Test 2: Cascade phase selection
run_test "Cascade phase selection" \
    'echo '"'"'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a REST API","count":2,"phase_selection":"cascade"}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text" | head -1' \
    "Generated.*total.*selected.*final prompts using 'cascade' strategy"

# Test 3: All phase selection (original behavior)
run_test "All phase selection returns all prompts" \
    'echo '"'"'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a function","count":2,"phase_selection":"all"}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text" | head -1' \
    "Generated.*total.*selected.*final prompts using 'all' strategy"

# Test 4: Optimize flag
run_test "Generation with optimize flag" \
    'echo '"'"'{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a test","optimize":true}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.metadata.optimized"' \
    "true"

# Test 5: Custom temperature and max_tokens
run_test "Custom temperature and max_tokens" \
    'echo '"'"'{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Test prompt","temperature":0.9,"max_tokens":1500}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result"' \
    "content"

# Test 6: Optimize prompt with score display
run_test "Optimize prompt shows score out of 10" \
    'echo '"'"'{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"optimize_prompt","arguments":{"prompt":"Write a test","task":"Testing","max_iterations":2}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text"' \
    "Final score:.*\/10"

# Test 7: List providers
run_test "List providers returns count" \
    'echo '"'"'{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"list_providers","arguments":{}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text"' \
    "Available providers:"

# Test 8: Search prompts
run_test "Search prompts functionality" \
    'echo '"'"'{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"search_prompts","arguments":{"query":"test","limit":5}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result"' \
    "content"

# Test 9: Batch generate
run_test "Batch generate with multiple inputs" \
    'echo '"'"'{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"batch_generate","arguments":{"inputs":[{"id":"1","input":"Test 1","count":1},{"id":"2","input":"Test 2","count":1}],"workers":2}}}'"'"' | ./prompt-alchemy serve mcp 2>/dev/null | jq -r ".result.content[0].text"' \
    "Batch generation complete"

# Summary
echo "=== Test Summary ==="
echo "Total tests: $TESTS"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi