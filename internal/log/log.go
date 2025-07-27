package log

import (
	"os"

	"github.com/sirupsen/logrus"
)

var log = logrus.New()

// SanitizingFormatter wraps another formatter and sanitizes sensitive data
type SanitizingFormatter struct {
	underlying logrus.Formatter
}

// Format implements the logrus.Formatter interface
func (f *SanitizingFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	// Sanitize the message
	entry.Message = SanitizeString(entry.Message)

	// Sanitize the fields
	sanitizedData := make(logrus.Fields)
	for key, value := range entry.Data {
		switch v := value.(type) {
		case string:
			sanitizedData[key] = SanitizeString(v)
		case []byte:
			sanitizedData[key] = SanitizeString(string(v))
		default:
			sanitizedData[key] = value
		}
	}
	entry.Data = sanitizedData

	return f.underlying.Format(entry)
}

func init() {
	log.SetOutput(os.Stdout)
	log.SetLevel(logrus.InfoLevel)
	// Set the sanitizing formatter
	log.SetFormatter(&SanitizingFormatter{
		underlying: &logrus.TextFormatter{
			FullTimestamp: true,
		},
	})
}

func GetLogger() *logrus.Logger {
	return log
}
