package learning

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewLearningEngine(t *testing.T) {
	// Create test storage, registry, and logger
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()

	engine := NewLearningEngine(store, registry, logger)

	assert.NotNil(t, engine)
	assert.Equal(t, store, engine.storage)
	assert.Equal(t, registry, engine.registry)
	assert.Equal(t, logger, engine.logger)
	assert.Equal(t, 0.1, engine.learningRate)
	assert.Equal(t, 0.01, engine.decayRate)
	assert.Equal(t, 24*time.Hour, engine.feedbackWindow)
	assert.Equal(t, 0.6, engine.minConfidence)
	assert.NotNil(t, engine.patterns)
	assert.NotNil(t, engine.metrics)
}

func TestRecordUsage(t *testing.T) {
	// Create test storage, registry, and logger
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel)

	engine := NewLearningEngine(store, registry, logger)

	// Create test usage analytics
	usage := models.UsageAnalytics{
		ID:                 uuid.New(),
		PromptID:           uuid.New(),
		UsedInGeneration:   true,
		EffectivenessScore: 0.85,
		SessionID:          "test-session",
		GenerationTime:     500,
		UserFeedback:       intPtr(4),
		Context:            []string{"test", "context"},
		GeneratedAt:        time.Now(),
	}

	// Mock storage SaveUsageAnalytics to return nil
	// Since we're using a real storage struct, we'd need to mock this properly
	// For now, we'll test the metrics update functionality

	// Update metrics directly
	engine.updatePromptMetrics(usage)

	// Check that metrics were updated
	assert.NotNil(t, engine.metrics.promptMetrics[usage.PromptID])
	metrics := engine.metrics.promptMetrics[usage.PromptID]
	assert.Greater(t, metrics.SuccessRate, 0.0)
	assert.Equal(t, time.Duration(500)*time.Millisecond, metrics.AverageLatency)
	assert.Greater(t, metrics.UserSatisfaction, 0.0)
}

func TestDetectPattern(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	tests := []struct {
		name               string
		effectiveness      float64
		expectedType       string
		expectedConfidence float64
		shouldDetect       bool
	}{
		{
			name:               "Success Pattern",
			effectiveness:      0.9,
			expectedType:       "success",
			expectedConfidence: 0.9,
			shouldDetect:       true,
		},
		{
			name:               "Failure Pattern",
			effectiveness:      0.2,
			expectedType:       "failure",
			expectedConfidence: 0.8,
			shouldDetect:       true,
		},
		{
			name:          "No Pattern",
			effectiveness: 0.5,
			shouldDetect:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			usage := models.UsageAnalytics{
				EffectivenessScore: tt.effectiveness,
				ErrorMessage:       "test error",
				Context:            []string{"test"},
			}

			pattern := engine.detectPattern(usage)

			if tt.shouldDetect {
				require.NotNil(t, pattern)
				assert.Equal(t, tt.expectedType, pattern.Type)
				assert.Equal(t, tt.expectedConfidence, pattern.Confidence)
			} else {
				assert.Nil(t, pattern)
			}
		})
	}
}

func TestCalculateTimeDecay(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	tests := []struct {
		name        string
		lastUsed    *time.Time
		expectedMin float64
		expectedMax float64
	}{
		{
			name:        "Nil LastUsed",
			lastUsed:    nil,
			expectedMin: 0.0,
			expectedMax: 0.0,
		},
		{
			name:        "Recent Use",
			lastUsed:    timePtr(time.Now().Add(-1 * time.Hour)),
			expectedMin: 0.0,
			expectedMax: 0.01,
		},
		{
			name:        "Old Use",
			lastUsed:    timePtr(time.Now().Add(-7 * 24 * time.Hour)),
			expectedMin: 0.05,
			expectedMax: 0.10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			decay := engine.calculateTimeDecay(tt.lastUsed)
			assert.GreaterOrEqual(t, decay, tt.expectedMin)
			assert.LessOrEqual(t, decay, tt.expectedMax)
		})
	}
}

func TestGetLearningStats(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	// Add some test data
	promptID := uuid.New()
	engine.metrics.promptMetrics[promptID] = &PromptMetrics{
		PromptID:         promptID,
		SuccessRate:      0.8,
		UserSatisfaction: 0.9,
	}

	engine.patterns["test:pattern"] = &Pattern{
		ID:   uuid.New(),
		Type: "success",
	}

	stats := engine.GetLearningStats()

	assert.Equal(t, 1, stats["total_patterns"])
	assert.Equal(t, 1, stats["total_prompts"])
	assert.Equal(t, 0, stats["active_sessions"])
	assert.Equal(t, 0.1, stats["learning_rate"])
	assert.Equal(t, 0.01, stats["decay_rate"])
	assert.Equal(t, 0.6, stats["min_confidence"])
	assert.Equal(t, 0.8, stats["average_success_rate"])
	assert.Equal(t, 0.9, stats["average_satisfaction"])

	patternTypes := stats["pattern_types"].(map[string]int)
	assert.Equal(t, 1, patternTypes["success"])
}

func TestApplyPatternFiltering(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	// Create test prompts
	prompt1 := models.Prompt{
		ID:             uuid.New(),
		Content:        "Test prompt 1",
		RelevanceScore: 0.8,
	}
	prompt2 := models.Prompt{
		ID:             uuid.New(),
		Content:        "Test prompt 2",
		RelevanceScore: 0.6,
	}
	prompt3 := models.Prompt{
		ID:             uuid.New(),
		Content:        "Test prompt 3",
		RelevanceScore: 0.9,
	}

	// Add metrics for prompt1
	engine.metrics.promptMetrics[prompt1.ID] = &PromptMetrics{
		PromptID:    prompt1.ID,
		SuccessRate: 0.9,
	}

	// Add a success pattern
	engine.patterns["success:test"] = &Pattern{
		Type:       "success",
		Confidence: 0.8,
	}

	prompts := []models.Prompt{prompt1, prompt2, prompt3}
	filtered := engine.applyPatternFiltering(prompts, "test input")

	// Should be sorted by score
	assert.Len(t, filtered, 3)
	assert.Equal(t, prompt3.ID, filtered[0].ID) // Highest relevance
	assert.Equal(t, prompt1.ID, filtered[1].ID) // Boosted by metrics and pattern
	assert.Equal(t, prompt2.ID, filtered[2].ID) // Lowest score
}

func TestConsolidatePatterns(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	// Add patterns with different confidence levels
	engine.patterns["high:confidence"] = &Pattern{
		Type:       "success",
		Confidence: 0.8,
	}
	engine.patterns["low:confidence"] = &Pattern{
		Type:       "failure",
		Confidence: 0.2,
	}

	engine.consolidatePatterns()

	// Low confidence pattern should be removed
	assert.Len(t, engine.patterns, 1)
	assert.Contains(t, engine.patterns, "high:confidence")
	assert.NotContains(t, engine.patterns, "low:confidence")
}

func TestCleanupOldMetrics(t *testing.T) {
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	logger := logrus.New()
	engine := NewLearningEngine(store, registry, logger)

	// Add old and new metrics
	oldPromptID := uuid.New()
	newPromptID := uuid.New()

	engine.metrics.promptMetrics[oldPromptID] = &PromptMetrics{
		PromptID:     oldPromptID,
		LastAccessed: time.Now().Add(-48 * time.Hour),
	}
	engine.metrics.promptMetrics[newPromptID] = &PromptMetrics{
		PromptID:     newPromptID,
		LastAccessed: time.Now(),
	}

	engine.metrics.sessionMetrics["old-session"] = &SessionMetrics{
		SessionID: "old-session",
		StartTime: time.Now().Add(-48 * time.Hour),
	}
	const newSessionID = "new-session"
	engine.metrics.sessionMetrics[newSessionID] = &SessionMetrics{
		SessionID: newSessionID,
		StartTime: time.Now(),
	}

	engine.cleanupOldMetrics()

	// Old metrics should be removed
	assert.Len(t, engine.metrics.promptMetrics, 1)
	assert.Contains(t, engine.metrics.promptMetrics, newPromptID)
	assert.Len(t, engine.metrics.sessionMetrics, 1)
	assert.Contains(t, engine.metrics.sessionMetrics, newSessionID)
}

// Helper functions
func intPtr(i int) *int {
	return &i
}

func timePtr(t time.Time) *time.Time {
	return &t
}
