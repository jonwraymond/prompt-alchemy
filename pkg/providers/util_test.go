package providers

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestWithRetry(t *testing.T) {
	tests := []struct {
		name          string
		config        Config
		fn            func() (*http.Response, error)
		expectedError bool
	}{
		{
			name:   "success on first try",
			config: Config{Retries: 3},
			fn: func() (*http.Response, error) {
				return &http.Response{StatusCode: 200}, nil
			},
			expectedError: false,
		},
		{
			name:   "success after retry",
			config: Config{Retries: 3},
			fn: func() func() (*http.Response, error) {
				attempt := 0
				return func() (*http.Response, error) {
					attempt++
					if attempt < 2 {
						return nil, errors.New("temporary error")
					}
					return &http.Response{StatusCode: 200}, nil
				}
			}(),
			expectedError: false,
		},
		{
			name:   "fail after max retries",
			config: Config{Retries: 2},
			fn: func() (*http.Response, error) {
				return nil, errors.New("persistent error")
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			resp, err := WithRetry(ctx, tt.config, tt.fn)
			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.Equal(t, 200, resp.StatusCode)
			}
		})
	}
}
