package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/selection"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
)

// Setup function
func SetupPromptRoutes(r chi.Router, registry *providers.Registry) {
	r.Post("/api/v1/prompts/select", func(w http.ResponseWriter, r *http.Request) {
		SelectPromptHandler(w, r, registry)
	})
}

func SelectPromptHandler(w http.ResponseWriter, r *http.Request, registry *providers.Registry) {
	logger := log.GetLogger()
	reqID := uuid.New().String()
	logger.WithField("request_id", reqID).Info("Starting prompt selection request")
	start := time.Now()

	var req struct {
		Prompts  []string                    `json:"prompts"`
		Criteria selection.SelectionCriteria `json:"criteria"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.WithError(err).Error("Failed to decode request")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Prompts) == 0 {
		logger.Warn("No prompts provided")
		http.Error(w, "At least one prompt required", http.StatusBadRequest)
		return
	}

	if req.Criteria.TaskDescription == "" {
		logger.Warn("Missing task description")
		http.Error(w, "Task description required", http.StatusBadRequest)
		return
	}

	promptModels := convertToPrompts(req.Prompts)
	selector := selection.NewAISelector(registry)
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	result, err := selector.Select(ctx, promptModels, req.Criteria)
	if err != nil {
		logger.WithError(err).Error("Selection failed")
		http.Error(w, "Selection error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Request-ID", reqID)
	json.NewEncoder(w).Encode(result)

	logger.WithField("duration_ms", time.Since(start).Milliseconds()).Info("Prompt selection completed")
}

func convertToPrompts(strs []string) []models.Prompt {
	ps := make([]models.Prompt, len(strs))
	for i, s := range strs {
		ps[i] = models.Prompt{ID: uuid.New(), Content: s}
	}
	return ps
}
