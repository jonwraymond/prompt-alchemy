package log

import (
	"context"
	"os"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/sirupsen/logrus"
)

// Logger wraps the existing logrus logger with additional observability features
type Logger struct {
	*logrus.Logger
}

// NewLogger creates a new enhanced logger
func NewLogger() *Logger {
	return &Logger{
		Logger: log.GetLogger(),
	}
}

// NewLoggerWithConfig creates a logger with specific configuration
func NewLoggerWithConfig(config Config) *Logger {
	logger := logrus.New()

	// Set output
	switch config.Output {
	case "stdout":
		logger.SetOutput(os.Stdout)
	case "stderr":
		logger.SetOutput(os.Stderr)
	case "file":
		if config.File != "" {
			file, err := os.OpenFile(config.File, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err == nil {
				logger.SetOutput(file)
			}
		}
	}

	// Set level
	level, err := logrus.ParseLevel(config.Level)
	if err == nil {
		logger.SetLevel(level)
	}

	// Set format
	switch config.Format {
	case "json":
		logger.SetFormatter(&logrus.JSONFormatter{})
	case "text":
		logger.SetFormatter(&logrus.TextFormatter{})
	}

	return &Logger{Logger: logger}
}

// Config represents logging configuration
type Config struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
	Output string `yaml:"output"`
	File   string `yaml:"file"`
}

// WithRequestID adds a request ID to the logger context
func (l *Logger) WithRequestID(requestID string) *logrus.Entry {
	return l.WithField("request_id", requestID)
}

// WithUserID adds a user ID to the logger context
func (l *Logger) WithUserID(userID string) *logrus.Entry {
	return l.WithField("user_id", userID)
}

// WithSessionID adds a session ID to the logger context
func (l *Logger) WithSessionID(sessionID string) *logrus.Entry {
	return l.WithField("session_id", sessionID)
}

// WithOperation adds an operation name to the logger context
func (l *Logger) WithOperation(operation string) *logrus.Entry {
	return l.WithField("operation", operation)
}

// WithComponent adds a component name to the logger context
func (l *Logger) WithComponent(component string) *logrus.Entry {
	return l.WithField("component", component)
}

// WithDuration adds a duration to the logger context
func (l *Logger) WithDuration(duration string) *logrus.Entry {
	return l.WithField("duration", duration)
}

// WithProvider adds a provider name to the logger context
func (l *Logger) WithProvider(provider string) *logrus.Entry {
	return l.WithField("provider", provider)
}

// WithPhase adds a phase to the logger context
func (l *Logger) WithPhase(phase string) *logrus.Entry {
	return l.WithField("phase", phase)
}

// FromContext extracts a logger from context or returns the default logger
func (l *Logger) FromContext(ctx context.Context) *logrus.Entry {
	if entry, ok := ctx.Value("logger").(*logrus.Entry); ok {
		return entry
	}
	return logrus.NewEntry(l.Logger)
}

// ToContext adds the logger to context
func (l *Logger) ToContext(ctx context.Context) context.Context {
	return context.WithValue(ctx, "logger", logrus.NewEntry(l.Logger))
}

// Structured logging helpers

// LogAPIRequest logs an incoming API request
func (l *Logger) LogAPIRequest(method, path, userAgent string, duration string) {
	l.WithFields(logrus.Fields{
		"type":       "api_request",
		"method":     method,
		"path":       path,
		"user_agent": userAgent,
		"duration":   duration,
	}).Info("API request processed")
}

// LogProviderRequest logs a request to an AI provider
func (l *Logger) LogProviderRequest(provider, model string, tokens int, duration string) {
	l.WithFields(logrus.Fields{
		"type":     "provider_request",
		"provider": provider,
		"model":    model,
		"tokens":   tokens,
		"duration": duration,
	}).Info("Provider request completed")
}

// LogGenerationEvent logs a prompt generation event
func (l *Logger) LogGenerationEvent(sessionID, phase string, promptCount int, duration string) {
	l.WithFields(logrus.Fields{
		"type":         "generation_event",
		"session_id":   sessionID,
		"phase":        phase,
		"prompt_count": promptCount,
		"duration":     duration,
	}).Info("Prompt generation completed")
}

// LogOptimizationEvent logs a prompt optimization event
func (l *Logger) LogOptimizationEvent(promptID string, iterations int, finalScore float64, duration string) {
	l.WithFields(logrus.Fields{
		"type":        "optimization_event",
		"prompt_id":   promptID,
		"iterations":  iterations,
		"final_score": finalScore,
		"duration":    duration,
	}).Info("Prompt optimization completed")
}

// LogSecurityEvent logs a security-related event
func (l *Logger) LogSecurityEvent(eventType, userID, details string) {
	l.WithFields(logrus.Fields{
		"type":       "security_event",
		"event_type": eventType,
		"user_id":    userID,
		"details":    details,
	}).Warn("Security event detected")
}

// LogPerformanceMetric logs a performance metric
func (l *Logger) LogPerformanceMetric(metric string, value float64, unit string) {
	l.WithFields(logrus.Fields{
		"type":   "performance_metric",
		"metric": metric,
		"value":  value,
		"unit":   unit,
	}).Info("Performance metric recorded")
}
