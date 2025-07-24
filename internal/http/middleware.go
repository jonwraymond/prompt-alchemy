package http

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// MiddlewareConfig contains configuration for middleware
type MiddlewareConfig struct {
	EnableCORS      bool
	CORSOrigins     []string
	EnableAuth      bool
	APIKeys         []string
	EnableRateLimit bool
	RequestsPerMin  int
	Burst           int
}

// SetupMiddleware configures and returns common middleware stack
func SetupMiddleware(logger *logrus.Logger, config MiddlewareConfig) []func(http.Handler) http.Handler {
	var middlewares []func(http.Handler) http.Handler

	// Request ID middleware (always first)
	middlewares = append(middlewares, middleware.RequestID)

	// Real IP middleware
	middlewares = append(middlewares, middleware.RealIP)

	// Custom logging middleware
	middlewares = append(middlewares, RequestLogger(logger))

	// Recovery middleware
	middlewares = append(middlewares, middleware.Recoverer)

	// Timeout middleware
	middlewares = append(middlewares, middleware.Timeout(60*time.Second))

	// CORS middleware
	if config.EnableCORS {
		corsMiddleware := cors.Handler(cors.Options{
			AllowedOrigins:   config.CORSOrigins,
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
			ExposedHeaders:   []string{"Link", "X-Request-ID"},
			AllowCredentials: true,
			MaxAge:           300,
		})
		middlewares = append(middlewares, corsMiddleware)
	}

	// Authentication middleware
	if config.EnableAuth && len(config.APIKeys) > 0 {
		middlewares = append(middlewares, APIKeyAuth(config.APIKeys, logger))
	}

	// Rate limiting middleware
	if config.EnableRateLimit {
		middlewares = append(middlewares, RateLimit(config.RequestsPerMin, config.Burst, logger))
	}

	return middlewares
}

// RequestLogger creates a structured logging middleware
func RequestLogger(logger *logrus.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Get or create request ID
			reqID := middleware.GetReqID(r.Context())
			if reqID == "" {
				reqID = uuid.New().String()
			}

			// Wrap response writer to capture status code
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			// Process request
			next.ServeHTTP(ww, r)

			// Log request
			duration := time.Since(start)
			logger.WithFields(logrus.Fields{
				"request_id":  reqID,
				"method":      r.Method,
				"path":        r.URL.Path,
				"status":      ww.Status(),
				"bytes_out":   ww.BytesWritten(),
				"duration_ms": duration.Milliseconds(),
				"user_agent":  r.UserAgent(),
				"remote_addr": r.RemoteAddr,
				"proto":       r.Proto,
			}).Info("Request completed")
		})
	}
}

// APIKeyAuth provides API key authentication middleware
func APIKeyAuth(validKeys []string, logger *logrus.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip auth for health checks and public endpoints
			if r.URL.Path == "/health" || r.URL.Path == "/version" {
				next.ServeHTTP(w, r)
				return
			}

			// Get API key from header or query parameter
			apiKey := r.Header.Get("Authorization")
			if apiKey == "" {
				apiKey = r.Header.Get("X-API-Key")
			}
			if apiKey == "" {
				apiKey = r.URL.Query().Get("api_key")
			}

			// Remove "Bearer " prefix if present
			if len(apiKey) > 7 && apiKey[:7] == "Bearer " {
				apiKey = apiKey[7:]
			}

			// Validate API key
			if apiKey == "" {
				logger.WithField("remote_addr", r.RemoteAddr).Warn("Missing API key")
				http.Error(w, "API key required", http.StatusUnauthorized)
				return
			}

			valid := false
			for _, validKey := range validKeys {
				if apiKey == validKey {
					valid = true
					break
				}
			}

			if !valid {
				logger.WithFields(logrus.Fields{
					"remote_addr": r.RemoteAddr,
					"api_key":     apiKey[:8] + "...", // Log only first 8 chars for security
				}).Warn("Invalid API key")
				http.Error(w, "Invalid API key", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RateLimit provides simple in-memory rate limiting middleware
func RateLimit(requestsPerMin int, burst int, logger *logrus.Logger) func(next http.Handler) http.Handler {
	// Simple in-memory rate limiter using a map
	// For production, use Redis or similar distributed storage
	clients := make(map[string]*ClientLimiter)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := r.RemoteAddr

			// Get or create client limiter
			limiter, exists := clients[clientIP]
			if !exists {
				limiter = NewClientLimiter(requestsPerMin, burst)
				clients[clientIP] = limiter
			}

			if !limiter.Allow() {
				logger.WithFields(logrus.Fields{
					"remote_addr": clientIP,
					"path":        r.URL.Path,
				}).Warn("Rate limit exceeded")

				w.Header().Set("Retry-After", "60")
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ClientLimiter represents a simple token bucket rate limiter
type ClientLimiter struct {
	tokens     int
	maxTokens  int
	refillRate int
	lastRefill time.Time
}

// NewClientLimiter creates a new rate limiter for a client
func NewClientLimiter(requestsPerMin, burst int) *ClientLimiter {
	return &ClientLimiter{
		tokens:     burst,
		maxTokens:  burst,
		refillRate: requestsPerMin,
		lastRefill: time.Now(),
	}
}

// Allow checks if a request is allowed under the rate limit
func (cl *ClientLimiter) Allow() bool {
	now := time.Now()
	elapsed := now.Sub(cl.lastRefill)

	// Refill tokens based on elapsed time
	tokensToAdd := int(elapsed.Minutes()) * cl.refillRate
	if tokensToAdd > 0 {
		cl.tokens += tokensToAdd
		if cl.tokens > cl.maxTokens {
			cl.tokens = cl.maxTokens
		}
		cl.lastRefill = now
	}

	// Check if we have tokens available
	if cl.tokens > 0 {
		cl.tokens--
		return true
	}

	return false
}

// SecurityHeaders adds common security headers
func SecurityHeaders() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Security headers
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

			// Content Security Policy for APIs
			w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")

			next.ServeHTTP(w, r)
		})
	}
}

// RequestID adds request ID if not present
func RequestID() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			reqID := r.Header.Get("X-Request-ID")
			if reqID == "" {
				reqID = uuid.New().String()
				r.Header.Set("X-Request-ID", reqID)
			}
			w.Header().Set("X-Request-ID", reqID)
			next.ServeHTTP(w, r)
		})
	}
}

// HealthCheck provides a simple health check endpoint
func HealthCheck() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"healthy","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}
