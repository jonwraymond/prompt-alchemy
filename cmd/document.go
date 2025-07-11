package cmd

import (
	"fmt"
	"os/exec"

	"github.com/spf13/cobra"
)

var documentCmd = &cobra.Command{
	Use:   "document",
	Short: "Generate and update project documentation",
	Long:  `Generate documentation including rendering Mermaid diagrams to SVG for GitHub Pages.`,
	RunE:  runDocument,
}

func runDocument(cmd *cobra.Command, args []string) error {
	// Run extract script
	extractCmd := exec.Command("python3", "scripts/extract-mermaid-diagrams.py", "docs/diagrams-mermaid.md", "docs/assets/diagrams")
	output, err := extractCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to extract diagrams: %w\nOutput: %s", err, output)
	}
	fmt.Printf("Extract output: %s\n", output)

	// Run render script
	renderCmd := exec.Command("./scripts/render-diagrams.sh")
	output, err = renderCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to render diagrams: %w\nOutput: %s", err, output)
	}
	fmt.Printf("Render output: %s\n", output)

	fmt.Println("Documentation generated successfully")
	return nil
}
