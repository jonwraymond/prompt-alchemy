package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	v1 "github.com/jonwraymond/prompt-alchemy/internal/api/v1"
	"github.com/jonwraymond/prompt-alchemy/internal/domain/prompt"
	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/observability/metrics"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

const (
	defaultConfigFile = "config.yaml"
	defaultHost       = "localhost"
	defaultPort       = 8080
)

func main() {
	// Initialize context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Setup signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		logrus.Info("Received shutdown signal, initiating graceful shutdown...")
		cancel()
	}()

	// Initialize configuration
	if err := initConfig(); err != nil {
		logrus.WithError(err).Fatal("Failed to initialize configuration")
	}

	// Initialize logger
	logger := initLogger()
	logger.Info("Starting Prompt Alchemy API server...")

	// Initialize metrics
	metricsConfig := metrics.Config{
		Enabled:   viper.GetBool("metrics.enabled"),
		Path:      viper.GetString("metrics.path"),
		Namespace: viper.GetString("metrics.namespace"),
		Subsystem: viper.GetString("metrics.subsystem"),
	}
	if metricsConfig.Enabled && metricsConfig.Path == "" {
		metricsConfig.Path = "/metrics"
	}
	if metricsConfig.Namespace == "" {
		metricsConfig.Namespace = "prompt_alchemy"
	}
	if metricsConfig.Subsystem == "" {
		metricsConfig.Subsystem = "api"
	}

	appMetrics, err := metrics.NewMetrics(metricsConfig, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize metrics")
	}

	// Initialize storage
	storage, err := initStorage(ctx, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize storage")
	}
	defer storage.Close()

	// Initialize provider registry
	registry := providers.NewRegistry()
	if err := registerProviders(registry, logger); err != nil {
		logger.WithError(err).Fatal("Failed to register providers")
	}

	// Initialize engine
	engine := engine.NewEngine(registry, logger)
	engine.SetStorage(storage)

	// Initialize ranker (optional)
	var ranker *ranking.Ranker
	if viper.GetBool("ranking.enabled") {
		ranker = ranking.NewRanker(storage, registry, logger)
		logger.Info("Ranking system initialized")
	}

	// Initialize learning engine (optional)
	var learningEng *learning.LearningEngine
	if viper.GetBool("learning.enabled") {
		learningEng = learning.NewLearningEngine(storage, registry, logger)
		logger.Info("Learning engine initialized")
	}

	// Initialize domain services
	promptService := prompt.NewService(storage, engine, ranker, registry, logger)

	// Setup router configuration
	routerConfig := v1.RouterConfig{
		EnableCORS:      viper.GetBool("http.enable_cors"),
		CORSOrigins:     viper.GetStringSlice("http.cors_origins"),
		EnableAuth:      viper.GetBool("http.enable_auth"),
		APIKeys:         viper.GetStringSlice("http.api_keys"),
		EnableRateLimit: viper.GetBool("http.enable_rate_limit"),
		RequestsPerMin:  viper.GetInt("http.rate_limit.requests_per_minute"),
		Burst:           viper.GetInt("http.rate_limit.burst"),
	}

	// Set defaults for rate limiting
	if routerConfig.RequestsPerMin == 0 {
		routerConfig.RequestsPerMin = 60
	}
	if routerConfig.Burst == 0 {
		routerConfig.Burst = 100
	}

	// Setup router dependencies
	routerDeps := v1.RouterDependencies{
		Storage:     storage,
		Registry:    registry,
		Engine:      engine,
		Ranker:      ranker,
		LearningEng: learningEng,
		PromptSvc:   promptService,
		Logger:      logger,
		Metrics:     appMetrics,
	}

	// Create router and setup routes
	router := v1.NewRouter(routerConfig, routerDeps)
	handler := router.SetupRoutes()

	// Setup HTTP server
	host := viper.GetString("server.host")
	port := viper.GetInt("server.port")
	if host == "" {
		host = defaultHost
	}
	if port == 0 {
		port = defaultPort
	}

	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", host, port),
		Handler:      handler,
		ReadTimeout:  viper.GetDuration("server.timeout.read"),
		WriteTimeout: viper.GetDuration("server.timeout.write"),
		IdleTimeout:  viper.GetDuration("server.timeout.idle"),
	}

	// Set default timeouts if not configured
	if server.ReadTimeout == 0 {
		server.ReadTimeout = 30 * time.Second
	}
	if server.WriteTimeout == 0 {
		server.WriteTimeout = 30 * time.Second
	}
	if server.IdleTimeout == 0 {
		server.IdleTimeout = 120 * time.Second
	}

	// Start server in goroutine
	serverErrChan := make(chan error, 1)
	go func() {
		logger.WithFields(logrus.Fields{
			"host": host,
			"port": port,
		}).Info("HTTP server starting...")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErrChan <- err
		}
	}()

	// Wait for shutdown signal or server error
	select {
	case err := <-serverErrChan:
		logger.WithError(err).Fatal("Server failed to start")
	case <-ctx.Done():
		logger.Info("Shutdown signal received")
	}

	// Graceful shutdown
	shutdownTimeout := viper.GetDuration("server.timeout.shutdown")
	if shutdownTimeout == 0 {
		shutdownTimeout = 10 * time.Second
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer shutdownCancel()

	logger.Info("Shutting down server...")
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.WithError(err).Error("Server forced to shutdown")
	} else {
		logger.Info("Server exited gracefully")
	}
}

// initConfig initializes application configuration
func initConfig() error {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("/etc/prompt-alchemy")

	// Set defaults
	viper.SetDefault("server.host", defaultHost)
	viper.SetDefault("server.port", defaultPort)
	viper.SetDefault("server.timeout.read", "30s")
	viper.SetDefault("server.timeout.write", "30s")
	viper.SetDefault("server.timeout.idle", "120s")
	viper.SetDefault("server.timeout.shutdown", "10s")

	viper.SetDefault("http.enable_cors", true)
	viper.SetDefault("http.cors_origins", []string{"*"})
	viper.SetDefault("http.enable_auth", false)
	viper.SetDefault("http.enable_rate_limit", true)
	viper.SetDefault("http.rate_limit.requests_per_minute", 60)
	viper.SetDefault("http.rate_limit.burst", 100)

	viper.SetDefault("metrics.enabled", true)
	viper.SetDefault("metrics.path", "/metrics")
	viper.SetDefault("metrics.namespace", "prompt_alchemy")
	viper.SetDefault("metrics.subsystem", "api")

	viper.SetDefault("ranking.enabled", false)
	viper.SetDefault("learning.enabled", false)

	// Read environment variables
	viper.AutomaticEnv()

	// Try to read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			logrus.Warn("No config file found, using defaults and environment variables")
		} else {
			return fmt.Errorf("error reading config file: %w", err)
		}
	} else {
		logrus.WithField("config_file", viper.ConfigFileUsed()).Info("Configuration loaded")
	}

	return nil
}

// initLogger initializes and configures the logger
func initLogger() *logrus.Logger {
	logger := logrus.New()

	// Set log level
	level := viper.GetString("log.level")
	if level != "" {
		if logLevel, err := logrus.ParseLevel(level); err == nil {
			logger.SetLevel(logLevel)
		}
	}

	// Set log format
	format := viper.GetString("log.format")
	if format == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	} else {
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}

	return logger
}

// initStorage initializes the storage layer
func initStorage(ctx context.Context, logger *logrus.Logger) (*storage.Storage, error) {
	// Get storage configuration
	storageType := viper.GetString("storage.type")
	if storageType == "" {
		storageType = "sqlite"
	}

	switch storageType {
	case "sqlite":
		dbPath := viper.GetString("storage.sqlite.path")
		if dbPath == "" {
			dbPath = "prompts.db"
		}
		return storage.NewSQLiteStorage(ctx, dbPath, logger)
	default:
		return nil, fmt.Errorf("unsupported storage type: %s", storageType)
	}
}

// registerProviders initializes all available providers
func registerProviders(registry *providers.Registry, logger *logrus.Logger) error {
	// Register OpenAI provider
	if apiKey := viper.GetString("providers.openai.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.openai.model"),
			BaseURL: viper.GetString("providers.openai.base_url"),
			Timeout: int(viper.GetDuration("providers.openai.timeout").Seconds()),
		}
		provider := providers.NewOpenAIProvider(config)
		registry.Register("openai", provider)
		logger.Info("Registered OpenAI provider")
	}

	// Register Anthropic provider
	if apiKey := viper.GetString("providers.anthropic.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.anthropic.model"),
			BaseURL: viper.GetString("providers.anthropic.base_url"),
			Timeout: int(viper.GetDuration("providers.anthropic.timeout").Seconds()),
		}
		provider := providers.NewAnthropicProvider(config)
		registry.Register("anthropic", provider)
		logger.Info("Registered Anthropic provider")
	}

	// Register Google provider
	if apiKey := viper.GetString("providers.google.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.google.model"),
			Timeout: int(viper.GetDuration("providers.google.timeout").Seconds()),
		}
		provider := providers.NewGoogleProvider(config)
		registry.Register("google", provider)
		logger.Info("Registered Google provider")
	}

	// Register OpenRouter provider
	if apiKey := viper.GetString("providers.openrouter.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.openrouter.model"),
			BaseURL: viper.GetString("providers.openrouter.base_url"),
			Timeout: int(viper.GetDuration("providers.openrouter.timeout").Seconds()),
		}
		provider := providers.NewOpenRouterProvider(config)
		registry.Register("openrouter", provider)
		logger.Info("Registered OpenRouter provider")
	}

	// Register Ollama provider
	if baseURL := viper.GetString("providers.ollama.base_url"); baseURL != "" {
		config := providers.Config{
			BaseURL: baseURL,
			Model:   viper.GetString("providers.ollama.model"),
			Timeout: int(viper.GetDuration("providers.ollama.timeout").Seconds()),
		}
		provider := providers.NewOllamaProvider(config)
		registry.Register("ollama", provider)
		logger.Info("Registered Ollama provider")
	}

	// Register Grok provider
	if apiKey := viper.GetString("providers.grok.api_key"); apiKey != "" {
		config := providers.Config{
			APIKey:  apiKey,
			Model:   viper.GetString("providers.grok.model"),
			BaseURL: viper.GetString("providers.grok.base_url"),
			Timeout: int(viper.GetDuration("providers.grok.timeout").Seconds()),
		}
		provider := providers.NewGrokProvider(config)
		registry.Register("grok", provider)
		logger.Info("Registered Grok provider")
	}

	// Check if at least one provider is registered
	if len(registry.ListProviders()) == 0 {
		logger.Warn("No providers registered - API will have limited functionality")
	}

	return nil
}
