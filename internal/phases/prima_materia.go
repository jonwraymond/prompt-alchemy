package phases

import (
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/internal/templates"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type PrimaMateria struct{}

// Contributes to Transmutation Core: Initial phase for extracting and structuring raw input
func (p *PrimaMateria) GetTemplate() string {
	return "prima_materia" // Return template name for new system
}

func (p *PrimaMateria) BuildSystemPrompt(opts models.GenerateOptions) string {
	tmpl, err := templates.LoadPhaseSystemPrompt("prima_materia")
	if err != nil {
		// Fallback to embedded system prompt
		return "You are an expert at analyzing user requirements and creating well-structured prompts. Your specialty is transforming rough ideas and requests into comprehensive, organized prompts that effectively communicate the user's intentions and requirements."
	}

	systemPrompt, err := templates.ExecuteTemplate(tmpl, nil)
	if err != nil {
		// Fallback to embedded system prompt
		return "You are an expert at analyzing user requirements and creating well-structured prompts. Your specialty is transforming rough ideas and requests into comprehensive, organized prompts that effectively communicate the user's intentions and requirements."
	}
	return systemPrompt
}

func (p *PrimaMateria) PreparePromptContent(input string, opts models.GenerateOptions) string {
	templateName := p.GetTemplate()

	// Create template context
	context := &templates.PhaseContext{
		Input:    input,
		Context:  opts.Request.Context,
		Phase:    "prima_materia",
		Type:     extractType(input),
		Audience: extractAudience(input),
		Tone:     extractTone(input),
		Theme:    extractTheme(input),
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
		return fmt.Sprintf("Analyze the following user input and create a comprehensive, well-structured prompt:\n\nUser Input: %s", input)
	}

	return content
}

// Helper functions
func extractType(input string) string {
	if strings.Contains(strings.ToLower(input), "email") {
		return "email content"
	} else if strings.Contains(strings.ToLower(input), "code") {
		return "code snippets"
	} else if strings.Contains(strings.ToLower(input), "article") {
		return "article content"
	}
	return "content"
}

func extractAudience(input string) string {
	if strings.Contains(strings.ToLower(input), "developer") {
		return "developers"
	} else if strings.Contains(strings.ToLower(input), "business") {
		return "business professionals"
	}
	return "general audience"
}

func extractTone(input string) string {
	if strings.Contains(strings.ToLower(input), "formal") {
		return "formal tone"
	} else if strings.Contains(strings.ToLower(input), "casual") {
		return "casual tone"
	}
	return "professional tone"
}

func extractTheme(input string) string {
	words := strings.Fields(input)
	if len(words) > 5 {
		return strings.Join(words[:5], " ") + "..."
	}
	return input
}
