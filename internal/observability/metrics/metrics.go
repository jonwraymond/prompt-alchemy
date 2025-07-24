package metrics

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

// Config contains configuration for metrics collection
type Config struct {
	Enabled   bool   `yaml:"enabled" mapstructure:"enabled"`
	Path      string `yaml:"path" mapstructure:"path"`
	Namespace string `yaml:"namespace" mapstructure:"namespace"`
	Subsystem string `yaml:"subsystem" mapstructure:"subsystem"`
}

// Metrics contains all application metrics
type Metrics struct {
	config   Config
	registry *prometheus.Registry
	logger   *logrus.Logger

	// HTTP metrics
	HTTPRequestsTotal   *prometheus.CounterVec
	HTTPRequestDuration *prometheus.HistogramVec
	HTTPRequestSize     *prometheus.HistogramVec
	HTTPResponseSize    *prometheus.HistogramVec

	// Business metrics
	PromptsGenerated    *prometheus.CounterVec
	GenerationDuration  *prometheus.HistogramVec
	TokensUsed          *prometheus.CounterVec
	PhaseProcessingTime *prometheus.HistogramVec
	ProviderRequests    *prometheus.CounterVec
	ProviderErrors      *prometheus.CounterVec

	// System metrics
	ActiveConnections prometheus.Gauge
	StorageOperations *prometheus.CounterVec
	CacheHitRate      *prometheus.GaugeVec

	// Learning metrics
	ModelTrainingEvents *prometheus.CounterVec
	RankingAccuracy     *prometheus.GaugeVec
	LearningIterations  *prometheus.CounterVec
}

// NewMetrics creates a new metrics instance
func NewMetrics(config Config, logger *logrus.Logger) (*Metrics, error) {
	if !config.Enabled {
		logger.Info("Metrics collection disabled")
		return &Metrics{config: config, logger: logger}, nil
	}

	registry := prometheus.NewRegistry()

	// Create metric instances
	m := &Metrics{
		config:   config,
		registry: registry,
		logger:   logger,

		// HTTP metrics
		HTTPRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "http_requests_total",
				Help:      "Total number of HTTP requests",
			},
			[]string{"method", "path", "status_code"},
		),

		HTTPRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "http_request_duration_seconds",
				Help:      "HTTP request duration in seconds",
				Buckets:   []float64{0.001, 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0},
			},
			[]string{"method", "path"},
		),

		HTTPRequestSize: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "http_request_size_bytes",
				Help:      "HTTP request size in bytes",
				Buckets:   prometheus.ExponentialBuckets(100, 10, 8),
			},
			[]string{"method", "path"},
		),

		HTTPResponseSize: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "http_response_size_bytes",
				Help:      "HTTP response size in bytes",
				Buckets:   prometheus.ExponentialBuckets(100, 10, 8),
			},
			[]string{"method", "path"},
		),

		// Business metrics
		PromptsGenerated: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "prompts_generated_total",
				Help:      "Total number of prompts generated",
			},
			[]string{"phase", "provider", "persona"},
		),

		GenerationDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "generation_duration_seconds",
				Help:      "Prompt generation duration in seconds",
				Buckets:   []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0},
			},
			[]string{"phase", "provider"},
		),

		TokensUsed: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "tokens_used_total",
				Help:      "Total number of tokens consumed",
			},
			[]string{"provider", "model"},
		),

		PhaseProcessingTime: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "phase_processing_seconds",
				Help:      "Alchemical phase processing time in seconds",
				Buckets:   []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0},
			},
			[]string{"phase"},
		),

		ProviderRequests: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "provider_requests_total",
				Help:      "Total number of requests to AI providers",
			},
			[]string{"provider", "model", "operation"},
		),

		ProviderErrors: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "provider_errors_total",
				Help:      "Total number of provider errors",
			},
			[]string{"provider", "error_type"},
		),

		// System metrics
		ActiveConnections: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "active_connections",
				Help:      "Number of active HTTP connections",
			},
		),

		StorageOperations: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "storage_operations_total",
				Help:      "Total number of storage operations",
			},
			[]string{"operation", "table"},
		),

		CacheHitRate: prometheus.NewGaugeVec(
			prometheus.GaugeOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "cache_hit_rate",
				Help:      "Cache hit rate percentage",
			},
			[]string{"cache_type"},
		),

		// Learning metrics
		ModelTrainingEvents: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "model_training_events_total",
				Help:      "Total number of model training events",
			},
			[]string{"model_type", "event_type"},
		),

		RankingAccuracy: prometheus.NewGaugeVec(
			prometheus.GaugeOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "ranking_accuracy",
				Help:      "Ranking model accuracy score",
			},
			[]string{"model_version"},
		),

		LearningIterations: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: config.Namespace,
				Subsystem: config.Subsystem,
				Name:      "learning_iterations_total",
				Help:      "Total number of learning iterations",
			},
			[]string{"algorithm", "outcome"},
		),
	}

	// Register all metrics
	if err := m.registerMetrics(); err != nil {
		return nil, err
	}

	logger.WithField("namespace", config.Namespace).Info("Metrics collection initialized")
	return m, nil
}

// registerMetrics registers all metrics with the registry
func (m *Metrics) registerMetrics() error {
	if !m.config.Enabled {
		return nil
	}

	metrics := []prometheus.Collector{
		m.HTTPRequestsTotal,
		m.HTTPRequestDuration,
		m.HTTPRequestSize,
		m.HTTPResponseSize,
		m.PromptsGenerated,
		m.GenerationDuration,
		m.TokensUsed,
		m.PhaseProcessingTime,
		m.ProviderRequests,
		m.ProviderErrors,
		m.ActiveConnections,
		m.StorageOperations,
		m.CacheHitRate,
		m.ModelTrainingEvents,
		m.RankingAccuracy,
		m.LearningIterations,
	}

	for _, metric := range metrics {
		if err := m.registry.Register(metric); err != nil {
			return err
		}
	}

	return nil
}

// Handler returns the HTTP handler for metrics endpoint
func (m *Metrics) Handler() http.Handler {
	if !m.config.Enabled {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("Metrics disabled"))
		})
	}
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{})
}

// Middleware creates HTTP middleware for metrics collection
func (m *Metrics) Middleware() func(http.Handler) http.Handler {
	if !m.config.Enabled {
		return func(next http.Handler) http.Handler {
			return next // Pass through if metrics disabled
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Increment active connections
			m.ActiveConnections.Inc()
			defer m.ActiveConnections.Dec()

			// Capture request size
			requestSize := float64(r.ContentLength)
			if requestSize > 0 {
				m.HTTPRequestSize.WithLabelValues(r.Method, r.URL.Path).Observe(requestSize)
			}

			// Wrap response writer to capture response metrics
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Process request
			next.ServeHTTP(rw, r)

			// Record metrics
			duration := time.Since(start).Seconds()

			labels := prometheus.Labels{
				"method": r.Method,
				"path":   r.URL.Path,
			}

			statusLabels := prometheus.Labels{
				"method":      r.Method,
				"path":        r.URL.Path,
				"status_code": strconv.Itoa(rw.statusCode),
			}

			m.HTTPRequestsTotal.With(statusLabels).Inc()
			m.HTTPRequestDuration.With(labels).Observe(duration)

			if rw.responseSize > 0 {
				m.HTTPResponseSize.With(labels).Observe(float64(rw.responseSize))
			}
		})
	}
}

// Business metric recording methods

// RecordPromptGeneration records metrics for prompt generation
func (m *Metrics) RecordPromptGeneration(ctx context.Context, phase, provider, persona string, duration time.Duration, tokens int) {
	if !m.config.Enabled {
		return
	}

	m.PromptsGenerated.WithLabelValues(phase, provider, persona).Inc()
	m.GenerationDuration.WithLabelValues(phase, provider).Observe(duration.Seconds())
	m.PhaseProcessingTime.WithLabelValues(phase).Observe(duration.Seconds())

	if tokens > 0 {
		m.TokensUsed.WithLabelValues(provider, "unknown").Add(float64(tokens))
	}
}

// RecordProviderRequest records metrics for AI provider requests
func (m *Metrics) RecordProviderRequest(provider, model, operation string) {
	if !m.config.Enabled {
		return
	}
	m.ProviderRequests.WithLabelValues(provider, model, operation).Inc()
}

// RecordProviderError records metrics for AI provider errors
func (m *Metrics) RecordProviderError(provider, errorType string) {
	if !m.config.Enabled {
		return
	}
	m.ProviderErrors.WithLabelValues(provider, errorType).Inc()
}

// RecordStorageOperation records metrics for storage operations
func (m *Metrics) RecordStorageOperation(operation, table string) {
	if !m.config.Enabled {
		return
	}
	m.StorageOperations.WithLabelValues(operation, table).Inc()
}

// RecordCacheHitRate records cache hit rate metrics
func (m *Metrics) RecordCacheHitRate(cacheType string, hitRate float64) {
	if !m.config.Enabled {
		return
	}
	m.CacheHitRate.WithLabelValues(cacheType).Set(hitRate)
}

// RecordLearningEvent records learning-related metrics
func (m *Metrics) RecordLearningEvent(algorithm, outcome string) {
	if !m.config.Enabled {
		return
	}
	m.LearningIterations.WithLabelValues(algorithm, outcome).Inc()
}

// RecordModelTraining records model training events
func (m *Metrics) RecordModelTraining(modelType, eventType string) {
	if !m.config.Enabled {
		return
	}
	m.ModelTrainingEvents.WithLabelValues(modelType, eventType).Inc()
}

// SetRankingAccuracy sets the ranking model accuracy
func (m *Metrics) SetRankingAccuracy(modelVersion string, accuracy float64) {
	if !m.config.Enabled {
		return
	}
	m.RankingAccuracy.WithLabelValues(modelVersion).Set(accuracy)
}

// GetMetrics returns current metric values for debugging
func (m *Metrics) GetMetrics() map[string]interface{} {
	if !m.config.Enabled {
		return map[string]interface{}{"enabled": false}
	}

	// This is a simplified representation for debugging
	return map[string]interface{}{
		"enabled":   true,
		"namespace": m.config.Namespace,
		"subsystem": m.config.Subsystem,
		"registry":  "prometheus",
	}
}

// responseWriter wraps http.ResponseWriter to capture response metrics
type responseWriter struct {
	http.ResponseWriter
	statusCode   int
	responseSize int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.responseSize += size
	return size, err
}

// DefaultConfig returns default metrics configuration
func DefaultConfig() Config {
	return Config{
		Enabled:   true,
		Path:      "/metrics",
		Namespace: "prompt_alchemy",
		Subsystem: "api",
	}
}
