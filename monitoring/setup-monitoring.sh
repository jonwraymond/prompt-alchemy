#!/bin/bash

# Setup script for Prompt Alchemy monitoring

echo "Setting up Prompt Alchemy monitoring..."

# Build the monitoring binary
echo "Building health monitoring service..."
cd monitoring
go build -o health-alerts health-alerts.go
chmod +x health-alerts

# Create monitoring directory
sudo mkdir -p /opt/prompt-alchemy/monitoring
sudo cp health-alerts /opt/prompt-alchemy/monitoring/

# Install systemd service (Linux)
if command -v systemctl &> /dev/null; then
    echo "Installing systemd service..."
    sudo cp alerts.service /etc/systemd/system/prompt-alchemy-monitor.service
    sudo systemctl daemon-reload
    sudo systemctl enable prompt-alchemy-monitor.service
    echo "Service installed. Start with: sudo systemctl start prompt-alchemy-monitor"
fi

# Create launchd plist (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating macOS launch agent..."
    cat > ~/Library/LaunchAgents/com.promptalchemy.monitor.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.promptalchemy.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PWD/health-alerts</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PROMPT_ALCHEMY_MONITOR_ENDPOINT</key>
        <string>http://localhost:5747</string>
        <key>PROMPT_ALCHEMY_CHECK_INTERVAL</key>
        <string>30s</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/prompt-alchemy-monitor.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/prompt-alchemy-monitor.log</string>
</dict>
</plist>
EOF
    echo "Launch agent created. Load with: launchctl load ~/Library/LaunchAgents/com.promptalchemy.monitor.plist"
fi

# Create cron job as fallback
echo "Creating cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * $PWD/monitor.sh >> /tmp/prompt-alchemy-cron.log 2>&1") | crontab -

echo ""
echo "Monitoring setup complete!"
echo ""
echo "Available monitoring tools:"
echo "1. Health check service: ./health-alerts"
echo "2. Manual status check: ./monitor.sh"
echo "3. Logs: /tmp/prompt-alchemy-alerts.log"
echo ""
echo "Configure alerts by setting environment variables:"
echo "  PROMPT_ALCHEMY_SLACK_WEBHOOK=<your-webhook-url>"
echo "  PROMPT_ALCHEMY_CHECK_INTERVAL=30s"
echo "  PROMPT_ALCHEMY_ALERT_THRESHOLD=3"