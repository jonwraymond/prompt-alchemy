package models

import (
	"fmt"
	"strings"
)

// PersonaType represents different AI interaction patterns
type PersonaType string

const (
	PersonaCode     PersonaType = "code"
	PersonaWriting  PersonaType = "writing"
	PersonaAnalysis PersonaType = "analysis"
	PersonaGeneric  PersonaType = "generic"
)

// ModelFamily represents different LLM families with distinct prompting idioms
type ModelFamily string

const (
	ModelFamilyClaude  ModelFamily = "claude"
	ModelFamilyGPT     ModelFamily = "gpt"
	ModelFamilyGemini  ModelFamily = "gemini"
	ModelFamilyGeneric ModelFamily = "generic"
)

// ReasoningPattern represents different reasoning approaches
type ReasoningPattern string

const (
	ReasoningCoT    ReasoningPattern = "chain_of_thought"
	ReasoningSCoT   ReasoningPattern = "structured_cot"
	ReasoningCoC    ReasoningPattern = "chain_of_code"
	ReasoningDirect ReasoningPattern = "direct"
)

// Persona defines the AI interaction pattern and optimization strategy
type Persona struct {
	Type               PersonaType                       `json:"type"`
	Name               string                            `json:"name"`
	Description        string                            `json:"description"`
	DefaultReasoning   ReasoningPattern                  `json:"default_reasoning"`
	SystemPrompt       string                            `json:"system_prompt"`
	Capabilities       []string                          `json:"capabilities"`
	ModelOptimizations map[ModelFamily]ModelOptimization `json:"model_optimizations"`
}

// ModelOptimization contains model-specific prompting strategies
type ModelOptimization struct {
	StructuringMethod    string            `json:"structuring_method"`
	ReasoningElicitation string            `json:"reasoning_elicitation"`
	ToolIntegration      string            `json:"tool_integration"`
	ExampleStyle         string            `json:"example_style"`
	KeyDirectives        []string          `json:"key_directives"`
	Templates            map[string]string `json:"templates"`
}

// PersonaPromptContext contains the context for generating optimized prompts
type PersonaPromptContext struct {
	Persona      *Persona         `json:"persona"`
	ModelFamily  ModelFamily      `json:"model_family"`
	Reasoning    ReasoningPattern `json:"reasoning"`
	Task         string           `json:"task"`
	Context      string           `json:"context"`
	Requirements []string         `json:"requirements"`
	Examples     []string         `json:"examples"`
}

// GetPersona returns a persona configuration by type
func GetPersona(personaType PersonaType) (*Persona, error) {
	personas := getBuiltInPersonas()
	persona, exists := personas[personaType]
	if !exists {
		return nil, fmt.Errorf("unknown persona type: %s", personaType)
	}
	return persona, nil
}

// GetSupportedPersonas returns all supported persona types
func GetSupportedPersonas() []PersonaType {
	return []PersonaType{PersonaCode, PersonaWriting, PersonaAnalysis, PersonaGeneric}
}

// DetectModelFamily attempts to detect the model family from a model name
func DetectModelFamily(modelName string) ModelFamily {
	modelLower := strings.ToLower(modelName)

	switch {
	case strings.Contains(modelLower, "claude") || strings.Contains(modelLower, "anthropic"):
		return ModelFamilyClaude
	case strings.Contains(modelLower, "gpt") || strings.Contains(modelLower, "openai"):
		return ModelFamilyGPT
	case strings.Contains(modelLower, "gemini") || strings.Contains(modelLower, "google"):
		return ModelFamilyGemini
	default:
		return ModelFamilyGeneric
	}
}

// GenerateOptimizedPrompt creates a model-specific optimized prompt
func (p *Persona) GenerateOptimizedPrompt(ctx *PersonaPromptContext) (string, error) {
	optimization, exists := p.ModelOptimizations[ctx.ModelFamily]
	if !exists {
		// Fallback to generic optimization
		optimization = p.ModelOptimizations[ModelFamilyGeneric]
	}

	template := optimization.Templates["base"]
	if template == "" {
		template = p.getDefaultTemplate(ctx.ModelFamily)
	}

	// Apply reasoning pattern
	reasoningPrompt := p.getReasoningPrompt(ctx.Reasoning, ctx.ModelFamily)

	// Build the optimized prompt
	prompt := p.buildPrompt(template, optimization, ctx, reasoningPrompt)

	return prompt, nil
}

// getBuiltInPersonas returns the built-in persona configurations
func getBuiltInPersonas() map[PersonaType]*Persona {
	return map[PersonaType]*Persona{
		PersonaCode: {
			Type:             PersonaCode,
			Name:             "Code Generation & Analysis",
			Description:      "Specialized for software development, code generation, debugging, and technical analysis",
			DefaultReasoning: ReasoningSCoT,
			SystemPrompt:     "You are an expert software engineer and code architect. You excel at writing clean, efficient, and well-documented code across multiple programming languages and frameworks.",
			Capabilities:     []string{"code_generation", "debugging", "refactoring", "architecture_design", "testing", "documentation"},
			ModelOptimizations: map[ModelFamily]ModelOptimization{
				ModelFamilyClaude: {
					StructuringMethod:    "xml_tags",
					ReasoningElicitation: "<thinking>step-by-step analysis</thinking><answer>solution</answer>",
					ToolIntegration:      "mcp_tools",
					ExampleStyle:         "<example>input|output</example>",
					KeyDirectives:        []string{"Be explicit and direct", "Use structured XML tags", "Focus on code quality"},
					Templates: map[string]string{
						"base": "<instructions>\n{system_prompt}\n\nTask: {task}\n{reasoning_prompt}\n</instructions>\n\n<context>\n{context}\n</context>\n\n<requirements>\n{requirements}\n</requirements>",
					},
				},
				ModelFamilyGPT: {
					StructuringMethod:    "markdown_headers",
					ReasoningElicitation: "Let me think through this step by step:",
					ToolIntegration:      "function_calling",
					ExampleStyle:         "### Example\nInput: ...\nOutput: ...",
					KeyDirectives:        []string{"Think extensively before coding", "Use tools for verification", "Maintain persistence"},
					Templates: map[string]string{
						"base": "# System Instructions\n{system_prompt}\n\n## Task\n{task}\n\n{reasoning_prompt}\n\n## Context\n```\n{context}\n```\n\n## Requirements\n{requirements}",
					},
				},
				ModelFamilyGemini: {
					StructuringMethod:    "conversational",
					ReasoningElicitation: "Let me explain my reasoning and break down this problem:",
					ToolIntegration:      "conversational_tools",
					ExampleStyle:         "Here's an example to illustrate:",
					KeyDirectives:        []string{"Explain intent and reasoning", "Specify expertise level", "Be conversational but precise"},
					Templates: map[string]string{
						"base": "{task}",
					},
				},
				ModelFamilyGeneric: {
					StructuringMethod:    "clear_sections",
					ReasoningElicitation: "Let me approach this systematically:",
					ToolIntegration:      "basic_tools",
					ExampleStyle:         "Example:",
					KeyDirectives:        []string{"Be clear and systematic", "Show your work", "Validate results"},
					Templates: map[string]string{
						"base": "System: {system_prompt}\n\nTask: {task}\n\n{reasoning_prompt}\n\nContext:\n{context}\n\nRequirements:\n{requirements}",
					},
				},
			},
		},
		PersonaWriting: {
			Type:             PersonaWriting,
			Name:             "Content Writing & Communication",
			Description:      "Specialized for content creation, technical writing, documentation, and communication",
			DefaultReasoning: ReasoningCoT,
			SystemPrompt:     "You are an expert writer and communication specialist. You excel at creating clear, engaging, and well-structured content across various formats and audiences.",
			Capabilities:     []string{"content_writing", "technical_documentation", "copywriting", "editing", "communication_strategy"},
			ModelOptimizations: map[ModelFamily]ModelOptimization{
				ModelFamilyClaude: {
					StructuringMethod:    "xml_tags",
					ReasoningElicitation: "<thinking>Let me consider the audience, purpose, and tone</thinking><draft>initial content</draft><revision>refined content</revision>",
					ToolIntegration:      "content_tools",
					ExampleStyle:         "<example_content>sample text</example_content>",
					KeyDirectives:        []string{"Focus on clarity and engagement", "Consider audience needs", "Use appropriate tone"},
					Templates: map[string]string{
						"base": "<instructions>\n{system_prompt}\n\nWriting Task: {task}\n{reasoning_prompt}\n</instructions>\n\n<context>\n{context}\n</context>\n\n<requirements>\n{requirements}\n</requirements>",
					},
				},
				ModelFamilyGPT: {
					StructuringMethod:    "markdown_headers",
					ReasoningElicitation: "Let me plan the structure and consider the target audience:",
					ToolIntegration:      "writing_tools",
					ExampleStyle:         "### Example Content\n[Sample text here]",
					KeyDirectives:        []string{"Plan before writing", "Consider reader experience", "Edit for clarity"},
					Templates: map[string]string{
						"base": "# Writing Instructions\n{system_prompt}\n\n## Content Task\n{task}\n\n{reasoning_prompt}\n\n## Context\n{context}\n\n## Requirements\n{requirements}",
					},
				},
				ModelFamilyGemini: {
					StructuringMethod:    "conversational",
					ReasoningElicitation: "Let me think about the best way to communicate this effectively:",
					ToolIntegration:      "collaborative_writing",
					ExampleStyle:         "Here's how I would approach this:",
					KeyDirectives:        []string{"Be natural and engaging", "Adapt to audience", "Iterate and refine"},
					Templates: map[string]string{
						"base": "{task}",
					},
				},
				ModelFamilyGeneric: {
					StructuringMethod:    "clear_sections",
					ReasoningElicitation: "Let me structure this content effectively:",
					ToolIntegration:      "basic_writing",
					ExampleStyle:         "Example:",
					KeyDirectives:        []string{"Write clearly and concisely", "Organize logically", "Review and refine"},
					Templates: map[string]string{
						"base": "System: {system_prompt}\n\nTask: {task}\n\n{reasoning_prompt}\n\nContext:\n{context}\n\nRequirements:\n{requirements}",
					},
				},
			},
		},
		PersonaAnalysis: {
			Type:             PersonaAnalysis,
			Name:             "Data Analysis & Research",
			Description:      "Specialized for data analysis, research, problem-solving, and analytical thinking",
			DefaultReasoning: ReasoningSCoT,
			SystemPrompt:     "You are an expert analyst and researcher. You excel at breaking down complex problems, analyzing data, identifying patterns, and providing evidence-based insights.",
			Capabilities:     []string{"data_analysis", "research", "problem_solving", "pattern_recognition", "statistical_analysis", "critical_thinking"},
			ModelOptimizations: map[ModelFamily]ModelOptimization{
				ModelFamilyClaude: {
					StructuringMethod:    "xml_tags",
					ReasoningElicitation: "<analysis>breaking down the problem</analysis><methodology>approach and methods</methodology><findings>key insights</findings>",
					ToolIntegration:      "analysis_tools",
					ExampleStyle:         "<example_analysis>sample analysis</example_analysis>",
					KeyDirectives:        []string{"Be systematic and thorough", "Use evidence-based reasoning", "Present clear conclusions"},
					Templates: map[string]string{
						"base": "<instructions>\n{system_prompt}\n\nAnalysis Task: {task}\n{reasoning_prompt}\n</instructions>\n\n<context>\n{context}\n</context>\n\n<requirements>\n{requirements}\n</requirements>",
					},
				},
				ModelFamilyGPT: {
					StructuringMethod:    "markdown_headers",
					ReasoningElicitation: "Let me analyze this systematically, step by step:",
					ToolIntegration:      "analytical_functions",
					ExampleStyle:         "### Analysis Example\n[Sample analysis here]",
					KeyDirectives:        []string{"Think analytically", "Use data and evidence", "Draw logical conclusions"},
					Templates: map[string]string{
						"base": "# Analysis Instructions\n{system_prompt}\n\n## Analysis Task\n{task}\n\n{reasoning_prompt}\n\n## Context\n{context}\n\n## Requirements\n{requirements}",
					},
				},
				ModelFamilyGemini: {
					StructuringMethod:    "conversational",
					ReasoningElicitation: "Let me examine this carefully and break down what we're looking at:",
					ToolIntegration:      "research_tools",
					ExampleStyle:         "Here's my analytical approach:",
					KeyDirectives:        []string{"Be thorough and objective", "Explain reasoning clearly", "Support with evidence"},
					Templates: map[string]string{
						"base": "{task}",
					},
				},
				ModelFamilyGeneric: {
					StructuringMethod:    "clear_sections",
					ReasoningElicitation: "Let me approach this analysis methodically:",
					ToolIntegration:      "basic_analysis",
					ExampleStyle:         "Example:",
					KeyDirectives:        []string{"Be systematic and logical", "Use evidence", "Present clear findings"},
					Templates: map[string]string{
						"base": "System: {system_prompt}\n\nTask: {task}\n\n{reasoning_prompt}\n\nContext:\n{context}\n\nRequirements:\n{requirements}",
					},
				},
			},
		},
		PersonaGeneric: {
			Type:             PersonaGeneric,
			Name:             "General Purpose",
			Description:      "Balanced approach suitable for general tasks and broad applications",
			DefaultReasoning: ReasoningCoT,
			SystemPrompt:     "You are a helpful, accurate, and thoughtful AI assistant.",
			Capabilities:     []string{"general_assistance", "analysis", "writing", "problem_solving"},
			ModelOptimizations: map[ModelFamily]ModelOptimization{
				ModelFamilyGeneric: {
					StructuringMethod:    "clear_sections",
					ReasoningElicitation: "Let me think through this step by step:",
					ToolIntegration:      "basic_tools",
					ExampleStyle:         "Example:",
					KeyDirectives:        []string{"Be helpful and accurate", "Show reasoning", "Ask for clarification when needed"},
					Templates: map[string]string{
						"base": "System: {system_prompt}\n\nTask: {task}\n\n{reasoning_prompt}\n\nContext: {context}\n\nRequirements: {requirements}",
					},
				},
			},
		},
	}
}

// getDefaultTemplate returns a fallback template for the model family
func (p *Persona) getDefaultTemplate(family ModelFamily) string {
	switch family {
	case ModelFamilyClaude:
		return "<instructions>\n{system_prompt}\n\nTask: {task}\n{reasoning_prompt}\n</instructions>\n\n<context>\n{context}\n</context>"
	case ModelFamilyGPT:
		return "# Instructions\n{system_prompt}\n\n## Task\n{task}\n\n{reasoning_prompt}\n\n## Context\n{context}"
	case ModelFamilyGemini:
		return "{task}"
	default:
		return "System: {system_prompt}\n\nTask: {task}\n\n{reasoning_prompt}\n\nContext: {context}"
	}
}

// getReasoningPrompt returns the reasoning elicitation prompt for the pattern and model
func (p *Persona) getReasoningPrompt(pattern ReasoningPattern, family ModelFamily) string {
	optimization := p.ModelOptimizations[family]
	if optimization.ReasoningElicitation == "" {
		optimization = p.ModelOptimizations[ModelFamilyGeneric]
	}

	switch pattern {
	case ReasoningCoT:
		return optimization.ReasoningElicitation
	case ReasoningSCoT:
		if family == ModelFamilyClaude {
			return "<thinking>\nFirst, let me identify the inputs and expected outputs:\n- Inputs: ...\n- Outputs: ...\n\nNow, let me outline the implementation steps:\n1. ...\n2. ...\n3. ...\n</thinking>"
		}
		return "Let me structure this systematically:\n1. Identify inputs and outputs\n2. Break down the implementation steps\n3. Write the code with proper structure"
	case ReasoningCoC:
		return "Let me think in code and write executable steps to solve this:"
	case ReasoningDirect:
		return ""
	default:
		return optimization.ReasoningElicitation
	}
}

// buildPrompt constructs the final optimized prompt
func (p *Persona) buildPrompt(template string, optimization ModelOptimization, ctx *PersonaPromptContext, reasoningPrompt string) string {
	prompt := template

	// Replace template variables
	replacements := map[string]string{
		"{system_prompt}":    p.SystemPrompt,
		"{task}":             ctx.Task,
		"{reasoning_prompt}": reasoningPrompt,
		"{context}":          ctx.Context,
		"{requirements}":     strings.Join(ctx.Requirements, "\n- "),
	}

	for placeholder, value := range replacements {
		prompt = strings.ReplaceAll(prompt, placeholder, value)
	}

	return prompt
}
