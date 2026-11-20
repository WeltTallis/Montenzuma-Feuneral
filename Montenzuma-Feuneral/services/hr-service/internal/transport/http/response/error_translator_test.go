package response

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewErrorTranslator(t *testing.T) {
	translator := NewErrorTranslator()
	assert.NotNil(t, translator)
	assert.NotEmpty(t, translator.technicalErrorMappings)
	assert.NotEmpty(t, translator.statusReplacements)
}

func TestGetErrorTranslator(t *testing.T) {
	translator1 := GetErrorTranslator()
	translator2 := GetErrorTranslator()

	assert.NotNil(t, translator1)
	assert.NotNil(t, translator2)
	// Should be singleton
	assert.Equal(t, translator1, translator2)
}

func TestErrorTranslator_TranslateError(t *testing.T) {
	translator := NewErrorTranslator()

	tests := []struct {
		name          string
		err           error
		expectedMsg   string
		shouldContain string
	}{
		{
			name:        "Paytype default value error",
			err:         errors.New("Field 'paytype' doesn't have a default value"),
			expectedMsg: "Internal server error: missing pay type configuration",
		},
		{
			name:        "Pay_type default value error",
			err:         errors.New("Field 'pay_type' doesn't have a default value"),
			expectedMsg: "Internal server error: missing pay type configuration",
		},
		{
			name:        "Payrate default value error",
			err:         errors.New("Field 'payrate' doesn't have a default value"),
			expectedMsg: "Internal server error: missing pay rate configuration",
		},
		{
			name:        "Employee not assigned error",
			err:         errors.New("Employee is not assigned to this project"),
			expectedMsg: "The employee is not assigned to this project",
		},
		{
			name:        "No active payrate error",
			err:         errors.New("No active payrate configuration found"),
			expectedMsg: "No active pay rate configuration was found for this project",
		},
		{
			name:        "Saturday day_type error",
			err:         errors.New("Saturday requires day_type"),
			expectedMsg: "Select a day type for Saturday: regular day or rest day",
		},
		{
			name:        "Timesheet already exists",
			err:         errors.New("Timesheet entry already exists"),
			expectedMsg: "A timesheet entry already exists for this employee, project, date and pay type",
		},
		{
			name:        "Total hours exceeded",
			err:         errors.New("Total hours worked per day cannot exceed 24 hours"),
			expectedMsg: "Total working hours per day cannot exceed 24",
		},
		{
			name:          "Array indexing cleanup",
			err:           errors.New("timesheet[0]: Some error message"),
			shouldContain: "Some error message",
		},
		{
			name:          "Generic error with status replacement",
			err:           errors.New("current status is 'pending_approval' which cannot transition to 'approved'"),
			shouldContain: "pending approval",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := translator.TranslateError(tt.err)
			if tt.expectedMsg != "" {
				assert.Equal(t, tt.expectedMsg, result)
			}
			if tt.shouldContain != "" {
				assert.Contains(t, result, tt.shouldContain)
			}
		})
	}
}

func TestErrorTranslator_RemoveArrayIndexing(t *testing.T) {
	translator := NewErrorTranslator()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Remove array indexing at beginning",
			input:    "timesheet[0]: Error message",
			expected: "Error message",
		},
		{
			name:     "Remove multiple array indexing",
			input:    "timesheet[5]: Another timesheet[2]: error",
			expected: "Another error",
		},
		{
			name:     "Remove field indexing",
			input:    "field[3]: Some validation error",
			expected: "Some validation error",
		},
		{
			name:     "No array indexing",
			input:    "Just a regular error message",
			expected: "Just a regular error message",
		},
		{
			name:     "Complex array indexing",
			input:    "data[10]: timesheet[0]: validation failed",
			expected: "validation failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := translator.removeArrayIndexing(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestErrorTranslator_CleanMessage(t *testing.T) {
	translator := NewErrorTranslator()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Clean array indexing",
			input:    "field[0]: validation error",
			expected: "validation error",
		},
		{
			name:     "Replace status - pending_approval",
			input:    "Status is 'pending_approval'",
			expected: "Status is 'pending approval'",
		},
		{
			name:     "Replace status - approved",
			input:    "Status changed to 'approved'",
			expected: "Status changed to 'approved'",
		},
		{
			name:     "Replace status - rejected",
			input:    "Status is 'rejected'",
			expected: "Status is 'rejected'",
		},
		{
			name:     "Replace status - draft",
			input:    "Status is 'draft'",
			expected: "Status is 'draft'",
		},
		{
			name:     "Replace technical terms",
			input:    "current status is pending_approval which cannot transition to approved",
			expected: "the current status is pending approval which cannot be changed to approved",
		},
		{
			name:     "Complex message with multiple replacements",
			input:    "timesheet[2]: current status is 'pending_approval', which cannot transition to 'approved'",
			expected: "the current status is 'pending approval', which cannot be changed to 'approved'",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := translator.CleanMessage(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestErrorTranslator_AddTechnicalErrorMapping(t *testing.T) {
	translator := NewErrorTranslator()
	initialSize := len(translator.technicalErrorMappings)

	// Add a new mapping
	translator.AddTechnicalErrorMapping("custom error pattern", "Custom user-friendly message")

	assert.Equal(t, initialSize+1, len(translator.technicalErrorMappings))

	// Test that the new mapping works
	err := errors.New("This contains custom error pattern in it")
	result := translator.TranslateError(err)
	assert.Equal(t, "Custom user-friendly message", result)
}

func TestErrorTranslator_StatusReplacements(t *testing.T) {
	translator := NewErrorTranslator()

	tests := []struct {
		name     string
		input    string
		contains string
	}{
		{
			name:     "pending_approval with quotes",
			input:    "'pending_approval'",
			contains: "'pending approval'",
		},
		{
			name:     "approved with quotes",
			input:    "'approved'",
			contains: "'approved'",
		},
		{
			name:     "rejected with quotes",
			input:    "'rejected'",
			contains: "'rejected'",
		},
		{
			name:     "draft with quotes",
			input:    "'draft'",
			contains: "'draft'",
		},
		{
			name:     "pending_approval without quotes",
			input:    "pending_approval",
			contains: "pending approval",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := translator.CleanMessage(tt.input)
			assert.Contains(t, result, tt.contains)
		})
	}
}
