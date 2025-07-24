package httputil

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWriteJSON(t *testing.T) {
	tests := []struct {
		name            string
		status          int
		data            interface{}
		expectedStatus  int
		expectedSuccess bool
	}{
		{
			name:            "success response",
			status:          http.StatusOK,
			data:            map[string]string{"message": "success"},
			expectedStatus:  http.StatusOK,
			expectedSuccess: true,
		},
		{
			name:            "created response",
			status:          http.StatusCreated,
			data:            map[string]string{"id": "123"},
			expectedStatus:  http.StatusCreated,
			expectedSuccess: true,
		},
		{
			name:            "client error response",
			status:          http.StatusBadRequest,
			data:            map[string]string{"error": "bad request"},
			expectedStatus:  http.StatusBadRequest,
			expectedSuccess: false,
		},
		{
			name:            "server error response",
			status:          http.StatusInternalServerError,
			data:            map[string]string{"error": "internal error"},
			expectedStatus:  http.StatusInternalServerError,
			expectedSuccess: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			WriteJSON(recorder, tt.status, tt.data)

			// Check status code
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			// Check content type
			assert.Equal(t, "application/json; charset=utf-8", recorder.Header().Get("Content-Type"))

			// Parse response body
			var response Response
			err := json.Unmarshal(recorder.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Check response structure
			assert.Equal(t, tt.expectedSuccess, response.Success)
			assert.NotZero(t, response.Timestamp)
			// Compare JSON representation to handle interface{} conversion
			expectedJSON, _ := json.Marshal(tt.data)
			actualJSON, _ := json.Marshal(response.Data)
			assert.JSONEq(t, string(expectedJSON), string(actualJSON))
			assert.Nil(t, response.Error)
		})
	}
}

func TestWriteError(t *testing.T) {
	tests := []struct {
		name           string
		status         int
		code           string
		message        string
		expectedStatus int
	}{
		{
			name:           "bad request error",
			status:         http.StatusBadRequest,
			code:           "INVALID_INPUT",
			message:        "Input validation failed",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "unauthorized error",
			status:         http.StatusUnauthorized,
			code:           "UNAUTHORIZED",
			message:        "Authentication required",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "internal server error",
			status:         http.StatusInternalServerError,
			code:           "INTERNAL_ERROR",
			message:        "Something went wrong",
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			WriteError(recorder, tt.status, tt.code, tt.message)

			// Check status code
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			// Check content type
			assert.Equal(t, "application/json; charset=utf-8", recorder.Header().Get("Content-Type"))

			// Parse response body
			var response Response
			err := json.Unmarshal(recorder.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Check response structure
			assert.False(t, response.Success)
			assert.NotZero(t, response.Timestamp)
			assert.Nil(t, response.Data)
			assert.NotNil(t, response.Error)
			assert.Equal(t, tt.code, response.Error.Code)
			assert.Equal(t, tt.message, response.Error.Message)
		})
	}
}

func TestWriteErrorWithDetails(t *testing.T) {
	recorder := httptest.NewRecorder()
	code := "VALIDATION_ERROR"
	message := "Field validation failed"
	details := "Email field is required"

	WriteErrorWithDetails(recorder, http.StatusBadRequest, code, message, details)

	// Check status code
	assert.Equal(t, http.StatusBadRequest, recorder.Code)

	// Parse response body
	var response Response
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check response structure
	assert.False(t, response.Success)
	assert.NotNil(t, response.Error)
	assert.Equal(t, code, response.Error.Code)
	assert.Equal(t, message, response.Error.Message)
	assert.Equal(t, details, response.Error.Details)
}

func TestWritePaginatedJSON(t *testing.T) {
	recorder := httptest.NewRecorder()
	data := []string{"item1", "item2", "item3"}
	pagination := &PaginationInfo{
		Page:       1,
		Limit:      10,
		Total:      25,
		TotalPages: 3,
		HasNext:    true,
		HasPrev:    false,
	}

	WritePaginatedJSON(recorder, http.StatusOK, data, pagination)

	// Check status code
	assert.Equal(t, http.StatusOK, recorder.Code)

	// Parse response body
	var response PaginatedResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check response structure
	assert.True(t, response.Success)
	// Compare JSON representation to handle interface{} conversion
	expectedJSON, _ := json.Marshal(data)
	actualJSON, _ := json.Marshal(response.Data)
	assert.JSONEq(t, string(expectedJSON), string(actualJSON))
	assert.Equal(t, pagination, response.Pagination)
}

func TestCalculatePagination(t *testing.T) {
	tests := []struct {
		name            string
		page            int
		limit           int
		total           int
		expectedPage    int
		expectedLimit   int
		expectedTotal   int
		expectedPages   int
		expectedHasNext bool
		expectedHasPrev bool
	}{
		{
			name:            "first page",
			page:            1,
			limit:           10,
			total:           25,
			expectedPage:    1,
			expectedLimit:   10,
			expectedTotal:   25,
			expectedPages:   3,
			expectedHasNext: true,
			expectedHasPrev: false,
		},
		{
			name:            "middle page",
			page:            2,
			limit:           10,
			total:           25,
			expectedPage:    2,
			expectedLimit:   10,
			expectedTotal:   25,
			expectedPages:   3,
			expectedHasNext: true,
			expectedHasPrev: true,
		},
		{
			name:            "last page",
			page:            3,
			limit:           10,
			total:           25,
			expectedPage:    3,
			expectedLimit:   10,
			expectedTotal:   25,
			expectedPages:   3,
			expectedHasNext: false,
			expectedHasPrev: true,
		},
		{
			name:            "zero page defaults to 1",
			page:            0,
			limit:           10,
			total:           25,
			expectedPage:    1,
			expectedLimit:   10,
			expectedTotal:   25,
			expectedPages:   3,
			expectedHasNext: true,
			expectedHasPrev: false,
		},
		{
			name:            "zero limit defaults to 20",
			page:            1,
			limit:           0,
			total:           25,
			expectedPage:    1,
			expectedLimit:   20,
			expectedTotal:   25,
			expectedPages:   2,
			expectedHasNext: true,
			expectedHasPrev: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pagination := CalculatePagination(tt.page, tt.limit, tt.total)

			assert.Equal(t, tt.expectedPage, pagination.Page)
			assert.Equal(t, tt.expectedLimit, pagination.Limit)
			assert.Equal(t, tt.expectedTotal, pagination.Total)
			assert.Equal(t, tt.expectedPages, pagination.TotalPages)
			assert.Equal(t, tt.expectedHasNext, pagination.HasNext)
			assert.Equal(t, tt.expectedHasPrev, pagination.HasPrev)
		})
	}
}

func TestParsePagination(t *testing.T) {
	tests := []struct {
		name          string
		queryParams   map[string]string
		expectedPage  int
		expectedLimit int
	}{
		{
			name:          "default values",
			queryParams:   map[string]string{},
			expectedPage:  1,
			expectedLimit: 20,
		},
		{
			name: "valid values",
			queryParams: map[string]string{
				"page":  "2",
				"limit": "10",
			},
			expectedPage:  2,
			expectedLimit: 10,
		},
		{
			name: "invalid page defaults to 1",
			queryParams: map[string]string{
				"page":  "invalid",
				"limit": "10",
			},
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name: "invalid limit defaults to 20",
			queryParams: map[string]string{
				"page":  "2",
				"limit": "invalid",
			},
			expectedPage:  2,
			expectedLimit: 20,
		},
		{
			name: "limit over 100 defaults to 20",
			queryParams: map[string]string{
				"page":  "1",
				"limit": "150",
			},
			expectedPage:  1,
			expectedLimit: 20,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request with query parameters
			req := httptest.NewRequest("GET", "/test", nil)
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			page, limit := ParsePagination(req)

			assert.Equal(t, tt.expectedPage, page)
			assert.Equal(t, tt.expectedLimit, limit)
		})
	}
}

func TestHelperFunctions(t *testing.T) {
	t.Run("BadRequest", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		BadRequest(recorder, "Invalid input")
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		Unauthorized(recorder, "Auth required")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

	t.Run("Forbidden", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		Forbidden(recorder, "Access denied")
		assert.Equal(t, http.StatusForbidden, recorder.Code)
	})

	t.Run("NotFound", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		NotFound(recorder, "Resource not found")
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		InternalServerError(recorder, "Something went wrong")
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})

	t.Run("NotImplemented", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		NotImplemented(recorder, "Feature not implemented")
		assert.Equal(t, http.StatusNotImplemented, recorder.Code)
	})

	t.Run("Created", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		data := map[string]string{"id": "123"}
		Created(recorder, data)
		assert.Equal(t, http.StatusCreated, recorder.Code)
	})

	t.Run("OK", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		data := map[string]string{"status": "success"}
		OK(recorder, data)
		assert.Equal(t, http.StatusOK, recorder.Code)
	})

	t.Run("NoContent", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		NoContent(recorder)
		assert.Equal(t, http.StatusNoContent, recorder.Code)
		assert.Empty(t, recorder.Body.String())
	})
}

func TestInvalidIntError(t *testing.T) {
	err := &InvalidIntError{Value: "abc"}
	assert.Equal(t, "invalid integer: abc", err.Error())
}

// Benchmark tests
func BenchmarkWriteJSON(b *testing.B) {
	data := map[string]interface{}{
		"id":      "123",
		"message": "success",
		"count":   42,
		"items":   []string{"a", "b", "c"},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		recorder := httptest.NewRecorder()
		WriteJSON(recorder, http.StatusOK, data)
	}
}

func BenchmarkWriteError(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		recorder := httptest.NewRecorder()
		WriteError(recorder, http.StatusBadRequest, "INVALID_INPUT", "Input validation failed")
	}
}

func BenchmarkCalculatePagination(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CalculatePagination(1, 20, 1000)
	}
}
