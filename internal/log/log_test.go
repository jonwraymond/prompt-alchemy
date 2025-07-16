package log

import (
	"bytes"
	"strings"
	"testing"

	"github.com/sirupsen/logrus"
)

func TestLoggerSanitization(t *testing.T) {
	var buf bytes.Buffer

	// Temporarily redirect the global logrus instance's output
	originalOutput := log.Out
	log.SetOutput(&buf)
	defer log.SetOutput(originalOutput)

	// Use the package's logger, which has the sanitizing formatter
	logger := GetLogger()
	log.SetLevel(logrus.DebugLevel)

	tests := []struct {
		name             string
		logFunc          func()
		shouldContain    string
		shouldNotContain string
	}{
		{
			name: "API key in message",
			logFunc: func() {
				logger.Info("Using API key: sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN")
			},
			shouldContain:    "sk-***REDACTED***",
			shouldNotContain: "sk-1234567890",
		},
		{
			name: "API key in fields",
			logFunc: func() {
				logger.WithField("api_key", "AIzaSyB1234567890abcdefghijklmnopqrstuv").Info("Making API call")
			},
			shouldContain:    "AIza***REDACTED***",
			shouldNotContain: "AIzaSyB12345",
		},
		{
			name: "Multiple fields with sensitive data",
			logFunc: func() {
				logger.WithFields(map[string]interface{}{
					"token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
					"url":   "https://api.example.com?api_key=abcdef123456789012345678901234567890",
				}).Debug("Request details")
			},
			shouldContain:    "***REDACTED***",
			shouldNotContain: "eyJhbGciOiJIUzI1NiI",
		},
		{
			name: "Normal log without sensitive data",
			logFunc: func() {
				logger.Info("Processing completed successfully")
			},
			shouldContain:    "Processing completed successfully",
			shouldNotContain: "***REDACTED***",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buf.Reset()
			tt.logFunc()
			output := buf.String()

			if tt.shouldContain != "" && !strings.Contains(output, tt.shouldContain) {
				t.Errorf("Expected output to contain %q, but got: %s", tt.shouldContain, output)
			}
			if tt.shouldNotContain != "" && strings.Contains(output, tt.shouldNotContain) {
				t.Errorf("Expected output NOT to contain %q, but got: %s", tt.shouldNotContain, output)
			}
		})
	}
}

func TestGetLogger(t *testing.T) {
	logger := GetLogger()
	if logger == nil {
		t.Error("GetLogger() returned nil")
	}
}
