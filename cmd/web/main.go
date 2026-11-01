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
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
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
		"title": cases.Title(language.Und).String,
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
	defer func() {
		_ = resp.Body.Close() // response body fully consumed; close error is not actionable
	}()

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
	defer func() {
		_ = resp.Body.Close() // response body fully consumed; close error is not actionable
	}()

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("Failed to copy providers response body: %v", err)
	}
}

// handleHealth returns health status
func (s *WebServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	}); err != nil {
		log.Printf("Failed to encode health response: %v", err)
	}
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
	defer func() {
		_ = resp.Body.Close() // proxied response body is streamed below; close error is not actionable
	}()

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
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("Failed to copy proxied response body: %v", err)
	}
}
