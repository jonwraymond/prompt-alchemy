# Docker Hybrid Deployment

Deploy Prompt Alchemy using Docker for hybrid on-demand/server mode.

## Prerequisites
- Docker & Compose installed

## Setup
cp docker.env.example .env
# Edit .env with keys
docker-compose up -d

## Access
curl http://localhost:8080/health

docker exec -it prompt-alchemy prompt-alchemy generate 'test' 

## Multi-Arch Builds
docker buildx build --platform linux/amd64,linux/arm64 -t prompt-alchemy:latest .