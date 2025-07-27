# Multi-stage build for Go backend
# Stage 1: Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies for CGO
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Set working directory
WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies - this layer is cached unless go.mod/go.sum change
RUN go mod download

# Verify dependencies
RUN go mod verify

# Copy source code
COPY . .

# Build the application with optimization flags
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 \
    go build -a -installsuffix cgo \
    -ldflags="-w -s -extldflags '-static'" \
    -o prompt-alchemy ./cmd/prompt-alchemy

# Stage 2: Runtime stage
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    sqlite \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder --chown=appuser:appgroup /app/prompt-alchemy /app/prompt-alchemy

# Copy configuration and templates
COPY --from=builder --chown=appuser:appgroup /app/configs ./configs
COPY --from=builder --chown=appuser:appgroup /app/internal/templates ./internal/templates

# Create data directory with proper permissions
RUN mkdir -p /data && chown -R appuser:appgroup /data

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Set environment variables
ENV DATA_DIR=/data \
    LOG_LEVEL=info \
    TZ=UTC

# Default command runs in hybrid mode (API + MCP)
CMD ["./prompt-alchemy", "serve", "--api", "--mcp", "--host", "0.0.0.0", "--port", "8080"]