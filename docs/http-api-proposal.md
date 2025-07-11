# HTTP API Proposal for Prompt Alchemy

## Overview

This proposal outlines adding HTTP API support alongside the existing MCP server to enable broader integration options.

## Architecture

### Dual Protocol Support

```
┌─────────────────┐     ┌─────────────────┐
│   MCP Clients   │     │  HTTP Clients   │
│ (Claude, VSCode)│     │ (Web, Mobile)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ JSON-RPC/stdio        │ HTTP/REST
         │                       │
    ┌────▼────────┐     ┌────────▼────────┐
    │ MCP Server  │     │  HTTP Server    │
    │  (stdio)    │     │   (Chi/Gin)     │
    └────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
            ┌────────▼────────┐
            │  Core Engine   │
            │  (Business     │
            │   Logic)       │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   Storage      │
            │  (SQLite)      │
            └─────────────────┘
```

## Proposed HTTP Endpoints

### Core Endpoints

```yaml
# Prompt Generation
POST   /api/v1/prompts/generate
GET    /api/v1/prompts
GET    /api/v1/prompts/:id
PUT    /api/v1/prompts/:id
DELETE /api/v1/prompts/:id

# Search
POST   /api/v1/prompts/search
POST   /api/v1/prompts/search/semantic

# Analytics
GET    /api/v1/metrics
GET    /api/v1/metrics/prompts/:id
GET    /api/v1/stats

# Providers
GET    /api/v1/providers
POST   /api/v1/providers/test

# Learning (Server Mode)
POST   /api/v1/feedback
GET    /api/v1/recommendations
GET    /api/v1/learning/stats

# System
GET    /api/v1/health
GET    /api/v1/version
GET    /api/v1/config
```

### WebSocket Support

```yaml
# Real-time updates
WS     /api/v1/ws/events
WS     /api/v1/ws/learning
```

## Implementation Plan

### Phase 1: Basic HTTP API
1. Add Chi router
2. Implement core CRUD endpoints
3. Add authentication middleware
4. OpenAPI documentation

### Phase 2: Advanced Features
1. WebSocket support
2. Rate limiting
3. Caching layer
4. Metrics endpoint

### Phase 3: Web UI
1. React dashboard
2. Real-time analytics
3. Prompt playground

## Benefits

1. **Broader Integration**: Web apps, mobile apps, CI/CD pipelines
2. **Monitoring**: Health checks, metrics endpoints
3. **Administration**: Web-based config management
4. **Analytics**: Real-time dashboards
5. **API Gateway Ready**: Standard REST/HTTP for cloud deployments

## Configuration

```yaml
# config.yaml
server:
  mode: hybrid  # mcp, http, or hybrid
  
  mcp:
    enabled: true
    
  http:
    enabled: true
    port: 8080
    host: 0.0.0.0
    
  auth:
    enabled: true
    type: bearer  # bearer, basic, or jwt
    
  cors:
    enabled: true
    origins:
      - "http://localhost:3000"
      - "https://app.example.com"
```

## Example Usage

### REST API
```bash
# Generate prompt
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a function to parse JSON",
    "phase": "human",
    "provider": "claude"
  }'

# Search prompts
curl -X POST http://localhost:8080/api/v1/prompts/search \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "JSON parsing",
    "semantic": true
  }'
```

### WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/ws/events');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Event:', event);
});
```

## Security Considerations

1. **Authentication**: API keys, JWT tokens
2. **Rate Limiting**: Per-IP and per-key limits
3. **CORS**: Configurable origins
4. **TLS**: HTTPS in production
5. **Input Validation**: Request schema validation

## Migration Path

1. Current MCP users continue unchanged
2. New HTTP API is opt-in via configuration
3. Both protocols share the same core engine
4. Gradual migration to hybrid mode

## API Endpoints
- GET /health: Check server health
- GET /api/v1/status: Server status
- POST /api/v1/prompts: Generate prompts
- GET /api/v1/prompts/{id}: Get prompt
- POST /api/v1/prompts/select: Select best prompt

## Examples
curl -X POST /api/v1/prompts -d '{"input":"test"}'
curl /api/v1/prompts/uuid
curl -X POST /api/v1/prompts/select -d '{"prompts":["p1","p2"],"criteria":{"task":"desc"}}'