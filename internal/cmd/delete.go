package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	deleteForce bool
	deleteAll   bool
)

// deleteCmd represents the delete command
var deleteCmd = &cobra.Command{
	Use:   "delete [prompt-id]",
	Short: "Delete an existing prompt",
	Long: `Delete an existing prompt and all its associated data including metrics and context.

⚠️  WARNING: This operation is irreversible!

Examples:
  # Delete a specific prompt (with confirmation)
  prompt-alchemy delete abc123-def456

  # Delete without confirmation
  prompt-alchemy delete abc123-def456 --force

  # Delete all prompts (DANGEROUS!)
  prompt-alchemy delete --all --force`,
	Args: func(cmd *cobra.Command, args []string) error {
		if deleteAll {
			return nil // No args required for --all
		}
		return cobra.ExactArgs(1)(cmd, args)
	},
	RunE: runDelete,
}

func init() {
	deleteCmd.Flags().BoolVar(&deleteForce, "force", false, "Skip confirmation prompt")
	deleteCmd.Flags().BoolVar(&deleteAll, "all", false, "Delete ALL prompts (DANGEROUS!)")
}

func runDelete(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Debug("Starting delete command")

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Error("Failed to close storage")
		}
	}()

	if deleteAll {
		return runDeleteAll(store)
	}

	promptIDStr := args[0]

	// Parse prompt ID
	promptID, err := uuid.Parse(promptIDStr)
	if err != nil {
		return fmt.Errorf("invalid prompt ID format: %w", err)
	}

	return runDeleteSingle(store, promptID)
}

func runDeleteSingle(store *storage.Storage, promptID uuid.UUID) error {
	logger := log.GetLogger()
	logger.Infof("Attempting to delete prompt: %s", promptID.String())

	// Get existing prompt to show details
	prompt, err := store.GetPrompt(promptID)
	if err != nil {
		return fmt.Errorf("failed to get prompt: %w", err)
	}

	// Show prompt details
	logger.Infof("🗑️  About to delete prompt:")
	logger.Info(strings.Repeat("-", 40))
	logger.Infof("ID: %s", prompt.ID.String())
	logger.Infof("Phase: %s", prompt.Phase)
	logger.Infof("Provider: %s", prompt.Provider)
	logger.Infof("Model: %s", prompt.Model)
	logger.Infof("Created: %s", prompt.CreatedAt.Format("2006-01-02 15:04:05"))

	if len(prompt.Tags) > 0 {
		logger.Infof("Tags: %s", strings.Join(prompt.Tags, ", "))
	}

	logger.Info(strings.Repeat("-", 40))

	// Show content preview
	content := prompt.Content
	if len(content) > 200 {
		content = content[:200] + "..."
	}
	logger.Infof("Content Preview:\n%s", content)
	logger.Info(strings.Repeat("-", 40))

	// Confirmation (unless --force is used)
	if !deleteForce {
		logger.Warn("\n⚠️  This will permanently delete the prompt and all associated data.")
		fmt.Printf("Are you sure you want to continue? (y/N): ")

		scanner := bufio.NewScanner(os.Stdin)
		scanner.Scan()
		response := strings.TrimSpace(strings.ToLower(scanner.Text()))

		if response != "y" && response != "yes" {
			logger.Info("❌ Deletion cancelled.")
			return nil
		}
	}

	// Delete the prompt
	logger.Debugf("Deleting prompt %s from storage", promptID.String())
	err = store.DeletePrompt(promptID)
	if err != nil {
		return fmt.Errorf("failed to delete prompt: %w", err)
	}

	logger.Infof("✅ Successfully deleted prompt %s", promptID.String())
	return nil
}

func runDeleteAll(store *storage.Storage) error {
	logger := log.GetLogger()
	logger.Warn("Attempting to delete ALL prompts")

	// Get count of all prompts
	criteria := storage.SearchCriteria{
		Limit: 10000, // Large limit to get all
	}

	prompts, err := store.SearchPrompts(criteria)
	if err != nil {
		return fmt.Errorf("failed to get prompt count: %w", err)
	}

	promptCount := len(prompts)
	if promptCount == 0 {
		logger.Info("No prompts found to delete.")
		return nil
	}

	logger.Warnf("🗑️  About to delete ALL %d prompts!", promptCount)
	logger.Warn("This will delete:")
	logger.Warnf("- %d prompts", promptCount)
	logger.Warn("- All associated metrics")
	logger.Warn("- All associated context data")
	logger.Warn("- All model metadata")

	// Confirmation (unless --force is used)
	if !deleteForce {
		logger.Warn("\n⚠️  THIS IS IRREVERSIBLE! ALL YOUR PROMPT DATA WILL BE LOST!")
		fmt.Printf("Type 'DELETE ALL' to confirm: ")

		scanner := bufio.NewScanner(os.Stdin)
		scanner.Scan()
		response := strings.TrimSpace(scanner.Text())

		if response != "DELETE ALL" {
			logger.Info("❌ Deletion cancelled.")
			return nil
		}
	}

	// Delete all prompts
	deletedCount := 0
	for _, prompt := range prompts {
		logger.Debugf("Deleting prompt %s", prompt.ID.String())
		err := store.DeletePrompt(prompt.ID)
		if err != nil {
			logger.WithError(err).Warnf("Failed to delete prompt %s", prompt.ID.String())
		} else {
			deletedCount++
		}
	}

	logger.Infof("✅ Successfully deleted %d out of %d prompts", deletedCount, promptCount)

	if deletedCount < promptCount {
		logger.Warnf("%d prompts could not be deleted", promptCount-deletedCount)
	}

	return nil
}
