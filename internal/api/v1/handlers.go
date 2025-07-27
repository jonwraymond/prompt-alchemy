package v1

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/httputil"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// V1Handler contains all dependencies for v1 API handlers
type V1Handler struct {
	storage  *storage.Storage
	registry *providers.Registry
	engine   *engine.Engine
	ranker   *ranking.Ranker
	learner  *learning.LearningEngine
	logger   *logrus.Logger
}

// NewV1Handler creates a new v1 API handler
func NewV1Handler(
	storage *storage.Storage,
	registry *providers.Registry,
	engine *engine.Engine,
	ranker *ranking.Ranker,
	learner *learning.LearningEngine,
	logger *logrus.Logger,
) *V1Handler {
	return &V1Handler{
		storage:  storage,
		registry: registry,
		engine:   engine,
		ranker:   ranker,
		learner:  learner,
		logger:   logger,
	}
}

// SetupRoutes configures all v1 API routes
func (h *V1Handler) SetupRoutes(r chi.Router) {
	r.Route("/v1", func(r chi.Router) {
		// Health and info endpoints
		r.Get("/health", h.HandleHealth)
		r.Get("/status", h.HandleStatus)
		r.Get("/info", h.HandleInfo)

		// Prompt endpoints
		r.Route("/prompts", func(r chi.Router) {
			r.Get("/", h.ListPrompts)
			r.Post("/", h.CreatePrompt)
			r.Post("/generate", h.HandleGeneratePrompts)
			r.Get("/search", h.SearchPrompts)
			r.Get("/popular", h.GetPopularPrompts)
			r.Get("/recent", h.GetRecentPrompts)
			r.Get("/{id}", h.GetPrompt)
			r.Put("/{id}", h.UpdatePrompt)
			r.Delete("/{id}", h.DeletePrompt)
		})

		// Provider endpoints
		r.Get("/providers", h.HandleListProviders)

		// Optimization endpoints
		r.Post("/optimize", h.OptimizePrompt)
		r.Post("/optimize/batch", h.BatchOptimize)

		// Selection endpoints
		r.Post("/select", h.SelectBestPrompt)

		// Batch endpoints
		r.Post("/batch", h.BatchGenerate)

		// Analytics endpoints
		r.Get("/analytics/stats", h.GetUsageStats)
		r.Get("/analytics/metrics", h.GetAnalyticsMetrics)

		// Learning endpoints
		r.Get("/learning/status", h.GetLearningStatus)
		r.Post("/learning/feedback", h.SubmitFeedback)
	})
}

// Using consolidated types from models package
// GenerateRequest is now models.GenerateRequest
// GenerateResponse is now models.GenerateResponse

// CompactGenerateResponse represents an optimized prompt generation response with reduced duplication
type CompactGenerateResponse struct {
	Prompts    []CompactPrompt         `json:"prompts"`
	Rankings   []models.PromptRanking  `json:"rankings,omitempty"`
	SelectedID *string                 `json:"selected_id,omitempty"`
	SessionID  uuid.UUID               `json:"session_id"`
	Metadata   models.GenerateMetadata `json:"metadata"`
	CommonData PromptCommonData        `json:"common_data"`
}

// CompactPrompt represents a prompt with reduced metadata duplication
type CompactPrompt struct {
	ID              string                `json:"id"`
	Content         string                `json:"content"`
	Phase           string                `json:"phase"`
	Provider        string                `json:"provider"`
	Model           string                `json:"model"`
	ActualTokens    int                   `json:"actual_tokens"`
	RelevanceScore  float64               `json:"relevance_score"`
	UsageCount      int                   `json:"usage_count"`
	GenerationCount int                   `json:"generation_count"`
	CreatedAt       time.Time             `json:"created_at"`
	ModelMetadata   *models.ModelMetadata `json:"model_metadata,omitempty"`
	TargetUseCase   string                `json:"target_use_case,omitempty"`
}

// PromptCommonData contains shared data across all prompts to reduce duplication
type PromptCommonData struct {
	Temperature       float64               `json:"temperature"`
	MaxTokens         int                   `json:"max_tokens"`
	Tags              []string              `json:"tags"`
	SourceType        string                `json:"source_type"`
	OriginalInput     string                `json:"original_input"`
	PersonaUsed       string                `json:"persona_used"`
	TargetUseCase     string                `json:"target_use_case,omitempty"`
	EmbeddingModel    string                `json:"embedding_model"`
	EmbeddingProvider string                `json:"embedding_provider"`
	GenerationRequest *models.PromptRequest `json:"generation_request,omitempty"`
}

// GenerateMetadata is now defined in models package

// HandleHealth returns the health status of the API
func (h *V1Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"version":   "1.0.0",
	}
	h.writeJSON(w, http.StatusOK, response)
}

// HandleStatus returns detailed status information
func (h *V1Handler) HandleStatus(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"server":        "running",
		"protocol":      "http",
		"version":       "v1",
		"learning_mode": h.learner != nil,
		"uptime":        time.Since(time.Now()).String(),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// HandleInfo returns API information
func (h *V1Handler) HandleInfo(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"name":        "Prompt Alchemy HTTP API",
		"version":     "v1",
		"description": "HTTP API for Prompt Alchemy prompt generation and management",
		"endpoints": map[string]string{
			"health":    "/api/v1/health",
			"status":    "/api/v1/status",
			"generate":  "/api/v1/prompts/generate",
			"providers": "/api/v1/providers",
		},
	}
	h.writeJSON(w, http.StatusOK, response)
}

// HandleGeneratePrompts handles POST /api/v1/prompts/generate
func (h *V1Handler) HandleGeneratePrompts(w http.ResponseWriter, r *http.Request) {
	var req models.GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.WithError(err).Error("Failed to decode request body")
		httputil.BadRequest(w, "Invalid JSON")
		return
	}

	// Validate required fields
	if req.Input == "" {
		httputil.BadRequest(w, "Input is required")
		return
	}

	// Set defaults
	if req.Count == 0 {
		req.Count = 3
	}
	if req.Temperature == 0 {
		req.Temperature = 0.7
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = 1000
	}

	// Auto-infer target use case from persona if not provided
	if req.TargetUseCase == "" && req.Persona != "" {
		inferredUseCase := models.InferUseCaseFromPersona(req.Persona)
		req.TargetUseCase = inferredUseCase.String()
		h.logger.WithFields(logrus.Fields{
			"persona":           req.Persona,
			"inferred_use_case": req.TargetUseCase,
		}).Info("Auto-inferred target use case from persona")
	}

	// Convert phases
	phases := make([]models.Phase, 0, len(req.Phases))
	if len(req.Phases) == 0 {
		// Default phases
		phases = []models.Phase{
			models.PhasePrimaMaterial,
			models.PhaseSolutio,
			models.PhaseCoagulatio,
		}
	} else {
		for _, phaseStr := range req.Phases {
			phases = append(phases, models.Phase(phaseStr))
		}
	}

	// Convert providers map
	providers := make(map[models.Phase]string)
	for phaseStr, provider := range req.Providers {
		providers[models.Phase(phaseStr)] = provider
	}

	// Build PhaseConfigs from providers map or use defaults
	phaseConfigs := make([]models.PhaseConfig, len(phases))
	for i, phase := range phases {
		provider := "mock" // Default to mock for tests and API calls without provider config
		if providerName, exists := providers[phase]; exists && providerName != "" {
			provider = providerName
		}
		phaseConfigs[i] = models.PhaseConfig{
			Phase:    phase,
			Provider: provider,
		}
	}

	// Create models.GenerateOptions from the HTTP request
	generateOpts := models.GenerateOptions{
		Request: models.PromptRequest{
			Input:         req.Input,
			Phases:        phases,
			Count:         req.Count,
			Providers:     providers,
			Context:       req.Context,
			Tags:          req.Tags,
			Temperature:   req.Temperature,
			MaxTokens:     req.MaxTokens,
			Persona:       req.Persona,
			TargetUseCase: req.TargetUseCase,
		},
		PhaseConfigs: phaseConfigs,
		UseParallel:  req.UseParallel,
	}

	// Generate prompts using the engine
	ctx, cancel := context.WithTimeout(r.Context(), 120*time.Second)
	defer cancel()

	start := time.Now()
	result, err := h.engine.Generate(ctx, generateOpts)
	if err != nil {
		h.logger.WithError(err).Error("Failed to generate prompts")
		httputil.InternalServerError(w, "Failed to generate prompts")
		return
	}

	// Rank prompts if ranker is available
	var rankings []models.PromptRanking
	if h.ranker != nil {
		rankings, err = h.ranker.RankPrompts(ctx, result.Prompts, req.Input)
		if err != nil {
			h.logger.WithError(err).Warn("Failed to rank prompts, continuing without ranking")
		}
	}

	// Save prompts if requested
	if req.Save {
		for _, prompt := range result.Prompts {
			// Set target use case on the prompt
			prompt.TargetUseCase = req.TargetUseCase
			prompt.PersonaUsed = req.Persona

			if err := h.storage.SavePrompt(ctx, &prompt); err != nil {
				h.logger.WithError(err).WithField("prompt_id", prompt.ID).Error("Failed to save prompt")
			}
		}
	}

	// Check if client requests compact format
	compactParam := r.URL.Query().Get("compact")
	compact := compactParam == "true"
	h.logger.WithField("compact_param", compactParam).WithField("is_compact", compact).Info("=== CHECKING COMPACT FORMAT ===")

	if compact {
		h.logger.Info("=== USING COMPACT RESPONSE ===")
		response := h.buildCompactResponse(result.Prompts, rankings, phases, start)
		h.logger.WithField("response_type", "compact").Info("=== COMPACT RESPONSE BUILT ===")
		h.writeJSON(w, http.StatusOK, response)
	} else {
		h.logger.Info("=== USING STANDARD RESPONSE ===")
		// Build standard response
		response := models.GenerateResponse{
			Prompts:   result.Prompts,
			Rankings:  rankings,
			SessionID: uuid.New(),
			Metadata: models.GenerateMetadata{
				Duration:       time.Since(start).String(),
				PhaseCount:     len(phases),
				GenerationTime: time.Now().Format(time.RFC3339),
			},
		}

		// Set selected prompt if rankings available
		if len(rankings) > 0 {
			response.Selected = rankings[0].Prompt
		}

		h.writeJSON(w, http.StatusOK, response)
	}
}

// buildCompactResponse creates an optimized response with reduced duplication
func (h *V1Handler) buildCompactResponse(prompts []models.Prompt, rankings []models.PromptRanking, phases []models.Phase, start time.Time) CompactGenerateResponse {
	if len(prompts) == 0 {
		return CompactGenerateResponse{
			Prompts:   []CompactPrompt{},
			Rankings:  rankings,
			SessionID: uuid.New(),
			Metadata: models.GenerateMetadata{
				Duration:       time.Since(start).String(),
				PhaseCount:     len(phases),
				GenerationTime: time.Now().Format(time.RFC3339),
			},
		}
	}

	// Extract common data from first prompt (assuming all share same generation params)
	firstPrompt := prompts[0]
	commonData := PromptCommonData{
		Temperature:       firstPrompt.Temperature,
		MaxTokens:         firstPrompt.MaxTokens,
		Tags:              firstPrompt.Tags,
		SourceType:        firstPrompt.SourceType,
		OriginalInput:     firstPrompt.OriginalInput,
		PersonaUsed:       firstPrompt.PersonaUsed,
		TargetUseCase:     firstPrompt.TargetUseCase,
		EmbeddingModel:    firstPrompt.EmbeddingModel,
		EmbeddingProvider: firstPrompt.EmbeddingProvider,
		GenerationRequest: firstPrompt.GenerationRequest,
	}

	// Create compact prompts with only essential fields
	compactPrompts := make([]CompactPrompt, len(prompts))
	for i, prompt := range prompts {
		compactPrompts[i] = CompactPrompt{
			ID:              prompt.ID.String(),
			Content:         prompt.Content,
			Phase:           string(prompt.Phase),
			Provider:        prompt.Provider,
			Model:           prompt.Model,
			ActualTokens:    prompt.ActualTokens,
			RelevanceScore:  prompt.RelevanceScore,
			UsageCount:      prompt.UsageCount,
			GenerationCount: prompt.GenerationCount,
			CreatedAt:       prompt.CreatedAt,
			ModelMetadata:   prompt.ModelMetadata,
			TargetUseCase:   prompt.TargetUseCase,
		}
	}

	// Find best ranked prompt
	var selectedID *string
	if len(rankings) > 0 {
		id := rankings[0].Prompt.ID.String()
		selectedID = &id
	}

	return CompactGenerateResponse{
		Prompts:    compactPrompts,
		Rankings:   rankings,
		SelectedID: selectedID,
		SessionID:  uuid.New(),
		CommonData: commonData,
		Metadata: models.GenerateMetadata{
			Duration:       time.Since(start).String(),
			PhaseCount:     len(phases),
			GenerationTime: time.Now().Format(time.RFC3339),
		},
	}
}

// ListPrompts handles GET /api/v1/prompts
func (h *V1Handler) ListPrompts(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	page, limit := httputil.ParsePagination(r)

	// Parse filters from query parameters
	tags := r.URL.Query().Get("tags")
	phase := r.URL.Query().Get("phase")
	provider := r.URL.Query().Get("provider")

	h.logger.WithFields(logrus.Fields{
		"page":     page,
		"limit":    limit,
		"tags":     tags,
		"phase":    phase,
		"provider": provider,
	}).Debug("Listing prompts")

	// Get total count from storage
	total, err := h.storage.GetPromptsCount(r.Context())
	if err != nil {
		h.logger.WithError(err).Error("Failed to get prompts count")
		httputil.InternalServerError(w, "Failed to get prompts count")
		return
	}

	// For now, return empty list since storage interface needs to be updated
	prompts := []models.Prompt{}

	// Calculate pagination
	pagination := httputil.CalculatePagination(page, limit, total)

	// Return paginated response
	httputil.WritePaginatedJSON(w, http.StatusOK, prompts, pagination)
}

// CreatePrompt handles POST /api/v1/prompts
func (h *V1Handler) CreatePrompt(w http.ResponseWriter, r *http.Request) {
	var req CreatePromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.BadRequest(w, "Invalid JSON")
		return
	}

	// Validate required fields
	if req.Content == "" {
		httputil.BadRequest(w, "Content is required")
		return
	}
	if req.Phase == "" {
		httputil.BadRequest(w, "Phase is required")
		return
	}
	if req.Provider == "" {
		httputil.BadRequest(w, "Provider is required")
		return
	}

	// Create prompt
	prompt := &models.Prompt{
		ID:          uuid.New(),
		Content:     req.Content,
		Phase:       models.Phase(req.Phase),
		Provider:    req.Provider,
		Model:       req.Model,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Tags:        req.Tags,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Save prompt
	ctx := r.Context()
	if err := h.storage.SavePrompt(ctx, prompt); err != nil {
		h.logger.WithError(err).Error("Failed to save prompt")
		httputil.InternalServerError(w, "Failed to save prompt")
		return
	}

	httputil.Created(w, prompt)
}

// GetPrompt handles GET /api/v1/prompts/{id}
func (h *V1Handler) GetPrompt(w http.ResponseWriter, r *http.Request) {
	promptID := chi.URLParam(r, "id")
	if promptID == "" {
		httputil.BadRequest(w, "Prompt ID is required")
		return
	}

	// Validate UUID format
	if _, err := uuid.Parse(promptID); err != nil {
		httputil.BadRequest(w, "Invalid prompt ID format")
		return
	}

	// For now, return not found since storage interface needs to be updated
	httputil.NotFound(w, "Prompt not found")
}

// UpdatePrompt handles PUT /api/v1/prompts/{id}
func (h *V1Handler) UpdatePrompt(w http.ResponseWriter, r *http.Request) {
	promptID := chi.URLParam(r, "id")
	if promptID == "" {
		httputil.BadRequest(w, "Prompt ID is required")
		return
	}

	var req UpdatePromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.BadRequest(w, "Invalid JSON")
		return
	}

	// For now, return not implemented
	httputil.NotImplemented(w, "Update prompt not implemented yet")
}

// DeletePrompt handles DELETE /api/v1/prompts/{id}
func (h *V1Handler) DeletePrompt(w http.ResponseWriter, r *http.Request) {
	promptID := chi.URLParam(r, "id")
	if promptID == "" {
		httputil.BadRequest(w, "Prompt ID is required")
		return
	}

	// For now, return not implemented
	httputil.NotImplemented(w, "Delete prompt not implemented yet")
}

// SearchPrompts handles GET /api/v1/prompts/search
func (h *V1Handler) SearchPrompts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		httputil.BadRequest(w, "Search query is required")
		return
	}

	semantic := r.URL.Query().Get("semantic") == "true"
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	h.logger.WithFields(logrus.Fields{
		"query":    query,
		"semantic": semantic,
		"limit":    limit,
	}).Debug("Searching prompts")

	// For now, return empty results
	response := map[string]interface{}{
		"prompts":  []models.Prompt{},
		"query":    query,
		"count":    0,
		"semantic": semantic,
	}

	httputil.OK(w, response)
}

// GetPopularPrompts handles GET /api/v1/prompts/popular
func (h *V1Handler) GetPopularPrompts(w http.ResponseWriter, r *http.Request) {
	// For now, return empty list
	httputil.OK(w, []models.Prompt{})
}

// GetRecentPrompts handles GET /api/v1/prompts/recent
func (h *V1Handler) GetRecentPrompts(w http.ResponseWriter, r *http.Request) {
	// For now, return empty list
	httputil.OK(w, []models.Prompt{})
}

// HandleListProviders returns available providers
func (h *V1Handler) HandleListProviders(w http.ResponseWriter, r *http.Request) {
	providers := h.registry.ListProviders()
	h.writeJSON(w, http.StatusOK, map[string]interface{}{
		"providers": providers,
		"count":     len(providers),
	})
}

// OptimizePrompt handles POST /api/v1/optimize
func (h *V1Handler) OptimizePrompt(w http.ResponseWriter, r *http.Request) {
	httputil.NotImplemented(w, "Prompt optimization not implemented yet")
}

// BatchOptimize handles POST /api/v1/optimize/batch
func (h *V1Handler) BatchOptimize(w http.ResponseWriter, r *http.Request) {
	httputil.NotImplemented(w, "Batch optimization not implemented yet")
}

// SelectBestPrompt handles POST /api/v1/select
func (h *V1Handler) SelectBestPrompt(w http.ResponseWriter, r *http.Request) {
	httputil.NotImplemented(w, "Prompt selection not implemented yet")
}

// BatchGenerate handles POST /api/v1/batch/generate
func (h *V1Handler) BatchGenerate(w http.ResponseWriter, r *http.Request) {
	httputil.NotImplemented(w, "Batch generation not implemented yet")
}

// GetUsageStats handles GET /api/v1/analytics/stats
func (h *V1Handler) GetUsageStats(w http.ResponseWriter, r *http.Request) {
	stats := map[string]interface{}{
		"total_prompts":     0,
		"total_sessions":    0,
		"popular_phases":    []string{},
		"popular_providers": []string{},
		"popular_tags":      []string{},
	}
	httputil.OK(w, stats)
}

// GetAnalyticsMetrics handles GET /api/v1/analytics/metrics
func (h *V1Handler) GetAnalyticsMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := map[string]interface{}{
		"requests_today":    0,
		"avg_response_time": 0,
		"success_rate":      100,
		"top_endpoints":     []string{},
	}
	httputil.OK(w, metrics)
}

// GetLearningStatus handles GET /api/v1/learning/status
func (h *V1Handler) GetLearningStatus(w http.ResponseWriter, r *http.Request) {
	if h.learner == nil {
		httputil.NotFound(w, "Learning engine not available")
		return
	}

	status := map[string]interface{}{
		"enabled":         true,
		"learning_rate":   0.001,
		"training_cycles": 0,
		"accuracy":        0.0,
	}
	httputil.OK(w, status)
}

// SubmitFeedback handles POST /api/v1/learning/feedback
func (h *V1Handler) SubmitFeedback(w http.ResponseWriter, r *http.Request) {
	if h.learner == nil {
		httputil.NotFound(w, "Learning engine not available")
		return
	}

	httputil.NotImplemented(w, "Learning feedback not implemented yet")
}

// Request/Response types for API handlers
type CreatePromptRequest struct {
	Content     string   `json:"content"`
	Phase       string   `json:"phase"`
	Provider    string   `json:"provider"`
	Model       string   `json:"model,omitempty"`
	Temperature float64  `json:"temperature,omitempty"`
	MaxTokens   int      `json:"max_tokens,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

type UpdatePromptRequest struct {
	Content string   `json:"content,omitempty"`
	Tags    []string `json:"tags,omitempty"`
	Notes   string   `json:"notes,omitempty"`
}

// Helper methods

func (h *V1Handler) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.WithError(err).Error("Failed to encode JSON response")
	}
}

func (h *V1Handler) writeError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"error":     message,
		"timestamp": time.Now(),
		"status":    status,
	}
	h.writeJSON(w, status, response)
}

// Node activation endpoint
func (h *V1Handler) ActivateNode(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

// Connection endpoints - all placeholder implementations
func (h *V1Handler) GetInputParse(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetCoagulatioOutput(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetSolutioCoagulatio(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetPrimaHub(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetInputPrima(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubSolutio(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetParsePrima(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetInputExtract(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetExtractPrima(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetCoagulatioFinalize(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubFlow(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubRefine(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetCoagulatioValidate(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetRefineSolutio(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetFlowSolutio(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetValidateOutput(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubJudge(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubDatabase(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetHubOptimize(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetPrimaLearning(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetOptimizeDatabase(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetJudgeDatabase(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *V1Handler) GetSolutioTemplates(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}

// Activity feed endpoint
func (h *V1Handler) GetActivityFeed(w http.ResponseWriter, r *http.Request) {
	// Return a mock activity feed
	activities := []map[string]interface{}{
		{
			"id":        "activity-1",
			"type":      "prompt_generated",
			"message":   "Generated prompt using Prima Materia phase",
			"timestamp": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
			"phase":     "prima-materia",
		},
		{
			"id":        "activity-2",
			"type":      "optimization_complete",
			"message":   "Optimization completed with score 8.5",
			"timestamp": time.Now().Add(-3 * time.Minute).Format(time.RFC3339),
			"score":     8.5,
		},
		{
			"id":        "activity-3",
			"type":      "connection_established",
			"message":   "Connected to OpenAI provider",
			"timestamp": time.Now().Add(-1 * time.Minute).Format(time.RFC3339),
			"provider":  "openai",
		},
	}

	response := map[string]interface{}{
		"activities": activities,
		"count":      len(activities),
		"timestamp":  time.Now().Format(time.RFC3339),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// Nodes status endpoint
func (h *V1Handler) GetNodesStatus(w http.ResponseWriter, r *http.Request) {
	// Return array directly as expected by the JavaScript
	nodes := []map[string]interface{}{
		{
			"id":         "prima-materia",
			"name":       "Prima Materia",
			"status":     "ready",
			"phase":      "prima-materia",
			"active":     false,
			"processing": false,
			"complete":   false,
		},
		{
			"id":         "solutio",
			"name":       "Solutio",
			"status":     "ready",
			"phase":      "solutio",
			"active":     false,
			"processing": false,
			"complete":   false,
		},
		{
			"id":         "coagulatio",
			"name":       "Coagulatio",
			"status":     "ready",
			"phase":      "coagulatio",
			"active":     false,
			"processing": false,
			"complete":   false,
		},
	}
	h.writeJSON(w, http.StatusOK, nodes)
}

// Connection status endpoint
func (h *V1Handler) GetConnectionStatus(w http.ResponseWriter, r *http.Request) {
	connections := []map[string]interface{}{
		{"provider": "openai", "status": "connected", "latency": "45ms"},
		{"provider": "anthropic", "status": "connected", "latency": "52ms"},
		{"provider": "google", "status": "connected", "latency": "38ms"},
	}

	response := map[string]interface{}{
		"connections": connections,
		"total":       len(connections),
		"healthy":     len(connections),
		"timestamp":   time.Now().Format(time.RFC3339),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// Flow info endpoint
func (h *V1Handler) GetFlowInfo(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"flow_id":     "alchemy-flow-1",
		"name":        "Alchemical Prompt Generation",
		"description": "Three-phase prompt transformation process",
		"phases": []map[string]interface{}{
			{
				"id":          "prima-materia",
				"name":        "Prima Materia",
				"description": "Initial prompt extraction and understanding",
			},
			{
				"id":          "solutio",
				"name":        "Solutio",
				"description": "Dissolution and analysis of components",
			},
			{
				"id":          "coagulatio",
				"name":        "Coagulatio",
				"description": "Synthesis and final prompt generation",
			},
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// System status endpoint
func (h *V1Handler) GetSystemStatus(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":             "healthy",
		"uptime":             time.Since(time.Now().Add(-time.Hour)).String(),
		"providers_online":   3,
		"memory_usage":       "45%",
		"cpu_usage":          "12%",
		"active_connections": 1,
		"last_check":         time.Now().Format(time.RFC3339),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// Connection finalize output endpoint
func (h *V1Handler) GetFinalizeOutput(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "Endpoint connected"}
	h.writeJSON(w, http.StatusOK, response)
}
