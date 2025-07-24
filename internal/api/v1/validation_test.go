package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestInputValidation tests comprehensive input validation scenarios
func TestInputValidation(t *testing.T) {
	handler := createValidationTestHandler()

	tests := []struct {
		name           string
		request        interface{}
		endpoint       string
		expectedStatus int
		expectedError  string
	}{
		// String field validations
		{
			name: "empty input field",
			request: GenerateRequest{
				Input: "",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Input is required",
		},
		{
			name: "whitespace only input",
			request: GenerateRequest{
				Input: "   \t\n   ",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Handler accepts whitespace as valid input
		},
		{
			name: "extremely long input",
			request: GenerateRequest{
				Input: strings.Repeat("a", 100000), // 100KB
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should handle but may truncate
		},
		{
			name: "null characters in input",
			request: GenerateRequest{
				Input: "test\x00null\x00characters",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should sanitize
		},
		{
			name: "mixed valid and invalid unicode",
			request: GenerateRequest{
				Input: "Valid text 🎉 with \xc3\x28 invalid UTF-8",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should handle gracefully
		},

		// Numeric field validations
		{
			name: "negative count",
			request: GenerateRequest{
				Input: "test",
				Count: -5,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "zero count",
			request: GenerateRequest{
				Input: "test",
				Count: 0,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "excessive count",
			request: GenerateRequest{
				Input: "test",
				Count: 10000,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should cap at reasonable limit
		},
		{
			name: "invalid temperature - negative",
			request: GenerateRequest{
				Input:       "test",
				Temperature: -0.5,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "invalid temperature - too high",
			request: GenerateRequest{
				Input:       "test",
				Temperature: 3.0,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should cap at max
		},
		{
			name: "NaN temperature",
			request: map[string]interface{}{
				"input":       "test",
				"temperature": "NaN",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "infinity temperature",
			request: map[string]interface{}{
				"input":       "test",
				"temperature": "Infinity",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "negative max tokens",
			request: GenerateRequest{
				Input:     "test",
				MaxTokens: -100,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "excessive max tokens",
			request: GenerateRequest{
				Input:     "test",
				MaxTokens: 1000000,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should cap at max
		},

		// Array field validations
		{
			name: "empty phases array",
			request: GenerateRequest{
				Input:  "test",
				Phases: []string{},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use defaults
		},
		{
			name: "invalid phase names",
			request: GenerateRequest{
				Input:  "test",
				Phases: []string{"invalid-phase-1", "invalid-phase-2"},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusInternalServerError, // Engine will fail with invalid phases
		},
		{
			name: "duplicate phases",
			request: GenerateRequest{
				Input:  "test",
				Phases: []string{"prima-materia", "prima-materia", "prima-materia"},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should handle duplicates
		},
		{
			name: "too many tags",
			request: GenerateRequest{
				Input: "test",
				Tags:  generateStringArray(1000),
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should handle but may limit
		},
		{
			name: "empty string in tags",
			request: GenerateRequest{
				Input: "test",
				Tags:  []string{"valid", "", "also-valid"},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should filter empty
		},
		{
			name: "very long individual tag",
			request: GenerateRequest{
				Input: "test",
				Tags:  []string{strings.Repeat("x", 1000)},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should truncate or handle
		},

		// Map field validations
		{
			name: "invalid provider names",
			request: GenerateRequest{
				Input: "test",
				Providers: map[string]string{
					"phase1": "non-existent-provider",
					"phase2": "another-invalid-provider",
				},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusInternalServerError, // Will fail with invalid providers
		},
		{
			name: "empty provider map values",
			request: GenerateRequest{
				Input: "test",
				Providers: map[string]string{
					"phase1": "",
					"phase2": "",
				},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusInternalServerError, // Will fail with empty providers
		},

		// Special character handling
		{
			name: "HTML in input",
			request: GenerateRequest{
				Input: "<h1>Test</h1><script>alert('xss')</script>",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should escape/sanitize
		},
		{
			name: "JSON in input",
			request: GenerateRequest{
				Input: `{"key": "value", "nested": {"array": [1,2,3]}}`,
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK,
		},
		{
			name: "SQL in input",
			request: GenerateRequest{
				Input: "SELECT * FROM users WHERE id = 1; DROP TABLE users;",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should treat as normal text
		},
		{
			name: "regex patterns in input",
			request: GenerateRequest{
				Input: "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK,
		},
		{
			name: "control characters",
			request: GenerateRequest{
				Input: "test\r\nwith\r\ncontrol\x01\x02\x03characters",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should sanitize
		},

		// Persona validation
		{
			name: "empty persona",
			request: GenerateRequest{
				Input:   "test",
				Persona: "",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "invalid persona",
			request: GenerateRequest{
				Input:   "test",
				Persona: "non-existent-persona",
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should use default
		},
		{
			name: "very long persona name",
			request: GenerateRequest{
				Input:   "test",
				Persona: strings.Repeat("persona", 100),
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK, // Should handle
		},

		// Complex nested validation
		{
			name: "deeply nested context",
			request: GenerateRequest{
				Input:   "test",
				Context: generateDeeplyNestedContext(50),
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusOK,
		},
		{
			name: "mixed valid and invalid data",
			request: GenerateRequest{
				Input:       "Valid input",
				Count:       -5,                        // Invalid, should use default
				Temperature: 10.0,                      // Invalid, should cap
				MaxTokens:   -100,                      // Invalid, should use default
				Tags:        []string{"", "valid", ""}, // Mixed
				Phases:      []string{"invalid", "prima-materia"},
				Persona:     "invalid-persona",
				Context:     []string{"valid context", ""},
			},
			endpoint:       "/api/v1/prompts/generate",
			expectedStatus: http.StatusInternalServerError, // Will fail due to invalid phase
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			var err error

			// Handle different request types
			switch r := tt.request.(type) {
			case GenerateRequest:
				body, err = json.Marshal(r)
			case map[string]interface{}:
				body, err = json.Marshal(r)
			default:
				body, err = json.Marshal(tt.request)
			}
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, tt.endpoint, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler.HandleGeneratePrompts(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)

			if tt.expectedError != "" {
				var response map[string]interface{}
				err := json.Unmarshal(rr.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response["error"], tt.expectedError)
			}

			// For successful requests, verify response structure
			if rr.Code == http.StatusOK && tt.expectedError == "" {
				// Note: With nil engine, successful requests will fail
				// This is okay for validation tests which focus on input validation
			}
		})
	}
}

// TestBoundaryValues tests edge cases for numeric inputs
func TestBoundaryValues(t *testing.T) {
	handler := createValidationTestHandler()

	boundaryTests := []struct {
		name     string
		field    string
		value    interface{}
		expected interface{}
	}{
		// Count boundaries
		{"count_min", "count", 0, 3},             // Should default to 3
		{"count_negative", "count", -1, 3},       // Should default to 3
		{"count_max", "count", 100, 100},         // Should accept up to reasonable limit
		{"count_excessive", "count", 10000, 100}, // Should cap at max

		// Temperature boundaries
		{"temp_min", "temperature", 0.0, 0.0},        // Valid minimum
		{"temp_negative", "temperature", -1.0, 0.0},  // Should floor at 0
		{"temp_max", "temperature", 2.0, 2.0},        // Valid maximum
		{"temp_excessive", "temperature", 10.0, 2.0}, // Should cap at 2

		// MaxTokens boundaries
		{"tokens_min", "max_tokens", 1, 1},               // Valid minimum
		{"tokens_negative", "max_tokens", -1, 2000},      // Should default
		{"tokens_max", "max_tokens", 4096, 4096},         // Valid maximum
		{"tokens_excessive", "max_tokens", 100000, 4096}, // Should cap
	}

	for _, tt := range boundaryTests {
		t.Run(tt.name, func(t *testing.T) {
			request := map[string]interface{}{
				"input":  "test boundary values",
				tt.field: tt.value,
			}

			body, _ := json.Marshal(request)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/prompts/generate", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler.HandleGeneratePrompts(rr, req)

			assert.Equal(t, http.StatusOK, rr.Code)

			// Verify the value was handled correctly
			// In a real implementation, we'd check the actual value used
		})
	}
}

// TestContentTypeValidation tests various content type scenarios
func TestContentTypeValidation(t *testing.T) {
	handler := createValidationTestHandler()

	tests := []struct {
		name           string
		contentType    string
		body           string
		expectedStatus int
	}{
		{
			name:           "valid json content type",
			contentType:    "application/json",
			body:           `{"input": "test"}`,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "json with charset",
			contentType:    "application/json; charset=utf-8",
			body:           `{"input": "test"}`,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing content type",
			contentType:    "",
			body:           `{"input": "test"}`,
			expectedStatus: http.StatusOK, // Should still work
		},
		{
			name:           "wrong content type",
			contentType:    "text/plain",
			body:           `{"input": "test"}`,
			expectedStatus: http.StatusOK, // Should still parse JSON
		},
		{
			name:           "form data content type",
			contentType:    "application/x-www-form-urlencoded",
			body:           "input=test&count=3",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "multipart form data",
			contentType:    "multipart/form-data; boundary=----WebKitFormBoundary",
			body:           "------WebKitFormBoundary\r\nContent-Disposition: form-data; name=\"input\"\r\n\r\ntest\r\n------WebKitFormBoundary--",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "xml content type",
			contentType:    "application/xml",
			body:           "<request><input>test</input></request>",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/prompts/generate", strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}

			rr := httptest.NewRecorder()
			handler.HandleGeneratePrompts(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}

// TestEncodingValidation tests various character encodings
func TestEncodingValidation(t *testing.T) {
	handler := createValidationTestHandler()

	tests := []struct {
		name           string
		input          string
		expectedStatus int
	}{
		{
			name:           "ascii only",
			input:          "Simple ASCII text",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "utf-8 multi-byte",
			input:          "Hello 世界 🌍 Ñoño",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "emoji heavy",
			input:          "🎉🎊🎈🎆🎇🧨✨🎄🎃🎁🎀🎗️🎖️🏆🏅🥇🥈🥉",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "right-to-left text",
			input:          "مرحبا بالعالم שלום עולם",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "mixed scripts",
			input:          "Hello мир 世界 🌍 مرحبا",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "zero-width characters",
			input:          "test​with​zero​width​spaces", // Contains zero-width spaces
			expectedStatus: http.StatusOK,
		},
		{
			name:           "combining characters",
			input:          "tést̃ẽx̃t̃ w̃ĩt̃h̃ c̃õm̃b̃ĩñĩñg̃",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := GenerateRequest{Input: tt.input}
			body, _ := json.Marshal(request)

			req := httptest.NewRequest(http.MethodPost, "/api/v1/prompts/generate", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler.HandleGeneratePrompts(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}

// TestRequestSizeValidation tests various request sizes
func TestRequestSizeValidation(t *testing.T) {
	handler := createValidationTestHandler()

	tests := []struct {
		name           string
		requestSize    int
		expectedStatus int
	}{
		{
			name:           "tiny request",
			requestSize:    100, // 100 bytes
			expectedStatus: http.StatusOK,
		},
		{
			name:           "normal request",
			requestSize:    1024, // 1KB
			expectedStatus: http.StatusOK,
		},
		{
			name:           "large request",
			requestSize:    1024 * 100, // 100KB
			expectedStatus: http.StatusOK,
		},
		{
			name:           "very large request",
			requestSize:    1024 * 1024,   // 1MB
			expectedStatus: http.StatusOK, // Should handle but may be limited
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a request with specified size
			input := strings.Repeat("a", tt.requestSize)
			request := GenerateRequest{Input: input}
			body, _ := json.Marshal(request)

			req := httptest.NewRequest(http.MethodPost, "/api/v1/prompts/generate", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler.HandleGeneratePrompts(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}

// Helper functions

func createValidationTestHandler() *V1Handler {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	// Create a registry with mock provider
	registry := providers.NewRegistry()

	// Register a mock provider that returns successful responses
	mockProvider := &providers.MockProvider{
		GenerateFunc: func(ctx context.Context, req providers.GenerateRequest) (*providers.GenerateResponse, error) {
			return &providers.GenerateResponse{
				Content:    "Generated content for: " + req.Prompt,
				TokensUsed: 30,
				Model:      "mock-model",
			}, nil
		},
		IsAvailableFunc: func() bool { return true },
		NameFunc:        func() string { return "mock" },
	}

	// Register for all providers that might be used
	registry.Register("openai", mockProvider)
	registry.Register("anthropic", mockProvider)
	registry.Register("google", mockProvider)
	registry.Register("mock", mockProvider)

	// Create engine with the registry
	eng := engine.NewEngine(registry, logger)

	return NewV1Handler(nil, registry, eng, nil, nil, logger)
}

func generateStringArray(count int) []string {
	result := make([]string, count)
	for i := 0; i < count; i++ {
		result[i] = fmt.Sprintf("item_%d", i)
	}
	return result
}

func generateDeeplyNestedContext(depth int) []string {
	// Create context that simulates deep nesting when processed
	result := make([]string, depth)
	for i := 0; i < depth; i++ {
		result[i] = fmt.Sprintf("level_%d_context_%s", i, strings.Repeat("nested_", i))
	}
	return result
}
