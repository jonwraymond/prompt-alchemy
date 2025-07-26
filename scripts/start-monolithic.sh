#!/bin/bash

# Prompt Alchemy Monolithic Startup Script
# Starts all services in a single process for easy development and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
HTTP_PORT=${HTTP_PORT:-8080}
MCP_PORT=${MCP_PORT:-8081}
LOG_LEVEL=${LOG_LEVEL:-info}
CONFIG_FILE=${CONFIG_FILE:-""}
DATA_DIR=${DATA_DIR:-""}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --http-port)
            HTTP_PORT="$2"
            shift 2
            ;;
        --mcp-port)
            MCP_PORT="$2"
            shift 2
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --data-dir)
            DATA_DIR="$2"
            shift 2
            ;;
        --disable-api)
            DISABLE_API=true
            shift
            ;;
        --disable-mcp)
            DISABLE_MCP=true
            shift
            ;;
        --disable-ui)
            DISABLE_UI=true
            shift
            ;;
        --help)
            echo "Prompt Alchemy Monolithic Startup Script"
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --http-port PORT    HTTP API server port (default: 8080)"
            echo "  --mcp-port PORT     MCP server port (default: 8081)"
            echo "  --log-level LEVEL   Log level: debug, info, warn, error (default: info)"
            echo "  --config FILE       Configuration file path"
            echo "  --data-dir DIR      Data directory path"
            echo "  --disable-api       Disable HTTP API server"
            echo "  --disable-mcp       Disable MCP server"
            echo "  --disable-ui        Disable UI file serving"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  HTTP_PORT           Same as --http-port"
            echo "  MCP_PORT            Same as --mcp-port"
            echo "  LOG_LEVEL           Same as --log-level"
            echo "  CONFIG_FILE         Same as --config"
            echo "  DATA_DIR            Same as --data-dir"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Header
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}    Prompt Alchemy Monolithic${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if binary exists
BINARY_PATH="./prompt-alchemy-mono"
if [[ ! -f "$BINARY_PATH" ]]; then
    echo -e "${YELLOW}Monolithic binary not found. Building...${NC}"
    make build-mono
    echo ""
fi

# Build command line arguments
ARGS=(
    "--log-level" "$LOG_LEVEL"
    "--http-port" "$HTTP_PORT"
    "--mcp-port" "$MCP_PORT"
)

if [[ -n "$CONFIG_FILE" ]]; then
    ARGS+=("--config" "$CONFIG_FILE")
fi

if [[ -n "$DATA_DIR" ]]; then
    ARGS+=("--data-dir" "$DATA_DIR")
fi

if [[ "$DISABLE_API" == "true" ]]; then
    ARGS+=("--enable-api=false")
fi

if [[ "$DISABLE_MCP" == "true" ]]; then
    ARGS+=("--enable-mcp=false")
fi

if [[ "$DISABLE_UI" == "true" ]]; then
    ARGS+=("--enable-ui=false")
fi

# Display configuration
echo -e "${GREEN}Starting with configuration:${NC}"
echo -e "  HTTP Port: ${YELLOW}$HTTP_PORT${NC}"
echo -e "  MCP Port:  ${YELLOW}$MCP_PORT${NC}"
echo -e "  Log Level: ${YELLOW}$LOG_LEVEL${NC}"

if [[ -n "$CONFIG_FILE" ]]; then
    echo -e "  Config:    ${YELLOW}$CONFIG_FILE${NC}"
fi

if [[ -n "$DATA_DIR" ]]; then
    echo -e "  Data Dir:  ${YELLOW}$DATA_DIR${NC}"
fi

echo ""
echo -e "${GREEN}Services enabled:${NC}"
if [[ "$DISABLE_API" != "true" ]]; then
    echo -e "  ✓ HTTP API Server (port $HTTP_PORT)"
fi
if [[ "$DISABLE_MCP" != "true" ]]; then
    echo -e "  ✓ MCP Server (port $MCP_PORT)"
fi
if [[ "$DISABLE_UI" != "true" ]]; then
    echo -e "  ✓ Static UI File Serving"
fi

echo ""
echo -e "${GREEN}Starting Prompt Alchemy...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop${NC}"
echo ""

# Run the application
exec "$BINARY_PATH" "${ARGS[@]}"