package learning

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/sirupsen/logrus"
)

// LearningEngine handles adaptive learning for prompt optimization
type LearningEngine struct {
	storage storage.StorageInterface
	logger  *logrus.Logger

	// Learning parameters
	learningRate   float64
	decayRate      float64
	feedbackWindow time.Duration
	minConfidence  float64

	// Pattern recognition
	patterns     map[string]*Pattern
	patternMutex sync.RWMutex

	// Real-time metrics
	metrics *MetricsCollector

	worker *BackgroundWorker
}

// Pattern represents a learned pattern in prompt usage
type Pattern struct {
	ID               uuid.UUID
	Type             string // "success", "failure", "optimization"
	Features         map[string]interface{}
	Confidence       float64
	LastUpdated      time.Time
	ObservationCount int
}

// MetricsCollector tracks real-time usage metrics
type MetricsCollector struct {
	promptMetrics  map[uuid.UUID]*PromptMetrics
	sessionMetrics map[string]*SessionMetrics
	mutex          sync.RWMutex
}

// PromptMetrics tracks per-prompt learning data
type PromptMetrics struct {
	PromptID         uuid.UUID
	SuccessRate      float64
	AverageLatency   time.Duration
	UserSatisfaction float64
	ContextMatches   int
	LastAccessed     time.Time
}

// SessionMetrics tracks per-session learning
type SessionMetrics struct {
	SessionID        string
	StartTime        time.Time
	PromptSequence   []uuid.UUID
	Outcomes         []float64
	ContextEvolution map[string]interface{}
}

// NewLearningEngine creates a new learning engine
func NewLearningEngine(storage storage.StorageInterface, logger *logrus.Logger) *LearningEngine {
	le := &LearningEngine{
		storage:        storage,
		logger:         logger,
		learningRate:   0.1,
		decayRate:      0.01,
		feedbackWindow: 24 * time.Hour,
		minConfidence:  0.6,
		patterns:       make(map[string]*Pattern),
		metrics: &MetricsCollector{
			promptMetrics:  make(map[uuid.UUID]*PromptMetrics),
			sessionMetrics: make(map[string]*SessionMetrics),
		},
	}
	le.worker = NewBackgroundWorker(le.storage, le, le.logger)
	return le
}

// RecordUsage records a prompt usage event for learning
func (le *LearningEngine) RecordUsage(ctx context.Context, usage models.UsageAnalytics) error {
	le.logger.WithFields(logrus.Fields{
		"prompt_id":     usage.PromptID,
		"effectiveness": usage.EffectivenessScore,
		"session_id":    usage.SessionID,
	}).Debug("Recording usage for learning")

	// Update prompt metrics
	le.updatePromptMetrics(usage)

	// Detect patterns
	if pattern := le.detectPattern(usage); pattern != nil {
		le.storePattern(pattern)
	}

	// Update relevance scores
	if err := le.updateRelevanceScore(ctx, usage); err != nil {
		le.logger.WithError(err).Warn("Failed to update relevance score")
	}

	// Store usage analytics will be handled by a different mechanism
	return nil
}

// updatePromptMetrics updates real-time metrics for a prompt
func (le *LearningEngine) updatePromptMetrics(usage models.UsageAnalytics) {
	le.metrics.mutex.Lock()
	defer le.metrics.mutex.Unlock()

	metrics, exists := le.metrics.promptMetrics[usage.PromptID]
	if !exists {
		metrics = &PromptMetrics{
			PromptID: usage.PromptID,
		}
		le.metrics.promptMetrics[usage.PromptID] = metrics
	}

	// Update success rate with exponential moving average
	alpha := le.learningRate
	success := 0.0
	if usage.EffectivenessScore > 0.7 {
		success = 1.0
	}
	metrics.SuccessRate = alpha*success + (1-alpha)*metrics.SuccessRate

	// Update latency
	if usage.GenerationTime > 0 {
		latency := time.Duration(usage.GenerationTime) * time.Millisecond
		if metrics.AverageLatency == 0 {
			metrics.AverageLatency = latency
		} else {
			metrics.AverageLatency = time.Duration(
				alpha*float64(latency) + (1-alpha)*float64(metrics.AverageLatency),
			)
		}
	}

	// Update satisfaction
	if usage.UserFeedback != nil {
		rating := float64(*usage.UserFeedback) / 5.0
		metrics.UserSatisfaction = alpha*rating + (1-alpha)*metrics.UserSatisfaction
	}

	metrics.LastAccessed = time.Now()
}

// detectPattern identifies patterns in usage
func (le *LearningEngine) detectPattern(usage models.UsageAnalytics) *Pattern {
	// Simple pattern detection - can be enhanced with ML
	pattern := &Pattern{
		ID:          uuid.New(),
		Features:    make(map[string]interface{}),
		LastUpdated: time.Now(),
	}

	// Success pattern
	if usage.EffectivenessScore > 0.8 {
		pattern.Type = "success"
		pattern.Features["high_effectiveness"] = true
		pattern.Features["context_length"] = len(usage.Context)
		pattern.Confidence = usage.EffectivenessScore
		return pattern
	}

	// Failure pattern
	if usage.EffectivenessScore < 0.3 {
		pattern.Type = "failure"
		pattern.Features["low_effectiveness"] = true
		pattern.Features["error_type"] = usage.ErrorMessage
		pattern.Confidence = 1.0 - usage.EffectivenessScore
		return pattern
	}

	return nil
}

// storePattern stores a detected pattern
//
//nolint:unused // Reserved for future functionality
func (le *LearningEngine) storePattern(pattern *Pattern) {
	le.patternMutex.Lock()
	defer le.patternMutex.Unlock()

	key := fmt.Sprintf("%s:%v", pattern.Type, pattern.Features)

	if existing, exists := le.patterns[key]; exists {
		// Update existing pattern
		existing.ObservationCount++
		existing.Confidence = (existing.Confidence*float64(existing.ObservationCount-1) +
			pattern.Confidence) / float64(existing.ObservationCount)
		existing.LastUpdated = time.Now()
	} else {
		// Store new pattern
		pattern.ObservationCount = 1
		le.patterns[key] = pattern
	}
}

// updateRelevanceScore updates prompt relevance based on usage
func (le *LearningEngine) updateRelevanceScore(ctx context.Context, usage models.UsageAnalytics) error {
	// This function will be adapted to use the new storage interface and methods
	// for updating prompt scores and usage data.
	// For now, we will log the intent.
	le.logger.WithFields(logrus.Fields{
		"prompt_id": usage.PromptID,
		"new_score": usage.EffectivenessScore,
	}).Info("Updating relevance score for prompt")
	return nil
}

// calculateTimeDecay calculates relevance decay based on time
func (le *LearningEngine) calculateTimeDecay(lastUsed *time.Time) float64 {
	if lastUsed == nil {
		return 0.0
	}

	daysSinceUse := time.Since(*lastUsed).Hours() / 24
	return le.decayRate * daysSinceUse
}

// GetRecommendations provides prompt recommendations based on learning
// func (le *LearningEngine) GetRecommendations(ctx context.Context, input string, limit int) ([]*models.Prompt, error) {
// 	// Get high-relevance prompts
// 	prompts, err := le.storage.GetHighQualityHistoricalPrompts(ctx, limit*2)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to search by relevance: %w", err)
// 	}
//
// 	// Apply pattern-based filtering
// 	filtered := le.applyPatternFiltering(prompts, input)
//
// 	// Limit results
// 	if len(filtered) > limit {
// 		filtered = filtered[:limit]
// 	}
//
// 	return filtered, nil
// }

// applyPatternFiltering filters prompts based on learned patterns
func (le *LearningEngine) applyPatternFiltering(prompts []models.Prompt, input string) []models.Prompt {
	le.patternMutex.RLock()
	defer le.patternMutex.RUnlock()

	// Score each prompt based on pattern matching
	type scoredPrompt struct {
		prompt models.Prompt
		score  float64
	}

	scored := make([]scoredPrompt, 0, len(prompts))

	for _, prompt := range prompts {
		score := prompt.RelevanceScore

		// Check if prompt metrics indicate success
		if metrics, exists := le.metrics.promptMetrics[prompt.ID]; exists {
			score *= metrics.SuccessRate
		}

		// Apply pattern boosts
		for _, pattern := range le.patterns {
			if pattern.Type == "success" && pattern.Confidence > le.minConfidence {
				// Boost prompts that match success patterns
				score *= (1.0 + pattern.Confidence*0.1)
			}
		}

		scored = append(scored, scoredPrompt{prompt, score})
	}

	// Sort by score
	for i := range scored {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	// Extract prompts
	result := make([]models.Prompt, len(scored))
	for i, sp := range scored {
		result[i] = sp.prompt
	}

	return result
}

// GetLearningStats returns current learning statistics
func (le *LearningEngine) GetLearningStats() map[string]interface{} {
	le.patternMutex.RLock()
	defer le.patternMutex.RUnlock()

	le.metrics.mutex.RLock()
	defer le.metrics.mutex.RUnlock()

	stats := map[string]interface{}{
		"total_patterns":  len(le.patterns),
		"total_prompts":   len(le.metrics.promptMetrics),
		"active_sessions": len(le.metrics.sessionMetrics),
		"learning_rate":   le.learningRate,
		"decay_rate":      le.decayRate,
		"min_confidence":  le.minConfidence,
	}

	// Calculate average metrics
	var totalSuccess, totalSatisfaction float64
	var count int

	for _, metrics := range le.metrics.promptMetrics {
		totalSuccess += metrics.SuccessRate
		totalSatisfaction += metrics.UserSatisfaction
		count++
	}

	if count > 0 {
		stats["average_success_rate"] = totalSuccess / float64(count)
		stats["average_satisfaction"] = totalSatisfaction / float64(count)
	}

	// Pattern breakdown
	patternTypes := make(map[string]int)
	for _, pattern := range le.patterns {
		patternTypes[pattern.Type]++
	}
	stats["pattern_types"] = patternTypes

	return stats
}

// StartBackgroundLearning starts background learning processes
func (le *LearningEngine) StartBackgroundLearning(ctx context.Context) {
	go le.worker.Start(ctx)
}

// runRelevanceDecay periodically decays relevance scores
func (le *LearningEngine) runRelevanceDecay(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// if err := le.storage.DecayRelevanceScores(le.decayRate); err != nil {
			// 	le.logger.WithError(err).Warn("Failed to decay relevance scores")
			// }
		}
	}
}

// runPatternConsolidation consolidates learned patterns
func (le *LearningEngine) runPatternConsolidation(ctx context.Context) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			le.consolidatePatterns()
		}
	}
}

// consolidatePatterns merges similar patterns
func (le *LearningEngine) consolidatePatterns() {
	le.patternMutex.Lock()
	defer le.patternMutex.Unlock()

	// Remove low-confidence patterns
	for key, pattern := range le.patterns {
		if pattern.Confidence < le.minConfidence/2 {
			delete(le.patterns, key)
		}
	}

	le.logger.WithField("pattern_count", len(le.patterns)).Info("Consolidated patterns")
}

// runMetricsCleanup cleans up old metrics
func (le *LearningEngine) runMetricsCleanup(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			le.cleanupOldMetrics()
		}
	}
}

// cleanupOldMetrics removes metrics older than feedback window
func (le *LearningEngine) cleanupOldMetrics() {
	le.metrics.mutex.Lock()
	defer le.metrics.mutex.Unlock()

	cutoff := time.Now().Add(-le.feedbackWindow)

	// Clean prompt metrics
	for id, metrics := range le.metrics.promptMetrics {
		if metrics.LastAccessed.Before(cutoff) {
			delete(le.metrics.promptMetrics, id)
		}
	}

	// Clean session metrics
	for id, session := range le.metrics.sessionMetrics {
		if session.StartTime.Before(cutoff) {
			delete(le.metrics.sessionMetrics, id)
		}
	}

	le.logger.WithFields(logrus.Fields{
		"prompt_metrics_count":  len(le.metrics.promptMetrics),
		"session_metrics_count": len(le.metrics.sessionMetrics),
	}).Info("Cleaned up old metrics")
}
