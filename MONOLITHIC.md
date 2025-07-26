# Prompt Alchemy Monolithic Setup

This document explains how to build and run Prompt Alchemy as a unified monolithic application.

## Overview

The monolithic build consolidates all Prompt Alchemy services into a single binary:

- **HTTP API Server** - RESTful API for prompt generation and management
- **MCP Server** - Model Context Protocol server for Claude Desktop integration  
- **Static File Server** - Serves the React frontend UI
- **Background Monitoring** - Health checks and system monitoring
- **Shared Database** - Single SQLite database with vector embeddings

## Quick Start

### 1. Build the Monolithic Binary

```bash
# Build just the monolithic binary
make build-mono

# Or build both regular and monolithic versions
make build-both
```

This creates `prompt-alchemy-mono` in the project root.

### 2. Start All Services

```bash
# Using the startup script (recommended)
./scripts/start-monolithic.sh

# Or run directly
./prompt-alchemy-mono

# With custom ports
./prompt-alchemy-mono --http-port 9000 --mcp-port 9001
```

### 3. Access the Application

- **Web UI**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api/v1/
- **MCP Server**: localhost:8081 (for Claude Desktop)
- **Health Check**: http://localhost:8080/health

## Configuration

### Command Line Options

```bash
./prompt-alchemy-mono [OPTIONS]

Options:
  --http-port PORT      HTTP API server port (default: 8080)
  --mcp-port PORT       MCP server port (default: 8081)  
  --log-level LEVEL     Log level: debug, info, warn, error (default: info)
  --config FILE         Configuration file path
  --data-dir DIR        Data directory path
  --enable-api BOOL     Enable HTTP API server (default: true)
  --enable-mcp BOOL     Enable MCP server (default: true)
  --enable-ui BOOL      Enable UI file serving (default: true)
```

### Environment Variables

All command line options can be set via environment variables:

```bash
export HTTP_PORT=9000
export MCP_PORT=9001
export LOG_LEVEL=debug
./prompt-alchemy-mono
```

### Configuration File

Use the same configuration file format as the microservices version:

```yaml
# ~/.prompt-alchemy/config.yaml
server:
  http_port: 8080
  mcp_port: 8081

database:
  path: ~/.prompt-alchemy/prompts.db

providers:
  openai:
    api_key: your-openai-key
  anthropic:
    api_key: your-anthropic-key
```

## Architecture Benefits

### Single Process
- **Simplified Deployment**: One binary to deploy and manage
- **Shared Resources**: Single database connection pool, shared memory
- **Faster Testing**: Quick startup for development and testing
- **Reduced Complexity**: No inter-service communication overhead

### Service Coordination
- **Unified Logging**: All services log to the same output with consistent formatting
- **Shared Configuration**: Single configuration loading and validation
- **Graceful Shutdown**: Coordinated shutdown of all services on SIGTERM/SIGINT
- **Health Monitoring**: Built-in health checks for all components

## Development Workflow

### Building and Testing

```bash
# Clean and build monolithic version
make clean build-mono

# Run tests
make test

# Start development server
./scripts/start-monolithic.sh --log-level debug
```

### Frontend Development

The monolithic server serves the React frontend from the `web/static` directory. For live reload during development:

```bash
# Terminal 1: Start backend services
./prompt-alchemy-mono --enable-ui=false

# Terminal 2: Start frontend dev server  
cd web
npm run dev
```

### Adding New Services

To add a new service to the monolithic application:

1. **Create Service**: Implement your service with a `Start(ctx context.Context) error` method
2. **Add to main.go**: Add a new goroutine in `runMonolithic()` function
3. **Update Flags**: Add any new command line flags needed
4. **Test Integration**: Ensure graceful startup and shutdown

## Migration from Microservices

If you have an existing microservices deployment:

### Data Migration
- **Database**: The same SQLite database format is used, no migration needed
- **Configuration**: Same configuration file format, just update ports if needed
- **Logs**: Log format is compatible, existing log parsing should work

### Deployment Migration
1. **Stop microservices**: Gracefully shutdown individual services
2. **Deploy monolithic**: Start the new monolithic binary
3. **Update clients**: Point API clients to the new unified endpoint
4. **Update monitoring**: Update health check URLs and port monitoring

## Troubleshooting

### Port Conflicts
```bash
# Check what's using your ports
lsof -i :8080
lsof -i :8081

# Use different ports
./prompt-alchemy-mono --http-port 9000 --mcp-port 9001
```

### Database Issues
```bash
# Check database location
./prompt-alchemy-mono --log-level debug | grep -i database

# Manual database check
sqlite3 ~/.prompt-alchemy/prompts.db ".schema"
```

### Service Startup Issues
```bash
# Enable debug logging
./prompt-alchemy-mono --log-level debug

# Disable problematic services
./prompt-alchemy-mono --enable-mcp=false  # Disable MCP server
./prompt-alchemy-mono --enable-api=false  # Disable HTTP API
```

## Future Microservices Support

The monolithic binary is designed to be easily split back into microservices:

- **Same Codebase**: Uses the same service implementations
- **Flag-Based Control**: Can disable individual services
- **Independent Scaling**: Services can be extracted and scaled independently
- **Configuration Compatibility**: Same configuration format works for both

To revert to microservices, use the original `prompt-alchemy` binary with subcommands:

```bash
# API server only
./prompt-alchemy serve --port 8080

# MCP server only  
./prompt-alchemy mcp --port 8081
```