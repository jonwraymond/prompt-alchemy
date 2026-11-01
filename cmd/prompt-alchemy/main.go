package main

import (
	"github.com/jonwraymond/prompt-alchemy/cmd"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
)

// main is the command-line entrypoint for the prompt-alchemy binary.
//
// The command implementations live in the parent `cmd` package (root.go and
// friends), which exports Execute(). The workflow and release build steps
// compile this package directory, so the binary name they produce
// (`prompt-alchemy`) matches the Makefile's MAIN_PATH.
func main() {
	logger := log.GetLogger()
	if err := cmd.Execute(); err != nil {
		logger.Fatalf("Failed to execute command: %v", err)
	}
}
