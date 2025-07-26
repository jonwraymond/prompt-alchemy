package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/features"
	"github.com/jonwraymond/prompt-alchemy/internal/http"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/registry"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/interfaces"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/subosito/gotenv"
)

var (
	cfgFile   string
	dataDir   string
	logLevel  string
	httpPort  int
	mcpPort   int
	enableAPI bool
	enableMCP bool
	enableUI  bool
	logger    *logrus.Logger
)

// monolithicCmd represents the monolithic command that runs all services
var monolithicCmd = &cobra.Command{
	Use:   "monolithic",
	Short: "Run all services in a single monolithic process",
	Long: `Runs all Prompt Alchemy services in a unified monolithic application.
This includes the HTTP API server, MCP server, and static file serving for the UI.

Services included:
- HTTP API server (default port 8080)
- MCP server (default port 8081) 
- Static file server for React UI
- Background monitoring and health checks
- Provider management and engine services

All services share the same database connection and configuration.`,
	RunE: runMonolithic,
}

func main() {
	// Initialize root command with global flags
	var rootCmd = &cobra.Command{
		Use:   "prompt-alchemy",
		Short: "Unified Prompt Alchemy application",
		Long: `Prompt Alchemy unified application that can run as a monolithic service
or as individual microservices via subcommands.`,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			// Initialize logger
			logger = log.GetLogger()
			level, err := logrus.ParseLevel(logLevel)
			if err != nil {
				logger.Warn("Invalid log level, defaulting to info")
				level = logrus.InfoLevel
			}
			logger.SetLevel(level)
			logger.SetFormatter(&logrus.TextFormatter{
				FullTimestamp: true,
			})
		},
	}

	// Add global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.prompt-alchemy/config.yaml)")
	rootCmd.PersistentFlags().StringVar(&dataDir, "data-dir", "", "data directory (default is $HOME/.prompt-alchemy)")
	rootCmd.PersistentFlags().StringVar(&logLevel, "log-level", "info", "log level (debug, info, warn, error)")

	// Add monolithic-specific flags
	monolithicCmd.Flags().IntVar(&httpPort, "http-port", 8080, "HTTP API server port")
	monolithicCmd.Flags().IntVar(&mcpPort, "mcp-port", 8081, "MCP server port")
	monolithicCmd.Flags().BoolVar(&enableAPI, "enable-api", true, "Enable HTTP API server")
	monolithicCmd.Flags().BoolVar(&enableMCP, "enable-mcp", true, "Enable MCP server")
	monolithicCmd.Flags().BoolVar(&enableUI, "enable-ui", true, "Enable static UI file serving")

	// Add the monolithic command as default
	rootCmd.AddCommand(monolithicCmd)

	// Set monolithic as the default command if no subcommand is provided
	rootCmd.RunE = monolithicCmd.RunE

	// Initialize configuration
	cobra.OnInitialize(initConfig)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runMonolithic(cmd *cobra.Command, args []string) error {
	logger.Info("Starting Prompt Alchemy Monolithic Application")

	// Load feature flags from environment
	flags := features.LoadFeatureFlags()

	// Override with command line flags
	if cmd.Flags().Changed("enable-api") {
		flags.SetFeature("api", enableAPI)
	}
	if cmd.Flags().Changed("enable-mcp") {
		flags.SetFeature("mcp", enableMCP)
	}

	// Set deployment mode
	flags.DeploymentMode = "monolithic"

	logger.WithFields(logrus.Fields{
		"deployment_mode":   flags.DeploymentMode,
		"debug_mode":        flags.DebugMode,
		"enabled_providers": flags.GetEnabledProviders(),
		"api_enabled":       flags.IsEnabled("api"),
		"mcp_enabled":       flags.IsEnabled("mcp"),
		"learning_enabled":  flags.IsEnabled("learning"),
	}).Info("Feature flags loaded")

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create service registry with local discovery
	serviceRegistry := registry.NewServiceRegistry()
	localDiscovery := registry.NewLocalDiscovery()
	serviceRegistry.SetDiscovery(localDiscovery)

	// Initialize all services
	if err := initializeServices(serviceRegistry, flags); err != nil {
		return fmt.Errorf("failed to initialize services: %w", err)
	}

	// Start all enabled services
	if err := startServices(ctx, serviceRegistry, flags); err != nil {
		return fmt.Errorf("failed to start services: %w", err)
	}

	// Log startup completion
	health := serviceRegistry.Health()
	for name, status := range health {
		logger.WithFields(logrus.Fields{
			"service":       name,
			"status":        status.Status,
			"response_time": status.ResponseTime,
		}).Info("Service health check")
	}

	logger.WithFields(logrus.Fields{
		"http_port":  httpPort,
		"enable_api": flags.IsEnabled("api"),
		"enable_mcp": flags.IsEnabled("mcp"),
		"enable_ui":  enableUI,
		"data_dir":   viper.GetString("data_dir"),
		"services":   len(health),
	}).Info("All services started successfully")

	// Wait for interrupt signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive a signal
	sig := <-sigCh
	logger.WithField("signal", sig).Info("Received shutdown signal")

	// Cancel context to stop all services
	cancel()

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	return shutdownServices(shutdownCtx, serviceRegistry)
}

func initializeServices(serviceRegistry interfaces.ServiceRegistry, flags *features.FeatureFlags) error {
	logger.Info("Initializing services...")

	// Initialize storage layer first (required by other services)
	if flags.ShouldStartService("storage") {
		logger.Info("Initializing storage service...")
		store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
		if err != nil {
			return fmt.Errorf("failed to initialize storage: %w", err)
		}
		serviceRegistry.RegisterService("storage", store)
	}

	// Initialize providers registry
	if flags.ShouldStartService("providers") {
		logger.Info("Initializing provider registry...")
		providerRegistry := providers.NewRegistry()
		if err := registerProviders(providerRegistry, logger); err != nil {
			return fmt.Errorf("failed to register providers: %w", err)
		}
		serviceRegistry.RegisterService("providers", providerRegistry)
	}

	// Initialize generation engine
	if flags.ShouldStartService("engine") {
		logger.Info("Initializing generation engine...")

		// Get dependencies
		providerRegistry, err := serviceRegistry.GetService("providers")
		if err != nil {
			return fmt.Errorf("engine requires provider registry: %w", err)
		}

		eng := engine.NewEngine(providerRegistry.(*providers.Registry), logger)
		serviceRegistry.RegisterService("engine", eng)
	}

	// Initialize ranking service
	if flags.ShouldStartService("ranking") {
		logger.Info("Initializing ranking service...")

		// Get dependencies
		store, err := serviceRegistry.GetService("storage")
		if err != nil {
			return fmt.Errorf("ranking requires storage: %w", err)
		}
		providerRegistry, err := serviceRegistry.GetService("providers")
		if err != nil {
			return fmt.Errorf("ranking requires providers: %w", err)
		}

		ranker := ranking.NewRanker(store.(*storage.Storage), providerRegistry.(*providers.Registry), logger)
		serviceRegistry.RegisterService("ranking", ranker)
	}

	// Initialize learning engine if enabled
	if flags.ShouldStartService("learning") {
		logger.Info("Initializing learning engine...")

		// Get dependencies
		store, err := serviceRegistry.GetService("storage")
		if err != nil {
			return fmt.Errorf("learning requires storage: %w", err)
		}
		providerRegistry, err := serviceRegistry.GetService("providers")
		if err != nil {
			return fmt.Errorf("learning requires providers: %w", err)
		}

		learner := learning.NewLearningEngine(store.(*storage.Storage), providerRegistry.(*providers.Registry), logger)
		serviceRegistry.RegisterService("learning", learner)
	}

	logger.Info("All services initialized successfully")
	return nil
}

func startServices(ctx context.Context, serviceRegistry interfaces.ServiceRegistry, flags *features.FeatureFlags) error {
	logger.Info("Starting services...")

	var wg sync.WaitGroup
	errChan := make(chan error, 10)

	// Start HTTP API server if enabled
	if flags.ShouldStartService("api") {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// Get dependencies
			store, _ := serviceRegistry.GetService("storage")
			providerRegistry, _ := serviceRegistry.GetService("providers")
			eng, _ := serviceRegistry.GetService("engine")
			ranker, _ := serviceRegistry.GetService("ranking")
			learner, _ := serviceRegistry.GetService("learning")

			// Set HTTP configuration
			viper.Set("http.port", httpPort)
			viper.Set("http.host", "0.0.0.0")

			httpServer := http.NewSimpleServer(
				store.(*storage.Storage),
				providerRegistry.(*providers.Registry),
				eng.(*engine.Engine),
				ranker.(*ranking.Ranker),
				learner.(*learning.LearningEngine),
				logger,
			)

			logger.WithField("port", httpPort).Info("Starting HTTP API server")

			if err := httpServer.Start(ctx); err != nil {
				errChan <- fmt.Errorf("HTTP API server failed: %w", err)
			}
		}()
	}

	// Start learning background processes if enabled
	if flags.ShouldStartService("learning") {
		wg.Add(1)
		go func() {
			defer wg.Done()

			learner, err := serviceRegistry.GetService("learning")
			if err != nil {
				errChan <- fmt.Errorf("failed to get learning service: %w", err)
				return
			}

			logger.Info("Starting learning background processes")
			learner.(*learning.LearningEngine).StartBackgroundLearning(ctx)
		}()
	}

	// Start MCP server if enabled (commented out for now as it needs adaptation)
	// if flags.ShouldStartService("mcp") {
	// 	wg.Add(1)
	// 	go func() {
	// 		defer wg.Done()
	//
	// 		logger.Info("Starting MCP server on stdin/stdout")
	// 		// TODO: Adapt MCP server to use service registry
	// 	}()
	// }

	// Wait a moment for services to start
	time.Sleep(1 * time.Second)

	// Check for startup errors
	select {
	case err := <-errChan:
		return err
	default:
		// No errors, continue
	}

	logger.Info("All services started successfully")
	return nil
}

func shutdownServices(ctx context.Context, serviceRegistry interfaces.ServiceRegistry) error {
	logger.Info("Shutting down services...")

	services := serviceRegistry.ListServices()
	var wg sync.WaitGroup
	errChan := make(chan error, len(services))

	// Shutdown services
	for name, service := range services {
		wg.Add(1)
		go func(serviceName string, svc interface{}) {
			defer wg.Done()

			logger.WithField("service", serviceName).Info("Shutting down service")

			// Stop service if it supports stopping
			if stopper, ok := svc.(interface{ Close() error }); ok {
				if err := stopper.Close(); err != nil {
					errChan <- fmt.Errorf("failed to close %s: %w", serviceName, err)
					return
				}
			}

			logger.WithField("service", serviceName).Info("Service stopped successfully")
		}(name, service)
	}

	// Wait for all services to stop or timeout
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Info("All services shut down successfully")
	case <-ctx.Done():
		logger.Warn("Timeout waiting for services to shutdown")
	}

	// Check for shutdown errors
	close(errChan)
	var errors []error
	for err := range errChan {
		errors = append(errors, err)
	}

	if len(errors) > 0 {
		return fmt.Errorf("shutdown errors: %v", errors)
	}

	return nil
}

func initConfig() {
	// Initialize logger if not already initialized
	if logger == nil {
		logger = log.GetLogger()
		logger.SetLevel(logrus.InfoLevel)
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}

	// Use config file from flag if provided
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		// Check for local config first
		if _, err := os.Stat(".prompt-alchemy/config.yaml"); err == nil {
			viper.SetConfigFile(".prompt-alchemy/config.yaml")
			if dataDir == "" {
				dataDir = ".prompt-alchemy"
				viper.SetDefault("data_dir", dataDir)
			}
		} else {
			// Fall back to global config
			home, err := os.UserHomeDir()
			if err != nil {
				logger.Fatalf("Failed to get user home directory: %v", err)
			}

			configDir := fmt.Sprintf("%s/.prompt-alchemy", home)
			viper.AddConfigPath(configDir)
			viper.SetConfigType("yaml")
			viper.SetConfigName("config")

			if dataDir == "" {
				dataDir = configDir
				viper.SetDefault("data_dir", dataDir)
			}

			// Create config directory if it doesn't exist
			if err := os.MkdirAll(configDir, 0755); err != nil {
				logger.WithError(err).Error("Failed to create config directory")
			}
		}
	}

	// Set environment variable prefix
	viper.SetEnvPrefix("PROMPT_ALCHEMY")
	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("server.http_port", 8080)
	viper.SetDefault("server.mcp_port", 8081)
	viper.SetDefault("generation.default_temperature", 0.7)
	viper.SetDefault("generation.default_max_tokens", 2000)
	viper.SetDefault("generation.default_count", 3)

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		logger.WithError(err).Warn("Failed to read config file")
	} else {
		logger.WithField("file", viper.ConfigFileUsed()).Info("Using config file")
	}
}
