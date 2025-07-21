#!/bin/bash
# Simple test for phase selection feature

echo "Testing phase selection strategies..."
echo

# Test 1: Best strategy (should return 3 prompts, one from each phase)
echo "1. Testing 'best' strategy (expecting 3 prompts from 3 phases):"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a hello world function","count":2,"phase_selection":"best","phases":"prima-materia,solutio,coagulatio"}}}' | ./prompt-alchemy serve mcp 2>/dev/null | grep -E '^\{' | jq '.result._meta | {count, strategy, total_generated}'

echo
echo "2. Testing 'cascade' strategy (expecting 3 prompts, each building on previous):"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a hello world function","count":2,"phase_selection":"cascade","phases":"prima-materia,solutio,coagulatio"}}}' | ./prompt-alchemy serve mcp 2>/dev/null | grep -E '^\{' | jq '.result._meta | {count, strategy, total_generated}'

echo
echo "3. Testing 'all' strategy (expecting 6 prompts total - 2 per phase):"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a hello world function","count":2,"phase_selection":"all","phases":"prima-materia,solutio,coagulatio"}}}' | ./prompt-alchemy serve mcp 2>/dev/null | grep -E '^\{' | jq '.result._meta | {count, strategy, total_generated}'