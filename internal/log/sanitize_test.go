package log

import (
	"testing"
)

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "OpenAI API key",
			input:    "Using API key: sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
			expected: "Using API key: sk-***REDACTED***",
		},
		{
			name:     "Anthropic API key",
			input:    "Authorization: Bearer sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
			expected: "Authorization: Bearer sk-ant-***REDACTED***",
		},
		{
			name:     "Google API key",
			input:    "API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuv",
			expected: "API_KEY=AIza***REDACTED***",
		},
		{
			name:     "Grok API key",
			input:    "Using Grok API key: xai-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
			expected: "Using Grok API key: xai-***REDACTED***",
		},
		{
			name:     "Bearer token",
			input:    "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
			expected: "Authorization: Bearer ***REDACTED***",
		},
		{
			name:     "URL with API key",
			input:    "Calling https://api.example.com/v1/endpoint?api_key=abcdef123456789012345678901234567890&other=value",
			expected: "Calling https://api.example.com/v1/endpoint?api_key=***REDACTED***&other=value",
		},
		{
			name:     "Multiple secrets",
			input:    "Config: api_key=sk-test123456789012345678901234567890, secret=verysecret123456789012345678901234567890",
			expected: "Config: api_key=***REDACTED***, secret=***REDACTED***",
		},
		{
			name:     "No secrets",
			input:    "This is a normal log message without any sensitive data",
			expected: "This is a normal log message without any sensitive data",
		},
		{
			name:     "JSON with token",
			input:    `{"token":"sk-proj-123456789012345678901234567890abcdefghijklmnop","user":"test"}`,
			expected: `{"token":"sk-***REDACTED***","user":"test"}`,
		},
		{
			name:     "JSON with Grok token",
			input:    `{"grok_api_key":"xai-proj-123456789012345678901234567890abcdefghijklmnop","model":"grok-2"}`,
			expected: `{"grok_api_key":"xai-***REDACTED***","model":"grok-2"}`,
		},
		{
			name:     "All providers in one log",
			input:    "OpenAI: sk-test123456789012345678901234567890, Anthropic: sk-ant-test123456789012345678901234567890, Google: AIzaSyB1234567890abcdefghijklmnopqrstuv, Grok: xai-test123456789012345678901234567890",
			expected: "OpenAI: sk-***REDACTED***, Anthropic: sk-ant-***REDACTED***, Google: AIza***REDACTED***, Grok: xai-***REDACTED***",
		},
		{
			name:     "Environment variable style",
			input:    "GROK_API_KEY=xai-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
			expected: "GROK_API_KEY=***REDACTED*** OPENAI_API_KEY=***REDACTED***",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeString(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeString() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestSanitizeArgs(t *testing.T) {
	args := []interface{}{
		"api_key",
		"sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
		123,
		[]byte("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"),
	}

	sanitized := SanitizeArgs(args)

	// Check that the API key was sanitized
	if sanitized[1].(string) != "sk-***REDACTED***" {
		t.Errorf("API key not sanitized: %v", sanitized[1])
	}

	// Check that the bearer token was sanitized
	if string(sanitized[3].(string)) != "Bearer ***REDACTED***" {
		t.Errorf("Bearer token not sanitized: %v", sanitized[3])
	}

	// Check that the number wasn't changed
	if sanitized[2].(int) != 123 {
		t.Errorf("Number was changed: %v", sanitized[2])
	}
}
