package security

import (
	"testing"
)

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		// Valid URLs
		{
			name:    "Valid OpenAI URL",
			url:     "https://api.openai.com/v1/chat/completions",
			wantErr: false,
		},
		{
			name:    "Valid localhost URL",
			url:     "http://localhost:8080/api/generate",
			wantErr: false,
		},
		{
			name:    "Valid 127.0.0.1 URL",
			url:     "http://127.0.0.1:11434/api/generate",
			wantErr: false,
		},

		// Invalid URLs - SSRF attempts
		{
			name:    "Private IP 10.x",
			url:     "http://10.0.0.1/internal",
			wantErr: true,
		},
		{
			name:    "Private IP 192.168.x",
			url:     "http://192.168.1.1/admin",
			wantErr: true,
		},
		{
			name:    "Private IP 172.16.x",
			url:     "http://172.16.0.1/secret",
			wantErr: true,
		},
		{
			name:    "Metadata service AWS",
			url:     "http://169.254.169.254/latest/meta-data/",
			wantErr: true,
		},
		{
			name:    "File scheme",
			url:     "file:///etc/passwd",
			wantErr: true,
		},
		{
			name:    "FTP scheme",
			url:     "ftp://evil.com/file",
			wantErr: true,
		},
		{
			name:    "Unknown host",
			url:     "https://evil-site.com/api",
			wantErr: true,
		},
		{
			name:    "0.0.0.0",
			url:     "http://0.0.0.0:8080",
			wantErr: false, // Allowed for local binding
		},
		{
			name:    "Subdomain of allowed host",
			url:     "https://v2.api.openai.com/test",
			wantErr: true, // Subdomains require explicit allowance
		},
		{
			name:    "Invalid subdomain pattern",
			url:     "https://api.openai.com.evil.com/test",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateURL(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateURL() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateBaseURL(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		wantErr bool
	}{
		{
			name:    "Empty base URL",
			baseURL: "",
			wantErr: false,
		},
		{
			name:    "Valid with scheme",
			baseURL: "https://api.openai.com",
			wantErr: false,
		},
		{
			name:    "Valid without scheme",
			baseURL: "api.openai.com",
			wantErr: false,
		},
		{
			name:    "Invalid host",
			baseURL: "http://malicious.com",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateBaseURL(tt.baseURL)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateBaseURL() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
