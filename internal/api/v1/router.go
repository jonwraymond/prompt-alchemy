package v1

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jonwraymond/prompt-alchemy/internal/domain/prompt"
	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	httpMiddleware "github.com/jonwraymond/prompt-alchemy/internal/http"
	"github.com/jonwraymond/prompt-alchemy/internal/httputil"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/observability/metrics"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// RouterConfig contains configuration for the v1 API router
type RouterConfig struct {
	EnableCORS      bool
	CORSOrigins     []string
	EnableAuth      bool
	APIKeys         []string
	EnableRateLimit bool
	RequestsPerMin  int
	Burst           int
}

// RouterDependencies contains all dependencies needed by the router
type RouterDependencies struct {
	Storage     *storage.Storage
	Registry    *providers.Registry
	Engine      *engine.Engine
	Ranker      *ranking.Ranker
	LearningEng *learning.LearningEngine
	PromptSvc   *prompt.Service
	Logger      *logrus.Logger
	Metrics     *metrics.Metrics
}

// Router contains the v1 API router and its dependencies
type Router struct {
	config RouterConfig
	deps   RouterDependencies

	// Handlers
	promptHandler   *V1Handler
	systemHandler   *SystemHandler
	providerHandler *ProviderHandler
}

// NewRouter creates a new v1 API router with all dependencies
func NewRouter(config RouterConfig, deps RouterDependencies) *Router {
	// Create handlers
	promptHandler := NewV1Handler(
		deps.Storage,
		deps.Registry,
		deps.Engine,
		deps.Ranker,
		deps.LearningEng,
		deps.Logger,
	)

	systemHandler := NewSystemHandler(deps.Logger, deps.Metrics, deps.LearningEng)
	providerHandler := NewProviderHandler(deps.Registry, deps.Logger)

	return &Router{
		config:          config,
		deps:            deps,
		promptHandler:   promptHandler,
		systemHandler:   systemHandler,
		providerHandler: providerHandler,
	}
}

// SetupRoutes creates and configures the v1 API routes
func (rt *Router) SetupRoutes() http.Handler {
	r := chi.NewRouter()

	// Setup middleware stack
	middlewareConfig := httpMiddleware.MiddlewareConfig{
		EnableCORS:      rt.config.EnableCORS,
		CORSOrigins:     rt.config.CORSOrigins,
		EnableAuth:      rt.config.EnableAuth,
		APIKeys:         rt.config.APIKeys,
		EnableRateLimit: rt.config.EnableRateLimit,
		RequestsPerMin:  rt.config.RequestsPerMin,
		Burst:           rt.config.Burst,
	}

	middlewares := httpMiddleware.SetupMiddleware(rt.deps.Logger, middlewareConfig)

	// Add metrics middleware if available
	if rt.deps.Metrics != nil {
		middlewares = append(middlewares, rt.deps.Metrics.Middleware())
	}

	// Apply all middleware
	for _, mw := range middlewares {
		r.Use(mw)
	}

	// Security headers
	r.Use(httpMiddleware.SecurityHeaders())

	// Mount system routes (no authentication required)
	rt.mountSystemRoutes(r)

	// Mount v1 API routes
	r.Route("/api/v1", func(r chi.Router) {
		rt.mountV1Routes(r)
	})

	return r
}

// mountSystemRoutes mounts system-level routes (health, metrics, etc.)
func (rt *Router) mountSystemRoutes(r chi.Router) {
	// Health check (no auth required)
	r.Get("/health", httpMiddleware.HealthCheck())

	// Version endpoint (no auth required)
	r.Get("/version", rt.systemHandler.GetVersion)

	// Metrics endpoint (if enabled)
	if rt.deps.Metrics != nil {
		r.Handle("/metrics", rt.deps.Metrics.Handler())
	}
}

// mountV1Routes mounts all v1 API routes
func (rt *Router) mountV1Routes(r chi.Router) {
	// System endpoints
	r.Get("/status", rt.systemHandler.GetStatus)
	r.Get("/info", rt.systemHandler.GetInfo)

	// Provider endpoints
	r.Route("/providers", func(r chi.Router) {
		r.Get("/", rt.providerHandler.ListProviders)
		r.Get("/{provider}", rt.providerHandler.GetProvider)
		r.Get("/{provider}/models", rt.providerHandler.GetProviderModels)
	})

	// Prompt endpoints
	r.Route("/prompts", func(r chi.Router) {
		// List and create prompts
		r.Get("/", rt.promptHandler.ListPrompts)
		r.Post("/", rt.promptHandler.CreatePrompt)

		// Generate prompts (main functionality)
		r.Post("/generate", rt.promptHandler.HandleGeneratePrompts)

		// Search prompts
		r.Get("/search", rt.promptHandler.SearchPrompts)

		// Popular and recent prompts
		r.Get("/popular", rt.promptHandler.GetPopularPrompts)
		r.Get("/recent", rt.promptHandler.GetRecentPrompts)

		// Specific prompt operations
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", rt.promptHandler.GetPrompt)
			r.Put("/", rt.promptHandler.UpdatePrompt)
			r.Delete("/", rt.promptHandler.DeletePrompt)
		})
	})

	// Optimization endpoints (future features)
	r.Route("/optimize", func(r chi.Router) {
		r.Post("/", rt.promptHandler.OptimizePrompt)
		r.Post("/batch", rt.promptHandler.BatchOptimize)
	})

	// Selection endpoints (future features)
	r.Route("/select", func(r chi.Router) {
		r.Post("/", rt.promptHandler.SelectBestPrompt)
	})

	// Batch processing endpoints
	r.Route("/batch", func(r chi.Router) {
		r.Post("/generate", rt.promptHandler.BatchGenerate)
	})

	// Analytics endpoints
	r.Route("/analytics", func(r chi.Router) {
		r.Get("/stats", rt.promptHandler.GetUsageStats)
		r.Get("/metrics", rt.promptHandler.GetAnalyticsMetrics)
	})

	// Learning endpoints (if learning engine is available)
	if rt.deps.LearningEng != nil {
		r.Route("/learning", func(r chi.Router) {
			r.Get("/status", rt.promptHandler.GetLearningStatus)
			r.Post("/feedback", rt.promptHandler.SubmitFeedback)
		})
	}

	// Node activation endpoint
	r.Post("/node/activate", rt.promptHandler.ActivateNode)

	// Connection endpoints
	r.Route("/connection", func(r chi.Router) {
		r.Get("/input-parse", rt.promptHandler.GetInputParse)
		r.Get("/coagulatio-output", rt.promptHandler.GetCoagulatioOutput)
		r.Get("/solutio-coagulatio", rt.promptHandler.GetSolutioCoagulatio)
		r.Get("/prima-hub", rt.promptHandler.GetPrimaHub)
		r.Get("/input-prima", rt.promptHandler.GetInputPrima)
		r.Get("/hub-solutio", rt.promptHandler.GetHubSolutio)
		r.Get("/parse-prima", rt.promptHandler.GetParsePrima)
		r.Get("/input-extract", rt.promptHandler.GetInputExtract)
		r.Get("/extract-prima", rt.promptHandler.GetExtractPrima)
		r.Get("/coagulatio-finalize", rt.promptHandler.GetCoagulatioFinalize)
		r.Get("/hub-flow", rt.promptHandler.GetHubFlow)
		r.Get("/hub-refine", rt.promptHandler.GetHubRefine)
		r.Get("/coagulatio-validate", rt.promptHandler.GetCoagulatioValidate)
		r.Get("/refine-solutio", rt.promptHandler.GetRefineSolutio)
		r.Get("/flow-solutio", rt.promptHandler.GetFlowSolutio)
		r.Get("/validate-output", rt.promptHandler.GetValidateOutput)
		r.Get("/hub-judge", rt.promptHandler.GetHubJudge)
		r.Get("/hub-database", rt.promptHandler.GetHubDatabase)
		r.Get("/hub-optimize", rt.promptHandler.GetHubOptimize)
		r.Get("/prima-learning", rt.promptHandler.GetPrimaLearning)
		r.Get("/optimize-database", rt.promptHandler.GetOptimizeDatabase)
		r.Get("/judge-database", rt.promptHandler.GetJudgeDatabase)
		r.Get("/solutio-templates", rt.promptHandler.GetSolutioTemplates)
		r.Get("/finalize-output", rt.promptHandler.GetFinalizeOutput) // Add missing endpoint
	})

	// Additional missing endpoints
	r.Get("/activity-feed", rt.promptHandler.GetActivityFeed)
	r.Get("/nodes-status", rt.promptHandler.GetNodesStatus)
	r.Get("/connection-status", rt.promptHandler.GetConnectionStatus)
	r.Get("/flow-info", rt.promptHandler.GetFlowInfo)
	r.Get("/system-status", rt.promptHandler.GetSystemStatus)
}

// SystemHandler handles system-level endpoints
type SystemHandler struct {
	logger      *logrus.Logger
	metrics     *metrics.Metrics
	learningEng *learning.LearningEngine
	startTime   time.Time
}

// NewSystemHandler creates a new system handler
func NewSystemHandler(logger *logrus.Logger, metrics *metrics.Metrics, learningEng *learning.LearningEngine) *SystemHandler {
	return &SystemHandler{
		logger:      logger,
		metrics:     metrics,
		learningEng: learningEng,
		startTime:   time.Now(),
	}
}

// GetVersion handles GET /version
func (h *SystemHandler) GetVersion(w http.ResponseWriter, r *http.Request) {
	version := map[string]interface{}{
		"version": "1.0.0",
		"mode":    "http",
		"api":     "v1",
	}
	httputil.OK(w, version)
}

// GetStatus handles GET /api/v1/status
func (h *SystemHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"server":        "running",
		"protocol":      "http",
		"version":       "v1",
		"learning_mode": h.isLearningEnabled(),
		"uptime":        time.Since(h.startTime).String(),
	}
	httputil.OK(w, status)
}

// GetInfo handles GET /api/v1/info
func (h *SystemHandler) GetInfo(w http.ResponseWriter, r *http.Request) {
	info := map[string]interface{}{
		"name":        "Prompt Alchemy HTTP API",
		"version":     "v1",
		"description": "Alchemical prompt generation and optimization system",
		"endpoints": map[string]string{
			"generate":  "/api/v1/prompts/generate",
			"list":      "/api/v1/prompts",
			"search":    "/api/v1/prompts/search",
			"providers": "/api/v1/providers",
			"health":    "/health",
			"metrics":   "/metrics",
		},
		"features": []string{
			"alchemical_phases",
			"multi_provider",
			"semantic_search",
			"ranking",
			"learning",
		},
	}
	httputil.OK(w, info)
}

func (h *SystemHandler) isLearningEnabled() bool {
	// Check if learning engine is configured and enabled
	return h.learningEng != nil
}

// ProviderHandler handles provider-related endpoints
type ProviderHandler struct {
	registry *providers.Registry
	logger   *logrus.Logger
}

// NewProviderHandler creates a new provider handler
func NewProviderHandler(registry *providers.Registry, logger *logrus.Logger) *ProviderHandler {
	return &ProviderHandler{
		registry: registry,
		logger:   logger,
	}
}

// ListProviders handles GET /api/v1/providers
func (h *ProviderHandler) ListProviders(w http.ResponseWriter, r *http.Request) {
	providerList := h.registry.ListProviders()

	providers := make([]map[string]interface{}, 0, len(providerList))
	for _, name := range providerList {
		provider, _ := h.registry.Get(name)
		if provider != nil {
			providers = append(providers, map[string]interface{}{
				"name":                name,
				"available":           true,
				"supports_embeddings": provider.SupportsEmbeddings(),
				"models":              h.getProviderModels(name),
			})
		}
	}

	response := map[string]interface{}{
		"providers": providers,
		"count":     len(providers),
	}

	httputil.OK(w, response)
}

// GetProvider handles GET /api/v1/providers/{provider}
func (h *ProviderHandler) GetProvider(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")
	if providerName == "" {
		httputil.BadRequest(w, "Provider name is required")
		return
	}

	provider, _ := h.registry.Get(providerName)
	if provider == nil {
		httputil.NotFound(w, "Provider not found")
		return
	}

	response := map[string]interface{}{
		"name":                providerName,
		"available":           true,
		"supports_embeddings": provider.SupportsEmbeddings(),
		"models":              h.getProviderModels(providerName),
		"configuration":       map[string]interface{}{}, // Sensitive info omitted
	}

	httputil.OK(w, response)
}

// GetProviderModels handles GET /api/v1/providers/{provider}/models
func (h *ProviderHandler) GetProviderModels(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")
	if providerName == "" {
		httputil.BadRequest(w, "Provider name is required")
		return
	}

	provider, _ := h.registry.Get(providerName)
	if provider == nil {
		httputil.NotFound(w, "Provider not found")
		return
	}

	// Get available models for the provider
	models := h.getProviderModels(providerName)

	response := map[string]interface{}{
		"provider": providerName,
		"models":   models,
		"count":    len(models),
	}

	httputil.OK(w, response)
}

// getProviderModels returns the available models for a provider
func (h *ProviderHandler) getProviderModels(providerName string) []string {
	// Define known models for each provider
	switch providerName {
	case providers.ProviderOpenAI:
		return []string{"gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo", "text-embedding-ada-002"}
	case providers.ProviderAnthropic:
		return []string{"claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"}
	case providers.ProviderGoogle:
		return []string{"gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"}
	case providers.ProviderOllama:
		// For Ollama, we could potentially query the API, but for now return common models
		return []string{"llama3", "mistral", "codellama", "nomic-embed-text"}
	case providers.ProviderOpenRouter:
		// OpenRouter has many models, return some popular ones
		return []string{"anthropic/claude-3-opus", "openai/gpt-4-turbo", "google/gemini-pro"}
	case providers.ProviderGrok:
		return []string{"grok-1", "grok-2", "grok-4"}
	default:
		return []string{}
	}
}

// DefaultRouterConfig returns default router configuration
func DefaultRouterConfig() RouterConfig {
	return RouterConfig{
		EnableCORS:      true,
		CORSOrigins:     []string{"*"},
		EnableAuth:      false,
		APIKeys:         []string{},
		EnableRateLimit: true,
		RequestsPerMin:  60,
		Burst:           100,
	}
}
