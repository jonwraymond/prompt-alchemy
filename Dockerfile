# Stage 1: Build the Go binary
FROM golang:1.24 AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum for dependency caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the source code
COPY . .

# Ensure schema.sql is available at runtime
COPY internal/storage/schema.sql /app/schema.sql

# Build the binary with CGO enabled for SQLite support
RUN CGO_ENABLED=1 GOOS=linux go build -o prompt-alchemy ./cmd/prompt-alchemy

# Stage 2: Create the final image
FROM debian:12-slim

# Install ca-certificates and curl for HTTPS requests and health checks
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/prompt-alchemy /usr/local/bin/prompt-alchemy

# Copy schema file to expected location
COPY --from=builder /app/schema.sql /app/schema.sql
COPY --from=builder /app/internal/storage/schema.sql /app/internal/storage/schema.sql

# Create app directory for data
RUN mkdir -p /app/data /app/internal/storage

# Set working directory
WORKDIR /app

# Set the entrypoint to run HTTP API server mode with config
ENTRYPOINT ["prompt-alchemy", "serve", "api", "--config", "/app/config.yaml", "--host", "0.0.0.0", "--port", "8080"]

# Expose HTTP port for REST API
EXPOSE 8080 