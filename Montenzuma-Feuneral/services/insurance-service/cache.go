package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// cacheFor caches only successful JSON responses. Write handlers advance a
// tenant cache generation so old entries expire without needing KEYS scans.
func (a *app) cacheFor(ttl time.Duration, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if a.cache == nil {
			next(w, r)
			return
		}
		requestBody, readErr := io.ReadAll(r.Body)
		if readErr != nil { next(w, r); return }
		r.Body = io.NopCloser(bytes.NewReader(requestBody))
		versionKey := "insurance:cache-version:" + tenant(r)
		version, err := a.cache.Get(r.Context(), versionKey).Result()
		if err == redis.Nil { version = "0" } else if err != nil { next(w, r); return }
		fingerprint := sha256.Sum256(append([]byte(r.Method+":"+r.URL.RequestURI()+":"+tenant(r)+":"+version+":"), requestBody...))
		key := "insurance:response:" + hex.EncodeToString(fingerprint[:])
		if raw, err := a.cache.Get(r.Context(), key).Bytes(); err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(raw)
			return
		}
		capture := &responseCapture{header: make(http.Header)}
		next(capture, r)
		for k, values := range capture.header { for _, value := range values { w.Header().Add(k, value) } }
		w.Header().Set("X-Cache", "MISS")
		w.WriteHeader(capture.status)
		_, _ = w.Write(capture.body.Bytes())
		if capture.status == http.StatusOK && capture.header.Get("Content-Type") == "application/json" {
			_ = a.cache.Set(r.Context(), key, capture.body.Bytes(), ttl).Err()
		}
	}
}

func (a *app) invalidateCache(ctx context.Context, tenantSlug string) {
	if a.cache != nil { _ = a.cache.Incr(ctx, "insurance:cache-version:"+tenantSlug).Err() }
}

func (a *app) invalidateAfter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
		path := r.URL.Path
		mutation := r.Method == http.MethodPost && (path == "/insurance/applications" || path == "/insurance/claims" || strings.HasPrefix(path, "/insurance/payments/"))
		mutation = mutation || (r.Method == http.MethodPatch && strings.HasPrefix(path, "/insurance/claims/"))
		if mutation { a.invalidateCache(r.Context(), tenant(r)) }
	})
}

type responseCapture struct { header http.Header; body bytes.Buffer; status int }
func (w *responseCapture) Header() http.Header { return w.header }
func (w *responseCapture) WriteHeader(status int) { if w.status == 0 { w.status = status } }
func (w *responseCapture) Write(data []byte) (int, error) { if w.status == 0 { w.status = http.StatusOK }; return w.body.Write(data) }
