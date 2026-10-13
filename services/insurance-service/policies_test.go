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

	if matched := regexp.MustCompile(`^MON-AC-2026-[A-F0-9]{24}$`).MatchString(policyNumber); !matched {
		t.Fatalf("newPolicyNumber() = %q, want MON-AC-2026- followed by 24 uppercase hex characters", policyNumber)
	}
}

func TestBuildPaymentSnapshotIncludesAllUnpaidMonthlyPremiums(t *testing.T) {
	created := time.Date(2026, time.January, 12, 0, 0, 0, 0, time.UTC)
	now := time.Date(2026, time.March, 13, 0, 0, 0, 0, time.UTC)
	snapshot := buildPaymentSnapshot(created, time.Time{}, now, 1000, 1000)

	if snapshot.UnpaidMonths != 2 {
		t.Fatalf("UnpaidMonths = %d, want 2", snapshot.UnpaidMonths)
	}
	if snapshot.ArrearsAmount != 2000 {
		t.Fatalf("ArrearsAmount = %.0f, want 2000", snapshot.ArrearsAmount)
	}
	if snapshot.AmountDue != 2000 {
		t.Fatalf("AmountDue = %.0f, want 2000", snapshot.AmountDue)
	}
}

func TestBuildPaymentSnapshotFlagsSixMonthsWithoutPayment(t *testing.T) {
	created := time.Date(2026, time.January, 12, 0, 0, 0, 0, time.UTC)
	lastPaid := time.Date(2026, time.April, 12, 0, 0, 0, 0, time.UTC)
	now := time.Date(2026, time.October, 13, 0, 0, 0, 0, time.UTC)
	snapshot := buildPaymentSnapshot(created, lastPaid, now, 1000, 1000)

	if snapshot.MonthsWithoutPay != 6 {
		t.Fatalf("MonthsWithoutPay = %d, want 6", snapshot.MonthsWithoutPay)
	}
}
