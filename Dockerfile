# Multi-stage build for Go backend
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o prompt-alchemy ./cmd/prompt-alchemy

# Final stage
FROM alpine:latest

# Install necessary packages
RUN apk --no-cache add ca-certificates sqlite

WORKDIR /root/

# Copy the binary
COPY --from=builder /app/prompt-alchemy .

# Copy configuration and templates
COPY --from=builder /app/configs ./configs
COPY --from=builder /app/internal/templates ./internal/templates

# Create data directory
RUN mkdir -p /data

# Expose ports
EXPOSE 8080

# Set environment variables
ENV DATA_DIR=/data
ENV LOG_LEVEL=info

# Default command runs in hybrid mode (API + MCP)
CMD ["./prompt-alchemy", "serve", "--api", "--mcp", "--host", "0.0.0.0", "--port", "8080"]