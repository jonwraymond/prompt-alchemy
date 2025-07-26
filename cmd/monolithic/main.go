package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/api"
	"github.com/jonwraymond/prompt-alchemy/internal/config"
	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/mcp"
	"github.com/jonwraymond/prompt-alchemy/internal/monitoring"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile    string
	dataDir    string
	logLevel   string
	httpPort   int
	mcpPort    int
	enableAPI  bool
	enableMCP  bool
	enableUI   bool
	logger     *logrus.Logger
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

	// Initialize configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	// Initialize storage (shared across all services)
	store, err := storage.NewSQLiteStorage(cfg.Database.Path)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer store.Close()

	// Initialize providers registry (shared across all services)
	providerRegistry := providers.NewRegistry()
	if err := providerRegistry.LoadFromConfig(cfg); err != nil {
		logger.WithError(err).Warn("Failed to load some providers from config")
	}

	// Initialize the generation engine (shared across all services)
	generationEngine, err := engine.NewEngine(cfg, store, providerRegistry)
	if err != nil {
		return fmt.Errorf("failed to initialize generation engine: %w", err)
	}

	// Create a context that can be cancelled
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// WaitGroup to track all running services
	var wg sync.WaitGroup
	var servers []*http.Server

	// Start HTTP API server
	if enableAPI {
		wg.Add(1)
		go func() {
			defer wg.Done()
			
			apiServer, err := api.NewServer(cfg, store, generationEngine, providerRegistry)
			if err != nil {
				logger.WithError(err).Error("Failed to create API server")
				return
			}

			// Configure HTTP server
			httpServer := &http.Server{
				Addr:         fmt.Sprintf(":%d", httpPort),
				Handler:      apiServer.Handler(),
				ReadTimeout:  30 * time.Second,
				WriteTimeout: 30 * time.Second,
				IdleTimeout:  60 * time.Second,
			}
			servers = append(servers, httpServer)

			logger.WithField("port", httpPort).Info("Starting HTTP API server")
			
			if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				logger.WithError(err).Error("HTTP API server failed")
			}
		}()
	}

	// Start MCP server  
	if enableMCP {
		wg.Add(1)
		go func() {
			defer wg.Done()
			
			mcpServer, err := mcp.NewServer(cfg, store, generationEngine, providerRegistry)
			if err != nil {
				logger.WithError(err).Error("Failed to create MCP server")
				return
			}

			logger.WithField("port", mcpPort).Info("Starting MCP server")
			
			if err := mcpServer.Start(ctx, fmt.Sprintf(":%d", mcpPort)); err != nil {
				logger.WithError(err).Error("MCP server failed")
			}
		}()
	}

	// Start monitoring service
	wg.Add(1)
	go func() {
		defer wg.Done()
		
		monitor := monitoring.NewMonitor(cfg, store, providerRegistry)
		logger.Info("Starting monitoring service")
		
		if err := monitor.Start(ctx); err != nil {
			logger.WithError(err).Error("Monitoring service failed")
		}
	}()

	// Log startup completion
	logger.WithFields(logrus.Fields{
		"http_port":   httpPort,
		"mcp_port":    mcpPort,
		"enable_api":  enableAPI,
		"enable_mcp":  enableMCP,
		"enable_ui":   enableUI,
		"data_dir":    cfg.Database.Path,
	}).Info("All services started successfully")

	// Wait for interrupt signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive a signal
	sig := <-sigCh
	logger.WithField("signal", sig).Info("Received shutdown signal")

	// Cancel context to stop all services
	cancel()

	// Gracefully shutdown HTTP servers with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	for _, server := range servers {
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.WithError(err).Error("Failed to gracefully shutdown HTTP server")
		}
	}

	// Wait for all goroutines to finish
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Info("All services shutdown successfully")
	case <-time.After(15 * time.Second):
		logger.Warn("Timeout waiting for services to shutdown")
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