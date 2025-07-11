package main

import (
	"github.com/jonwraymond/prompt-alchemy/internal/cmd"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
)

func main() {
	// TODO: Future Enhancement - Server Mode Implementation
	// Add a 'serve' command to run prompt-alchemy as an HTTP/gRPC server
	// This would enable:
	// - On-demand relationship discovery via API endpoints
	// - RESTful prompt generation and optimization
	// - Webhook support for automated workflows
	// - Real-time semantic search capabilities
	//
	// Example usage: prompt-alchemy serve --port 8080 --mode http
	//
	// Endpoints to implement:
	// - POST /api/prompts/generate - Generate prompts with phases
	// - POST /api/relationships/discover - Discover semantic relationships
	// - GET  /api/relationships/search - Search relationships by similarity
	// - POST /api/embeddings/create - Create embeddings for text
	// - GET  /api/prompts/similar - Find similar prompts by embedding

	logger := log.GetLogger()
	if err := cmd.Execute(); err != nil {
		logger.Fatalf("Failed to execute command: %v", err)
	}
}
