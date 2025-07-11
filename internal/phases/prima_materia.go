package phases

import (
	"fmt"
	"strings"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
)

type PrimaMateria struct{}

func (p *PrimaMateria) GetTemplate() string {
	return `You are an alchemical prompt engineer, working with the Prima Materia - the raw, unformed potential. Extract and shape the essential elements from the user's vision into a comprehensive prompt that generates {{TYPE}} for {{AUDIENCE}}, using {{TONE}}, focusing on {{THEME}}.

Requirements:
- Extract the pure essence of the request
- Shape raw ideas into structured form
- Define the vessel (output format) clearly
- Consider all elemental aspects

Raw Material: {{INPUT}}`
}

func (p *PrimaMateria) BuildSystemPrompt(opts models.GenerateOptions) string {
	baseSystem := "You are a master alchemist of language, transforming raw ideas into golden prompts through ancient processes."
	return baseSystem + " In this Prima Materia phase, extract the pure essence from raw materials to create the foundation stone of comprehensive, well-structured prompts."
}

func (p *PrimaMateria) PreparePromptContent(input string, opts models.GenerateOptions) string {
	template := p.GetTemplate()

	replacements := map[string]string{
		"{{INPUT}}":    input,
		"{{TYPE}}":     extractType(input),
		"{{AUDIENCE}}": extractAudience(input),
		"{{TONE}}":     extractTone(input),
		"{{THEME}}":    extractTheme(input),
	}

	content := template
	for placeholder, value := range replacements {
		content = strings.ReplaceAll(content, placeholder, value)
	}

	if len(opts.Request.Context) > 0 {
		content += "\n\nAdditional Context:\n"
		for _, ctx := range opts.Request.Context {
			content += fmt.Sprintf("- %s\n", ctx)
		}
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
