package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

const (
	apiMount = "/api/v1/restpoint"
)

// loggingMiddleware adds structured request logging with request ID, method, path, latency, and status.
// It also generates a request ID if one isn't provided in the X-Request-ID header.
func loggingMiddleware(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = newRequestID()
			w.Header().Set("X-Request-ID", requestID)
		}
		logger.Info("request started",
			"request_id", requestID,
			"method", r.Method,
			"path", r.URL.Path,
			"remote_addr", r.RemoteAddr,
		)
		next.ServeHTTP(w, r)
		logger.Info("request completed",
			"request_id", requestID,
			"method", r.Method,
			"path", r.URL.Path,
			"latency_ms", float64(time.Since(start).Milliseconds()),
			"remote_addr", r.RemoteAddr,
		)
	})
}

type Gateway struct {
	config          Config
	logger          *slog.Logger
	identity        *identityCache
	identityClient  *http.Client
	limiters        *rateLimiter
	proxies         map[string]*httputil.ReverseProxy
	startedAt       time.Time
	requests        atomic.Uint64
	upstream5xx     atomic.Uint64
	monitorMu       sync.RWMutex
	apiRequests     uint64
	apiServerError  uint64
	apiRateLimited  uint64
	latencyTotal    time.Duration
	perService      map[string]serviceRequestStats
	requestLogs     []monitorLogEntry
	series          []monitorSeriesPoint
	healthProbeMu   sync.Mutex
	healthCheckedAt time.Time
	serviceHealth   []monitorServiceStatus
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	if err := run(logger); err != nil {
		logger.Error("gateway stopped unexpectedly", "error", err.Error())
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	if err := os.Remove("/tmp/api-gateway-health-failures"); err != nil && !errors.Is(err, os.ErrNotExist) {
		logger.Warn("could not reset liveness failure counter", "error", err.Error())
	}

	cfg, err := loadConfig()
	if err != nil {
		return fmt.Errorf("gateway configuration is invalid: %w", err)
	}

	gateway, err := newGateway(cfg, logger)
	if err != nil {
		return fmt.Errorf("gateway initialization failed: %w", err)
	}

	server := &http.Server{
		Addr:              cfg.Address,
		Handler:           http.HandlerFunc(gateway.ServeHTTPWithRecovery),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       90 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
	logger.Info("API gateway is starting",
		"address", cfg.Address,
		"environment", cfg.Environment,
		"software_name", cfg.SoftwareIdentity.Name,
		"software_version", cfg.SoftwareIdentity.Version,
		"software_tracking_id", cfg.SoftwareIdentity.ProductID,
	)

	serverErrors := make(chan error, 1)
	go func() {
		serverErrors <- server.ListenAndServe()
	}()

	shutdownSignals, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-serverErrors:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("HTTP server failed: %w", err)
		}
		return nil
	case <-shutdownSignals.Done():
		logger.Info("gateway shutdown signal received; draining in-flight requests")
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		logger.Error("graceful shutdown timed out; closing active connections", "error", err.Error())
		if closeErr := server.Close(); closeErr != nil {
			return fmt.Errorf("force-close HTTP server after shutdown timeout: %w", closeErr)
		}
		return fmt.Errorf("graceful shutdown timed out: %w", err)
	}

	if err := <-serverErrors; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("HTTP server failed during shutdown: %w", err)
	}
	return nil
}

func newGateway(cfg Config, logger *slog.Logger) (*Gateway, error) {
	g := &Gateway{
		config:   cfg,
		logger:   logger,
		identity: newIdentityCache(),
		identityClient: &http.Client{
			Timeout: 3 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		limiters:   newRateLimiter(),
		proxies:    make(map[string]*httputil.ReverseProxy),
		startedAt:  time.Now(),
		perService: make(map[string]serviceRequestStats),
	}

	for serviceName, target := range cfg.Services {
		transport := http.DefaultTransport.(*http.Transport).Clone()
		transport.MaxIdleConns = 200
		transport.MaxIdleConnsPerHost = 100
		transport.MaxConnsPerHost = 200
		transport.IdleConnTimeout = 90 * time.Second
		transport.TLSHandshakeTimeout = 10 * time.Second
		transport.TLSClientConfig = &tls.Config{MinVersion: tls.VersionTLS12}
		g.proxies[serviceName] = g.newProxy(target, transport)
	}
	return g, nil
}

func (g *Gateway) newProxy(target *url.URL, transport http.RoundTripper) *httputil.ReverseProxy {
	return &httputil.ReverseProxy{
		Transport:     transport,
		FlushInterval: 100 * time.Millisecond,
		Rewrite: func(proxyRequest *httputil.ProxyRequest) {
			incoming := proxyRequest.In
			proxyRequest.SetURL(target)
			proxyRequest.Out.URL.Path, proxyRequest.Out.URL.RawPath = rewriteUpstreamPath(incoming.URL, routeKey(incoming.URL.Path))
			proxyRequest.Out.Header = incoming.Header.Clone()
			proxyRequest.SetXForwarded()

			identity := applyTenantIdentityWithVerifier(proxyRequest.Out.Header, incoming, g.verifyIdentity)
			g.logger.Debug("tenant identity resolved for upstream request",
				"verified", identity.Verified,
				"reason", identity.Reason,
				"service", routeKey(incoming.URL.Path),
				"request_id", incoming.Header.Get("X-Request-ID"),
			)

			if !strings.HasPrefix(incoming.Header.Get("Authorization"), "Bearer ") {
				if cookie, err := incoming.Cookie("access_token"); err == nil {
					proxyRequest.Out.Header.Set("Authorization", "Bearer "+cookie.Value)
				}
			}
			proxyRequest.Out.Header.Del("X-Slug")
			forwardAuthCookieMode(proxyRequest.Out, incoming)
			proxyRequest.Out.Header.Set("X-Request-ID", incoming.Header.Get("X-Request-ID"))
			filterProxyCookies(proxyRequest.Out, incoming.URL.Path)
		},
		ModifyResponse: func(response *http.Response) error {
			stripUpstreamCORSHeaders(response.Header)
			if response.StatusCode >= http.StatusInternalServerError {
				g.upstream5xx.Add(1)
			}
			return nil
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			g.logger.Error("upstream request failed",
				"service", routeKey(r.URL.Path),
				"request_id", r.Header.Get("X-Request-ID"),
				"error", err.Error(),
			)
			writeJSON(w, http.StatusServiceUnavailable, map[string]any{
				"success":   false,
				"message":   "Upstream service unavailable",
				"service":   routeKey(r.URL.Path),
				"requestId": r.Header.Get("X-Request-ID"),
				"timestamp": time.Now().UTC().Format(time.RFC3339Nano),
			})
		},
	}
}

// stripUpstreamCORSHeaders keeps the gateway as the single CORS policy owner.
func stripUpstreamCORSHeaders(headers http.Header) {
	for _, name := range []string{
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Headers",
		"Access-Control-Expose-Headers",
		"Access-Control-Max-Age",
		"Access-Control-Allow-Private-Network",
	} {
		headers.Del(name)
	}
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestID := strings.TrimSpace(r.Header.Get("X-Request-ID"))
	if requestID == "" || len(requestID) > 128 {
		requestID = newRequestID()
	}
	r.Header.Set("X-Request-ID", requestID)
	w.Header().Set("X-Request-ID", requestID)
	g.setSecurityHeaders(w)

	origin := r.Header.Get("Origin")
	if origin != "" && !g.allowedOrigin(origin) {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"success": false, "message": "Request origin is not allowed",
			"requestId": requestID,
		})
		return
	}
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Vary", "Origin")
	}
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, QUERY, PUT, PATCH, DELETE, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Cookie, X-Branch-Db, X-Slug, X-Tenant-Slug, X-Tenant-Id, X-User-Id, X-Branch-Id, X-Branch-Code, X-Branch-Slug, X-User-Email, X-User-Name, Origin, X-Requested-With, Accept")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	started := time.Now()
	recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
	defer func() {
		g.requests.Add(1)
		g.recordAPIRequest(r, recorder.status, time.Since(started))
		g.logger.Info("gateway request",
			"request_id", requestID,
			"method", r.Method,
			"path", r.URL.Path,
			"status", recorder.status,
			"duration_ms", time.Since(started).Milliseconds(),
		)
	}()

	if r.URL.Path == "/health" {
		if r.Method == http.MethodHead {
			recorder.WriteHeader(http.StatusOK)
			return
		}
		routing := make(map[string]bool, len(g.config.Services))
		for name := range g.config.Services {
			routing[name] = true
		}
		writeJSON(recorder, http.StatusOK, map[string]any{
			"success": true, "status": "ok", "service": g.config.SoftwareIdentity.Name,
			"version": g.config.SoftwareIdentity.Version, "trackingId": g.config.SoftwareIdentity.ProductID,
			"uptimeSeconds": int64(time.Since(g.startedAt).Seconds()),
			"services":      routing,
		})
		return
	}
	if r.URL.Path == "/monitoring" && r.Method == http.MethodGet {
		if !g.authorizeMonitoring(recorder, r) {
			return
		}
		writeJSON(recorder, http.StatusOK, map[string]any{
			"success": true,
			"data":    g.monitoringReport(),
		})
		return
	}
	if r.URL.Path == "/monitoring/logs" && r.Method == http.MethodGet {
		if !g.authorizeMonitoring(recorder, r) {
			return
		}
		writeJSON(recorder, http.StatusOK, map[string]any{
			"success": true,
			"data":    g.searchRequestLogs(r),
		})
		return
	}
	if strings.HasPrefix(r.URL.Path, "/bridge/") {
		g.serveBridge(recorder, r)
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/") {
		writeJSON(recorder, http.StatusNotFound, map[string]any{
			"success": false, "message": "Route not found", "requestId": requestID,
		})
		return
	}

	pathAfterMount, ok := pathAfterAPIMount(r.URL.Path)
	if !ok {
		writeJSON(recorder, http.StatusNotFound, map[string]any{
			"success": false, "message": "Route not found", "requestId": requestID,
		})
		return
	}
	service := firstPathSegment(pathAfterMount)
	if service == "" {
		writeJSON(recorder, http.StatusBadRequest, map[string]any{
			"success": false, "message": "No service specified", "requestId": requestID,
		})
		return
	}
	key, known := serviceRoutes[service]
	if !known {
		writeJSON(recorder, http.StatusNotFound, map[string]any{
			"success": false, "message": "Unknown service",
			"service": service, "requestId": requestID,
		})
		return
	}
	if key == "documents" && r.Method == http.MethodPost && strings.HasPrefix(pathAfterMount, "documents/upload") {
		grant := strings.TrimSpace(r.Header.Get("X-Bridge-Grant"))
		if grant != "" {
			claims, ok := readBridgeGrant(grant, g.config.JWTSecret)
			if !ok || claims.Scope != "bridge:scan" {
				writeJSON(recorder, http.StatusUnauthorized, map[string]any{"success": false, "message": "Scanner upload grant is invalid or expired", "requestId": requestID})
				return
			}
			r.Header.Set("Authorization", "Bearer "+claims.Token)
			r.Header.Set("X-Tenant-Slug", claims.Tenant)
			r.Header.Set("X-User-Id", claims.Subject)
			r.Header.Del("X-Bridge-Grant")
		}
	}
	if key == "hrPayroll" && isPayrollLogin(pathAfterMount) {
		writeJSON(recorder, http.StatusForbidden, map[string]any{
			"success":   false,
			"message":   "HR payroll uses RestPoint authentication; payroll-service login is disabled.",
			"requestId": requestID,
		})

		return
	}

	identity := g.verifyIdentity(r)
	category := limitCategory(r.Method, service)
	clientKey := g.clientKey(r, identity)
	now := time.Now()
	if !g.limiters.allow("api", clientKey, g.config.RateLimitGeneral, g.config.RateLimitWindow, now) {
		w.Header().Set("Retry-After", strconv.Itoa(int(g.config.RateLimitWindow.Seconds())))
		writeJSON(recorder, http.StatusTooManyRequests, map[string]any{
			"success": false, "message": "Too many requests", "requestId": requestID,
		})
		return
	}
	if category != "" {
		limit := g.config.RateLimitWrite
		window := g.config.RateLimitWindow
		key := clientKey
		if category == "auth" {
			limit = g.config.RateLimitAuth
			window = g.config.AuthRateLimitWindow
			if account := authAccountKey(r); account != "" {
				key = "auth-account:" + digest(strings.ToLower(account))
			}
		}
		if !g.limiters.allow(category, key, limit, window, now) {
			w.Header().Set("Retry-After", strconv.Itoa(int(window.Seconds())))
			writeJSON(recorder, http.StatusTooManyRequests, map[string]any{
				"success": false, "message": "Too many requests", "requestId": requestID,
			})
			return
		}
	}

	proxy := g.proxies[key]
	if proxy == nil {
		writeJSON(recorder, http.StatusServiceUnavailable, map[string]any{
			"success": false, "message": "Upstream service is not configured",
			"service": service, "requestId": requestID,
		})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), g.config.ProxyTimeout)
	defer cancel()
	r = r.WithContext(ctx)
	r.Header.Set("X-Request-ID", requestID)
	proxy.ServeHTTP(recorder, r)
}

func (g *Gateway) setSecurityHeaders(w http.ResponseWriter) {
	headers := w.Header()
	headers.Set("X-Content-Type-Options", "nosniff")
	headers.Set("X-Frame-Options", "DENY")
	headers.Set("Referrer-Policy", "strict-origin-when-cross-origin")
	headers.Set("Cross-Origin-Opener-Policy", "same-origin")
	headers.Set("Cross-Origin-Resource-Policy", "same-origin")
	headers.Set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
	if g.config.Environment == "production" {
		headers.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
	}
}

func (g *Gateway) allowedOrigin(origin string) bool {
	if _, ok := g.config.AllowedOrigins[origin]; ok {
		return true
	}
	parsed, err := url.Parse(origin)
	if err == nil && parsed.Host != "" {
		host := strings.ToLower(parsed.Hostname())
		if host == "restpoint.co.ke" || strings.HasSuffix(host, ".restpoint.co.ke") {
			return true
		}
	}
	return g.config.Environment != "production"
}

func (g *Gateway) clientKey(r *http.Request, id identity) string {
	if id.Verified && id.UserID != "" {
		tenant := firstNonEmpty(id.TenantID, id.TenantSlug, "platform")
		return "user:" + digest(tenant+":"+id.UserID)
	}
	remote, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		remote = r.RemoteAddr
	}
	if g.config.TrustProxy {
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			items := splitCSV(forwarded)
			if len(items) > 0 && items[len(items)-1] != "" {
				remote = items[len(items)-1]
			}
		}
	}
	return "ip:" + remote
}

func (g *Gateway) ServeHTTPWithRecovery(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if recovered := recover(); recovered != nil {
			requestID := r.Header.Get("X-Request-ID")
			g.logger.Error("unhandled gateway panic", "request_id", requestID, "panic", fmt.Sprint(recovered))
			writeJSON(w, http.StatusInternalServerError, map[string]any{
				"success": false, "message": "Internal gateway error", "requestId": requestID,
			})
		}
	}()
	g.ServeHTTP(w, r)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (w *statusRecorder) Unwrap() http.ResponseWriter {
	return w.ResponseWriter
}

func (w *statusRecorder) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusRecorder) Write(data []byte) (int, error) {
	return w.ResponseWriter.Write(data)
}

func (w *statusRecorder) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func (w *statusRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := w.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("underlying response writer does not support connection hijacking")
	}
	return hijacker.Hijack()
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func pathAfterAPIMount(path string) (string, bool) {
	if path == apiMount {
		return "/", true
	}
	if strings.HasPrefix(path, apiMount+"/") {
		return strings.TrimPrefix(path, apiMount), true
	}
	return "", false
}

func routeKey(path string) string {
	tail, ok := pathAfterAPIMount(path)
	if !ok {
		return "unknown"
	}
	return firstPathSegment(tail)
}

func rewriteUpstreamPath(incoming *url.URL, service string) (string, string) {
	path, ok := pathAfterAPIMount(incoming.Path)
	if !ok {
		path = incoming.Path
	}
	segments := splitPath(path)
	switch service {
	case "hr":
		native := strings.TrimPrefix(path, "/hr")
		if native == "" {
			native = "/"
		}
		if strings.HasPrefix(native, "/api/v1/") || native == "/api/v1" {
			path = native
		} else if native == "/" {
			path = "/api/v1"
		} else {
			path = "/api/v1" + native
		}
	case "auth", "login", "register", "logout", "refresh", "users", "change-password", "me",
		"forgot-password", "verify-code", "reset-password", "active-sessions":
		if !strings.HasPrefix(path, "/auth/") && path != "/auth" {
			path = "/auth" + path
		}
	case "store", "store-service":
		path = "/api" + path
	case "mpesa":
		path = "/api/v1" + strings.TrimPrefix(path, "/mpesa")
	case "insurance":
		if len(segments) > 1 && segments[1] == "payments" {
			return path, incoming.RawPath
		}
	}
	if path == "" {
		path = "/"
	}
	return path, ""
}

func filterProxyCookies(out *http.Request, originalPath string) {
	raw := out.Header.Get("Cookie")
	if raw == "" {
		return
	}
	allowRefresh := strings.HasPrefix(originalPath, "/api/v1/restpoint/auth/refresh")
	cookies := strings.Split(raw, ";")
	kept := make([]string, 0, len(cookies))
	for _, cookie := range cookies {
		cookie = strings.TrimSpace(cookie)
		name, _, _ := strings.Cut(cookie, "=")
		if name == "access_token" || (name == "refresh_token" && !allowRefresh) {
			continue
		}
		if cookie != "" {
			kept = append(kept, cookie)
		}
	}
	if len(kept) == 0 {
		out.Header.Del("Cookie")
		return
	}
	out.Header.Set("Cookie", strings.Join(kept, "; "))
}

func forwardAuthCookieMode(out, incoming *http.Request) {
	out.Header.Del("X-Auth-Cookie")
	if incoming.Header.Get("X-Auth-Cookie") == "1" && isAuthCookieEndpoint(incoming.URL.Path) {
		out.Header.Set("X-Auth-Cookie", "1")
	}
}

func isAuthCookieEndpoint(path string) bool {
	service := routeKey(path)
	if service != "auth" && service != "login" && service != "refresh" {
		return false
	}
	tail, ok := pathAfterAPIMount(path)
	if !ok {
		tail = path
	}
	segments := splitPath(tail)
	if len(segments) == 0 {
		return false
	}
	endpoint := segments[len(segments)-1]
	return endpoint == "login" || endpoint == "refresh"
}

func isPayrollLogin(path string) bool {
	parts := splitPath(path)
	if len(parts) < 2 {
		return false
	}
	return parts[1] == "auth" && (len(parts) == 2 || parts[2] == "login")
}

func limitCategory(method, service string) string {
	if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
		return ""
	}
	if service == "auth" || service == "login" || service == "register" ||
		service == "logout" || service == "refresh" {
		return "auth"
	}
	return "write"
}

func authAccountKey(r *http.Request) string {
	for _, name := range []string{"identifier", "email", "username", "phone"} {
		if value := strings.TrimSpace(r.URL.Query().Get(name)); value != "" {
			return value
		}
	}
	contentType := strings.ToLower(r.Header.Get("Content-Type"))
	if !strings.Contains(contentType, "application/json") &&
		!strings.Contains(contentType, "application/x-www-form-urlencoded") {
		return ""
	}
	const maxInspectionBytes = 64 * 1024
	prefix, _ := io.ReadAll(io.LimitReader(r.Body, maxInspectionBytes))
	r.Body = io.NopCloser(io.MultiReader(bytes.NewReader(prefix), r.Body))
	var values map[string]any
	if strings.Contains(contentType, "application/json") {
		if err := json.Unmarshal(prefix, &values); err != nil {
			return ""
		}
	} else {
		parsed, err := url.ParseQuery(string(prefix))
		if err != nil {
			return ""
		}
		for _, name := range []string{"identifier", "email", "username", "phone"} {
			if value := strings.TrimSpace(parsed.Get(name)); value != "" {
				return value
			}
		}
		return ""
	}
	for _, name := range []string{"identifier", "email", "username", "phone"} {
		if value, ok := values[name].(string); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func firstPathSegment(path string) string {
	parts := splitPath(path)
	if len(parts) == 0 {
		return ""
	}
	return strings.ToLower(parts[0])
}

func splitPath(path string) []string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) == 1 && parts[0] == "" {
		return nil
	}
	return parts
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func digest(value string) string {
	sum := sha256.Sum256([]byte(value))
	return fmt.Sprintf("%x", sum[:])
}

func newRequestID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	hex := fmt.Sprintf("%x", bytes)
	return hex[:8] + "-" + hex[8:12] + "-" + hex[12:16] + "-" + hex[16:20] + "-" + hex[20:]
}
