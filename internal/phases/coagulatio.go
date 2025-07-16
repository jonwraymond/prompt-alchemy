package phases

import (
	"fmt"

	"github.com/jonwraymond/prompt-alchemy/internal/templates"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type Coagulatio struct{}

func (c *Coagulatio) GetTemplate() string {
	return "coagulatio" // Return template name for new system
}

func (c *Coagulatio) BuildSystemPrompt(opts models.GenerateOptions) string {
	tmpl, err := templates.LoadPhaseSystemPrompt("coagulatio")
	if err != nil {
		// Fallback to embedded system prompt
		return "You excel at refining and perfecting content to achieve maximum clarity, effectiveness, and impact. Your focus is on crystallizing ideas into their most potent form through careful optimization and refinement."
	}

	systemPrompt, err := templates.ExecuteTemplate(tmpl, nil)
	if err != nil {
		// Fallback to embedded system prompt
		return "You excel at refining and perfecting content to achieve maximum clarity, effectiveness, and impact. Your focus is on crystallizing ideas into their most potent form through careful optimization and refinement."
	}
	return systemPrompt
}

func (c *Coagulatio) PreparePromptContent(input string, opts models.GenerateOptions) string {
	templateName := c.GetTemplate()

	// Create template context
	context := &templates.PhaseContext{
		Prompt:       input,
		Context:      opts.Request.Context,
		Requirements: []string{}, // Could be extracted from opts if needed
		Phase:        "coagulatio",
	}

	// Add persona and target model if available
	if opts.Persona != "" {
		context.Persona = opts.Persona
	}
	if opts.TargetModel != "" {
		context.TargetModel = opts.TargetModel
	}

	content, err := templates.ExecutePhaseTemplate(templateName, context)
	if err != nil {
		// Fallback to simple content if template execution fails
		return fmt.Sprintf("Take the following prompt and refine it to its most effective, crystallized form:\\n\\nPrompt: %s", input)
	}

	return content
}
