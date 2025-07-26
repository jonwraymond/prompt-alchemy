# Development Setup Guide

## Quick Start (Recommended for Instant Feedback)

### Option 1: Native Development (Fastest)
```bash
# 1. Start backend API
make build
./prompt-alchemy serve --api --host 0.0.0.0 --port 8080

# 2. In another terminal, start frontend with hot reload
npm install
npm run dev
```
**Instant feedback**: ✅ Hot reload for React components, CSS, and HTML

### Option 2: Docker Backend + Native Frontend
```bash
# 1. Start backend in Docker
docker-compose up prompt-alchemy-api

# 2. Start frontend locally
npm run dev
```
**Instant feedback**: ✅ Hot reload frontend, stable containerized backend

### Option 3: Full Docker Development
```bash
# Start both backend and frontend in Docker
docker-compose --profile frontend up
```
**Instant feedback**: ⚠️ Slower due to Docker volume mounting

## Environment Setup

1. **Copy environment file:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

2. **Required API Keys:**
- `PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY` - Required for generation
- `PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY` - Optional but recommended

## Development URLs

- **Frontend (Vite)**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/health

## API Proxy Configuration

The Vite dev server is configured to proxy `/api/*` requests to the backend:
- Frontend calls: `fetch('/api/prompts')` 
- Automatically proxied to: `http://localhost:8080/api/prompts`

## Hot Reload Features

### Frontend (src/)
- ✅ React components (.tsx, .jsx)
- ✅ CSS files (.css)
- ✅ TypeScript changes
- ✅ HTML template changes

### Backend
- ⚠️ Requires rebuild: `make build && ./prompt-alchemy serve --api`
- 💡 Use air for auto-reload: `go install github.com/cosmtrek/air@latest && air`

## 21st.dev IDE Extension Integration

To use with 21st.dev IDE extension:

1. **Ensure dev server is running**: `npm run dev`
2. **Access at**: http://localhost:5173
3. **API endpoint**: http://localhost:8080
4. **Components available**: 
   - `AIInputComponent` - Main input component
   - `MagicalHeader` - Header with alchemy theme
   - `AlchemicalBackground` - 3D hex grid background

## Recommended Development Workflow

1. **Start backend**: `./prompt-alchemy serve --api`
2. **Start frontend**: `npm run dev` 
3. **Open browser**: http://localhost:5173
4. **Make changes**: Edit files in `src/` directory
5. **See instant feedback**: Changes appear immediately in browser

## Troubleshooting

### Frontend not connecting to backend
- Check backend is running on port 8080
- Verify API proxy in vite.config.ts
- Check browser console for CORS errors

### Hot reload not working
- Ensure you're editing files in `src/` not `web/`
- Check Vite dev server is running on port 5173
- Verify file watchers aren't hitting OS limits