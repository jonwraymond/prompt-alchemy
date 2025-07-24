package v1

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jonwraymond/prompt-alchemy/pkg/providers"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

// TestSimpleHealthCheck tests basic handler functionality
func TestSimpleHealthCheck(t *testing.T) {
	// Create handler with nil dependencies (health check doesn't need them)
	handler := NewV1Handler(nil, providers.NewRegistry(), nil, nil, nil, logrus.New())

	// Create request
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	// Call handler
	handler.HandleHealth(rr, req)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "healthy")
}

// TestSimpleStatus tests status endpoint
func TestSimpleStatus(t *testing.T) {
	handler := NewV1Handler(nil, providers.NewRegistry(), nil, nil, nil, logrus.New())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/status", nil)
	rr := httptest.NewRecorder()

	handler.HandleStatus(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
}

// TestSimpleInfo tests info endpoint
func TestSimpleInfo(t *testing.T) {
	handler := NewV1Handler(nil, providers.NewRegistry(), nil, nil, nil, logrus.New())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/info", nil)
	rr := httptest.NewRecorder()

	handler.HandleInfo(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
}

// TestListProvidersSimple tests listing providers
func TestListProvidersSimple(t *testing.T) {
	registry := providers.NewRegistry()
	handler := NewV1Handler(nil, registry, nil, nil, nil, logrus.New())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	rr := httptest.NewRecorder()

	handler.HandleListProviders(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
}
