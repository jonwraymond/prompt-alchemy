package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/selection"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// API request/response models for generate endpoint
type GenerateRequest struct {
	Input       string            `json:"input" binding:"required"`
	Phases      []string          `json:"phases,omitempty"`
	Count       int               `json:"count,omitempty"`
	Providers   map[string]string `json:"providers,omitempty"`
	Temperature float64           `json:"temperature,omitempty"`
	MaxTokens   int               `json:"max_tokens,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
	Context     []string          `json:"context,omitempty"`
	Persona     string            `json:"persona,omitempty"`
	TargetModel string            `json:"target_model,omitempty"`
	UseParallel bool              `json:"use_parallel,omitempty"`
	Save        bool              `json:"save,omitempty"`
}

type GenerateResponse struct {
	Prompts   []models.Prompt        `json:"prompts"`
	Rankings  []models.PromptRanking `json:"rankings,omitempty"`
	Selected  *models.Prompt         `json:"selected,omitempty"`
	SessionID uuid.UUID              `json:"session_id"`
	Metadata  GenerateMetadata       `json:"metadata"`
}

type GenerateMetadata struct {
	TotalGenerated int                    `json:"total_generated"`
	PhasesTiming   map[string]int         `json:"phases_timing_ms,omitempty"`
	ProvidersUsed  map[string]string      `json:"providers_used"`
	GeneratedAt    time.Time              `json:"generated_at"`
	RequestOptions GenerateRequestSummary `json:"request_options"`
}

type GenerateRequestSummary struct {
	Phases      []string `json:"phases"`
	Count       int      `json:"count"`
	Persona     string   `json:"persona,omitempty"`
	TargetModel string   `json:"target_model,omitempty"`
}

// AI Selection API models
type AISelectRequest struct {
	PromptIDs            []string `json:"prompt_ids" binding:"required"`
	TaskDescription      string   `json:"task_description,omitempty"`
	TargetAudience       string   `json:"target_audience,omitempty"`
	RequiredTone         string   `json:"required_tone,omitempty"`
	PreferredLength      string   `json:"preferred_length,omitempty"`
	SpecificRequirements []string `json:"specific_requirements,omitempty"`
	Persona              string   `json:"persona,omitempty"`
	ModelFamily          string   `json:"model_family,omitempty"`
	SelectionProvider    string   `json:"selection_provider,omitempty"`
}

type AISelectResponse struct {
	SelectedPrompt     *models.Prompt               `json:"selected_prompt"`
	SelectionReason    string                       `json:"selection_reason"`
	ConfidenceScore    float64                      `json:"confidence_score"`
	AlternativeRanking []selection.PromptEvaluation `json:"alternative_ranking"`
	ProcessingDuration time.Duration                `json:"processing_duration"`
	Metadata           AISelectMetadata             `json:"metadata"`
}

type AISelectMetadata struct {
	TaskDescription   string    `json:"task_description"`
	TargetAudience    string    `json:"target_audience"`
	RequiredTone      string    `json:"required_tone"`
	PreferredLength   string    `json:"preferred_length"`
	Persona           string    `json:"persona"`
	ModelFamily       string    `json:"model_family"`
	SelectionProvider string    `json:"selection_provider"`
	EvaluatedAt       time.Time `json:"evaluated_at"`
}

// Search API models
type SearchPromptsResponse struct {
	Prompts      []models.Prompt `json:"prompts"`
	TotalFound   int             `json:"total_found"`
	SearchType   string          `json:"search_type"`
	Query        string          `json:"query,omitempty"`
	Similarities []float64       `json:"similarities,omitempty"`
	Metadata     SearchMetadata  `json:"metadata"`
}

type SearchMetadata struct {
	Phase         string     `json:"phase,omitempty"`
	Provider      string     `json:"provider,omitempty"`
	Tags          []string   `json:"tags,omitempty"`
	Since         *time.Time `json:"since,omitempty"`
	Limit         int        `json:"limit"`
	Semantic      bool       `json:"semantic"`
	MinSimilarity float64    `json:"min_similarity,omitempty"`
	SearchedAt    time.Time  `json:"searched_at"`
}

// Provider API models
type ProviderInfo struct {
	Name               string   `json:"name"`
	Available          bool     `json:"available"`
	SupportsEmbeddings bool     `json:"supports_embeddings"`
	Models             []string `json:"models,omitempty"`
	Capabilities       []string `json:"capabilities"`
}

type ProvidersResponse struct {
	Providers          []ProviderInfo `json:"providers"`
	TotalProviders     int            `json:"total_providers"`
	AvailableProviders int            `json:"available_providers"`
	EmbeddingProviders int            `json:"embedding_providers"`
	RetrievedAt        time.Time      `json:"retrieved_at"`
}

// Config holds HTTP server configuration
type Config struct {
	Host            string
	Port            int
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
	EnableCORS      bool
	CORSOrigins     []string
	EnableAuth      bool
	APIKeys         []string
}

// SimpleServer is a basic HTTP server for now
type SimpleServer struct {
	router   chi.Router
	store    *storage.Storage
	registry *providers.Registry
	engine   *engine.Engine
	ranker   *ranking.Ranker
	learner  *learning.LearningEngine
	logger   *logrus.Logger
	config   *Config
}

// NewSimpleServer creates a new simple HTTP server instance
func NewSimpleServer(
	store *storage.Storage,
	registry *providers.Registry,
	engine *engine.Engine,
	ranker *ranking.Ranker,
	learner *learning.LearningEngine,
	logger *logrus.Logger,
) *SimpleServer {
	// Use basic config for simple server with configurable port
	port := 8080
	if p := viper.GetInt("http.port"); p > 0 {
		port = p
	}
	host := "0.0.0.0"
	if h := viper.GetString("http.host"); h != "" {
		host = h
	}

	config := &Config{
		Host:            host,
		Port:            port,
		ReadTimeout:     30 * time.Second,
		WriteTimeout:    30 * time.Second,
		IdleTimeout:     120 * time.Second,
		ShutdownTimeout: 10 * time.Second,
		EnableCORS:      true,
		CORSOrigins:     []string{"*"},
		EnableAuth:      false,
	}

	s := &SimpleServer{
		store:    store,
		registry: registry,
		engine:   engine,
		ranker:   ranker,
		learner:  learner,
		logger:   logger,
		config:   config,
	}

	s.setupRouter()
	return s
}

// setupRouter configures basic routes
func (s *SimpleServer) setupRouter() {
	r := chi.NewRouter()

	// Basic middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS
	if s.config.EnableCORS {
		r.Use(cors.Handler(cors.Options{
			AllowedOrigins:   s.config.CORSOrigins,
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		}))
	}

	// Health check
	r.Get("/health", s.handleHealth)
	r.Get("/version", s.handleVersion)

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/status", s.handleStatus)
		r.Get("/info", s.handleInfo)

		// Prompt CRUD endpoints
		r.Route("/prompts", func(r chi.Router) {
			r.Get("/", s.handleListPrompts)
			r.Post("/", s.handleCreatePrompt)
			r.Post("/generate", s.handleGeneratePrompts)
			r.Post("/select", s.handleAISelectPrompt)
			r.Get("/search", s.handleSearchPrompts)
			r.Get("/{id}", s.handleGetPrompt)
			r.Put("/{id}", s.handleUpdatePrompt)
			r.Delete("/{id}", s.handleDeletePrompt)
		})

		// TODO: Add more endpoints
		r.Get("/providers", s.handleListProviders)
	})

	s.router = r
}

// Start starts the HTTP server
func (s *SimpleServer) Start(ctx context.Context) error {
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", s.config.Host, s.config.Port),
		Handler:      s.router,
		ReadTimeout:  s.config.ReadTimeout,
		WriteTimeout: s.config.WriteTimeout,
		IdleTimeout:  s.config.IdleTimeout,
	}

	// Start server in goroutine
	go func() {
		s.logger.WithFields(logrus.Fields{
			"host": s.config.Host,
			"port": s.config.Port,
		}).Info("Starting HTTP server")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.WithError(err).Fatal("Failed to start HTTP server")
		}
	}()

	// Wait for interrupt signal
	<-ctx.Done()

	// Shutdown gracefully
	shutdownCtx, cancel := context.WithTimeout(context.Background(), s.config.ShutdownTimeout)
	defer cancel()

	s.logger.Info("Shutting down HTTP server")
	return srv.Shutdown(shutdownCtx)
}

// Basic handlers
func (s *SimpleServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"version":   "1.0.0",
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleVersion(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"version": "1.0.0",
		"mode":    "http",
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"server":        "running",
		"protocol":      "http",
		"learning_mode": s.learner != nil,
		"uptime":        time.Since(time.Now()).String(),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleInfo(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"name":        "Prompt Alchemy HTTP API",
		"version":     "1.0.0",
		"description": "HTTP API for Prompt Alchemy prompt generation and management",
		"endpoints": map[string]string{
			"health":  "/health",
			"version": "/version",
			"status":  "/api/v1/status",
			"info":    "/api/v1/info",
		},
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleNotImplemented(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"error":   "Not implemented yet",
		"message": "This endpoint is under development",
		"path":    r.URL.Path,
		"method":  r.Method,
	}
	s.writeJSON(w, http.StatusNotImplemented, response)
}

// CRUD handlers for prompts
func (s *SimpleServer) handleListPrompts(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 20 // default
	offset := 0 // default

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	prompts, err := s.store.ListPrompts(limit, offset)
	if err != nil {
		s.logger.WithError(err).Error("Failed to list prompts")
		s.writeError(w, http.StatusInternalServerError, "Failed to list prompts")
		return
	}

	response := map[string]interface{}{
		"prompts": prompts,
		"limit":   limit,
		"offset":  offset,
		"count":   len(prompts),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleCreatePrompt(w http.ResponseWriter, r *http.Request) {
	var prompt models.Prompt
	if err := json.NewDecoder(r.Body).Decode(&prompt); err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Set required fields
	prompt.ID = uuid.New()
	prompt.CreatedAt = time.Now()
	prompt.UpdatedAt = time.Now()
	prompt.SessionID = uuid.New()

	// Set defaults if not provided
	if prompt.Phase == "" {
		prompt.Phase = models.PhasePrimaMaterial
	}
	if prompt.Provider == "" {
		prompt.Provider = "unknown"
	}
	if prompt.Model == "" {
		prompt.Model = "unknown"
	}
	if prompt.Tags == nil {
		prompt.Tags = []string{}
	}

	if err := s.store.SavePrompt(&prompt); err != nil {
		s.logger.WithError(err).Error("Failed to save prompt")
		s.writeError(w, http.StatusInternalServerError, "Failed to save prompt")
		return
	}

	s.writeJSON(w, http.StatusCreated, prompt)
}

func (s *SimpleServer) handleGetPrompt(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid prompt ID")
		return
	}

	prompt, err := s.store.GetPrompt(id)
	if err != nil {
		if err.Error() == "prompt not found" {
			s.writeError(w, http.StatusNotFound, "Prompt not found")
		} else {
			s.logger.WithError(err).Error("Failed to get prompt")
			s.writeError(w, http.StatusInternalServerError, "Failed to get prompt")
		}
		return
	}

	s.writeJSON(w, http.StatusOK, prompt)
}

func (s *SimpleServer) handleUpdatePrompt(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid prompt ID")
		return
	}

	// Check if prompt exists
	existingPrompt, err := s.store.GetPrompt(id)
	if err != nil {
		if err.Error() == "prompt not found" {
			s.writeError(w, http.StatusNotFound, "Prompt not found")
		} else {
			s.logger.WithError(err).Error("Failed to get prompt")
			s.writeError(w, http.StatusInternalServerError, "Failed to get prompt")
		}
		return
	}

	var updatedPrompt models.Prompt
	if err := json.NewDecoder(r.Body).Decode(&updatedPrompt); err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Preserve important fields
	updatedPrompt.ID = existingPrompt.ID
	updatedPrompt.CreatedAt = existingPrompt.CreatedAt
	updatedPrompt.UpdatedAt = time.Now()
	updatedPrompt.SessionID = existingPrompt.SessionID

	if err := s.store.UpdatePrompt(&updatedPrompt); err != nil {
		s.logger.WithError(err).Error("Failed to update prompt")
		s.writeError(w, http.StatusInternalServerError, "Failed to update prompt")
		return
	}

	s.writeJSON(w, http.StatusOK, updatedPrompt)
}

func (s *SimpleServer) handleDeletePrompt(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid prompt ID")
		return
	}

	// Check if prompt exists
	if _, err := s.store.GetPrompt(id); err != nil {
		if err.Error() == "prompt not found" {
			s.writeError(w, http.StatusNotFound, "Prompt not found")
		} else {
			s.logger.WithError(err).Error("Failed to get prompt")
			s.writeError(w, http.StatusInternalServerError, "Failed to get prompt")
		}
		return
	}

	if err := s.store.DeletePrompt(id); err != nil {
		s.logger.WithError(err).Error("Failed to delete prompt")
		s.writeError(w, http.StatusInternalServerError, "Failed to delete prompt")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *SimpleServer) handleGeneratePrompts(w http.ResponseWriter, r *http.Request) {
	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate required fields
	if req.Input == "" {
		s.writeError(w, http.StatusBadRequest, "Input is required")
		return
	}

	// Set defaults
	if req.Count <= 0 {
		req.Count = 3
	}
	if req.Temperature == 0 {
		req.Temperature = 0.7
	}
	if req.MaxTokens <= 0 {
		req.MaxTokens = 2000
	}
	if req.Persona == "" {
		req.Persona = "code"
	}
	if len(req.Phases) == 0 {
		req.Phases = []string{"prima-materia", "solutio", "coagulatio"}
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}
	if req.Context == nil {
		req.Context = []string{}
	}
	// Save defaults to true unless explicitly disabled
	if !r.URL.Query().Has("save") && req.Save == false {
		req.Save = true
	}

	// Convert string phases to models.Phase
	phases := make([]models.Phase, len(req.Phases))
	for i, phaseStr := range req.Phases {
		phases[i] = models.Phase(phaseStr)
	}

	// Build phase configs
	phaseConfigs := make([]models.PhaseConfig, len(phases))
	for i, phase := range phases {
		provider := ""
		if req.Providers != nil {
			provider = req.Providers[string(phase)]
		}
		// If no provider specified for this phase, use default from request or let engine decide
		if provider == "" && req.Providers != nil && len(req.Providers) == 1 {
			// If only one provider specified globally, use it for all phases
			for _, p := range req.Providers {
				provider = p
				break
			}
		}

		phaseConfigs[i] = models.PhaseConfig{
			Phase:    phase,
			Provider: provider,
		}
	}

	// Build provider map for PromptRequest
	providerMap := make(map[models.Phase]string)
	for _, config := range phaseConfigs {
		if config.Provider != "" {
			providerMap[config.Phase] = config.Provider
		}
	}

	// Create session ID
	sessionID := uuid.New()

	// Create PromptRequest
	promptRequest := models.PromptRequest{
		Input:       req.Input,
		Phases:      phases,
		Count:       req.Count,
		Providers:   providerMap,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Tags:        req.Tags,
		Context:     req.Context,
		SessionID:   sessionID,
	}

	// Create GenerateOptions for engine
	generateOpts := models.GenerateOptions{
		Request:        promptRequest,
		PhaseConfigs:   convertToProviderPhaseConfigs(phaseConfigs),
		UseParallel:    req.UseParallel,
		IncludeContext: true,
		Persona:        req.Persona,
		TargetModel:    req.TargetModel,
	}

	// Time the generation
	startTime := time.Now()

	// Generate prompts using the engine
	ctx := context.Background()
	result, err := s.engine.Generate(ctx, generateOpts)
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate prompts")
		s.writeError(w, http.StatusInternalServerError, fmt.Sprintf("Generation failed: %v", err))
		return
	}

	generationTime := time.Since(startTime)

	// Assign session ID to all generated prompts
	for i := range result.Prompts {
		result.Prompts[i].SessionID = sessionID
	}

	// Rank prompts if ranker is available
	if s.ranker != nil {
		s.logger.Info("Ranking prompts...")
		rankings, err := s.ranker.RankPrompts(ctx, result.Prompts, promptRequest.Input)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to rank prompts, continuing without rankings")
		} else {
			result.Rankings = rankings

			// Set the selected prompt (highest ranked)
			if len(rankings) > 0 {
				result.Selected = rankings[0].Prompt
			}
		}
	}

	// Save prompts if requested
	if req.Save {
		for i := range result.Prompts {
			prompt := &result.Prompts[i]
			if err := s.store.SavePrompt(prompt); err != nil {
				s.logger.WithError(err).WithField("prompt_id", prompt.ID).Error("Failed to save prompt")
				// Continue with other prompts even if one fails
			}
		}
	}

	// Build providers used map
	providersUsed := make(map[string]string)
	for _, config := range phaseConfigs {
		if config.Provider != "" {
			providersUsed[string(config.Phase)] = config.Provider
		}
	}

	// Create response
	response := GenerateResponse{
		Prompts:   result.Prompts,
		Rankings:  result.Rankings,
		Selected:  result.Selected,
		SessionID: sessionID,
		Metadata: GenerateMetadata{
			TotalGenerated: len(result.Prompts),
			PhasesTiming:   map[string]int{"total": int(generationTime.Milliseconds())},
			ProvidersUsed:  providersUsed,
			GeneratedAt:    time.Now(),
			RequestOptions: GenerateRequestSummary{
				Phases:      req.Phases,
				Count:       req.Count,
				Persona:     req.Persona,
				TargetModel: req.TargetModel,
			},
		},
	}

	s.logger.WithFields(logrus.Fields{
		"session_id":        sessionID,
		"prompts_generated": len(result.Prompts),
		"generation_time":   generationTime,
		"phases":            req.Phases,
		"persona":           req.Persona,
	}).Info("Prompt generation completed successfully")

	s.writeJSON(w, http.StatusOK, response)
}

// Helper functions
func (s *SimpleServer) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		s.logger.WithError(err).Error("Failed to encode response")
	}
}

func (s *SimpleServer) writeError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"error":     message,
		"status":    status,
		"timestamp": time.Now(),
	}
	s.writeJSON(w, status, response)
}

func (s *SimpleServer) handleAISelectPrompt(w http.ResponseWriter, r *http.Request) {
	var req AISelectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate required fields
	if len(req.PromptIDs) == 0 {
		s.writeError(w, http.StatusBadRequest, "prompt_ids is required (array of prompt UUIDs)")
		return
	}

	// Set defaults
	if req.TaskDescription == "" {
		req.TaskDescription = "General prompt selection"
	}
	if req.TargetAudience == "" {
		req.TargetAudience = "general audience"
	}
	if req.RequiredTone == "" {
		req.RequiredTone = "professional"
	}
	if req.PreferredLength == "" {
		req.PreferredLength = "medium"
	}
	if req.Persona == "" {
		req.Persona = "generic"
	}
	if req.ModelFamily == "" {
		req.ModelFamily = "claude"
	}
	if req.SelectionProvider == "" {
		req.SelectionProvider = "openai"
	}

	// Convert prompt IDs to UUIDs and fetch prompts
	prompts := make([]models.Prompt, 0, len(req.PromptIDs))
	for _, idStr := range req.PromptIDs {
		promptID, err := uuid.Parse(idStr)
		if err != nil {
			s.writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid prompt ID: %s", idStr))
			return
		}

		prompt, err := s.store.GetPrompt(promptID)
		if err != nil {
			s.writeError(w, http.StatusNotFound, fmt.Sprintf("Prompt not found: %s", idStr))
			return
		}
		prompts = append(prompts, *prompt)
	}

	if len(prompts) == 0 {
		s.writeError(w, http.StatusBadRequest, "No valid prompts found")
		return
	}

	// Create AI selector with registry
	aiSelector := selection.NewAISelector(s.registry)

	// Create selection criteria
	var weights selection.EvaluationWeights
	switch req.Persona {
	case "code":
		weights = selection.CodeWeightFactors()
	case "writing":
		weights = selection.WritingWeightFactors()
	default:
		weights = selection.DefaultWeightFactors()
	}

	// Convert preferred_length string to int
	var maxLength int
	switch req.PreferredLength {
	case "short":
		maxLength = 100
	case "long":
		maxLength = 500
	default: // medium
		maxLength = 250
	}

	criteria := selection.SelectionCriteria{
		TaskDescription:    req.TaskDescription,
		TargetAudience:     req.TargetAudience,
		DesiredTone:        req.RequiredTone,
		MaxLength:          maxLength,
		Requirements:       req.SpecificRequirements,
		Persona:            req.Persona,
		EvaluationModel:    req.ModelFamily,
		EvaluationProvider: req.SelectionProvider,
		Weights:            weights,
	}

	// Perform AI-powered selection
	ctx := context.Background()
	result, err := aiSelector.Select(ctx, prompts, criteria)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, fmt.Sprintf("AI selection failed: %v", err))
		return
	}

	// Convert scores to alternative ranking
	alternativeRanking := make([]selection.PromptEvaluation, 0)
	for _, score := range result.Scores {
		// Find the prompt for this score
		var scoredPrompt *models.Prompt
		for _, p := range prompts {
			if p.ID == score.PromptID {
				scoredPrompt = &p
				break
			}
		}
		if scoredPrompt != nil {
			alternativeRanking = append(alternativeRanking, selection.PromptEvaluation{
				Prompt:    scoredPrompt,
				Score:     score.Score,
				Reasoning: score.Reasoning,
			})
		}
	}

	// Create response
	response := AISelectResponse{
		SelectedPrompt:     result.SelectedPrompt,
		SelectionReason:    result.Reasoning,
		ConfidenceScore:    result.Confidence,
		AlternativeRanking: alternativeRanking,
		ProcessingDuration: time.Duration(result.ProcessingTime) * time.Millisecond,
		Metadata: AISelectMetadata{
			TaskDescription:   req.TaskDescription,
			TargetAudience:    req.TargetAudience,
			RequiredTone:      req.RequiredTone,
			PreferredLength:   req.PreferredLength,
			Persona:           req.Persona,
			ModelFamily:       req.ModelFamily,
			SelectionProvider: req.SelectionProvider,
			EvaluatedAt:       time.Now(),
		},
	}

	s.logger.WithFields(logrus.Fields{
		"selected_prompt_id": result.SelectedPrompt.ID,
		"confidence_score":   result.Confidence,
		"processing_time_ms": result.ProcessingTime,
		"task_description":   req.TaskDescription,
	}).Info("AI prompt selection completed via HTTP API")

	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) handleSearchPrompts(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := r.URL.Query().Get("q")
	semantic := r.URL.Query().Get("semantic") == "true"
	phase := r.URL.Query().Get("phase")
	provider := r.URL.Query().Get("provider")
	tagsStr := r.URL.Query().Get("tags")
	since := r.URL.Query().Get("since")

	// Parse limit parameter
	limit := 10 // default
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	// Parse similarity parameter for semantic search
	similarity := 0.5 // default
	if similarityStr := r.URL.Query().Get("similarity"); similarityStr != "" {
		if parsedSimilarity, err := strconv.ParseFloat(similarityStr, 64); err == nil && parsedSimilarity >= 0 && parsedSimilarity <= 1 {
			similarity = parsedSimilarity
		}
	}

	// Parse tags
	var tagList []string
	if tagsStr != "" {
		tagList = strings.Split(tagsStr, ",")
		for i, tag := range tagList {
			tagList[i] = strings.TrimSpace(tag)
		}
	}

	// Parse since date
	var sinceTime *time.Time
	if since != "" {
		if parsed, err := time.Parse("2006-01-02", since); err == nil {
			sinceTime = &parsed
		} else {
			s.writeError(w, http.StatusBadRequest, "Invalid date format for 'since' parameter (use YYYY-MM-DD)")
			return
		}
	}

	var prompts []models.Prompt
	var similarities []float64
	var err error
	searchType := "text"

	if semantic && query != "" {
		// Semantic search
		searchType = "semantic"
		criteria := storage.SemanticSearchCriteria{
			Query:         query,
			Limit:         limit,
			MinSimilarity: similarity,
			Phase:         phase,
			Provider:      provider,
			Tags:          tagList,
			Since:         sinceTime,
		}
		prompts, similarities, err = s.store.SearchPromptsSemanticFast(criteria)
	} else {
		// Text-based search (metadata filtering only)
		criteria := storage.SearchCriteria{
			Phase:    phase,
			Provider: provider,
			Tags:     tagList,
			Since:    sinceTime,
			Limit:    limit,
		}
		prompts, err = s.store.SearchPrompts(criteria)
	}

	if err != nil {
		s.writeError(w, http.StatusInternalServerError, fmt.Sprintf("Search failed: %v", err))
		return
	}

	// Create response
	response := SearchPromptsResponse{
		Prompts:      prompts,
		TotalFound:   len(prompts),
		SearchType:   searchType,
		Query:        query,
		Similarities: similarities,
		Metadata: SearchMetadata{
			Phase:         phase,
			Provider:      provider,
			Tags:          tagList,
			Since:         sinceTime,
			Limit:         limit,
			Semantic:      semantic,
			MinSimilarity: similarity,
			SearchedAt:    time.Now(),
		},
	}

	s.logger.WithFields(logrus.Fields{
		"query":       query,
		"search_type": searchType,
		"results":     len(prompts),
		"semantic":    semantic,
		"phase":       phase,
		"provider":    provider,
	}).Info("Prompt search completed via HTTP API")

	s.writeJSON(w, http.StatusOK, response)
}

func convertToProviderPhaseConfigs(configs []models.PhaseConfig) []models.PhaseConfig {
	// No conversion needed since the engine now expects models.PhaseConfig
	return configs
}

func (s *SimpleServer) handleListProviders(w http.ResponseWriter, r *http.Request) {
	// Get all registered providers
	allProviders := make([]ProviderInfo, 0)
	availableProviders := s.registry.ListAvailable()
	embeddingProviders := s.registry.ListEmbeddingCapableProviders()

	// Create a set for O(1) lookups
	availableSet := make(map[string]bool)
	for _, name := range availableProviders {
		availableSet[name] = true
	}

	embeddingSet := make(map[string]bool)
	for _, name := range embeddingProviders {
		embeddingSet[name] = true
	}

	// Known provider names (from constants)
	providerNames := []string{
		providers.ProviderOpenAI,
		providers.ProviderAnthropic,
		providers.ProviderGoogle,
		providers.ProviderOllama,
		providers.ProviderOpenRouter,
	}

	for _, name := range providerNames {
		_, err := s.registry.Get(name)
		if err != nil {
			// Provider not registered, show as unavailable
			allProviders = append(allProviders, ProviderInfo{
				Name:               name,
				Available:          false,
				SupportsEmbeddings: false,
				Capabilities:       []string{},
			})
			continue
		}

		available := availableSet[name]
		supportsEmbeddings := embeddingSet[name]

		capabilities := []string{"generation"}
		if supportsEmbeddings {
			capabilities = append(capabilities, "embeddings")
		}

		// Get models based on provider type
		models := s.getProviderModels(name)

		allProviders = append(allProviders, ProviderInfo{
			Name:               name,
			Available:          available,
			SupportsEmbeddings: supportsEmbeddings,
			Models:             models,
			Capabilities:       capabilities,
		})
	}

	response := ProvidersResponse{
		Providers:          allProviders,
		TotalProviders:     len(allProviders),
		AvailableProviders: len(availableProviders),
		EmbeddingProviders: len(embeddingProviders),
		RetrievedAt:        time.Now(),
	}

	s.logger.WithFields(logrus.Fields{
		"total_providers":     len(allProviders),
		"available_providers": len(availableProviders),
		"embedding_providers": len(embeddingProviders),
	}).Info("Provider list requested via HTTP API")

	s.writeJSON(w, http.StatusOK, response)
}

func (s *SimpleServer) getProviderModels(providerName string) []string {
	switch providerName {
	case providers.ProviderOpenAI:
		return []string{"gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"}
	case providers.ProviderAnthropic:
		return []string{"claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"}
	case providers.ProviderGoogle:
		return []string{"gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"}
	case providers.ProviderOllama:
		return []string{"llama3.2", "qwen2.5", "mistral", "phi3", "gemma2"}
	case providers.ProviderOpenRouter:
		return []string{"anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-pro-1.5"}
	default:
		return []string{}
	}
}
