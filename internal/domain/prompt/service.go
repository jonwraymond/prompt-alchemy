package prompt

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
)

// StorageInterface defines the storage operations needed by the service
type StorageInterface interface {
	SavePrompt(ctx context.Context, prompt *models.Prompt) error
	ListPrompts(ctx context.Context, limit, offset int) ([]models.Prompt, error)
	GetPrompt(ctx context.Context, id string) (*models.Prompt, error)
	DeletePrompt(ctx context.Context, id string) error
	SearchPrompts(ctx context.Context, query string, limit int) ([]models.Prompt, error)
	Close() error
}

// EngineInterface defines the engine operations needed by the service
type EngineInterface interface {
	Generate(ctx context.Context, opts models.GenerateOptions) (*models.GenerationResult, error)
}

// RankerInterface defines the ranking operations needed by the service
type RankerInterface interface {
	RankPrompts(ctx context.Context, prompts []models.Prompt, query string) ([]models.PromptRanking, error)
}

// Service handles prompt-related business operations
type Service struct {
	storage  StorageInterface
	engine   EngineInterface
	ranker   RankerInterface
	registry *providers.Registry
	logger   *logrus.Logger
}

// NewService creates a new prompt service
func NewService(
	storage StorageInterface,
	engine EngineInterface,
	ranker RankerInterface,
	registry *providers.Registry,
	logger *logrus.Logger,
) *Service {
	return &Service{
		storage:  storage,
		engine:   engine,
		ranker:   ranker,
		registry: registry,
		logger:   logger,
	}
}

// GenerateRequest represents a request to generate prompts
type GenerateRequest struct {
	Input       string            `json:"input"`
	Phases      []string          `json:"phases,omitempty"`
	Count       int               `json:"count,omitempty"`
	Providers   map[string]string `json:"providers,omitempty"`
	Temperature float64           `json:"temperature,omitempty"`
	MaxTokens   int               `json:"max_tokens,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
	Context     []string          `json:"context,omitempty"`
	Persona     string            `json:"persona,omitempty"`
	UseParallel bool              `json:"use_parallel,omitempty"`
	Save        bool              `json:"save,omitempty"`
}

// GenerateResponse represents the result of prompt generation
type GenerateResponse struct {
	Prompts   []models.Prompt        `json:"prompts"`
	Rankings  []models.PromptRanking `json:"rankings,omitempty"`
	SessionID uuid.UUID              `json:"session_id"`
	Metadata  GenerateMetadata       `json:"metadata"`
}

// GenerateMetadata contains metadata about the generation process
type GenerateMetadata struct {
	Duration    string    `json:"duration"`
	PhaseCount  int       `json:"phase_count"`
	TotalTokens int       `json:"total_tokens,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// Generate creates new prompts based on the request
func (s *Service) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	start := time.Now()
	sessionID := uuid.New()

	s.logger.WithFields(logrus.Fields{
		"session_id": sessionID,
		"input_len":  len(req.Input),
		"count":      req.Count,
	}).Info("Starting prompt generation")

	// Set defaults
	if req.Count <= 0 {
		req.Count = 3
	}
	if req.Temperature == 0 {
		req.Temperature = 0.7
	}
	if req.MaxTokens <= 0 {
		req.MaxTokens = 2000
	}
	if len(req.Phases) == 0 {
		req.Phases = []string{"prima-materia", "solutio", "coagulatio"}
	}

	// Convert string phases to models.Phase
	phases := make([]models.Phase, len(req.Phases))
	for i, phaseStr := range req.Phases {
		phases[i] = models.Phase(phaseStr)
	}

	// Create prompt request
	promptReq := models.PromptRequest{
		Input:     req.Input,
		Phases:    phases,
		Count:     req.Count,
		Tags:      req.Tags,
		Context:   req.Context,
		SessionID: sessionID,
	}

	// Build phase configurations
	phaseConfigs := make([]models.PhaseConfig, len(phases))
	for i, phase := range phases {
		provider := "openai" // default provider
		if len(req.Providers) > 0 {
			// Use first available provider from the map
			for _, p := range req.Providers {
				provider = p
				break
			}
		}

		phaseConfigs[i] = models.PhaseConfig{
			Phase:    phase,
			Provider: provider,
		}
	}

	// Create generation options
	opts := models.GenerateOptions{
		Request:      promptReq,
		PhaseConfigs: phaseConfigs,
		Optimize:     false,
	}

	// Generate prompts using the engine
	result, err := s.engine.Generate(ctx, opts)
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate prompts")
		return nil, fmt.Errorf("generation failed: %w", err)
	}

	// Rank prompts if ranker is available and we have results
	var rankings []models.PromptRanking
	if s.ranker != nil && len(result.Prompts) > 0 {
		rankings, err = s.ranker.RankPrompts(ctx, result.Prompts, req.Input)
		if err != nil {
			s.logger.WithError(err).Warn("Failed to rank prompts, continuing without rankings")
		}
	}

	// Save prompts if requested
	if req.Save {
		for _, prompt := range result.Prompts {
			if err := s.storage.SavePrompt(ctx, &prompt); err != nil {
				s.logger.WithError(err).Warn("Failed to save prompt")
			}
		}
	}

	// Calculate metadata
	duration := time.Since(start)
	metadata := GenerateMetadata{
		Duration:   duration.String(),
		PhaseCount: len(phases),
		Timestamp:  time.Now(),
	}

	s.logger.WithFields(logrus.Fields{
		"session_id":    sessionID,
		"prompts_count": len(result.Prompts),
		"duration":      duration,
	}).Info("Prompt generation completed")

	return &GenerateResponse{
		Prompts:   result.Prompts,
		Rankings:  rankings,
		SessionID: sessionID,
		Metadata:  metadata,
	}, nil
}

// ListPrompts returns a paginated list of prompts
func (s *Service) ListPrompts(ctx context.Context, limit, offset int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"limit":  limit,
		"offset": offset,
	}).Info("Listing prompts")

	return s.storage.ListPrompts(ctx, limit, offset)
}

// GetPrompt retrieves a specific prompt by ID
func (s *Service) GetPrompt(ctx context.Context, id string) (*models.Prompt, error) {
	s.logger.WithField("prompt_id", id).Info("Getting prompt")

	return s.storage.GetPrompt(ctx, id)
}

// SavePrompt saves a prompt
func (s *Service) SavePrompt(ctx context.Context, prompt *models.Prompt) error {
	s.logger.WithField("prompt_id", prompt.ID).Info("Saving prompt")

	// Set timestamps
	if prompt.ID == uuid.Nil {
		prompt.ID = uuid.New()
		prompt.CreatedAt = time.Now()
	}
	prompt.UpdatedAt = time.Now()

	return s.storage.SavePrompt(ctx, prompt)
}

// DeletePrompt deletes a prompt by ID
func (s *Service) DeletePrompt(ctx context.Context, id string) error {
	s.logger.WithField("prompt_id", id).Info("Deleting prompt")

	return s.storage.DeletePrompt(ctx, id)
}

// SearchPrompts searches for prompts
func (s *Service) SearchPrompts(ctx context.Context, query string, limit int) ([]models.Prompt, error) {
	s.logger.WithFields(logrus.Fields{
		"query": query,
		"limit": limit,
	}).Info("Searching prompts")

	return s.storage.SearchPrompts(ctx, query, limit)
}
