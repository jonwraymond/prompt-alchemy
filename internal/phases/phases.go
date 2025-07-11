package phases

import (
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type PhaseHandler interface {
	GetTemplate() string
	BuildSystemPrompt(opts models.GenerateOptions) string
	PreparePromptContent(input string, opts models.GenerateOptions) string
}
