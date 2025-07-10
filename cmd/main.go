package main

import (
	"github.com/jonwraymond/prompt-alchemy/internal/cmd"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
)

func main() {
	logger := log.GetLogger()
	if err := cmd.Execute(); err != nil {
		logger.Fatalf("Failed to execute command: %v", err)
	}
}
