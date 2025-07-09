package cmd

import (
	"fmt"
	"os"
	"path/filepath"

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
		// Show current configuration
		fmt.Println("Current Prompt Alchemy Configuration:")
		fmt.Println("====================================")

		configFile := viper.ConfigFileUsed()
		if configFile == "" {
			fmt.Println("No configuration file found.")
			fmt.Printf("Create one at: %s/.prompt-alchemy/config.yaml\n", os.Getenv("HOME"))
			fmt.Println("Use example-config.yaml as a template.")
			return
		}

		fmt.Printf("Config file: %s\n", configFile)

		// Show data directory
		dataDir := viper.GetString("data_dir")
		if dataDir == "" {
			home, _ := os.UserHomeDir()
			dataDir = filepath.Join(home, ".prompt-alchemy")
		}
		fmt.Printf("Data directory: %s\n", dataDir)

		// Show provider configurations
		providers := viper.GetStringMap("providers")
		if len(providers) > 0 {
			fmt.Println("\nConfigured Providers:")
			for name := range providers {
				model := viper.GetString(fmt.Sprintf("providers.%s.model", name))
				fmt.Printf("  - %s: %s\n", name, model)
			}
		}

		// Show phase configurations
		phases := viper.GetStringMap("phases")
		if len(phases) > 0 {
			fmt.Println("\nPhase Configurations:")
			for phase, provider := range phases {
				fmt.Printf("  - %s: %s\n", phase, provider)
			}
		}

		// Show generation settings
		fmt.Println("\nGeneration Settings:")
		fmt.Printf("  - Temperature: %.1f\n", viper.GetFloat64("generation.default_temperature"))
		fmt.Printf("  - Max Tokens: %d\n", viper.GetInt("generation.default_max_tokens"))
		fmt.Printf("  - Default Count: %d\n", viper.GetInt("generation.default_count"))
		fmt.Printf("  - Use Parallel: %t\n", viper.GetBool("generation.use_parallel"))
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
			home, err := os.UserHomeDir()
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error finding home directory: %v\n", err)
				return
			}

			configDir := filepath.Join(home, ".prompt-alchemy")
			configPath := filepath.Join(configDir, "config.yaml")

			// Create directory
			if err := os.MkdirAll(configDir, 0755); err != nil {
				fmt.Fprintf(os.Stderr, "Error creating config directory: %v\n", err)
				return
			}

			// Check if config already exists
			if _, err := os.Stat(configPath); err == nil {
				fmt.Printf("Configuration file already exists: %s\n", configPath)
				return
			}

			// Copy example config
			examplePath := "example-config.yaml"
			if _, err := os.Stat(examplePath); err != nil {
				fmt.Printf("Error: example-config.yaml not found\n")
				fmt.Printf("Please create %s manually\n", configPath)
				return
			}

			// Read example and write to config
			content, err := os.ReadFile(examplePath)
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error reading example config: %v\n", err)
				return
			}

			if err := os.WriteFile(configPath, content, 0644); err != nil {
				fmt.Fprintf(os.Stderr, "Error writing config file: %v\n", err)
				return
			}

			fmt.Printf("Configuration initialized: %s\n", configPath)
			fmt.Println("Please edit the file and add your API keys")
		},
	})
}
