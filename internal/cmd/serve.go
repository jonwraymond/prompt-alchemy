package cmd

import (
	"github.com/spf13/cobra"
)

// serveCmd represents the serve command
var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start MCP server for AI agents",
	Long:  `Start the Model Context Protocol server to allow AI agents to use PromptForge.`,
	Run: func(cmd *cobra.Command, args []string) {
		logger.Info("Serve command not yet implemented - MCP integration pending")
	},
}
