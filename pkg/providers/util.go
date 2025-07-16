package providers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/jonwraymond/prompt-alchemy/internal/log"
)

// WithRetry executes an HTTP request with exponential backoff
func WithRetry(ctx context.Context, config Config, fn func() (*http.Response, error)) (*http.Response, error) {
	// Note: backoff library manages retry count internally

	logger := log.GetLogger()
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 30 * time.Second

	var resp *http.Response
	var attempt int
	err := backoff.Retry(func() error {
		var err error
		resp, err = fn()
		if err != nil {
			logger.WithFields(map[string]interface{}{
				"attempt": attempt,
				"error":   err,
			}).Warn("Request failed, retrying...")
			attempt++
			return err
		}
		if resp.StatusCode >= 500 || resp.StatusCode == 429 {
			err = fmt.Errorf("retryable error: status code %d", resp.StatusCode)
			logger.WithFields(map[string]interface{}{
				"attempt":     attempt,
				"status_code": resp.StatusCode,
			}).Warn("Request failed with retryable status, retrying...")
			attempt++
			return err
		}
		return nil
	}, backoff.WithContext(b, ctx))

	if err != nil {
		logger.WithField("total_attempts", attempt).WithError(err).Error("Request failed after all retry attempts")
	}

	return resp, err
}
