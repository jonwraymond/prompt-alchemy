---
layout: default
title: Automated Scheduling
---

# Automated Scheduling

Prompt Alchemy includes built-in support for scheduling nightly training jobs to continuously improve prompt rankings based on user interactions. This keeps the MCP server lightweight while running training jobs separately as scheduled tasks.

## Overview

The scheduling system:
- **Auto-detects** the best scheduling method for your system
- **Handles installation/uninstallation** automatically
- **Finds correct paths** for binary and configuration files
- **Provides logging** for troubleshooting
- **Supports both cron and launchd** scheduling methods

## Quick Start

```bash
# Install nightly job at 2 AM (auto-detects best method)
prompt-alchemy schedule --time "0 2 * * *"

# List current scheduled jobs
prompt-alchemy schedule --list

# Uninstall scheduled job
prompt-alchemy schedule --uninstall
```

## Scheduling Methods

### Auto Detection (Recommended)

The `--method auto` flag (default) automatically selects the best scheduling method:

- **macOS**: Prefers launchd, falls back to cron
- **Linux**: Uses cron

```bash
prompt-alchemy schedule --time "0 2 * * *"  # Uses auto-detection
```

### Cron (Linux/macOS)

Traditional Unix cron scheduler that works on both Linux and macOS:

```bash
# Install using cron specifically
prompt-alchemy schedule --time "0 2 * * *" --method cron

# Custom schedule times
prompt-alchemy schedule --time "30 3 * * *" --method cron  # 3:30 AM
prompt-alchemy schedule --time "0 1 * * 0" --method cron   # 1 AM on Sundays
```

**Cron Format**: `minute hour day month weekday`
- `0 2 * * *` = Daily at 2:00 AM
- `30 3 * * *` = Daily at 3:30 AM  
- `0 1 * * 0` = Weekly on Sunday at 1:00 AM
- `0 4 1 * *` = Monthly on 1st at 4:00 AM

### Launchd (macOS Only)

macOS native scheduling service, more reliable than cron on macOS:

```bash
# Install using launchd specifically
prompt-alchemy schedule --time "0 2 * * *" --method launchd
```

**Features:**
- Creates plist files in `~/Library/LaunchAgents/`
- Logs output to `/tmp/prompt-alchemy-nightly.log`
- Logs errors to `/tmp/prompt-alchemy-nightly.error.log`
- Automatically loads/unloads jobs
- Survives system reboots

## Command Reference

### Install Scheduled Job

```bash
prompt-alchemy schedule --time "CRON_EXPRESSION" [--method METHOD]
```

**Options:**
- `--time`: Cron format schedule (default: "0 2 * * *")
- `--method`: auto, cron, or launchd (default: auto)
- `--dry-run`: Preview what would be installed

**Examples:**
```bash
# Daily at 2 AM (default)
prompt-alchemy schedule

# Daily at 3:30 AM
prompt-alchemy schedule --time "30 3 * * *"

# Weekly on Sunday at 1 AM
prompt-alchemy schedule --time "0 1 * * 0"

# Force cron method
prompt-alchemy schedule --time "0 2 * * *" --method cron

# Preview installation
prompt-alchemy schedule --time "0 2 * * *" --dry-run
```

### List Scheduled Jobs

```bash
prompt-alchemy schedule --list
```

Shows all prompt-alchemy nightly jobs for both cron and launchd (if applicable).

### Uninstall Scheduled Job

```bash
prompt-alchemy schedule --uninstall [--dry-run]
```

Removes all prompt-alchemy nightly jobs from both cron and launchd.

## Troubleshooting

### Check Installation

```bash
# List current jobs
prompt-alchemy schedule --list

# Verify job exists in system
crontab -l | grep prompt-alchemy                    # For cron
launchctl list | grep com.prompt-alchemy.nightly   # For launchd (macOS)
```

### Check Logs

**Cron logs:**
```bash
# System logs (location varies by OS)
grep CRON /var/log/syslog                          # Ubuntu/Debian
grep cron /var/log/messages                        # CentOS/RHEL
log show --predicate 'process == "cron"' --last 1d # macOS
```

**Launchd logs:**
```bash
# Output logs
tail -f /tmp/prompt-alchemy-nightly.log

# Error logs  
tail -f /tmp/prompt-alchemy-nightly.error.log

# System logs
log show --predicate 'subsystem == "com.apple.launchd"' --last 1d
```

### Manual Testing

Test the nightly job manually to ensure it works:

```bash
# Run nightly job manually
prompt-alchemy nightly

# Run with verbose logging
prompt-alchemy --log-level debug nightly

# Test with dry run
prompt-alchemy nightly --dry-run
```

### Common Issues

**Permission Errors:**
```bash
# Ensure binary is executable
chmod +x /path/to/prompt-alchemy

# Check config file permissions
ls -la ~/.prompt-alchemy/config.yaml
```

**Path Issues:**
```bash
# Use absolute paths in dry-run to verify
prompt-alchemy schedule --time "0 2 * * *" --dry-run

# Check if binary exists
which prompt-alchemy
```

**Cron Not Running:**
```bash
# Start cron service (if needed)
sudo systemctl start cron     # Linux
sudo launchctl load -w /System/Library/LaunchDaemons/com.vix.cron.plist # macOS
```

## Best Practices

### Timing Recommendations

- **Low-traffic hours**: Schedule during low system usage (2-4 AM)
- **Consistent timing**: Use the same time daily for predictable behavior
- **Avoid peak hours**: Don't schedule during backup or maintenance windows

### Configuration Management

- **Stable paths**: Use absolute paths for binary and config files
- **Config backup**: Backup configuration before scheduling
- **Version control**: Keep config files in version control

### Monitoring

- **Log rotation**: Monitor log file sizes, especially for launchd
- **Regular checks**: Periodically verify jobs are running
- **Alert setup**: Set up alerts for failed nightly jobs

## Integration Examples

### CI/CD Pipeline

```bash
# In deployment script
./prompt-alchemy schedule --uninstall --dry-run  # Remove old job
./prompt-alchemy schedule --time "0 2 * * *"     # Install new job
```

### Docker/Container Setup

```bash
# For containerized deployments, consider external scheduling
# Use host cron to run container command:
# 0 2 * * * docker exec prompt-alchemy-container prompt-alchemy nightly
```

### Multiple Environments

```bash
# Development (more frequent)
prompt-alchemy schedule --time "0 */6 * * *"  # Every 6 hours

# Staging (daily)  
prompt-alchemy schedule --time "0 1 * * *"    # 1 AM daily

# Production (daily with backup time)
prompt-alchemy schedule --time "0 2 * * *"    # 2 AM daily
```

## Advanced Configuration

### Custom Logging

For launchd, customize log paths by modifying the generated plist:

```xml
<key>StandardOutPath</key>
<string>/var/log/prompt-alchemy-nightly.log</string>
<key>StandardErrorPath</key>
<string>/var/log/prompt-alchemy-nightly.error.log</string>
```

### Environment Variables

Ensure scheduled jobs have access to required environment variables:

```bash
# For cron, add to crontab:
PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY=sk-...
0 2 * * * /path/to/prompt-alchemy nightly

# For launchd, add to plist:
<key>EnvironmentVariables</key>
<dict>
    <key>PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY</key>
    <string>sk-...</string>
</dict>
```

### Resource Limits

For production systems, consider resource limits:

```bash
# Cron with timeout
0 2 * * * timeout 3600 /path/to/prompt-alchemy nightly

# Launchd with resource limits (add to plist)
<key>SoftResourceLimits</key>
<dict>
    <key>NumberOfFiles</key>
    <integer>1024</integer>
</dict>
``` 