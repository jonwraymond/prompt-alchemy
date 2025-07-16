package templates

import (
	"embed"
	"fmt"
	"io/fs"
	"strings"
	"sync"
	"text/template"
)

//go:embed templates
var templateFS embed.FS

// TemplateType represents different categories of templates
type TemplateType string

const (
	TemplateTypePersona      TemplateType = "personas"
	TemplateTypePhase        TemplateType = "phases"
	TemplateTypeOptimization TemplateType = "optimization"
)

// TemplateLoader handles loading and executing Go templates from embedded filesystem
type TemplateLoader struct {
	cache map[string]*template.Template
	mutex sync.RWMutex
}

// NewTemplateLoader creates a new template loader
func NewTemplateLoader() *TemplateLoader {
	return &TemplateLoader{
		cache: make(map[string]*template.Template),
	}
}

// LoadTemplate loads and parses a Go template by type and name
func (tl *TemplateLoader) LoadTemplate(templateType TemplateType, name string) (*template.Template, error) {
	cacheKey := fmt.Sprintf("%s/%s", templateType, name)

	// Check cache first with read lock
	tl.mutex.RLock()
	if tmpl, exists := tl.cache[cacheKey]; exists {
		tl.mutex.RUnlock()
		return tmpl, nil
	}
	tl.mutex.RUnlock()

	// Build file path with .tpl extension
	filePath := fmt.Sprintf("templates/%s/%s.tpl", templateType, name)

	// Load from embedded filesystem
	content, err := fs.ReadFile(templateFS, filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to load template %s: %w", filePath, err)
	}

	// Parse the template
	tmpl, err := template.New(cacheKey).Parse(string(content))
	if err != nil {
		return nil, fmt.Errorf("failed to parse template %s: %w", filePath, err)
	}

	// Cache the parsed template with write lock
	tl.mutex.Lock()
	tl.cache[cacheKey] = tmpl
	tl.mutex.Unlock()

	return tmpl, nil
}

// LoadPersonaSystemPrompt loads a persona system prompt template
func (tl *TemplateLoader) LoadPersonaSystemPrompt(personaType string) (*template.Template, error) {
	return tl.LoadTemplate(TemplateTypePersona, personaType)
}

// LoadPhaseTemplate loads a phase template
func (tl *TemplateLoader) LoadPhaseTemplate(phase string) (*template.Template, error) {
	return tl.LoadTemplate(TemplateTypePhase, phase)
}

// LoadPhaseSystemPrompt loads a phase system prompt template
func (tl *TemplateLoader) LoadPhaseSystemPrompt(phase string) (*template.Template, error) {
	return tl.LoadTemplate(TemplateTypePhase, phase+"_system")
}

// ListTemplates lists all available templates of a given type
func (tl *TemplateLoader) ListTemplates(templateType TemplateType) ([]string, error) {
	dirPath := fmt.Sprintf("templates/%s", templateType)

	entries, err := fs.ReadDir(templateFS, dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read template directory %s: %w", dirPath, err)
	}

	var templates []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".tpl") {
			// Remove .tpl extension for template names
			name := strings.TrimSuffix(entry.Name(), ".tpl")
			templates = append(templates, name)
		}
	}

	return templates, nil
}

// ClearCache clears the template cache
func (tl *TemplateLoader) ClearCache() {
	tl.mutex.Lock()
	tl.cache = make(map[string]*template.Template)
	tl.mutex.Unlock()
}

// Global template loader instance
var DefaultLoader = NewTemplateLoader()

// Convenience functions using the default loader
func LoadPersonaSystemPrompt(personaType string) (*template.Template, error) {
	return DefaultLoader.LoadPersonaSystemPrompt(personaType)
}

func LoadPhaseTemplate(phase string) (*template.Template, error) {
	return DefaultLoader.LoadPhaseTemplate(phase)
}

func LoadPhaseSystemPrompt(phase string) (*template.Template, error) {
	return DefaultLoader.LoadPhaseSystemPrompt(phase)
}
