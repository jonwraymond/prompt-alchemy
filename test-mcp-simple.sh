#!/bin/bash
# Simple direct test of MCP phase selection

echo "Testing MCP server phase selection strategies..."
echo

# Function to extract just the metadata from JSON output
extract_meta() {
    # Filter out non-JSON lines and extract _meta
    grep -E '^\{' | jq -r '.result._meta | "Count: \(.count), Strategy: \(.strategy), Total Generated: \(.total_generated)"'
}

# Test 1: Best strategy
echo "1. Testing 'best' strategy (expecting count=3 from 6 generated):"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"test prompt","count":2,"phase_selection":"best"}}}' | \
    ./prompt-alchemy serve mcp 2>/dev/null | extract_meta

echo

# Test 2: All strategy  
echo "2. Testing 'all' strategy (expecting count=6 from 6 generated):"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"test prompt","count":2,"phase_selection":"all"}}}' | \
    ./prompt-alchemy serve mcp 2>/dev/null | extract_meta

echo

# Test 3: Scoring display fix
echo "3. Testing optimize command scoring display (should show X/10 format):"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"optimize_prompt","arguments":{"prompt":"test prompt","target_score":8.5}}}' | \
    ./prompt-alchemy serve mcp 2>/dev/null | grep -E '^\{' | jq -r '.result.content[0].text' | grep -E 'Score:|score:' | head -5