package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"text/template"

	"github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	scheduleTime      string
	scheduleMethod    string
	scheduleUninstall bool
	scheduleList      bool
	scheduleDryRun    bool
)

// scheduleCmd represents the schedule command
var scheduleCmd = &cobra.Command{
	Use:   "schedule",
	Short: "Install, uninstall, or manage scheduled nightly jobs",
	Long: `Manage scheduled execution of the nightly training job using cron or launchd.

This command helps you set up automated execution of the prompt-alchemy nightly 
command at a specified time. It supports both cron (Linux/macOS) and launchd (macOS).

Examples:
  # Install nightly job at 2 AM using cron
  prompt-alchemy schedule --time "0 2 * * *"
  
  # Install nightly job at 2 AM using launchd (macOS)
  prompt-alchemy schedule --time "0 2 * * *" --method launchd
  
  # Install job at 3:30 AM daily
  prompt-alchemy schedule --time "30 3 * * *"
  
  # List current scheduled jobs
  prompt-alchemy schedule --list
  
  # Uninstall scheduled job
  prompt-alchemy schedule --uninstall
  
  # Dry run to see what would be installed
  prompt-alchemy schedule --time "0 2 * * *" --dry-run`,
	RunE: runSchedule,
}

func init() {
	rootCmd.AddCommand(scheduleCmd)

	scheduleCmd.Flags().StringVar(&scheduleTime, "time", "0 2 * * *", "Schedule time in cron format (default: daily at 2 AM)")
	scheduleCmd.Flags().StringVar(&scheduleMethod, "method", "auto", "Scheduling method: auto, cron, or launchd")
	scheduleCmd.Flags().BoolVar(&scheduleUninstall, "uninstall", false, "Uninstall the scheduled job")
	scheduleCmd.Flags().BoolVar(&scheduleList, "list", false, "List current scheduled jobs")
	scheduleCmd.Flags().BoolVar(&scheduleDryRun, "dry-run", false, "Show what would be done without making changes")
}

func runSchedule(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()

	if scheduleList {
		return listScheduledJobs()
	}

	if scheduleUninstall {
		return uninstallScheduledJob()
	}

	if scheduleTime == "" {
		return fmt.Errorf("schedule time is required (use --time flag)")
	}

	// Validate cron format
	if err := validateCronFormat(scheduleTime); err != nil {
		return fmt.Errorf("invalid cron format: %w", err)
	}

	// Determine scheduling method
	method := scheduleMethod
	if method == "auto" {
		method = detectSchedulingMethod()
	}

	logger.Infof("Installing nightly job with %s at: %s", method, scheduleTime)

	switch method {
	case "cron":
		return installCronJob()
	case "launchd":
		return installLaunchdJob()
	default:
		return fmt.Errorf("unsupported scheduling method: %s", method)
	}
}

func detectSchedulingMethod() string {
	if runtime.GOOS == "darwin" {
		// On macOS, prefer launchd but allow cron as fallback
		if _, err := exec.LookPath("launchctl"); err == nil {
			return "launchd"
		}
	}

	// Default to cron for Linux and as fallback
	if _, err := exec.LookPath("crontab"); err == nil {
		return "cron"
	}

	return "cron" // Default even if not found - will error later
}

func validateCronFormat(cronExpr string) error {
	fields := strings.Fields(cronExpr)
	if len(fields) != 5 {
		return fmt.Errorf("cron expression must have exactly 5 fields, got %d", len(fields))
	}

	// Basic validation - could be more thorough
	fieldNames := []string{"minute", "hour", "day", "month", "weekday"}
	for i, field := range fields {
		if field == "" {
			return fmt.Errorf("%s field cannot be empty", fieldNames[i])
		}
	}

	return nil
}

func installCronJob() error {
	logger := log.GetLogger()

	// Get current binary path
	binaryPath, err := getBinaryPath()
	if err != nil {
		return fmt.Errorf("failed to get binary path: %w", err)
	}

	// Get config file path
	configPath := viper.ConfigFileUsed()
	if configPath == "" {
		configPath = getDefaultConfigPath()
	}

	// Build cron job command
	cronCommand := fmt.Sprintf("%s --config %s nightly", binaryPath, configPath)
	cronLine := fmt.Sprintf("%s %s", scheduleTime, cronCommand)

	if scheduleDryRun {
		logger.Info("Dry run mode - would add the following cron job:")
		fmt.Printf("Cron entry: %s\n", cronLine)
		fmt.Printf("Command: %s\n", cronCommand)
		return nil
	}

	// Check if job already exists
	existing, err := getCurrentCronJobs()
	if err != nil {
		logger.WithError(err).Warn("Could not check existing cron jobs")
	}

	// Remove existing prompt-alchemy nightly jobs
	var newCronJobs []string
	for _, job := range existing {
		if !strings.Contains(job, "prompt-alchemy") || !strings.Contains(job, "nightly") {
			newCronJobs = append(newCronJobs, job)
		}
	}

	// Add new job
	newCronJobs = append(newCronJobs, cronLine)

	// Install updated crontab
	if err := installCrontab(newCronJobs); err != nil {
		return fmt.Errorf("failed to install crontab: %w", err)
	}

	logger.Infof("Successfully installed cron job: %s", cronLine)
	logger.Info("The nightly training job will run automatically at the scheduled time")

	return nil
}

func installLaunchdJob() error {
	logger := log.GetLogger()

	// Get current binary path
	binaryPath, err := getBinaryPath()
	if err != nil {
		return fmt.Errorf("failed to get binary path: %w", err)
	}

	// Get config file path
	configPath := viper.ConfigFileUsed()
	if configPath == "" {
		configPath = getDefaultConfigPath()
	}

	// Parse cron time to launchd format
	minute, hour, err := parseCronTime(scheduleTime)
	if err != nil {
		return fmt.Errorf("failed to parse cron time: %w", err)
	}

	// Create launchd plist
	plistContent, err := generateLaunchdPlist(binaryPath, configPath, minute, hour)
	if err != nil {
		return fmt.Errorf("failed to generate plist: %w", err)
	}

	if scheduleDryRun {
		logger.Info("Dry run mode - would create the following launchd job:")
		fmt.Printf("Plist content:\n%s\n", plistContent)
		return nil
	}

	// Get plist file path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	plistDir := filepath.Join(homeDir, "Library", "LaunchAgents")
	plistPath := filepath.Join(plistDir, "com.prompt-alchemy.nightly.plist")

	// Create directory if it doesn't exist
	if err := os.MkdirAll(plistDir, 0755); err != nil {
		return fmt.Errorf("failed to create LaunchAgents directory: %w", err)
	}

	// Unload existing job if it exists
	if _, err := os.Stat(plistPath); err == nil {
		exec.Command("launchctl", "unload", plistPath).Run()
	}

	// Write plist file
	if err := os.WriteFile(plistPath, []byte(plistContent), 0644); err != nil {
		return fmt.Errorf("failed to write plist file: %w", err)
	}

	// Load the job
	if err := exec.Command("launchctl", "load", plistPath).Run(); err != nil {
		return fmt.Errorf("failed to load launchd job: %w", err)
	}

	logger.Infof("Successfully installed launchd job at: %s", plistPath)
	logger.Infof("Job will run daily at %02d:%02d", hour, minute)

	return nil
}

func listScheduledJobs() error {
	fmt.Println("Checking for scheduled prompt-alchemy nightly jobs...")
	fmt.Println()

	// Check cron jobs
	fmt.Println("=== Cron Jobs ===")
	cronJobs, err := getCurrentCronJobs()
	if err != nil {
		fmt.Printf("Error checking cron jobs: %v\n", err)
	} else {
		found := false
		for _, job := range cronJobs {
			if strings.Contains(job, "prompt-alchemy") && strings.Contains(job, "nightly") {
				fmt.Printf("Found: %s\n", job)
				found = true
			}
		}
		if !found {
			fmt.Println("No prompt-alchemy nightly cron jobs found")
		}
	}

	fmt.Println()

	// Check launchd jobs (macOS only)
	if runtime.GOOS == "darwin" {
		fmt.Println("=== Launchd Jobs (macOS) ===")
		homeDir, err := os.UserHomeDir()
		if err != nil {
			fmt.Printf("Error getting home directory: %v\n", err)
		} else {
			plistPath := filepath.Join(homeDir, "Library", "LaunchAgents", "com.prompt-alchemy.nightly.plist")
			if _, err := os.Stat(plistPath); err == nil {
				fmt.Printf("Found: %s\n", plistPath)

				// Check if loaded
				cmd := exec.Command("launchctl", "list", "com.prompt-alchemy.nightly")
				if err := cmd.Run(); err == nil {
					fmt.Println("Status: Loaded and active")
				} else {
					fmt.Println("Status: Installed but not loaded")
				}
			} else {
				fmt.Println("No prompt-alchemy nightly launchd jobs found")
			}
		}
	}

	return nil
}

func uninstallScheduledJob() error {
	logger := log.GetLogger()

	if scheduleDryRun {
		logger.Info("Dry run mode - would remove scheduled jobs")
		return listScheduledJobs()
	}

	removed := false

	// Remove from cron
	cronJobs, err := getCurrentCronJobs()
	if err != nil {
		logger.WithError(err).Warn("Could not check cron jobs")
	} else {
		var newCronJobs []string
		for _, job := range cronJobs {
			if strings.Contains(job, "prompt-alchemy") && strings.Contains(job, "nightly") {
				logger.Infof("Removing cron job: %s", job)
				removed = true
			} else {
				newCronJobs = append(newCronJobs, job)
			}
		}

		if len(newCronJobs) != len(cronJobs) {
			if err := installCrontab(newCronJobs); err != nil {
				logger.WithError(err).Error("Failed to update crontab")
			}
		}
	}

	// Remove from launchd (macOS only)
	if runtime.GOOS == "darwin" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			logger.WithError(err).Warn("Could not get home directory")
		} else {
			plistPath := filepath.Join(homeDir, "Library", "LaunchAgents", "com.prompt-alchemy.nightly.plist")
			if _, err := os.Stat(plistPath); err == nil {
				logger.Infof("Removing launchd job: %s", plistPath)

				// Unload and remove
				exec.Command("launchctl", "unload", plistPath).Run()
				if err := os.Remove(plistPath); err != nil {
					logger.WithError(err).Error("Failed to remove plist file")
				} else {
					removed = true
				}
			}
		}
	}

	if removed {
		logger.Info("Successfully removed scheduled job(s)")
	} else {
		logger.Info("No scheduled jobs found to remove")
	}

	return nil
}

// Helper functions

func getBinaryPath() (string, error) {
	// Try to get the current executable path
	execPath, err := os.Executable()
	if err != nil {
		return "", err
	}

	// Resolve symlinks
	realPath, err := filepath.EvalSymlinks(execPath)
	if err != nil {
		return execPath, nil // Use original if symlink resolution fails
	}

	return realPath, nil
}

func getDefaultConfigPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "config.yaml"
	}
	return filepath.Join(homeDir, ".prompt-alchemy", "config.yaml")
}

func getCurrentCronJobs() ([]string, error) {
	cmd := exec.Command("crontab", "-l")
	output, err := cmd.Output()
	if err != nil {
		// crontab -l returns error if no crontab exists
		if strings.Contains(err.Error(), "no crontab") {
			return []string{}, nil
		}
		return nil, err
	}

	lines := strings.Split(string(output), "\n")
	var jobs []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "#") {
			jobs = append(jobs, line)
		}
	}

	return jobs, nil
}

func installCrontab(jobs []string) error {
	// Create temporary crontab content
	content := strings.Join(jobs, "\n")
	if content != "" {
		content += "\n" // Ensure newline at end
	}

	// Use crontab - to read from stdin
	cmd := exec.Command("crontab", "-")
	cmd.Stdin = strings.NewReader(content)

	return cmd.Run()
}

func parseCronTime(cronExpr string) (minute, hour int, err error) {
	fields := strings.Fields(cronExpr)
	if len(fields) < 2 {
		return 0, 0, fmt.Errorf("invalid cron expression")
	}

	// Parse minute
	if fields[0] == "*" {
		minute = 0
	} else {
		if _, err := fmt.Sscanf(fields[0], "%d", &minute); err != nil {
			return 0, 0, fmt.Errorf("invalid minute: %s", fields[0])
		}
	}

	// Parse hour
	if fields[1] == "*" {
		hour = 0
	} else {
		if _, err := fmt.Sscanf(fields[1], "%d", &hour); err != nil {
			return 0, 0, fmt.Errorf("invalid hour: %s", fields[1])
		}
	}

	return minute, hour, nil
}

func generateLaunchdPlist(binaryPath, configPath string, minute, hour int) (string, error) {
	tmpl := `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.prompt-alchemy.nightly</string>
	<key>ProgramArguments</key>
	<array>
		<string>{{.BinaryPath}}</string>
		<string>--config</string>
		<string>{{.ConfigPath}}</string>
		<string>nightly</string>
	</array>
	<key>StartCalendarInterval</key>
	<dict>
		<key>Hour</key>
		<integer>{{.Hour}}</integer>
		<key>Minute</key>
		<integer>{{.Minute}}</integer>
	</dict>
	<key>RunAtLoad</key>
	<false/>
	<key>StandardOutPath</key>
	<string>/tmp/prompt-alchemy-nightly.log</string>
	<key>StandardErrorPath</key>
	<string>/tmp/prompt-alchemy-nightly.error.log</string>
</dict>
</plist>`

	t, err := template.New("plist").Parse(tmpl)
	if err != nil {
		return "", err
	}

	data := struct {
		BinaryPath string
		ConfigPath string
		Hour       int
		Minute     int
	}{
		BinaryPath: binaryPath,
		ConfigPath: configPath,
		Hour:       hour,
		Minute:     minute,
	}

	var buf strings.Builder
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}
