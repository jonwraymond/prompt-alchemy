package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// dbCmd represents the db command
var dbCmd = &cobra.Command{
	Use:   "db",
	Short: "Database operations and information",
	Long: `Database operations for Prompt Alchemy including listing prompts,
checking database status, and viewing storage statistics.

Examples:
  prompt-alchemy db list      # List all prompts
  prompt-alchemy db stats     # Show database statistics  
  prompt-alchemy db status    # Check database status`,
}

var dbListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all prompts in the database",
	RunE:  runDBList,
}

var dbStatsCmd = &cobra.Command{
	Use:   "stats",
	Short: "Show database statistics",
	RunE:  runDBStats,
}

var dbStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check database status",
	RunE:  runDBStatus,
}

func init() {
	dbCmd.AddCommand(dbListCmd)
	dbCmd.AddCommand(dbStatsCmd)
	dbCmd.AddCommand(dbStatusCmd)
}

func runDBList(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Listing prompts from database")

	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		logger.Errorf("Failed to initialize storage: %v", err)
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Error("Failed to close storage")
		}
	}()

	logger.Debug("Fetching up to 100 prompts")
	prompts, err := store.GetHighQualityHistoricalPrompts(cmd.Context(), 100) // Get first 100 prompts
	if err != nil {
		logger.Errorf("Failed to list prompts: %v", err)
		return fmt.Errorf("failed to list prompts: %w", err)
	}

	fmt.Printf("Found %d prompts:\n\n", len(prompts))
	for _, prompt := range prompts {
		fmt.Printf("ID: %s\n", prompt.ID.String())
		fmt.Printf("Phase: %s\n", prompt.Phase)
		fmt.Printf("Provider: %s\n", prompt.Provider)
		fmt.Printf("Model: %s\n", prompt.Model)
		fmt.Printf("Content: %.100s...\n", prompt.Content)
		fmt.Printf("Created: %s\n", prompt.CreatedAt.Format("2006-01-02 15:04:05"))
		fmt.Println("---")
	}

	logger.Infof("Successfully listed %d prompts", len(prompts))
	return nil
}

func runDBStats(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Calculating database statistics")

	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		logger.Errorf("Failed to initialize storage: %v", err)
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Error("Failed to close storage")
		}
	}()

	// Get basic counts
	logger.Debug("Fetching all prompts for statistics")
	prompts, err := store.GetHighQualityHistoricalPrompts(cmd.Context(), 10000) // Get all prompts for counting
	if err != nil {
		logger.Errorf("Failed to list prompts: %v", err)
		return fmt.Errorf("failed to list prompts: %w", err)
	}

	fmt.Printf("Database Statistics:\n")
	fmt.Printf("==================\n")
	fmt.Printf("Total Prompts: %d\n", len(prompts))

	// Count by provider
	providerCounts := make(map[string]int)
	phaseCounts := make(map[string]int)

	for _, prompt := range prompts {
		providerCounts[prompt.Provider]++
		phaseCounts[string(prompt.Phase)]++
	}

	fmt.Printf("\nBy Provider:\n")
	for provider, count := range providerCounts {
		fmt.Printf("  %s: %d\n", provider, count)
	}

	fmt.Printf("\nBy Phase:\n")
	for phase, count := range phaseCounts {
		fmt.Printf("  %s: %d\n", phase, count)
	}

	logger.Info("Successfully generated database statistics")
	return nil
}

func runDBStatus(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Checking database status")
	dataDir := viper.GetString("data_dir")
	dbPath := filepath.Join(dataDir, "prompts.db")

	fmt.Printf("Database Status:\n")
	fmt.Printf("===============\n")
	fmt.Printf("Data Directory: %s\n", dataDir)
	fmt.Printf("Database Path: %s\n", dbPath)

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		logger.Warnf("Database does not exist at %s", dbPath)
		fmt.Printf("Status: ❌ Database does not exist\n")
		fmt.Printf("Run 'prompt-alchemy migrate' to create the database\n")
		return nil
	}

	// Get file info
	info, err := os.Stat(dbPath)
	if err != nil {
		logger.Errorf("Failed to get database info: %v", err)
		return fmt.Errorf("failed to get database info: %w", err)
	}

	fmt.Printf("Status: ✅ Database exists\n")
	fmt.Printf("Size: %d bytes\n", info.Size())
	fmt.Printf("Modified: %s\n", info.ModTime().Format("2006-01-02 15:04:05"))

	// Test connection
	logger.Debug("Attempting to connect to the database")
	store, err := storage.NewStorage(dbPath, logger)
	if err != nil {
		logger.Errorf("Failed to connect to database: %v", err)
		fmt.Printf("Connection: ❌ Failed to connect (%v)\n", err)
		return nil
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Error("Failed to close storage")
		}
	}()

	fmt.Printf("Connection: ✅ Successfully connected\n")
	logger.Info("Database status check completed successfully")

	return nil
}
