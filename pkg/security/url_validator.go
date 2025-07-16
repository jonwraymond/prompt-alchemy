package security

import (
	"fmt"
	"net"
	"net/url"
	"strings"
)

// AllowedHosts defines the allowed external API hosts
var AllowedHosts = map[string]bool{
	"api.openai.com":                    true,
	"api.anthropic.com":                 true,
	"generativelanguage.googleapis.com": true,
	"api.openrouter.ai":                 true,
	"openrouter.ai":                     true, // OpenRouter uses this domain too
	"api.x.ai":                          true,
	"localhost":                         true,
	"127.0.0.1":                         true,
	"0.0.0.0":                           true,
}

// ValidateURL checks if a URL is safe to use for HTTP requests
func ValidateURL(urlStr string) error {
	if urlStr == "" {
		return fmt.Errorf("empty URL")
	}

	// Parse the URL
	u, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	// Check scheme
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("invalid scheme: %s (only http/https allowed)", u.Scheme)
	}

	// Extract hostname
	hostname := u.Hostname()
	if hostname == "" {
		return fmt.Errorf("missing hostname")
	}

	// Check if it's an IP address
	if ip := net.ParseIP(hostname); ip != nil {
		// Check for private IP ranges
		if isPrivateIP(ip) {
			// Allow localhost IPs
			if !isLocalhost(ip) {
				return fmt.Errorf("private IP addresses not allowed: %s", hostname)
			}
		}

		// Block other special IPs (0.0.0.0/8, multicast, etc)
		if isSpecialIP(ip) && !isLocalhost(ip) {
			return fmt.Errorf("special IP addresses not allowed: %s", hostname)
		}

		// For non-localhost IPs, they must be in the allowed list
		if !isLocalhost(ip) && !AllowedHosts[hostname] {
			return fmt.Errorf("IP address not in allowed list: %s", hostname)
		}
	} else {
		// It's a domain name - check if it's allowed
		if !isAllowedHost(hostname) {
			return fmt.Errorf("host not in allowed list: %s", hostname)
		}
	}

	return nil
}

// isAllowedHost checks if a hostname is in the allowed list
func isAllowedHost(hostname string) bool {
	hostname = strings.ToLower(hostname)

	// Direct match only - no automatic subdomain allowance for security
	return AllowedHosts[hostname]
}

// isPrivateIP checks if an IP is in a private range
func isPrivateIP(ip net.IP) bool {
	privateRanges := []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"fd00::/8",
	}

	for _, cidr := range privateRanges {
		_, network, _ := net.ParseCIDR(cidr)
		if network != nil && network.Contains(ip) {
			return true
		}
	}

	return false
}

// isLocalhost checks if an IP is localhost
func isLocalhost(ip net.IP) bool {
	return ip.IsLoopback() || ip.String() == "127.0.0.1" || ip.String() == "::1"
}

// isSpecialIP checks for special purpose IPs
func isSpecialIP(ip net.IP) bool {
	// Allow 0.0.0.0 for local binding
	if ip.String() == "0.0.0.0" {
		return false
	}

	// Check for various special IPs
	if ip.IsUnspecified() || // 0.0.0.0 or :: (but we allowed 0.0.0.0 above)
		ip.IsMulticast() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsInterfaceLocalMulticast() {
		return true
	}

	// Check for specific ranges
	specialRanges := []string{
		"169.254.0.0/16",     // Link-local (includes AWS metadata)
		"224.0.0.0/4",        // Multicast
		"255.255.255.255/32", // Broadcast
	}

	for _, cidr := range specialRanges {
		_, network, _ := net.ParseCIDR(cidr)
		if network != nil && network.Contains(ip) {
			return true
		}
	}

	return false
}

// ValidateBaseURL validates a base URL for provider configuration
func ValidateBaseURL(baseURL string) error {
	if baseURL == "" {
		return nil // Empty is OK, will use default
	}

	// Ensure it has a scheme
	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		baseURL = "https://" + baseURL
	}

	return ValidateURL(baseURL)
}
