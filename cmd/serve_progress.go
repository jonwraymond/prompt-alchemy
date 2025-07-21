package cmd

import (
	"encoding/json"
	"fmt"
	"sync"
)

// ProgressNotification represents an MCP progress notification
type ProgressNotification struct {
	JSONRPC string                     `json:"jsonrpc"`
	Method  string                     `json:"method"`
	Params  ProgressNotificationParams `json:"params"`
}

type ProgressNotificationParams struct {
	ProgressToken interface{}  `json:"progressToken"`
	Progress      ProgressData `json:"progress"`
}

type ProgressData struct {
	Kind        string  `json:"kind"`
	Title       string  `json:"title,omitempty"`
	Message     string  `json:"message,omitempty"`
	Percentage  float64 `json:"percentage,omitempty"`
	Cancellable bool    `json:"cancellable,omitempty"`
}

// ProgressTracker manages progress notifications for MCP
type ProgressTracker struct {
	mu     sync.Mutex
	writer *json.Encoder
	tokens map[interface{}]bool
}

// NewProgressTracker creates a new progress tracker
func NewProgressTracker(encoder *json.Encoder) *ProgressTracker {
	return &ProgressTracker{
		writer: encoder,
		tokens: make(map[interface{}]bool),
	}
}

// Start begins progress tracking for a token
func (pt *ProgressTracker) Start(token interface{}, title string) error {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	pt.tokens[token] = true

	return pt.sendProgress(token, ProgressData{
		Kind:    "begin",
		Title:   title,
		Message: "Starting...",
	})
}

// Update sends a progress update
func (pt *ProgressTracker) Update(token interface{}, message string, percentage float64) error {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	if !pt.tokens[token] {
		return fmt.Errorf("unknown progress token")
	}

	return pt.sendProgress(token, ProgressData{
		Kind:       "report",
		Message:    message,
		Percentage: percentage,
	})
}

// End completes progress tracking for a token
func (pt *ProgressTracker) End(token interface{}, message string) error {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	if !pt.tokens[token] {
		return fmt.Errorf("unknown progress token")
	}

	delete(pt.tokens, token)

	return pt.sendProgress(token, ProgressData{
		Kind:    "end",
		Message: message,
	})
}

// sendProgress sends a progress notification
func (pt *ProgressTracker) sendProgress(token interface{}, progress ProgressData) error {
	notification := ProgressNotification{
		JSONRPC: "2.0",
		Method:  "$/progress",
		Params: ProgressNotificationParams{
			ProgressToken: token,
			Progress:      progress,
		},
	}

	return pt.writer.Encode(notification)
}

// WithProgress wraps a function with progress tracking
func (s *MCPServer) WithProgress(token interface{}, title string, fn func(*ProgressTracker) error) error {
	tracker := NewProgressTracker(json.NewEncoder(s.writer))

	// Start progress
	if err := tracker.Start(token, title); err != nil {
		s.logger.WithError(err).Warn("Failed to start progress")
	}

	// Execute function with progress tracking
	err := fn(tracker)

	// End progress
	endMsg := "Completed"
	if err != nil {
		endMsg = fmt.Sprintf("Failed: %v", err)
	}

	if endErr := tracker.End(token, endMsg); endErr != nil {
		s.logger.WithError(endErr).Warn("Failed to end progress")
	}

	return err
}
