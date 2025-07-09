package cmd

import (
	"github.com/spf13/cobra"
)

// testCmd represents the test command
var testCmd = &cobra.Command{
	Use:   "test",
	Short: "Test prompt variants",
	Long:  `A/B test prompts with different outputs.`,
	Run: func(cmd *cobra.Command, args []string) {
		logger.Info("Test command not yet implemented")
	},
}
