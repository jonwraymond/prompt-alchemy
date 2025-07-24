#!/bin/bash

echo "=== Testing API Connection ==="
echo

# Test 1: Direct API call from host
echo "1. Testing API from host machine:"
curl -s -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test prompt",
    "count": 1,
    "phases": ["prima-materia"],
    "save": false
  }' | jq .
echo

# Test 2: Test web server can reach API
echo "2. Testing web server's view of API:"
docker exec prompt-alchemy-web curl -s http://localhost:8080/api/v1/prompts/generate \
  -X POST -H "Content-Type: application/json" \
  -d '{"input":"test"}' 2>&1 || echo "Failed to connect from web container"
echo

# Test 3: Test using container name
echo "3. Testing with container name (prompt-alchemy-api):"
docker exec prompt-alchemy-web curl -s http://prompt-alchemy-api:8080/api/v1/prompts/generate \
  -X POST -H "Content-Type: application/json" \
  -d '{"input":"test"}' 2>&1 | head -20
echo

# Test 4: Check Docker network
echo "4. Docker network info:"
docker network ls | grep bridge
echo

# Test 5: Container IPs
echo "5. Container network details:"
docker inspect prompt-alchemy-api | jq '.[0].NetworkSettings.Networks'
docker inspect prompt-alchemy-web | jq '.[0].NetworkSettings.Networks'