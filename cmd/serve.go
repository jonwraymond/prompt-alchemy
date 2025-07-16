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

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer store.Close()

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
	server := &MCPServer{
		storage:  store,
		registry: registry,
		engine:   engine,
		ranker:   ranker,
		learner:  learner,
		logger:   logger,
		reader:   bufio.NewReader(os.Stdin),
		writer:   bufio.NewWriter(os.Stdout),
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

	// Convert phases string to slice
	phaseList := strings.Split(phases, ",")
	modelPhases := make([]models.Phase, len(phaseList))
	for i, p := range phaseList {
		modelPhases[i] = models.Phase(strings.TrimSpace(p))
	}

	// Create request
	promptReq := models.PromptRequest{
		Input:       input,
		Phases:      modelPhases,
		Count:       count,
		Temperature: 0.7,
		MaxTokens:   2000,
		SessionID:   uuid.New(),
	}

	// Generate prompts
	opts := models.GenerateOptions{
		Request:        promptReq,
		PhaseConfigs:   []models.PhaseConfig{},
		UseParallel:    false,
		IncludeContext: true,
		Persona:        persona,
	}

	result, err := s.engine.Generate(ctx, opts)
	if err != nil {
		s.sendToolError(id, fmt.Sprintf("Generation failed: %v", err))
		return
	}

	// Format response
	prompts := make([]map[string]interface{}, len(result.Prompts))
	for i, p := range result.Prompts {
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
		Text: fmt.Sprintf("Generated %d prompts:\n\n%s", len(prompts), formatPrompts(prompts)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"prompts": prompts,
			"count":   len(prompts),
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
		iterations[i] = map[string]interface{}{
			"iteration": iter.Iteration,
			"prompt":    iter.Prompt,
			"score":     iter.Score,
			"reasoning": iter.ChangeReasoning,
		}
	}

	content := MCPContent{
		Type: "text",
		Text: fmt.Sprintf("Optimization complete!\n\nOriginal prompt:\n%s\n\nOptimized prompt:\n%s\n\nFinal score: %.1f/10\nImprovement: %.1f\nIterations: %d",
			prompt,
			result.OptimizedPrompt,
			result.FinalScore,
			result.Improvement,
			len(result.Iterations)),
	}

	toolResult := MCPToolResult{
		Content: []MCPContent{content},
		Metadata: map[string]interface{}{
			"original_prompt":  prompt,
			"optimized_prompt": result.OptimizedPrompt,
			"original_score":   result.OriginalScore,
			"final_score":      result.FinalScore,
			"improvement":      result.Improvement,
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

				opts := models.GenerateOptions{
					Request:        req,
					PhaseConfigs:   []models.PhaseConfig{},
					UseParallel:    false,
					IncludeContext: true,
					Persona:        input.Persona,
				}

				result, err := s.engine.Generate(ctx, opts)
				if err != nil {
					errorsChan <- err
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

	// Collect results
	for result := range resultsChan {
		results = append(results, result)
	}

	// Check for errors
	var errors []string
	for err := range errorsChan {
		errors = append(errors, err.Error())
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
		registry.Register(providers.ProviderOpenAI, openai)
		logger.Info("Registered OpenAI provider")
	}

	if apiKey := viper.GetString("providers.anthropic.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.anthropic.model"),
		}
		anthropic := providers.NewAnthropicProvider(config)
		registry.Register(providers.ProviderAnthropic, anthropic)
		logger.Info("Registered Anthropic provider")
	}

	if apiKey := viper.GetString("providers.google.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.google.model"),
		}
		google := providers.NewGoogleProvider(config)
		registry.Register(providers.ProviderGoogle, google)
		logger.Info("Registered Google provider")
	}

	if apiKey := viper.GetString("providers.grok.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.grok.model"),
		}
		grok := providers.NewGrokProvider(config)
		registry.Register(providers.ProviderGrok, grok)
		logger.Info("Registered Grok provider")
	}

	// Always register Ollama if base URL is configured
	if baseURL := viper.GetString("providers.ollama.base_url"); baseURL != "" {
		config := providers.Config{
			BaseURL: baseURL,
			Model:   viper.GetString("providers.ollama.model"),
		}
		ollama := providers.NewOllamaProvider(config)
		registry.Register(providers.ProviderOllama, ollama)
		logger.Info("Registered Ollama provider")
	}

	if apiKey := viper.GetString("providers.openrouter.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey: apiKey,
			Model:  viper.GetString("providers.openrouter.model"),
		}
		openrouter := providers.NewOpenRouterProvider(config)
		registry.Register(providers.ProviderOpenRouter, openrouter)
		logger.Info("Registered OpenRouter provider")
	}

	return nil
}
