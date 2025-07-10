package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/jonwraymond/prompt-alchemy/internal/storage"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Migrate prompts to use standardized embedding dimensions",
	Long: `Migrate existing prompts to use standardized embedding dimensions for optimal search coverage.

This command will:
• Detect prompts with non-standard embedding dimensions
• Clear legacy embeddings to trigger re-embedding with standard model
• Provide migration statistics and progress

The standard embedding model (text-embedding-3-small, 1536 dimensions) provides
optimal semantic search coverage and compatibility across all prompts.

Examples:
  prompt-alchemy migrate                    # Run migration with default settings
  prompt-alchemy migrate --dry-run         # Preview migration without changes
  prompt-alchemy migrate --batch-size 20   # Process in larger batches`,
	Run: runMigrate,
}

var (
	migrateDryRun    bool
	migrateBatchSize int
	migrateForce     bool
)

func init() {
	migrateCmd.Flags().BoolVar(&migrateDryRun, "dry-run", false, "Preview migration without making changes")
	migrateCmd.Flags().IntVar(&migrateBatchSize, "batch-size", 10, "Number of prompts to process in each batch")
	migrateCmd.Flags().BoolVar(&migrateForce, "force", false, "Force migration even if already completed")
}

func runMigrate(cmd *cobra.Command, args []string) {
	// Get data directory
	dataDir := viper.GetString("data_dir")
	if dataDir == "" {
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, ".prompt-alchemy")
	}

	// Expand tilde if present
	if dataDir[:2] == "~/" {
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, dataDir[2:])
	}

	// Initialize storage
	store, err := storage.NewStorage(dataDir, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize storage")
		return
	}
	defer store.Close()

	// Get embedding configuration from config
	standardModel := viper.GetString("embeddings.standard_model")
	if standardModel == "" {
		standardModel = "text-embedding-3-small" // Default standard
	}

	standardDimensions := viper.GetInt("embeddings.standard_dimensions")
	if standardDimensions == 0 {
		standardDimensions = 1536 // Default for text-embedding-3-small
	}

	batchSize := migrateBatchSize
	if batchSize <= 0 {
		batchSize = 10
	}

	fmt.Printf("🔧 EMBEDDING STANDARDIZATION MIGRATION\n")
	fmt.Printf("=====================================\n\n")

	// Get current embedding statistics
	stats, err := store.GetEmbeddingStats()
	if err != nil {
		logger.WithError(err).Fatal("Failed to get embedding statistics")
		return
	}

	fmt.Printf("📊 Current Embedding Status:\n")
	fmt.Printf("   Total Prompts: %v\n", stats["total_prompts"])
	fmt.Printf("   Prompts with Embeddings: %v\n", stats["prompts_with_embeddings"])
	fmt.Printf("   Embedding Coverage: %.1f%%\n\n", stats["embedding_coverage"])

	if models, ok := stats["models"].([]interface{}); ok && len(models) > 0 {
		fmt.Printf("📈 Current Embedding Models:\n")
		for _, model := range models {
			if m, ok := model.(struct {
				Model      string `db:"embedding_model"`
				Dimensions int    `db:"dimensions"`
				Count      int    `db:"count"`
			}); ok {
				fmt.Printf("   %s (%dd): %d prompts\n", m.Model, m.Dimensions, m.Count)
			}
		}
		fmt.Printf("\n")
	}

	fmt.Printf("🎯 Target Standard:\n")
	fmt.Printf("   Model: %s\n", standardModel)
	fmt.Printf("   Dimensions: %d\n", standardDimensions)
	fmt.Printf("   Batch Size: %d\n\n", batchSize)

	if migrateDryRun {
		fmt.Printf("🔍 DRY RUN MODE - No changes will be made\n\n")
	}

	// Check if migration is needed
	needsMigration := false
	if models, ok := stats["models"].([]interface{}); ok {
		for _, model := range models {
			if m, ok := model.(struct {
				Model      string `db:"embedding_model"`
				Dimensions int    `db:"dimensions"`
				Count      int    `db:"count"`
			}); ok {
				if m.Model != standardModel || m.Dimensions != standardDimensions {
					needsMigration = true
					break
				}
			}
		}
	}

	if !needsMigration && !migrateForce {
		fmt.Printf("✅ All embeddings already use the standard model and dimensions\n")
		fmt.Printf("   Use --force to run migration anyway\n\n")
		return
	}

	if migrateDryRun {
		fmt.Printf("📋 Migration Preview:\n")
		fmt.Printf("   Would migrate prompts with non-standard embeddings\n")
		fmt.Printf("   Legacy embeddings would be cleared for re-processing\n")
		fmt.Printf("   New embeddings would use: %s (%dd)\n\n", standardModel, standardDimensions)
		fmt.Printf("Run without --dry-run to execute migration\n")
		return
	}

	// Perform the migration
	fmt.Printf("🚀 Starting Migration...\n\n")

	err = store.MigrateLegacyEmbeddings(standardModel, standardDimensions, batchSize)
	if err != nil {
		logger.WithError(err).Fatal("Migration failed")
	}

	// Get updated statistics
	newStats, err := store.GetEmbeddingStats()
	if err != nil {
		logger.WithError(err).Warn("Failed to get updated statistics")
	} else {
		fmt.Printf("📊 Migration Results:\n")
		fmt.Printf("   Total Prompts: %v\n", newStats["total_prompts"])
		fmt.Printf("   Prompts with Embeddings: %v\n", newStats["prompts_with_embeddings"])
		fmt.Printf("   Embedding Coverage: %.1f%%\n\n", newStats["embedding_coverage"])

		fmt.Printf("✨ Benefits of Standardization:\n")
		fmt.Printf("   • 100%% search compatibility across all prompts\n")
		fmt.Printf("   • Optimal semantic similarity calculations\n")
		fmt.Printf("   • Consistent embedding quality and performance\n")
		fmt.Printf("   • Maximum search coverage and recall\n\n")
	}

	fmt.Printf("✅ Migration completed successfully!\n")
	fmt.Printf("📢 Next Steps:\n")
	fmt.Printf("   • Re-embed cleared prompts: prompt-alchemy generate --re-embed\n")
	fmt.Printf("   • Test search functionality: prompt-alchemy search \"your query\"\n")
	fmt.Printf("   • Verify with metrics: prompt-alchemy metrics --embeddings\n\n")
}
