package main

import (
	"regexp"
	"testing"
	"time"
)

func TestNewPolicyNumberIncludesCompanyYearAndRandomSuffix(t *testing.T) {
	now := time.Date(2026, time.October, 13, 0, 0, 0, 0, time.UTC)
	policyNumber, err := newPolicyNumber(now)
	if err != nil {
		t.Fatalf("newPolicyNumber() error = %v", err)
	}

	if matched := regexp.MustCompile(`^MON-AC-2026-[A-F0-9]{8}$`).MatchString(policyNumber); !matched {
		t.Fatalf("newPolicyNumber() = %q, want MON-AC-2026- followed by 8 uppercase hex characters", policyNumber)
	}
}
