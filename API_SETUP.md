# HTTP API Setup Guide

## Overview

Prompt Alchemy provides a RESTful HTTP API for integrating with web applications, services, and custom clients. The API supports all core functionality including prompt generation, optimization, search, and provider management.

## Quick Start

### Local Setup

1. **Build and Install**
   ```bash
   make build
   sudo make install
   ```

2. **Configure** (create `~/.prompt-alchemy/config.yaml`)
   ```yaml
   http:
     host: localhost
     port: 8080
     
   providers:
     openai:
       api_key: "your-api-key"
       model: "gpt-4"
   ```

3. **Start Server**
   ```bash
   # Start HTTP API server
   prompt-alchemy serve api --port 8080
   
   # Or with custom host
   prompt-alchemy serve api --host 0.0.0.0 --port 8080
   ```

### Docker Setup

1. **Using Startup Scripts (Recommended)**
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with your API keys
   
   # Start API server
   ./start-api.sh
   
   # API available at http://localhost:8080
   ```

2. **Using Docker Compose Directly**
   ```bash
   # Start API server with profile
   docker-compose --profile api up -d
   ```

3. **Using Docker Run**
   ```bash
   docker run -d \
     --name prompt-alchemy-api \
     -p 8080:8080 \
     -v $(pwd)/docker-config.yaml:/app/config.yaml:ro \
     -v prompt-alchemy-data:/app/data \
     prompt-alchemy:latest serve api
   ```

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "providers": 5,
  "database": "connected"
}
```

### Generate Prompts

```http
POST /api/v1/prompts/generate
Content-Type: application/json

{
  "input": "Create a REST API for user management",
  "phases": ["prima-materia", "solutio", "coagulatio"],
  "count": 3,
  "temperature": 0.7,
  "max_tokens": 2000,
  "persona": "code",
  "provider": "openai"
}
```

**Response:**
```json
{
  "prompts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Design and implement a comprehensive REST API...",
      "phase": "coagulatio",
      "provider": "openai",
      "model": "gpt-4",
      "score": 8.5,
      "metadata": {
        "temperature": 0.7,
        "max_tokens": 2000,
        "persona": "code"
      }
    }
  ],
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "processing_time": "3.2s"
}
```

### Optimize Prompt

```http
POST /api/v1/prompts/optimize
Content-Type: application/json

{
  "prompt": "Write a function to validate email",
  "task": "Create robust email validation with regex",
  "persona": "code",
  "target_model": "gpt-4",
  "max_iterations": 5,
  "target_score": 9.0
}
```

**Response:**
```json
{
  "original_prompt": "Write a function to validate email",
  "optimized_prompt": "Implement a comprehensive email validation function...",
  "original_score": 6.5,
  "final_score": 9.2,
  "improvement": 2.7,
  "iterations": [
    {
      "iteration": 1,
      "prompt": "Create a function that validates email addresses...",
      "score": 7.8,
      "reasoning": "Added specificity about validation requirements"
    }
  ]
}
```

### Search Prompts

```http
GET /api/v1/prompts/search?query=email+validation&limit=10
```

**Response:**
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Implement email validation function...",
      "phase": "coagulatio",
      "score": 8.5,
      "created_at": "2024-01-15T10:30:00Z",
      "tags": ["email", "validation", "regex"]
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Get Prompt by ID

```http
GET /api/v1/prompts/{id}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Full prompt content...",
  "phase": "coagulatio",
  "provider": "openai",
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000,
  "created_at": "2024-01-15T10:30:00Z",
  "metadata": {
    "persona": "code",
    "original_input": "Create email validation"
  }
}
```

### List Providers

```http
GET /api/v1/providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "openai",
      "available": true,
      "supports_embeddings": true,
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "capabilities": ["generation", "embeddings"]
    },
    {
      "name": "anthropic",
      "available": true,
      "supports_embeddings": false,
      "models": ["claude-3-opus-20240229"],
      "capabilities": ["generation"]
    }
  ],
  "total_providers": 5,
  "available_providers": 3,
  "embedding_providers": 2
}
```

### Batch Generate

```http
POST /api/v1/prompts/batch
Content-Type: application/json

{
  "inputs": [
    {
      "id": "task1",
      "input": "Create a logging utility",
      "count": 2,
      "persona": "code"
    },
    {
      "id": "task2",
      "input": "Design a caching system",
      "count": 3,
      "persona": "code"
    }
  ],
  "workers": 3
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "task1",
      "prompts": [...],
      "status": "success"
    },
    {
      "id": "task2",
      "prompts": [...],
      "status": "success"
    }
  ],
  "total": 2,
  "successful": 2,
  "failed": 0,
  "processing_time": "5.3s"
}
```

## Authentication

Currently, the API does not require authentication for local/development use. For production deployments, consider implementing:

1. **API Key Authentication**
   ```http
   Authorization: Bearer your-api-key
   ```

2. **Basic Authentication**
   ```http
   Authorization: Basic base64(username:password)
   ```

3. **OAuth 2.0** for third-party integrations

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Limits**:
  - 100 requests per minute per IP
  - 1000 requests per hour per IP
  - 10 concurrent requests per IP

- **Headers**:
  ```http
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1642345678
  ```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The provided input is invalid",
    "details": {
      "field": "phases",
      "reason": "Invalid phase name: 'invalid-phase'"
    }
  },
  "request_id": "req_123456"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 502 | Upstream provider error |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Client Examples

### cURL

```bash
# Generate prompts
curl -X POST http://localhost:8080/api/v1/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a user authentication system",
    "persona": "code",
    "count": 3
  }'

# Search prompts
curl "http://localhost:8080/api/v1/prompts/search?query=authentication&limit=5"

# Get specific prompt
curl http://localhost:8080/api/v1/prompts/550e8400-e29b-41d4-a716-446655440000
```

### Python

```python
import requests
import json

class PromptAlchemyClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def generate_prompts(self, input_text, **kwargs):
        """Generate prompts using the API."""
        data = {
            "input": input_text,
            "phases": kwargs.get("phases", ["prima-materia", "solutio", "coagulatio"]),
            "count": kwargs.get("count", 3),
            "persona": kwargs.get("persona", "code"),
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 2000)
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/prompts/generate",
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def optimize_prompt(self, prompt, task, **kwargs):
        """Optimize a prompt."""
        data = {
            "prompt": prompt,
            "task": task,
            **kwargs
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/prompts/optimize",
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def search_prompts(self, query, limit=10):
        """Search for prompts."""
        params = {"query": query, "limit": limit}
        
        response = self.session.get(
            f"{self.base_url}/api/v1/prompts/search",
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
client = PromptAlchemyClient()

# Generate prompts
result = client.generate_prompts(
    "Create a REST API for user management",
    persona="code",
    count=3
)

for prompt in result["prompts"]:
    print(f"Phase: {prompt['phase']}")
    print(f"Content: {prompt['content'][:100]}...")
    print(f"Score: {prompt.get('score', 'N/A')}")
    print("-" * 50)
```

### JavaScript/TypeScript

```typescript
class PromptAlchemyClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8080") {
    this.baseUrl = baseUrl;
  }

  async generatePrompts(input: string, options: GenerateOptions = {}) {
    const response = await fetch(`${this.baseUrl}/api/v1/prompts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        phases: options.phases || ["prima-materia", "solutio", "coagulatio"],
        count: options.count || 3,
        persona: options.persona || "code",
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async searchPrompts(query: string, limit: number = 10) {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    const response = await fetch(
      `${this.baseUrl}/api/v1/prompts/search?${params}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage
const client = new PromptAlchemyClient();

async function example() {
  try {
    const result = await client.generatePrompts(
      "Create a user authentication system",
      { persona: "code", count: 3 }
    );
    
    console.log(`Generated ${result.prompts.length} prompts`);
    result.prompts.forEach(prompt => {
      console.log(`- ${prompt.phase}: ${prompt.content.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
```

## WebSocket Support (Coming Soon)

For real-time updates and streaming responses:

```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'prompts.generated'
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('New prompt:', event.prompt);
});
```

## Performance Optimization

### Caching Headers

The API supports standard HTTP caching:

```http
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

### Compression

Enable gzip compression for responses:

```http
Accept-Encoding: gzip, deflate
```

### Pagination

Use pagination for large result sets:

```http
GET /api/v1/prompts/search?query=test&page=2&limit=20
```

Response includes pagination metadata:
```json
{
  "results": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Monitoring

### Metrics Endpoint

```http
GET /api/v1/metrics
```

Returns Prometheus-compatible metrics:
```
# HELP prompt_alchemy_requests_total Total number of API requests
# TYPE prompt_alchemy_requests_total counter
prompt_alchemy_requests_total{method="POST",endpoint="/api/v1/prompts/generate"} 1234

# HELP prompt_alchemy_request_duration_seconds Request duration in seconds
# TYPE prompt_alchemy_request_duration_seconds histogram
prompt_alchemy_request_duration_seconds_bucket{le="0.1"} 456
```

### Logging

Configure logging level in `config.yaml`:
```yaml
logging:
  level: info  # debug, info, warn, error
  format: json  # json, text
  output: stdout  # stdout, file
  file: /var/log/prompt-alchemy/api.log
```

## Deployment Best Practices

### 1. Use a Reverse Proxy

nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Environment Variables

Override config with environment variables:
```bash
export PROMPT_ALCHEMY_HTTP_PORT=8080
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=sk-...
export PROMPT_ALCHEMY_LOG_LEVEL=debug
```

### 3. Health Checks

Configure health checks for load balancers:
```yaml
healthcheck:
  endpoint: /health
  interval: 30s
  timeout: 10s
  success_threshold: 1
  failure_threshold: 3
```

### 4. Horizontal Scaling

Deploy multiple instances behind a load balancer:
```yaml
services:
  api:
    image: prompt-alchemy:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

## Security Best Practices

1. **HTTPS Only**: Always use TLS in production
2. **API Keys**: Rotate API keys regularly
3. **CORS**: Configure allowed origins:
   ```yaml
   http:
     cors:
       allowed_origins:
         - https://app.example.com
       allowed_methods:
         - GET
         - POST
       allowed_headers:
         - Content-Type
         - Authorization
   ```
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Implement per-user rate limits
6. **Audit Logging**: Enable audit logs for all API calls

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if server is running
   ps aux | grep prompt-alchemy
   
   # Check port availability
   lsof -i :8080
   ```

2. **Provider Errors**
   ```bash
   # Test provider connectivity
   prompt-alchemy providers --test
   ```

3. **Database Issues**
   ```bash
   # Check database
   prompt-alchemy db status
   
   # Run migrations
   prompt-alchemy db migrate
   ```

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug prompt-alchemy serve api
```

Or in config:
```yaml
logging:
  level: debug
```

## API Versioning

The API uses URL-based versioning:
- Current version: `/api/v1`
- Legacy support: Maintained for 6 months after deprecation
- Version headers: `X-API-Version: 1.0`

## Support

- GitHub Issues: [github.com/jonwraymond/prompt-alchemy/issues](https://github.com/jonwraymond/prompt-alchemy/issues)
- Documentation: [docs.prompt-alchemy.io](https://docs.prompt-alchemy.io)
- Discord: [discord.gg/prompt-alchemy](https://discord.gg/prompt-alchemy)