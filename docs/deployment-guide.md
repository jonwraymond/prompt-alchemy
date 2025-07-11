---
layout: default
title: Deployment Guide
---

# Deployment Guide

This guide covers deployment strategies for both On-Demand and Server modes of PromGen.

## On-Demand Mode Deployment

### Local Installation

#### macOS (Homebrew)
```bash
# Coming soon
brew tap jonwraymond/prompt-alchemy
brew install prompt-alchemy
```

#### Linux (Package Managers)
```bash
# Debian/Ubuntu
wget https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy_linux_amd64.deb
sudo dpkg -i prompt-alchemy_linux_amd64.deb

# RedHat/Fedora
wget https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy_linux_amd64.rpm
sudo rpm -i prompt-alchemy_linux_amd64.rpm

# Arch Linux (AUR)
yay -S prompt-alchemy
```

#### Manual Installation
```bash
# Download binary
curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-$(uname -s)-$(uname -m) -o prompt-alchemy
chmod +x prompt-alchemy
sudo mv prompt-alchemy /usr/local/bin/

# Verify installation
prompt-alchemy version
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: Prompt Generation
on: [push, pull_request]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PromGen
        uses: jonwraymond/setup-prompt-alchemy@v1
        with:
          version: latest
          
      - name: Configure
        run: |
          prompt-alchemy config set providers.openai.api_key "${{ secrets.OPENAI_API_KEY }}"
          
      - name: Generate Prompts
        run: |
          prompt-alchemy batch process .github/prompts/batch.yaml
```

#### GitLab CI
```yaml
generate-prompts:
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
    - curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-linux-amd64 -o /usr/local/bin/prompt-alchemy
    - chmod +x /usr/local/bin/prompt-alchemy
  script:
    - prompt-alchemy generate "Create deployment script"
  artifacts:
    paths:
      - generated/
```

#### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    environment {
        OPENAI_API_KEY = credentials('openai-api-key')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh '''
                    curl -L https://github.com/jonwraymond/prompt-alchemy/releases/latest/download/prompt-alchemy-linux-amd64 -o prompt-alchemy
                    chmod +x prompt-alchemy
                '''
            }
        }
        
        stage('Generate') {
            steps {
                sh './prompt-alchemy generate "Create test cases for ${JOB_NAME}"'
            }
        }
    }
}
```

### Container Deployment

#### Docker (On-Demand)
```dockerfile
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/prompt-alchemy /usr/local/bin/
COPY config.yaml /etc/prompt-alchemy/

ENV PROMPT_ALCHEMY_CONFIG=/etc/prompt-alchemy/config.yaml

ENTRYPOINT ["prompt-alchemy"]
```

#### Usage in Docker
```bash
# Build image
docker build -t prompt-alchemy:cli .

# Run command
docker run --rm \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/output:/output \
  prompt-alchemy:cli generate "Create README"
```

## Server Mode Deployment

### Development Deployment

#### Local Development
```bash
# Start with hot reload
prompt-alchemy serve --dev --port 8080

# With specific config
prompt-alchemy serve --config dev.yaml --learning-enabled

# With environment variables
PROMPT_ALCHEMY_PORT=8080 \
PROMPT_ALCHEMY_LEARNING_ENABLED=true \
prompt-alchemy serve
```

### Production Deployment

#### Systemd Service
```ini
# /etc/systemd/system/prompt-alchemy.service
[Unit]
Description=Prompt Alchemy Server
Documentation=https://github.com/jonwraymond/prompt-alchemy
After=network.target

[Service]
Type=simple
User=promptalchemy
Group=promptalchemy
WorkingDirectory=/var/lib/prompt-alchemy

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/prompt-alchemy

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryLimit=1G
CPUQuota=200%

# Environment
Environment="PROMPT_ALCHEMY_CONFIG=/etc/prompt-alchemy/config.yaml"
EnvironmentFile=-/etc/prompt-alchemy/env

# Start command
ExecStart=/usr/local/bin/prompt-alchemy serve
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=prompt-alchemy

[Install]
WantedBy=multi-user.target
```

#### Docker Compose
```yaml
version: '3.8'

services:
  prompt-alchemy:
    image: ghcr.io/jonwraymond/prompt-alchemy:latest
    container_name: prompt-alchemy-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PROMPT_ALCHEMY_MODE=server
      - PROMPT_ALCHEMY_LEARNING_ENABLED=true
      - PROMPT_ALCHEMY_LOG_LEVEL=info
    env_file:
      - .env  # Contains API keys
    volumes:
      - ./data:/data
      - ./config:/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M

  # Optional: Reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - prompt-alchemy
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prompt-alchemy
  namespace: ai-tools
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prompt-alchemy
  template:
    metadata:
      labels:
        app: prompt-alchemy
    spec:
      containers:
      - name: prompt-alchemy
        image: ghcr.io/jonwraymond/prompt-alchemy:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: PROMPT_ALCHEMY_MODE
          value: "server"
        - name: PROMPT_ALCHEMY_LEARNING_ENABLED
          value: "true"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: prompt-alchemy-secrets
              key: openai-api-key
        volumeMounts:
        - name: data
          mountPath: /data
        - name: config
          mountPath: /config
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: prompt-alchemy-data
      - name: config
        configMap:
          name: prompt-alchemy-config

---
apiVersion: v1
kind: Service
metadata:
  name: prompt-alchemy
  namespace: ai-tools
spec:
  selector:
    app: prompt-alchemy
  ports:
  - port: 80
    targetPort: 8080
    name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prompt-alchemy
  namespace: ai-tools
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - prompt-alchemy.example.com
    secretName: prompt-alchemy-tls
  rules:
  - host: prompt-alchemy.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prompt-alchemy
            port:
              number: 80
```

### Cloud Deployments

#### AWS ECS
```json
{
  "family": "prompt-alchemy",
  "taskRoleArn": "arn:aws:iam::123456789012:role/prompt-alchemy-task",
  "executionRoleArn": "arn:aws:iam::123456789012:role/prompt-alchemy-execution",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "prompt-alchemy",
      "image": "ghcr.io/jonwraymond/prompt-alchemy:latest",
      "cpu": 1024,
      "memory": 2048,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PROMPT_ALCHEMY_MODE",
          "value": "server"
        },
        {
          "name": "PROMPT_ALCHEMY_LEARNING_ENABLED",
          "value": "true"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prompt-alchemy/openai-key"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "data",
          "containerPath": "/data"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/prompt-alchemy",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-12345678",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

#### Google Cloud Run
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: prompt-alchemy
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/prompt-alchemy:latest
        ports:
        - containerPort: 8080
        env:
        - name: PROMPT_ALCHEMY_MODE
          value: "server"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-key
              key: latest
        resources:
          limits:
            cpu: "2"
            memory: "1Gi"
```

#### Azure Container Instances
```bash
az container create \
  --resource-group prompt-alchemy-rg \
  --name prompt-alchemy \
  --image ghcr.io/jonwraymond/prompt-alchemy:latest \
  --cpu 2 \
  --memory 1 \
  --ports 8080 \
  --environment-variables \
    PROMPT_ALCHEMY_MODE=server \
    PROMPT_ALCHEMY_LEARNING_ENABLED=true \
  --secure-environment-variables \
    OPENAI_API_KEY=$OPENAI_API_KEY \
  --ip-address Public \
  --dns-name-label prompt-alchemy
```

### High Availability Setup

#### Load Balancer Configuration (HAProxy)
```
global
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httplog

frontend prompt_alchemy_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/prompt-alchemy.pem
    redirect scheme https if !{ ssl_fc }
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 20 }
    
    default_backend prompt_alchemy_backend

backend prompt_alchemy_backend
    balance roundrobin
    option httpchk GET /health
    
    server prompt-alchemy-1 10.0.1.10:8080 check
    server prompt-alchemy-2 10.0.1.11:8080 check
    server prompt-alchemy-3 10.0.1.12:8080 check
```

### Monitoring and Observability

#### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'prompt-alchemy'
    static_configs:
      - targets: ['prompt-alchemy:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Prompt Alchemy Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(prompt_alchemy_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(prompt_alchemy_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Learning Effectiveness",
        "targets": [
          {
            "expr": "prompt_alchemy_learning_effectiveness"
          }
        ]
      }
    ]
  }
}
```

### Security Hardening

#### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: prompt-alchemy-network-policy
spec:
  podSelector:
    matchLabels:
      app: prompt-alchemy
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS for API calls
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

#### API Authentication
```yaml
# config.yaml
server:
  auth:
    enabled: true
    type: jwt
    secret: ${JWT_SECRET}
    issuer: "prompt-alchemy"
    audience: "prompt-alchemy-api"
  
  rate_limiting:
    enabled: true
    requests_per_minute: 60
    burst: 100
  
  cors:
    enabled: true
    allowed_origins:
      - https://app.example.com
    allowed_methods:
      - GET
      - POST
    allowed_headers:
      - Authorization
      - Content-Type
```

### Backup and Recovery

#### Automated Backups
```bash
#!/bin/bash
# backup.sh - Run via cron

BACKUP_DIR="/backups/prompt-alchemy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
sqlite3 /data/prompts.db ".backup ${BACKUP_DIR}/prompts_${TIMESTAMP}.db"

# Backup learned patterns
curl -X GET http://localhost:8080/api/export \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  > "${BACKUP_DIR}/patterns_${TIMESTAMP}.json"

# Compress and encrypt
tar czf - ${BACKUP_DIR}/*_${TIMESTAMP}.* | \
  openssl enc -aes-256-cbc -salt -k "${BACKUP_PASSWORD}" \
  > "${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz.enc"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz.enc" \
  s3://prompt-alchemy-backups/

# Cleanup old backups
find ${BACKUP_DIR} -name "*.db" -mtime +7 -delete
find ${BACKUP_DIR} -name "*.json" -mtime +7 -delete
```

### Troubleshooting

#### Common Deployment Issues

| Issue | Solution |
|-------|----------|
| **Port conflicts** | Check with `netstat -tlnp \| grep 8080` |
| **Memory issues** | Increase container/pod memory limits |
| **Slow startup** | Pre-warm containers, use readiness probes |
| **Connection refused** | Check firewall rules and security groups |
| **SSL errors** | Verify certificate chain and expiration |

#### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:8080/health

# Detailed health with dependencies
curl http://localhost:8080/health/detailed

# Readiness check
curl http://localhost:8080/ready

# Liveness check
curl http://localhost:8080/alive
```

---

*Next: [Monitoring Guide](./monitoring) | [Security Best Practices](./security)*