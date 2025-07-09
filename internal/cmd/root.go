package cmd

import (
	"fmt"
	"os"
	"path/filepath"

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

// rootCmd represents the base command
var rootCmd = &cobra.Command{
	Use:   "prompt-alchemy",
	Short: "Professional AI prompt generation tool",
	Long: `Prompt Alchemy is a sophisticated prompt generation system that uses a phased approach
to create, refine, and optimize AI prompts. It supports multiple LLM providers and includes
advanced features like embeddings, context building, and performance tracking.`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// Initialize logger
		logger = logrus.New()
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

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.prompt-alchemy/config.yaml)")
	rootCmd.PersistentFlags().StringVar(&dataDir, "data-dir", "", "data directory (default is $HOME/.prompt-alchemy)")
	rootCmd.PersistentFlags().StringVar(&logLevel, "log-level", "info", "log level (debug, info, warn, error)")

	// Bind flags to viper
	viper.BindPFlag("data_dir", rootCmd.PersistentFlags().Lookup("data-dir"))
	viper.BindPFlag("log_level", rootCmd.PersistentFlags().Lookup("log-level"))

	// Add commands
	rootCmd.AddCommand(generateCmd)
	rootCmd.AddCommand(searchCmd)
	rootCmd.AddCommand(testCmd)
	rootCmd.AddCommand(metricsCmd)
	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(configCmd)
}

// initConfig reads in config file and ENV variables
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}

		// Search config in home directory
		configDir := filepath.Join(home, ".prompt-alchemy")
		viper.AddConfigPath(configDir)
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")

		// Set default data directory
		if dataDir == "" {
			dataDir = configDir
			viper.SetDefault("data_dir", dataDir)
		}

		// Create config directory if it doesn't exist
		if err := os.MkdirAll(configDir, 0755); err != nil {
			fmt.Fprintf(os.Stderr, "Failed to create config directory: %v\n", err)
		}
	}

	// Environment variables
	viper.SetEnvPrefix("PROMPT_ALCHEMY")
	viper.AutomaticEnv()

	// Read config file
	if err := viper.ReadInConfig(); err == nil {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}

	// Set defaults
	viper.SetDefault("providers.openai.model", "gpt-4-turbo-preview")
	viper.SetDefault("providers.openrouter.model", "openai/gpt-4-turbo-preview")
	viper.SetDefault("providers.claude.model", "claude-3-opus-20240229")
	viper.SetDefault("providers.gemini.model", "gemini-pro")

	viper.SetDefault("generation.default_temperature", 0.7)
	viper.SetDefault("generation.default_max_tokens", 2000)
	viper.SetDefault("generation.default_count", 3)
	viper.SetDefault("generation.use_parallel", true)

	viper.SetDefault("phases.idea.provider", "openai")
	viper.SetDefault("phases.human.provider", "claude")
	viper.SetDefault("phases.precision.provider", "gemini")
}
