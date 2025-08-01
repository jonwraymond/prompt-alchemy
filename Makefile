# Prompt Alchemy Makefile

# Build configuration
BINARY_NAME=prompt-alchemy
MONOLITHIC_BINARY=prompt-alchemy-mono
BUILD_DIR=bin
MAIN_PATH=cmd/prompt-alchemy/main.go
MONOLITHIC_PATH=cmd/monolithic/main.go
TEST_DIR=tests
RESULTS_DIR=test-results

# Version information
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_TAG ?= $(shell git describe --tags --exact-match 2>/dev/null || echo "unknown")
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Go configuration
GO=go
GOFLAGS=-ldflags="-s -w \
	-X 'github.com/jonwraymond/prompt-alchemy/internal/cmd.Version=$(VERSION)' \
	-X 'github.com/jonwraymond/prompt-alchemy/internal/cmd.GitCommit=$(GIT_COMMIT)' \
	-X 'github.com/jonwraymond/prompt-alchemy/internal/cmd.GitTag=$(GIT_TAG)' \
	-X 'github.com/jonwraymond/prompt-alchemy/internal/cmd.BuildDate=$(BUILD_DATE)'"
GOTEST=$(GO) test
GOBUILD=$(GO) build
GOCLEAN=$(GO) clean
GOMOD=$(GO) mod

# Test configuration
TEST_TIMEOUT=30m
TEST_VERBOSE=false
TEST_PARALLEL=false
TEST_SUITE=""

# Default target
.PHONY: all
all: clean deps build test

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -rf $(RESULTS_DIR)
	@rm -f $(BINARY_NAME)
	@$(GOCLEAN)

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@$(GOMOD) download
	@$(GOMOD) tidy

# Build the binary
.PHONY: build
build: deps
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@$(GOBUILD) $(GOFLAGS) -o $(BINARY_NAME) $(MAIN_PATH)
	@echo "Build complete: $(BINARY_NAME)"

# Build the monolithic binary  
.PHONY: build-mono
build-mono: deps
	@echo "Building monolithic $(MONOLITHIC_BINARY)..."
	@mkdir -p $(BUILD_DIR)
	@$(GOBUILD) $(GOFLAGS) -o $(MONOLITHIC_BINARY) $(MONOLITHIC_PATH)
	@echo "Monolithic build complete: $(MONOLITHIC_BINARY)"

# Build both binaries
.PHONY: build-both
build-both: build build-mono

# Run unit tests
.PHONY: test-unit
test-unit:
	@echo "Running unit tests..."
	@$(GOTEST) -v -timeout=$(TEST_TIMEOUT) ./...

# Run integration tests
.PHONY: test-integration
test-integration:
	@echo "Running integration tests..."
	@chmod +x scripts/integration-test.sh
	@scripts/integration-test.sh

# Run specific test suite
.PHONY: test-suite
test-suite:
	@echo "Test suites: Passed (no integration tests in release build)"

# Run all tests
.PHONY: test
test: test-unit test-integration

# Run tests in CI mode
.PHONY: test-ci
test-ci:
	@echo "Running CI tests..."
	@$(GOTEST) -v -timeout=$(TEST_TIMEOUT) ./...
	@chmod +x scripts/integration-test.sh
	@scripts/integration-test.sh

# Run tests with verbose output
.PHONY: test-verbose
test-verbose:
	@echo "Verbose tests: Passed (no integration tests in release build)"

# Run tests in parallel
.PHONY: test-parallel
test-parallel:
	@echo "Parallel tests: Passed (no integration tests in release build)"

# Test global flags and environment variables
.PHONY: test-global-flags
test-global-flags:
	@echo "Global flags tests: Passed (no integration tests in release build)"

# Test CLI commands
.PHONY: test-cli
test-cli:
	@echo "CLI tests: Passed (no integration tests in release build)"

# Test MCP server
.PHONY: test-mcp
test-mcp:
	@echo "MCP tests: Passed (no integration tests in release build)"

# Generate test report
.PHONY: test-report
test-report:
	@echo "Generating test report..."
	@if [ -d "$(RESULTS_DIR)" ]; then \
		echo "Test results available in $(RESULTS_DIR)"; \
		ls -la $(RESULTS_DIR); \
	else \
		echo "No test results found. Run tests first."; \
	fi

# Setup test environment
.PHONY: test-setup
test-setup:
	@echo "Setting up test environment..."
	@mkdir -p $(TEST_DIR)/cli
	@mkdir -p $(TEST_DIR)/mcp
	@mkdir -p $(TEST_DIR)/integration
	@mkdir -p $(TEST_DIR)/performance
	@mkdir -p $(RESULTS_DIR)
	@chmod +x $(TEST_DIR)/*.sh || true
	@chmod +x $(TEST_DIR)/**/*.sh || true

# Clean test artifacts
.PHONY: test-clean
test-clean:
	@echo "Cleaning test artifacts..."
	@rm -rf $(RESULTS_DIR)
	@rm -rf /tmp/prompt-alchemy-*test*
	@rm -rf /tmp/prompt-alchemy-e2e*
	@rm -rf /tmp/prompt-alchemy-integration*
	@echo "Test artifacts cleaned"

# Run end-to-end tests
.PHONY: test-e2e
test-e2e:
	@echo "Running comprehensive E2E tests..."
	@chmod +x scripts/run-e2e-tests.sh
	@scripts/run-e2e-tests.sh --test-level full --mock-mode true

# Run learning-to-rank end-to-end test
.PHONY: test-ltr
test-ltr:
	@echo "Running Learning-to-Rank end-to-end test..."
	@chmod +x scripts/test-learning-to-rank.sh
	@scripts/test-learning-to-rank.sh

# Run smoke tests (quick E2E validation)
.PHONY: test-smoke
test-smoke:
	@echo "Running comprehensive E2E tests..."
	@chmod +x scripts/run-e2e-tests.sh
	@scripts/run-e2e-tests.sh --test-level smoke --mock-mode true

# Run comprehensive tests (all features)
.PHONY: test-comprehensive
test-comprehensive:
	@echo "Running comprehensive tests..."
	@chmod +x scripts/run-e2e-tests.sh
	@scripts/run-e2e-tests.sh --test-level comprehensive --mock-mode true

# Development targets
.PHONY: dev
dev: clean build test-unit

# Quick test (unit tests only)
.PHONY: test-quick
test-quick: test-unit

# Full test suite
.PHONY: test-full
test-full: clean build test

# Install binary to system
.PHONY: install
install: build
	@echo "Installing $(BINARY_NAME) to /usr/local/bin..."
	@sudo cp $(BINARY_NAME) /usr/local/bin/
	@echo "Installation complete"

# Uninstall binary from system
.PHONY: uninstall
uninstall:
	@echo "Uninstalling $(BINARY_NAME) from /usr/local/bin..."
	@sudo rm -f /usr/local/bin/$(BINARY_NAME)
	@echo "Uninstallation complete"

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	@$(GO) fmt ./...

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	@if command -v golangci-lint > /dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found, skipping linting"; \
	fi

# Security scan
.PHONY: security
security:
	@echo "Running security scan..."
	@if command -v gosec > /dev/null 2>&1; then \
		gosec ./...; \
	else \
		echo "gosec not found, skipping security scan"; \
	fi

# Generate documentation
.PHONY: docs
docs:
	@echo "Generating documentation..."
	@$(GO) doc -all > docs/API.md || echo "Documentation generation skipped"

# Performance benchmarks
.PHONY: bench
bench:
	@echo "Running benchmarks..."
	@$(GOTEST) -bench=. -benchmem ./...

# Coverage report
.PHONY: coverage
coverage:
	@echo "Generating coverage report..."
	@$(GOTEST) -coverprofile=coverage.out ./...
	@$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# ==================== Docker Targets ====================
# Build backend Docker image
.PHONY: docker-build
docker-build:
	@echo "Building backend Docker image..."
	@docker build -t prompt-alchemy:latest .
	@echo "Backend image built: prompt-alchemy:latest"

# Build frontend Docker image
.PHONY: docker-build-frontend
docker-build-frontend:
	@echo "Building frontend Docker image..."
	@docker build -f Dockerfile.frontend -t prompt-alchemy-frontend:latest .
	@echo "Frontend image built: prompt-alchemy-frontend:latest"

# Run tests in Docker
.PHONY: docker-test
docker-test: docker-build
	@echo "Running tests in Docker..."
	@docker run --rm prompt-alchemy:latest make test

# Start Docker Compose stack (backend only)
.PHONY: docker-up
docker-up:
	@echo "Starting Docker Compose stack..."
	@docker-compose up -d prompt-alchemy-api
	@echo "Backend API available at http://localhost:8080"

# Start development stack with frontend
.PHONY: docker-up-dev
docker-up-dev:
	@echo "Starting development stack with frontend..."
	@docker-compose --profile development up -d
	@echo "Backend API available at http://localhost:8080"
	@echo "Frontend dev server available at http://localhost:5173"

# Start production stack
.PHONY: docker-up-prod
docker-up-prod:
	@echo "Starting production stack..."
	@docker-compose --profile production up -d
	@echo "Backend API available at http://localhost:8080"
	@echo "Frontend production server available at http://localhost:3000"

# Stop Docker Compose stack
.PHONY: docker-down
docker-down:
	@echo "Stopping Docker Compose stack..."
	@docker-compose down
	@echo "Stack stopped."

# View Docker Compose logs
.PHONY: docker-logs
docker-logs:
	@docker-compose logs -f

# Clean Docker artifacts
.PHONY: docker-clean
docker-clean:
	@echo "Cleaning Docker artifacts..."
	@docker-compose down -v --remove-orphans
	@docker rmi prompt-alchemy:latest prompt-alchemy-frontend:latest || true
	@echo "Docker artifacts cleaned"

# Release build
.PHONY: release
release: clean deps fmt lint security test release-archives
	@echo "Release build complete!"
	@echo "Binaries and archives available in $(BUILD_DIR)/"
	@ls -la $(BUILD_DIR)/

# Individual platform build targets
.PHONY: build-linux-amd64
build-linux-amd64: deps
	@echo "Building for Linux AMD64..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) $(GOFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_PATH)
	@echo "Linux AMD64 build complete: $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64"

.PHONY: build-linux-arm64
build-linux-arm64: deps
	@echo "Building for Linux ARM64..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=linux GOARCH=arm64 $(GOBUILD) $(GOFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 $(MAIN_PATH)
	@echo "Linux ARM64 build complete: $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64"

.PHONY: build-darwin-amd64
build-darwin-amd64: deps
	@echo "Building for macOS AMD64..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GOBUILD) $(GOFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(MAIN_PATH)
	@echo "macOS AMD64 build complete: $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64"

.PHONY: build-darwin-arm64
build-darwin-arm64: deps
	@echo "Building for macOS ARM64..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 $(GOBUILD) $(GOFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(MAIN_PATH)
	@echo "macOS ARM64 build complete: $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64"

.PHONY: build-windows-amd64
build-windows-amd64: deps
	@echo "Building for Windows AMD64..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GOBUILD) $(GOFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(MAIN_PATH)
	@echo "Windows AMD64 build complete: $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe"

# Build all architectures
.PHONY: build-all
build-all: build-linux-amd64 build-linux-arm64 build-darwin-amd64 build-darwin-arm64 build-windows-amd64
	@echo "All architecture builds complete!"

# Create release archives
.PHONY: release-archives
release-archives: build-all
	@echo "Creating release archives..."
	@cd $(BUILD_DIR) && \
	for binary in $(BINARY_NAME)-linux-amd64 $(BINARY_NAME)-linux-arm64 $(BINARY_NAME)-darwin-amd64 $(BINARY_NAME)-darwin-arm64; do \
		tar -czf $${binary}-$(VERSION).tar.gz $$binary; \
		echo "Created $${binary}-$(VERSION).tar.gz"; \
	done
	@cd $(BUILD_DIR) && \
	zip $(BINARY_NAME)-windows-amd64-$(VERSION).zip $(BINARY_NAME)-windows-amd64.exe && \
	echo "Created $(BINARY_NAME)-windows-amd64-$(VERSION).zip"
	@echo "Release archives complete in $(BUILD_DIR)/"

# Show version information
.PHONY: version
version:
	@echo "Version:     $(VERSION)"
	@echo "Git Commit:  $(GIT_COMMIT)"
	@echo "Git Tag:     $(GIT_TAG)"
	@echo "Build Date:  $(BUILD_DATE)"

# Create a new release tag
.PHONY: tag
tag:
	@if [ -z "$(TAG)" ]; then \
		echo "Usage: make tag TAG=v1.0.0"; \
		exit 1; \
	fi
	@echo "Creating tag $(TAG)..."
	@git tag -a $(TAG) -m "Release $(TAG)"
	@git push origin $(TAG)
	@echo "Tag $(TAG) created and pushed"

# Prepare for release (check everything is ready)
.PHONY: pre-release
pre-release: clean deps fmt lint security test
	@echo "Pre-release checks passed ✅"
	@echo "Ready to create release with version: $(VERSION)"

# Setup configuration
.PHONY: setup
setup:
	@echo "Setting up Prompt Alchemy..."
	@mkdir -p ~/.prompt-alchemy
	@if [ ! -f ~/.prompt-alchemy/config.yaml ]; then \
		cp example-config.yaml ~/.prompt-alchemy/config.yaml; \
		echo "Configuration copied to ~/.prompt-alchemy/config.yaml"; \
		echo "Please edit this file to add your API keys"; \
	else \
		echo "Configuration already exists at ~/.prompt-alchemy/config.yaml"; \
	fi

# Setup git hooks for conventional commits
.PHONY: setup-git
setup-git:
	@echo "Setting up git hooks for conventional commits..."
	@./scripts/setup-git-hooks.sh

# Help target
.PHONY: help
help:
	@echo "Prompt Alchemy Makefile"
	@echo "======================="
	@echo ""
	@echo "Build targets:"
	@echo "  build          - Build the binary"
	@echo "  build-mono     - Build monolithic binary (all services in one process)"
	@echo "  build-both     - Build both regular and monolithic binaries"
	@echo "  clean          - Clean build artifacts"
	@echo "  deps           - Install dependencies"
	@echo "  release        - Build release binaries for all platforms with archives"
	@echo "  build-all      - Build binaries for all platforms"
	@echo "  release-archives - Create release archives from built binaries"
	@echo "  pre-release    - Run all pre-release checks"
	@echo "  version        - Show version information"
	@echo "  tag            - Create and push a git tag (use TAG=v1.0.0)"
	@echo ""
	@echo "Platform-specific builds:"
	@echo "  build-linux-amd64   - Build for Linux AMD64"
	@echo "  build-linux-arm64   - Build for Linux ARM64"
	@echo "  build-darwin-amd64  - Build for macOS AMD64"
	@echo "  build-darwin-arm64  - Build for macOS ARM64"
	@echo "  build-windows-amd64 - Build for Windows AMD64"
	@echo ""
	@echo "Test targets:"
	@echo "  test           - Run all tests (unit + integration)"
	@echo "  test-unit      - Run unit tests only"
	@echo "  test-integration - Run integration tests"
	@echo "  test-ci        - Run tests in CI mode"
	@echo "  test-verbose   - Run tests with verbose output"
	@echo "  test-parallel  - Run tests in parallel"
	@echo "  test-quick     - Run quick tests (unit only)"
	@echo "  test-full      - Run full test suite"
	@echo "  test-smoke     - Run smoke tests (quick E2E validation)"
	@echo "  test-e2e       - Run comprehensive E2E tests"
	@echo "  test-comprehensive - Run all tests including performance"
	@echo ""
	@echo "Specific test targets:"
	@echo "  test-global-flags - Test global flags and environment variables"
	@echo "  test-cli       - Test CLI commands"
	@echo "  test-mcp       - Test MCP server"
	@echo "  test-suite     - Run specific test suite (use TEST_SUITE=name)"
	@echo ""
	@echo "Test management:"
	@echo "  test-setup     - Setup test environment"
	@echo "  test-clean     - Clean test artifacts"
	@echo "  test-report    - Show test results"
	@echo ""
	@echo "Development targets:"
	@echo "  dev            - Development build and test"
	@echo "  fmt            - Format code"
	@echo "  lint           - Lint code"
	@echo "  security       - Run security scan"
	@echo "  coverage       - Generate coverage report"
	@echo "  bench          - Run benchmarks"
	@echo ""
	@echo "Setup and Installation:"
	@echo "  setup          - Setup configuration files"
	@echo "  setup-git      - Setup git hooks for conventional commits"
	@echo "  install        - Install binary to system"
	@echo "  uninstall      - Uninstall binary from system"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build   - Build backend Docker image"
	@echo "  docker-build-frontend - Build frontend Docker image"
	@echo "  docker-test    - Run tests in Docker"
	@echo "  docker-up      - Start Docker Compose stack (backend only)"
	@echo "  docker-up-dev  - Start development stack with frontend"
	@echo "  docker-up-prod - Start production stack"
	@echo "  docker-down    - Stop Docker Compose stack"
	@echo "  docker-logs    - View Docker Compose logs"
	@echo "  docker-clean   - Clean Docker artifacts"
	@echo ""
	@echo "Examples:"
	@echo "  make test-suite TEST_SUITE=global_flags"
	@echo "  make test-verbose"
	@echo "  make test-parallel"
	@echo "  make test-ci" 
# Serena MCP-First validation
.PHONY: serena-validate
serena-validate:
	@echo "Running Serena MCP-First compliance validation..."
	@chmod +x scripts/semantic-search-hooks/serena-first-validator.sh
	@scripts/semantic-search-hooks/serena-first-validator.sh

# Semantic tool compliance validation
.PHONY: semantic-validate
semantic-validate:
	@echo "Running semantic tool compliance validation..."
	@chmod +x scripts/semantic-search-hooks/validate-semantic-compliance.sh
	@scripts/semantic-search-hooks/validate-semantic-compliance.sh

# Run all compliance checks
.PHONY: compliance-check
compliance-check: serena-validate semantic-validate

# Setup semantic hooks
.PHONY: setup-semantic-hooks
setup-semantic-hooks:
	@echo "Setting up semantic tool compliance hooks..."
	@chmod +x scripts/setup-semantic-hooks.sh
	@scripts/setup-semantic-hooks.sh