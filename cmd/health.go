package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/pkg/client"
)

// healthCmd represents the health command
var healthCmd = &cobra.Command{
	Use:   "health",
	Short: "Check server health status",
	Long: `Check the health and status of a running prompt-alchemy server.
	
This command connects to the configured server (or a specified server URL) 
and reports its health status, version, and uptime information.`,
	RunE: runHealth,
}

func init() {
	// Server flag for one-time server usage
	healthCmd.Flags().String("server", "", "Server URL to check (overrides config)")
}

func runHealth(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()

	// Check if we're in local mode
	mode := viper.GetString("mode")
	if mode == "" {
		mode = "local" // Default to local mode
	}

	if mode == "local" {
		// In local mode, there's no server to check
		logger.Info("Running in local mode - no server health check available")
		fmt.Println("Health check is only available in client/server mode.")
		fmt.Println("To run in server mode:")
		fmt.Println("  1. Start server: prompt-alchemy server")
		fmt.Println("  2. In another terminal: prompt-alchemy --mode client health")
		return nil
	}

	// Create client (check for --server flag override)
	var c *client.Client
	if serverFlag, _ := cmd.Flags().GetString("server"); serverFlag != "" {
		c = client.NewClientWithURL(serverFlag, logger)
		logger.Infof("Checking server: %s", serverFlag)
	} else {
		serverURL := viper.GetString("client.server_url")
		if serverURL == "" {
			return fmt.Errorf("no server URL configured for client mode")
		}
		c = client.NewClient(logger)
		logger.Infof("Checking configured server: %s", serverURL)
	}

	// Check server health
	ctx := context.Background()
	health, err := c.Health(ctx)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}

	// Output health status
	fmt.Printf("Server Status: %s\n", health.Status)
	fmt.Printf("Version: %s\n", health.Version)
	fmt.Printf("Uptime: %s\n", health.Uptime)

	logger.Info("Server health check completed successfully")
	return nil
}
