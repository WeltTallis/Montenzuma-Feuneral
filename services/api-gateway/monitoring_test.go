package main

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestMonitoringReportsLiveGatewayMetricsAndRequestLogs(t *testing.T) {
	const secret = "monitoring-test-secret"
	healthServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			t.Errorf("health probe path = %q, want /health", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
	}))
	
	defer healthServer.Close()

	target, err := url.Parse(healthServer.URL)
	if err != nil {
		t.Fatal(err)
	}
	gateway := &Gateway{
		config: Config{
			Environment: "test",
			JWTSecret:   []byte(secret),
			Services:    map[string]*url.URL{"deceased": target},
		},
		logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
		identity:       newIdentityCache(),
		identityClient: healthServer.Client(),
		limiters:       newRateLimiter(),
		startedAt:      time.Now().Add(-time.Minute),
		perService:     make(map[string]serviceRequestStats),
	}
	request := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/restpoint/deceased/deceased-all?private=value",
		nil,
	)
	gateway.recordAPIRequest(request, http.StatusOK, 125*time.Millisecond)

	token := testToken(t, map[string]any{"userId": "admin-1", "role": "admin"}, []byte(secret))
	reportRequest := httptest.NewRequest(http.MethodGet, "/monitoring", nil)
	reportRequest.Header.Set("Authorization", "Bearer "+token)
	reportResponse := httptest.NewRecorder()
	gateway.ServeHTTP(reportResponse, reportRequest)
	if reportResponse.Code != http.StatusOK {
		t.Fatalf("monitoring status = %d, want 200: %s", reportResponse.Code, reportResponse.Body.String())
	}

	var report struct {
		Success bool `json:"success"`
		Data    struct {
			Summary struct {
				Total         uint64  `json:"total"`
				ServicesUp    int     `json:"servicesUp"`
				ServicesTotal int     `json:"servicesTotal"`
				AvgLatencyMS  float64 `json:"avgLatencyMs"`
			} `json:"summary"`
			Requests struct {
				PerService map[string]map[string]uint64 `json:"perService"`
			} `json:"requests"`
			Services []monitorServiceStatus `json:"services"`
			Series   []monitorSeriesPoint   `json:"series"`
			Logs     []monitorLogEntry      `json:"logs"`
		} `json:"data"`
	}
	if err := json.Unmarshal(reportResponse.Body.Bytes(), &report); err != nil {
		t.Fatal(err)
	}
	if !report.Success || report.Data.Summary.Total != 1 {
		t.Fatalf("report summary = %+v, want one recorded API request", report.Data.Summary)
	}
	if report.Data.Summary.ServicesUp != 1 || report.Data.Summary.ServicesTotal != 1 {
		t.Fatalf("service summary = %+v, want one healthy service", report.Data.Summary)
	}
	if report.Data.Summary.AvgLatencyMS != 125 {
		t.Fatalf("average latency = %vms, want 125ms", report.Data.Summary.AvgLatencyMS)
	}
	if report.Data.Requests.PerService["deceased"]["count"] != 1 {
		t.Fatalf("deceased request count = %+v, want 1", report.Data.Requests.PerService)
	}
	if len(report.Data.Series) != 1 || report.Data.Series[0].Total != 1 {
		t.Fatalf("series = %+v, want one sample with total 1", report.Data.Series)
	}
	if len(report.Data.Logs) != 1 || strings.Contains(report.Data.Logs[0].Path, "private") {
		t.Fatalf("request logs = %+v, expected query-free path", report.Data.Logs)
	}

	logRequest := httptest.NewRequest(
		http.MethodGet,
		"/monitoring/logs?service=deceased&level=INFO&contains=deceased-all",
		nil,
	)
	logRequest.Header.Set("Authorization", "Bearer "+token)
	logResponse := httptest.NewRecorder()
	gateway.ServeHTTP(logResponse, logRequest)
	if logResponse.Code != http.StatusOK {
		t.Fatalf("request-log status = %d, want 200: %s", logResponse.Code, logResponse.Body.String())
	}
	var logReport struct {
		Data struct {
			Available bool `json:"available"`
			Total     int  `json:"total"`
		} `json:"data"`
	}
	if err := json.Unmarshal(logResponse.Body.Bytes(), &logReport); err != nil {
		t.Fatal(err)
	}
	if !logReport.Data.Available || logReport.Data.Total != 1 {
		t.Fatalf("request-log report = %+v, want one matching entry", logReport.Data)
	}
}

func TestMonitoringRequiresAdministrator(t *testing.T) {
	const secret = "monitoring-test-secret"
	gateway := &Gateway{
		config: Config{
			JWTSecret: []byte(secret),
		},
		logger:   slog.New(slog.NewTextHandler(io.Discard, nil)),
		identity: newIdentityCache(),
	}

	unauthenticated := httptest.NewRecorder()
	gateway.ServeHTTP(unauthenticated, httptest.NewRequest(http.MethodGet, "/monitoring", nil))
	if unauthenticated.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status = %d, want 401", unauthenticated.Code)
	}

	staffToken := testToken(t, map[string]any{"userId": "staff-1", "role": "staff"}, []byte(secret))
	staffRequest := httptest.NewRequest(http.MethodGet, "/monitoring", nil)
	staffRequest.Header.Set("Authorization", "Bearer "+staffToken)
	forbidden := httptest.NewRecorder()
	gateway.ServeHTTP(forbidden, staffRequest)
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("staff status = %d, want 403", forbidden.Code)
	}
}
