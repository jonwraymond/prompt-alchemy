package cmd

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/optimizer"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// MCP Protocol structures
type MCPRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type MCPResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *MCPError   `json:"error,omitempty"`
}

type MCPError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    string `json:"data,omitempty"`
}

type MCPTool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
}

type MCPToolResult struct {
	Content  []MCPContent `json:"content"`
	IsError  bool         `json:"isError,omitempty"`
	Metadata interface{}  `json:"_meta,omitempty"`
}

type MCPContent struct {
	Type     string      `json:"type"`
	Text     string      `json:"text,omitempty"`
	MimeType string      `json:"mimeType,omitempty"`
	Data     interface{} `json:"data,omitempty"`
}

// Server instance
type MCPServer struct {
	storage  *storage.Storage
	registry *providers.Registry
	engine   *engine.Engine
	ranker   *ranking.Ranker
	learner  *learning.LearningEngine
	logger   *logrus.Logger
	reader   *bufio.Reader
	writer   *bufio.Writer
	encoder  *json.Encoder
}

var serveCmd = &cobra.Command{
	Use:   "serve [mode]",
	Short: "Start Prompt Alchemy server",
	Long: `Start a Prompt Alchemy server in different modes.

Available modes:
  api     - HTTP REST API server
  mcp     - Model Context Protocol server (stdin/stdout)
  hybrid  - Both API and MCP servers simultaneously

If no mode is specified, defaults to MCP mode for backward compatibility.

Examples:
  # Start HTTP API server
  prompt-alchemy serve api --port 8080

  # Start MCP server
  prompt-alchemy serve mcp

  # Start both servers
  prompt-alchemy serve hybrid --port 8080`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Default to MCP mode if no subcommand
		if len(args) == 0 {
			return runServe(cmd, args)
		}
		return cmd.Help()
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
}

func runServe(cmd *cobra.Command, args []string) error {
	ctx := context.Background()

	// Initialize logger
	logger := setupLogger()

	// Reload viper to ensure configuration is properly loaded
	viper.SetConfigFile(viper.ConfigFileUsed())
	if err := viper.ReadInConfig(); err != nil {
		logger.WithError(err).Warn("Failed to reload config")
	}

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() { _ = store.Close() }()

	// Initialize provider registry
	registry := providers.NewRegistry()
	if err := registerProviders(registry, logger); err != nil {
		return fmt.Errorf("failed to register providers: %w", err)
	}

	// Initialize engine
	engine := engine.NewEngine(registry, logger)

	// Initialize ranker
	ranker := ranking.NewRanker(store, registry, logger)

	// Initialize learner (optional)
	var learner *learning.LearningEngine
	if viper.GetBool("learning_mode") {
		learner = learning.NewLearningEngine(store, logger)
	}

	// Create server
	writer := bufio.NewWriter(os.Stdout)
	server := &MCPServer{
		storage:  store,
		registry: registry,
		engine:   engine,
		ranker:   ranker,
		learner:  learner,
		logger:   logger,
		reader:   bufio.NewReader(os.Stdin),
		writer:   writer,
		encoder:  json.NewEncoder(writer),
	}

	// Start server
	return server.serve(ctx)
}

func (s *MCPServer) serve(ctx context.Context) error {
	s.logger.Info("Starting MCP server")

	for {
		// Read request
		line, err := s.reader.ReadString('\n')
		if err != nil {
			if err.Error() == "EOF" {
				s.logger.Info("MCP server shutting down")
				return nil
			}
			s.logger.WithError(err).Error("Failed to read request")
			continue
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse request
		var req MCPRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			s.logger.WithError(err).Error("Failed to parse request")
			s.sendError(nil, -32700, "Parse error", "")
			continue
		}

		// Handle request
		s.handleRequest(ctx, &req)
	}
}

func (s *MCPServer) handleRequest(ctx context.Context, req *MCPRequest) {
	s.logger.WithFields(logrus.Fields{
		"method": req.Method,
		"id":     req.ID,
	}).Debug("Handling MCP request")

	switch req.Method {
	case "initialize":
		s.handleInitialize(req)
	case "tools/list":
		s.handleToolsList(req)
	case "tools/call":
		s.handleToolCall(ctx, req)
	default:
		s.sendError(req.ID, -32601, "Method not found", "")
	}
}

func (s *MCPServer) handleInitialize(req *MCPRequest) {
	result := map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"serverInfo": map[string]interface{}{
			"name":    "prompt-alchemy",
			"version": "1.0.0",
		},
		"capabilities": map[string]interface{}{
			"tools": map[string]interface{}{},
		},
	}

	s.sendResult(req.ID, result)
}

func (s *MCPServer) handleToolsList(req *MCPRequest) {
	tools := []MCPTool{
		{
			Name:        "generate_prompts",
			Description: "Generate AI prompts using phased approach",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"input": map[string]interface{}{
						"type":        "string",
						"description": "Input text or idea",
					},
					"phases": map[string]interface{}{
						"type":        "string",
						"description": "Comma-separated phases",
						"default":     "prima-materia,solutio,coagulatio",
					},
					"count": map[string]interface{}{
						"type":        "integer",
						"description": "Number of variants per phase",
						"default":     3,
					},
					"persona": map[string]interface{}{
						"type":        "string",
						"description": "AI persona (code, writing, analysis, generic)",
						"default":     "code",
					},
					"temperature": map[string]interface{}{
						"type":        "number",
						"description": "Temperature for generation (0.0-1.0)",
						"default":     0.7,
					},
					"max_tokens": map[string]interface{}{
						"type":        "integer",
						"description": "Maximum tokens in response",
						"default":     2000,
					},
					"optimize": map[string]interface{}{
						"type":        "boolean",
						"description": "Apply optimization after generation",
						"default":     false,
					},
					"phase_selection": map[string]interface{}{
						"type":        "string",
						"description": "Selection strategy: 'best' (best from each phase), 'cascade' (use best as input to next), 'all' (return all)",
						"default":     "best",
						"enum":        []string{"best", "cascade", "all"},
					},
				},
				"required": []string{"input"},
			},
		},
		{
			Name:        "search_prompts",
			Description: "Search existing prompts",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "Search query",
					},
					"limit": map[string]interface{}{
						"type":        "integer",
						"description": "Max results",
						"default":     10,
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "get_prompt",
			Description: "Get a specific prompt by ID",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"id": map[string]interface{}{
						"type":        "string",
						"description": "Prompt ID (UUID)",
					},
				},
				"required": []string{"id"},
			},
		},
		{
			Name:        "list_providers",
			Description: "List available AI providers",
			InputSchema: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:        "optimize_prompt",
			Description: "Optimize a prompt using AI-powered meta-prompting",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"prompt": map[string]interface{}{
						"type":        "string",
						"description": "Prompt to optimize",
					},
					"task": map[string]interface{}{
						"type":        "string",
						"description": "Task description for the prompt",
						"default":     "",
					},
					"persona": map[string]interface{}{
						"type":        "string",
						"description": "AI persona (code, writing, analysis, generic)",
						"default":     "code",
					},
					"target_model": map[string]interface{}{
						"type":        "string",
						"description": "Target model for optimization",
						"default":     "",
					},
					"max_iterations": map[string]interface{}{
						"type":        "integer",
						"description": "Maximum optimization iterations",
						"default":     5,
					},
					"target_score": map[string]interface{}{
						"type":        "number",
						"description": "Target quality score (1-10)",
						"default":     8.5,
					},
				},
				"required": []string{"prompt"},
			},
		},
		{
			Name:        "batch_generate",
			Description: "Generate multiple prompts in batch mode",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"inputs": map[string]interface{}{
						"type":        "array",
						"description": "Array of prompt inputs",
						"items": map[string]interface{}{
							"type": "object",
							"properties": map[string]interface{}{
								"id": map[string]interface{}{
									"type":        "string",
									"description": "Unique ID for this input",
								},
								"input": map[string]interface{}{
									"type":        "string",
									"description": "Input text or idea",
								},
								"phases": map[string]interface{}{
									"type":        "string",
									"description": "Comma-separated phases",
									"default":     "prima-materia,solutio,coagulatio",
								},
								"count": map[string]interface{}{
									"type":        "integer",
									"description": "Number of variants",
									"default":     3,
								},
								"persona": map[string]interface{}{
									"type":        "string",
									"description": "AI persona",
									"default":     "code",
								},
							},
							"required": []string{"input"},
						},
					},
					"workers": map[string]interface{}{
						"type":        "integer",
						"description": "Number of concurrent workers",
						"default":     3,
					},
				},
				"required": []string{"inputs"},
			},
		},
	}

	result := map[string]interface{}{
		"tools": tools,
	}

	s.sendResult(req.ID, result)
}

func (s *MCPServer) handleToolCall(ctx context.Context, req *MCPRequest) {
	// Parse tool call params
	params, ok := req.Params.(map[string]interface{})
	if !ok {
		s.sendError(req.ID, -32602, "Invalid params", "")
		return
	}

	toolName, ok := params["name"].(string)
	if !ok {
		s.sendError(req.ID, -32602, "Missing tool name", "")
		return
	}

	arguments := params["arguments"]

	// Route to appropriate tool handler
	switch toolName {
	case "generate_prompts":
		s.handleGeneratePrompts(ctx, req.ID, arguments)
	case "search_prompts":
		s.handleSearchPrompts(ctx, req.ID, arguments)
	case "get_prompt":
		s.handleGetPrompt(ctx, req.ID, arguments)
	case "list_providers":
		s.handleListProviders(req.ID)
	case "optimize_prompt":
		s.handleOptimizePrompt(ctx, req.ID, arguments)
	case "batch_generate":
		s.handleBatchGenerate(ctx, req.ID, arguments)
	default:
		s.sendError(req.ID, -32602, "Unknown tool", toolName)
	}
}

func (s *MCPServer) handleGeneratePrompts(ctx context.Context, id interface{}, args interface{}) {
	// Parse arguments
	argsMap, ok := args.(map[string]interface{})
	if !ok {
		s.sendToolError(id, "Invalid arguments")
		return
	}

	input, ok := argsMap["input"].(string)
	if !ok || input == "" {
		s.sendToolError(id, "Input is required")
		return
	}

	// Parse optional parameters
	phases := "prima-materia,solutio,coagulatio"
	if p, ok := argsMap["phases"].(string); ok {
		phases = p
	}

	count := 3
	if c, ok := argsMap["count"].(float64); ok {
		count = int(c)
	}

	persona := "code"
	if p, ok := argsMap["persona"].(string); ok {
		persona = p
	}

	temperature := 0.7
	if t, ok := argsMap["temperature"].(float64); ok {
		temperature = t
	}

	maxTokens := 2000
	if mt, ok := argsMap["max_tokens"].(float64); ok {
		maxTokens = int(mt)
	}

	optimize := false
	if o, ok := argsMap["optimize"].(bool); ok {
		optimize = o
	}

	phaseSelection := "best"
	if ps, ok := argsMap["phase_selection"].(string); ok {
		phaseSelection = ps
	}

	// Extract progress token if provided
	var progressToken interface{}
	if pt, ok := argsMap["progressToken"]; ok {
		progressToken = pt
	}

	// Enhanced logging for debugging
	s.logger.WithFields(logrus.Fields{
		"input":           input,
		"phases":          phases,
		"count":           count,
		"persona":         persona,
		"temperature":     temperature,
		"optimize":        optimize,
		"phase_selection": phaseSelection,
	}).Info("MCP: Starting prompt generation")

	// Convert phases string to slice
	phaseList := strings.Split(phases, ",")
	modelPhases := make([]models.Phase, len(phaseList))
	for i, p := range phaseList {
		trimmed := strings.TrimSpace(p)
		modelPhases[i] = models.Phase(trimmed)
		s.logger.WithField("phase", trimmed).Debug("Parsed phase from request")
	}

	// Apply self-learning enhancement if available
	enhancedInput := input
	if s.storage != nil && len(modelPhases) > 0 {
		// Get embedding provider
		available := s.registry.ListAvailable()
		var embedder providers.Provider
		for _, providerName := range available {
			p, err := s.registry.Get(providerName)
			if err == nil && p.SupportsEmbeddings() {
				embedder = p
				break
			}
		}

		if embedder != nil {
			enhancer := engine.NewHistoryEnhancer(s.storage, embedder)
			enhancedContext, err := enhancer.EnhanceWithHistory(ctx, input, modelPhases[0])
			if err == nil && enhancedContext != nil {
				// Format enhanced input with insights
				var insights []string
				if len(enhancedContext.SimilarPrompts) > 0 {
					insights = append(insights, fmt.Sprintf("Found %d similar historical prompts", len(enhancedContext.SimilarPrompts)))
				}
				if len(enhancedContext.ExtractedPatterns) > 0 {
					insights = append(insights, "Patterns: "+strings.Join(enhancedContext.ExtractedPatterns[:min(3, len(enhancedContext.ExtractedPatterns))], ", "))
				}
				if enhancedContext.HistoricalInsights != "" {
					insights = append(insights, enhancedContext.HistoricalInsights)
				}

				if len(insights) > 0 {
					enhancedInput = fmt.Sprintf("%s\n\n[Enhanced with historical insights: %s]", input, strings.Join(insights, "; "))
					s.logger.WithField("enhanced", true).Info("MCP: Input enhanced with historical data")
				}
			}
		}
	}

	// Create request
	promptReq := models.PromptRequest{
		Input:       enhancedInput,
		Phases:      modelPhases,
		Count:       count,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		SessionID:   uuid.New(),
	}

	// Build phase configs - for MCP, use openai as default provider for all phases
	// This is a simplification for the MCP server
	phaseConfigs := make([]models.PhaseConfig, len(modelPhases))
	defaultProvider := "openai"

	// Log available providers
	available := s.registry.ListAvailable()
	s.logger.WithField("available_providers", available).Debug("Available providers in registry")

	// Check if openai is available, otherwise use first available provider
	if !contains(available, defaultProvider) && len(available) > 0 {
		defaultProvider = available[0]
		s.logger.WithField("fallback_provider", defaultProvider).Info("OpenAI not available, using fallback provider")
	}

	for i, phase := range modelPhases {
		phaseConfigs[i] = models.PhaseConfig{
			Phase:    phase,
			Provider: defaultProvider,
		}
		s.logger.WithFields(logrus.Fields{
			"index":    i,
			"phase":    string(phase),
			"provider": defaultProvider,
		}).Debug("Phase provider configuration")
	}

	// Generate prompts
	opts := models.GenerateOptions{
		Request:        promptReq,
		PhaseConfigs:   phaseConfigs,
		UseParallel:    false,
		IncludeContext: true,
		Persona:        persona,
		Optimize:       optimize,
	}

	s.logger.WithFields(logrus.Fields{
		"phases":       modelPhases,
		"phaseConfigs": phaseConfigs,
	}).Debug("Calling engine.Generate")

	// Apply phase selection strategy
	var finalPrompts []models.Prompt
	var allPrompts []models.Prompt

	// Wrap generation with progress tracking if token provided
	generateFunc := func() error {
		switch phaseSelection {
		case "best":
			// Generate for each phase and select best
			for i, phase := range modelPhases {
				phaseOpts := opts
				phaseOpts.Request.Phases = []models.Phase{phase}

				// Update progress
				if progressToken != nil {
					tracker := NewProgressTracker(s.encoder)
					if i == 0 {
						tracker.Start(progressToken, "Generating prompts")
					}
					percentage := float64(i) / float64(len(modelPhases)) * 100
					tracker.Update(progressToken, fmt.Sprintf("Processing %s phase", phase), percentage)
				}

				s.logger.WithField("phase", phase).Info("MCP: Generating variants for phase")

				result, err := s.engine.Generate(ctx, phaseOpts)
				if err != nil {
					s.logger.WithError(err).Errorf("MCP: Failed to generate phase %s", phase)
					continue
				}

				allPrompts = append(allPrompts, result.Prompts...)

				// Select best from this phase using AI judge
				if len(result.Prompts) > 0 {
					best := s.selectBestPrompt(ctx, result.Prompts, phase, input, persona)
					finalPrompts = append(finalPrompts, best)
					s.logger.WithFields(logrus.Fields{
						"phase":    phase,
						"selected": best.ID.String(),
						"from":     len(result.Prompts),
					}).Info("MCP: Selected best prompt from phase")
				}
			}

		case "cascade":
			// Use output from each phase as input to next
			currentInput := enhancedInput
			for i, phase := range modelPhases {
				phaseOpts := opts
				phaseOpts.Request.Input = currentInput
				phaseOpts.Request.Phases = []models.Phase{phase}

				// Update progress
				if progressToken != nil {
					tracker := NewProgressTracker(s.encoder)
					if i == 0 {
						tracker.Start(progressToken, "Cascade prompt generation")
					}
					percentage := float64(i) / float64(len(modelPhases)) * 100
					tracker.Update(progressToken, fmt.Sprintf("Refining through %s phase", phase), percentage)
				}

				s.logger.WithField("phase", phase).Info("MCP: Cascade generation for phase")

				result, err := s.engine.Generate(ctx, phaseOpts)
				if err != nil {
					s.logger.WithError(err).Errorf("MCP: Failed to generate phase %s", phase)
					break
				}

				allPrompts = append(allPrompts, result.Prompts...)

				if len(result.Prompts) > 0 {
					best := s.selectBestPrompt(ctx, result.Prompts, phase, currentInput, persona)
					finalPrompts = append(finalPrompts, best)
					currentInput = best.Content // Use for next phase
				}
			}

		default: // "all"
			// Return all generated prompts (current behavior)
			if progressToken != nil {
				tracker := NewProgressTracker(s.encoder)
				tracker.Start(progressToken, "Generating all prompts")
			}

			result, err := s.engine.Generate(ctx, opts)
			if err != nil {
				return err
			}

			s.logger.WithField("count", len(result.Prompts)).Info("MCP: Generated prompts")
			finalPrompts = result.Prompts
			allPrompts = result.Prompts
		}

		// Complete progress
		if progressToken != nil {
			tracker := NewProgressTracker(s.encoder)
			tracker.End(progressToken, fmt.Sprintf("Generated %d prompts", len(finalPrompts)))
		}

		return nil
	}

	// Execute generation with error handling
	if err := generateFunc(); err != nil {
		s.sendToolError(id, fmt.Sprintf("Generation failed: %v", err))
		return
	}

	s.logger.WithFields(logrus.Fields{
		"total_generated": len(allPrompts),
		"final_prompts":   len(finalPrompts),
		"strategy":        phaseSelection,
	}).Info("MCP: Generation complete")

	// Format response
	prompts := make([]map[string]interface{}, len(finalPrompts))
	for i, p := range finalPrompts {
		prompts[i] = map[string]interface{}{
			"id":       p.ID.String(),
			"content":  p.Content,
			"phase":    string(p.Phase),
			"provider": p.Provider,
			"model":    p.Model,
		}
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Generated %d prompts total, selected %d final prompts using '%s' strategy:\n\n%s",
			len(allPrompts), len(finalPrompts), phaseSelection, formatPrompts(prompts)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"prompts":         prompts,
			"count":           len(prompts),
			"total_generated": len(allPrompts),
			"strategy":        phaseSelection,
			"optimized":       optimize,
		},
	}

	s.sendToolResult(id, toolResult)
}

func (s *MCPServer) handleSearchPrompts(ctx context.Context, id interface{}, args interface{}) {
	// Parse arguments
	argsMap, ok := args.(map[string]interface{})
	if !ok {
		s.sendToolError(id, "Invalid arguments")
		return
	}

	query, ok := argsMap["query"].(string)
	if !ok || query == "" {
		s.sendToolError(id, "Query is required")
		return
	}

	limit := 10
	if l, ok := argsMap["limit"].(float64); ok {
		limit = int(l)
	}

	// For now, return high quality historical prompts
	// TODO: Implement actual search when storage API is updated
	prompts, err := s.storage.GetHighQualityHistoricalPrompts(ctx, limit)
	if err != nil {
		s.sendToolError(id, fmt.Sprintf("Search failed: %v", err))
		return
	}

	// Filter by query (simple substring match)
	filtered := make([]*models.Prompt, 0)
	for _, p := range prompts {
		if strings.Contains(strings.ToLower(p.Content), strings.ToLower(query)) ||
			strings.Contains(strings.ToLower(p.OriginalInput), strings.ToLower(query)) {
			filtered = append(filtered, p)
		}
	}

	// Format response
	results := make([]map[string]interface{}, len(filtered))
	for i, p := range filtered {
		results[i] = map[string]interface{}{
			"id":       p.ID.String(),
			"content":  p.Content,
			"phase":    string(p.Phase),
			"provider": p.Provider,
			"input":    p.OriginalInput,
		}
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Found %d prompts matching '%s'", len(results), query),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"prompts": results,
			"count":   len(results),
			"query":   query,
		},
	}

	s.sendToolResult(id, toolResult)
}

func (s *MCPServer) handleGetPrompt(ctx context.Context, id interface{}, args interface{}) {
	// Parse arguments
	argsMap, ok := args.(map[string]interface{})
	if !ok {
		s.sendToolError(id, "Invalid arguments")
		return
	}

	promptID, ok := argsMap["id"].(string)
	if !ok || promptID == "" {
		s.sendToolError(id, "Prompt ID is required")
		return
	}

	// Parse UUID
	uuid, err := uuid.Parse(promptID)
	if err != nil {
		s.sendToolError(id, "Invalid prompt ID format")
		return
	}

	// Get prompt
	prompt, err := s.storage.GetPromptByID(ctx, uuid)
	if err != nil {
		s.sendToolError(id, fmt.Sprintf("Failed to get prompt: %v", err))
		return
	}

	// Format response
	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Prompt %s:\n\n%s", prompt.ID, prompt.Content),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"prompt": map[string]interface{}{
				"id":          prompt.ID.String(),
				"content":     prompt.Content,
				"phase":       string(prompt.Phase),
				"provider":    prompt.Provider,
				"model":       prompt.Model,
				"temperature": prompt.Temperature,
				"max_tokens":  prompt.MaxTokens,
				"tags":        prompt.Tags,
				"created_at":  prompt.CreatedAt,
				"input":       prompt.OriginalInput,
			},
		},
	}

	s.sendToolResult(id, toolResult)
}

func (s *MCPServer) handleListProviders(id interface{}) {
	available := s.registry.ListAvailable()
	embeddingCapable := s.registry.ListEmbeddingCapableProviders()

	// Create provider list
	providers := make([]map[string]interface{}, 0)
	for _, name := range available {
		provider := map[string]interface{}{
			"name":                name,
			"available":           true,
			"supports_embeddings": contains(embeddingCapable, name),
		}
		providers = append(providers, provider)
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Available providers: %d", len(providers)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"providers": providers,
			"count":     len(providers),
		},
	}

	s.sendToolResult(id, toolResult)
}

func (s *MCPServer) handleOptimizePrompt(ctx context.Context, id interface{}, args interface{}) {
	// Parse arguments
	argsMap, ok := args.(map[string]interface{})
	if !ok {
		s.sendToolError(id, "Invalid arguments")
		return
	}

	prompt, ok := argsMap["prompt"].(string)
	if !ok || prompt == "" {
		s.sendToolError(id, "Prompt is required")
		return
	}

	// Parse optional parameters
	task := ""
	if t, ok := argsMap["task"].(string); ok {
		task = t
	}

	persona := "code"
	if p, ok := argsMap["persona"].(string); ok {
		persona = p
	}

	targetModel := ""
	if tm, ok := argsMap["target_model"].(string); ok {
		targetModel = tm
	}

	maxIterations := 5
	if mi, ok := argsMap["max_iterations"].(float64); ok {
		maxIterations = int(mi)
	}

	targetScore := 8.5
	if ts, ok := argsMap["target_score"].(float64); ok {
		targetScore = ts
	}

	// Get providers
	available := s.registry.ListAvailable()
	if len(available) == 0 {
		s.sendToolError(id, "No providers available")
		return
	}

	providerName := viper.GetString("generation.default_provider")
	if providerName == "" {
		providerName = available[0]
	}

	provider, err := s.registry.Get(providerName)
	if err != nil {
		s.sendToolError(id, fmt.Sprintf("Provider '%s' not available: %v", providerName, err))
		return
	}

	judgeProviderName := viper.GetString("optimize.judge_provider")
	if judgeProviderName == "" {
		judgeProviderName = providerName
	}

	judgeProvider, err := s.registry.Get(judgeProviderName)
	if err != nil {
		judgeProvider = provider
	}

	// Create optimizer
	metaOptimizer := optimizer.NewMetaPromptOptimizer(provider, judgeProvider, s.storage, s.registry)

	// Detect model family
	modelFamily := models.ModelFamilyGeneric
	if targetModel != "" {
		modelFamily = models.DetectModelFamily(targetModel)
	}

	// Create optimization request
	request := &optimizer.OptimizationRequest{
		OriginalPrompt:  prompt,
		TaskDescription: task,
		Examples:        []optimizer.OptimizationExample{},
		Constraints:     []string{"Maintain clarity", "Preserve intent", "Improve effectiveness"},
		ModelFamily:     modelFamily,
		PersonaType:     models.PersonaType(persona),
		MaxIterations:   maxIterations,
		TargetScore:     targetScore,
		OptimizationGoals: map[string]float64{
			"factual_accuracy": 0.3,
			"code_quality":     0.3,
			"helpfulness":      0.2,
			"conciseness":      0.2,
		},
	}

	// Run optimization
	result, err := metaOptimizer.OptimizePrompt(ctx, request)
	if err != nil {
		s.sendToolError(id, fmt.Sprintf("Optimization failed: %v", err))
		return
	}

	// Format response
	iterations := make([]map[string]interface{}, len(result.Iterations))
	for i, iter := range result.Iterations {
		// Check if score needs to be converted to out of 10
		score := iter.Score
		if score <= 1.0 {
			score = score * 10.0
		}
		iterations[i] = map[string]interface{}{
			"iteration": iter.Iteration,
			"prompt":    iter.Prompt,
			"score":     score,
			"reasoning": iter.ChangeReasoning,
		}
	}

	// Convert scores to out of 10 if needed
	finalScore := result.FinalScore
	if finalScore <= 1.0 {
		finalScore = finalScore * 10.0
	}
	originalScore := result.OriginalScore
	if originalScore <= 1.0 {
		originalScore = originalScore * 10.0
	}
	improvement := result.Improvement
	if result.FinalScore <= 1.0 && result.OriginalScore <= 1.0 {
		improvement = improvement * 10.0
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Optimization complete!\n\nOriginal prompt:\n%s\n\nOptimized prompt:\n%s\n\nFinal score: %.1f/10\nImprovement: %.1f\nIterations: %d",
			prompt,
			result.OptimizedPrompt,
			finalScore,
			improvement,
			len(result.Iterations)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"original_prompt":  prompt,
			"optimized_prompt": result.OptimizedPrompt,
			"original_score":   originalScore,
			"final_score":      finalScore,
			"improvement":      improvement,
			"iterations":       iterations,
			"total_iterations": len(result.Iterations),
		},
	}

	s.sendToolResult(id, toolResult)
}

func (s *MCPServer) handleBatchGenerate(ctx context.Context, id interface{}, args interface{}) {
	// Parse arguments
	argsMap, ok := args.(map[string]interface{})
	if !ok {
		s.sendToolError(id, "Invalid arguments")
		return
	}

	inputsRaw, ok := argsMap["inputs"].([]interface{})
	if !ok || len(inputsRaw) == 0 {
		s.sendToolError(id, "Inputs array is required")
		return
	}

	workers := 3
	if w, ok := argsMap["workers"].(float64); ok {
		workers = int(w)
	}

	// Extract progress token if provided
	var progressToken interface{}
	if pt, ok := argsMap["progressToken"]; ok {
		progressToken = pt
	}

	// Parse batch inputs
	var batchInputs []BatchInput
	for _, inputRaw := range inputsRaw {
		input, ok := inputRaw.(map[string]interface{})
		if !ok {
			continue
		}

		batchInput := BatchInput{
			Input:   "",
			Phases:  "prima-materia,solutio,coagulatio",
			Count:   3,
			Persona: "code",
		}

		if id, ok := input["id"].(string); ok {
			batchInput.ID = id
		}
		if text, ok := input["input"].(string); ok {
			batchInput.Input = text
		}
		if phases, ok := input["phases"].(string); ok {
			batchInput.Phases = phases
		}
		if count, ok := input["count"].(float64); ok {
			batchInput.Count = int(count)
		}
		if persona, ok := input["persona"].(string); ok {
			batchInput.Persona = persona
		}

		if batchInput.Input != "" {
			batchInputs = append(batchInputs, batchInput)
		}
	}

	if len(batchInputs) == 0 {
		s.sendToolError(id, "No valid inputs provided")
		return
	}

	// Process batch with workers
	results := make([]map[string]interface{}, 0)
	resultsChan := make(chan map[string]interface{}, len(batchInputs))
	errorsChan := make(chan error, len(batchInputs))

	// Initialize progress tracking
	var tracker *ProgressTracker
	if progressToken != nil {
		tracker = NewProgressTracker(s.encoder)
		tracker.Start(progressToken, fmt.Sprintf("Processing %d prompts", len(batchInputs)))
	}

	// Track completed items for progress
	completedCount := 0
	completedMutex := &sync.Mutex{}

	// Create worker pool
	workChan := make(chan BatchInput, len(batchInputs))
	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for input := range workChan {
				// Process single input
				phases := strings.Split(input.Phases, ",")
				modelPhases := make([]models.Phase, len(phases))
				for j, p := range phases {
					modelPhases[j] = models.Phase(strings.TrimSpace(p))
				}

				req := models.PromptRequest{
					Input:       input.Input,
					Phases:      modelPhases,
					Count:       input.Count,
					Temperature: 0.7,
					MaxTokens:   2000,
				}

				// Build phase configs
				phaseConfigs := make([]models.PhaseConfig, len(modelPhases))
				defaultProvider := "openai"
				available := s.registry.ListAvailable()
				if !contains(available, defaultProvider) && len(available) > 0 {
					defaultProvider = available[0]
				}

				for j, phase := range modelPhases {
					phaseConfigs[j] = models.PhaseConfig{
						Phase:    phase,
						Provider: defaultProvider,
					}
				}

				opts := models.GenerateOptions{
					Request:        req,
					PhaseConfigs:   phaseConfigs,
					UseParallel:    false,
					IncludeContext: true,
					Persona:        input.Persona,
				}

				result, err := s.engine.Generate(ctx, opts)
				if err != nil {
					s.logger.WithError(err).WithField("input_id", input.ID).Error("Batch generation failed for input")
					errorsChan <- fmt.Errorf("input %s: %v", input.ID, err)
					continue
				}

				// Format result
				prompts := make([]map[string]interface{}, len(result.Prompts))
				for k, p := range result.Prompts {
					prompts[k] = map[string]interface{}{
						"id":       p.ID.String(),
						"content":  p.Content,
						"phase":    string(p.Phase),
						"provider": p.Provider,
						"model":    p.Model,
					}
				}

				resultsChan <- map[string]interface{}{
					"id":      input.ID,
					"input":   input.Input,
					"prompts": prompts,
					"count":   len(prompts),
				}

				// Update progress
				if tracker != nil {
					completedMutex.Lock()
					completedCount++
					percentage := float64(completedCount) / float64(len(batchInputs)) * 100
					tracker.Update(progressToken, fmt.Sprintf("Completed %d/%d prompts", completedCount, len(batchInputs)), percentage)
					completedMutex.Unlock()
				}
			}
		}()
	}

	// Send work to workers
	for _, input := range batchInputs {
		workChan <- input
	}
	close(workChan)

	// Wait for workers to complete
	wg.Wait()
	close(resultsChan)
	close(errorsChan)

	// Collect results and errors in goroutines
	var resultsDone sync.WaitGroup
	resultsDone.Add(2)

	go func() {
		defer resultsDone.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	var errors []string
	go func() {
		defer resultsDone.Done()
		for err := range errorsChan {
			errors = append(errors, err.Error())
		}
	}()

	resultsDone.Wait()

	// Complete progress tracking
	if tracker != nil {
		tracker.End(progressToken, fmt.Sprintf("Processed %d prompts with %d errors", len(results), len(errors)))
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Batch generation complete!\n\nProcessed: %d inputs\nSuccessful: %d\nErrors: %d",
			len(batchInputs),
			len(results),
			len(errors)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"results":      results,
			"total_inputs": len(batchInputs),
			"successful":   len(results),
			"errors":       errors,
		},
	}

	s.sendToolResult(id, toolResult)
}

// Helper functions
func (s *MCPServer) sendResult(id interface{}, result interface{}) {
	resp := MCPResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	s.sendResponse(resp)
}

func (s *MCPServer) sendError(id interface{}, code int, message string, data string) {
	resp := MCPResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &MCPError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
	s.sendResponse(resp)
}

func (s *MCPServer) sendToolResult(id interface{}, result MCPToolResult) {
	s.sendResult(id, result)
}

func (s *MCPServer) sendToolError(id interface{}, message string) {
	result := MCPToolResult{
		Content: []MCPContent{
			{
				Type: "text",
				Text: fmt.Sprintf("Error: %s", message),
			},
		},
		IsError: true,
	}
	s.sendResult(id, result)
}

func (s *MCPServer) sendResponse(resp MCPResponse) {
	data, err := json.Marshal(resp)
	if err != nil {
		s.logger.WithError(err).Error("Failed to marshal response")
		return
	}

	if _, err := s.writer.Write(data); err != nil {
		s.logger.WithError(err).Error("Failed to write response")
		return
	}

	if err := s.writer.WriteByte('\n'); err != nil {
		s.logger.WithError(err).Error("Failed to write newline")
		return
	}

	if err := s.writer.Flush(); err != nil {
		s.logger.WithError(err).Error("Failed to flush response")
		return
	}
}

func formatPrompts(prompts []map[string]interface{}) string {
	var result strings.Builder
	for i, p := range prompts {
		result.WriteString(fmt.Sprintf("%d. [%s] %s\n", i+1, p["phase"], p["id"]))
	}
	return result.String()
}

func (s *MCPServer) selectBestPrompt(ctx context.Context, prompts []models.Prompt, phase models.Phase, taskDesc string, persona string) models.Prompt {
	if len(prompts) == 1 {
		return prompts[0]
	}

	// Try to use AI judge if we have a provider
	var judgeProvider providers.Provider
	available := s.registry.ListAvailable()
	for _, providerName := range available {
		p, err := s.registry.Get(providerName)
		if err == nil {
			judgeProvider = p
			break
		}
	}

	if judgeProvider != nil {
		judge := NewPromptJudge(judgeProvider, s.logger)
		criteria := JudgeCriteria{
			TaskDescription:  taskDesc,
			Persona:          persona,
			DesiredQualities: []string{"clarity", "completeness", "relevance to " + string(phase) + " phase"},
		}

		selected, err := judge.SelectBest(ctx, prompts, criteria)
		if err == nil {
			s.logger.WithFields(logrus.Fields{
				"selected_id": selected.ID.String(),
				"phase":       phase,
			}).Debug("AI judge selected best prompt")
			return selected
		}
		s.logger.WithError(err).Warn("AI judge failed, using fallback")
	}

	// Fallback: use ranker if available
	if s.ranker != nil {
		rankings, err := s.ranker.RankPrompts(ctx, prompts, taskDesc)
		if err == nil && len(rankings) > 0 {
			// Find highest scoring prompt
			var bestIdx int
			var bestScore float64
			for i, ranking := range rankings {
				if ranking.Score > bestScore {
					bestScore = ranking.Score
					bestIdx = i
				}
			}
			return prompts[bestIdx]
		}
	}

	// Final fallback: return first prompt
	return prompts[0]
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func setupLogger() *logrus.Logger {
	logger := logrus.New()
	// CRITICAL: Set output to stderr for MCP compatibility
	logger.SetOutput(os.Stderr)
	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	level, err := logrus.ParseLevel(viper.GetString("log_level"))
	if err != nil {
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)

	return logger
}

func registerProviders(registry *providers.Registry, logger *logrus.Logger) error {
	// Register providers based on configuration
	if apiKey := viper.GetString("providers.openai.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.openai.model"),
		}
		openai := providers.NewOpenAIProvider(config)
		_ = registry.Register(providers.ProviderOpenAI, openai)
		logger.Info("Registered OpenAI provider")
	}

	if apiKey := viper.GetString("providers.anthropic.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.anthropic.model"),
		}
		anthropic := providers.NewAnthropicProvider(config)
		_ = registry.Register(providers.ProviderAnthropic, anthropic)
		logger.Info("Registered Anthropic provider")
	}

	if apiKey := viper.GetString("providers.google.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.google.model"),
		}
		google := providers.NewGoogleProvider(config)
		_ = registry.Register(providers.ProviderGoogle, google)
		logger.Info("Registered Google provider")
	}

	if apiKey := viper.GetString("providers.grok.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.grok.model"),
		}
		grok := providers.NewGrokProvider(config)
		_ = registry.Register(providers.ProviderGrok, grok)
		logger.Info("Registered Grok provider")
	}

	// Always register Ollama if base URL is configured
	if baseURL := viper.GetString("providers.ollama.base_url"); baseURL != "" {
		config := providers.Config{
			BaseURL: baseURL,
			Model:   viper.GetString("providers.ollama.model"),
		}
		ollama := providers.NewOllamaProvider(config)
		_ = registry.Register(providers.ProviderOllama, ollama)
		logger.Info("Registered Ollama provider")
	}

	if apiKey := viper.GetString("providers.openrouter.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.openrouter.model"),
		}
		openrouter := providers.NewOpenRouterProvider(config)
		_ = registry.Register(providers.ProviderOpenRouter, openrouter)
		logger.Info("Registered OpenRouter provider")
	}

	return nil
}
