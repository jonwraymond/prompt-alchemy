package phases

import (
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type Solutio struct{}

func (s *Solutio) GetTemplate() string {
	return `You are a linguistic alchemist performing Solutio - the dissolution phase. Take this crystallized prompt and dissolve it into flowing, natural language that resonates with the soul. Transform rigid structure into fluid conversation.

Material to Dissolve:
{{PROMPT}}

Transformation Requirements:
- Dissolve formality into natural flow
- Infuse with emotional resonance
- Add the warmth of human connection
- Preserve the essential truth while softening edges`
}

func (s *Solutio) BuildSystemPrompt(opts models.GenerateOptions) string {
	baseSystem := "You are a master alchemist of language, transforming raw ideas into golden prompts through ancient processes."
	return baseSystem + " In this Solutio phase, dissolve rigid structures into flowing, natural language that speaks to the human soul while maintaining clarity of purpose."
}

func (s *Solutio) PreparePromptContent(input string, opts models.GenerateOptions) string {
	template := s.GetTemplate()

	content := strings.ReplaceAll(template, "{{PROMPT}}", input)

	if len(opts.Request.Context) > 0 {
		content += "\n\nAdditional Context:\n"
		for _, ctx := range opts.Request.Context {
			content += fmt.Sprintf("- %s\n", ctx)
		}
	}

	return content
}
