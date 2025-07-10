---
layout: default
title: API Reference
---

# API Reference

This document provides detailed API documentation for extending Prompt Alchemy.

## Provider Interface

All LLM providers must implement this interface:

```go
type Provider interface {
    // Generate creates a completion based on the request
    Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error)
    
    // GetEmbedding returns embeddings for the given text
    GetEmbedding(ctx context.Context, text string) ([]float32, error)
    
    // Name returns the provider identifier
    Name() string
    
    // IsAvailable checks if the provider is properly configured
    IsAvailable() bool
    
    // SupportsEmbeddings indicates if this provider can generate embeddings
    SupportsEmbeddings() bool
}
```

### GenerateRequest

```go
type GenerateRequest struct {
    // The main prompt to process
    Prompt string
    
    // System prompt for context
    SystemPrompt string
    
    // Examples for few-shot learning
    Examples []Example
    
    // Temperature for randomness (0.0-1.0)
    Temperature float64
    
    // Maximum tokens to generate
    MaxTokens int
    
    // Additional provider-specific parameters
    Parameters map[string]interface{}
}

type Example struct {
    Input  string
    Output string
}
```

### GenerateResponse

```go
type GenerateResponse struct {
    // Generated content
    Content string
    
    // Number of tokens used
    TokensUsed int
    
    // Model that generated the response
    Model string
    
    // Additional metadata
    Metadata map[string]interface{}
}
```

## Storage Interface

```go
type Storage interface {
    // SavePrompt stores a prompt with its metadata
    SavePrompt(prompt *models.Prompt) error
    
    // GetPrompt retrieves a prompt by ID
    GetPrompt(id uuid.UUID) (*models.Prompt, error)
    
    // SearchPrompts finds prompts matching criteria
    SearchPrompts(criteria SearchCriteria) ([]*models.Prompt, error)
    
    // UpdatePrompt modifies an existing prompt
    UpdatePrompt(id uuid.UUID, updates map[string]interface{}) error
    
    // DeletePrompt removes a prompt
    DeletePrompt(id uuid.UUID) error
    
    // GetMetrics retrieves analytics data
    GetMetrics(filter MetricsFilter) (*MetricsResult, error)
}
```

## Model Definitions

### Prompt Model

```go
type Prompt struct {
    ID        uuid.UUID `json:"id" db:"id"`
    Content   string    `json:"content" db:"content"`
    Phase     string    `json:"phase" db:"phase"`
    Provider  string    `json:"provider" db:"provider"`
    Model     string    `json:"model" db:"model"`
    
    // Generation parameters
    Temperature float64 `json:"temperature" db:"temperature"`
    MaxTokens   int     `json:"max_tokens" db:"max_tokens"`
    
    // Metadata
    Tags       []string  `json:"tags" db:"tags"`
    CreatedAt  time.Time `json:"created_at" db:"created_at"`
    UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
    
    // Embeddings
    Embedding         []float32 `json:"-" db:"embedding"`
    EmbeddingModel    string    `json:"embedding_model" db:"embedding_model"`
    EmbeddingProvider string    `json:"embedding_provider" db:"embedding_provider"`
    
    // Performance metrics
    ActualTokens   int           `json:"actual_tokens" db:"actual_tokens"`
    ProcessingTime time.Duration `json:"processing_time" db:"processing_time"`
    
    // Associated data
    ModelMetadata *ModelMetadata `json:"model_metadata,omitempty"`
    Metrics       *PromptMetrics `json:"metrics,omitempty"`
}
```

### Persona Model

```go
type Persona struct {
    Name        string  `json:"name"`
    Description string  `json:"description"`
    
    // Generation parameters
    Temperature      float64 `json:"temperature"`
    MaxTokens        int     `json:"max_tokens"`
    TopP             float64 `json:"top_p"`
    FrequencyPenalty float64 `json:"frequency_penalty"`
    PresencePenalty  float64 `json:"presence_penalty"`
    
    // Prompt templates
    SystemPrompt string            `json:"system_prompt"`
    Examples     []Example         `json:"examples"`
    Variables    map[string]string `json:"variables"`
    
    // Target model optimizations
    ModelFamily     string   `json:"model_family"`
    OptimalFeatures []string `json:"optimal_features"`
}
```

## Engine API

### Engine Methods

```go
type Engine struct {
    // ... internal fields
}

// Generate creates prompts through all configured phases
func (e *Engine) Generate(ctx context.Context, input string, options ...Option) (*GenerationResult, error)

// GeneratePhase runs a specific phase only
func (e *Engine) GeneratePhase(ctx context.Context, phase string, input string, options ...Option) (*PhaseResult, error)

// OptimizePrompt improves an existing prompt
func (e *Engine) OptimizePrompt(ctx context.Context, prompt string, task string) (*OptimizationResult, error)
```

### Options Pattern

```go
type Option func(*Config)

// WithPersona sets the generation persona
func WithPersona(persona *Persona) Option

// WithProvider overrides the default provider
func WithProvider(provider string) Option

// WithPhases specifies which phases to run
func WithPhases(phases []string) Option

// WithTags adds metadata tags
func WithTags(tags []string) Option

// WithTemperature sets generation temperature
func WithTemperature(temp float64) Option
```

## Ranking API

### Ranker Interface

```go
type Ranker interface {
    // RankPrompts scores and sorts prompts
    RankPrompts(prompts []*models.Prompt) ([]*RankedPrompt, error)
    
    // CalculateScore computes score for a single prompt
    CalculateScore(prompt *models.Prompt) float64
    
    // UpdateWeights adjusts ranking factors
    UpdateWeights(weights RankingWeights)
}

type RankingWeights struct {
    Temperature float64 // Weight for temperature appropriateness
    TokenUsage  float64 // Weight for token efficiency
    Context     float64 // Weight for context relevance
    Recency     float64 // Weight for how recent the prompt is
    Performance float64 // Weight for historical performance
}
```

## Judge API

### Evaluator Interface

```go
type Evaluator interface {
    // Evaluate assesses prompt quality
    Evaluate(ctx context.Context, req EvaluationRequest) (*EvaluationResult, error)
}

type EvaluationRequest struct {
    OriginalPrompt    string   `json:"original_prompt"`
    GeneratedResponse string   `json:"generated_response"`
    Task              string   `json:"task"`
    Criteria          []string `json:"criteria"`
    ReferenceAnswer   string   `json:"reference_answer,omitempty"`
}

type EvaluationResult struct {
    OverallScore    float64            `json:"overall_score"`
    CriteriaScores  map[string]float64 `json:"criteria_scores"`
    Reasoning       string             `json:"reasoning"`
    Improvements    []string           `json:"improvements"`
    BiasDetected    []string           `json:"bias_detected"`
}
```

## Optimizer API

### MetaPromptOptimizer

```go
type MetaPromptOptimizer interface {
    // Optimize improves a prompt iteratively
    Optimize(ctx context.Context, req OptimizationRequest) (*OptimizationResult, error)
}

type OptimizationRequest struct {
    Prompt        string   `json:"prompt"`
    Task          string   `json:"task"`
    Examples      []Example `json:"examples,omitempty"`
    Constraints   []string  `json:"constraints,omitempty"`
    TargetScore   float64   `json:"target_score"`
    MaxIterations int       `json:"max_iterations"`
}

type OptimizationResult struct {
    OriginalPrompt  string       `json:"original_prompt"`
    OptimizedPrompt string       `json:"optimized_prompt"`
    OriginalScore   float64      `json:"original_score"`
    FinalScore      float64      `json:"final_score"`
    Iterations      []Iteration  `json:"iterations"`
    TotalTime       time.Duration `json:"total_time"`
}
```

## CLI Extension

### Adding Custom Commands

```go
// In internal/cmd/custom.go
package cmd

import (
    "github.com/spf13/cobra"
)

var customCmd = &cobra.Command{
    Use:   "custom",
    Short: "Custom command description",
    RunE:  runCustom,
}

func init() {
    rootCmd.AddCommand(customCmd)
    
    // Add flags
    customCmd.Flags().StringP("option", "o", "", "Option description")
}

func runCustom(cmd *cobra.Command, args []string) error {
    // Implementation
    return nil
}
```

## Hooks and Events

### Event System

```go
type EventType string

const (
    EventPromptGenerated EventType = "prompt.generated"
    EventPromptOptimized EventType = "prompt.optimized"
    EventPromptEvaluated EventType = "prompt.evaluated"
)

type Event struct {
    Type      EventType
    Timestamp time.Time
    Data      interface{}
}

type EventHandler func(event Event)

// Register an event handler
func RegisterHandler(eventType EventType, handler EventHandler)
```

## Error Handling

### Custom Errors

```go
// Provider errors
var (
    ErrProviderNotFound     = errors.New("provider not found")
    ErrProviderUnavailable  = errors.New("provider unavailable")
    ErrRateLimitExceeded    = errors.New("rate limit exceeded")
    ErrInvalidAPIKey        = errors.New("invalid API key")
)

// Storage errors
var (
    ErrPromptNotFound = errors.New("prompt not found")
    ErrDuplicateID    = errors.New("duplicate prompt ID")
    ErrInvalidQuery   = errors.New("invalid search query")
)
```

## Testing

### Test Utilities

```go
// MockProvider for testing
type MockProvider struct {
    GenerateFunc     func(context.Context, GenerateRequest) (*GenerateResponse, error)
    GetEmbeddingFunc func(context.Context, string) ([]float32, error)
}

// TestStorage for in-memory testing
type TestStorage struct {
    prompts map[uuid.UUID]*models.Prompt
    mu      sync.RWMutex
}
```

## Best Practices

1. **Context Usage** - Always pass context for cancellation
2. **Error Wrapping** - Use `fmt.Errorf` with `%w`
3. **Logging** - Use structured logging with fields
4. **Validation** - Validate inputs early
5. **Timeouts** - Set reasonable timeouts for API calls

## Examples

### Custom Provider Implementation

```go
package providers

import (
    "context"
    "fmt"
    "net/http"
)

type CustomProvider struct {
    apiKey string
    client *http.Client
}

func NewCustomProvider(apiKey string) *CustomProvider {
    return &CustomProvider{
        apiKey: apiKey,
        client: &http.Client{Timeout: 30 * time.Second},
    }
}

func (p *CustomProvider) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
    // Implementation
    return &GenerateResponse{
        Content:    "Generated content",
        TokensUsed: 100,
        Model:      "custom-model",
    }, nil
}

func (p *CustomProvider) Name() string {
    return "custom"
}

func (p *CustomProvider) IsAvailable() bool {
    return p.apiKey != ""
}

func (p *CustomProvider) SupportsEmbeddings() bool {
    return false
}

func (p *CustomProvider) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
    return nil, fmt.Errorf("embeddings not supported")
}
```