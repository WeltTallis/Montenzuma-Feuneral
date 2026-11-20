package main

import (
	"fmt"
	"net/http"
	"time"
)

func (a *app) claimDetail(w http.ResponseWriter, r *http.Request) {
	var id int64
	var policyNumber, claimant, claimantID, phone, relationship string
	var deceased, deathDate, cause, place, notes string
	var deathCert, claimantIDDoc, burialPermit, status, reviewNotes string
	var submitted, updated time.Time
	var holder, holderPhone, holderID, cover, policyStatus string
	var people int
	var monthlyPremium float64
	var policyCreated time.Time
	var disbursedAmount, disbursementMethod, disbursementReference, disbursedAtStr, approvedAt, rejectedAt string
	err := a.db.QueryRow(r.Context(), `
		SELECT c.claim_id,c.policy_number,c.claimant_full_name,c.claimant_id_number,c.phone,c.relationship,
		 c.deceased_name,c.death_date::text,c.cause_of_death,c.place_of_death,COALESCE(c.notes,''),
		 COALESCE(c.doc_death_cert_path,''),COALESCE(c.doc_claimant_id_path,''),COALESCE(c.doc_burial_permit_path,''),
		 c.status,COALESCE(c.review_notes,''),c.created_at,c.updated_at,COALESCE(c.disbursed_amount,0)::float8,COALESCE(c.disbursement_method,''),COALESCE(c.disbursement_reference,''),COALESCE(c.disbursed_at::text,''),COALESCE(c.approved_at::text,''),COALESCE(c.rejected_at::text),'
		 COALESCE(p.covered_count,0),COALESCE(p.monthly_premium,0)::float8,COALESCE(p.status,''),COALESCE(p.created_at,c.created_at),
	 c.disbursed_amount,COALESCE(c.disbursement_method,''),COALESCE(c.disbursement_reference,''),COALESCE(c.disbursed_at::text,''),COALESCE(c.approved_at::text,''),COALESCE(c.rejected_at::text)
	 FROM insurance_claims c LEFT JOIN insurance_policies p ON p.policy_id=c.policy_id AND p.is_deleted=false
		WHERE c.claim_id=$1 AND c.is_deleted=false AND (c.tenant_slug=$2 OR c.tenant_slug='system_shared')`,
		r.PathValue("claimId"), tenant(r)).Scan(&id, &policyNumber, &claimant, &claimantID, &phone, &relationship, &deceased, &deathDate, &cause, &place, &notes, &deathCert, &claimantIDDoc, &burialPermit, &status, &reviewNotes, &submitted, &updated, &holder, &holderPhone, &holderID, &cover, &people, &monthlyPremium, &policyStatus, &policyCreated)
	if err != nil {
		write(w, 404, map[string]any{"error": "Claim not found"})
		return
	}
	payments := []map[string]any{}
	var totalContributions float64
	// Fetch related claim events
	var events []map[string]any
	eventRows, err := a.db.Query(r.Context(), `SELECT event_id, event_type, description, created_at FROM insurance_claim_events WHERE claim_id=$1 ORDER BY created_at`, id)
	if err == nil {
		defer eventRows.Close()
		for eventRows.Next() {
			var evID int64
			var evType, evDesc string
			var evCreated time.Time
			if eventRows.Scan(&evID, &evType, &evDesc, &evCreated) == nil {
				events = append(events, map[string]any{
					"eventId":     evID,
					"type":        evType,
					"description": evDesc,
					"createdAt":   evCreated,
				})
			}
		}
	}
	rows, err := a.db.Query(r.Context(), `SELECT payment_id,reference,amount::float8,status,COALESCE(mpesa_receipt,''),created_at FROM insurance_payments WHERE policy_number=$1 AND (tenant_slug=$2 OR tenant_slug='system_shared') ORDER BY created_at DESC`, policyNumber, tenant(r))
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var paymentID int64
			var ref, paymentStatus, receipt string
			var amount float64
			var createdAt time.Time
			if rows.Scan(&paymentID, &ref, &amount, &paymentStatus, &receipt, &createdAt) == nil {
				payments = append(payments, map[string]any{"paymentId": paymentID, "reference": ref, "amount": amount, "status": paymentStatus, "receipt": receipt, "createdAt": createdAt})
				if paymentStatus == "paid" {
					totalContributions += amount
				}
			}
		}
	}
	write(w, 200, map[string]any{"success": true, "claim": map[string]any{
		"claimId": id, "reference": fmt.Sprintf("AMN-C%05d", id), "policyNumber": policyNumber, "claimantFullName": claimant,
		"claimantIdNumber": claimantID, "phone": phone, "relationship": relationship, "deceasedName": deceased, "deathDate": deathDate,
		"causeOfDeath": cause, "placeOfDeath": place, "notes": notes, "deathCertificatePath": deathCert, "claimantIdPath": claimantIDDoc,
		"burialPermitPath": burialPermit, "status": status, "reviewNotes": reviewNotes, "createdAt": submitted, "updatedAt": updated,
		"policy":        map[string]any{"fullName": holder, "phone": holderPhone, "idNumber": holderID, "coverType": cover, "coveredCount": people, "monthlyPremium": monthlyPremium, "status": policyStatus, "createdAt": policyCreated},
		"contributions": payments, "totalContributions": totalContributions,
		"disbursedAmount": disbursedAmount, "disbursementMethod": disbursementMethod, "disbursementReference": disbursementReference,
		"disbursedAt": disbursedAtStr, "approvedAt": approvedAt, "rejectedAt": rejectedAt,
		"events": events,
	}})
}

func (a *app) analytics(w http.ResponseWriter, r *http.Request) {
	var totalContributions float64
	var paidPayments int
	if err := a.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(amount),0)::float8,COUNT(*) FROM insurance_payments WHERE status='paid' AND (tenant_slug=$1 OR tenant_slug='system_shared')`, tenant(r)).Scan(&totalContributions, &paidPayments); err != nil {
		write(w, 500, map[string]any{"error": "Unable to load contribution analytics"})
		return
	}
	var stkAttempts, stkSuccessful, stkFailed, stkPending int
	err := a.db.QueryRow(r.Context(), `
		SELECT COUNT(*),
			COUNT(*) FILTER (WHERE status='paid'),
			COUNT(*) FILTER (WHERE status='failed'),
			COUNT(*) FILTER (WHERE status='pending')
		FROM insurance_payments
		WHERE created_at >= now() - interval '6 months'
			AND (tenant_slug=$1 OR tenant_slug='system_shared')`, tenant(r)).
		Scan(&stkAttempts, &stkSuccessful, &stkFailed, &stkPending)
	if err != nil {
		write(w, 500, map[string]any{"error": "Unable to load STK push analytics"})
		return
	}
	terminalAttempts := stkSuccessful + stkFailed
	successRate, failureRate := 0.0, 0.0
	if terminalAttempts > 0 {
		successRate = float64(stkSuccessful) * 100 / float64(terminalAttempts)
		failureRate = float64(stkFailed) * 100 / float64(terminalAttempts)
	}
	claimsByStatus := map[string]int{}
	claimRows, err := a.db.Query(r.Context(), `SELECT status,COUNT(*) FROM insurance_claims WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared') GROUP BY status`, tenant(r))
	if err != nil {
		write(w, 500, map[string]any{"error": "Unable to load claim analytics"})
		return
	}
	for claimRows.Next() {
		var status string
		var count int
		if err := claimRows.Scan(&status, &count); err != nil {
			claimRows.Close()
			write(w, 500, map[string]any{"error": "Unable to read claim analytics"})
			return
		}
		claimsByStatus[status] = count
	}
	if err := claimRows.Err(); err != nil {
		claimRows.Close()
		write(w, 500, map[string]any{"error": "Unable to read claim analytics"})
		return
	}
	claimRows.Close()

	monthly := []map[string]any{}
	paymentRows, err := a.db.Query(r.Context(), `SELECT to_char(date_trunc('month',created_at),'YYYY-MM') AS month,COALESCE(SUM(amount),0)::float8,COUNT(*) FROM insurance_payments WHERE status='paid' AND created_at>=date_trunc('month',now())-interval '11 months' AND (tenant_slug=$1 OR tenant_slug='system_shared') GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)`, tenant(r))
	if err != nil {
		write(w, 500, map[string]any{"error": "Unable to load monthly contribution analytics"})
		return
	}
	for paymentRows.Next() {
		var month string
		var amount float64
		var count int
		if err := paymentRows.Scan(&month, &amount, &count); err != nil {
			paymentRows.Close()
			write(w, 500, map[string]any{"error": "Unable to read monthly contribution analytics"})
			return
		}
		monthly = append(monthly, map[string]any{"month": month, "amount": amount, "payments": count})
	}
	if err := paymentRows.Err(); err != nil {
		paymentRows.Close()
		write(w, 500, map[string]any{"error": "Unable to read monthly contribution analytics"})
		return
	}
	paymentRows.Close()

	defaulterRows, err := a.db.Query(r.Context(), `
		SELECT p.policy_number,p.full_name,p.phone,p.cover_type,p.created_at,
			COALESCE(p.monthly_premium,0)::float8,
			COALESCE(SUM(pay.amount) FILTER (WHERE pay.status='paid'),0)::float8,
			COALESCE(MAX(pay.created_at) FILTER (WHERE pay.status='paid'),p.created_at),
			COUNT(pay.payment_id) FILTER (WHERE pay.status='paid')
		FROM insurance_policies p
		LEFT JOIN insurance_payments pay ON pay.policy_number=p.policy_number
		WHERE p.status='active' AND p.is_deleted=false
			AND (p.tenant_slug=$1 OR p.tenant_slug='system_shared')
		GROUP BY p.policy_id
		ORDER BY p.created_at DESC`, tenant(r))
	if err != nil {
		write(w, 500, map[string]any{"error": "Unable to load defaulter analytics"})
		return
	}
	defaulters := []map[string]any{}
	now := time.Now()
	for defaulterRows.Next() {
		var policyNumber, name, phone, cover string
		var createdAt, lastPaidAt time.Time
		var premium, paidTotal float64
		var paidCount int
		if err := defaulterRows.Scan(&policyNumber, &name, &phone, &cover, &createdAt, &premium, &paidTotal, &lastPaidAt, &paidCount); err != nil {
			defaulterRows.Close()
			write(w, 500, map[string]any{"error": "Unable to read defaulter analytics"})
			return
		}
		if premium <= 0 {
			premium = premiumForCover(cover)
		}
		if paidCount == 0 {
			lastPaidAt = time.Time{}
		}
		snapshot := buildPaymentSnapshot(createdAt, lastPaidAt, now, premium, paidTotal)
		if snapshot.MonthsWithoutPay >= 6 && snapshot.ArrearsAmount > 0 {
			defaulters = append(defaulters, map[string]any{
				"policyNumber": policyNumber, "name": name, "phone": phone, "coverType": cover,
				"monthlyPremium": premium, "arrearsAmount": snapshot.ArrearsAmount,
				"unpaidMonths": snapshot.UnpaidMonths, "monthsWithoutPayment": snapshot.MonthsWithoutPay,
				"lastPaidAt": func() any {
					if paidCount == 0 {
						return nil
					}
					return lastPaidAt
				}(),
			})
		}
	}
	if err := defaulterRows.Err(); err != nil {
		defaulterRows.Close()
		write(w, 500, map[string]any{"error": "Unable to read defaulter analytics"})
		return
	}
	defaulterRows.Close()

	write(w, 200, map[string]any{
		"success": true, "totalContributions": totalContributions, "paidPayments": paidPayments,
		"claimsByStatus": claimsByStatus, "monthlyContributions": monthly, "defaulters": defaulters,
		"longTermDefaulters": len(defaulters),
		"stkPushMetrics": map[string]any{
			"periodMonths": 6, "attempts": stkAttempts, "successful": stkSuccessful, "failed": stkFailed,
			"pending": stkPending, "successRate": successRate, "failureRate": failureRate,
		},
	})
}
