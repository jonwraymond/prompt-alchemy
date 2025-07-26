package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"
)

// HealthStatus represents the API health check response
type HealthStatus struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Details   map[string]interface{} `json:"details"`
}

// AlertConfig holds monitoring configuration
type AlertConfig struct {
	APIEndpoint     string
	CheckInterval   time.Duration
	AlertThreshold  int
	SlackWebhook    string
	EmailRecipients []string
}

// Monitor handles health check monitoring
type Monitor struct {
	config       AlertConfig
	failureCount int
	lastAlert    time.Time
}

// NewMonitor creates a new monitoring instance
func NewMonitor(config AlertConfig) *Monitor {
	return &Monitor{
		config:    config,
		lastAlert: time.Now().Add(-time.Hour), // Allow immediate alerts
	}
}

// CheckHealth performs a health check on the API
func (m *Monitor) CheckHealth() error {
	resp, err := http.Get(m.config.APIEndpoint + "/health")
	if err != nil {
		return fmt.Errorf("failed to connect to API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unhealthy status code: %d", resp.StatusCode)
	}

	var status HealthStatus
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		return fmt.Errorf("failed to decode health response: %w", err)
	}

	if status.Status != "healthy" && status.Status != "ok" {
		return fmt.Errorf("unhealthy status: %s", status.Status)
	}

	return nil
}

// CheckProviders verifies provider availability
func (m *Monitor) CheckProviders() ([]string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	
	req, err := http.NewRequest("POST", m.config.APIEndpoint+"/api/v1/providers", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to check providers: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Providers []struct {
			Name string `json:"name"`
		} `json:"providers"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode provider response: %w", err)
	}

	var available []string
	for _, p := range result.Providers {
		available = append(available, p.Name)
	}

	return available, nil
}

// SendAlert sends notifications about system issues
func (m *Monitor) SendAlert(message string, critical bool) {
	// Rate limit alerts to every 15 minutes
	if time.Since(m.lastAlert) < 15*time.Minute && !critical {
		return
	}

	log.Printf("ALERT: %s", message)
	m.lastAlert = time.Now()

	// Desktop notification (macOS/Linux)
	m.sendDesktopNotification(message, critical)

	// Slack webhook if configured
	if m.config.SlackWebhook != "" {
		m.sendSlackAlert(message, critical)
	}

	// Log to file
	m.logAlert(message, critical)
}

func (m *Monitor) sendDesktopNotification(message string, critical bool) {
	title := "Prompt Alchemy Alert"
	if critical {
		title = "🚨 " + title
	}

	// macOS notification
	if _, err := exec.LookPath("osascript"); err == nil {
		script := fmt.Sprintf(`display notification "%s" with title "%s"`, message, title)
		exec.Command("osascript", "-e", script).Run()
		return
	}

	// Linux notification
	if _, err := exec.LookPath("notify-send"); err == nil {
		urgency := "normal"
		if critical {
			urgency = "critical"
		}
		exec.Command("notify-send", "-u", urgency, title, message).Run()
	}
}

func (m *Monitor) sendSlackAlert(message string, critical bool) {
	emoji := ":warning:"
	if critical {
		emoji = ":rotating_light:"
	}

	payload := map[string]interface{}{
		"text": fmt.Sprintf("%s *Prompt Alchemy Alert*\n%s", emoji, message),
	}

	jsonData, _ := json.Marshal(payload)
	http.Post(m.config.SlackWebhook, "application/json", nil)
}

func (m *Monitor) logAlert(message string, critical bool) {
	logFile := "/tmp/prompt-alchemy-alerts.log"
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	level := "WARNING"
	if critical {
		level = "CRITICAL"
	}

	timestamp := time.Now().Format(time.RFC3339)
	f.WriteString(fmt.Sprintf("[%s] %s: %s\n", timestamp, level, message))
}

// Run starts the monitoring loop
func (m *Monitor) Run() {
	log.Printf("Starting Prompt Alchemy health monitoring...")
	log.Printf("Checking %s every %v", m.config.APIEndpoint, m.config.CheckInterval)

	ticker := time.NewTicker(m.config.CheckInterval)
	defer ticker.Stop()

	// Initial check
	m.performCheck()

	for range ticker.C {
		m.performCheck()
	}
}

func (m *Monitor) performCheck() {
	// Check API health
	if err := m.CheckHealth(); err != nil {
		m.failureCount++
		if m.failureCount >= m.config.AlertThreshold {
			m.SendAlert(fmt.Sprintf("API health check failed: %v (failures: %d)", err, m.failureCount), true)
		}
	} else {
		if m.failureCount >= m.config.AlertThreshold {
			m.SendAlert("API health restored", false)
		}
		m.failureCount = 0
	}

	// Check providers
	providers, err := m.CheckProviders()
	if err != nil {
		log.Printf("Provider check failed: %v", err)
	} else if len(providers) == 0 {
		m.SendAlert("No providers configured - API functionality limited", false)
	}

	// Check Docker containers
	m.checkDockerContainers()
}

func (m *Monitor) checkDockerContainers() {
	cmd := exec.Command("docker-compose", "ps", "--services", "--filter", "status=running")
	output, err := cmd.Output()
	if err != nil {
		return
	}

	runningServices := string(output)
	if !contains(runningServices, "prompt-alchemy-api") {
		m.SendAlert("Docker container 'prompt-alchemy-api' is not running", true)
	}
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || len(s) > len(substr) && contains(s[1:len(s)-1], substr)))
}

func main() {
	config := AlertConfig{
		APIEndpoint:    getEnv("PROMPT_ALCHEMY_MONITOR_ENDPOINT", "http://localhost:5747"),
		CheckInterval:  getDurationEnv("PROMPT_ALCHEMY_CHECK_INTERVAL", 30*time.Second),
		AlertThreshold: getIntEnv("PROMPT_ALCHEMY_ALERT_THRESHOLD", 3),
		SlackWebhook:   os.Getenv("PROMPT_ALCHEMY_SLACK_WEBHOOK"),
	}

	monitor := NewMonitor(config)
	monitor.Run()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var i int
		if _, err := fmt.Sscanf(value, "%d", &i); err == nil {
			return i
		}
	}
	return defaultValue
}