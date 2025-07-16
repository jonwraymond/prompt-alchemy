package security

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// SafeFilePath validates and cleans a file path to prevent directory traversal attacks
func SafeFilePath(basePath, userPath string) (string, error) {
	if userPath == "" {
		return "", fmt.Errorf("path cannot be empty")
	}

	// Reject absolute paths in user input
	if filepath.IsAbs(userPath) {
		return "", fmt.Errorf("absolute paths not allowed in user input")
	}

	// Clean the paths to resolve any . or .. components
	cleanBase := filepath.Clean(basePath)
	cleanUser := filepath.Clean(userPath)

	// Convert base to absolute path
	absBase, err := filepath.Abs(cleanBase)
	if err != nil {
		return "", fmt.Errorf("failed to resolve base path: %w", err)
	}

	// Join the paths safely
	fullPath := filepath.Join(absBase, cleanUser)
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to resolve full path: %w", err)
	}

	// Ensure the resulting path is still within the base directory
	if !strings.HasPrefix(absPath, absBase+string(filepath.Separator)) && absPath != absBase {
		return "", fmt.Errorf("path traversal detected: attempted to access path outside base directory")
	}

	return absPath, nil
}

// ValidateConfigPath validates configuration directory paths with tilde expansion
func ValidateConfigPath(configPath string) (string, error) {
	if configPath == "" {
		return "", fmt.Errorf("config path cannot be empty")
	}

	// Handle tilde expansion safely
	if strings.HasPrefix(configPath, "~/") {
		// Only allow tilde at the start followed by /
		homeDir, err := GetUserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get home directory: %w", err)
		}

		// Extract the path after ~/
		relativePath := configPath[2:]

		// Validate the relative path doesn't contain traversal attempts
		if containsTraversalAttempt(relativePath) {
			return "", fmt.Errorf("invalid path: contains directory traversal attempt")
		}

		return filepath.Join(homeDir, relativePath), nil
	}

	// For absolute paths, clean and validate
	cleanPath := filepath.Clean(configPath)

	// Check for traversal attempts
	if containsTraversalAttempt(configPath) {
		return "", fmt.Errorf("invalid path: contains directory traversal attempt")
	}

	return cleanPath, nil
}

// ValidateDataDir validates data directory paths with proper security checks
func ValidateDataDir(dataDir string) (string, error) {
	if dataDir == "" {
		// Default to safe location
		homeDir, err := GetUserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get home directory: %w", err)
		}
		return filepath.Join(homeDir, ".prompt-alchemy"), nil
	}

	return ValidateConfigPath(dataDir)
}

// GetUserHomeDir safely gets the user's home directory
func GetUserHomeDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}
	return homeDir, nil
}

// containsTraversalAttempt checks for directory traversal patterns
func containsTraversalAttempt(path string) bool {
	// Check for obvious traversal patterns
	if strings.Contains(path, "..") {
		return true
	}

	// Check for encoded traversal attempts
	if strings.Contains(path, "%2e%2e") || strings.Contains(path, "%2E%2E") {
		return true
	}

	// Check for specific suspicious patterns that include traversal
	if strings.Contains(path, "./../") || strings.Contains(path, "/..") {
		return true
	}

	return false
}

// ValidateFilename validates that a filename is safe (no path separators or special chars)
func ValidateFilename(filename string) error {
	if filename == "" {
		return fmt.Errorf("filename cannot be empty")
	}

	// Check for path separators
	if strings.ContainsAny(filename, "/\\") {
		return fmt.Errorf("filename cannot contain path separators")
	}

	// Check for special files
	if filename == "." || filename == ".." {
		return fmt.Errorf("filename cannot be '.' or '..'")
	}

	// Check for null bytes
	if strings.Contains(filename, "\x00") {
		return fmt.Errorf("filename cannot contain null bytes")
	}

	return nil
}
