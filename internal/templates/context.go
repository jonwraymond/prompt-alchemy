package templates

import (
	"bytes"
	"text/template"
)

// PhaseContext contains all variables available to phase templates
type PhaseContext struct {
	// Core content
	Input  string `json:"input"`
	Prompt string `json:"prompt"`

	// Metadata
	Persona     string `json:"persona,omitempty"`
	TargetModel string `json:"target_model,omitempty"`
	Phase       string `json:"phase,omitempty"`

	// Lists
	Context           []string `json:"context,omitempty"`
	Requirements      []string `json:"requirements,omitempty"`
	OptimizationHints []string `json:"optimization_hints,omitempty"`
	Examples          []string `json:"examples,omitempty"`

	// Phase-specific fields
	Type     string `json:"type,omitempty"`     // Prima Materia: content type to generate
	Audience string `json:"audience,omitempty"` // Prima Materia: target audience
	Tone     string `json:"tone,omitempty"`     // Prima Materia: desired tone
	Theme    string `json:"theme,omitempty"`    // Prima Materia: focus theme
}

// PersonaContext contains variables available to persona templates
type PersonaContext struct {
	Task         string   `json:"task"`
	Context      string   `json:"context,omitempty"`
	Requirements []string `json:"requirements,omitempty"`
	Examples     []string `json:"examples,omitempty"`

	// Model-specific hints
	ModelFamily string `json:"model_family,omitempty"`
	Reasoning   string `json:"reasoning,omitempty"`

	// Additional context
	Persona     string `json:"persona,omitempty"`
	TargetModel string `json:"target_model,omitempty"`
}

// ExecuteTemplate executes a template with the given context
func ExecuteTemplate(tmpl *template.Template, context interface{}) (string, error) {
	var buf bytes.Buffer
	err := tmpl.Execute(&buf, context)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// ExecutePersonaTemplate executes a persona template with context
func ExecutePersonaTemplate(personaType string, context *PersonaContext) (string, error) {
	tmpl, err := LoadPersonaSystemPrompt(personaType)
	if err != nil {
		return "", err
	}
	return ExecuteTemplate(tmpl, context)
}

// ExecutePhaseTemplate executes a phase template with context
func ExecutePhaseTemplate(phase string, context *PhaseContext) (string, error) {
	tmpl, err := LoadPhaseTemplate(phase)
	if err != nil {
		return "", err
	}
	return ExecuteTemplate(tmpl, context)
}

// ExecutePhaseSystemTemplate executes a phase system template with context
func ExecutePhaseSystemTemplate(phase string, context *PhaseContext) (string, error) {
	tmpl, err := LoadPhaseSystemPrompt(phase)
	if err != nil {
		return "", err
	}
	return ExecuteTemplate(tmpl, context)
}
