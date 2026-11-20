package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const defaultHostPinnacleURL = "https://smsportal.hostpinnacle.co.ke/SMSApi/send"

type HostPinnacleClient struct {
	APIKey string
	UserID string
	Password string
	SenderID string
	Endpoint string
	HTTP *http.Client
}

type HostPinnacleResponse struct {
	Status string `json:"status"`
	Mobile string `json:"mobile"`
	InvalidMobile string `json:"invalidMobile"`
	TransactionID string `json:"transactionId"`
	StatusCode string `json:"statusCode"`
	Reason string `json:"reason"`
}

func NewHostPinnacleClient(apiKey, userID, password, senderID, endpoint string) *HostPinnacleClient {
	if strings.TrimSpace(endpoint) == "" {
		endpoint = defaultHostPinnacleURL
	}
	return &HostPinnacleClient{APIKey: strings.TrimSpace(apiKey), UserID: strings.TrimSpace(userID), Password: password, SenderID: strings.TrimSpace(senderID), Endpoint: endpoint, HTTP: &http.Client{Timeout: 15 * time.Second}}
}

func (c *HostPinnacleClient) SendSMS(ctx context.Context, recipient, message string) (*HostPinnacleResponse, error) {
	if c == nil { return nil, fmt.Errorf("HostPinnacle client is not configured") }
	if c.SenderID == "" { return nil, fmt.Errorf("HOSTPINNACLE_SENDER_ID is required") }
	recipient = normalizePhoneNumber(recipient)
	if recipient == "" { return nil, fmt.Errorf("recipient phone number is required") }
	if strings.TrimSpace(message) == "" { return nil, fmt.Errorf("message is required") }

	form := url.Values{"sendMethod": {"quick"}, "mobile": {recipient}, "msg": {message}, "senderid": {c.SenderID}, "msgType": {"text"}, "duplicatecheck": {"true"}, "output": {"json"}}
	if c.APIKey == "" {
		if c.UserID == "" || c.Password == "" { return nil, fmt.Errorf("configure HOSTPINNACLE_API_KEY or HOSTPINNACLE_USER_ID and HOSTPINNACLE_PASSWORD") }
		form.Set("userid", c.UserID)
		form.Set("password", c.Password)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Endpoint, strings.NewReader(form.Encode()))
	if err != nil { return nil, fmt.Errorf("create HostPinnacle request: %w", err) }
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	if c.APIKey != "" { req.Header.Set("apikey", c.APIKey) }

	res, err := c.HTTP.Do(req)
	if err != nil { return nil, fmt.Errorf("send HostPinnacle request: %w", err) }
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil { return nil, fmt.Errorf("read HostPinnacle response: %w", err) }
	var response HostPinnacleResponse
	if err := json.Unmarshal(body, &response); err != nil { return nil, fmt.Errorf("decode HostPinnacle response: %w", err) }
	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices || strings.ToLower(response.Status) != "success" {
		return &response, fmt.Errorf("HostPinnacle rejected SMS: HTTP %d, status=%s, reason=%s", res.StatusCode, response.Status, response.Reason)
	}
	return &response, nil
}

func normalizePhoneNumber(phone string) string {
	phone = strings.TrimSpace(phone)
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.TrimPrefix(phone, "+")
	if strings.HasPrefix(phone, "07") && len(phone) == 10 { phone = "254" + phone[1:] }
	return phone
}
