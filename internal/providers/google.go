package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
)

const (
	// DefaultGeminiModel is the default model for Google Gemini
	DefaultGeminiModel = "gemini-2.5-flash"

	// DefaultSafetyThreshold is the default safety threshold for Google Gemini
	DefaultSafetyThreshold = "BLOCK_MEDIUM_AND_ABOVE"

	// DefaultTimeout is the default HTTP timeout for Google Gemini
	DefaultTimeout = 60 * time.Second

	// GeminiAPIBaseURL is the base URL for Google Gemini API
	GeminiAPIBaseURL = "https://generativelanguage.googleapis.com/v1beta/models"
)

// GoogleProvider implements the Provider interface for Google Gemini using HTTP API
type GoogleProvider struct {
	config Config
	client *http.Client
}

// NewGoogleProvider creates a new Google provider
func NewGoogleProvider(config Config) *GoogleProvider {
	timeout := time.Duration(config.Timeout) * time.Second
	if timeout == 0 {
		timeout = DefaultTimeout
	}

	return &GoogleProvider{
		config: config,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// Generate creates a completion using the Gemini REST API
func (p *GoogleProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	logger := log.GetLogger()
	logger.Debug("GoogleProvider: Generating content")

	// Build the request with intelligent token management
	maxTokens := p.getMaxTokens(req.MaxTokens)
	model := p.getModelName(p.config.Model)
	logger.Debugf("Using model: %s, max tokens: %d", model, maxTokens)

	// Build optimized prompt within token constraints
	prompt := p.buildOptimizedPrompt(req, maxTokens)
	logger.Debugf("Optimized prompt length: %d", len(prompt))

	// Create and send request
	response, err := p.sendAPIRequest(ctx, prompt, maxTokens, model, req.Temperature)
	if err != nil {
		return nil, err
	}

	// Process response
	return p.processAPIResponse(response, prompt, maxTokens)
}

// buildOptimizedPrompt creates an optimized prompt within token constraints
func (p *GoogleProvider) buildOptimizedPrompt(req GenerateRequest, maxTokens int) string {
	var prompt strings.Builder

	// Conservative input budget - leave plenty of room for output
	inputBudget := maxTokens / 3 // Use 1/3 for input, 2/3 for output

	// System prompt (highest priority)
	if req.SystemPrompt != "" {
		systemTokens := len(strings.Fields(req.SystemPrompt))
		if systemTokens < inputBudget {
			prompt.WriteString(req.SystemPrompt)
			prompt.WriteString("\n\n")
			inputBudget -= systemTokens
		}
	}

	// Main prompt (truncate if needed)
	promptTokens := len(strings.Fields(req.Prompt))
	if promptTokens <= inputBudget {
		prompt.WriteString(req.Prompt)
	} else {
		// Truncate to fit budget
		words := strings.Fields(req.Prompt)
		if inputBudget > 10 { // Ensure we have meaningful content
			truncated := strings.Join(words[:inputBudget], " ")
			prompt.WriteString(truncated)
		} else {
			// Ultra-minimal mode
			prompt.WriteString(p.createMinimalPrompt(req.Prompt))
		}
	}

	return prompt.String()
}

// sendAPIRequest handles the HTTP request/response cycle
func (p *GoogleProvider) sendAPIRequest(ctx context.Context, prompt string, maxTokens int, model string, temperature float64) (*googleResponse, error) {
	logger := log.GetLogger()

	// Create request payload
	payload := p.createRequestPayload(prompt, maxTokens, temperature)

	// Convert to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		logger.WithError(err).Error("Failed to marshal request payload")
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Build API URL
	url := fmt.Sprintf("%s/%s:generateContent?key=%s",
		GeminiAPIBaseURL, model, p.config.APIKey)
	// Log sanitized URL without exposing API key
	sanitizedURL := fmt.Sprintf("%s/%s:generateContent?key=[REDACTED]",
		GeminiAPIBaseURL, model)
	logger.Debugf("API URL: %s", sanitizedURL)

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		logger.WithError(err).Error("Failed to create HTTP request")
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Make the request
	logger.Debug("Making HTTP request to Google API")
	resp, err := p.client.Do(httpReq)
	if err != nil {
		logger.WithError(err).Error("HTTP request failed")
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close response body")
		}
	}()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.WithError(err).Error("Failed to read response body")
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	logger.Debugf("Received response with status code: %d", resp.StatusCode)
	// Handle non-200 responses
	if resp.StatusCode != http.StatusOK {
		return nil, p.handleAPIError(resp.StatusCode, body, maxTokens)
	}

	// Parse response
	var response googleResponse
	if err := json.Unmarshal(body, &response); err != nil {
		logger.WithError(err).Error("Failed to parse JSON response from Google API")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &response, nil
}

// createRequestPayload creates the API request payload
func (p *GoogleProvider) createRequestPayload(prompt string, maxTokens int, temperature float64) map[string]interface{} {
	return map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{
						"text": prompt,
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": maxTokens,
			"temperature":     p.getTemperature(temperature),
		},
		"safetySettings": p.createSafetySettings(),
	}
}

// createSafetySettings creates safety settings with configurable threshold
func (p *GoogleProvider) createSafetySettings() []map[string]interface{} {
	threshold := p.config.SafetyThreshold
	if threshold == "" {
		threshold = DefaultSafetyThreshold
	}

	return []map[string]interface{}{
		{
			"category":  "HARM_CATEGORY_HARASSMENT",
			"threshold": threshold,
		},
		{
			"category":  "HARM_CATEGORY_HATE_SPEECH",
			"threshold": threshold,
		},
		{
			"category":  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
			"threshold": threshold,
		},
		{
			"category":  "HARM_CATEGORY_DANGEROUS_CONTENT",
			"threshold": threshold,
		},
	}
}

// processAPIResponse processes the API response and extracts content
func (p *GoogleProvider) processAPIResponse(response *googleResponse, prompt string, maxTokens int) (*GenerateResponse, error) {
	logger := log.GetLogger()

	// Check for prompt blocking
	if response.PromptFeedback.BlockReason != "" {
		logger.WithField("reason", response.PromptFeedback.BlockReason).Warn("Prompt blocked by Google safety filters")
		return nil, fmt.Errorf("prompt blocked by safety filters: %s\n"+
			"💡 Suggestion: Rephrase your prompt to avoid potentially sensitive content",
			response.PromptFeedback.BlockReason)
	}

	// Check if we have candidates
	if len(response.Candidates) == 0 {
		logger.Warn("No response candidates generated")
		return nil, fmt.Errorf("no response candidates generated")
	}

	candidate := response.Candidates[0]

	// Extract content
	var content strings.Builder
	for _, part := range candidate.Content.Parts {
		content.WriteString(part.Text)
	}

	contentStr := content.String()
	logger.Debugf("Generated content length: %d", len(contentStr))

	// Handle finish reason
	contentStr, err := p.handleFinishReason(candidate.FinishReason, contentStr, maxTokens)
	if err != nil {
		logger.WithError(err).Errorf("Failed to handle finish reason: %s", candidate.FinishReason)
		return nil, err
	}

	// Calculate approximate token usage
	inputTokens := len(strings.Fields(prompt))
	outputTokens := len(strings.Fields(contentStr))
	totalTokens := inputTokens + outputTokens
	logger.Debugf("Token usage: input=%d, output=%d, total=%d", inputTokens, outputTokens, totalTokens)

	return &GenerateResponse{
		Content:    contentStr,
		TokensUsed: totalTokens,
		Model:      p.getModelName(p.config.Model),
	}, nil
}

// googleResponse represents the API response structure
type googleResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
	PromptFeedback struct {
		BlockReason string `json:"blockReason"`
	} `json:"promptFeedback"`
}

// createMinimalPrompt creates ultra-short prompts for extreme constraints
func (p *GoogleProvider) createMinimalPrompt(originalPrompt string) string {
	prompt := strings.ToLower(originalPrompt)

	// Extract key intent
	if strings.Contains(prompt, "function") || strings.Contains(prompt, "code") {
		return "Create a simple function."
	}
	if strings.Contains(prompt, "api") {
		return "Design basic API."
	}
	if strings.Contains(prompt, "document") {
		return "Write documentation."
	}
	if strings.Contains(prompt, "test") {
		return "Create tests."
	}
	if strings.Contains(prompt, "security") {
		return "Security best practices."
	}

	// Generic fallback
	return "Provide helpful response."
}

// handleAPIError provides specific guidance based on API errors
func (p *GoogleProvider) handleAPIError(statusCode int, body []byte, maxTokens int) error {
	logger := log.GetLogger()
	logger.Errorf("Google API returned error status code: %d", statusCode)
	var errorResponse struct {
		Error struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
			Status  string `json:"status"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &errorResponse); err != nil {
		logger.Warnf("Failed to unmarshal error response: %v", err)
	}

	message := errorResponse.Error.Message
	if message == "" {
		message = string(body)
	}

	logger.Errorf("Google API error message: %s", message)

	switch statusCode {
	case 400:
		if strings.Contains(message, "TOKEN") || strings.Contains(message, "INVALID_ARGUMENT") {
			logger.Warnf("Token limit exceeded or invalid argument: %s", message)
			return fmt.Errorf("google API request failed (token limit: %d): %s\n"+
				"💡 Suggestion: Try shorter prompts or reduce max_tokens parameter", maxTokens, message)
		}
		return fmt.Errorf("google API bad request: %s", message)
	case 401:
		logger.Error("Google API authentication failed: Invalid API key")
		return fmt.Errorf("google API authentication failed: invalid API key")
	case 403:
		logger.Errorf("Google API access denied: %s", message)
		return fmt.Errorf("google API access denied: %s", message)
	case 429:
		logger.Warnf("Google API rate limit exceeded: %s", message)
		return fmt.Errorf("google API rate limit exceeded: %s\n"+
			"💡 Suggestion: Wait a moment and try again", message)
	case 500, 502, 503, 504:
		logger.Errorf("Google API server error: %s", message)
		return fmt.Errorf("google API server error: %s\n"+
			"💡 Suggestion: Try again in a few moments", message)
	default:
		logger.Errorf("Unknown Google API error (%d): %s", statusCode, message)
		return fmt.Errorf("google API error (%d): %s", statusCode, message)
	}
}

// handleFinishReason processes the response based on finish reason
func (p *GoogleProvider) handleFinishReason(finishReason, content string, maxTokens int) (string, error) {
	switch finishReason {
	case "STOP":
		return content, nil
	case "MAX_TOKENS":
		if content != "" {
			return content + "\n\n[Response truncated due to token limit]", nil
		}
		return "", fmt.Errorf("response hit token limit (%d) before generating content\n"+
			"💡 Suggestion: Try a shorter prompt or increase max_tokens", maxTokens)
	case "SAFETY":
		return "", fmt.Errorf("response blocked by safety filters\n" +
			"💡 Suggestion: Rephrase your prompt to avoid potentially sensitive content")
	case "RECITATION":
		return "", fmt.Errorf("response blocked due to potential copyright issues\n" +
			"💡 Suggestion: Request original content rather than potential copyrighted material")
	default:
		if content != "" {
			return content, nil
		}
		return "", fmt.Errorf("generation stopped unexpectedly (reason: %s)", finishReason)
	}
}

// getModelName maps our model names to Google's model names
func (p *GoogleProvider) getModelName(model string) string {
	if model == "" {
		return DefaultGeminiModel // Safe default
	}

	switch model {
	case "gemini-pro":
		return "gemini-1.5-pro"
	case "gemini-flash":
		return "gemini-1.5-flash"
	case "gemini-2-flash":
		return "gemini-2.0-flash-exp"
	case "gemini-2.5-flash":
		return DefaultGeminiModel
	default:
		return DefaultGeminiModel
	}
}

// getMaxTokens applies conservative token limits based on research
func (p *GoogleProvider) getMaxTokens(requested int) int {
	// Get configurable limits with defaults
	maxProTokens := p.config.MaxProTokens
	if maxProTokens == 0 {
		maxProTokens = DefaultMaxProTokens // Conservative for Gemini Pro
	}

	maxFlashTokens := p.config.MaxFlashTokens
	if maxFlashTokens == 0 {
		maxFlashTokens = DefaultMaxFlashTokens // Conservative for Gemini Flash
	}

	defaultTokens := p.config.DefaultTokens
	if defaultTokens == 0 {
		defaultTokens = DefaultMaxTokens // Ultra-safe default
	}

	if requested <= 0 {
		return defaultTokens
	}

	// Apply model-specific limits
	modelName := p.getModelName(p.config.Model)
	var maxAllowed int

	if strings.Contains(modelName, "pro") {
		maxAllowed = maxProTokens
	} else {
		maxAllowed = maxFlashTokens
	}

	if requested > maxAllowed {
		return maxAllowed
	}

	return requested
}

// getTemperature ensures temperature is within valid range
func (p *GoogleProvider) getTemperature(temp float64) float64 {
	if temp <= 0 {
		return 0.7 // Default
	}

	// Get configurable max temperature
	maxTemp := p.config.MaxTemperature
	if maxTemp == 0 {
		maxTemp = DefaultMaxTemperature // Default Google API limit
	}

	// Clamp to valid range [0, maxTemp]
	if temp > maxTemp {
		return maxTemp
	}

	return temp
}

// GetEmbedding returns embeddings for the given text
func (p *GoogleProvider) GetEmbedding(ctx context.Context, text string, registry *Registry) ([]float32, error) {
	return getStandardizedEmbedding(ctx, text, registry)
}

// Name returns the provider name
func (p *GoogleProvider) Name() string {
	return ProviderGoogle
}

// IsAvailable checks if the provider is configured
func (p *GoogleProvider) IsAvailable() bool {
	return p.config.APIKey != ""
}

// SupportsEmbeddings checks if the provider supports embedding generation
func (p *GoogleProvider) SupportsEmbeddings() bool {
	return false
}
