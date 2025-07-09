# Prompt Alchemy Makefile

.PHONY: build clean test install run help deps

# Binary name
BINARY_NAME=prompt-alchemy
MAIN_PATH=cmd/main.go

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOINSTALL=$(GOCMD) install

# Build the binary
build:
	$(GOBUILD) -o $(BINARY_NAME) -v $(MAIN_PATH)

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)

# Run tests
test:
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out

# Install dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Install the binary to GOPATH/bin
install: build
	$(GOINSTALL) $(MAIN_PATH)

# Run the application
run: build
	./$(BINARY_NAME)

# Build for multiple platforms
build-all:
	GOOS=darwin GOARCH=amd64 $(GOBUILD) -o $(BINARY_NAME)-darwin-amd64 $(MAIN_PATH)
	GOOS=darwin GOARCH=arm64 $(GOBUILD) -o $(BINARY_NAME)-darwin-arm64 $(MAIN_PATH)
	GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_NAME)-linux-amd64 $(MAIN_PATH)
	GOOS=windows GOARCH=amd64 $(GOBUILD) -o $(BINARY_NAME)-windows-amd64.exe $(MAIN_PATH)

# Run with example
example: build
	./$(BINARY_NAME) generate "Create a prompt for writing unit tests"

# Setup development environment
setup:
	mkdir -p ~/.prompt-alchemy
	cp example-config.yaml ~/.prompt-alchemy/config.yaml
	@echo "Configuration copied to ~/.prompt-alchemy/config.yaml"
	@echo "Please edit the file and add your API keys"

# Show help
help:
	@echo "Prompt Alchemy Makefile Commands:"
	@echo "  make build         - Build the binary"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make test          - Run tests"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make deps          - Download dependencies"
	@echo "  make install       - Install binary to GOPATH/bin"
	@echo "  make run           - Build and run the application"
	@echo "  make build-all     - Build for multiple platforms"
	@echo "  make example       - Run an example prompt generation"
	@echo "  make setup         - Setup development environment"
	@echo "  make help          - Show this help message"

# Default target
.DEFAULT_GOAL := build 