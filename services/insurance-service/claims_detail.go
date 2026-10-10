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
	err := a.db.QueryRow(r.Context(), `
		SELECT c.claim_id,c.policy_number,c.claimant_full_name,c.claimant_id_number,c.phone,c.relationship,
		 c.deceased_name,c.death_date::text,c.cause_of_death,c.place_of_death,COALESCE(c.notes,''),
		 COALESCE(c.doc_death_cert_path,''),COALESCE(c.doc_claimant_id_path,''),COALESCE(c.doc_burial_permit_path,''),
		 c.status,COALESCE(c.review_notes,''),c.created_at,c.updated_at,
		 COALESCE(p.full_name,''),COALESCE(p.phone,''),COALESCE(p.id_number,''),COALESCE(p.cover_type,''),
		 COALESCE(p.covered_count,0),COALESCE(p.monthly_premium,0)::float8,COALESCE(p.status,''),COALESCE(p.created_at,c.created_at)
		FROM insurance_claims c LEFT JOIN insurance_policies p ON p.policy_id=c.policy_id AND p.is_deleted=false
		WHERE c.claim_id=$1 AND c.is_deleted=false AND (c.tenant_slug=$2 OR c.tenant_slug='system_shared')`,
		r.PathValue("claimId"), tenant(r)).Scan(&id, &policyNumber, &claimant, &claimantID, &phone, &relationship, &deceased, &deathDate, &cause, &place, &notes, &deathCert, &claimantIDDoc, &burialPermit, &status, &reviewNotes, &submitted, &updated, &holder, &holderPhone, &holderID, &cover, &people, &monthlyPremium, &policyStatus, &policyCreated)
	if err != nil {
		write(w, 404, map[string]any{"error": "Claim not found"})
		return
	}
	payments := []map[string]any{}
	var totalContributions float64
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
	}})
}

func (a *app) analytics(w http.ResponseWriter, r *http.Request) {
	var totalContributions float64
	var paidPayments int
	_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(amount),0)::float8,COUNT(*) FROM insurance_payments WHERE status='paid' AND (tenant_slug=$1 OR tenant_slug='system_shared')`, tenant(r)).Scan(&totalContributions, &paidPayments)
	claimsByStatus := map[string]int{}
	claimRows, err := a.db.Query(r.Context(), `SELECT status,COUNT(*) FROM insurance_claims WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared') GROUP BY status`, tenant(r))
	if err == nil {
		defer claimRows.Close()
		for claimRows.Next() {
			var status string
			var count int
			if claimRows.Scan(&status, &count) == nil {
				claimsByStatus[status] = count
			}
		}
	}
	monthly := []map[string]any{}
	paymentRows, err := a.db.Query(r.Context(), `SELECT to_char(date_trunc('month',created_at),'YYYY-MM') AS month,COALESCE(SUM(amount),0)::float8,COUNT(*) FROM insurance_payments WHERE status='paid' AND created_at>=date_trunc('month',now())-interval '11 months' AND (tenant_slug=$1 OR tenant_slug='system_shared') GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)`, tenant(r))
	if err == nil {
		defer paymentRows.Close()
		for paymentRows.Next() {
			var month string
			var amount float64
			var count int
			if paymentRows.Scan(&month, &amount, &count) == nil {
				monthly = append(monthly, map[string]any{"month": month, "amount": amount, "payments": count})
			}
		}
	}
	write(w, 200, map[string]any{"success": true, "totalContributions": totalContributions, "paidPayments": paidPayments, "claimsByStatus": claimsByStatus, "monthlyContributions": monthly})
}
