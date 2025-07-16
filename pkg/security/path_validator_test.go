package security

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSafeFilePath(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "path-validator-test")
	assert.NoError(t, err)
	defer func() { _ = os.RemoveAll(tempDir) }()

	// Test cases
	tests := []struct {
		name        string
		basePath    string
		userPath    string
		expectError bool
		description string
	}{
		{
			name:        "Valid relative path",
			basePath:    tempDir,
			userPath:    "subdir/file.txt",
			expectError: false,
			description: "Should allow valid relative paths",
		},
		{
			name:        "Directory traversal attempt",
			basePath:    tempDir,
			userPath:    "../../../etc/passwd",
			expectError: true,
			description: "Should block directory traversal",
		},
		{
			name:        "Current directory reference",
			basePath:    tempDir,
			userPath:    "./file.txt",
			expectError: false,
			description: "Should allow current directory reference",
		},
		{
			name:        "Parent directory traversal",
			basePath:    tempDir,
			userPath:    "subdir/../../../sensitive",
			expectError: true,
			description: "Should block parent directory traversal",
		},
		{
			name:        "Empty path",
			basePath:    tempDir,
			userPath:    "",
			expectError: true,
			description: "Should reject empty paths",
		},
		{
			name:        "Root escape attempt",
			basePath:    tempDir,
			userPath:    "/etc/passwd",
			expectError: true,
			description: "Should block absolute path escapes",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := SafeFilePath(tt.basePath, tt.userPath)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error for %s, but got none. Result: %s", tt.description, result)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error for %s: %v", tt.description, err)
				}
				// Verify the result is within the base directory
				if result != "" {
					rel, err := filepath.Rel(tt.basePath, result)
					if err != nil || (rel != "." && (len(rel) > 2 && rel[:3] == ".."+string(filepath.Separator))) {
						t.Errorf("Result path %s is not within base directory %s", result, tt.basePath)
					}
				}
			}
		})
	}
}

func TestValidateConfigPath(t *testing.T) {
	tests := []struct {
		name        string
		configPath  string
		expectError bool
		description string
	}{
		{
			name:        "Valid absolute path",
			configPath:  "/home/user/.config",
			expectError: false,
			description: "Should allow valid absolute paths",
		},
		{
			name:        "Valid tilde path",
			configPath:  "~/.prompt-alchemy",
			expectError: false,
			description: "Should allow tilde expansion",
		},
		{
			name:        "Traversal in tilde path",
			configPath:  "~/../../etc/passwd",
			expectError: true,
			description: "Should block traversal in tilde paths",
		},
		{
			name:        "Double dot traversal",
			configPath:  "/home/../../../etc/passwd",
			expectError: true,
			description: "Should block double dot traversal",
		},
		{
			name:        "Empty path",
			configPath:  "",
			expectError: true,
			description: "Should reject empty paths",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ValidateConfigPath(tt.configPath)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error for %s, but got none. Result: %s", tt.description, result)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error for %s: %v", tt.description, err)
				}
			}
		})
	}
}

func TestValidateFilename(t *testing.T) {
	tests := []struct {
		name        string
		filename    string
		expectError bool
		description string
	}{
		{
			name:        "Valid filename",
			filename:    "config.yaml",
			expectError: false,
			description: "Should allow valid filenames",
		},
		{
			name:        "Path separator in filename",
			filename:    "config/file.yaml",
			expectError: true,
			description: "Should reject filenames with path separators",
		},
		{
			name:        "Windows path separator",
			filename:    "config\\file.yaml",
			expectError: true,
			description: "Should reject Windows path separators",
		},
		{
			name:        "Current directory",
			filename:    ".",
			expectError: true,
			description: "Should reject current directory",
		},
		{
			name:        "Parent directory",
			filename:    "..",
			expectError: true,
			description: "Should reject parent directory",
		},
		{
			name:        "Null byte injection",
			filename:    "config.yaml\x00.txt",
			expectError: true,
			description: "Should reject null byte injection",
		},
		{
			name:        "Empty filename",
			filename:    "",
			expectError: true,
			description: "Should reject empty filenames",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFilename(tt.filename)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error for %s, but got none", tt.description)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error for %s: %v", tt.description, err)
				}
			}
		})
	}
}

func TestContainsTraversalAttempt(t *testing.T) {
	tests := []struct {
		path     string
		expected bool
	}{
		{"normal/path", false},
		{"../traversal", true},
		{"path/../traversal", true},
		{"path/./normal", false},
		{"%2e%2e/encoded", true},
		{"%2E%2E/encoded", true},
		{"./path/../traversal", true},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			result := containsTraversalAttempt(tt.path)
			if result != tt.expected {
				t.Errorf("containsTraversalAttempt(%q) = %v, want %v", tt.path, result, tt.expected)
			}
		})
	}
}
