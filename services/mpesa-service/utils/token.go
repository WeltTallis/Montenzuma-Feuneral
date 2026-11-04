package utils

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-mpesa-integration/config"
	"github.com/sirupsen/logrus"
)

type AccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

var (
	tokenHTTPClient = &http.Client{Timeout: 10 * time.Second}
	tokenRefresh    = make(chan struct{}, 1)
	tokenCacheMu    sync.RWMutex
	cachedToken     string
	cachedTokenKey  string
	cachedTokenTill time.Time
)

func GenerateAccessToken(ctx context.Context, consumerKey string, consumerSecret string) (string, error) {
	config := config.NewEnvConfig()
	tokenKey := consumerKey + "\x00" + consumerSecret
	if token, ok := getCachedToken(tokenKey); ok {
		return token, nil
	}

	select {
	case tokenRefresh <- struct{}{}:
		defer func() { <-tokenRefresh }()
	case <-ctx.Done():
		return "", ctx.Err()
	}

	if token, ok := getCachedToken(tokenKey); ok {
		return token, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, config.MPesaTokenUrl, nil)

	if err != nil {
		return "", err
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(consumerKey+":"+consumerSecret)))
	res, err := tokenHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			logrus.Errorf("error closing body: %v", err)
		}
	}(res.Body)

	// Safaricom answers token requests with HTTP 200 + {"access_token": "..."}.
	// On bad credentials, a wrong OAuth URL, or a sandbox/production mismatch it
	// returns a non-2xx status and/or a JSON body WITHOUT access_token. Without
	// checking the status/body here we would hand an empty token to the STK call
	// and only see a generic "request failed" from Safaricom afterwards. Surface
	// the real cause at the point of failure instead.
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", fmt.Errorf("M-Pesa OAuth failed: HTTP %d body: %s", res.StatusCode, string(body))
	}

	var accessTokenResponse AccessTokenResponse
	// Unmarshal the JSON response into the struct
	if err := json.Unmarshal(body, &accessTokenResponse); err != nil {
		return "", err
	}
	if strings.TrimSpace(accessTokenResponse.AccessToken) == "" {
		return "", fmt.Errorf("M-Pesa OAuth returned no access_token: body: %s", string(body))
	}

	ttlSeconds, err := strconv.Atoi(accessTokenResponse.ExpiresIn)
	if err != nil || ttlSeconds <= 0 {
		ttlSeconds = 300
	}
	if ttlSeconds > 60 {
		ttlSeconds -= 60
	} else {
		ttlSeconds /= 2
	}
	tokenCacheMu.Lock()
	cachedToken = accessTokenResponse.AccessToken
	cachedTokenKey = tokenKey
	cachedTokenTill = time.Now().Add(time.Duration(ttlSeconds) * time.Second)
	tokenCacheMu.Unlock()

	return accessTokenResponse.AccessToken, nil
}

func getCachedToken(tokenKey string) (string, bool) {
	tokenCacheMu.RLock()
	defer tokenCacheMu.RUnlock()
	if cachedTokenKey != tokenKey || time.Now().After(cachedTokenTill) {
		return "", false
	}
	return cachedToken, true
}


func  GenerateTimeStamp() string {
	// Safaricom expects Africa/Nairobi wall time (UTC+3, no DST).
	// The mpesa container runs on UTC, so formatting time.Now() directly is
	// ~3h behind and can push the password/timestamp out of the accepted window.
	return time.Now().In(time.FixedZone("Africa/Nairobi", 3*60*60)).Format("20060102150405")
}

func GeneratePassword(businessshortcode string , passKey string, timeStamp string) string {
	return base64.StdEncoding.EncodeToString([]byte(businessshortcode + passKey + timeStamp))
}