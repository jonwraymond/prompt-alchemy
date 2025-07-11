package cmd

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"
)

// Version information - these will be set at build time via ldflags
var (
	Version   = "dev"     // Semantic version (e.g., v1.2.3)
	GitCommit = "unknown" // Git commit hash
	GitTag    = "unknown" // Git tag
	BuildDate = "unknown" // Build timestamp
	GoVersion = runtime.Version()
	Platform  = fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH)
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show version information",
	Long: `Display version information including semantic version, git commit,
build date, and platform details.`,
	Run: func(cmd *cobra.Command, args []string) {
		showVersion(cmd)
	},
}

func init() {
	// Add flags for different output formats
	versionCmd.Flags().BoolP("short", "s", false, "Show only the version number")
	versionCmd.Flags().BoolP("json", "j", false, "Output version information as JSON")
}

func showVersion(cmd *cobra.Command) {
	short, _ := cmd.Flags().GetBool("short")
	jsonOutput, _ := cmd.Flags().GetBool("json")

	if short {
		fmt.Println(Version)
		return
	}

	if jsonOutput {
		fmt.Printf(`{
  "version": "%s",
  "git_commit": "%s",
  "git_tag": "%s",
  "build_date": "%s",
  "go_version": "%s",
  "platform": "%s"
}
`, Version, GitCommit, GitTag, BuildDate, GoVersion, Platform)
		return
	}

	// Default detailed output
	fmt.Printf("Prompt Alchemy %s\n", Version)
	fmt.Printf("Git Commit:    %s\n", GitCommit)
	fmt.Printf("Git Tag:       %s\n", GitTag)
	fmt.Printf("Build Date:    %s\n", BuildDate)
	fmt.Printf("Go Version:    %s\n", GoVersion)
	fmt.Printf("Platform:      %s\n", Platform)
}
