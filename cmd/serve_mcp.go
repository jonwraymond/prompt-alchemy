package cmd

import (
	"github.com/spf13/cobra"
)

var serveMCPCmd = &cobra.Command{
	Use:   "mcp",
	Short: "Start MCP server (stdin/stdout)",
	Long: `Start the Prompt Alchemy MCP server for AI agent integration.

The server implements the Model Context Protocol (MCP) and communicates via
JSON-RPC 2.0 over stdin/stdout. This allows AI agents to use Prompt Alchemy's
capabilities through standardized tools.

Example usage:
  # Start MCP server
  prompt-alchemy serve mcp

  # Use with Docker
  docker exec -i prompt-alchemy-mcp prompt-alchemy serve mcp`,
	RunE: runServe, // Use the same function as the original serve command
}

func init() {
	serveCmd.AddCommand(serveMCPCmd)
}
