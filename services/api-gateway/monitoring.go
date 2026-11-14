package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	monitoringAccessDenied = "Administrator access is required"
	requestLogLimit        = 200
	monitorSeriesLimit     = 60
	monitorSampleInterval  = time.Minute
	serviceProbeInterval   = 15 * time.Second
	serviceProbeTimeout    = 1500 * time.Millisecond
	slowRequestThreshold   = 1500
)

type serviceRequestStats struct {
	Count  uint64
	Errors uint64
}

type monitorLogEntry struct {
	T       time.Time `json:"t"`
	Service string    `json:"service"`
	Method  string    `json:"method"`
	Path    string    `json:"path"`
	Status  int       `json:"status"`
	MS      int64     `json:"ms"`
}

type monitorSeriesPoint struct {
	T            time.Time         `json:"t"`
	Total        uint64            `json:"total"`
	AvgLatencyMs float64           `json:"avgLatencyMs"`
	PerService   map[string]uint64 `json:"perService"`
	RateLimited  uint64            `json:"rateLimited"`
}

type monitorServiceStatus struct {
	Name      string `json:"name"`
	Up        bool   `json:"up"`
	LatencyMS int64  `json:"latencyMs"`
	Error     string `json:"error,omitempty"`
	Requests  uint64 `json:"requests"`
	Errors    uint64 `json:"errors"`
}

func (g *Gateway) authorizeMonitoring(w http.ResponseWriter, r *http.Request) bool {
	id := g.verifyIdentity(r)
	if !id.Verified || id.UserID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{
			"success": false, "message": "Authentication is required",
			"requestId": r.Header.Get("X-Request-ID"),
		})
		return false
	}

	role := strings.ToLower(strings.NewReplacer("_", "", "-", "", " ", "").Replace(id.Role))
	switch role {
	case "admin", "tenantadmin", "owner", "systemadmin", "systemadministrator", "platformadmin":
		return true
	default:
		writeJSON(w, http.StatusForbidden, map[string]any{
			"success": false, "message": monitoringAccessDenied,
			"requestId": r.Header.Get("X-Request-ID"),
		})
		return false
	}
}

func (g *Gateway) recordAPIRequest(r *http.Request, status int, duration time.Duration) {
	pathAfterMount, ok := pathAfterAPIMount(r.URL.Path)
	if !ok {
		return
	}
	service, ok := serviceRoutes[firstPathSegment(pathAfterMount)]
	if !ok {
		return
	}

	now := time.Now().UTC()
	entry := monitorLogEntry{
		T:       now,
		Service: service,
		Method:  r.Method,
		Path:    r.URL.Path,
		Status:  status,
		MS:      duration.Milliseconds(),
	}

	g.monitorMu.Lock()
	defer g.monitorMu.Unlock()

	g.apiRequests++
	stats := g.perService[service]
	stats.Count++
	if status >= http.StatusInternalServerError {
		g.apiServerError++
		stats.Errors++
	}
	if status == http.StatusTooManyRequests {
		g.apiRateLimited++
	}
	g.perService[service] = stats
	g.latencyTotal += duration
	g.requestLogs = append(g.requestLogs, entry)
	if len(g.requestLogs) > requestLogLimit {
		g.requestLogs = append([]monitorLogEntry(nil), g.requestLogs[len(g.requestLogs)-requestLogLimit:]...)
	}
}

func (g *Gateway) monitoringReport() map[string]any {
	now := time.Now().UTC()
	services := g.serviceHealthSnapshot()

	g.monitorMu.Lock()
	defer g.monitorMu.Unlock()

	total := g.apiRequests
	avgLatencyMs := float64(0)
	if total > 0 {
		avgLatencyMs = float64(g.latencyTotal.Milliseconds()) / float64(total)
	}

	perService := make(map[string]map[string]uint64, len(g.config.Services))
	serviceTotals := make(map[string]uint64, len(g.config.Services))
	for name := range g.config.Services {
		stats := g.perService[name]
		perService[name] = map[string]uint64{"count": stats.Count, "errors": stats.Errors}
		serviceTotals[name] = stats.Count
	}

	servicesUp := 0
	for _, service := range services {
		if service.Up {
			servicesUp++
		}
		stats := g.perService[service.Name]
		service.Requests = stats.Count
		service.Errors = stats.Errors
	}
	allUp := len(services) > 0 && servicesUp == len(services)

	if len(g.series) == 0 || now.Sub(g.series[len(g.series)-1].T) >= monitorSampleInterval {
		g.series = append(g.series, monitorSeriesPoint{
			T:            now,
			Total:        total,
			AvgLatencyMs: avgLatencyMs,
			PerService:   cloneRequestCounts(serviceTotals),
			RateLimited:  g.apiRateLimited,
		})
		if len(g.series) > monitorSeriesLimit {
			g.series = append([]monitorSeriesPoint(nil), g.series[len(g.series)-monitorSeriesLimit:]...)
		}
	}

	logs := append([]monitorLogEntry(nil), g.requestLogs...)
	for left, right := 0, len(logs)-1; left < right; left, right = left+1, right-1 {
		logs[left], logs[right] = logs[right], logs[left]
	}
	series := append([]monitorSeriesPoint(nil), g.series...)
	for i := range series {
		series[i].PerService = cloneRequestCounts(series[i].PerService)
	}
	slowRequests := summarizeSlowRequests(g.requestLogs)

	var memory runtime.MemStats
	runtime.ReadMemStats(&memory)
	softwareName := "RestPoint API Gateway"
	version := ""
	trackingID := ""
	if g.config.SoftwareIdentity != nil {
		softwareName = g.config.SoftwareIdentity.Name
		version = g.config.SoftwareIdentity.Version
		trackingID = g.config.SoftwareIdentity.ProductID
	}

	return map[string]any{
		"service":       softwareName,
		"version":       version,
		"trackingId":    trackingID,
		"generatedAt":   now.Format(time.RFC3339Nano),
		"uptimeSeconds": int64(time.Since(g.startedAt).Seconds()),
		"summary": map[string]any{
			"allUp":         allUp,
			"servicesUp":    servicesUp,
			"servicesTotal": len(services),
			"total":         total,
			"serverError":   g.apiServerError,
			"rateLimited":   g.apiRateLimited,
			"avgLatencyMs":  avgLatencyMs,
			"upstream5xx":   g.upstream5xx.Load(),
		},
		"requests": map[string]any{
			"total":      total,
			"perService": perService,
		},
		"services":     services,
		"series":       series,
		"logs":         logs,
		"slowRequests": slowRequests,
		"process": map[string]any{
			"heapAllocMb": roundOneDecimal(float64(memory.HeapAlloc) / (1024 * 1024)),
			"goroutines":  runtime.NumGoroutine(),
		},
		"cache": map[string]any{
			"available": false,
			"reason":    "Redis cache metrics are not exposed by the API gateway",
		},
		"queues": map[string]any{
			"available": false,
			"reason":    "Background queue metrics are not exposed by the API gateway",
			"queues":    []any{},
			"totals":    map[string]uint64{},
		},
		"logsStore": map[string]any{
			"lokiConfigured": false,
			"lokiUrl":        nil,
		},
	}
}

func (g *Gateway) serviceHealthSnapshot() []monitorServiceStatus {
	g.healthProbeMu.Lock()
	defer g.healthProbeMu.Unlock()
	if !g.healthCheckedAt.IsZero() && time.Since(g.healthCheckedAt) < serviceProbeInterval {
		return append([]monitorServiceStatus(nil), g.serviceHealth...)
	}

	names := make([]string, 0, len(g.config.Services))
	for name := range g.config.Services {
		names = append(names, name)
	}
	sort.Strings(names)

	statuses := make([]monitorServiceStatus, len(names))
	client := &http.Client{
		Timeout: serviceProbeTimeout,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	results := make(chan monitorServiceStatus, len(names))
	for _, name := range names {
		name := name
		target := g.config.Services[name]
		go func() {
			results <- probeService(client, name, target)
		}()
	}
	for i := range statuses {
		statuses[i] = <-results
	}

	g.serviceHealth = statuses
	g.healthCheckedAt = time.Now()
	return append([]monitorServiceStatus(nil), statuses...)
}

func probeService(client *http.Client, name string, target *url.URL) monitorServiceStatus {
	status := monitorServiceStatus{Name: name, Error: "unreachable"}
	if target == nil {
		status.Error = "service URL is not configured"
		return status
	}

	healthURL := *target
	healthURL.Path = strings.TrimRight(healthURL.Path, "/") + "/health"
	healthURL.RawPath = ""
	healthURL.RawQuery = ""
	healthURL.Fragment = ""

	ctx, cancel := context.WithTimeout(context.Background(), serviceProbeTimeout)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL.String(), nil)
	if err != nil {
		status.Error = "invalid health-check URL"
		return status
	}
	started := time.Now()
	response, err := client.Do(request)
	status.LatencyMS = time.Since(started).Milliseconds()
	if err != nil {
		status.Error = "health check failed"
		return status
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 32*1024))

	status.Up = response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusInternalServerError
	if !status.Up {
		status.Error = fmt.Sprintf("health check returned HTTP %d", response.StatusCode)
	} else {
		status.Error = ""
	}
	return status
}

func (g *Gateway) searchRequestLogs(r *http.Request) map[string]any {
	hours, err := strconv.Atoi(r.URL.Query().Get("hours"))
	if err != nil || hours < 1 {
		hours = 1
	}
	if hours > 24*30 {
		hours = 24 * 30
	}
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit < 1 {
		limit = 100
	}
	if limit > requestLogLimit {
		limit = requestLogLimit
	}

	serviceFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("service")))
	levelFilter := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("level")))
	containsFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("contains")))
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)

	g.monitorMu.RLock()
	logs := append([]monitorLogEntry(nil), g.requestLogs...)
	g.monitorMu.RUnlock()

	entries := make([]map[string]any, 0, limit)
	total := 0
	for i := len(logs) - 1; i >= 0; i-- {
		entry := logs[i]
		if entry.T.Before(cutoff) || !matchesRequestLog(entry, serviceFilter, levelFilter, containsFilter) {
			continue
		}
		total++
		if len(entries) >= limit {
			continue
		}
		entries = append(entries, map[string]any{
			"t":       entry.T,
			"service": entry.Service,
			"line":    fmt.Sprintf("[%d] %s %s (%dms)", entry.Status, entry.Method, entry.Path, entry.MS),
		})
	}
	return map[string]any{
		"available": true,
		"source":    "gateway-ring-buffer",
		"total":     total,
		"entries":   entries,
	}
}

func matchesRequestLog(entry monitorLogEntry, service, level, contains string) bool {
	if service != "" && !strings.Contains(strings.ToLower(entry.Service), service) {
		return false
	}
	entryLevel := "INFO"
	if entry.Status >= http.StatusInternalServerError {
		entryLevel = "ERROR"
	} else if entry.Status >= http.StatusBadRequest {
		entryLevel = "WARN"
	}
	if level != "" && level != entryLevel {
		return false
	}
	if contains == "" {
		return true
	}
	searchable := strings.ToLower(fmt.Sprintf("%s %s %s %d", entry.Service, entry.Method, entry.Path, entry.Status))
	return strings.Contains(searchable, contains)
}

func summarizeSlowRequests(logs []monitorLogEntry) map[string]any {
	slowest := make([]monitorLogEntry, 0)
	byService := make(map[string]float64)
	var totalMS int64
	slowCount := 0
	for _, entry := range logs {
		if entry.MS < slowRequestThreshold {
			continue
		}
		slowest = append(slowest, entry)
		slowCount++
		totalMS += entry.MS
		if float64(entry.MS) > byService[entry.Service] {
			byService[entry.Service] = float64(entry.MS)
		}
	}
	sort.Slice(slowest, func(i, j int) bool {
		return slowest[i].MS > slowest[j].MS
	})
	if len(slowest) > 12 {
		slowest = slowest[:12]
	}

	worstMS := float64(0)
	if len(slowest) > 0 {
		worstMS = float64(slowest[0].MS)
	}
	averageMS := float64(0)
	if slowCount > 0 {
		averageMS = float64(totalMS) / float64(slowCount)
	}
	return map[string]any{
		"available":   true,
		"thresholdMs": slowRequestThreshold,
		"total":       slowCount,
		"worstMs":     worstMS,
		"avgMs":       roundOneDecimal(averageMS),
		"byService":   byService,
		"slowest":     slowest,
	}
}

func cloneRequestCounts(source map[string]uint64) map[string]uint64 {
	copy := make(map[string]uint64, len(source))
	for name, count := range source {
		copy[name] = count
	}
	return copy
}

func roundOneDecimal(value float64) float64 {
	return float64(int(value*10+0.5)) / 10
}
