package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// configCmd represents the config command
var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage Prompt Alchemy configuration",
	Long: `Manage Prompt Alchemy configuration settings including providers, phases,
and generation parameters.`,
	Run: func(cmd *cobra.Command, args []string) {
		logger := log.GetLogger()
		logger.Info("Displaying current Prompt Alchemy configuration")

		configFile := viper.ConfigFileUsed()
		if configFile == "" {
			logger.Warn("No configuration file found.")
			home, _ := os.UserHomeDir()
			logger.Infof("Create one at: %s/.prompt-alchemy/config.yaml", home)
			logger.Info("Use example-config.yaml as a template.")
			return
		}

		logger.Infof("Config file: %s", configFile)

		// Show data directory
		dataDir := viper.GetString("data_dir")
		if dataDir == "" {
			home, _ := os.UserHomeDir()
			dataDir = filepath.Join(home, ".prompt-alchemy")
		}
		logger.Infof("Data directory: %s", dataDir)

		// Show provider configurations
		providers := viper.GetStringMap("providers")
		if len(providers) > 0 {
			logger.Info("Configured Providers:")
			for name := range providers {
				model := viper.GetString(fmt.Sprintf("providers.%s.model", name))
				logger.Infof("  - %s: %s", name, model)
			}
		}

		// Show phase configurations
		phases := viper.GetStringMap("phases")
		if len(phases) > 0 {
			logger.Info("\nPhase Configurations:")
			for phase, provider := range phases {
				logger.Infof("  - %s: %s", phase, provider)
			}
		}

		// Show generation settings
		logger.Info("\nGeneration Settings:")
		logger.Infof("  - Temperature: %.1f", viper.GetFloat64("generation.default_temperature"))
		logger.Infof("  - Max Tokens: %d", viper.GetInt("generation.default_max_tokens"))
		logger.Infof("  - Default Count: %d", viper.GetInt("generation.default_count"))
		logger.Infof("  - Use Parallel: %t", viper.GetBool("generation.use_parallel"))
		logger.Infof("  - Default Target Model: %s", viper.GetString("generation.default_target_model"))
		logger.Infof("  - Default Embedding Model: %s", viper.GetString("generation.default_embedding_model"))
		logger.Infof("  - Default Embedding Dimensions: %d", viper.GetInt("generation.default_embedding_dimensions"))
	},
}

func init() {
	// Add subcommands
	configCmd.AddCommand(&cobra.Command{
		Use:   "show",
		Short: "Show current configuration",
		Run:   configCmd.Run,
	})

	configCmd.AddCommand(&cobra.Command{
		Use:   "init",
		Short: "Initialize configuration file",
		Run: func(cmd *cobra.Command, args []string) {
			logger := log.GetLogger()
			home, err := os.UserHomeDir()
			if err != nil {
				logger.Errorf("Error finding home directory: %v", err)
				return
			}

			configDir := filepath.Join(home, ".prompt-alchemy")
			configPath := filepath.Join(configDir, "config.yaml")

			// Create directory
			logger.Debugf("Creating config directory at: %s", configDir)
			if err := os.MkdirAll(configDir, 0755); err != nil {
				logger.Errorf("Error creating config directory: %v", err)
				return
			}

			// Check if config already exists
			if _, err := os.Stat(configPath); err == nil {
				logger.Warnf("Configuration file already exists: %s", configPath)
				return
			}

			// Copy example config
			examplePath := "example-config.yaml"
			logger.Debugf("Copying example config from: %s", examplePath)
			if _, err := os.Stat(examplePath); err != nil {
				logger.Errorf("Error: example-config.yaml not found")
				logger.Infof("Please create %s manually", configPath)
				return
			}

			// Read example and write to config
			content, err := os.ReadFile(examplePath)
			if err != nil {
				logger.Errorf("Error reading example config: %v", err)
				return
			}

			if err := os.WriteFile(configPath, content, 0644); err != nil {
				logger.Errorf("Error writing config file: %v", err)
				return
			}

			logger.Infof("Configuration initialized: %s", configPath)
			logger.Info("Please edit the file and add your API keys")
		},
	})
}
