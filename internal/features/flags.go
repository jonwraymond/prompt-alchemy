// Package features provides feature flag management for runtime component control
package features

import (
	"os"
	"strconv"
	"strings"
	"sync"
)

// FeatureFlags contains all available feature flags for the system
type FeatureFlags struct {
	// Core Services
	EnableAPI      bool `json:"enable_api"`
	EnableMCP      bool `json:"enable_mcp"`
	EnableLearning bool `json:"enable_learning"`
	EnableMetrics  bool `json:"enable_metrics"`

	// Provider Features
	EnableOpenAI     bool `json:"enable_openai"`
	EnableAnthropic  bool `json:"enable_anthropic"`
	EnableGoogle     bool `json:"enable_google"`
	EnableOllama     bool `json:"enable_ollama"`
	EnableOpenRouter bool `json:"enable_openrouter"`
	EnableGrok       bool `json:"enable_grok"`

	// Engine Features
	EnableParallelPhases  bool `json:"enable_parallel_phases"`
	EnableBatchGeneration bool `json:"enable_batch_generation"`
	EnableStreaming       bool `json:"enable_streaming"`
	EnableCaching         bool `json:"enable_caching"`

	// Storage Features
	EnableEmbeddings   bool `json:"enable_embeddings"`
	EnableVectorSearch bool `json:"enable_vector_search"`
	EnableBackup       bool `json:"enable_backup"`
	EnableCompression  bool `json:"enable_compression"`

	// Development Features
	DebugMode       bool `json:"debug_mode"`
	VerboseLogging  bool `json:"verbose_logging"`
	MockProviders   bool `json:"mock_providers"`
	EnableProfiling bool `json:"enable_profiling"`

	// Deployment Mode
	DeploymentMode string `json:"deployment_mode"` // monolithic, microservices

	// Service-specific flags (for microservice mode)
	ServiceType string `json:"service_type"` // api, engine, providers, mcp, storage

	mutex sync.RWMutex
}

// DefaultFeatureFlags returns the default feature flag configuration
func DefaultFeatureFlags() *FeatureFlags {
	return &FeatureFlags{
		// Core Services - enabled by default
		EnableAPI:      true,
		EnableMCP:      true,
		EnableLearning: true,
		EnableMetrics:  false, // disabled by default for performance

		// Providers - enabled by default
		EnableOpenAI:     true,
		EnableAnthropic:  true,
		EnableGoogle:     true,
		EnableOllama:     true,
		EnableOpenRouter: true,
		EnableGrok:       true,

		// Engine Features - conservative defaults
		EnableParallelPhases:  true,
		EnableBatchGeneration: false, // experimental
		EnableStreaming:       false, // experimental
		EnableCaching:         true,

		// Storage Features
		EnableEmbeddings:   true,
		EnableVectorSearch: true,
		EnableBackup:       false, // disabled by default
		EnableCompression:  false, // disabled by default

		// Development Features - disabled by default
		DebugMode:       false,
		VerboseLogging:  false,
		MockProviders:   false,
		EnableProfiling: false,

		// Deployment
		DeploymentMode: "monolithic",
		ServiceType:    "",
	}
}

// LoadFeatureFlags loads feature flags from environment variables
func LoadFeatureFlags() *FeatureFlags {
	flags := DefaultFeatureFlags()

	// Core Services
	flags.EnableAPI = getEnvBool("ENABLE_API", flags.EnableAPI)
	flags.EnableMCP = getEnvBool("ENABLE_MCP", flags.EnableMCP)
	flags.EnableLearning = getEnvBool("ENABLE_LEARNING", flags.EnableLearning)
	flags.EnableMetrics = getEnvBool("ENABLE_METRICS", flags.EnableMetrics)

	// Providers
	flags.EnableOpenAI = getEnvBool("ENABLE_OPENAI", flags.EnableOpenAI)
	flags.EnableAnthropic = getEnvBool("ENABLE_ANTHROPIC", flags.EnableAnthropic)
	flags.EnableGoogle = getEnvBool("ENABLE_GOOGLE", flags.EnableGoogle)
	flags.EnableOllama = getEnvBool("ENABLE_OLLAMA", flags.EnableOllama)
	flags.EnableOpenRouter = getEnvBool("ENABLE_OPENROUTER", flags.EnableOpenRouter)
	flags.EnableGrok = getEnvBool("ENABLE_GROK", flags.EnableGrok)

	// Engine Features
	flags.EnableParallelPhases = getEnvBool("ENABLE_PARALLEL_PHASES", flags.EnableParallelPhases)
	flags.EnableBatchGeneration = getEnvBool("ENABLE_BATCH_GENERATION", flags.EnableBatchGeneration)
	flags.EnableStreaming = getEnvBool("ENABLE_STREAMING", flags.EnableStreaming)
	flags.EnableCaching = getEnvBool("ENABLE_CACHING", flags.EnableCaching)

	// Storage Features
	flags.EnableEmbeddings = getEnvBool("ENABLE_EMBEDDINGS", flags.EnableEmbeddings)
	flags.EnableVectorSearch = getEnvBool("ENABLE_VECTOR_SEARCH", flags.EnableVectorSearch)
	flags.EnableBackup = getEnvBool("ENABLE_BACKUP", flags.EnableBackup)
	flags.EnableCompression = getEnvBool("ENABLE_COMPRESSION", flags.EnableCompression)

	// Development Features
	flags.DebugMode = getEnvBool("DEBUG_MODE", flags.DebugMode)
	flags.VerboseLogging = getEnvBool("VERBOSE_LOGGING", flags.VerboseLogging)
	flags.MockProviders = getEnvBool("MOCK_PROVIDERS", flags.MockProviders)
	flags.EnableProfiling = getEnvBool("ENABLE_PROFILING", flags.EnableProfiling)

	// Deployment
	flags.DeploymentMode = getEnvString("DEPLOYMENT_MODE", flags.DeploymentMode)
	flags.ServiceType = getEnvString("SERVICE_TYPE", flags.ServiceType)

	return flags
}

// IsEnabled checks if a specific feature is enabled
func (f *FeatureFlags) IsEnabled(feature string) bool {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	switch strings.ToLower(feature) {
	// Core Services
	case "api":
		return f.EnableAPI
	case "mcp":
		return f.EnableMCP
	case "learning":
		return f.EnableLearning
	case "metrics":
		return f.EnableMetrics

	// Providers
	case "openai":
		return f.EnableOpenAI
	case "anthropic":
		return f.EnableAnthropic
	case "google":
		return f.EnableGoogle
	case "ollama":
		return f.EnableOllama
	case "openrouter":
		return f.EnableOpenRouter
	case "grok":
		return f.EnableGrok

	// Engine Features
	case "parallel_phases":
		return f.EnableParallelPhases
	case "batch_generation":
		return f.EnableBatchGeneration
	case "streaming":
		return f.EnableStreaming
	case "caching":
		return f.EnableCaching

	// Storage Features
	case "embeddings":
		return f.EnableEmbeddings
	case "vector_search":
		return f.EnableVectorSearch
	case "backup":
		return f.EnableBackup
	case "compression":
		return f.EnableCompression

	// Development Features
	case "debug":
		return f.DebugMode
	case "verbose":
		return f.VerboseLogging
	case "mock":
		return f.MockProviders
	case "profiling":
		return f.EnableProfiling

	default:
		return false
	}
}

// SetFeature enables or disables a specific feature at runtime
func (f *FeatureFlags) SetFeature(feature string, enabled bool) {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	switch strings.ToLower(feature) {
	// Core Services
	case "api":
		f.EnableAPI = enabled
	case "mcp":
		f.EnableMCP = enabled
	case "learning":
		f.EnableLearning = enabled
	case "metrics":
		f.EnableMetrics = enabled

	// Providers
	case "openai":
		f.EnableOpenAI = enabled
	case "anthropic":
		f.EnableAnthropic = enabled
	case "google":
		f.EnableGoogle = enabled
	case "ollama":
		f.EnableOllama = enabled
	case "openrouter":
		f.EnableOpenRouter = enabled
	case "grok":
		f.EnableGrok = enabled

	// Engine Features
	case "parallel_phases":
		f.EnableParallelPhases = enabled
	case "batch_generation":
		f.EnableBatchGeneration = enabled
	case "streaming":
		f.EnableStreaming = enabled
	case "caching":
		f.EnableCaching = enabled

	// Storage Features
	case "embeddings":
		f.EnableEmbeddings = enabled
	case "vector_search":
		f.EnableVectorSearch = enabled
	case "backup":
		f.EnableBackup = enabled
	case "compression":
		f.EnableCompression = enabled

	// Development Features
	case "debug":
		f.DebugMode = enabled
	case "verbose":
		f.VerboseLogging = enabled
	case "mock":
		f.MockProviders = enabled
	case "profiling":
		f.EnableProfiling = enabled
	}
}

// GetEnabledProviders returns a list of enabled provider names
func (f *FeatureFlags) GetEnabledProviders() []string {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	var providers []string

	if f.EnableOpenAI {
		providers = append(providers, "openai")
	}
	if f.EnableAnthropic {
		providers = append(providers, "anthropic")
	}
	if f.EnableGoogle {
		providers = append(providers, "google")
	}
	if f.EnableOllama {
		providers = append(providers, "ollama")
	}
	if f.EnableOpenRouter {
		providers = append(providers, "openrouter")
	}
	if f.EnableGrok {
		providers = append(providers, "grok")
	}

	return providers
}

// IsMonolithicDeployment returns true if running in monolithic mode
func (f *FeatureFlags) IsMonolithicDeployment() bool {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	return strings.ToLower(f.DeploymentMode) == "monolithic"
}

// IsMicroserviceDeployment returns true if running in microservice mode
func (f *FeatureFlags) IsMicroserviceDeployment() bool {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	return strings.ToLower(f.DeploymentMode) == "microservices"
}

// GetServiceType returns the service type for microservice deployments
func (f *FeatureFlags) GetServiceType() string {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	return f.ServiceType
}

// ShouldStartService determines if a service should be started based on deployment mode
func (f *FeatureFlags) ShouldStartService(serviceName string) bool {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	// In monolithic mode, start all enabled services
	if f.IsMonolithicDeployment() {
		return f.IsEnabled(serviceName)
	}

	// In microservice mode, only start the specified service type
	if f.IsMicroserviceDeployment() {
		return strings.EqualFold(f.ServiceType, serviceName)
	}

	// Default to starting the service if enabled
	return f.IsEnabled(serviceName)
}

// GetLogLevel returns the appropriate log level based on feature flags
func (f *FeatureFlags) GetLogLevel() string {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	if f.DebugMode {
		return "debug"
	}
	if f.VerboseLogging {
		return "info"
	}
	return "warn"
}

// Copy creates a copy of the feature flags
func (f *FeatureFlags) Copy() *FeatureFlags {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	return &FeatureFlags{
		EnableAPI:             f.EnableAPI,
		EnableMCP:             f.EnableMCP,
		EnableLearning:        f.EnableLearning,
		EnableMetrics:         f.EnableMetrics,
		EnableOpenAI:          f.EnableOpenAI,
		EnableAnthropic:       f.EnableAnthropic,
		EnableGoogle:          f.EnableGoogle,
		EnableOllama:          f.EnableOllama,
		EnableOpenRouter:      f.EnableOpenRouter,
		EnableGrok:            f.EnableGrok,
		EnableParallelPhases:  f.EnableParallelPhases,
		EnableBatchGeneration: f.EnableBatchGeneration,
		EnableStreaming:       f.EnableStreaming,
		EnableCaching:         f.EnableCaching,
		EnableEmbeddings:      f.EnableEmbeddings,
		EnableVectorSearch:    f.EnableVectorSearch,
		EnableBackup:          f.EnableBackup,
		EnableCompression:     f.EnableCompression,
		DebugMode:             f.DebugMode,
		VerboseLogging:        f.VerboseLogging,
		MockProviders:         f.MockProviders,
		EnableProfiling:       f.EnableProfiling,
		DeploymentMode:        f.DeploymentMode,
		ServiceType:           f.ServiceType,
	}
}

// Helper functions

func getEnvBool(key string, defaultValue bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}

	// Parse boolean values
	switch strings.ToLower(value) {
	case "true", "1", "yes", "on", "enable", "enabled":
		return true
	case "false", "0", "no", "off", "disable", "disabled":
		return false
	default:
		// Try to parse as boolean
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
		return defaultValue
	}
}

func getEnvString(key string, defaultValue string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}
	return value
}

// Global feature flags instance
var globalFlags *FeatureFlags
var flagsOnce sync.Once

// GetGlobalFeatureFlags returns the global feature flags instance
func GetGlobalFeatureFlags() *FeatureFlags {
	flagsOnce.Do(func() {
		globalFlags = LoadFeatureFlags()
	})
	return globalFlags
}

// ReloadGlobalFeatureFlags reloads the global feature flags from environment
func ReloadGlobalFeatureFlags() *FeatureFlags {
	globalFlags = LoadFeatureFlags()
	return globalFlags
}
