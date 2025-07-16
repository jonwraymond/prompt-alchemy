package cmd

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	httpserver "github.com/jonwraymond/prompt-alchemy/internal/http"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	httpHost string
	httpPort int
)

// httpCmd represents the http-server command
var httpCmd = &cobra.Command{
	Use:   "http-server",
	Short: "Start HTTP API server",
	Long: `Start the HTTP API server that provides RESTful endpoints for prompt generation,
search, optimization, and other operations.

The server provides the following endpoints:
- /health - Health check
- /api/v1/prompts/generate - Generate prompts
- /api/v1/prompts/search - Search prompts
- /api/v1/prompts/select - AI-powered prompt selection
- /api/v1/providers - List providers

Example:
  prompt-alchemy http-server --host localhost --port 8080`,
	RunE: runHTTPServer,
}

func init() {
	httpCmd.Flags().StringVar(&httpHost, "host", "localhost", "HTTP server host")
	httpCmd.Flags().IntVar(&httpPort, "port", 3456, "HTTP server port")

	_ = viper.BindPFlag("http.host", httpCmd.Flags().Lookup("host"))
	_ = viper.BindPFlag("http.port", httpCmd.Flags().Lookup("port"))
}

func runHTTPServer(cmd *cobra.Command, args []string) error {
	// Initialize logger
	logger := log.GetLogger()

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() { _ = store.Close() }()

	// Initialize providers
	registry := providers.NewRegistry()
	if err := initializeProviders(registry); err != nil {
		return fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Initialize engine
	eng := engine.NewEngine(registry, logger)

	// Initialize ranking
	ranker := ranking.NewRanker(store, registry, logger)
	defer func() {
		if err := ranker.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close ranker")
		}
	}()

	// Initialize learning engine if enabled
	var learner *learning.LearningEngine
	if viper.GetBool("learning.enabled") {
		learner = learning.NewLearningEngine(store, logger)
		ctx := context.Background()
		learner.StartBackgroundLearning(ctx)
		logger.Info("Learning engine initialized")
	}

	// Create HTTP server
	server := httpserver.NewSimpleServer(store, registry, eng, ranker, learner, logger)

	// Handle shutdown gracefully
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		logger.Info("Shutting down HTTP server...")
		cancel()
	}()

	// Start server
	logger.Infof("Starting HTTP server on %s:%d", viper.GetString("http.host"), viper.GetInt("http.port"))
	if err := server.Start(ctx); err != nil {
		return fmt.Errorf("server error: %w", err)
	}

	return nil
}
