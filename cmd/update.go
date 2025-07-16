package cmd

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	updateContent     string
	updateTags        string
	updateTemperature float64
	updateMaxTokens   int
)

// updateCmd represents the update command
var updateCmd = &cobra.Command{
	Use:   "update [prompt-id]",
	Short: "Update an existing prompt",
	Long: `Update an existing prompt's content, tags, or parameters.

Examples:
  # Update prompt content
  prompt-alchemy update abc123-def456 --content "New prompt content here"

  # Update tags
  prompt-alchemy update abc123-def456 --tags "technical,updated,v2"

  # Update generation parameters
  prompt-alchemy update abc123-def456 --temperature 0.8 --max-tokens 3000

  # Update multiple fields
  prompt-alchemy update abc123-def456 --content "Updated content" --tags "new,tags" --temperature 0.9`,
	Args: cobra.ExactArgs(1),
	RunE: runUpdate,
}

func init() {
	updateCmd.Flags().StringVar(&updateContent, "content", "", "New content for the prompt")
	updateCmd.Flags().StringVar(&updateTags, "tags", "", "New tags (comma-separated)")
	updateCmd.Flags().Float64Var(&updateTemperature, "temperature", -1, "New temperature (0.0-1.0)")
	updateCmd.Flags().IntVar(&updateMaxTokens, "max-tokens", -1, "New max tokens")
}

func runUpdate(cmd *cobra.Command, args []string) error {
	promptIDStr := args[0]

	// Parse prompt ID
	promptID, err := uuid.Parse(promptIDStr)
	if err != nil {
		return fmt.Errorf("invalid prompt ID format: %w", err)
	}

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			log.GetLogger().WithError(err).Warn("Failed to close storage")
		}
	}()

	// Get existing prompt
	prompt, err := store.GetPromptByID(cmd.Context(), promptID)
	if err != nil {
		return fmt.Errorf("failed to get prompt: %w", err)
	}

	// Track what's being updated
	var updates []string

	// Update content if provided
	if updateContent != "" {
		prompt.Content = updateContent
		updates = append(updates, "content")
	}

	// Update tags if provided
	if updateTags != "" {
		tagList := strings.Split(updateTags, ",")
		for i, tag := range tagList {
			tagList[i] = strings.TrimSpace(tag)
		}
		prompt.Tags = tagList
		updates = append(updates, "tags")
	}

	// Update temperature if provided
	if updateTemperature >= 0 {
		if updateTemperature > 1.0 {
			return fmt.Errorf("temperature must be between 0.0 and 1.0")
		}
		prompt.Temperature = updateTemperature
		updates = append(updates, "temperature")
	}

	// Update max tokens if provided
	if updateMaxTokens > 0 {
		prompt.MaxTokens = updateMaxTokens
		updates = append(updates, "max_tokens")
	}

	// Check if anything was updated
	if len(updates) == 0 {
		return fmt.Errorf("no updates specified. Use --content, --tags, --temperature, or --max-tokens")
	}

	// Update the prompt
	err = store.SavePrompt(cmd.Context(), prompt)
	if err != nil {
		return fmt.Errorf("failed to update prompt: %w", err)
	}

	// Output success message
	fmt.Printf("✅ Successfully updated prompt %s\n", promptID.String())
	fmt.Printf("Updated fields: %s\n", strings.Join(updates, ", "))
	fmt.Println()

	// Show updated prompt details
	fmt.Println("Updated Prompt:")
	fmt.Println(strings.Repeat("-", 40))
	fmt.Printf("ID: %s\n", prompt.ID.String())
	fmt.Printf("Phase: %s\n", prompt.Phase)
	fmt.Printf("Provider: %s\n", prompt.Provider)
	fmt.Printf("Model: %s\n", prompt.Model)
	fmt.Printf("Temperature: %.2f\n", prompt.Temperature)
	fmt.Printf("Max Tokens: %d\n", prompt.MaxTokens)

	if len(prompt.Tags) > 0 {
		fmt.Printf("Tags: %s\n", strings.Join(prompt.Tags, ", "))
	}

	fmt.Printf("Updated: %s\n", prompt.UpdatedAt.Format("2006-01-02 15:04:05"))
	fmt.Println(strings.Repeat("-", 40))

	// Show content preview
	content := prompt.Content
	if len(content) > 300 {
		content = content[:300] + "..."
	}
	fmt.Printf("Content:\n%s\n", content)

	return nil
}
