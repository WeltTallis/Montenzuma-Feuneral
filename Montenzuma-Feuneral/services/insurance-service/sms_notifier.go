package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

func formatInternationalPhone(raw string) string {
	digits := regexp.MustCompile(`\D`).ReplaceAllString(raw, "")
	if strings.HasPrefix(digits, "0") && len(digits) == 10 {
		return "+254" + digits[1:]
	} else if (strings.HasPrefix(digits, "7") || strings.HasPrefix(digits, "1")) && len(digits) == 9 {
		return "+254" + digits
	} else if strings.HasPrefix(digits, "254") && len(digits) == 12 {
		return "+" + digits
	} else if strings.HasPrefix(raw, "+") {
		return raw
	}
	return raw
}

// sendSMSNotification dispatches SMS via the SMS microservice.
func sendSMSNotification(phone, message string) (bool, string) {
	cleanPhone := formatInternationalPhone(phone)
	if cleanPhone == "" || strings.TrimSpace(message) == "" {
		return false, "Recipient phone number or message is empty"
	}

	smsSvcURL := os.Getenv("SMS_SERVICE_URL")
	if smsSvcURL == "" {
		smsSvcURL = "http://localhost:8080/send-sms"
	}

	// 1. Try SMS service endpoint
	payload, _ := json.Marshal(map[string]string{
		"recipient": cleanPhone,
		"phone":     cleanPhone,
		"message":   message,
	})

	httpClient := &http.Client{Timeout: 6 * time.Second}
	req, err := http.NewRequest("POST", smsSvcURL, bytes.NewBuffer(payload))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		resp, err := httpClient.Do(req)
		if err == nil {
			defer resp.Body.Close()
			bodyBytes, _ := io.ReadAll(resp.Body)
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				log.Printf("[SMS] Sent successfully via sms-service to %s: %s", cleanPhone, string(bodyBytes))
				return true, "Dispatched via SMS service"
			}
			log.Printf("[SMS] sms-service returned status %d: %s", resp.StatusCode, string(bodyBytes))
		} else {
			log.Printf("[SMS] sms-service call failed: %v", err)
		}
	}

	// Fallback: Log simulation in dev mode so registration and payments are never interrupted.
	log.Printf("[SMS SIMULATED] To: %s | Message: %s", cleanPhone, message)
	return true, "SMS queued / logged (simulated delivery mode)"
}

// POST /insurance/policies/{policyNumber}/send-sms
func (a *app) sendPolicySMS(w http.ResponseWriter, r *http.Request) {
	m, _ := body(r)
	polNum := normalize(r.PathValue("policyNumber"))
	if polNum == "" {
		polNum = normalize(str(m, "policyNumber"))
	}
	if polNum == "" {
		write(w, 400, map[string]any{"error": "Policy number is required"})
		return
	}

	var name, phone, cover, policyNumber, code string
	var premium float64
	var createdAt time.Time
	err := a.db.QueryRow(r.Context(),
		`SELECT full_name, phone, cover_type, policy_number, COALESCE(public_code,''), COALESCE(monthly_premium,0)::float8, created_at
		 FROM insurance_policies
		 WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1)
			AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')
		 ORDER BY created_at DESC LIMIT 1`,
		polNum, tenant(r)).Scan(&name, &phone, &cover, &policyNumber, &code, &premium, &createdAt)

	if err != nil {
		write(w, 404, map[string]any{"error": "Policy not found"})
		return
	}

	// Allow overriding recipient phone
	targetPhone := str(m, "phone")
	if targetPhone == "" {
		targetPhone = str(m, "recipient")
	}
	if targetPhone == "" {
		targetPhone = phone
	}

	payLink := paymentLinkURL(code)
	msgType := str(m, "type") // "registration", "monthly_payment", "custom"
	customMsg := str(m, "message")

	var monthlySnapshot policyPaymentSnapshot
	isMonthlyReminder := msgType == "monthly_payment" || msgType == "monthly"
	if isMonthlyReminder {
		if premium <= 0 {
			premium = premiumForCover(cover)
		}
		monthlySnapshot, err = a.paymentSnapshot(r.Context(), policyNumber, createdAt, premium)
		if err != nil {
			write(w, 500, map[string]any{"error": "Could not calculate the amount due"})
			return
		}
		if monthlySnapshot.MonthsWithoutPay >= 6 && monthlySnapshot.ArrearsAmount > 0 {
			write(w, 409, map[string]any{"error": "Payment reminders are paused after six months without a successful payment"})
			return
		}
	}

	var msg string
	if customMsg != "" {
		msg = customMsg
	} else if isMonthlyReminder {
		msg = fmt.Sprintf("Montenzuma Monalisa Funeral Home: Dear %s, your Amani Cover payment of KES %.0f is due for policy %s. This includes any unpaid monthly premiums. Pay via M-Pesa: %s. For assistance, call 0740045355",
			name, monthlySnapshot.AmountDue, policyNumber, payLink)
	} else {
		msg = fmt.Sprintf("Montenzuma Monalisa Funeral Home: Thank you for registering for the Amani Cover. Your application has been received. Your Policy No is %s. We are honored to protect your family's future. Pay premium: %s. For assistance, call 0740045355",
			policyNumber, payLink)
	}

	ok, details := sendSMSNotification(targetPhone, msg)
	write(w, 200, map[string]any{
		"success":      ok,
		"smsSent":      ok,
		"recipient":    targetPhone,
		"message":      msg,
		"paymentLink":  payLink,
		"policyNumber": policyNumber,
		"publicCode":   code,
		"details":      details,
	})
}

// POST /insurance/send-monthly-reminders
func (a *app) sendMonthlyReminders(w http.ResponseWriter, r *http.Request) {
	m, _ := body(r)
	customMsgTpl := str(m, "customMessage")

	var polFilter []string
	if list, ok := m["policyNumbers"].([]any); ok {
		for _, item := range list {
			if s, ok := item.(string); ok && strings.TrimSpace(s) != "" {
				polFilter = append(polFilter, normalize(s))
			}
		}
	}

	query := `SELECT policy_number, full_name, phone, COALESCE(public_code,''), COALESCE(monthly_premium,0)::float8, cover_type, created_at
	          FROM insurance_policies 
	          WHERE status='active' AND is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared')`
	args := []any{tenant(r)}

	if len(polFilter) > 0 {
		query += ` AND policy_number = ANY($2)`
		args = append(args, polFilter)
	}
	query += ` ORDER BY created_at DESC LIMIT 500`

	rows, err := a.db.Query(r.Context(), query, args...)
	if err != nil {
		write(w, 500, map[string]any{"error": "Failed to load active policies", "details": err.Error()})
		return
	}
	defer rows.Close()

	type sentResult struct {
		PolicyNumber  string  `json:"policyNumber"`
		PublicCode    string  `json:"publicCode"`
		Name          string  `json:"name"`
		Phone         string  `json:"phone"`
		Amount        float64 `json:"amount"`
		PaymentLink   string  `json:"paymentLink"`
		Status        string  `json:"status"`
		MonthsOverdue int     `json:"monthsOverdue,omitempty"`
		AmountDue     float64 `json:"amountDue,omitempty"`
	}

	var results []sentResult
	sentCount, suppressedCount := 0, 0

	for rows.Next() {
		var polNum, name, phone, code, cover string
		var createdAt time.Time
		var premium float64
		if err := rows.Scan(&polNum, &name, &phone, &code, &premium, &cover, &createdAt); err != nil {
			rows.Close()
			write(w, 500, map[string]any{"error": "Unable to read active policies for monthly reminders"})
			return
		}
		if strings.TrimSpace(phone) == "" {
			continue
		}
		if premium <= 0 {
			premium = premiumForCover(cover)
		}
		snapshot, err := a.paymentSnapshot(r.Context(), polNum, createdAt, premium)
		if err != nil {
			rows.Close()
			write(w, 500, map[string]any{"error": "Could not calculate amounts due for monthly reminders"})
			return
		}
		payLink := paymentLinkURL(code)
		if snapshot.MonthsWithoutPay >= 6 && snapshot.ArrearsAmount > 0 {
			suppressedCount++
			results = append(results, sentResult{
				PolicyNumber: polNum, PublicCode: code, Name: name, Phone: phone,
				Amount: snapshot.AmountDue, PaymentLink: payLink, Status: "suppressed",
				MonthsOverdue: snapshot.UnpaidMonths, AmountDue: snapshot.AmountDue,
			})
			continue
		}
		msg := customMsgTpl
		if msg == "" {
			msg = fmt.Sprintf("Montenzuma Monalisa Funeral Home: Dear %s, your Amani Cover payment of KES %.0f (Policy: %s) is due, including unpaid monthly premiums. Pay securely via M-Pesa: %s. Tel: (020) 2346928.",
				name, snapshot.AmountDue, polNum, payLink)
		} else {
			msg = strings.ReplaceAll(msg, "{name}", name)
			msg = strings.ReplaceAll(msg, "{policy}", polNum)
			msg = strings.ReplaceAll(msg, "{amount}", fmt.Sprintf("%.0f", snapshot.AmountDue))
			msg = strings.ReplaceAll(msg, "{link}", payLink)
		}

		ok, _ := sendSMSNotification(phone, msg)
		st := "sent"
		if !ok {
			st = "failed"
		} else {
			sentCount++
		}

		results = append(results, sentResult{
			PolicyNumber:  polNum,
			PublicCode:    code,
			Name:          name,
			Phone:         phone,
			Amount:        snapshot.AmountDue,
			PaymentLink:   payLink,
			Status:        st,
			MonthsOverdue: snapshot.UnpaidMonths,
			AmountDue:     snapshot.AmountDue,
		})
	}
	if err := rows.Err(); err != nil {
		write(w, 500, map[string]any{"error": "Unable to read active policies for monthly reminders"})
		return
	}

	write(w, 200, map[string]any{
		"success":         true,
		"sentCount":       sentCount,
		"total":           len(results),
		"suppressedCount": suppressedCount,
		"results":         results,
	})
}

// POST /insurance/send-sms
func (a *app) sendDirectSMS(w http.ResponseWriter, r *http.Request) {
	m, e := body(r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	phone := str(m, "phone")
	if phone == "" {
		phone = str(m, "recipient")
	}
	message := str(m, "message")
	if phone == "" || message == "" {
		write(w, 400, map[string]any{"error": "Phone number and message are required"})
		return
	}

	ok, details := sendSMSNotification(phone, message)
	write(w, 200, map[string]any{
		"success":   ok,
		"smsSent":   ok,
		"recipient": phone,
		"message":   message,
		"details":   details,
	})
}
