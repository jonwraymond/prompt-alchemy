package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Migrate data (currently disabled)",
	Long: `The migrate command is currently disabled pending a refactor to support the new storage layer.
This command will be re-enabled in a future update.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("The migrate command is currently disabled.")
	},
}

func init() {
	// The migrate command is currently disabled.
	// Flags will be re-added when the command is re-implemented.
}
