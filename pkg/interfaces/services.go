// Package interfaces defines service contracts for hybrid deployment architecture
package interfaces

import (
	"context"
	"time"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

// HealthStatus represents the health state of a service component
type HealthStatus struct {
	Status       string            `json:"status"` // operational, degraded, down
	LastCheck    time.Time         `json:"last_check"`
	ResponseTime time.Duration     `json:"response_time"`
	Details      map[string]string `json:"details,omitempty"`
	Error        string            `json:"error,omitempty"`
}

// GenerationRequest represents a prompt generation request
type GenerationRequest struct {
	Input          string            `json:"input"`
	Phases         []string          `json:"phases,omitempty"`
	Count          int               `json:"count,omitempty"`
	Persona        string            `json:"persona,omitempty"`
	Temperature    float64           `json:"temperature,omitempty"`
	Provider       string            `json:"provider,omitempty"`
	PhaseSelection string            `json:"phase_selection,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`
}

// GenerationResponse represents the result of prompt generation
type GenerationResponse struct {
	Prompts   []GeneratedPrompt `json:"prompts"`
	Metadata  GenerationMeta    `json:"metadata"`
	RequestID string            `json:"request_id"`
}

// GeneratedPrompt represents a single generated prompt
type GeneratedPrompt struct {
	Content  string            `json:"content"`
	Score    float64           `json:"score"`
	Phase    string            `json:"phase"`
	Provider string            `json:"provider"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// GenerationMeta contains metadata about the generation process
type GenerationMeta struct {
	TotalTime       time.Duration `json:"total_time"`
	PhasesCompleted []string      `json:"phases_completed"`
	ProviderUsed    string        `json:"provider_used"`
	TokensUsed      int           `json:"tokens_used,omitempty"`
}

// EngineCapabilities describes what the generation engine supports
type EngineCapabilities struct {
	SupportedPhases   []string `json:"supported_phases"`
	SupportedPersonas []string `json:"supported_personas"`
	MaxConcurrent     int      `json:"max_concurrent"`
	SupportsBatching  bool     `json:"supports_batching"`
	SupportsStreaming bool     `json:"supports_streaming"`
}

// ProviderInfo contains information about an LLM provider
type ProviderInfo struct {
	Name               string         `json:"name"`
	Available          bool           `json:"available"`
	SupportsEmbeddings bool           `json:"supports_embeddings"`
	Models             []string       `json:"models,omitempty"`
	Capabilities       []string       `json:"capabilities,omitempty"`
	ResponseTime       *time.Duration `json:"response_time,omitempty"`
	Error              string         `json:"error,omitempty"`
}

// SearchQuery represents a search request for stored prompts
type SearchQuery struct {
	Query      string            `json:"query"`
	Limit      int               `json:"limit"`
	Offset     int               `json:"offset"`
	Filters    map[string]string `json:"filters,omitempty"`
	Embeddings []float64         `json:"embeddings,omitempty"`
	Threshold  float64           `json:"threshold,omitempty"`
}

// RouteConfig represents an API route configuration
type RouteConfig struct {
	Method  string `json:"method"`
	Path    string `json:"path"`
	Handler string `json:"handler"`
}

// MCPConfig represents MCP server configuration
type MCPConfig struct {
	Port    int               `json:"port"`
	Host    string            `json:"host"`
	Tools   []string          `json:"tools"`
	Options map[string]string `json:"options,omitempty"`
}

// MCPTool represents an MCP tool definition
type MCPTool struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Parameters  map[string]string `json:"parameters,omitempty"`
	Handler     string            `json:"handler"`
}

// Feedback represents user feedback for learning
type Feedback struct {
	PromptID  string            `json:"prompt_id"`
	Rating    float64           `json:"rating"`
	Comments  string            `json:"comments,omitempty"`
	Context   map[string]string `json:"context,omitempty"`
	Timestamp time.Time         `json:"timestamp"`
}

// Core service interfaces for dependency injection

// APIGateway handles HTTP API requests and routing
type APIGateway interface {
	Start(ctx context.Context, port int) error
	Stop(ctx context.Context) error
	RegisterRoutes(routes []RouteConfig) error
	Health() HealthStatus
	GetAddress() string
}

// GenerationEngine handles the three-phase prompt generation process
type GenerationEngine interface {
	Generate(ctx context.Context, req GenerationRequest) (*GenerationResponse, error)
	GenerateBatch(ctx context.Context, reqs []GenerationRequest) ([]*GenerationResponse, error)
	GetCapabilities() EngineCapabilities
	Health() HealthStatus
	GetMetrics() map[string]interface{}
}

// ProviderManager manages LLM provider integrations
type ProviderManager interface {
	ListProviders(ctx context.Context) ([]ProviderInfo, error)
	GetProvider(name string) (Provider, error)
	TestProvider(ctx context.Context, name string) error
	RefreshProviders(ctx context.Context) error
	Health() HealthStatus
	GetProviderMetrics(name string) map[string]interface{}
}

// Provider represents a single LLM provider
type Provider interface {
	Name() string
	Available() bool
	SupportsEmbeddings() bool
	GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error)
	GenerateEmbeddings(ctx context.Context, text string) ([]float64, error)
	Health() HealthStatus
	GetModels() []string
}

// StorageLayer handles data persistence and retrieval
type StorageLayer interface {
	Store(ctx context.Context, prompt *models.Prompt) error
	Search(ctx context.Context, query SearchQuery) ([]models.Prompt, error)
	GetEmbeddings(ctx context.Context, text string) ([]float64, error)
	StoreEmbeddings(ctx context.Context, text string, embeddings []float64) error
	Health() HealthStatus
	GetStats() map[string]interface{}
}

// MCPServer handles Model Context Protocol server functionality
type MCPServer interface {
	Start(ctx context.Context, config MCPConfig) error
	Stop(ctx context.Context) error
	RegisterTools(tools []MCPTool) error
	Health() HealthStatus
	GetConnectedClients() int
}

// LearningEngine processes feedback and improves the system
type LearningEngine interface {
	ProcessFeedback(ctx context.Context, feedback Feedback) error
	UpdateWeights(ctx context.Context) error
	GetRecommendations(ctx context.Context, context map[string]string) (map[string]float64, error)
	Health() HealthStatus
	IsEnabled() bool
}

// ServiceRegistry manages service dependencies and discovery
type ServiceRegistry interface {
	RegisterService(name string, service interface{}) error
	GetService(name string) (interface{}, error)
	ListServices() map[string]interface{}
	Health() map[string]HealthStatus
	SetDiscovery(discovery ServiceDiscovery)
}

// ServiceDiscovery handles service location in distributed deployments
type ServiceDiscovery interface {
	Register(name string, address string, metadata map[string]string) error
	Discover(name string) ([]ServiceInstance, error)
	Watch(name string, callback func(instances []ServiceInstance)) error
	Unregister(name string) error
	Health() HealthStatus
}

// ServiceInstance represents a discovered service instance
type ServiceInstance struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Address  string            `json:"address"`
	Port     int               `json:"port"`
	Metadata map[string]string `json:"metadata,omitempty"`
	Health   HealthStatus      `json:"health"`
}

// Configuration interfaces for flexible config management

// ConfigManager handles configuration loading and management
type ConfigManager interface {
	Load() error
	Get(key string) interface{}
	Set(key string, value interface{}) error
	Watch(key string, callback func(value interface{})) error
	Health() HealthStatus
}

// MetricsCollector handles system metrics and monitoring
type MetricsCollector interface {
	RecordCounter(name string, value int64, tags map[string]string)
	RecordGauge(name string, value float64, tags map[string]string)
	RecordTimer(name string, duration time.Duration, tags map[string]string)
	GetMetrics() map[string]interface{}
	Health() HealthStatus
}

// Logger provides structured logging across services
type Logger interface {
	Debug(msg string, fields map[string]interface{})
	Info(msg string, fields map[string]interface{})
	Warn(msg string, fields map[string]interface{})
	Error(msg string, err error, fields map[string]interface{})
	With(fields map[string]interface{}) Logger
}
