package cmd

import (
	"context"
	"fmt"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/http"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serveAPICmd = &cobra.Command{
	Use:   "api",
	Short: "Start HTTP API server",
	Long:  `Start the Prompt Alchemy HTTP API server for REST API access.`,
	RunE:  runServeAPI,
}

func init() {
	serveCmd.AddCommand(serveAPICmd)

	serveAPICmd.Flags().Int("port", 8080, "Port to listen on")
	serveAPICmd.Flags().String("host", "localhost", "Host to bind to")
}

func runServeAPI(cmd *cobra.Command, args []string) error {
	ctx := context.Background()

	// Initialize logger
	logger := setupLogger()

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer store.Close()

	// Initialize provider registry
	registry := providers.NewRegistry()
	if err := registerProviders(registry, logger); err != nil {
		return fmt.Errorf("failed to register providers: %w", err)
	}

	// Initialize engine
	engine := engine.NewEngine(registry, logger)

	// Initialize ranker
	ranker := ranking.NewRanker(store, registry, logger)

	// Initialize learner (optional)
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

	// Create and start HTTP server
	server := http.NewSimpleServer(store, registry, engine, ranker, learner, logger)

	logger.WithField("port", viper.GetInt("http.port")).Info("Starting HTTP API server")

	return server.Start(ctx)
}
