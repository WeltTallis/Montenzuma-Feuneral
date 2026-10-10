package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

func paymentLinkURL(code string) string {
	if code == "" {
		return ""
	}
	return strings.TrimRight(env("PUBLIC_PAYMENT_BASE_URL", "https://paymontenzuma.restpoint.co.ke"), "/") + "/p/" + code
}
func (a *app) getPaymentLink(w http.ResponseWriter, r *http.Request) {
	var cover, status string
	var premium float64
	var count int
	code := strings.ToUpper(strings.TrimSpace(r.PathValue("code")))
	err := a.db.QueryRow(r.Context(), `SELECT cover_type,status,monthly_premium,covered_count FROM insurance_policies WHERE public_code=$1 AND is_deleted=false`, code).Scan(&cover, &status, &premium, &count)
	if err != nil {
		write(w, 404, map[string]any{"error": "Payment link not found"})
		return
	}
	if premium <= 0 {
		premium = premiumForCover(cover)
	}
	write(w, 200, map[string]any{"success": true, "publicCode": code, "coverType": cover, "status": status, "monthlyPremium": premium, "coveredCount": count})
}
func normalizeCover(cover string) string {
	key := strings.ToLower(strings.TrimSpace(cover))
	key = strings.NewReplacer(" ", "", "-", "", "_", "").Replace(key)
	key = strings.TrimPrefix(key, "amani")
	switch key {
	case "solo", "single", "individual":
		return "Solo"
	case "family", "household":
		return "Family"
	case "familygroup", "extendedfamily", "extended":
		return "FamilyGroup"
	case "group", "communitygroup":
		return "Group"
	default:
		return strings.TrimSpace(cover)
	}
}

func premiumForCover(cover string) float64 {
	switch normalizeCover(cover) {
	case "Solo":
		return 500
	case "Family":
		return 1000
	case "FamilyGroup", "Group":
		return 10000
	default:
		return 0
	}
}
func normalizeKenyanPhone(value string) string {
	digits := regexp.MustCompile(`\D`).ReplaceAllString(value, "")
	if strings.HasPrefix(digits, "0") && len(digits) == 10 {
		digits = "254" + digits[1:]
	} else if strings.HasPrefix(digits, "7") || strings.HasPrefix(digits, "1") {
		digits = "254" + digits
	}
	if len(digits) != 12 || !strings.HasPrefix(digits, "254") || (digits[3] != '7' && digits[3] != '1') {
		return ""
	}
	return digits
}
func paymentReference() (string, error) {
	n, e := rand.Int(rand.Reader, big.NewInt(900000000))
	if e != nil {
		return "", e
	}
	return fmt.Sprintf("INS%09d", n.Int64()+100000000), nil
}
func (a *app) stkPush(w http.ResponseWriter, r *http.Request) {
	m, e := body(r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	policy := normalize(str(m, "policyNumber"))
	publicCode := strings.ToUpper(strings.TrimSpace(str(m, "policyCode")))
	phone := normalizeKenyanPhone(str(m, "phoneNumber"))
	if phone == "" {
		write(w, 400, map[string]any{"error": "Enter a valid Kenyan mobile number"})
		return
	}
	months := intVal(m["months"])
	if months == 0 {
		months = 1
	}
	if months != 1 && months != 3 {
		write(w, 400, map[string]any{"error": "Payment period must be one or three months"})
		return
	}
	var premium float64
	var status, cover string
	e = a.db.QueryRow(r.Context(), `SELECT policy_number,monthly_premium,status,cover_type FROM insurance_policies WHERE (($1<>'' AND public_code=$1) OR ($1='' AND policy_number=$2)) AND is_deleted=false AND (tenant_slug=$3 OR tenant_slug='system_shared')`, publicCode, policy, tenant(r)).Scan(&policy, &premium, &status, &cover)
	if e != nil {
		write(w, 404, map[string]any{"error": "Policy not found"})
		return
	}
	if !strings.EqualFold(status, "active") {
		write(w, 409, map[string]any{"error": "This policy is not active yet. Contact the care team for approval."})
		return
	}
	if premium <= 0 {
		premium = premiumForCover(cover)
	}
	amount := premium * float64(months)
	if amount <= 0 {
		write(w, 409, map[string]any{"error": "No contribution rate is configured for this policy"})
		return
	}
	ref, e := paymentReference()
	if e != nil {
		write(w, 500, map[string]any{"error": "Could not create payment reference"})
		return
	}
	_, e = a.db.Exec(r.Context(), `INSERT INTO insurance_payments(reference,policy_number,phone,amount,tenant_slug) VALUES($1,$2,$3,$4,$5)`, ref, policy, phone, amount, tenant(r))
	if e != nil {
		write(w, 500, map[string]any{"error": "Could not start payment"})
		return
	}
	payload, _ := json.Marshal(map[string]any{"Amount": fmt.Sprintf("%.0f", amount), "PhoneNumber": phone, "AccountReference": ref, "TransactionDesc": "Insurance contribution"})
	req, e := http.NewRequestWithContext(r.Context(), http.MethodPost, strings.TrimRight(env("MPESA_SERVICE_URL", "http://restpoint_mpesa_service:4040"), "/")+"/api/v1/stkpush", strings.NewReader(string(payload)))
	if e != nil {
		write(w, 502, map[string]any{"error": "Payment service unavailable", "reference": ref})
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, e := (&http.Client{Timeout: 20 * time.Second}).Do(req)
	if e != nil {
		_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET status='failed',result_description='Payment service unavailable',updated_at=now() WHERE reference=$1`, ref)
		write(w, 502, map[string]any{"error": "Payment service unavailable", "reference": ref})
		return
	}
	defer resp.Body.Close()
	var result map[string]any
	if json.NewDecoder(resp.Body).Decode(&result) != nil || resp.StatusCode >= 300 || result["success"] == false {
		_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET status='failed',result_description='Payment request was rejected',updated_at=now() WHERE reference=$1`, ref)
		write(w, 502, map[string]any{"error": "Payment request was rejected", "reference": ref})
		return
	}
	_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET merchant_request_id=$1,checkout_request_id=$2,updated_at=now() WHERE reference=$3`, result["MerchantRequestID"], result["CheckoutRequestID"], ref)
	result["reference"], result["status"], result["amount"] = ref, "pending", amount
	write(w, 200, result)
}
func (a *app) paymentCallback(w http.ResponseWriter, r *http.Request) {
	secret := os.Getenv("MPESA_CALLBACK_SECRET")
	if secret != "" && r.Header.Get("X-Mpesa-Callback-Secret") != secret {
		write(w, 401, map[string]any{"error": "Unauthorized"})
		return
	}
	m, e := body(r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	ref := str(m, "AccountReference")
	if ref == "" {
		ref = str(m, "reference")
	}
	value, description, receipt := m["ResultCode"], str(m, "ResultDesc"), str(m, "MpesaReceiptNumber")
	if outer, ok := m["Body"].(map[string]any); ok {
		if cb, ok := outer["stkCallback"].(map[string]any); ok {
			value, description = cb["ResultCode"], str(cb, "ResultDesc")
			if ref == "" {
				ref = r.URL.Query().Get("reference")
			}
			if metadata, ok := cb["CallbackMetadata"].(map[string]any); ok {
				if items, ok := metadata["Item"].([]any); ok {
					for _, item := range items {
						if pair, ok := item.(map[string]any); ok && pair["Name"] == "MpesaReceiptNumber" {
							receipt = fmt.Sprint(pair["Value"])
						}
					}
				}
			}
		}
	}
	if ref == "" {
		write(w, 400, map[string]any{"error": "Missing payment reference"})
		return
	}
	code := fmt.Sprint(value)
	state := "failed"
	if code == "0" || code == "0.0" {
		state = "paid"
	}
	tag, e := a.db.Exec(r.Context(), `UPDATE insurance_payments SET status=$1,result_code=$2,result_description=$3,mpesa_receipt=NULLIF($4,''),updated_at=now() WHERE reference=$5`, state, code, description, receipt, ref)
	if e != nil {
		write(w, 500, map[string]any{"error": "Could not record payment result"})
		return
	}
	if tag.RowsAffected() == 0 {
		write(w, 404, map[string]any{"error": "Payment reference not found"})
		return
	}
	write(w, 200, map[string]any{"success": true})
}
func (a *app) paymentStatus(w http.ResponseWriter, r *http.Request) {
	var ref, policy, status, receipt, description string
	var amount float64
	e := a.db.QueryRow(r.Context(), `SELECT reference,policy_number,status,mpesa_receipt,amount,COALESCE(result_description,'') FROM insurance_payments WHERE reference=$1 AND (tenant_slug=$2 OR tenant_slug='system_shared')`, r.PathValue("reference"), tenant(r)).Scan(&ref, &policy, &status, &receipt, &amount, &description)
	if e != nil {
		write(w, 404, map[string]any{"error": "Payment not found"})
		return
	}
	write(w, 200, map[string]any{"success": true, "reference": ref, "policyNumber": policy, "status": status, "receipt": receipt, "amount": amount, "resultDescription": description})
}
