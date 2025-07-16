package security

import (
	"testing"
)

func TestEscapeFormatString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "No format specifiers",
			input:    "Hello world",
			expected: "Hello world",
		},
		{
			name:     "Single format specifier",
			input:    "Hello %s world",
			expected: "Hello %%s world",
		},
		{
			name:     "Multiple format specifiers",
			input:    "Value: %d, Name: %s, Float: %f",
			expected: "Value: %%d, Name: %%s, Float: %%f",
		},
		{
			name:     "Format specifier attack",
			input:    "%s%s%s%s%s%s%s%s%s%s%s%s%s%s%s%s%s",
			expected: "%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s%%s",
		},
		{
			name:     "Mixed content",
			input:    "User input: %s with normal text",
			expected: "User input: %%s with normal text",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "Only percent signs",
			input:    "%%%%",
			expected: "%%%%%%%%",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := EscapeFormatString(tt.input)
			if result != tt.expected {
				t.Errorf("EscapeFormatString() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestSafeFormat(t *testing.T) {
	tests := []struct {
		name     string
		format   string
		args     []interface{}
		expected string
	}{
		{
			name:     "Safe string formatting",
			format:   "User: %s, Age: %d",
			args:     []interface{}{"John", 25},
			expected: "User: John, Age: 25",
		},
		{
			name:     "String with format specifiers",
			format:   "Template: %s",
			args:     []interface{}{"Hello %s world"},
			expected: "Template: Hello %%s world",
		},
		{
			name:     "Multiple args with format specifiers",
			format:   "ID: %s, Provider: %s, Content: %s",
			args:     []interface{}{"user_%d", "evil_%s_provider", "Content with %f attack"},
			expected: "ID: user_%%d, Provider: evil_%%s_provider, Content: Content with %%f attack",
		},
		{
			name:     "Mixed safe and unsafe args",
			format:   "Count: %d, Message: %s",
			args:     []interface{}{42, "Alert: %s vulnerability"},
			expected: "Count: 42, Message: Alert: %%s vulnerability",
		},
		{
			name:     "Non-string args are safe",
			format:   "Numbers: %d, %f, Bool: %t",
			args:     []interface{}{123, 45.67, true},
			expected: "Numbers: 123, 45.670000, Bool: true",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SafeFormat(tt.format, tt.args...)
			if result != tt.expected {
				t.Errorf("SafeFormat() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestSafeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Safe input",
			input:    "normal text",
			expected: "normal text",
		},
		{
			name:     "Malicious input",
			input:    "%s%s%s%s",
			expected: "%%s%%s%%s%%s",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SafeString(tt.input)
			if result != tt.expected {
				t.Errorf("SafeString() = %q, want %q", result, tt.expected)
			}
		})
	}
}
