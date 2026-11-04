package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	verifyCacheTTL = 15 * time.Second
	verifyCacheMax = 5000
)

var (
	tenantSlugPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)
	branchIDPattern   = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`)
	preAuthPrefixes   = stringSet(
		"auth", "login", "register", "logout", "refresh", "tenant", "tenants",
		"onboarding", "public", "blog", "blog-engagement", "attendance",
	)
	preAuthMethods = stringSet("GET", "HEAD", "POST", "OPTIONS")
	orgWideRoles   = stringSet("admin", "manager")
	opsReadRoles   = stringSet("system_administrator", "systemadmin", "tenant_admin")
	opsReadPaths   = stringSet("charge-settings", "checkout", "deceased-all", "postmortem-requests")
	platformRoles  = stringSet("system_administrator", "systemadmin", "platform_admin")
)

type identity struct {
	Verified    bool
	Reason      string
	TenantSlug  string
	TenantID    string
	UserID      string
	Role        string
	BranchDB    string
	BranchSlug  string
	BranchID    string
}

type cachedIdentity struct {
	value   identity
	expires time.Time
}

type identityCache struct {
	mu      sync.Mutex
	entries map[string]cachedIdentity
}

func newIdentityCache() *identityCache {
	return &identityCache{entries: make(map[string]cachedIdentity)}
}

func (c *identityCache) get(token string) (identity, bool) {
	key := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))
	c.mu.Lock()
	defer c.mu.Unlock()
	entry, ok := c.entries[key]
	if !ok {
		return identity{}, false
	}
	if time.Now().After(entry.expires) {
		delete(c.entries, key)
		return identity{}, false
	}
	return entry.value, true
}

func (c *identityCache) set(token string, value identity) {
	key := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.entries) >= verifyCacheMax {
		now := time.Now()
		for currentKey, entry := range c.entries {
			if now.After(entry.expires) {
				delete(c.entries, currentKey)
			}
		}
		if len(c.entries) >= verifyCacheMax {
			for currentKey := range c.entries {
				delete(c.entries, currentKey)
				break
			}
		}
	}
	c.entries[key] = cachedIdentity{value: value, expires: time.Now().Add(verifyCacheTTL)}
}

func tokenFromRequest(r *http.Request) string {
	if authorization := r.Header.Get("Authorization"); strings.HasPrefix(authorization, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	}
	if cookie, err := r.Cookie("access_token"); err == nil {
		return cookie.Value
	}
	return ""
}

func verifyIdentity(r *http.Request, secret []byte, cache *identityCache) identity {
	token := tokenFromRequest(r)
	if token == "" {
		return identity{Reason: "no-token"}
	}
	if cached, ok := cache.get(token); ok {
		cached.Verified = true
		return cached
	}

	claims, err := verifyHS256(token, secret)
	if err != nil {
		return identity{Reason: "unverified"}
	}
	result := identity{
		TenantSlug: firstClaim(claims, "tenantSlug", "tenant_slug"),
		TenantID:   firstClaim(claims, "tenantId", "tenant_id"),
		UserID:     firstClaim(claims, "userId", "user_id", "id"),
		Role:       firstClaim(claims, "role"),
		BranchDB:   firstClaim(claims, "branchDbName", "branch_db_name"),
		BranchSlug: firstClaim(claims, "branchSlug", "branch_slug"),
		BranchID:   firstClaim(claims, "branchId", "branch_id"),
		Verified:   true,
	}
	if result.TenantSlug != "" && !tenantSlugPattern.MatchString(result.TenantSlug) {
		return identity{Reason: "malformed-tenant-claim"}
	}
	if result.BranchDB != "" && !tenantSlugPattern.MatchString(result.BranchDB) {
		result.BranchDB = ""
	}
	if result.BranchSlug != "" && !tenantSlugPattern.MatchString(result.BranchSlug) {
		result.BranchSlug = ""
	}
	cache.set(token, result)
	return result
}

func verifyHS256(token string, secret []byte) (map[string]any, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed JWT")
	}
	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("malformed JWT header")
	}
	var header struct {
		Algorithm string `json:"alg"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil || header.Algorithm != "HS256" {
		return nil, errors.New("JWT algorithm is not allowed")
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, errors.New("malformed JWT signature")
	}
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	if !hmac.Equal(signature, mac.Sum(nil)) {
		return nil, errors.New("invalid JWT signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("malformed JWT payload")
	}
	var claims map[string]any
	if err := json.Unmarshal(payload, &claims); err != nil || claims == nil {
		return nil, errors.New("invalid JWT claims")
	}
	now := float64(time.Now().Unix())
	if expiry, ok := numericClaim(claims["exp"]); ok && now >= expiry {
		return nil, errors.New("JWT expired")
	}
	if notBefore, ok := numericClaim(claims["nbf"]); ok && now < notBefore {
		return nil, errors.New("JWT not active")
	}
	return claims, nil
}

func applyTenantIdentity(headers http.Header, r *http.Request, secret []byte, cache *identityCache) identity {
	headers.Del("X-Slug")
	clientSlug := firstNonEmpty(headers.Get("X-Tenant-Slug"), headers.Get("X-Tenant-Id"))
	clientUser := headers.Get("X-User-Id")
	clientBranchDB := headers.Get("X-Branch-Db")
	clientBranchSlug := headers.Get("X-Branch-Slug")
	clientBranchID := headers.Get("X-Branch-Id")
	id := verifyIdentity(r, secret, cache)
	established := false
	branchScopeLocked := false
	selectedBranchSlug := ""
	selectedBranchID := ""

	if id.Verified && id.TenantSlug != "" {
		branchDB := id.BranchDB
		if branchDB == "" && id.BranchSlug != "" && tenantSlugPattern.MatchString(id.BranchSlug) {
			branchDB = id.BranchSlug
		}
		effectiveSlug := id.TenantSlug
		if branchDB != "" {
			effectiveSlug = branchDB
		}
		headers.Set("X-Tenant-Slug", effectiveSlug)
		headers.Set("X-Tenant-Id", id.TenantID)
		headers.Set("X-User-Id", id.UserID)
		headers.Set("X-Tenant-Verified", "1")

		if branchDB != "" {
			branchScopeLocked = true
			role := strings.ToLower(id.Role)
			canReadSibling := orgWideRoles.has(role) ||
				(opsReadRoles.has(role) && isOperationsBranchRead(r))
			wantsSibling := clientBranchDB != "" && clientBranchDB != branchDB &&
				canReadSibling && belongsToTenant(clientBranchDB, id.TenantSlug)
			if wantsSibling {
				headers.Set("X-Branch-Db", clientBranchDB)
				if belongsToTenant(clientBranchSlug, id.TenantSlug) {
					selectedBranchSlug = clientBranchSlug
				} else {
					selectedBranchSlug = clientBranchDB
				}
				if branchIDPattern.MatchString(clientBranchID) {
					selectedBranchID = clientBranchID
				}
			} else {
				headers.Set("X-Branch-Db", branchDB)
				selectedBranchSlug = firstNonEmpty(id.BranchSlug, branchDB)
				selectedBranchID = id.BranchID
			}
		} else if clientBranchDB != "" && belongsToTenant(clientBranchDB, id.TenantSlug) {
			headers.Set("X-Branch-Db", clientBranchDB)
			if belongsToTenant(clientBranchSlug, id.TenantSlug) {
				headers.Set("X-Branch-Slug", clientBranchSlug)
			}
		}
		headers.Del("X-Tenant-Assertion")
		headers.Del("X-User-Assertion")
		headers.Del("X-Tenant-Mismatch")
		established = true
		if clientSlug != "" && clientSlug != effectiveSlug {
			headers.Set("X-Tenant-Mismatch", "1")
		}
		if branchDB != "" && clientBranchSlug != "" && clientBranchSlug != id.BranchSlug {
			headers.Set("X-Tenant-Mismatch", "1")
		}
	} else if isPreAuthRoute(r) {
		slug := clientSlug
		if slug == "" {
			slug = "system_shared"
		}
		if clientSlug == "" || slug == "system_shared" ||
			tenantSlugPattern.MatchString(slug) || platformRoles.has(strings.ToLower(id.Role)) {
			headers.Set("X-Tenant-Slug", slug)
			headers.Set("X-Tenant-Verified", "0")
			headers.Del("X-Tenant-Assertion")
			headers.Del("X-User-Assertion")
			if clientUser != "" {
				headers.Set("X-User-Id", truncate(clientUser, 64))
			}
			established = true
		}
	}

	if !established {
		headers.Del("X-Tenant-Slug")
		headers.Del("X-Tenant-Id")
		headers.Del("X-User-Id")
		headers.Set("X-Tenant-Verified", "0")
		headers.Del("X-Tenant-Mismatch")
		if clientSlug != "" {
			headers.Set("X-Tenant-Assertion", truncate(clientSlug, 128))
		} else {
			headers.Del("X-Tenant-Assertion")
		}
		if clientUser != "" {
			headers.Set("X-User-Assertion", truncate(clientUser, 128))
		} else {
			headers.Del("X-User-Assertion")
		}
	}

	if branchScopeLocked {
		if selectedBranchSlug != "" && branchIDPattern.MatchString(selectedBranchSlug) {
			headers.Set("X-Branch-Slug", selectedBranchSlug)
		} else {
			headers.Del("X-Branch-Slug")
		}
		if branchIDPattern.MatchString(selectedBranchID) {
			headers.Set("X-Branch-Id", selectedBranchID)
		} else {
			headers.Del("X-Branch-Id")
		}
	} else if branchIDPattern.MatchString(clientBranchID) {
		headers.Set("X-Branch-Id", clientBranchID)
	} else {
		headers.Del("X-Branch-Id")
	}
	if !branchScopeLocked && branchIDPattern.MatchString(clientBranchSlug) {
		headers.Set("X-Branch-Slug", clientBranchSlug)
	} else if !branchScopeLocked {
		headers.Del("X-Branch-Slug")
	}
	return id
}

func servicePath(r *http.Request) string {
	path := strings.TrimPrefix(r.URL.Path, "/")
	parts := splitPath(path)
	prefixes := stringSet("api", "v1", "v2", "restpoint")
	i := 0
	for i < len(parts) && prefixes.has(strings.ToLower(parts[i])) {
		i++
	}
	parts = parts[i:]
	if len(parts) > 1 && !preAuthPrefixes.has(strings.ToLower(parts[0])) {
		parts = parts[1:]
	}
	return strings.Join(parts, "/")
}

func isPreAuthRoute(r *http.Request) bool {
	if !preAuthMethods.has(strings.ToUpper(r.Method)) {
		return false
	}
	path := servicePath(r)
	first := ""
	if parts := splitPath(path); len(parts) > 0 {
		first = strings.ToLower(parts[0])
	}
	return preAuthPrefixes.has(first)
}

func isOperationsBranchRead(r *http.Request) bool {
	if r.Method != http.MethodGet {
		return false
	}
	parts := splitPath(servicePath(r))
	if len(parts) == 0 {
		return false
	}
	last := strings.ToLower(parts[len(parts)-1])
	if opsReadPaths.has(last) {
		return true
	}
	return len(parts) == 2 && parts[0] == "charge-settings"
}

func belongsToTenant(branchSlug, tenantSlug string) bool {
	if !tenantSlugPattern.MatchString(branchSlug) || !tenantSlugPattern.MatchString(tenantSlug) {
		return false
	}
	return branchSlug == tenantSlug ||
		(strings.HasPrefix(branchSlug, tenantSlug+"-") && len(branchSlug) > len(tenantSlug)+1)
}

func firstClaim(claims map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := claims[key]; ok && value != nil {
			switch typed := value.(type) {
			case string:
				if typed != "" {
					return typed
				}
			case json.Number:
				return typed.String()
			case float64:
				return strconv.FormatFloat(typed, 'f', -1, 64)
			}
		}
	}
	return ""
}

func numericClaim(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case json.Number:
		n, err := typed.Float64()
		return n, err == nil
	}
	return 0, false
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func truncate(value string, max int) string {
	if len(value) > max {
		return value[:max]
	}
	return value
}

type set map[string]struct{}

func stringSet(values ...string) set {
	result := make(set, len(values))
	for _, value := range values {
		result[value] = struct{}{}
	}
	return result
}

func (s set) has(value string) bool {
	_, ok := s[value]
	return ok
}
