package summarization

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// SummarizationMode defines the type of summarization approach
type SummarizationMode string

const (
	ModeFast     SummarizationMode = "fast"     // Template-based, very fast
	ModeLocal    SummarizationMode = "local"    // Local CPU model (future)
	ModeProvider SummarizationMode = "provider" // Use existing LLM providers
)

// SummaryRequest represents a request for text summarization
type SummaryRequest struct {
	Text     string            `json:"text"`
	Context  string            `json:"context"`
	MaxWords int               `json:"max_words"`
	Style    string            `json:"style"`
	Metadata map[string]string `json:"metadata"`
}

// SummaryResponse represents the result of summarization
type SummaryResponse struct {
	Summary      string            `json:"summary"`
	Confidence   float64           `json:"confidence"`
	ProcessingMs int64             `json:"processing_ms"`
	Method       SummarizationMode `json:"method"`
	Metadata     map[string]string `json:"metadata"`
}

// Summarizer provides AI-powered text summarization capabilities
type Summarizer struct {
	mode               SummarizationMode
	fastTemplates      map[string][]string
	providerSummarizer ProviderSummarizer
	localModel         LocalModel
	cache              sync.Map
	logger             *logrus.Logger
}

// ProviderSummarizer interface for using existing LLM providers
type ProviderSummarizer interface {
	Summarize(ctx context.Context, text, context string) (string, error)
}

// LocalModel interface for local CPU-based models (future implementation)
type LocalModel interface {
	Summarize(ctx context.Context, text string) (string, float64, error)
	IsReady() bool
}

// NewSummarizer creates a new AI summarization service
func NewSummarizer(logger *logrus.Logger) *Summarizer {
	mode := SummarizationMode(viper.GetString("summarization.mode"))
	if mode == "" {
		mode = ModeFast // Default to fast template-based mode
	}

	s := &Summarizer{
		mode:   mode,
		logger: logger,
		cache:  sync.Map{},
	}

	s.initializeFastTemplates()

	logger.WithFields(logrus.Fields{
		"mode": mode,
	}).Info("AI summarization service initialized")

	return s
}

// initializeFastTemplates sets up template-based summarization patterns
func (s *Summarizer) initializeFastTemplates() {
	s.fastTemplates = map[string][]string{
		"system": {
			"System initialization: %s",
			"Framework ready: %s",
			"Service active: %s",
			"Processing pipeline: %s",
			"Infrastructure: %s",
		},
		"analysis": {
			"Deep analysis reveals: %s",
			"Pattern analysis shows: %s",
			"Semantic evaluation indicates: %s",
			"Processing analysis: %s",
			"Data assessment: %s",
		},
		"processing": {
			"Active processing: %s",
			"Real-time analysis: %s",
			"Dynamic processing: %s",
			"Continuous evaluation: %s",
			"Live assessment: %s",
		},
		"optimization": {
			"Optimization applying: %s",
			"Enhancement processing: %s",
			"Refinement active: %s",
			"Quality improvement: %s",
			"Performance tuning: %s",
		},
		"completion": {
			"Process completed: %s",
			"Analysis finished: %s",
			"Evaluation complete: %s",
			"Processing done: %s",
			"Task accomplished: %s",
		},
		"prima-materia": {
			"Raw input analysis: %s",
			"Initial material processing: %s",
			"Foundation extraction: %s",
			"Core element identification: %s",
			"Base material refinement: %s",
		},
		"solutio": {
			"Dissolution processing: %s",
			"Structural refinement: %s",
			"Element separation: %s",
			"Component analysis: %s",
			"Material transformation: %s",
		},
		"coagulatio": {
			"Final crystallization: %s",
			"Result consolidation: %s",
			"Output formation: %s",
			"Structure completion: %s",
			"Final synthesis: %s",
		},
	}
}

// Summarize performs AI-powered text summarization
func (s *Summarizer) Summarize(ctx context.Context, req SummaryRequest) (*SummaryResponse, error) {
	startTime := time.Now()

	// Check cache first
	cacheKey := s.generateCacheKey(req)
	if cached, ok := s.cache.Load(cacheKey); ok {
		if summary, ok := cached.(*SummaryResponse); ok {
			s.logger.Debug("Returning cached summary")
			return summary, nil
		}
	}

	var summary string
	var confidence float64
	var err error

	switch s.mode {
	case ModeFast:
		summary, confidence = s.fastSummarize(req)
	case ModeLocal:
		if s.localModel != nil && s.localModel.IsReady() {
			summary, confidence, err = s.localModel.Summarize(ctx, req.Text)
		} else {
			// Fallback to fast mode
			summary, confidence = s.fastSummarize(req)
		}
	case ModeProvider:
		if s.providerSummarizer != nil {
			summary, err = s.providerSummarizer.Summarize(ctx, req.Text, req.Context)
			confidence = 0.85 // Assume high confidence for provider-based
		} else {
			// Fallback to fast mode
			summary, confidence = s.fastSummarize(req)
		}
	default:
		summary, confidence = s.fastSummarize(req)
	}

	if err != nil {
		s.logger.WithError(err).Error("Summarization failed")
		return nil, err
	}

	response := &SummaryResponse{
		Summary:      summary,
		Confidence:   confidence,
		ProcessingMs: time.Since(startTime).Milliseconds(),
		Method:       s.mode,
		Metadata: map[string]string{
			"words":      fmt.Sprintf("%d", len(strings.Fields(summary))),
			"characters": fmt.Sprintf("%d", len(summary)),
		},
	}

	// Cache the result
	s.cache.Store(cacheKey, response)

	s.logger.WithFields(logrus.Fields{
		"processing_ms": response.ProcessingMs,
		"confidence":    response.Confidence,
		"method":        response.Method,
		"summary_words": len(strings.Fields(summary)),
	}).Debug("Summarization completed")

	return response, nil
}

// fastSummarize provides template-based summarization for maximum speed
func (s *Summarizer) fastSummarize(req SummaryRequest) (string, float64) {
	// Determine the best template category
	context := strings.ToLower(req.Context)
	var templates []string
	var ok bool

	// Try to match context to specific templates
	if templates, ok = s.fastTemplates[context]; !ok {
		// Analyze text content for context hints
		text := strings.ToLower(req.Text)

		if strings.Contains(text, "init") || strings.Contains(text, "start") || strings.Contains(text, "ready") {
			templates = s.fastTemplates["system"]
		} else if strings.Contains(text, "analyz") || strings.Contains(text, "evaluat") {
			templates = s.fastTemplates["analysis"]
		} else if strings.Contains(text, "process") || strings.Contains(text, "work") {
			templates = s.fastTemplates["processing"]
		} else if strings.Contains(text, "optim") || strings.Contains(text, "improv") {
			templates = s.fastTemplates["optimization"]
		} else if strings.Contains(text, "complet") || strings.Contains(text, "finish") || strings.Contains(text, "done") {
			templates = s.fastTemplates["completion"]
		} else {
			// Default to processing templates
			templates = s.fastTemplates["processing"]
		}
	}

	// Extract key phrases from the original text
	keyPhrase := s.extractKeyPhrase(req.Text, req.MaxWords)

	// Select a template (simple rotation for variety)
	templateIndex := len(req.Text) % len(templates)
	template := templates[templateIndex]

	// Generate summary using template
	summary := fmt.Sprintf(template, keyPhrase)

	// Confidence based on text length and keyword matching
	confidence := s.calculateConfidence(req.Text, context)

	return summary, confidence
}

// extractKeyPhrase extracts the most important phrase from text
func (s *Summarizer) extractKeyPhrase(text string, maxWords int) string {
	if maxWords <= 0 {
		maxWords = 8 // Default max words for key phrase
	}

	words := strings.Fields(text)
	if len(words) <= maxWords {
		return text
	}

	// Simple key phrase extraction: take words around important keywords
	importantWords := []string{
		"processing", "analyzing", "optimizing", "transforming", "generating",
		"evaluating", "refining", "enhancing", "creating", "building",
		"improving", "developing", "completing", "finishing", "initializing",
	}

	// Find the best starting position based on important words
	bestStart := 0
	maxScore := 0

	for i := 0; i <= len(words)-maxWords; i++ {
		score := 0
		for j := i; j < i+maxWords && j < len(words); j++ {
			word := strings.ToLower(words[j])
			for _, important := range importantWords {
				if strings.Contains(word, important) {
					score += 3
				}
			}
			// Prefer content words over function words
			if len(word) > 3 {
				score += 1
			}
		}

		if score > maxScore {
			maxScore = score
			bestStart = i
		}
	}

	// Extract the key phrase
	endPos := bestStart + maxWords
	if endPos > len(words) {
		endPos = len(words)
	}

	keyPhrase := strings.Join(words[bestStart:endPos], " ")

	// Clean up and ensure it makes sense
	if len(keyPhrase) > 100 {
		keyPhrase = keyPhrase[:97] + "..."
	}

	return keyPhrase
}

// calculateConfidence estimates confidence based on text analysis
func (s *Summarizer) calculateConfidence(text, context string) float64 {
	baseConfidence := 0.75 // Base confidence for fast summarization

	// Adjust based on text length
	words := strings.Fields(text)
	if len(words) > 10 {
		baseConfidence += 0.1
	}

	// Adjust based on context match
	if context != "" && strings.Contains(strings.ToLower(text), context) {
		baseConfidence += 0.1
	}

	// Cap confidence
	if baseConfidence > 0.95 {
		baseConfidence = 0.95
	}

	return baseConfidence
}

// generateCacheKey creates a cache key for the request
func (s *Summarizer) generateCacheKey(req SummaryRequest) string {
	// Simple hash-like key generation
	key := fmt.Sprintf("%s|%s|%d|%s",
		req.Text[:min(50, len(req.Text))],
		req.Context,
		req.MaxWords,
		req.Style)
	return key
}

// SetProviderSummarizer sets the provider-based summarizer
func (s *Summarizer) SetProviderSummarizer(ps ProviderSummarizer) {
	s.providerSummarizer = ps
}

// SetLocalModel sets the local CPU model
func (s *Summarizer) SetLocalModel(lm LocalModel) {
	s.localModel = lm
}

// GetStats returns summarization statistics
func (s *Summarizer) GetStats() map[string]interface{} {
	cacheSize := 0
	s.cache.Range(func(key, value interface{}) bool {
		cacheSize++
		return true
	})

	return map[string]interface{}{
		"mode":       s.mode,
		"cache_size": cacheSize,
		"templates":  len(s.fastTemplates),
	}
}

// ClearCache clears the summarization cache
func (s *Summarizer) ClearCache() {
	s.cache.Range(func(key, value interface{}) bool {
		s.cache.Delete(key)
		return true
	})
	s.logger.Info("Summarization cache cleared")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
