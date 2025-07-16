package cmd

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/http"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serveHybridCmd = &cobra.Command{
	Use:   "hybrid",
	Short: "Start both HTTP API and MCP servers",
	Long: `Start both the HTTP API server and MCP server simultaneously.

This allows access via both REST API and MCP protocol at the same time.
The HTTP server will run on the configured port, while MCP runs on stdin/stdout.

Note: When running hybrid mode, MCP output will be mixed with HTTP server logs.
Consider using separate processes for production use.`,
	RunE: runServeHybrid,
}

func init() {
	serveCmd.AddCommand(serveHybridCmd)

	serveHybridCmd.Flags().Int("port", 8080, "Port for HTTP API server")
	serveHybridCmd.Flags().String("host", "localhost", "Host for HTTP API server")
}

func runServeHybrid(cmd *cobra.Command, args []string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize shared resources
	logger := setupLogger()

	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer store.Close()

	registry := providers.NewRegistry()
	if err := registerProviders(registry, logger); err != nil {
		return fmt.Errorf("failed to register providers: %w", err)
	}

	engine := engine.NewEngine(registry, logger)
	ranker := ranking.NewRanker(store, registry, logger)

	var learner *learning.LearningEngine
	if viper.GetBool("learning_mode") {
		learner = learning.NewLearningEngine(store, logger)
	}

	// Override port from flag if provided
	port, _ := cmd.Flags().GetInt("port")
	if port > 0 {
		viper.Set("http.port", port)
	}

	host, _ := cmd.Flags().GetString("host")
	if host != "" {
		viper.Set("http.host", host)
	}

	// Create servers
	httpServer := http.NewSimpleServer(store, registry, engine, ranker, learner, logger)
	mcpServer := &MCPServer{
		storage:  store,
		registry: registry,
		engine:   engine,
		ranker:   ranker,
		learner:  learner,
		logger:   logger,
		reader:   bufio.NewReader(os.Stdin),
		writer:   bufio.NewWriter(os.Stdout),
	}

	// Start servers in goroutines
	var wg sync.WaitGroup
	wg.Add(2)

	// Start HTTP server
	go func() {
		defer wg.Done()
		logger.WithField("port", viper.GetInt("http.port")).Info("Starting HTTP API server")
		if err := httpServer.Start(ctx); err != nil {
			logger.WithError(err).Error("HTTP server error")
			cancel()
		}
	}()

	// Start MCP server
	go func() {
		defer wg.Done()
		logger.Info("Starting MCP server")
		if err := mcpServer.serve(ctx); err != nil {
			logger.WithError(err).Error("MCP server error")
			cancel()
		}
	}()

	// Wait for both servers to complete
	wg.Wait()

	return nil
}
