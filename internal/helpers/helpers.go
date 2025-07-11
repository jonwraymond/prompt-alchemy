package helpers

import (
	"strings"

	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/spf13/viper"
)

func ParsePhases(phasesStr string) []models.Phase {
	parts := strings.Split(phasesStr, ",")
	phases := make([]models.Phase, 0, len(parts))

	for _, part := range parts {
		phase := strings.TrimSpace(part)
		switch phase {
		case "prima-materia", "prima_materia", "idea":
			phases = append(phases, models.PhasePrimaMaterial)
		case "solutio", "human":
			phases = append(phases, models.PhaseSolutio)
		case "coagulatio", "precision":
			phases = append(phases, models.PhaseCoagulatio)
		}
	}
	return phases
}

func ParseTags(tagsStr string) []string {
	if tagsStr == "" {
		return []string{}
	}
	parts := strings.Split(tagsStr, ",")
	tags := make([]string, 0, len(parts))
	for _, part := range parts {
		tag := strings.TrimSpace(part)
		if tag != "" {
			tags = append(tags, tag)
		}
	}
	return tags
}

func BuildPhaseConfigs(phases []models.Phase, overrideProvider string) []models.PhaseConfig {
	configs := make([]models.PhaseConfig, 0, len(phases))
	for _, phase := range phases {
		provider := overrideProvider
		if provider == "" {
			provider = viper.GetString("phases." + string(phase) + ".provider")
			// Fallback to ollama if viper returns empty (configuration issue)
			if provider == "" {
				provider = "ollama"
			}
		}
		configs = append(configs, models.PhaseConfig{Phase: phase, Provider: provider})
	}
	return configs
}
