package main

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

func (a *app) createClaim(w http.ResponseWriter, r *http.Request) {
	m, files, e := claimSubmission(w, r)
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid claim form or document upload"})
		return
	}
	policy := normalize(str(m, "policyNumber"))
	var pid int64
	var policyNumber string
	err := a.db.QueryRow(r.Context(), `
		SELECT policy_id, policy_number FROM insurance_policies
		WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1)
			AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')
		ORDER BY created_at DESC LIMIT 1`, policy, tenant(r)).Scan(&pid, &policyNumber)
	if err != nil {
		write(w, 404, map[string]any{"error": "Policy not found"})
		return
	}
	var id int64
	err = a.db.QueryRow(r.Context(), "INSERT INTO insurance_claims(policy_number,policy_id,claimant_full_name,claimant_id_number,phone,relationship,deceased_name,death_date,cause_of_death,place_of_death,notes,tenant_slug) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING claim_id", policyNumber, pid, first(m, "claimantFullName", "fullName", "claimantName"), first(m, "claimantIdNumber", "idNumber", "claimantId"), str(m, "phone"), str(m, "relationship"), str(m, "deceasedName"), str(m, "deathDate"), first(m, "causeOfDeath", "causeDeath", "cause"), first(m, "placeOfDeath", "placeDeath", "place"), str(m, "notes"), tenant(r)).Scan(&id)
	if err != nil {
		write(w, 400, map[string]any{"error": "Claim details are invalid or incomplete"})
		return
	}
	paths, err := saveClaimDocuments(tenant(r), id, files)
	if err != nil {
		write(w, 500, map[string]any{"error": "Claim saved, but document storage failed"})
		return
	}
	_, err = a.db.Exec(r.Context(), "UPDATE insurance_claims SET doc_death_cert_path=$1, doc_claimant_id_path=$2, doc_burial_permit_path=$3, updated_at=now() WHERE claim_id=$4", paths["death_certificate"], paths["claimant_id"], paths["burial_permit"], id)
	if err != nil {
		write(w, 500, map[string]any{"error": "Claim saved, but document links could not be saved"})
		return
	}
	a.recordClaimEvent(r.Context(), id, tenant(r), "submitted", "Claim received", 0)
	write(w, 201, map[string]any{"success": true, "claimId": id, "reference": fmt.Sprintf("AMN-C%05d", id), "status": "submitted", "documents": paths})
}

func (a *app) listClaims(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), "SELECT claim_id,policy_number,claimant_full_name,deceased_name,cause_of_death,status,created_at FROM insurance_claims WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared') ORDER BY created_at DESC", tenant(r))
	if e != nil {
		write(w, 500, map[string]any{"error": "Unable to load claims"})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var p, c, d, cause, s string
		var t time.Time
		if rows.Scan(&id, &p, &c, &d, &cause, &s, &t) == nil {
			out = append(out, map[string]any{"claimId": id, "reference": fmt.Sprintf("AMN-C%05d", id), "policyNumber": p, "claimantFullName": c, "deceasedName": d, "causeOfDeath": cause, "status": s, "createdAt": t})
		}
	}
	write(w, 200, map[string]any{"success": true, "claims": out})
}

func (a *app) updateClaim(w http.ResponseWriter, r *http.Request) {
	m, _, e := claimSubmission(w, r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid claim form or document upload"})
		return
	}
	s := str(m, "status")
	if s == "" {
		write(w, 400, map[string]any{"error": "status is required"})
		return
	}
	valid := map[string]bool{"submitted": true, "under_review": true, "approved": true, "settled": true, "rejected": true}
	if !valid[s] {
		write(w, 400, map[string]any{"error": "status must be one of: submitted, under_review, approved, settled, rejected"})
		return
	}
	notes := str(m, "reviewNotes")
	var ts, upd string
	switch s {
	case "approved":
		ts = ", approved_at=now()"
	case "rejected":
		ts = ", rejected_at=now()"
	case "settled":
		ts = ", disbursed_at=now()"
	}
	if ts != "" {
		upd = ", status=$1, review_notes=$2, updated_at=now()" + ts
	} else {
		upd = ", status=$1, review_notes=$2, updated_at=now()"
	}
	var cid int64
	if _, err := fmt.Sscanf(r.PathValue("claimId"), "%d", &cid); err != nil {
		write(w, 400, map[string]any{"error": "Invalid claim id"})
		return
	}
	tag, e := a.db.Exec(r.Context(), "UPDATE insurance_claims SET"+upd+", tenant_slug=$3 WHERE claim_id=$4 AND is_deleted=false AND (tenant_slug=$5 OR tenant_slug='system_shared')", s, notes, tenant(r), cid)
	if e != nil {
		write(w, 422, map[string]any{"error": "Claim could not be updated", "details": e.Error()})
		return
	}
	affected := tag.RowsAffected()
	if affected == 0 {
		write(w, 404, map[string]any{"error": "Claim not found"})
		return
	}
	a.recordClaimEvent(r.Context(), cid, tenant(r), s, notes, numVal(m, "amount"))
	write(w, 200, map[string]any{"success": true, "claimId": cid, "status": s})
}

func (a *app) stats(w http.ResponseWriter, r *http.Request) {
	var policies, claims, pending int
	a.db.QueryRow(r.Context(), "SELECT count(*) FROM insurance_policies WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared')", tenant(r)).Scan(&policies)
	a.db.QueryRow(r.Context(), "SELECT count(*) FROM insurance_claims WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared')", tenant(r)).Scan(&claims)
	a.db.QueryRow(r.Context(), "SELECT count(*) FROM insurance_claims WHERE status IN ('submitted','under_review') AND is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared')", tenant(r)).Scan(&pending)
	write(w, 200, map[string]any{"success": true, "totalPolicies": policies, "totalClaims": claims, "pendingClaims": pending})
}

func (a *app) disburseClaim(w http.ResponseWriter, r *http.Request) {
	m, _, e := claimSubmission(w, r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid claim form or document upload"})
		return
	}
	var cid int64
	if _, err := fmt.Sscanf(r.PathValue("claimId"), "%d", &cid); err != nil {
		write(w, 400, map[string]any{"error": "Invalid claim id"})
		return
	}
	amount := numVal(m, "amount")
	if amount <= 0 {
		write(w, 400, map[string]any{"error": "amount must be greater than zero"})
		return
	}
	method := str(m, "method")
	reference := str(m, "reference")
	if method == "" {
		method = "bank_transfer"
	}
	if reference == "" {
		reference = fmt.Sprintf("DSP-%d", time.Now().Unix())
	}
	tag, e := a.db.Exec(r.Context(), "UPDATE insurance_claims SET status='settled', disbursed_amount=$1, disbursement_method=$2, disbursement_reference=$3, disbursed_at=now(), updated_at=now() WHERE claim_id=$4 AND is_deleted=false AND (tenant_slug=$5 OR tenant_slug='system_shared')", amount, method, reference, cid, tenant(r))
	if e != nil {
		write(w, 422, map[string]any{"error": "Claim could not be disbursed", "details": e.Error()})
		return
	}
	affected := tag.RowsAffected()
	if affected == 0 {
		write(w, 404, map[string]any{"error": "Claim not found"})
		return
	}
	a.recordClaimEvent(r.Context(), cid, tenant(r), "disbursed", fmt.Sprintf("Disbursed %s via %s (ref %s)", money(amount), method, reference), amount)
	write(w, 200, map[string]any{"success": true, "claimId": cid, "status": "settled", "disbursedAmount": amount, "disbursementMethod": method, "disbursementReference": reference})
}

func (a *app) recordClaimEvent(ctx context.Context, claimID int64, tenantSlug, eventType, message string, amount float64) {
	if message == "" {
		message = eventType
	}
	_, _ = a.db.Exec(ctx, "INSERT INTO claim_events(claim_id, event_type, message, amount, tenant_slug) VALUES($1, $2, $3, $4, $5)", claimID, eventType, message, amount, tenantSlug)
}
