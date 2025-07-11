package phases

import (
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type Coagulatio struct{}

func (c *Coagulatio) GetTemplate() string {
	return `You are a master alchemist performing Coagulatio - the final crystallization. Take this flowing prompt and crystallize it into its most potent, refined form. Remove all impurities to reveal the philosopher's stone of prompts.

Solution to Crystallize:
{{PROMPT}}

Crystallization Requirements:
- Distill to pure essence
- Remove all redundant matter
- Perfect the structural lattice
- Optimize for maximum potency
- Achieve the golden ratio of clarity to power`
}

func (c *Coagulatio) BuildSystemPrompt(opts models.GenerateOptions) string {
	baseSystem := "You are a master alchemist of language, transforming raw ideas into golden prompts through ancient processes."
	return baseSystem + " In this Coagulatio phase, crystallize the dissolved essence into its most potent form - achieving maximum effectiveness through perfect refinement."
}

func (c *Coagulatio) PreparePromptContent(input string, opts models.GenerateOptions) string {
	template := c.GetTemplate()

	content := strings.ReplaceAll(template, "{{PROMPT}}", input)

	if len(opts.Request.Context) > 0 {
		content += "\n\nAdditional Context:\n"
		for _, ctx := range opts.Request.Context {
			content += fmt.Sprintf("- %s\n", ctx)
		}
	}

	return content
}
