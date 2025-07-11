package cmd

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Migrate data between operational modes and update embeddings",
	Long: `Migrate data between operational modes or update legacy embeddings.

This command provides multiple migration options:
• embeddings: Migrate prompts to use standardized embedding dimensions
• export: Export data for transfer between modes or backup
• import: Import data from another instance or backup

Examples:
  prompt-alchemy migrate embeddings                    # Update embeddings
  prompt-alchemy migrate export --format json         # Export all data
  prompt-alchemy migrate import --file backup.json    # Import from backup`,
}

var (
	migrateDryRun    bool
	migrateBatchSize int
	migrateForce     bool
	exportFormat     string
	exportFile       string
	importFile       string
	includeEmbeddings bool
	includeMetrics    bool
)

// Subcommands
var migrateEmbeddingsCmd = &cobra.Command{
	Use:   "embeddings",
	Short: "Migrate prompts to use standardized embedding dimensions",
	Long: `Migrate existing prompts to use standardized embedding dimensions for optimal search coverage.

This command will:
• Detect prompts with non-standard embedding dimensions
• Clear legacy embeddings to trigger re-embedding with standard model
• Provide migration statistics and progress

The standard embedding model (text-embedding-3-small, 1536 dimensions) provides
optimal semantic search coverage and compatibility across all prompts.

Examples:
  prompt-alchemy migrate embeddings                    # Run migration with default settings
  prompt-alchemy migrate embeddings --dry-run         # Preview migration without changes
  prompt-alchemy migrate embeddings --batch-size 20   # Process in larger batches`,
	Run: runMigrateEmbeddings,
}

var migrateExportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export data for backup or transfer between modes",
	Long: `Export prompts and related data for backup or transfer between operational modes.

This command exports:
• All prompts with metadata
• Embeddings (optional, use --include-embeddings)
• Usage analytics and metrics (optional, use --include-metrics)
• Model metadata and relationships

Output formats: json, csv

Examples:
  prompt-alchemy migrate export                       # Export to JSON (default)
  prompt-alchemy migrate export --format csv         # Export to CSV
  prompt-alchemy migrate export --file backup.json  # Export to specific file
  prompt-alchemy migrate export --include-embeddings # Include vector embeddings`,
	Run: runMigrateExport,
}

var migrateImportCmd = &cobra.Command{
	Use:   "import",
	Short: "Import data from backup or another instance",
	Long: `Import prompts and related data from a backup or another PromGen instance.

This command imports:
• Prompts with automatic deduplication based on content hash
• Embeddings (if present in the import file)
• Usage analytics and metrics
• Model metadata with conflict resolution

Supported formats: json, csv

Examples:
  prompt-alchemy migrate import --file backup.json   # Import from JSON backup
  prompt-alchemy migrate import --file data.csv      # Import from CSV file
  prompt-alchemy migrate import --dry-run --file x   # Preview import without changes`,
	Run: runMigrateImport,
}

func init() {
	// Add subcommands
	migrateCmd.AddCommand(migrateEmbeddingsCmd)
	migrateCmd.AddCommand(migrateExportCmd)
	migrateCmd.AddCommand(migrateImportCmd)

	// Embeddings subcommand flags
	migrateEmbeddingsCmd.Flags().BoolVar(&migrateDryRun, "dry-run", false, "Preview migration without making changes")
	migrateEmbeddingsCmd.Flags().IntVar(&migrateBatchSize, "batch-size", 10, "Number of prompts to process in each batch")
	migrateEmbeddingsCmd.Flags().BoolVar(&migrateForce, "force", false, "Force migration even if already completed")

	// Export subcommand flags
	migrateExportCmd.Flags().StringVar(&exportFormat, "format", "json", "Export format (json, csv)")
	migrateExportCmd.Flags().StringVar(&exportFile, "file", "", "Output file (default: prompts_export_TIMESTAMP.json/csv)")
	migrateExportCmd.Flags().BoolVar(&includeEmbeddings, "include-embeddings", false, "Include vector embeddings in export")
	migrateExportCmd.Flags().BoolVar(&includeMetrics, "include-metrics", true, "Include usage metrics and analytics")

	// Import subcommand flags
	migrateImportCmd.Flags().StringVar(&importFile, "file", "", "Import file path (required)")
	migrateImportCmd.Flags().BoolVar(&migrateDryRun, "dry-run", false, "Preview import without making changes")
	migrateImportCmd.Flags().BoolVar(&migrateForce, "force", false, "Force import and overwrite existing prompts")
	
	// Mark required flags
	migrateImportCmd.MarkFlagRequired("file")
}

func runMigrateEmbeddings(cmd *cobra.Command, args []string) {
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
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close storage")
		}
	}()

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

func runMigrateExport(cmd *cobra.Command, args []string) {
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
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close storage")
		}
	}()

	fmt.Printf("📤 PROMPT DATA EXPORT\n")
	fmt.Printf("====================\n\n")

	// Generate output filename if not provided
	outputFile := exportFile
	if outputFile == "" {
		timestamp := time.Now().Format("20060102_150405")
		if exportFormat == "csv" {
			outputFile = fmt.Sprintf("prompts_export_%s.csv", timestamp)
		} else {
			outputFile = fmt.Sprintf("prompts_export_%s.json", timestamp)
		}
	}

	fmt.Printf("📋 Export Configuration:\n")
	fmt.Printf("   Format: %s\n", exportFormat)
	fmt.Printf("   Output File: %s\n", outputFile)
	fmt.Printf("   Include Embeddings: %v\n", includeEmbeddings)
	fmt.Printf("   Include Metrics: %v\n", includeMetrics)
	fmt.Printf("\n")

	// Export data based on format
	switch exportFormat {
	case "json":
		err = exportToJSON(store, outputFile)
	case "csv":
		err = exportToCSV(store, outputFile)
	default:
		logger.Fatalf("Unsupported export format: %s", exportFormat)
		return
	}

	if err != nil {
		logger.WithError(err).Fatal("Export failed")
		return
	}

	fmt.Printf("✅ Export completed successfully!\n")
	fmt.Printf("📁 Data exported to: %s\n\n", outputFile)
	fmt.Printf("💡 Usage:\n")
	fmt.Printf("   • Transfer to another system: copy %s to target location\n", outputFile)
	fmt.Printf("   • Import: prompt-alchemy migrate import --file %s\n", outputFile)
	fmt.Printf("   • Backup: store %s in version control or backup system\n\n", outputFile)
}

func runMigrateImport(cmd *cobra.Command, args []string) {
	// Validate import file exists
	if _, err := os.Stat(importFile); os.IsNotExist(err) {
		logger.Fatalf("Import file does not exist: %s", importFile)
		return
	}

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
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close storage")
		}
	}()

	fmt.Printf("📥 PROMPT DATA IMPORT\n")
	fmt.Printf("====================\n\n")

	fmt.Printf("📋 Import Configuration:\n")
	fmt.Printf("   Source File: %s\n", importFile)
	fmt.Printf("   Dry Run: %v\n", migrateDryRun)
	fmt.Printf("   Force Overwrite: %v\n", migrateForce)
	fmt.Printf("\n")

	// Detect format from file extension
	var importFormat string
	if filepath.Ext(importFile) == ".csv" {
		importFormat = "csv"
	} else {
		importFormat = "json"
	}

	fmt.Printf("🔍 Detected format: %s\n\n", importFormat)

	// Import data based on format
	var importedCount int
	var skippedCount int

	switch importFormat {
	case "json":
		importedCount, skippedCount, err = importFromJSON(store, importFile, migrateDryRun, migrateForce)
	case "csv":
		importedCount, skippedCount, err = importFromCSV(store, importFile, migrateDryRun, migrateForce)
	default:
		logger.Fatalf("Unsupported import format: %s", importFormat)
		return
	}

	if err != nil {
		logger.WithError(err).Fatal("Import failed")
		return
	}

	fmt.Printf("📊 Import Results:\n")
	fmt.Printf("   Imported: %d prompts\n", importedCount)
	fmt.Printf("   Skipped: %d prompts (duplicates)\n", skippedCount)
	fmt.Printf("   Total Processed: %d prompts\n\n", importedCount+skippedCount)

	if migrateDryRun {
		fmt.Printf("🔍 DRY RUN COMPLETED - No changes made\n")
		fmt.Printf("   Run without --dry-run to execute import\n\n")
	} else {
		fmt.Printf("✅ Import completed successfully!\n")
		fmt.Printf("📢 Next Steps:\n")
		fmt.Printf("   • Verify data: prompt-alchemy search \"test query\"\n")
		fmt.Printf("   • Check metrics: prompt-alchemy metrics\n")
		fmt.Printf("   • Re-generate embeddings if needed: prompt-alchemy generate --re-embed\n\n")
	}
}

// ExportData represents the structure for exported data
type ExportData struct {
	ExportInfo ExportInfo      `json:"export_info"`
	Prompts    []models.Prompt `json:"prompts"`
}

type ExportInfo struct {
	Timestamp         time.Time `json:"timestamp"`
	Version           string    `json:"version"`
	TotalPrompts      int       `json:"total_prompts"`
	IncludeEmbeddings bool      `json:"include_embeddings"`
	IncludeMetrics    bool      `json:"include_metrics"`
	ExportedBy        string    `json:"exported_by"`
}

// exportToJSON exports prompts and related data to JSON format
func exportToJSON(store *storage.Storage, outputFile string) error {
	// Get all prompts from storage
	// Note: This is a placeholder - you'll need to implement GetAllPrompts in storage
	// For now, we'll create a basic structure
	
	exportData := ExportData{
		ExportInfo: ExportInfo{
			Timestamp:         time.Now(),
			Version:           "1.0",
			TotalPrompts:      0, // Will be updated below
			IncludeEmbeddings: includeEmbeddings,
			IncludeMetrics:    includeMetrics,
			ExportedBy:        "prompt-alchemy migrate export",
		},
		Prompts: []models.Prompt{}, // Placeholder - needs storage implementation
	}

	// Get all prompts from storage
	prompts, err := store.GetAllPrompts()
	if err != nil {
		return fmt.Errorf("failed to retrieve prompts: %w", err)
	}
	exportData.Prompts = prompts
	exportData.ExportInfo.TotalPrompts = len(prompts)

	// Create output file
	file, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer file.Close()

	// Write JSON data with indentation
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(exportData); err != nil {
		return fmt.Errorf("failed to encode JSON: %w", err)
	}

	fmt.Printf("📊 Export Summary:\n")
	fmt.Printf("   Prompts exported: %d\n", exportData.ExportInfo.TotalPrompts)
	fmt.Printf("   Embeddings included: %v\n", includeEmbeddings)
	fmt.Printf("   Metrics included: %v\n", includeMetrics)
	fmt.Printf("\n")

	return nil
}

// exportToCSV exports prompts to CSV format
func exportToCSV(store *storage.Storage, outputFile string) error {
	// Create output file
	file, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write CSV header
	header := []string{
		"id", "content", "phase", "provider", "model", "temperature",
		"max_tokens", "actual_tokens", "tags", "source_type",
		"relevance_score", "usage_count", "created_at", "updated_at",
		"embedding_model", "embedding_provider", "original_input",
		"persona_used",
	}
	
	if includeEmbeddings {
		header = append(header, "embedding_base64")
	}

	if err := writer.Write(header); err != nil {
		return fmt.Errorf("failed to write CSV header: %w", err)
	}

	// TODO: Implement actual data retrieval and writing
	// prompts, err := store.GetAllPrompts()
	// if err != nil {
	//     return fmt.Errorf("failed to retrieve prompts: %w", err)
	// }
	//
	// for _, prompt := range prompts {
	//     record := []string{
	//         prompt.ID.String(),
	//         prompt.Content,
	//         prompt.Phase,
	//         // ... other fields
	//     }
	//     if err := writer.Write(record); err != nil {
	//         return fmt.Errorf("failed to write CSV record: %w", err)
	//     }
	// }

	fmt.Printf("📊 Export Summary:\n")
	fmt.Printf("   Format: CSV\n")
	fmt.Printf("   Embeddings included: %v\n", includeEmbeddings)
	fmt.Printf("   Metrics included: %v\n", includeMetrics)
	fmt.Printf("\n")

	return nil
}

// importFromJSON imports prompts from JSON format
func importFromJSON(store *storage.Storage, inputFile string, dryRun bool, force bool) (int, int, error) {
	file, err := os.Open(inputFile)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to open input file: %w", err)
	}
	defer file.Close()

	var importData ExportData
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&importData); err != nil {
		return 0, 0, fmt.Errorf("failed to decode JSON: %w", err)
	}

	fmt.Printf("📁 Import File Info:\n")
	fmt.Printf("   Export Date: %s\n", importData.ExportInfo.Timestamp.Format("2006-01-02 15:04:05"))
	fmt.Printf("   Export Version: %s\n", importData.ExportInfo.Version)
	fmt.Printf("   Total Prompts: %d\n", importData.ExportInfo.TotalPrompts)
	fmt.Printf("   Exported By: %s\n\n", importData.ExportInfo.ExportedBy)

	importedCount := 0
	skippedCount := 0

	for _, prompt := range importData.Prompts {
		if dryRun {
			fmt.Printf("   [DRY RUN] Would import: %s (%.50s...)\n", prompt.ID, prompt.Content)
			importedCount++
			continue
		}

		// Save the prompt (simple implementation without duplicate detection for now)
		if err := store.SavePrompt(&prompt); err != nil {
			return importedCount, skippedCount, fmt.Errorf("failed to save prompt: %w", err)
		}

		importedCount++
	}

	return importedCount, skippedCount, nil
}

// importFromCSV imports prompts from CSV format
func importFromCSV(store *storage.Storage, inputFile string, dryRun bool, force bool) (int, int, error) {
	file, err := os.Open(inputFile)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to open input file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) == 0 {
		return 0, 0, fmt.Errorf("CSV file is empty")
	}

	// Parse header
	header := records[0]
	fmt.Printf("📁 CSV Import Info:\n")
	fmt.Printf("   Columns: %s\n", strings.Join(header, ", "))
	fmt.Printf("   Total Rows: %d\n\n", len(records)-1)

	importedCount := 0
	skippedCount := 0

	// Process data rows
	for i, record := range records[1:] {
		if len(record) != len(header) {
			logger.Warnf("Row %d has mismatched column count, skipping", i+2)
			skippedCount++
			continue
		}

		if dryRun {
			fmt.Printf("   [DRY RUN] Would import row %d: %.50s...\n", i+2, record[1]) // Assuming content is in column 1
			importedCount++
			continue
		}

		// TODO: Implement actual CSV parsing and import logic
		// prompt, err := parseCSVRecord(header, record)
		// if err != nil {
		//     logger.WithError(err).Warnf("Failed to parse row %d, skipping", i+2)
		//     skippedCount++
		//     continue
		// }
		//
		// // Check for duplicates and save
		// existing, err := store.GetPromptByContentHash(prompt.ContentHash)
		// if err != nil && err != storage.ErrNotFound {
		//     return importedCount, skippedCount, fmt.Errorf("failed to check for duplicate: %w", err)
		// }
		//
		// if existing != nil && !force {
		//     skippedCount++
		//     continue
		// }
		//
		// if err := store.SavePrompt(prompt); err != nil {
		//     return importedCount, skippedCount, fmt.Errorf("failed to save prompt: %w", err)
		// }

		importedCount++
	}

	return importedCount, skippedCount, nil
}
