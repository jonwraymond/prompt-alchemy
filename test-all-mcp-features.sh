#!/bin/bash
# Comprehensive test of all MCP features

echo "=== Prompt Alchemy MCP Feature Test ==="
echo

# Helper function to call MCP and extract result
mcp_call() {
    local method=$1
    local args=$2
    echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$method\",\"arguments\":$args}}" | \
        ./prompt-alchemy serve mcp 2>mcp-test.log | \
        grep -E '^\{' | jq -r '.result'
}

echo "1. Testing provider list:"
mcp_call "list_providers" "{}" | jq -r '._meta.count'

echo
echo "2. Testing phase selection strategies:"
echo "   a) Best strategy (count=2, expecting 3 final prompts):"
result=$(mcp_call "generate_prompts" '{"input":"test","count":2,"phase_selection":"best"}')
echo "      Count: $(echo "$result" | jq -r '._meta.count')"
echo "      Total generated: $(echo "$result" | jq -r '._meta.total_generated')"
echo "      Strategy: $(echo "$result" | jq -r '._meta.strategy')"

echo
echo "   b) All strategy (count=2, expecting 6 final prompts):"
result=$(mcp_call "generate_prompts" '{"input":"test","count":2,"phase_selection":"all"}')
echo "      Count: $(echo "$result" | jq -r '._meta.count')"
echo "      Total generated: $(echo "$result" | jq -r '._meta.total_generated')"

echo
echo "   c) Cascade strategy (count=2, expecting 3 final prompts):"
result=$(mcp_call "generate_prompts" '{"input":"test","count":2,"phase_selection":"cascade"}')
echo "      Count: $(echo "$result" | jq -r '._meta.count')"
echo "      Strategy: $(echo "$result" | jq -r '._meta.strategy')"

echo
echo "3. Testing search functionality:"
result=$(mcp_call "search_prompts" '{"query":"function","limit":5}')
echo "   Found: $(echo "$result" | jq -r '._meta.count') prompts"

echo
echo "4. Testing optimization:"
result=$(mcp_call "optimize_prompt" '{"prompt":"Write a function","target_score":8.5,"max_iterations":2}')
echo "$result" | jq -r '.content[0].text' | grep -E "(score|Score)" | head -5

echo
echo "5. Testing batch generation:"
result=$(mcp_call "batch_generate" '{"inputs":[{"input":"test1","count":1},{"input":"test2","count":1}],"workers":2}')
echo "$result" | jq -r '.content[0].text' | grep -E "(Processed|Successful|Errors)"

echo
echo "6. Checking for errors in log:"
if [ -f mcp-test.log ]; then
    echo "   Errors found:"
    grep -i "error" mcp-test.log | grep -v "level=error" | tail -5
    echo
    echo "   Warnings found:"
    grep -i "warn" mcp-test.log | tail -3
fi

echo
echo "=== Test Complete ==="