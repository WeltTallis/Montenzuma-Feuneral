package main

import (
"sync"
"time"
)

// rateLimitEntry tracks the request count and window expiry for a rate limit key.
type rateLimitEntry struct {
count int
until time.Time
}

// rateLimiter is a simple in-memory token-bucket rate limiter with sliding windows.
type rateLimiter struct {
mu      sync.Mutex
entries map[string]rateLimitEntry
}

// newRateLimiter creates a new in-memory rate limiter.
func newRateLimiter() *rateLimiter {
return &rateLimiter{entries: make(map[string]rateLimitEntry)}
}

// allow checks whether a request is permitted under the given rate limit.
func (l *rateLimiter) allow(category, key string, max int, window time.Duration, now time.Time) bool {
compound := category + ":" + key
l.mu.Lock()
defer l.mu.Unlock()

if len(l.entries) > 10000 {
for entryKey, entry := range l.entries {
if now.After(entry.until) {
delete(l.entries, entryKey)
}
}
}

entry, ok := l.entries[compound]
if !ok || !now.Before(entry.until) {
l.entries[compound] = rateLimitEntry{count: 1, until: now.Add(window)}
return true
}

entry.count++
l.entries[compound] = entry
return entry.count <= max
}
