# Debug Logging Configuration for Prompt Alchemy

This document describes the comprehensive debug logging setup for development environments.

## Quick Start

1. **Setup logging directories:**
   ```bash
   ./scripts/setup-debug-logs.sh
   ```

2. **Start services with debug logging:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.debug.yml --profile hybrid up
   ```

3. **Use the debug helper tool:**
   ```bash
   ./scripts/debug-helper.sh
   ```

## Configuration Files

### `docker-compose.debug.yml`
- Overlay configuration that adds debug environment variables
- Configures persistent log volumes
- Sets up JSON structured logging
- Disables health checks to reduce noise

### `docker-config-debug.yaml`
- Extended configuration with trace-level logging
- Enables request/response logging for all providers
- Configures component-specific log files
- Includes performance metrics and slow query logging

## Environment Variables

### Core Debug Settings
- `LOG_LEVEL=debug` - Main logging level
- `DEBUG=true` - Enable debug mode
- `VERBOSE=true` - Verbose output
- `TRACE=true` - Trace-level logging

### API Server (`prompt-alchemy`)
- `PROMPT_ALCHEMY_LOG_LEVEL=debug`
- `PROMPT_ALCHEMY_TRACE_REQUESTS=true`
- `HTTP_LOG_REQUESTS=true`
- `HTTP_LOG_RESPONSES=true`
- `DB_LOG_QUERIES=true`
- `PROVIDER_DEBUG=true`

### Web UI (`prompt-alchemy-web`)
- `WEB_DEBUG=true`
- `WEB_LOG_REQUESTS=true`
- `FRONTEND_DEBUG=true`
- `TEMPLATE_DEBUG=true`
- `API_CLIENT_LOG_REQUESTS=true`

## Log File Structure

```
logs/
├── api/
│   ├── prompt-alchemy.log    # Main API log
│   ├── engine.log           # Generation engine logs
│   ├── providers.log        # Provider interaction logs
│   ├── storage.log          # Database operations
│   ├── http.log            # HTTP request/response logs
│   ├── templates.log        # Template rendering logs
│   ├── ranking.log          # Ranking system logs
│   ├── learning.log         # Learning engine logs
│   ├── requests/            # Individual request logs
│   ├── errors/              # Error-specific logs
│   └── metrics/             # Performance metrics
├── web/
│   ├── access.log           # HTTP access logs
│   ├── errors/              # Web UI errors
│   └── static/              # Static file serving logs
├── mcp/
│   ├── protocol/            # MCP protocol logs
│   └── messages/            # MCP message logs
└── ollama/                  # Ollama service logs
```

## Viewing Logs

### Real-time Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f prompt-alchemy
docker-compose logs -f prompt-alchemy-web
```

### File-based Logs
```bash
# View all API logs
tail -f logs/api/*.log

# View specific component
tail -f logs/api/providers.log

# View with JSON parsing
cat logs/api/http.log | jq '.'
```

### Search Logs
```bash
# Find all errors
grep -r "ERROR" logs/

# Find specific request ID
grep -r "request_id=abc123" logs/

# Find slow queries
grep "slow_query" logs/api/storage.log
```

## Debug Helper Tool

The `scripts/debug-helper.sh` provides an interactive menu with options to:

1. Start services with debug logging
2. View real-time logs (all services)
3. View API logs only
4. View Web UI logs only
5. Search for errors in logs
6. View recent API requests
7. Check service health
8. Export logs for analysis
9. Clear all logs
10. Stop all services

## Log Analysis

### JSON Log Parsing
```bash
# Pretty print JSON logs
jq '.' logs/api/http.log

# Filter by log level
jq 'select(.level == "ERROR")' logs/api/prompt-alchemy.log

# Extract specific fields
jq '{time: .timestamp, method: .method, path: .path, status: .status}' logs/api/http.log
```

### Performance Analysis
```bash
# Find slow requests (>1s)
jq 'select(.duration > 1000)' logs/api/http.log

# Average response time
jq -s 'map(.duration) | add/length' logs/api/http.log

# Request count by status
jq -s 'group_by(.status) | map({status: .[0].status, count: length})' logs/api/http.log
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Fix log directory permissions
   sudo chown -R $USER:$USER logs/
   chmod -R 755 logs/
   ```

2. **Log Files Not Created**
   - Ensure you ran `./scripts/setup-debug-logs.sh`
   - Check if services are running: `docker-compose ps`
   - Verify volume mounts: `docker inspect prompt-alchemy-server | grep -A10 Mounts`

3. **Too Many Logs**
   - Logs are rotated automatically (max 10 files, 50MB each)
   - Clear old logs: `rm -rf logs/*/*.log.*`

### Debug Endpoints

When debug mode is enabled, additional endpoints are available:

- `GET /debug/config` - Current configuration
- `GET /debug/metrics` - Performance metrics
- `GET /debug/pprof/` - Go profiling data
- `GET /debug/requests` - Recent request history

## Best Practices

1. **Don't use debug mode in production** - It significantly impacts performance
2. **Monitor disk space** - Debug logs can grow quickly
3. **Use structured queries** - Take advantage of JSON logs for analysis
4. **Set up log rotation** - Prevent disk space issues
5. **Filter logs effectively** - Use log levels and component filtering

## Disabling Debug Mode

To return to normal logging:

```bash
# Stop services
docker-compose down

# Start without debug overlay
docker-compose --profile hybrid up -d

# Or explicitly use production config
docker-compose -f docker-compose.yml --profile hybrid up -d
```