package cmd

import (
	"github.com/spf13/cobra"
)

// searchCmd represents the search command
var searchCmd = &cobra.Command{
	Use:   "search [query]",
	Short: "Search existing prompts",
	Long:  `Search through saved prompts using semantic search and filters.`,
	Run: func(cmd *cobra.Command, args []string) {
		logger.Info("Search command not yet implemented")
	},
}
