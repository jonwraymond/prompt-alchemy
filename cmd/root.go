package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile  string
	dataDir  string
	logLevel string
	logger   *logrus.Logger
)

// Common constants used across commands
const (
	DateFormatISO = "2006-01-02"
	TimeFormat    = "2006-01-02 15:04:05"
)

// rootCmd represents the base command
var rootCmd = &cobra.Command{
	Use:   "prompt-alchemy",
	Short: "Professional AI prompt generation tool",
	Long: `Prompt Alchemy is a sophisticated prompt generation system that uses a phased approach
to create, refine, and optimize AI prompts. It supports multiple LLM providers and includes
advanced features like embeddings, context building, and performance tracking.

EXECUTION MODES:
  Local Mode (default): Runs all operations locally using your configured providers
  Client Mode: Connects to a running prompt-alchemy server via HTTP API
  
CONFIGURATION:
  Use --mode local|client or set client.mode in config file
  Use --server URL to override configured server or enable client mode for one command
  
EXAMPLES:
  # Local mode (default)
  prompt-alchemy generate "create API docs"
  
  # Client mode via config
  prompt-alchemy --mode client generate "create API docs"
  
  # Client mode with specific server
  prompt-alchemy --server http://localhost:8080 generate "create API docs"
  
  # Check server health
  prompt-alchemy health --server http://localhost:8080`,
	// TODO: Server Mode Implementation
	// Add 'serve' subcommand to enable HTTP/gRPC server functionality:
	// - prompt-alchemy serve --port 8080 --mode http
	// - Enables on-demand relationship discovery via API
	// - RESTful endpoints for prompt generation and search
	// - Semantic similarity search without background processing
	// - Keeps infrastructure lightweight while providing API access
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// Initialize logger
		logger = log.GetLogger()
		level, err := logrus.ParseLevel(logLevel)
		if err != nil {
			logger.Warn("Invalid log level, defaulting to info")
			level = logrus.InfoLevel
		}
		logger.SetLevel(level)

		// Set formatter
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	},
}

// Execute adds all child commands and sets flags
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Set defaults before config is loaded (but not for provider models which are in config)
	viper.SetDefault("providers.ollama.model", "gemma3:4b")
	viper.SetDefault("providers.ollama.base_url", "http://localhost:11434")
	viper.SetDefault("providers.ollama.timeout", 120)

	viper.SetDefault("generation.default_temperature", 0.7)
	viper.SetDefault("generation.default_max_tokens", 2000)
	viper.SetDefault("generation.default_count", 3)
	viper.SetDefault("generation.use_parallel", true)
	viper.SetDefault("generation.default_target_model", "claude-4-sonnet-20250522")
	viper.SetDefault("generation.default_embedding_model", "text-embedding-3-small")
	viper.SetDefault("generation.default_embedding_dimensions", 1536)

	viper.SetDefault("phases.idea.provider", "openai")
	viper.SetDefault("phases.human.provider", "anthropic")
	viper.SetDefault("phases.precision.provider", "google")

	// Client mode configuration
	viper.SetDefault("client.mode", "local")                       // "local" or "client"
	viper.SetDefault("client.server_url", "http://localhost:8080") // Server URL for client mode
	viper.SetDefault("client.timeout", 30)                         // Client timeout in seconds
	viper.SetDefault("client.retry_attempts", 3)                   // Number of retry attempts
	viper.SetDefault("client.health_check_interval", 60)           // Health check interval in seconds

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.github.com/jonwraymond/prompt-alchemy/config.yaml)")
	rootCmd.PersistentFlags().StringVar(&dataDir, "data-dir", "", "data directory (default is $HOME/.prompt-alchemy)")
	rootCmd.PersistentFlags().StringVar(&logLevel, "log-level", "info", "log level (debug, info, warn, error)")

	// Client mode flags
	rootCmd.PersistentFlags().String("mode", "", "execution mode: 'local' or 'client' (default from config)")
	rootCmd.PersistentFlags().String("server", "", "server URL for client mode (default from config)")
	rootCmd.PersistentFlags().Int("timeout", 0, "client timeout in seconds (default from config)")

	// Bind flags to viper
	if err := viper.BindPFlag("data_dir", rootCmd.PersistentFlags().Lookup("data-dir")); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to bind data-dir flag: %v\n", err)
	}
	if err := viper.BindPFlag("log_level", rootCmd.PersistentFlags().Lookup("log-level")); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to bind log-level flag: %v\n", err)
	}

	// Bind client mode flags
	if err := viper.BindPFlag("client.mode", rootCmd.PersistentFlags().Lookup("mode")); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to bind mode flag: %v\n", err)
	}
	if err := viper.BindPFlag("client.server_url", rootCmd.PersistentFlags().Lookup("server")); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to bind server flag: %v\n", err)
	}
	if err := viper.BindPFlag("client.timeout", rootCmd.PersistentFlags().Lookup("timeout")); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to bind timeout flag: %v\n", err)
	}

	// Add commands
	rootCmd.AddCommand(generateCmd)
	rootCmd.AddCommand(batchCmd)
	rootCmd.AddCommand(searchCmd)
	var testCmd = &cobra.Command{
		Use:   "test",
		Short: "Test prompt variants",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Testing prompt variants... (implementation pending)")
		},
	}
	rootCmd.AddCommand(testCmd) // TODO: Implement test command
	rootCmd.AddCommand(metricsCmd)
	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(validateCmd)
	rootCmd.AddCommand(providersCmd)
	rootCmd.AddCommand(optimizeCmd)
	rootCmd.AddCommand(updateCmd)
	rootCmd.AddCommand(deleteCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(httpCmd)
	// nightlyCmd and scheduleCmd are registered in their own init() functions
	// Add new document command
	rootCmd.AddCommand(documentCmd)
	rootCmd.AddCommand(healthCmd)
}

// initConfig reads in config file and ENV variables
func initConfig() {
	// Initialize logger if not already initialized
	if logger == nil {
		logger = log.GetLogger()
		logger.SetLevel(logrus.InfoLevel)
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}
	logger.Debug("Initializing configuration")
	if cfgFile != "" {
		// Use config file from the flag
		viper.SetConfigFile(cfgFile)
		logger.Debugf("Using config file from flag: %s", cfgFile)
	} else {
		// Check for local .prompt-alchemy directory first
		localConfigDir := ".prompt-alchemy"
		localConfigPath := filepath.Join(localConfigDir, "config.yaml")

		if _, err := os.Stat(localConfigPath); err == nil {
			// Local config exists, use it
			viper.SetConfigFile(localConfigPath)
			logger.Debugf("Found local config file: %s", localConfigPath)
			if dataDir == "" {
				dataDir = localConfigDir
				viper.SetDefault("data_dir", dataDir)
				logger.Debugf("Setting data directory to local path: %s", dataDir)
			}
		} else {
			// Fall back to global config
			home, err := os.UserHomeDir()
			if err != nil {
				logger.Fatalf("Failed to get user home directory: %v", err)
			}

			// Search config in home directory
			configDir := filepath.Join(home, ".prompt-alchemy")
			viper.AddConfigPath(configDir)
			viper.SetConfigType("yaml")
			viper.SetConfigName("config")
			logger.Debugf("Searching for config in: %s", configDir)

			// Set default data directory
			if dataDir == "" {
				dataDir = configDir
				viper.SetDefault("data_dir", dataDir)
				logger.Debugf("Setting data directory to default: %s", dataDir)
			}

			// Create config directory if it doesn't exist
			if err := os.MkdirAll(configDir, 0755); err != nil {
				logger.Errorf("Failed to create config directory: %v", err)
			}
		}
	}

	// Environment variables
	viper.SetEnvPrefix("PROMPT_ALCHEMY")
	viper.AutomaticEnv()
	logger.Debug("Checking for environment variables with prefix PROMPT_ALCHEMY")
	
	// Explicitly bind provider API key environment variables
	viper.BindEnv("providers.openai.api_key", "PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY")
	viper.BindEnv("providers.anthropic.api_key", "PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY")
	viper.BindEnv("providers.google.api_key", "PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY")
	viper.BindEnv("providers.openrouter.api_key", "PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY")

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		logger.Warnf("Failed to read config file: %s", err)
	} else {
		logger.Infof("Using config file: %s", viper.ConfigFileUsed())
	}
}
