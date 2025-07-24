package httputil

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
)

// Response represents a standard API response
type Response struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrorInfo  `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"request_id,omitempty"`
}

// ErrorInfo represents error details in API responses
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Response
	Pagination *PaginationInfo `json:"pagination,omitempty"`
}

// PaginationInfo contains pagination metadata
type PaginationInfo struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}

// WriteJSON writes a JSON response with the given status code
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	response := Response{
		Success:   status >= 200 && status < 300,
		Data:      data,
		Timestamp: time.Now(),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.GetLogger().WithError(err).Error("Failed to encode JSON response")
	}
}

// WriteError writes a JSON error response
func WriteError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	response := Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
		Timestamp: time.Now(),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.GetLogger().WithError(err).Error("Failed to encode JSON error response")
	}
}

// WriteErrorWithDetails writes a JSON error response with additional details
func WriteErrorWithDetails(w http.ResponseWriter, status int, code, message, details string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	response := Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now(),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.GetLogger().WithError(err).Error("Failed to encode JSON error response")
	}
}

// WritePaginatedJSON writes a paginated JSON response
func WritePaginatedJSON(w http.ResponseWriter, status int, data interface{}, pagination *PaginationInfo) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	response := PaginatedResponse{
		Response: Response{
			Success:   status >= 200 && status < 300,
			Data:      data,
			Timestamp: time.Now(),
		},
		Pagination: pagination,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.GetLogger().WithError(err).Error("Failed to encode JSON response")
	}
}

// BadRequest writes a 400 Bad Request error
func BadRequest(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusBadRequest, "BAD_REQUEST", message)
}

// Unauthorized writes a 401 Unauthorized error
func Unauthorized(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", message)
}

// Forbidden writes a 403 Forbidden error
func Forbidden(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusForbidden, "FORBIDDEN", message)
}

// NotFound writes a 404 Not Found error
func NotFound(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusNotFound, "NOT_FOUND", message)
}

// InternalServerError writes a 500 Internal Server Error
func InternalServerError(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message)
}

// NotImplemented writes a 501 Not Implemented error
func NotImplemented(w http.ResponseWriter, message string) {
	WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", message)
}

// Created writes a 201 Created response
func Created(w http.ResponseWriter, data interface{}) {
	WriteJSON(w, http.StatusCreated, data)
}

// OK writes a 200 OK response
func OK(w http.ResponseWriter, data interface{}) {
	WriteJSON(w, http.StatusOK, data)
}

// NoContent writes a 204 No Content response
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// CalculatePagination calculates pagination metadata
func CalculatePagination(page, limit, total int) *PaginationInfo {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}

	totalPages := (total + limit - 1) / limit
	if totalPages <= 0 {
		totalPages = 1
	}

	return &PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

// ParsePagination extracts pagination parameters from HTTP request
func ParsePagination(r *http.Request) (page, limit int) {
	page = 1
	limit = 20

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := parsePositiveInt(pageStr); err == nil {
			page = p
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := parsePositiveInt(limitStr); err == nil && l <= 100 {
			limit = l
		}
	}

	return page, limit
}

// parsePositiveInt parses a string as a positive integer
func parsePositiveInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}

	var result int
	for _, r := range s {
		if r < '0' || r > '9' {
			return 0, &InvalidIntError{Value: s}
		}
		result = result*10 + int(r-'0')
	}

	if result <= 0 {
		return 0, &InvalidIntError{Value: s}
	}

	return result, nil
}

// InvalidIntError represents an error parsing an integer
type InvalidIntError struct {
	Value string
}

func (e *InvalidIntError) Error() string {
	return "invalid integer: " + e.Value
}
