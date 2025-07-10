---
layout: default
title: Testing with Mocks
---

# Testing with Mocks

This document describes the comprehensive mock infrastructure for testing Prompt Alchemy components without external dependencies.

## Overview

The mock infrastructure provides isolated, controllable implementations of external dependencies including:

- **HTTP Clients** - Mock API calls to LLM providers
- **Storage Layer** - In-memory database operations
- **Provider Implementations** - Mock LLM provider responses
- **External Services** - Simulated external API behavior

## Mock HTTP Client

### Basic Usage

```go
import "prompt-alchemy/internal/mocks"

func TestAPICall(t *testing.T) {
    client := mocks.NewMockHTTPClient()
    
    // Set custom response
    client.SetResponse("POST", "https://api.openai.com/v1/chat/completions", 
        200, `{"choices": [{"message": {"content": "Mock response"}}]}`)
    
    // Make request
    req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", nil)
    resp, err := client.Do(req)
    
    assert.NoError(t, err)
    assert.Equal(t, 200, resp.StatusCode)
}
```

### Features

- **Request Recording** - All requests are recorded for inspection
- **Custom Responses** - Set specific responses for URL patterns
- **Error Simulation** - Simulate network errors and timeouts
- **Call Counting** - Track number of calls to specific endpoints
- **Response Builders** - Helpers for building provider-specific responses

### Response Builders

```go
// OpenAI response
openaiBuilder := &mocks.OpenAIResponseBuilder{
    Content:    "Generated text",
    Model:      "gpt-4o-mini",
    TokensUsed: 100,
}
response := openaiBuilder.Build()

// Anthropic response
anthropicBuilder := &mocks.AnthropicResponseBuilder{
    Content:      "Claude response",
    Model:        "claude-3-5-sonnet",
    InputTokens:  50,
    OutputTokens: 75,
}
response := anthropicBuilder.Build()

// Embedding response
embeddingBuilder := &mocks.EmbeddingResponseBuilder{
    Embedding: []float32{0.1, 0.2, 0.3},
    Model:     "text-embedding-3-small",
}
response := embeddingBuilder.BuildOpenAI()
```

## Mock Storage

### Basic Operations

```go
func TestStorage(t *testing.T) {
    storage := mocks.NewMockStorage()
    ctx := context.Background()
    
    // Create prompt
    prompt := &models.Prompt{
        Content:  "Test prompt",
        Phase:    models.PhaseIdea,
        Provider: "openai",
        Tags:     []string{"test"},
    }
    
    // Save
    err := storage.SavePrompt(ctx, prompt)
    assert.NoError(t, err)
    
    // Retrieve
    retrieved, err := storage.GetPrompt(ctx, prompt.ID)
    assert.NoError(t, err)
    assert.Equal(t, prompt.Content, retrieved.Content)
}
```

### Search Functionality

```go
func TestSearch(t *testing.T) {
    storage := mocks.NewMockStorage()
    ctx := context.Background()
    
    // Search by criteria
    criteria := storage.SearchCriteria{
        Phase:    "idea",
        Provider: "openai",
        Tags:     []string{"javascript"},
        Limit:    10,
    }
    
    results, err := storage.SearchPrompts(ctx, criteria)
    assert.NoError(t, err)
}
```

### Embedding Operations

```go
func TestEmbeddings(t *testing.T) {
    storage := mocks.NewMockStorage()
    ctx := context.Background()
    
    // Store embedding
    embedding := []float32{0.1, 0.2, 0.3, 0.4, 0.5}
    err := storage.StoreEmbedding(ctx, promptID, embedding)
    assert.NoError(t, err)
    
    // Retrieve embedding
    retrieved, err := storage.GetEmbedding(ctx, promptID)
    assert.NoError(t, err)
    assert.Equal(t, embedding, retrieved)
}
```

### Error Simulation

```go
func TestStorageErrors(t *testing.T) {
    storage := mocks.NewMockStorage()
    
    // Make next call fail
    storage.SetFailOnNextCall("SavePrompt", errors.New("database error"))
    
    err := storage.SavePrompt(ctx, prompt)
    assert.Error(t, err)
    
    // Verify call was counted
    assert.Equal(t, 1, storage.GetCallCount("SavePrompt"))
}
```

## Mock Providers

### Creating Mock Providers

```go
func TestProvider(t *testing.T) {
    provider := mocks.NewMockProvider("test-provider")
    
    // Configure availability
    provider.SetAvailable(true)
    provider.SetSupportsEmbeddings(true)
    
    // Set custom response
    provider.SetResponse("test prompt", &providers.GenerateResponse{
        Content:    "Custom response",
        TokensUsed: 42,
        Model:      "test-model",
    })
}
```

### Generation Testing

```go
func TestGeneration(t *testing.T) {
    provider := mocks.NewMockProvider("openai")
    ctx := context.Background()
    
    req := providers.GenerateRequest{
        Prompt:      "Write a function",
        Temperature: 0.7,
        MaxTokens:   100,
    }
    
    resp, err := provider.Generate(ctx, req)
    assert.NoError(t, err)
    assert.Contains(t, resp.Content, "Write a function")
}
```

### Embedding Testing

```go
func TestEmbedding(t *testing.T) {
    provider := mocks.NewMockProvider("openai")
    ctx := context.Background()
    
    // Set custom embedding
    customEmbedding := []float32{1.0, 2.0, 3.0}
    provider.SetEmbedding("test text", customEmbedding)
    
    embedding, err := provider.GetEmbedding(ctx, "test text", nil)
    assert.NoError(t, err)
    assert.Equal(t, customEmbedding, embedding)
}
```

### Advanced Features

#### Failure Rate Simulation

```go
// Simulate 30% failure rate
provider.SetFailureRate(0.3)

// Make multiple calls to test reliability
var failures int
for i := 0; i < 100; i++ {
    _, err := provider.Generate(ctx, req)
    if err != nil {
        failures++
    }
}

// Should have approximately 30 failures
assert.InDelta(t, 30, failures, 10)
```

#### Response Delay Simulation

```go
// Simulate network latency
provider.SetResponseDelay(100 * time.Millisecond)

start := time.Now()
provider.Generate(ctx, req)
elapsed := time.Since(start)

assert.GreaterOrEqual(t, elapsed, 100*time.Millisecond)
```

#### Call History Inspection

```go
// Make some calls
provider.Generate(ctx, req1)
provider.GetEmbedding(ctx, "text", nil)

// Inspect history
history := provider.GetCallHistory()
assert.Len(t, history, 2)

assert.Equal(t, "Generate", history[0].Method)
assert.Equal(t, "GetEmbedding", history[1].Method)

// Check metrics
assert.Equal(t, 2, provider.GetCallCount())
assert.Equal(t, 1.0, provider.GetSuccessRate())
```

## Standard Mock Provider Registry

### Pre-configured Providers

```go
func TestStandardProviders(t *testing.T) {
    registry := mocks.CreateStandardMockProviders()
    
    // All standard providers are available
    openai, exists := registry.Get("openai")
    assert.True(t, exists)
    assert.True(t, openai.SupportsEmbeddings())
    
    google, exists := registry.Get("google")
    assert.True(t, exists)
    assert.False(t, google.SupportsEmbeddings()) // Google doesn't support embeddings
    
    ollama, exists := registry.Get("ollama")
    assert.True(t, exists)
    assert.False(t, ollama.IsAvailable()) // Ollama typically not available in tests
}
```

### Provider Configurations

| Provider | Available | Embeddings | Model |
|----------|-----------|------------|-------|
| openai | ✅ | ✅ | gpt-4o-mini |
| anthropic | ✅ | ✅ | claude-3-5-sonnet |
| google | ✅ | ❌ | gemini-2.5-flash |
| openrouter | ✅ | ✅ | openrouter/auto |
| ollama | ❌ | ✅ | llama2 |

## Complete Workflow Testing

### Integration Test Example

```go
func TestCompleteWorkflow(t *testing.T) {
    // Set up mocks
    storage := mocks.NewMockStorage()
    registry := mocks.CreateStandardMockProviders()
    ctx := context.Background()
    
    // Configure provider responses
    openai, _ := registry.Get("openai")
    openai.SetResponse("Create a function", &providers.GenerateResponse{
        Content:    "def create_function(): pass",
        TokensUsed: 25,
        Model:      "gpt-4o-mini",
    })
    
    // Step 1: Generate prompt
    req := providers.GenerateRequest{Prompt: "Create a function"}
    resp, err := openai.Generate(ctx, req)
    require.NoError(t, err)
    
    // Step 2: Save to storage
    prompt := &models.Prompt{
        Content:      resp.Content,
        Phase:        models.PhaseIdea,
        Provider:     "openai",
        Model:        resp.Model,
        ActualTokens: resp.TokensUsed,
    }
    
    err = storage.SavePrompt(ctx, prompt)
    require.NoError(t, err)
    
    // Step 3: Generate and store embedding
    embedding, err := openai.GetEmbedding(ctx, prompt.Content, nil)
    require.NoError(t, err)
    
    err = storage.StoreEmbedding(ctx, prompt.ID, embedding)
    require.NoError(t, err)
    
    // Step 4: Verify complete workflow
    retrieved, err := storage.GetPrompt(ctx, prompt.ID)
    require.NoError(t, err)
    assert.Equal(t, prompt.Content, retrieved.Content)
    
    retrievedEmbedding, err := storage.GetEmbedding(ctx, prompt.ID)
    require.NoError(t, err)
    assert.Equal(t, embedding, retrievedEmbedding)
    
    // Verify provider was called
    history := openai.GetCallHistory()
    assert.Len(t, history, 2) // Generate + GetEmbedding
    assert.Equal(t, 1.0, openai.GetSuccessRate())
}
```

## Best Practices

### Test Isolation

```go
func TestWithCleanup(t *testing.T) {
    storage := mocks.NewMockStorage()
    provider := mocks.NewMockProvider("test")
    
    // Use t.Cleanup for automatic cleanup
    t.Cleanup(func() {
        storage.Reset()
        provider.Reset()
    })
    
    // Test logic here
}
```

### Deterministic Testing

```go
func TestDeterministic(t *testing.T) {
    provider := mocks.NewMockProvider("test")
    
    // Set specific responses for predictable results
    provider.SetResponse("prompt1", &providers.GenerateResponse{
        Content: "response1",
        TokensUsed: 10,
    })
    
    provider.SetEmbedding("text1", []float32{0.1, 0.2, 0.3})
    
    // Tests will be deterministic
}
```

### Error Scenario Testing

```go
func TestErrorScenarios(t *testing.T) {
    provider := mocks.NewMockProvider("test")
    
    // Test specific errors
    provider.SetError("failing prompt", errors.New("API error"))
    
    // Test failure rates
    provider.SetFailureRate(0.1) // 10% failure rate
    
    // Test timeouts
    provider.SetResponseDelay(5 * time.Second)
    
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()
    
    // This should timeout
    _, err := provider.Generate(ctx, req)
    assert.Error(t, err)
}
```

### Performance Testing

```go
func TestPerformance(t *testing.T) {
    provider := mocks.NewMockProvider("test")
    
    // Simulate realistic response times
    provider.SetResponseDelay(50 * time.Millisecond)
    
    start := time.Now()
    for i := 0; i < 10; i++ {
        provider.Generate(ctx, req)
    }
    elapsed := time.Since(start)
    
    // Should take approximately 500ms
    assert.InDelta(t, 500*time.Millisecond, elapsed, 100*time.Millisecond)
}
```

## Mock Configuration

### Environment-Based Configuration

```go
func createMockProvider(name string) *mocks.MockProvider {
    provider := mocks.NewMockProvider(name)
    
    // Configure based on test environment
    if testing.Short() {
        // Fast tests - no delays
        provider.SetResponseDelay(0)
        provider.SetFailureRate(0)
    } else {
        // Full tests - realistic behavior
        provider.SetResponseDelay(10 * time.Millisecond)
        provider.SetFailureRate(0.01) // 1% failure rate
    }
    
    return provider
}
```

### Shared Test Fixtures

```go
// test_fixtures.go
func CreateTestPrompt() *models.Prompt {
    return &models.Prompt{
        Content:     "Test prompt content",
        Phase:       models.PhaseIdea,
        Provider:    "openai",
        Model:       "gpt-4o-mini",
        Temperature: 0.7,
        Tags:        []string{"test"},
    }
}

func CreateTestEmbedding() []float32 {
    return []float32{0.1, 0.2, 0.3, 0.4, 0.5}
}
```

## Running Mock Tests

### Individual Test Files

```bash
# Run all mock tests
go test ./internal/mocks/

# Run with verbose output
go test -v ./internal/mocks/

# Run specific test
go test -run TestMockProvider ./internal/mocks/
```

### Integration with Existing Tests

```bash
# Run all tests with mocks
go test ./...

# Run only fast tests (no external dependencies)
go test -short ./...

# Run with coverage
go test -cover ./internal/mocks/
```

## Troubleshooting

### Common Issues

1. **Race Conditions**: Always use proper locking in concurrent tests
2. **State Leakage**: Reset mocks between tests using `Reset()` methods
3. **Determinism**: Use specific responses rather than relying on default behavior
4. **Memory Leaks**: Clear large data structures in cleanup functions

### Debugging Tips

```go
func TestWithDebugging(t *testing.T) {
    provider := mocks.NewMockProvider("debug")
    
    // Enable detailed logging
    t.Logf("Provider: %s", provider.Name())
    
    // Make calls
    resp, err := provider.Generate(ctx, req)
    t.Logf("Response: %+v, Error: %v", resp, err)
    
    // Inspect call history
    history := provider.GetCallHistory()
    for i, call := range history {
        t.Logf("Call %d: %+v", i, call)
    }
    
    // Check metrics
    t.Logf("Total calls: %d, Failures: %d, Success rate: %.2f",
        provider.GetCallCount(),
        provider.GetFailureCount(),
        provider.GetSuccessRate())
}
```

The mock infrastructure provides comprehensive testing capabilities while maintaining isolation from external dependencies, enabling reliable and fast test execution. 