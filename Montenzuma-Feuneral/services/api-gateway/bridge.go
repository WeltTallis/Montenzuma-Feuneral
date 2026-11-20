package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

// Bridge grants are encrypted capabilities. The browser can pass one to the
// local scanner agent without revealing the underlying HttpOnly session token.
type bridgeGrant struct {
	Token   string `json:"token"`
	Scope   string `json:"scope"`
	Tenant  string `json:"tenant"`
	Subject string `json:"subject"`
	Expires int64  `json:"expires"`
}

func signBridgeGrant(claims bridgeGrant, secret []byte) (string, error) {
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	key := sha256.Sum256(secret)
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, payload, []byte("restpoint-scanner-bridge"))
	return base64.RawURLEncoding.EncodeToString(sealed), nil
}

func readBridgeGrant(value string, secret []byte) (bridgeGrant, bool) {
	sealed, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return bridgeGrant{}, false
	}
	key := sha256.Sum256(secret)
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return bridgeGrant{}, false
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil || len(sealed) < gcm.NonceSize() {
		return bridgeGrant{}, false
	}
	nonce, ciphertext := sealed[:gcm.NonceSize()], sealed[gcm.NonceSize():]
	payload, err := gcm.Open(nil, nonce, ciphertext, []byte("restpoint-scanner-bridge"))
	if err != nil {
		return bridgeGrant{}, false
	}
	var claims bridgeGrant
	if json.Unmarshal(payload, &claims) != nil || claims.Expires <= time.Now().Unix() || claims.Token == "" {
		return bridgeGrant{}, false
	}
	return claims, true
}

func (g *Gateway) serveBridge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "message": "POST required"})
		return
	}
	switch strings.TrimPrefix(r.URL.Path, "/bridge/") {
	case "grant":
		identity := g.verifyIdentity(r)
		token := tokenFromRequest(r)
		if !identity.Verified || token == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "message": "Sign in to authorize the scanner"})
			return
		}
		var body struct {
			Scope string `json:"scope"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&body) != nil || (body.Scope != "bridge:scan" && body.Scope != "bridge:print") {
			writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Invalid bridge scope"})
			return
		}
		grant, err := signBridgeGrant(bridgeGrant{Token: token, Scope: body.Scope, Tenant: identity.TenantSlug, Subject: identity.UserID, Expires: time.Now().Add(10 * time.Minute).Unix()}, g.config.JWTSecret)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Could not issue bridge grant"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": map[string]any{"grant": grant, "expiresAt": time.Now().Add(10 * time.Minute).UTC().Format(time.RFC3339)}})
	case "verify-grant":
		var body struct {
			Grant string `json:"grant"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&body) != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Invalid grant request"})
			return
		}
		claims, ok := readBridgeGrant(body.Grant, g.config.JWTSecret)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"success": true, "data": map[string]any{"valid": false, "reason": "grant expired or invalid"}})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": map[string]any{"valid": true, "scope": claims.Scope, "tenant": claims.Tenant, "subject": claims.Subject}})
	default:
		writeJSON(w, http.StatusNotFound, map[string]any{"success": false, "message": "Bridge route not found"})
	}
}
