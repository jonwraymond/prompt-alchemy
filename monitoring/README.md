# Prompt Alchemy Monitoring System

## Overview

This directory contains comprehensive monitoring tools for the Prompt Alchemy system, all implemented in Go with supporting shell scripts for setup.

## Components

### 1. **health-alerts.go** (Go Implementation)
A production-ready health monitoring service written in Go that:
- Performs regular health checks on the API
- Monitors provider availability
- Checks Docker container status
- Sends desktop notifications (macOS/Linux)
- Supports Slack webhook integration
- Logs all alerts to file
- Implements intelligent rate limiting

### 2. **monitor.sh** (Quick Status Script)
A bash script for manual status checks that displays:
- API health status
- Docker container status
- Provider configuration
- Database statistics
- Git repository status

### 3. **setup-monitoring.sh** (Installation Script)
Automated setup that:
- Builds the Go monitoring binary
- Installs systemd service (Linux)
- Creates launchd agent (macOS)
- Sets up cron job as fallback

## Installation

```bash
# Run the setup script
cd monitoring
./setup-monitoring.sh
```

## Usage

### Manual Status Check
```bash
./monitor.sh
```

### Run Health Monitor
```bash
# Direct execution
./health-alerts

# With custom settings
PROMPT_ALCHEMY_CHECK_INTERVAL=10s ./health-alerts
```

### System Service

#### Linux (systemd)
```bash
sudo systemctl start prompt-alchemy-monitor
sudo systemctl status prompt-alchemy-monitor
sudo systemctl enable prompt-alchemy-monitor  # Auto-start on boot
```

#### macOS (launchd)
```bash
launchctl load ~/Library/LaunchAgents/com.promptalchemy.monitor.plist
launchctl list | grep promptalchemy
```

## Configuration

Set these environment variables to customize monitoring:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMPT_ALCHEMY_MONITOR_ENDPOINT` | `http://localhost:5747` | API endpoint to monitor |
| `PROMPT_ALCHEMY_CHECK_INTERVAL` | `30s` | How often to check health |
| `PROMPT_ALCHEMY_ALERT_THRESHOLD` | `3` | Failures before alerting |
| `PROMPT_ALCHEMY_SLACK_WEBHOOK` | (empty) | Slack webhook URL for alerts |

## Alert Types

### Desktop Notifications
- **macOS**: Uses native notification center
- **Linux**: Uses notify-send (requires libnotify)

### Slack Integration
Set `PROMPT_ALCHEMY_SLACK_WEBHOOK` to enable:
```bash
export PROMPT_ALCHEMY_SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Log Files
- Alert log: `/tmp/prompt-alchemy-alerts.log`
- Service logs: `/tmp/prompt-alchemy-monitor.log`
- Cron logs: `/tmp/prompt-alchemy-cron.log`

## Alert Conditions

The monitor will alert when:
1. **API Unreachable**: Cannot connect to health endpoint
2. **Unhealthy Status**: API reports non-healthy status
3. **No Providers**: No LLM providers configured
4. **Container Down**: Docker container not running
5. **Threshold Exceeded**: Failures exceed configured threshold

## Development

### Building from Source
```bash
go build -o health-alerts health-alerts.go
```

### Running Tests
```bash
go test -v
```

### Adding New Checks
1. Add check method to `Monitor` struct
2. Call from `performCheck()` method
3. Use `SendAlert()` for notifications

## Troubleshooting

### No Notifications
- Check if notification service is available:
  - macOS: `which osascript`
  - Linux: `which notify-send`
- Verify environment variables are set
- Check log files for errors

### Service Won't Start
- Ensure binary has execute permissions
- Check service logs:
  - systemd: `journalctl -u prompt-alchemy-monitor`
  - launchd: `tail -f /tmp/prompt-alchemy-monitor.log`

### False Positives
- Increase `PROMPT_ALCHEMY_ALERT_THRESHOLD`
- Adjust `PROMPT_ALCHEMY_CHECK_INTERVAL`
- Ensure API is fully started before monitoring

## Integration with CI/CD

Add to your deployment pipeline:
```yaml
- name: Health Check
  run: |
    timeout 30 bash -c 'until curl -f http://localhost:5747/health; do sleep 1; done'
```

## Metrics Export

The monitoring data can be exported to:
- Prometheus (via `/metrics` endpoint)
- CloudWatch (AWS)
- Datadog (via agent)
- Custom webhooks

## Security Considerations

- Store Slack webhooks in environment variables, not code
- Use secure communication (HTTPS) for remote endpoints
- Implement authentication for monitoring endpoints
- Rotate webhook URLs periodically

## Future Enhancements

- [ ] Email notifications
- [ ] PagerDuty integration
- [ ] Custom alert rules
- [ ] Historical metrics storage
- [ ] Web dashboard