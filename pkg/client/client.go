package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// Client represents an HTTP client for the prompt-alchemy server
type Client struct {
	baseURL    string
	httpClient *http.Client
	logger     *logrus.Logger
}

// NewClient creates a new prompt-alchemy HTTP client
func NewClient(logger *logrus.Logger) *Client {
	baseURL := viper.GetString("client.server_url")
	timeout := time.Duration(viper.GetInt("client.timeout")) * time.Second

	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		logger: logger,
	}
}

// NewClientWithURL creates a new client with a specific server URL
func NewClientWithURL(serverURL string, logger *logrus.Logger) *Client {
	timeout := time.Duration(viper.GetInt("client.timeout")) * time.Second

	return &Client{
		baseURL: serverURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		logger: logger,
	}
}

// GenerateRequest represents a request to generate prompts via HTTP API
type GenerateRequest struct {
	Input       string  `json:"input"`
	Phases      string  `json:"phases"`
	Count       int     `json:"count"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
	Tags        string  `json:"tags"`
	Persona     string  `json:"persona"`
	TargetModel string  `json:"target_model"`
}

// GenerateResponse represents the response from the generate API
type GenerateResponse struct {
	Success bool                    `json:"success"`
	Error   string                  `json:"error,omitempty"`
	Result  *models.GenerationResult `json:"result,omitempty"`
}

// SearchRequest represents a request to search prompts via HTTP API
type SearchRequest struct {
	Query     string   `json:"query"`
	Limit     int      `json:"limit"`
	Tags      []string `json:"tags"`
	Phases    []string `json:"phases"`
	Providers []string `json:"providers"`
}

// SearchResponse represents the response from the search API
type SearchResponse struct {
	Success bool             `json:"success"`
	Error   string           `json:"error,omitempty"`
	Prompts []models.Prompt  `json:"prompts,omitempty"`
}

// HealthResponse represents the response from the health check API
type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Uptime  string `json:"uptime"`
}

// Generate generates prompts using the remote server API
func (c *Client) Generate(ctx context.Context, req GenerateRequest) (*models.GenerationResult, error) {
	c.logger.Debugf("Sending generate request to server: %s", c.baseURL)

	endpoint := fmt.Sprintf("%s/api/v1/generate", c.baseURL)
	
	// Marshal request
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	// Make request with retry logic
	var resp *http.Response
	retryAttempts := viper.GetInt("client.retry_attempts")
	
	for attempt := 0; attempt <= retryAttempts; attempt++ {
		resp, err = c.httpClient.Do(httpReq)
		if err == nil {
			break
		}
		
		if attempt < retryAttempts {
			c.logger.Warnf("Request attempt %d failed, retrying: %v", attempt+1, err)
			time.Sleep(time.Duration(attempt+1) * time.Second)
		}
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request after %d attempts: %w", retryAttempts+1, err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var genResp GenerateResponse
	if err := json.Unmarshal(body, &genResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !genResp.Success {
		return nil, fmt.Errorf("server error: %s", genResp.Error)
	}

	return genResp.Result, nil
}

// Search searches for prompts using the remote server API
func (c *Client) Search(ctx context.Context, req SearchRequest) ([]models.Prompt, error) {
	c.logger.Debugf("Sending search request to server: %s", c.baseURL)

	endpoint := fmt.Sprintf("%s/api/v1/search", c.baseURL)
	
	// Marshal request
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	// Make request
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var searchResp SearchResponse
	if err := json.Unmarshal(body, &searchResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !searchResp.Success {
		return nil, fmt.Errorf("server error: %s", searchResp.Error)
	}

	return searchResp.Prompts, nil
}

// Health checks the server health status
func (c *Client) Health(ctx context.Context) (*HealthResponse, error) {
	c.logger.Debugf("Checking server health: %s", c.baseURL)

	endpoint := fmt.Sprintf("%s/api/v1/health", c.baseURL)
	
	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	
	httpReq.Header.Set("Accept", "application/json")

	// Make request
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var healthResp HealthResponse
	if err := json.Unmarshal(body, &healthResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &healthResp, nil
}

// IsServerMode returns true if the client is configured to use server mode
func IsServerMode() bool {
	mode := viper.GetString("client.mode")
	return mode == "client"
}

// GetServerURL returns the configured server URL
func GetServerURL() string {
	return viper.GetString("client.server_url")
}