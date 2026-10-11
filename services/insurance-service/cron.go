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

	query := `SELECT policy_number, full_name, phone, COALESCE(public_code,''), COALESCE(monthly_premium,0)::float8, tenant_slug, created_at 
	          FROM insurance_policies 
	          WHERE status='active' AND is_deleted=false AND phone != ''`

	rows, err := a.db.Query(ctx, query)
	if err != nil {
		log.Printf("[CRON ERROR] Failed to query active policies for monthly reminders: %v", err)
		return
	}
	defer rows.Close()

	sentCount := 0
	for rows.Next() {
		var polNum, name, phone, code, tenantSlug string
		var premium float64
		var createdAt time.Time
		if err := rows.Scan(&polNum, &name, &phone, &code, &premium, &tenantSlug, &createdAt); err != nil {
			continue
		}

		cleanPhone := strings.TrimSpace(phone)
		if cleanPhone == "" {
			continue
		}

		payLink := paymentLinkURL(code)
		reminderMsg := fmt.Sprintf(
			"Montenzuma Monalisa Funeral Home: Dear %s, your monthly Amani Cover premium of KES %.0f (Policy No: %s) is due. Pay easily via M-Pesa: %s. We are honored to protect your family's future. For assistance, call 0740045355",
			name, premium, code, payLink,
		)

		// Dispatch SMS via the unified SMS notifier
		ok, details := sendSMSNotification(cleanPhone, reminderMsg)
		if ok {
			sentCount++
			log.Printf("[CRON SMS SENT] Policy %s to %s: %s", code, cleanPhone, details)
		} else {
			log.Printf("[CRON SMS FAILED] Policy %s to %s: %s", code, cleanPhone, details)
		}
	}

	if sentCount > 0 {
		log.Printf("[CRON COMPLETED] Dispatched %d monthly payment link SMS reminders.", sentCount)
	}
}
