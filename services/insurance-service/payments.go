package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

type policyPaymentSnapshot struct {
	PaidTotal        float64
	LastPaidAt       time.Time
	MonthsDue        int
	UnpaidMonths     int
	MonthsWithoutPay int
	ArrearsAmount    float64
	AmountDue        float64
}

func monthDifference(from, to time.Time) int {
	return (to.Year()-from.Year())*12 + int(to.Month()-from.Month())
}

func buildPaymentSnapshot(createdAt, lastPaidAt, now time.Time, premium, paidTotal float64) policyPaymentSnapshot {
	monthsDue := monthDifference(createdAt, now) + 1
	if monthsDue < 1 {
		monthsDue = 1
	}
	unpaidMonths := 0
	if premium > 0 {
		unpaidMonths = monthsDue - int(paidTotal/premium)
		if unpaidMonths < 0 {
			unpaidMonths = 0
		}
	}
	monthsWithoutPay := monthDifference(createdAt, now)
	if !lastPaidAt.IsZero() {
		monthsWithoutPay = monthDifference(lastPaidAt, now)
	}
	if monthsWithoutPay < 0 {
		monthsWithoutPay = 0
	}
	arrearsAmount := premium*float64(monthsDue) - paidTotal
	if arrearsAmount < 0 {
		arrearsAmount = 0
	}
	amountDue := arrearsAmount
	if amountDue < premium {
		amountDue = premium
	}
	return policyPaymentSnapshot{
		PaidTotal:        paidTotal,
		LastPaidAt:       lastPaidAt,
		MonthsDue:        monthsDue,
		UnpaidMonths:     unpaidMonths,
		MonthsWithoutPay: monthsWithoutPay,
		ArrearsAmount:    arrearsAmount,
		AmountDue:        amountDue,
	}
}

func (a *app) paymentSnapshot(ctx context.Context, policyNumber string, createdAt time.Time, premium float64) (policyPaymentSnapshot, error) {
	var paidTotal float64
	var lastPaidAt time.Time
	err := a.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount) FILTER (WHERE status='paid'),0)::float8,
			COALESCE(MAX(created_at) FILTER (WHERE status='paid'), 'epoch'::timestamptz)
		FROM insurance_payments
		WHERE policy_number=$1`, policyNumber).Scan(&paidTotal, &lastPaidAt)
	if err != nil {
		return policyPaymentSnapshot{}, err
	}
	if lastPaidAt.Equal(time.Unix(0, 0).UTC()) {
		lastPaidAt = time.Time{}
	}
	return buildPaymentSnapshot(createdAt, lastPaidAt, time.Now(), premium, paidTotal), nil
}

func paymentLinkURL(code string) string {
	if code == "" {
		return ""
	}
	return strings.TrimRight(env("PUBLIC_PAYMENT_BASE_URL", "https://paymontenzuma.restpoint.co.ke"), "/") + "/p/" + code
}
func (a *app) getPaymentLink(w http.ResponseWriter, r *http.Request) {
	var policyNumber, cover, status string
	var premium float64
	var count int
	var createdAt time.Time
	code := strings.ToUpper(strings.TrimSpace(r.PathValue("code")))
	err := a.db.QueryRow(r.Context(), `SELECT policy_number,cover_type,status,monthly_premium,covered_count,created_at FROM insurance_policies WHERE public_code=$1 AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')`, code, tenant(r)).Scan(&policyNumber, &cover, &status, &premium, &count, &createdAt)
	if err != nil {
		write(w, 404, map[string]any{"error": "Payment link not found"})
		return
	}
	if premium <= 0 {
		premium = premiumForCover(cover)
	}
	snapshot, err := a.paymentSnapshot(r.Context(), policyNumber, createdAt, premium)
	if err != nil {
		write(w, 500, map[string]any{"error": "Could not calculate the amount due"})
		return
	}
	write(w, 200, map[string]any{
		"success": true, "publicCode": code, "policyNumber": policyNumber, "coverType": cover, "status": status, "monthlyPremium": premium, "coveredCount": count,
		"amountDue": snapshot.AmountDue, "arrearsAmount": snapshot.ArrearsAmount, "unpaidMonths": snapshot.UnpaidMonths, "monthsWithoutPayment": snapshot.MonthsWithoutPay,
	})
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
	case "test", "testcover":
		return "Test"
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
	case "Test":
		// Developer test cover — a real KES 1 policy so the whole STK flow
		// can be exercised in production for one shilling.
		return 1
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

/*
Reference shown to the payer and stored on the payment:

	"INS" + 5 letters/digits + HHMM, e.g. INSK7M2Q1930 — the format you asked
	for. Stays within Daraja's 12-character AccountReference limit while
	embedding the time so two payments on the same day never collide.
*/
func paymentReference() (string, error) {
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	buf := make([]byte, 5)
	if _, e := rand.Read(buf); e != nil {
		return "", e
	}
	for i := range buf {
		buf[i] = alphabet[int(buf[i])%len(alphabet)]
	}
	return "INS" + string(buf) + time.Now().Format("1504"), nil
}
func (a *app) stkPush(w http.ResponseWriter, r *http.Request) {
	m, e := body(r)
	if e != nil {
		write(w, 400, map[string]any{"error": "Invalid request body"})
		return
	}
	policy := normalize(str(m, "policyNumber"))
	publicCode := strings.ToUpper(strings.TrimSpace(str(m, "policyCode")))
	requestedPhone := str(m, "phoneNumber")
	phone := normalizeKenyanPhone(requestedPhone)
	if requestedPhone != "" && phone == "" {
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
	var status, cover, registeredPhone string
	var createdAt time.Time
	if publicCode != "" {
		e = a.db.QueryRow(r.Context(), `SELECT policy_number,monthly_premium,status,cover_type,phone,created_at FROM insurance_policies WHERE public_code=$1 AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared')`, publicCode, tenant(r)).Scan(&policy, &premium, &status, &cover, &registeredPhone, &createdAt)
	} else {
		e = a.db.QueryRow(r.Context(), `SELECT policy_number,monthly_premium,status,cover_type,phone,created_at FROM insurance_policies WHERE (policy_number=$1 OR id_number=$1 OR public_code=$1) AND is_deleted=false AND (tenant_slug=$2 OR tenant_slug='system_shared') ORDER BY created_at DESC LIMIT 1`, policy, tenant(r)).Scan(&policy, &premium, &status, &cover, &registeredPhone, &createdAt)
	}
	if e != nil {
		write(w, 404, map[string]any{"error": "Policy not found"})
		return
	}
	if phone == "" {
		phone = normalizeKenyanPhone(registeredPhone)
	}
	if phone == "" {
		write(w, 400, map[string]any{"error": "No valid M-Pesa phone number is registered for this policy"})
		return
	}
	if !strings.EqualFold(status, "active") {
		write(w, 409, map[string]any{"error": "This policy is not active yet. Contact the care team for approval."})
		return
	}
	if premium <= 0 {
		premium = premiumForCover(cover)
	}
	snapshot, e := a.paymentSnapshot(r.Context(), policy, createdAt, premium)
	if e != nil {
		write(w, 500, map[string]any{"error": "Could not calculate the amount due"})
		return
	}
	amount := snapshot.ArrearsAmount
	if prepaidAmount := premium * float64(months); amount < prepaidAmount {
		amount = prepaidAmount
	}
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
	log.Printf("[STK] reference=%s policy=%s phone=%s amount=%.0f", ref, policy, phone, amount)
	payload, _ := json.Marshal(map[string]any{"Amount": fmt.Sprintf("%.0f", amount), "PhoneNumber": phone, "AccountReference": ref, "TransactionDesc": "Insurance contribution"})
	req, e := http.NewRequestWithContext(r.Context(), http.MethodPost, strings.TrimRight(env("MPESA_SERVICE_URL", "http://restpoint_mpesa_service:4040"), "/")+"/api/v1/stkpush", strings.NewReader(string(payload)))
	if e != nil {
		write(w, 502, map[string]any{"error": "Payment service unavailable", "reference": ref})
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, e := (&http.Client{Timeout: 20 * time.Second}).Do(req)
	if e != nil {
		_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET status='failed',result_code='gateway_error',result_description='Payment service unavailable',failure_reason='Payment service unavailable. Please try again.',retryable=true,updated_at=now() WHERE reference=$1`, ref)
		write(w, 502, map[string]any{"error": "Payment service unavailable", "reference": ref})
		return
	}
	defer resp.Body.Close()
	var result map[string]any
	if json.NewDecoder(resp.Body).Decode(&result) != nil || resp.StatusCode >= 300 || result["success"] == false {
		_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET status='failed',result_code='gateway_error',result_description='Payment request was rejected',failure_reason='Payment request was rejected. Please try again.',retryable=true,updated_at=now() WHERE reference=$1`, ref)
		write(w, 502, map[string]any{"error": "Payment request was rejected", "reference": ref})
		return
	}
	if respCode, ok := result["ResponseCode"].(string); ok && respCode != "0" {
		errMsg := str(result, "ResponseDescription")
		if errMsg == "" {
			errMsg = str(result, "CustomerMessage")
		}
		if errMsg == "" {
			errMsg = "Payment request was rejected by M-Pesa"
		}
		_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET status='failed',result_code='rejected',result_description=$1,failure_reason=$1,retryable=true,updated_at=now() WHERE reference=$2`, errMsg, ref)
		write(w, 400, map[string]any{"error": errMsg, "reference": ref})
		return
	}
	_, _ = a.db.Exec(r.Context(), `UPDATE insurance_payments SET merchant_request_id=$1,checkout_request_id=$2,updated_at=now() WHERE reference=$3`, result["MerchantRequestID"], result["CheckoutRequestID"], ref)
	log.Printf("[STK] sent reference=%s CheckoutRequestID=%v ResponseCode=%v phone=%s", ref, result["CheckoutRequestID"], result["ResponseCode"], phone)
	result["reference"], result["status"], result["amount"] = ref, "pending", amount
	result["arrearsAmount"], result["unpaidMonths"] = snapshot.ArrearsAmount, snapshot.UnpaidMonths
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
	log.Printf("[CALLBACK] received: %v", m)
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
	// Human-readable reason shown to the payer + operations dashboard, plus
	// whether retrying later can succeed. Safaricom ResultCodes:
	//  0    paid | 1 insufficient funds (retryable) | 1032 cancelled by user
	//  1038 expired/no response | 1025/2001 wrong PIN/locked | 2029 shortcode/type
	//  1019 duplicate request. Anything else keeps the raw ResultDesc.
	friendly := description
	retryable := false
	switch code {
	case "0", "0.0":
		friendly = "Payment received."
	case "1":
		friendly = "Insufficient M-Pesa balance. Please top up and try again."
		retryable = true
	case "1032":
		friendly = "You cancelled the M-Pesa request. Start a new payment when ready."
		retryable = true
	case "1038":
		friendly = "The M-Pesa prompt expired before approval. Please try again."
		retryable = true
	case "1025", "2001":
		friendly = "Wrong M-Pesa PIN or account locked. Check your PIN and try again."
		retryable = true
	case "1019":
		friendly = "A payment request is already in progress for this phone. Wait a minute, then try again."
		retryable = true
	case "2029":
		friendly = "Payment could not be routed. Please contact support and quote your payment reference."
	case "":
		code = "unknown"
		if friendly == "" {
			friendly = "No confirmation was received from M-Pesa. Check your balance, then try again."
			retryable = true
		}
	default:
		if friendly == "" {
			friendly = "The M-Pesa request was not completed. Please try again."
			retryable = true
		}
	}
	tag, e := a.db.Exec(r.Context(), `UPDATE insurance_payments SET status=$1,result_code=$2,result_description=$3,mpesa_receipt=NULLIF($4,''),failure_reason=$5,retryable=$6,updated_at=now() WHERE reference=$7`, state, code, friendly, receipt, friendly, retryable, ref)
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
	var ref, policy, status, receipt, description, code, reason string
	var retryable bool
	var amount float64
	e := a.db.QueryRow(r.Context(), `SELECT reference,policy_number,status,COALESCE(mpesa_receipt,''),amount,COALESCE(result_description,''),COALESCE(result_code,''),COALESCE(failure_reason,result_description,''),COALESCE(retryable,false) FROM insurance_payments WHERE reference=$1`, r.PathValue("reference")).Scan(&ref, &policy, &status, &receipt, &amount, &description, &code, &reason, &retryable)
	if e != nil {
		write(w, 404, map[string]any{"error": "Payment not found"})
		return
	}
	write(w, 200, map[string]any{"success": true, "reference": ref, "policyNumber": policy, "status": status, "receipt": receipt, "amount": amount, "resultDescription": description, "resultCode": code, "failureReason": reason, "retryable": retryable})
}
