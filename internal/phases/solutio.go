package phases

import (
	"fmt"

	"github.com/jonwraymond/prompt-alchemy/internal/templates"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type Solutio struct{}

// Contributes to Transmutation Core: Dissolution phase for refining structured input into natural language
func (s *Solutio) GetTemplate() string {
	return "solutio" // Return template name for new system
}

func (s *Solutio) BuildSystemPrompt(opts models.GenerateOptions) string {
	tmpl, err := templates.LoadPhaseSystemPrompt("solutio")
	if err != nil {
		// Fallback to embedded system prompt
		return "You excel at transforming formal or structured text into natural, engaging language. Your focus is on improving readability, flow, and accessibility while preserving all essential information and maintaining the original intent and requirements."
	}

	systemPrompt, err := templates.ExecuteTemplate(tmpl, nil)
	if err != nil {
		// Fallback to embedded system prompt
		return "You excel at transforming formal or structured text into natural, engaging language. Your focus is on improving readability, flow, and accessibility while preserving all essential information and maintaining the original intent and requirements."
	}
	return systemPrompt
}

func (s *Solutio) PreparePromptContent(input string, opts models.GenerateOptions) string {
	templateName := s.GetTemplate()

	// Create template context
	context := &templates.PhaseContext{
		Prompt:       input,
		Context:      opts.Request.Context,
		Requirements: []string{}, // Could be extracted from opts if needed
		Phase:        "solutio",
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
		return fmt.Sprintf("Take the following prompt and transform it into more natural, engaging language:\n\nPrompt: %s", input)
	}

	return content
}
