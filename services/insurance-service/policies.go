package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func newPolicyNumber(now time.Time) (string, error) {
	random := make([]byte, 4)
	if _, err := rand.Read(random); err != nil {
		return "", err
	}
	return fmt.Sprintf("MON-AC-%d-%s", now.Year(), strings.ToUpper(hex.EncodeToString(random))), nil
}

func (a *app) createPolicy(w http.ResponseWriter, r *http.Request) {
	m, err := body(r)
	if err != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	name, id, phone := str(m, "fullName"), normalize(str(m, "idNumber")), str(m, "phone")
	cover := str(m, "coverType")
	if cover == "" {
		cover = str(m, "cover_type")
	}
	if cover == "" {
		cover = str(m, "cover")
	}
	age := intVal(m["age"])
	if name == "" || id == "" || phone == "" || age < 18 || !truth(m["confirmAccepted"]) {
		write(w, 400, map[string]any{"error": "Please provide valid applicant details and accept the declaration"})
		return
	}

	premium := floatVal(m["monthlyPremium"])
	if premium <= 0 {
		premium = premiumForCover(cover)
	}
	tSlug := tenant(r)

	// An applicant may already have a legacy policy whose policy number was
	// their ID number. Reuse that policy rather than issuing a second one.
	var existingPolicy, existingCode string
	err = a.db.QueryRow(r.Context(), `
		UPDATE insurance_policies
		SET status='active', updated_at=now()
		WHERE policy_id=(
			SELECT policy_id FROM insurance_policies
			WHERE id_number=$1 AND is_deleted=false
				AND (tenant_slug=$2 OR tenant_slug='system_shared')
			ORDER BY created_at DESC LIMIT 1
		)
		RETURNING policy_number, COALESCE(public_code,'')`, id, tSlug).Scan(&existingPolicy, &existingCode)
	if err == nil {
		a.invalidateCache(r.Context(), tSlug)
		a.invalidateCache(r.Context(), "system_shared")
		payLink := paymentLinkURL(existingCode)
		smsMsg := fmt.Sprintf("Montenzuma Monalisa Funeral Home: Thank you for registering for the Amani Cover. Your application has been received. Your Policy No is %s. We are honored to protect your family's future. Pay premium: %s. For assistance, call 0740045355", existingPolicy, payLink)
		smsOK, smsInfo := sendSMSNotification(phone, smsMsg)
		write(w, 200, map[string]any{
			"success": true, "duplicate": true, "policyNumber": existingPolicy, "publicCode": existingCode, "status": "active",
			"paymentLink": payLink,
			"paymentMessage": "Montenzuma Monalisa Funeral Home: Your Amani Cover premium is due. Pay instantly via M-Pesa: " + payLink,
			"smsSent": smsOK, "smsPhone": phone, "smsPreview": smsMsg, "smsDetails": smsInfo,
			"member": map[string]any{"policyNumber": existingPolicy, "publicCode": existingCode, "fullName": name, "phone": phone, "coverType": cover, "monthlyPremium": premium, "status": "active", "paymentLink": payLink},
		})
		return
	}
	if err != pgx.ErrNoRows {
		write(w, 500, map[string]any{"error": "Could not check for an existing policy"})
		return
	}

	policy, err := newPolicyNumber(time.Now())
	if err != nil {
		write(w, 500, map[string]any{"error": "Could not issue a policy number"})
		return
	}
	var policyID int64
	err = a.db.QueryRow(r.Context(), `
		INSERT INTO insurance_policies(
			policy_number,id_number,tenant_slug,full_name,age,employment,phone,email,
			cover_type,covered_count,monthly_premium,plan_code,status,declaration_accepted,
			next_of_kin_name,next_of_kin_phone,next_of_kin_relationship
		) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active',true,$13,$14,$15)
		RETURNING policy_id`,
		policy, id, tSlug, name, age, str(m, "employment"), phone, str(m, "email"),
		cover, intVal(m["coveredCount"]), premium, str(m, "planCode"),
		str(m, "nextOfKinName"), str(m, "nextOfKinPhone"), str(m, "nextOfKinRelationship"),
	).Scan(&policyID)
	if err != nil {
		write(w, 500, map[string]any{"error": "Could not save application"})
		return
	}
	code := fmt.Sprintf("PC-%05d", policyID)
	if _, err = a.db.Exec(r.Context(), `UPDATE insurance_policies SET public_code=$1 WHERE policy_id=$2`, code, policyID); err != nil {
		write(w, 500, map[string]any{"error": "Application saved, but payment link could not be created"})
		return
	}
	a.invalidateCache(r.Context(), tSlug)
	a.invalidateCache(r.Context(), "system_shared")
	payLink := paymentLinkURL(code)
	smsMsg := fmt.Sprintf("Montenzuma Monalisa Funeral Home: Thank you for registering for the Amani Cover. Your application has been received. Your Policy No is %s. We are honored to protect your family's future. Pay premium: %s. For assistance, call 0740045355", policy, payLink)
	smsOK, smsInfo := sendSMSNotification(phone, smsMsg)
	write(w, 201, map[string]any{
		"success": true, "policyNumber": policy, "publicCode": code,
		"paymentLink": payLink,
		"paymentMessage": "Montenzuma Monalisa Funeral Home: Your Amani Cover premium is due. Pay instantly via M-Pesa: " + payLink,
		"smsSent": smsOK, "smsPhone": phone, "smsPreview": smsMsg, "smsDetails": smsInfo, "status": "active",
		"member": map[string]any{"policyId": policyID, "policyNumber": policy, "publicCode": code, "fullName": name, "phone": phone, "coverType": cover, "monthlyPremium": premium, "status": "active", "paymentLink": payLink},
	})
}

func (a *app) coverCheck(w http.ResponseWriter, r *http.Request) {
	m, err := body(r)
	if err != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	identifier := normalize(str(m, "policyNumber"))
	if identifier == "" {
		identifier = normalize(str(m, "idNumber"))
	}
	var policyNumber, publicCode, name, cover, status string
	var covered int
	var created time.Time
	err = a.db.QueryRow(r.Context(), `
		SELECT policy_number, COALESCE(public_code,''), full_name, cover_type,
			status, covered_count, created_at
		FROM insurance_policies
		WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1)
			AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')
		ORDER BY created_at DESC LIMIT 1`,
		identifier, tenant(r)).Scan(&policyNumber, &publicCode, &name, &cover, &status, &covered, &created)
	if err != nil {
		write(w, 404, map[string]any{"success": true, "covered": false, "found": false, "message": "No active cover found"})
		return
	}
	write(w, 200, map[string]any{
		"success": true, "covered": strings.EqualFold(status, "active"), "found": true,
		"policyNumber": policyNumber, "publicCode": publicCode, "coverType": cover,
		"status": status, "coveredCount": covered, "openedAt": created,
	})
}

func (a *app) claimTrack(w http.ResponseWriter, r *http.Request) {
	m, err := body(r)
	if err != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	identifier := normalize(str(m, "policyNumber"))
	if identifier == "" {
		identifier = normalize(str(m, "idNumber"))
	}
	rows, err := a.db.Query(r.Context(), `
		SELECT c.claim_id,c.status,c.deceased_name,c.death_date,c.created_at,c.updated_at
		FROM insurance_claims c
		WHERE c.is_deleted=false AND (c.tenant_slug=$2 OR c.tenant_slug='system_shared')
			AND (
				c.policy_number=$1 OR c.policy_id IN (
					SELECT policy_id FROM insurance_policies
					WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1)
						AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')
				)
			)
		ORDER BY c.created_at DESC`, identifier, tenant(r))
	if err != nil {
		write(w, 500, map[string]any{"error": "Unable to track claims"})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var claimID int64
		var status, name string
		var death, created, updated time.Time
		if rows.Scan(&claimID, &status, &name, &death, &created, &updated) == nil {
			out = append(out, map[string]any{
				"reference": fmt.Sprintf("AMN-C%05d", claimID), "status": status,
				"deceasedName": name, "deathDate": death.Format("2006-01-02"),
				"submittedAt": created, "updatedAt": updated,
			})
		}
	}
	write(w, 200, map[string]any{"success": true, "claims": out})
}

func(a *app)listPolicies(w http.ResponseWriter,r *http.Request){rows,e:=a.db.Query(r.Context(),`SELECT policy_id,policy_number,COALESCE(id_number,''),full_name,phone,cover_type,covered_count,COALESCE(monthly_premium,0)::float8,status,COALESCE(next_of_kin_name,''),COALESCE(next_of_kin_relationship,''),COALESCE(next_of_kin_phone,''),created_at,COALESCE(public_code,'') FROM insurance_policies WHERE is_deleted=false AND (tenant_slug=$1 OR tenant_slug='system_shared') ORDER BY created_at DESC`,tenant(r));if e!=nil{write(w,500,map[string]any{"error":"Unable to load policies"});return};defer rows.Close();out:=[]map[string]any{};for rows.Next(){var id int64;var num,idno,name,phone,cover,status,code,nok,nokRel,nokPhone string;var count int;var premium float64;var created time.Time;if rows.Scan(&id,&num,&idno,&name,&phone,&cover,&count,&premium,&status,&nok,&nokRel,&nokPhone,&created,&code)==nil{out=append(out,map[string]any{"policyId":id,"policyNumber":num,"idNumber":idno,"publicCode":code,"paymentLink":paymentLinkURL(code),"paymentMessage":"Montenzuma Mona Lisa: Your Amani Cover premium is due. Pay instantly via M-Pesa: "+paymentLinkURL(code),"fullName":name,"phone":phone,"coverType":cover,"coveredCount":count,"monthlyPremium":premium,"nextOfKinName":nok,"nextOfKinRelationship":nokRel,"nextOfKinPhone":nokPhone,"status":status,"createdAt":created})}};write(w,200,map[string]any{"success":true,"policies":out})}

func(a *app)listPayments(w http.ResponseWriter,r *http.Request){q:=r.URL.Query();status:=strings.ToLower(strings.TrimSpace(q.Get("status")));limit:=20;if v:=q.Get("limit");v!=""{var n int;fmt.Sscan(v,&n);if n>0&&n<=200{limit=n}};query:=`SELECT p.payment_id,p.reference,p.policy_number,p.phone,p.amount::float8,p.status,COALESCE(p.mpesa_receipt,''),COALESCE(p.result_code,''),COALESCE(p.failure_reason,p.result_description,''),COALESCE(p.retryable,false),p.created_at,COALESCE(pol.full_name,'') FROM insurance_payments p LEFT JOIN insurance_policies pol ON pol.policy_number=p.policy_number WHERE (p.tenant_slug=$1 OR p.tenant_slug='system_shared')`;args:=[]any{tenant(r)};if status=="paid"||status=="failed"||status=="pending"{query+=` AND p.status=$2`;args=append(args,status)};query+=` ORDER BY p.created_at DESC LIMIT `+fmt.Sprint(limit);rows,e:=a.db.Query(r.Context(),query,args...);if e!=nil{write(w,500,map[string]any{"error":"Unable to load payments"});return};defer rows.Close();out:=[]map[string]any{};for rows.Next(){var id int64;var ref,num,phone,receipt,code,reason,name string;var st string;var amt float64;var retry bool;var created time.Time;if rows.Scan(&id,&ref,&num,&phone,&amt,&st,&receipt,&code,&reason,&retry,&created,&name)==nil{out=append(out,map[string]any{"paymentId":id,"reference":ref,"policyNumber":num,"memberName":name,"phone":phone,"amount":amt,"status":st,"receipt":receipt,"resultCode":code,"failureReason":reason,"retryable":retry,"createdAt":created})}};write(w,200,map[string]any{"success":true,"payments":out})}

func (a *app) getPolicy(w http.ResponseWriter, r *http.Request) {
	identifier := normalize(r.PathValue("policyNumber"))
	var id int64
	var number, name, phone, cover, status, code string
	var count int
	err := a.db.QueryRow(r.Context(), `
		SELECT policy_id,policy_number,full_name,phone,cover_type,covered_count,status,COALESCE(public_code,'')
		FROM insurance_policies
		WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1)
			AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')
		ORDER BY created_at DESC LIMIT 1`, identifier, tenant(r)).
		Scan(&id, &number, &name, &phone, &cover, &count, &status, &code)
	if err != nil {
		write(w, 404, map[string]any{"error": "Policy not found"})
		return
	}
	write(w, 200, map[string]any{"success": true, "policy": map[string]any{
		"policyId": id, "policyNumber": number, "publicCode": code,
		"paymentLink": paymentLinkURL(code),
		"paymentMessage": "Montenzuma Mona Lisa: Your Amani Cover premium is due. Pay instantly via M-Pesa: " + paymentLinkURL(code),
		"fullName": name, "phone": phone, "coverType": cover, "coveredCount": count, "status": status,
	}})
}
