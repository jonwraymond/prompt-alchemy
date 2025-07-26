package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// WebServer represents the web interface server
type WebServer struct {
	templates  *template.Template
	apiBaseURL string
	httpClient *http.Client
}

// Provider represents a prompt generation provider
type Provider struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Available   bool   `json:"available"`
}

// Phase represents a generation phase
type Phase struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
}

// GenerateRequest represents the form data for prompt generation
type GenerateRequest struct {
	Input               string            `json:"input"`
	Phases              []string          `json:"phases,omitempty"`
	Count               int               `json:"count,omitempty"`
	Providers           map[string]string `json:"providers,omitempty"`
	Temperature         float64           `json:"temperature,omitempty"`
	MaxTokens           int               `json:"max_tokens,omitempty"`
	Tags                []string          `json:"tags,omitempty"`
	Persona             string            `json:"persona,omitempty"`
	UseParallel         bool              `json:"use_parallel,omitempty"`
	Save                bool              `json:"save,omitempty"`
	UseOptimization     bool              `json:"use_optimization,omitempty"`
	SimilarityThreshold float64           `json:"similarity_threshold,omitempty"`
	HistoricalWeight    float64           `json:"historical_weight,omitempty"`
	EnableJudging       bool              `json:"enable_judging,omitempty"`
	JudgeProvider       string            `json:"judge_provider,omitempty"`
	ScoringCriteria     string            `json:"scoring_criteria,omitempty"`
	TargetUseCase       string            `json:"target_use_case,omitempty"`
}

// PromptResult represents a simplified prompt result for display
type PromptResult struct {
	ID           string    `json:"id"`
	Content      string    `json:"content"`
	Phase        string    `json:"phase"`
	Provider     string    `json:"provider"`
	Model        string    `json:"model"`
	ActualTokens int       `json:"actual_tokens"`
	Score        float64   `json:"score"`
	CreatedAt    time.Time `json:"created_at"`
}

// GenerateResponse represents the API response
type GenerateResponse struct {
	Prompts   []PromptResult `json:"prompts"`
	Selected  *PromptResult  `json:"selected,omitempty"`
	SessionID string         `json:"session_id"`
	Metadata  struct {
		Duration   string    `json:"duration"`
		PhaseCount int       `json:"phase_count"`
		Timestamp  time.Time `json:"timestamp"`
	} `json:"metadata"`
}

func main() {
	// Initialize web server
	apiBaseURL := os.Getenv("API_BASE_URL")
	if apiBaseURL == "" {
		apiBaseURL = "http://localhost:8080"
	}

	server := &WebServer{
		apiBaseURL: apiBaseURL,
		httpClient: &http.Client{Timeout: 150 * time.Second},
	}

	// Load alchemical templates with custom functions
	var err error
	funcMap := template.FuncMap{
		"title": strings.Title,
	}
	server.templates = template.New("").Funcs(funcMap)

	// Load the new alchemical templates
	_, err = server.templates.ParseFiles(
		"web/templates/alchemy-index.html",
		"web/templates/alchemy-results.html",
	)
	if err != nil {
		log.Fatal("Failed to load alchemical templates:", err)
	}

	// Setup routes
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Static files
	r.Handle("/static/*", http.StripPrefix("/static/", http.FileServer(http.Dir("web/static/"))))
	r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets/"))))

	// React app static files
	r.Handle("/react/*", http.StripPrefix("/react/", http.FileServer(http.Dir("dist/"))))

	// Routes
	r.Get("/", server.handleHome)
	r.Get("/react", server.handleReactApp)
	r.Post("/generate", server.handleGenerate)
	r.Get("/providers", server.handleGetProviders)
	r.Get("/health", server.handleHealth)

	// Proxy ALL /api/* endpoints to the API server
	r.HandleFunc("/api/*", server.proxyToAPI)

	log.Println("Starting web server on :8090...")
	log.Fatal(http.ListenAndServe(":8090", r))
}

// handleHome renders the main page
func (s *WebServer) handleHome(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title":     "Prompt Alchemy",
		"Timestamp": time.Now().Unix(),
		"Phases": []Phase{
			{Name: "prima-materia", DisplayName: "Prima Materia (Raw Ideas)"},
			{Name: "solutio", DisplayName: "Solutio (Natural Flow)"},
			{Name: "coagulatio", DisplayName: "Coagulatio (Crystallized Form)"},
		},
		"Providers": []Provider{
			{Name: "openai", DisplayName: "OpenAI (GPT-4)", Available: true},
			{Name: "anthropic", DisplayName: "Anthropic (Claude)", Available: true},
			{Name: "google", DisplayName: "Google (Gemini)", Available: true},
			{Name: "grok", DisplayName: "Grok (xAI)", Available: true},
			{Name: "openrouter", DisplayName: "OpenRouter", Available: true},
			{Name: "ollama", DisplayName: "Ollama (Local)", Available: false},
		},
		"Personas": []string{"code", "writing", "analysis", "generic"},
	}

	err := s.templates.ExecuteTemplate(w, "alchemy-index.html", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// handleReactApp serves the React application
func (s *WebServer) handleReactApp(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "dist/index.html")
}

// handleGenerate processes prompt generation requests
func (s *WebServer) handleGenerate(w http.ResponseWriter, r *http.Request) {
	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// Build generation request
	req := GenerateRequest{
		Input:       r.FormValue("input"),
		Persona:     r.FormValue("persona"),
		UseParallel: r.FormValue("use_parallel") == "true",
		Save:        r.FormValue("save") == "true",
	}

	// Parse count
	if countStr := r.FormValue("count"); countStr != "" {
		if count, err := strconv.Atoi(countStr); err == nil {
			req.Count = count
		} else {
			req.Count = 3
		}
	} else {
		req.Count = 3
	}

	// Parse temperature
	if tempStr := r.FormValue("temperature"); tempStr != "" {
		if temp, err := strconv.ParseFloat(tempStr, 64); err == nil {
			req.Temperature = temp
		} else {
			req.Temperature = 0.7
		}
	} else {
		req.Temperature = 0.7
	}

	// Parse max_tokens
	if tokensStr := r.FormValue("max_tokens"); tokensStr != "" {
		if tokens, err := strconv.Atoi(tokensStr); err == nil {
			req.MaxTokens = tokens
		} else {
			req.MaxTokens = 2000
		}
	} else {
		req.MaxTokens = 2000
	}

	// Parse tags
	if tagsStr := r.FormValue("tags"); tagsStr != "" {
		req.Tags = strings.Split(strings.TrimSpace(tagsStr), ",")
		for i := range req.Tags {
			req.Tags[i] = strings.TrimSpace(req.Tags[i])
		}
	}

	// Parse phase selection (form uses single select, handle "auto" case)
	phase := r.FormValue("phase")
	if phase == "" || phase == "auto" {
		// Auto selection uses all phases
		req.Phases = []string{"prima-materia", "solutio", "coagulatio"}
	} else {
		// Specific phase selected
		req.Phases = []string{phase}
	}

	// Parse providers for each phase
	req.Providers = make(map[string]string)
	for _, phase := range []string{"prima-materia", "solutio", "coagulatio"} {
		if provider := r.FormValue("provider_" + phase); provider != "" {
			req.Providers[phase] = provider
		}
	}

	// Parse optimization settings
	req.UseOptimization = r.FormValue("use_optimization") == "true"
	if thresholdStr := r.FormValue("similarity_threshold"); thresholdStr != "" {
		if threshold, err := strconv.ParseFloat(thresholdStr, 64); err == nil {
			req.SimilarityThreshold = threshold
		}
	}
	if weightStr := r.FormValue("historical_weight"); weightStr != "" {
		if weight, err := strconv.ParseFloat(weightStr, 64); err == nil {
			req.HistoricalWeight = weight
		}
	}

	// Parse judging settings
	req.EnableJudging = r.FormValue("enable_judging") == "true"
	req.JudgeProvider = r.FormValue("judge_provider")
	req.ScoringCriteria = r.FormValue("scoring_criteria")
	req.TargetUseCase = r.FormValue("target_use_case")

	// Make API request
	jsonData, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "Failed to marshal request", http.StatusInternalServerError)
		return
	}

	apiURL := fmt.Sprintf("%s/api/v1/prompts/generate", s.apiBaseURL)
	resp, err := s.httpClient.Post(apiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		s.renderError(w, fmt.Sprintf("API request failed: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		s.renderError(w, fmt.Sprintf("API error (%d): %s", resp.StatusCode, string(body)))
		return
	}

	// Parse response
	var apiResp GenerateResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		s.renderError(w, fmt.Sprintf("Failed to parse API response: %v", err))
		return
	}

	// Render results with proper metadata structure
	data := map[string]interface{}{
		"Results":   apiResp.Prompts,
		"Selected":  apiResp.Selected,
		"SessionID": apiResp.SessionID,
		"Success":   true,
		"Metadata": map[string]interface{}{
			"Duration":         apiResp.Metadata.Duration,
			"PhaseCount":       apiResp.Metadata.PhaseCount,
			"Timestamp":        apiResp.Metadata.Timestamp,
			"OptimizationUsed": false, // Default value for now
			"JudgingUsed":      false, // Default value for now
		},
	}

	err = s.templates.ExecuteTemplate(w, "alchemy-results.html", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// handleGetProviders returns available providers
func (s *WebServer) handleGetProviders(w http.ResponseWriter, r *http.Request) {
	apiURL := fmt.Sprintf("%s/api/v1/providers", s.apiBaseURL)
	resp, err := s.httpClient.Get(apiURL)
	if err != nil {
		http.Error(w, "Failed to get providers", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}

// handleHealth returns health status
func (s *WebServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// renderError renders an error response
func (s *WebServer) renderError(w http.ResponseWriter, message string) {
	data := map[string]interface{}{
		"Error":   message,
		"Success": false,
	}

	err := s.templates.ExecuteTemplate(w, "alchemy-results.html", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// proxyToAPI proxies requests to the API server
func (s *WebServer) proxyToAPI(w http.ResponseWriter, r *http.Request) {
	// Use the original path - the API server has both /api and /api/v1 routes
	// HTMX endpoints are under /api/ (not /api/v1/)
	// Only specific endpoints like /generate and /providers need /api/v1/
	targetPath := r.URL.Path

	// Build the target URL
	targetURL := s.apiBaseURL + targetPath
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	// Debug logging
	log.Printf("Proxying %s %s to %s", r.Method, r.URL.Path, targetURL)

	// Create new request
	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		log.Printf("Failed to create proxy request: %v", err)
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}

	// Copy headers
	for name, values := range r.Header {
		for _, value := range values {
			req.Header.Add(name, value)
		}
	}

	// Make the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		log.Printf("API request failed: %v", err)
		http.Error(w, "API request failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	log.Printf("API responded with status: %d", resp.StatusCode)

	// Copy response headers
	for name, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	io.Copy(w, resp.Body)
}

// HTMX API handlers for the web UI

func (s *WebServer) handleFlowStatus(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"flow_id":     "alchemy-flow-1",
		"status":      "active",
		"phase":       "ready",
		"progress":    0,
		"total_steps": 3,
		"timestamp":   time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleSystemStatus(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":             "healthy",
		"uptime":             time.Since(time.Now().Add(-time.Hour)).String(),
		"providers_online":   3, // Mock number of providers
		"memory_usage":       "45%",
		"cpu_usage":          "12%",
		"active_connections": 1,
		"last_check":         time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleNodesStatus(w http.ResponseWriter, r *http.Request) {
	// Return array directly as expected by the JavaScript updateNodeStatesFromServer function
	response := []map[string]interface{}{
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
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleConnectionStatus(w http.ResponseWriter, r *http.Request) {
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
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleNodeDetails(w http.ResponseWriter, r *http.Request) {
	nodeID := r.URL.Query().Get("node_id")
	if nodeID == "" {
		nodeID = "prima-materia"
	}

	var nodeDetails map[string]interface{}
	switch nodeID {
	case "prima-materia":
		nodeDetails = map[string]interface{}{
			"id":          "prima-materia",
			"name":        "Prima Materia",
			"phase":       "prima-materia",
			"description": "Extracts raw essence and structures initial ideas through systematic brainstorming",
			"provider":    "openai",
			"model":       "gpt-4o",
			"status":      "ready",
			"temperature": 0.8,
			"max_tokens":  2000,
		}
	case "solutio":
		nodeDetails = map[string]interface{}{
			"id":          "solutio",
			"name":        "Solutio",
			"phase":       "solutio",
			"description": "Dissolves structured ideas into natural, flowing language",
			"provider":    "anthropic",
			"model":       "claude-3-5-sonnet-20241022",
			"status":      "ready",
			"temperature": 0.7,
			"max_tokens":  2000,
		}
	case "coagulatio":
		nodeDetails = map[string]interface{}{
			"id":          "coagulatio",
			"name":        "Coagulatio",
			"phase":       "coagulatio",
			"description": "Crystallizes flowing language into precise, production-ready prompts",
			"provider":    "google",
			"model":       "gemini-2.5-flash",
			"status":      "ready",
			"temperature": 0.6,
			"max_tokens":  2000,
		}
	default:
		nodeDetails = map[string]interface{}{
			"id":          nodeID,
			"name":        "Unknown Node",
			"description": "Node details not found",
			"status":      "unknown",
		}
	}

	s.writeJSON(w, http.StatusOK, nodeDetails)
}

func (s *WebServer) handleFlowInfo(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"flow_name":    "Alchemical Prompt Generation",
		"description":  "Three-phase alchemical transformation process",
		"total_phases": 3,
		"current_step": 0,
		"phases": []map[string]interface{}{
			{
				"name":        "Prima Materia",
				"order":       1,
				"description": "Extract raw essence",
				"status":      "ready",
			},
			{
				"name":        "Solutio",
				"order":       2,
				"description": "Dissolve into flowing language",
				"status":      "ready",
			},
			{
				"name":        "Coagulatio",
				"order":       3,
				"description": "Crystallize final form",
				"status":      "ready",
			},
		},
		"created_at": time.Now().Add(-time.Hour).Format(time.RFC3339),
		"updated_at": time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleActivityFeed(w http.ResponseWriter, r *http.Request) {
	activities := []map[string]interface{}{
		{
			"id":        1,
			"type":      "system",
			"message":   "System initialized successfully",
			"timestamp": time.Now().Add(-time.Minute * 5).Format(time.RFC3339),
			"level":     "info",
		},
		{
			"id":        2,
			"type":      "provider",
			"message":   "OpenAI provider connected",
			"timestamp": time.Now().Add(-time.Minute * 4).Format(time.RFC3339),
			"level":     "success",
		},
		{
			"id":        3,
			"type":      "flow",
			"message":   "Flow ready for input",
			"timestamp": time.Now().Add(-time.Minute * 2).Format(time.RFC3339),
			"level":     "info",
		},
	}

	response := map[string]interface{}{
		"activities": activities,
		"total":      len(activities),
		"timestamp":  time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleZoom(w http.ResponseWriter, r *http.Request) {
	var zoomReq struct {
		Action string  `json:"action"`
		Level  float64 `json:"level,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&zoomReq); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Simulate zoom handling
	newLevel := 1.0
	switch zoomReq.Action {
	case "in":
		newLevel = 1.2
	case "out":
		newLevel = 0.8
	case "reset":
		newLevel = 1.0
	case "set":
		if zoomReq.Level > 0 {
			newLevel = zoomReq.Level
		}
	}

	response := map[string]interface{}{
		"action":    zoomReq.Action,
		"new_level": newLevel,
		"success":   true,
		"timestamp": time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleZoomLevel(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"level":     1.0,
		"min":       0.5,
		"max":       2.0,
		"step":      0.1,
		"timestamp": time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleActivatePhase(w http.ResponseWriter, r *http.Request) {
	var activateReq struct {
		PhaseID string `json:"phase_id"`
		Input   string `json:"input,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&activateReq); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if activateReq.PhaseID == "" {
		http.Error(w, "phase_id is required", http.StatusBadRequest)
		return
	}

	// Simulate phase activation
	response := map[string]interface{}{
		"phase_id":  activateReq.PhaseID,
		"status":    "activated",
		"message":   fmt.Sprintf("Phase %s activated successfully", activateReq.PhaseID),
		"timestamp": time.Now().Format(time.RFC3339),
	}

	log.Printf("Phase activation requested: %s with input: %s", activateReq.PhaseID, activateReq.Input)

	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleNodeActivate(w http.ResponseWriter, r *http.Request) {
	var activateReq struct {
		NodeID string `json:"node_id"`
		Phase  string `json:"phase,omitempty"`
		Input  string `json:"input,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&activateReq); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if activateReq.NodeID == "" {
		http.Error(w, "node_id is required", http.StatusBadRequest)
		return
	}

	// Simulate node activation
	response := map[string]interface{}{
		"node_id":   activateReq.NodeID,
		"phase":     activateReq.Phase,
		"status":    "activated",
		"message":   fmt.Sprintf("Node %s activated successfully", activateReq.NodeID),
		"timestamp": time.Now().Format(time.RFC3339),
		"metadata": map[string]interface{}{
			"activation_time":      time.Now().Format(time.RFC3339),
			"ready_for_processing": true,
		},
	}

	log.Printf("Node activation requested: %s (phase: %s) with input: %s", activateReq.NodeID, activateReq.Phase, activateReq.Input)

	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleNodeActions(w http.ResponseWriter, r *http.Request) {
	nodeID := r.URL.Query().Get("node_id")
	if nodeID == "" {
		nodeID = "prima-materia"
	}

	var actions []map[string]interface{}
	switch nodeID {
	case "prima-materia":
		actions = []map[string]interface{}{
			{"id": "activate", "name": "Activate Phase", "icon": "play"},
			{"id": "configure", "name": "Configure", "icon": "settings"},
			{"id": "reset", "name": "Reset", "icon": "refresh"},
		}
	case "solutio":
		actions = []map[string]interface{}{
			{"id": "activate", "name": "Activate Phase", "icon": "play"},
			{"id": "configure", "name": "Configure", "icon": "settings"},
			{"id": "reset", "name": "Reset", "icon": "refresh"},
		}
	case "coagulatio":
		actions = []map[string]interface{}{
			{"id": "activate", "name": "Activate Phase", "icon": "play"},
			{"id": "configure", "name": "Configure", "icon": "settings"},
			{"id": "reset", "name": "Reset", "icon": "refresh"},
		}
	default:
		actions = []map[string]interface{}{
			{"id": "info", "name": "View Info", "icon": "info"},
		}
	}

	response := map[string]interface{}{
		"node_id":   nodeID,
		"actions":   actions,
		"timestamp": time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleBoardState(w http.ResponseWriter, r *http.Request) {
	// Mock board state for the hexagonal flow visualization
	response := map[string]interface{}{
		"board_id":    "hex-flow-board-1",
		"zoom_level":  1.0,
		"pan_x":       0,
		"pan_y":       0,
		"active_flow": false,
		"nodes": []map[string]interface{}{
			{
				"id":       "prima-materia",
				"x":        150,
				"y":        100,
				"active":   false,
				"status":   "ready",
				"progress": 0,
			},
			{
				"id":       "solutio",
				"x":        300,
				"y":        200,
				"active":   false,
				"status":   "ready",
				"progress": 0,
			},
			{
				"id":       "coagulatio",
				"x":        450,
				"y":        300,
				"active":   false,
				"status":   "ready",
				"progress": 0,
			},
		},
		"connections": []map[string]interface{}{
			{
				"from":   "prima-materia",
				"to":     "solutio",
				"active": false,
				"flow":   0,
			},
			{
				"from":   "solutio",
				"to":     "coagulatio",
				"active": false,
				"flow":   0,
			},
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleToggleFeatures(w http.ResponseWriter, r *http.Request) {
	// Parse the checkbox state
	var toggleReq struct {
		Enabled bool `json:"enabled"`
	}

	// Try to decode JSON body first, then fall back to form data
	if r.Header.Get("Content-Type") == "application/json" {
		if err := json.NewDecoder(r.Body).Decode(&toggleReq); err != nil {
			// Fall back to checking if it's a form submission
			toggleReq.Enabled = r.FormValue("enabled") == "true" || r.FormValue("enabled") == "on"
		}
	} else {
		// Handle form data (checkbox will be present if checked, absent if unchecked)
		toggleReq.Enabled = r.FormValue("enabled") != ""
	}

	response := map[string]interface{}{
		"features_enabled": toggleReq.Enabled,
		"message":          fmt.Sprintf("Advanced features %s", map[bool]string{true: "enabled", false: "disabled"}[toggleReq.Enabled]),
		"features": map[string]bool{
			"optimizer": toggleReq.Enabled,
			"judge":     toggleReq.Enabled,
			"vector_db": toggleReq.Enabled,
			"history":   toggleReq.Enabled,
			"analytics": toggleReq.Enabled,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}

	log.Printf("Advanced features toggled: %v", toggleReq.Enabled)
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleFlowEvents(w http.ResponseWriter, r *http.Request) {
	// Set headers for Server-Sent Events
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Keep connection alive and send periodic updates
	ctx := r.Context()
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	// Send initial connection event
	fmt.Fprintf(w, "event: connected\n")
	fmt.Fprintf(w, "data: {\"status\": \"connected\", \"timestamp\": \"%s\"}\n\n", time.Now().Format(time.RFC3339))
	flusher.Flush()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Send periodic flow status updates
			eventData := map[string]interface{}{
				"event_type": "flow-update",
				"flow_id":    "alchemy-flow-1",
				"status":     "active",
				"nodes": []map[string]interface{}{
					{"id": "prima-materia", "status": "ready"},
					{"id": "solutio", "status": "ready"},
					{"id": "coagulatio", "status": "ready"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			}

			jsonData, err := json.Marshal(eventData)
			if err != nil {
				continue
			}

			fmt.Fprintf(w, "event: flow-update\n")
			fmt.Fprintf(w, "data: %s\n\n", string(jsonData))
			flusher.Flush()
		}
	}
}

func (s *WebServer) handleFinalizeOutput(w http.ResponseWriter, r *http.Request) {
	// This endpoint handles the finalization of output in the connection flow
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		sessionID = "default-session"
	}

	response := map[string]interface{}{
		"session_id":   sessionID,
		"status":       "finalized",
		"message":      "Output finalization complete",
		"finalized_at": time.Now().Format(time.RFC3339),
		"output_ready": true,
		"next_action":  "display_results",
		"metadata": map[string]interface{}{
			"total_phases_completed": 3,
			"processing_time":        "45.2s",
			"optimization_applied":   true,
			"quality_score":          8.7,
		},
	}

	log.Printf("Output finalized for session: %s", sessionID)
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleHubJudge(w http.ResponseWriter, r *http.Request) {
	// This endpoint handles judge node connections in the hexagonal flow system
	judgeProvider := r.URL.Query().Get("provider")
	if judgeProvider == "" {
		judgeProvider = "anthropic" // Default judge provider
	}

	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		sessionID = "default-session"
	}

	response := map[string]interface{}{
		"session_id":     sessionID,
		"node_type":      "judge",
		"status":         "connected",
		"message":        "Judge hub connection established",
		"connected_at":   time.Now().Format(time.RFC3339),
		"judge_provider": judgeProvider,
		"ready_to_score": true,
		"capabilities": map[string]interface{}{
			"quality_scoring":     true,
			"criteria_analysis":   true,
			"comparative_review":  true,
			"feedback_generation": true,
		},
		"scoring_criteria": []string{
			"clarity",
			"specificity",
			"actionability",
			"completeness",
			"effectiveness",
		},
		"metadata": map[string]interface{}{
			"model":           "claude-3-5-sonnet-20241022",
			"response_time":   "1.2s",
			"accuracy_score":  0.94,
			"available_modes": []string{"standard", "strict", "creative"},
		},
	}

	log.Printf("Judge hub connected for session: %s using provider: %s", sessionID, judgeProvider)
	s.writeJSON(w, http.StatusOK, response)
}

func (s *WebServer) handleHubOptimize(w http.ResponseWriter, r *http.Request) {
	// This endpoint handles optimizer node connections in the hexagonal flow system
	optimizerProvider := r.URL.Query().Get("provider")
	if optimizerProvider == "" {
		optimizerProvider = "openai" // Default optimizer provider
	}

	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		sessionID = "default-session"
	}

	targetScore := r.URL.Query().Get("target_score")
	targetScoreFloat := 8.5 // Default target score
	if targetScore != "" {
		if score, err := strconv.ParseFloat(targetScore, 64); err == nil {
			targetScoreFloat = score
		}
	}

	response := map[string]interface{}{
		"session_id":         sessionID,
		"node_type":          "optimizer",
		"status":             "connected",
		"message":            "Optimizer hub connection established",
		"connected_at":       time.Now().Format(time.RFC3339),
		"optimizer_provider": optimizerProvider,
		"ready_to_optimize":  true,
		"target_score":       targetScoreFloat,
		"max_iterations":     5,
		"optimization_methods": []string{
			"meta_prompting",
			"iterative_refinement",
			"context_enhancement",
			"clarity_improvement",
			"specificity_boost",
		},
		"capabilities": map[string]interface{}{
			"prompt_refinement":     true,
			"context_optimization":  true,
			"performance_tuning":    true,
			"quality_enhancement":   true,
			"automated_improvement": true,
		},
		"metadata": map[string]interface{}{
			"model":               "gpt-4o",
			"response_time":       "2.1s",
			"success_rate":        0.89,
			"average_improvement": "+23%",
			"optimization_modes":  []string{"conservative", "balanced", "aggressive"},
		},
	}

	log.Printf("Optimizer hub connected for session: %s using provider: %s (target score: %.1f)", sessionID, optimizerProvider, targetScoreFloat)
	s.writeJSON(w, http.StatusOK, response)
}

// Helper method for JSON responses
func (s *WebServer) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}
