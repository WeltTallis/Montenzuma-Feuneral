package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func testToken(t *testing.T, claims map[string]any, secret []byte) string {
	t.Helper()
	header, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		t.Fatal(err)
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		t.Fatal(err)
	}
	unsigned := base64.RawURLEncoding.EncodeToString(header) + "." +
		base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(unsigned))
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func TestVerifyHS256RejectsWrongSignature(t *testing.T) {
	secret := []byte("gateway-test-secret")
	token := testToken(t, map[string]any{"tenantSlug": "org-one"}, secret)
	if _, err := verifyHS256(token, []byte("different-secret")); err == nil {
		t.Fatal("expected invalid signature to be rejected")
	}
}

func TestTenantSpecificJWTUsesAuthServiceFallback(t *testing.T) {
	tenantSecret := []byte("tenant-secret")
	token := testToken(t, map[string]any{
		"tenantSlug":   "org-one",
		"tenantId":     "42",
		"userId":       "user-7",
		"role":         "staff",
		"branchDbName": "org-one-east",
		"branchSlug":   "org-one-east",
		"branchId":     "east-id",
	}, tenantSecret)
	var verificationCalls atomic.Int32
	authService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		verificationCalls.Add(1)
		if r.URL.Path != "/auth/me" {
			t.Errorf("auth verification path = %q, want /auth/me", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer "+token {
			t.Errorf("authorization = %q, want bearer token", got)
		}
		if _, err := verifyHS256(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "), tenantSecret); err != nil {
			http.Error(w, `{"success":false}`, http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true,"user":{"userId":"user-7"}}`))
	}))
	defer authService.Close()
	authURL, err := url.Parse(authService.URL)
	if err != nil {
		t.Fatal(err)
	}
	gateway := &Gateway{
		config: Config{
			JWTSecret:        []byte("gateway-secret"),
			RateLimitGeneral: 600,
			RateLimitWindow:  15 * time.Minute,
			Services:         map[string]*url.URL{"auth": authURL},
		},
		identity:       newIdentityCache(),
		identityClient: authService.Client(),
		limiters:       newRateLimiter(),
	}
	request := httptestRequest("/api/v1/restpoint/deceased/charge-settings")
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("X-Tenant-Slug", "attacker-tenant")
	request.Header.Set("X-User-Id", "attacker-user")
	request.Header.Set("X-Branch-Db", "attacker-branch")
	headers := request.Header.Clone()

	id := applyTenantIdentityWithVerifier(headers, request, gateway.verifyIdentity)
	if !id.Verified {
		t.Fatal("expected tenant-specific JWT to verify")
	}
	if got := headers.Get("X-Tenant-Slug"); got != "org-one-east" {
		t.Fatalf("tenant scope = %q, want signed branch scope", got)
	}
	if got := headers.Get("X-Tenant-Id"); got != "42" {
		t.Fatalf("tenant ID = %q, want signed tenant ID", got)
	}
	if got := headers.Get("X-User-Id"); got != "user-7" {
		t.Fatalf("user ID = %q, want signed user ID", got)
	}
	if got := headers.Get("X-Branch-Id"); got != "east-id" {
		t.Fatalf("branch ID = %q, want signed branch ID", got)
	}
	if got := verificationCalls.Load(); got != 1 {
		t.Fatalf("auth service verification calls = %d, want 1", got)
	}
	if cached := gateway.verifyIdentity(request); !cached.Verified {
		t.Fatal("expected tenant identity to be available from cache")
	}
	if got := verificationCalls.Load(); got != 1 {
		t.Fatalf("cached verification made %d auth service calls, want 1", got-1)
	}
}

func TestTenantSpecificJWTIsRejectedWhenAuthServiceDoesNotVerify(t *testing.T) {
	token := testToken(t, map[string]any{"tenantSlug": "org-one"}, []byte("tenant-secret"))
	authService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, `{"success":false}`, http.StatusServiceUnavailable)
	}))
	defer authService.Close()
	authURL, err := url.Parse(authService.URL)
	if err != nil {
		t.Fatal(err)
	}
	gateway := &Gateway{
		config: Config{
			JWTSecret:        []byte("gateway-secret"),
			RateLimitGeneral: 600,
			RateLimitWindow:  15 * time.Minute,
			Services:         map[string]*url.URL{"auth": authURL},
		},
		identity:       newIdentityCache(),
		identityClient: authService.Client(),
		limiters:       newRateLimiter(),
	}
	request := httptestRequest("/api/v1/restpoint/deceased/charge-settings")
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("X-Tenant-Slug", "attacker-tenant")
	headers := request.Header.Clone()

	id := applyTenantIdentityWithVerifier(headers, request, gateway.verifyIdentity)
	if id.Verified {
		t.Fatal("tenant token must remain unverified when auth service rejects it")
	}
	if got := headers.Get("X-Tenant-Slug"); got != "" {
		t.Fatalf("unverified client tenant header = %q, want it stripped", got)
	}
}

func TestTenantIdentityPinsBranchToSignedClaims(t *testing.T) {
	secret := []byte("gateway-test-secret")
	token := testToken(t, map[string]any{
		"tenantSlug":   "org-one",
		"tenantId":     "42",
		"userId":       "user-7",
		"role":         "staff",
		"branchDbName": "org-one-east",
		"branchSlug":   "org-one-east",
		"branchId":     "east-id",
	}, secret)
	request := httptestRequest("/api/v1/restpoint/deceased/charge-settings")
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("X-Tenant-Slug", "org-two")
	request.Header.Set("X-Branch-Db", "org-one-west")
	request.Header.Set("X-Branch-Slug", "org-one-west")
	request.Header.Set("X-Branch-Id", "west-id")

	headers := request.Header.Clone()
	identity := applyTenantIdentity(headers, request, secret, newIdentityCache())
	if !identity.Verified {
		t.Fatal("expected signed identity to verify")
	}
	if got := headers.Get("X-Tenant-Slug"); got != "org-one-east" {
		t.Fatalf("tenant scope = %q, want signed branch scope", got)
	}
	if got := headers.Get("X-Branch-Db"); got != "org-one-east" {
		t.Fatalf("branch database = %q, want signed branch database", got)
	}
	if got := headers.Get("X-Branch-Slug"); got != "org-one-east" {
		t.Fatalf("branch slug = %q, want signed branch slug", got)
	}
	if got := headers.Get("X-Branch-Id"); got != "east-id" {
		t.Fatalf("branch id = %q, want signed branch id", got)
	}
	if got := headers.Get("X-Tenant-Mismatch"); got != "1" {
		t.Fatalf("tenant mismatch marker = %q, want 1", got)
	}
}

func TestPreAuthRouteAllowsValidatedClientTenant(t *testing.T) {
	request := httptestRequest("/api/v1/restpoint/tenant/resolve")
	request.Header.Set("X-Tenant-Slug", "org-one")
	headers := request.Header.Clone()

	identity := applyTenantIdentity(headers, request, []byte("secret"), newIdentityCache())
	if identity.Verified {
		t.Fatal("pre-auth request must not be marked as verified")
	}
	if got := headers.Get("X-Tenant-Slug"); got != "org-one" {
		t.Fatalf("tenant slug = %q, want org-one", got)
	}
	if got := headers.Get("X-Tenant-Verified"); got != "0" {
		t.Fatalf("verified marker = %q, want 0", got)
	}
}

func TestPreAuthRouteStripsMalformedTenant(t *testing.T) {
	request := httptestRequest("/api/v1/restpoint/tenant/resolve")
	request.Header.Set("X-Tenant-Slug", "org-one; DROP")
	headers := request.Header.Clone()

	applyTenantIdentity(headers, request, []byte("secret"), newIdentityCache())
	if got := headers.Get("X-Tenant-Slug"); got != "" {
		t.Fatalf("malformed tenant slug should be removed, got %q", got)
	}
	if got := headers.Get("X-Tenant-Assertion"); got != "org-one; DROP" {
		t.Fatalf("expected bounded audit assertion, got %q", got)
	}
}

func TestRewriteUpstreamPaths(t *testing.T) {
	tests := []struct {
		name string
		path string
		want string
	}{
		{"auth alias", "/api/v1/restpoint/login", "/auth/login"},
		{"HR prefix", "/api/v1/restpoint/hr/payroll", "/api/v1/payroll"},
		{"store prefix", "/api/v1/restpoint/store/items", "/api/store/items"},
		{"mpesa prefix", "/api/v1/restpoint/mpesa/callback", "/api/v1/callback"},
		{"deceased unchanged", "/api/v1/restpoint/deceased/public/lookup", "/deceased/public/lookup"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			parsed, err := url.Parse(test.path)
			if err != nil {
				t.Fatal(err)
			}
			got, _ := rewriteUpstreamPath(parsed, routeKey(parsed.Path))
			if got != test.want {
				t.Fatalf("rewritten path = %q, want %q", got, test.want)
			}
		})
	}
}

func TestCookieFilterRemovesAccessTokenAndRestrictsRefreshToken(t *testing.T) {
	request := httptestRequest("/api/v1/restpoint/auth/login")
	request.Header.Set("Cookie", "access_token=a; refresh_token=r; theme=dark")
	filterProxyCookies(request, request.URL.Path)
	if got := request.Header.Get("Cookie"); got != "theme=dark" {
		t.Fatalf("cookie header = %q, want only non-auth cookies", got)
	}

	refresh := httptestRequest("/api/v1/restpoint/auth/refresh")
	refresh.Header.Set("Cookie", "access_token=a; refresh_token=r; theme=dark")
	filterProxyCookies(refresh, refresh.URL.Path)
	if got := refresh.Header.Get("Cookie"); got != "refresh_token=r; theme=dark" {
		t.Fatalf("refresh cookie header = %q, want refresh and non-auth cookies", got)
	}
}

func TestForwardAuthCookieModeOnlyForLoginAndRefresh(t *testing.T) {
	tests := []struct {
		name        string
		path        string
		header      string
		wantForward bool
	}{
		{"auth login", "/api/v1/restpoint/auth/login", "1", true},
		{"login alias", "/api/v1/restpoint/login", "1", true},
		{"auth refresh", "/api/v1/restpoint/auth/refresh", "1", true},
		{"other auth route", "/api/v1/restpoint/auth/me", "1", false},
		{"other service", "/api/v1/restpoint/deceased/login", "1", false},
		{"missing opt-in", "/api/v1/restpoint/auth/login", "", false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			incoming := httptestRequest(test.path)
			incoming.Header.Set("X-Auth-Cookie", test.header)
			outgoing := httptestRequest(test.path)
			outgoing.Header.Set("X-Auth-Cookie", "untrusted")

			forwardAuthCookieMode(outgoing, incoming)

			got := outgoing.Header.Get("X-Auth-Cookie") == "1"
			if got != test.wantForward {
				t.Fatalf("cookie mode forwarded = %t, want %t", got, test.wantForward)
			}
		})
	}
}

func httptestRequest(path string) *http.Request {
	request, err := http.NewRequest(http.MethodGet, path, strings.NewReader(""))
	if err != nil {
		panic(err)
	}
	return request
}
