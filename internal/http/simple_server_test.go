package http

import (
	"testing"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	"github.com/jonwraymond/prompt-alchemy/internal/learning"
	"github.com/jonwraymond/prompt-alchemy/internal/ranking"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func TestNewSimpleServer(t *testing.T) {
	// Test that NewSimpleServer can be created without panic
	logger := logrus.New()
	store := &storage.Storage{}
	registry := providers.NewRegistry()
	mockEngine := &engine.Engine{}
	ranker := &ranking.Ranker{}
	learner := &learning.LearningEngine{}

	server := NewSimpleServer(
		store,
		registry,
		mockEngine,
		ranker,
		learner,
		logger,
	)

	assert.NotNil(t, server)
	assert.NotNil(t, server.Router())
}
