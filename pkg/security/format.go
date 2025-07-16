package security

import (
	"fmt"
	"strings"
)

// SafeFormat prevents format string vulnerabilities by escaping format specifiers
// in user-controlled strings before passing them to fmt.Sprintf
func SafeFormat(format string, args ...interface{}) string {
	// Escape format specifiers in string arguments
	escapedArgs := make([]interface{}, len(args))
	for i, arg := range args {
		switch v := arg.(type) {
		case string:
			escapedArgs[i] = EscapeFormatString(v)
		default:
			escapedArgs[i] = arg
		}
	}
	return fmt.Sprintf(format, escapedArgs...)
}

// EscapeFormatString escapes format specifiers in a string to prevent format string attacks
func EscapeFormatString(s string) string {
	// Replace % with %% to escape format specifiers
	return strings.ReplaceAll(s, "%", "%%")
}

// SafeString safely includes a user-controlled string in a message without format string vulnerabilities
func SafeString(userInput string) string {
	return EscapeFormatString(userInput)
}
