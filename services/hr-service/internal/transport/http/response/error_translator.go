package response

import (
	"regexp"
	"strings"

)

// ErrorTranslator handles the translation of technical errors to user-friendly messages.
type ErrorTranslator struct {
	// Map of technical error patterns to user-friendly English messages.
	technicalErrorMappings map[string]string
	// Map of internal status values to user-friendly labels.
	statusReplacements map[string]string
}

// NewErrorTranslator creates a new error translator instance
func NewErrorTranslator() *ErrorTranslator {
	return &ErrorTranslator{
		technicalErrorMappings: map[string]string{
			"Field 'paytype' doesn't have a default value":                                        "Internal server error: missing pay type configuration",
			"Field 'pay_type' doesn't have a default value":                                       "Internal server error: missing pay type configuration",
			"Field 'payrate' doesn't have a default value":                                        "Internal server error: missing pay rate configuration",
			"Field 'pay_rate' doesn't have a default value":                                       "Internal server error: missing pay rate configuration",
			"Employee is not assigned to this project":                                            "The employee is not assigned to this project",
			"No active payrate configuration found":                                               "No active pay rate configuration was found for this project",
			"Saturday requires day_type":                                                          "Select a day type for Saturday: regular day or rest day",
			"Timesheet entry already exists":                                                      "A timesheet entry already exists for this employee, project, date and pay type",
			"failed to set payrate for path":                                                      "The pay rate configuration is invalid for the selected work type",
			"Total hours worked per day cannot exceed 24 hours":                                   "Total working hours per day cannot exceed 24",
			"current status is 'pending_approval', which cannot transition to 'pending_approval'": "A timesheet entry for this employee, project and date is already pending approval",
			"current status is 'approved', which cannot transition to 'pending_approval'":         "A timesheet entry for this employee, project and date has already been approved",
		},
		statusReplacements: map[string]string{
			"'pending_approval'": "'pending approval'",
			"'approved'":         "'approved'",
			"'rejected'":         "'rejected'",
			"'draft'":            "'draft'",
			"pending_approval":   "pending approval",
			"approved":           "approved",
			"rejected":           "rejected",
			"draft":              "draft",
		},
	}
}

// TranslateError converts technical errors to user-friendly English messages.
func (t *ErrorTranslator) TranslateError(err error) string {
	errMsg := err.Error()

	// First, clean any array indexing from the error message
	cleanedMsg := t.removeArrayIndexing(errMsg)

	// Check for specific technical error patterns
	for pattern, userFriendlyMsg := range t.technicalErrorMappings {
		if strings.Contains(cleanedMsg, pattern) {
			return userFriendlyMsg
		}
	}

	// Apply general message cleaning
	return t.CleanMessage(cleanedMsg)
}

// removeArrayIndexing removes array indexing patterns from error messages
func (t *ErrorTranslator) removeArrayIndexing(errorMsg string) string {
	// Remove array indexing patterns at the beginning like "timesheet[0]:"
	re1 := regexp.MustCompile(`^timesheet\[\d+\]:\s*`)
	errorMsg = re1.ReplaceAllString(errorMsg, "")

	// Remove any array indexing patterns anywhere in the message like "timesheet[N]:"
	re2 := regexp.MustCompile(`timesheet\[\d+\]:\s*`)
	errorMsg = re2.ReplaceAllString(errorMsg, "")

	// Remove any field indexing patterns like "field[0]:" or similar
	re3 := regexp.MustCompile(`\w+\[\d+\]:\s*`)
	errorMsg = re3.ReplaceAllString(errorMsg, "")

	return strings.TrimSpace(errorMsg)
}

// CleanMessage removes technical array indexing patterns and internal values from error messages
func (t *ErrorTranslator) CleanMessage(message string) string {
	// Remove array indexing patterns like "timesheet[0]:", "field[N]:", etc.
	re := regexp.MustCompile(`\w+\[\d+\]:\s*`)
	message = re.ReplaceAllString(message, "")

	// Also handle the specific case where it appears after a colon like ": timesheet[0]:"
	re2 := regexp.MustCompile(`:\s*\w+\[\d+\]:\s*`)
	message = re2.ReplaceAllString(message, ": ")

	// Replace internal status values with user-friendly labels.
	for internal, userFriendly := range t.statusReplacements {
		message = strings.ReplaceAll(message, internal, userFriendly)
	}

	// Replace technical terms with clearer wording.
	message = strings.ReplaceAll(message, "cannot transition to", "cannot be changed to")
	message = strings.ReplaceAll(message, "current status is", "the current status is")

	return strings.TrimSpace(message)
}

// AddTechnicalErrorMapping allows adding new error mappings at runtime
func (t *ErrorTranslator) AddTechnicalErrorMapping(technicalPattern string, userFriendlyMessage string) {
	t.technicalErrorMappings[technicalPattern] = userFriendlyMessage
}

// GetDefaultTranslator returns a singleton instance of the error translator
var defaultTranslator *ErrorTranslator

func GetErrorTranslator() *ErrorTranslator {
	if defaultTranslator == nil {
		defaultTranslator = NewErrorTranslator()
	}
	return defaultTranslator
}
