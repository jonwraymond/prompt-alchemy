#!/bin/bash
# Test script for Docker MCP server

echo "Testing Docker MCP Server..."
echo

# Ensure we have the OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable not set"
    exit 1
fi

echo "1. Testing provider list:"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_providers"}}' | \
docker run --rm -i \
    -e PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="$OPENAI_API_KEY" \
    -v ~/.prompt-alchemy:/app/data \
    prompt-alchemy-mcp:latest 2>/dev/null | \
grep -E '^\{' | jq -r '.result._meta.count'

echo
echo "2. Testing prompt generation with best strategy:"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_prompts","arguments":{"input":"Create a hello world function","count":2,"phase_selection":"best"}}}' | \
docker run --rm -i \
    -e PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="$OPENAI_API_KEY" \
    -v ~/.prompt-alchemy:/app/data \
    prompt-alchemy-mcp:latest 2>docker-mcp-test.log | \
grep -E '^\{' | jq -r '.result._meta | "\(.count) prompts selected from \(.total_generated) generated using \(.strategy) strategy"'

echo
echo "3. Checking for errors:"
if [ -f docker-mcp-test.log ]; then
    grep -i "error" docker-mcp-test.log | tail -5
fi