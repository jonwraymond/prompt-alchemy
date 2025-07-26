# Hybrid Deployment Architecture for Prompt Alchemy

## Architecture Overview

This document outlines the hybrid architecture that supports both single-binary monolithic deployment and modular containerized deployment.

## Core Principles

1. **Interface-First Design** - All components communicate through well-defined interfaces
2. **Dependency Injection** - Runtime wiring of components based on deployment mode
3. **Feature Flags** - Runtime control over component activation
4. **Minimal Coupling** - Components depend on abstractions, not implementations
5. **Graceful Degradation** - System continues functioning when optional components fail

## Component Architecture

### 1. Service Interfaces

```go
// pkg/interfaces/services.go
package interfaces

import (
    "context"
    "github.com/jonwraymond/prompt-alchemy/pkg/models"
)

// Core service interfaces for dependency injection
type APIGateway interface {
    Start(ctx context.Context, port int) error
    Stop(ctx context.Context) error
    RegisterRoutes(routes []RouteConfig) error
    Health() HealthStatus
}

type GenerationEngine interface {
    Generate(ctx context.Context, req GenerationRequest) (*GenerationResponse, error)
    GetCapabilities() EngineCapabilities
    Health() HealthStatus
}

type ProviderManager interface {
    ListProviders(ctx context.Context) ([]ProviderInfo, error)
    GetProvider(name string) (Provider, error)
    TestProvider(ctx context.Context, name string) error
    Health() HealthStatus
}

type StorageLayer interface {
    Store(ctx context.Context, prompt *models.Prompt) error
    Search(ctx context.Context, query SearchQuery) ([]models.Prompt, error)
    GetEmbeddings(ctx context.Context, text string) ([]float64, error)
    Health() HealthStatus
}

type MCPServer interface {
    Start(ctx context.Context, config MCPConfig) error
    Stop(ctx context.Context) error
    RegisterTools(tools []MCPTool) error
    Health() HealthStatus
}

type LearningEngine interface {
    ProcessFeedback(ctx context.Context, feedback Feedback) error
    UpdateWeights(ctx context.Context) error
    Health() HealthStatus
}

// Service registry for dependency injection
type ServiceRegistry interface {
    RegisterService(name string, service interface{}) error
    GetService(name string) (interface{}, error)
    ListServices() map[string]interface{}
    Health() map[string]HealthStatus
}
```

### 2. Deployment Modes

#### Monolithic Mode (Single Binary)
```go
// cmd/monolithic/main.go
package main

import (
    "context"
    "log"
    "github.com/jonwraymond/prompt-alchemy/internal/registry"
    "github.com/jonwraymond/prompt-alchemy/internal/api"
    "github.com/jonwraymond/prompt-alchemy/internal/engine"
    "github.com/jonwraymond/prompt-alchemy/internal/storage"
    "github.com/jonwraymond/prompt-alchemy/internal/mcp"
    "github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

func main() {
    ctx := context.Background()
    
    // Initialize service registry
    registry := registry.NewServiceRegistry()
    
    // Initialize all services in single process
    storageService := storage.NewSQLiteStorage(config.Database)
    providerManager := providers.NewManager(config.Providers)
    engineService := engine.NewEngine(providerManager, storageService)
    apiService := api.NewGateway(engineService, providerManager, storageService)
    mcpService := mcp.NewServer(engineService, providerManager)
    
    // Register services
    registry.RegisterService("storage", storageService)
    registry.RegisterService("providers", providerManager)
    registry.RegisterService("engine", engineService)
    registry.RegisterService("api", apiService)
    registry.RegisterService("mcp", mcpService)
    
    // Start all services
    startServices(ctx, registry)
}
```

#### Microservice Mode (Containerized)
```go
// cmd/microservice/main.go
package main

import (
    "context"
    "os"
    "github.com/jonwraymond/prompt-alchemy/internal/registry"
    "github.com/jonwraymond/prompt-alchemy/internal/discovery"
)

func main() {
    ctx := context.Background()
    serviceType := os.Getenv("SERVICE_TYPE") // api, engine, providers, mcp
    
    // Initialize service registry with discovery
    registry := registry.NewServiceRegistry()
    discovery := discovery.NewServiceDiscovery(config.Discovery)
    
    switch serviceType {
    case "api":
        startAPIService(ctx, registry, discovery)
    case "engine":
        startEngineService(ctx, registry, discovery)
    case "providers":
        startProviderService(ctx, registry, discovery)
    case "mcp":
        startMCPService(ctx, registry, discovery)
    default:
        log.Fatal("Unknown service type")
    }
}
```

### 3. Service Registry Implementation

```go
// internal/registry/registry.go
package registry

import (
    "fmt"
    "sync"
    "github.com/jonwraymond/prompt-alchemy/pkg/interfaces"
)

type serviceRegistry struct {
    services map[string]interface{}
    mutex    sync.RWMutex
    discovery interfaces.ServiceDiscovery
}

func NewServiceRegistry() interfaces.ServiceRegistry {
    return &serviceRegistry{
        services: make(map[string]interface{}),
    }
}

func (r *serviceRegistry) RegisterService(name string, service interface{}) error {
    r.mutex.Lock()
    defer r.mutex.Unlock()
    
    r.services[name] = service
    
    // Register with service discovery if available
    if r.discovery != nil {
        return r.discovery.Register(name, service)
    }
    
    return nil
}

func (r *serviceRegistry) GetService(name string) (interface{}, error) {
    r.mutex.RLock()
    defer r.mutex.RUnlock()
    
    if service, exists := r.services[name]; exists {
        return service, nil
    }
    
    // Try service discovery if available
    if r.discovery != nil {
        return r.discovery.Discover(name)
    }
    
    return nil, fmt.Errorf("service %s not found", name)
}
```

### 4. Feature Flags System

```go
// internal/features/flags.go
package features

import "os"

type FeatureFlags struct {
    EnableAPI      bool
    EnableMCP      bool
    EnableLearning bool
    EnableMetrics  bool
    DebugMode      bool
}

func LoadFeatureFlags() FeatureFlags {
    return FeatureFlags{
        EnableAPI:      getEnvBool("ENABLE_API", true),
        EnableMCP:      getEnvBool("ENABLE_MCP", true),
        EnableLearning: getEnvBool("ENABLE_LEARNING", true),
        EnableMetrics:  getEnvBool("ENABLE_METRICS", false),
        DebugMode:      getEnvBool("DEBUG_MODE", false),
    }
}

func getEnvBool(key string, defaultValue bool) bool {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    return value == "true" || value == "1"
}
```

### 5. Service Discovery Interface

```go
// pkg/interfaces/discovery.go
package interfaces

type ServiceDiscovery interface {
    Register(name string, service interface{}) error
    Discover(name string) (interface{}, error)
    Watch(name string, callback func(service interface{})) error
    Health() map[string]HealthStatus
}

// For containerized deployments
type ContainerDiscovery struct {
    consulClient *consul.Client
    services     map[string]*consul.AgentService
}

// For monolithic deployments
type LocalDiscovery struct {
    services map[string]interface{}
}
```

## Deployment Configurations

### Single Binary (docker-compose.monolithic.yml)
```yaml
version: '3.8'
services:
  prompt-alchemy:
    build:
      context: .
      dockerfile: Dockerfile.monolithic
    ports:
      - "8080:8080"    # API
      - "3333:3333"    # MCP
    environment:
      - DEPLOYMENT_MODE=monolithic
      - ENABLE_API=true
      - ENABLE_MCP=true
      - ENABLE_LEARNING=true
    volumes:
      - ./data:/app/data
    command: ["./prompt-alchemy", "serve", "--all"]
```

### Microservices (docker-compose.microservices.yml)
```yaml
version: '3.8'
services:
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.microservice
    ports:
      - "8080:8080"
    environment:
      - SERVICE_TYPE=api
      - ENGINE_URL=http://engine:8081
      - PROVIDERS_URL=http://providers:8082
    depends_on:
      - engine
      - providers

  engine:
    build:
      context: .
      dockerfile: Dockerfile.microservice
    ports:
      - "8081:8081"
    environment:
      - SERVICE_TYPE=engine
      - STORAGE_URL=http://storage:8083
      - PROVIDERS_URL=http://providers:8082

  providers:
    build:
      context: .
      dockerfile: Dockerfile.microservice
    ports:
      - "8082:8082"
    environment:
      - SERVICE_TYPE=providers

  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.microservice
    ports:
      - "3333:3333"
    environment:
      - SERVICE_TYPE=mcp
      - ENGINE_URL=http://engine:8081
```

## Build System

### Makefile Updates
```makefile
# Build targets for hybrid deployment
.PHONY: build-monolithic build-microservices

build-monolithic:
	CGO_ENABLED=1 go build -o bin/prompt-alchemy-mono cmd/monolithic/main.go

build-microservices:
	CGO_ENABLED=1 go build -o bin/prompt-alchemy-api cmd/microservice/main.go
	CGO_ENABLED=1 go build -o bin/prompt-alchemy-engine cmd/microservice/main.go
	CGO_ENABLED=1 go build -o bin/prompt-alchemy-providers cmd/microservice/main.go
	CGO_ENABLED=1 go build -o bin/prompt-alchemy-mcp cmd/microservice/main.go

# Docker builds
docker-build-monolithic:
	docker build -f Dockerfile.monolithic -t prompt-alchemy:monolithic .

docker-build-microservices:
	docker build -f Dockerfile.microservice -t prompt-alchemy:microservice .

# Deployment commands
deploy-monolithic:
	docker-compose -f docker-compose.monolithic.yml up -d

deploy-microservices:
	docker-compose -f docker-compose.microservices.yml up -d
```

## Benefits of This Architecture

### Development Benefits
- **Rapid Development**: Single binary for local development
- **Easy Debugging**: All components in one process
- **Simple Testing**: Integrated test environment
- **Fast Iterations**: No container orchestration overhead

### Production Benefits
- **Scalability**: Independent service scaling
- **Resilience**: Component isolation and fault tolerance
- **Flexibility**: Mix and match deployment strategies
- **Resource Optimization**: Efficient resource allocation per service

### Operational Benefits
- **Gradual Migration**: Start monolithic, migrate to microservices
- **Environment Flexibility**: Different strategies per environment
- **Cost Optimization**: Right-size deployments for usage patterns
- **Maintenance**: Independent service updates and rollbacks

## Migration Path

1. **Phase 1**: Implement interface abstractions (current task)
2. **Phase 2**: Add service registry and dependency injection
3. **Phase 3**: Implement feature flags system
4. **Phase 4**: Create microservice entry points
5. **Phase 5**: Add service discovery for distributed mode
6. **Phase 6**: Implement deployment automation
7. **Phase 7**: Add monitoring and observability

This architecture provides the flexibility to deploy as a single binary for development and testing, while supporting full microservice deployment for production scalability.