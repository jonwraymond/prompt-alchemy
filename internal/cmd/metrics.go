package cmd

import (
	"github.com/spf13/cobra"
)

// metricsCmd represents the metrics command
var metricsCmd = &cobra.Command{
	Use:   "metrics",
	Short: "View prompt performance metrics",
	Long:  `Track which prompt structures lead to best conversion, engagement, or clarity.`,
	Run: func(cmd *cobra.Command, args []string) {
		logger.Info("Metrics command not yet implemented")
	},
}
