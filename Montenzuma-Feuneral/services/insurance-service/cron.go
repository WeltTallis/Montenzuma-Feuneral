package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"
)

// startMonthlyReminderCron runs a background worker that checks and dispatches
// monthly payment link SMS reminders to active policyholders automatically.
func (a *app) startMonthlyReminderCron(ctx context.Context) {
	log.Println("[CRON] Initializing insurance monthly payment link reminder cron worker...")

	go func() {
		// Run every hour to check if it's the scheduled reminder window
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		// Run an initial check after 10 seconds of server startup
		select {
		case <-time.After(10 * time.Second):
			a.runMonthlyReminderJob(ctx)
		case <-ctx.Done():
			return
		}

		for {
			select {
			case <-ticker.C:
				a.runMonthlyReminderJob(ctx)
			case <-ctx.Done():
				log.Println("[CRON] Monthly payment link reminder cron worker stopped.")
				return
			}
		}
	}()
}

// runMonthlyReminderJob scans for active policies and dispatches the monthly payment link
func (a *app) runMonthlyReminderJob(ctx context.Context) {
	now := time.Now()
	// Run during daytime hours (e.g., between 8 AM and 6 PM)
	hour := now.Hour()
	if hour < 8 || hour > 18 {
		return
	}

	query := `SELECT policy_number, full_name, phone, COALESCE(public_code,''), COALESCE(monthly_premium,0)::float8, cover_type, created_at
	          FROM insurance_policies p
	          WHERE status='active' AND is_deleted=false AND phone != ''
	            AND (last_payment_reminder_at IS NULL OR last_payment_reminder_at < now() - interval '30 days')`

	rows, err := a.db.Query(ctx, query)
	if err != nil {
		log.Printf("[CRON ERROR] Failed to query active policies for monthly reminders: %v", err)
		return
	}
	defer rows.Close()

	sentCount := 0
	for rows.Next() {
		var polNum, name, phone, code, cover string
		var premium float64
		var createdAt time.Time
		if err := rows.Scan(&polNum, &name, &phone, &code, &premium, &cover, &createdAt); err != nil {
			log.Printf("[CRON ERROR] Failed to read a policy for monthly reminders: %v", err)
			return
		}

		cleanPhone := strings.TrimSpace(phone)
		if cleanPhone == "" {
			continue
		}
		if premium <= 0 {
			premium = premiumForCover(cover)
		}
		snapshot, err := a.paymentSnapshot(ctx, polNum, createdAt, premium)
		if err != nil {
			log.Printf("[CRON ERROR] Could not calculate amount due for policy %s: %v", polNum, err)
			continue
		}
		if snapshot.MonthsWithoutPay >= 6 && snapshot.ArrearsAmount > 0 {
			continue
		}

		payLink := paymentLinkURL(code)
		reminderMsg := fmt.Sprintf(
			"Montenzuma Monalisa Funeral Home: Dear %s, your Amani Cover payment of KES %.0f (Policy No: %s) is due, including any unpaid monthly premiums. Pay via M-Pesa: %s. For assistance, call 0740045355",
			name, snapshot.AmountDue, polNum, payLink,
		)

		// Dispatch SMS via the unified SMS notifier
		ok, details := sendSMSNotification(cleanPhone, reminderMsg)
		if ok {
			sentCount++
			if _, err := a.db.Exec(ctx, `UPDATE insurance_policies SET last_payment_reminder_at=now() WHERE policy_number=$1`, polNum); err != nil {
				log.Printf("[CRON ERROR] SMS sent but reminder timestamp update failed for %s: %v", polNum, err)
			}
			log.Printf("[CRON SMS SENT] Policy %s to %s: %s", polNum, cleanPhone, details)
		} else {
			log.Printf("[CRON SMS FAILED] Policy %s to %s: %s", polNum, cleanPhone, details)
		}
	}
	if err := rows.Err(); err != nil {
		log.Printf("[CRON ERROR] Failed while scanning policies for monthly reminders: %v", err)
	}

	if sentCount > 0 {
		log.Printf("[CRON COMPLETED] Dispatched %d monthly payment link SMS reminders.", sentCount)
	}
}
