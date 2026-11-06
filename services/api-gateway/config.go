package main

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"restpoint/api-gateway-go/config"
)

type Config struct {
	Address            string
	Environment        string
	JWTSecret          []byte
	TrustProxy         bool
	AllowedOrigins     map[string]struct{}
	RateLimitWindow    time.Duration
	AuthRateLimitWindow time.Duration
	RateLimitGeneral   int
	RateLimitAuth      int
	RateLimitWrite     int
	ProxyTimeout       time.Duration
	Services           map[string]*url.URL
	DeceasedMTLS       bool
	DeceasedCAFile     string
	DeceasedCertFile   string
	DeceasedKeyFile    string
	SoftwareIdentity   *config.SoftwareIdentity
}

type serviceDefinition struct {
	env      string
	docker   string
	host     string
}

var serviceDefinitions = map[string]serviceDefinition{
	"auth":         {"AUTH_SERVICE_URL", "http://restpoint_auth_service:5000", "http://127.0.0.1:5001"},
	"tenant":       {"TENANT_SERVICE_URL", "http://restpoint_tenant_service:5000", "http://127.0.0.1:5002"},
	"deceased":     {"DECEASED_SERVICE_URL", "http://restpoint_deceased_service:5000", "http://127.0.0.1:5003"},
	"coffin":       {"COFFIN_SERVICE_URL", "http://restpoint_coffin_service:5000", "http://127.0.0.1:5006"},
	"invoices":     {"INVOICES_SERVICE_URL", "http://restpoint_invoice_service:5000", "http://127.0.0.1:5005"},
	"notification": {"NOTIFICATION_SERVICE_URL", "http://restpoint_socketio_service:5000", "http://127.0.0.1:5018"},
	"documents":    {"DOCUMENTS_SERVICE_URL", "http://restpoint_documents_service:5000", "http://127.0.0.1:5007"},
	"analytics":    {"ANALYTICS_SERVICE_URL", "http://restpoint_analytics_service:5000", "http://127.0.0.1:5009"},
	"insurance":    {"INSURANCE_SERVICE_URL", "http://restpoint_insurance_service:5050", "http://127.0.0.1:5050"},
	"mpesa":        {"MPESA_SERVICE_URL", "http://restpoint_mpesa_service:4040", "http://127.0.0.1:4040"},
	"bodycheckout": {"BODYCHECKOUT_SERVICE_URL", "http://restpoint_bodycheckout_service:5000", "http://127.0.0.1:5015"},
	"edocuments":   {"EDOCUMENTS_SERVICE_URL", "http://restpoint_edocuments_service:5000", ""},
	"calendar":     {"CALENDAR_SERVICE_URL", "http://restpoint_calender_service:5000", ""},
	"chemicals":    {"CHEMICALS_SERVICE_URL", "http://restpoint_chemical_service:5000", "http://127.0.0.1:5105"},
	"billing":      {"BILLING_SERVICE_URL", "http://restpoint_billing_service:5000", "http://127.0.0.1:5020"},
	"socketio":     {"SOCKETIO_SERVICE_URL", "http://restpoint_socketio_service:5000", "http://127.0.0.1:5018"},
	"workshop":     {"WORKSHOP_SERVICE_URL", "http://restpoint_workshop_service:6969", "http://127.0.0.1:6969"},
	"extra":        {"EXTRA_SERVICES_URL", "http://restpoint_extra_services:5000", "http://127.0.0.1:5016"},
	"hearse":       {"HEARSE_SERVICE_URL", "http://restpoint_hearse_service:5000", "http://127.0.0.1:5023"},
	"leave":        {"LEAVE_SERVICE_URL", "http://restpoint_hr_service:5000", "http://127.0.0.1:5017"},
	"hrPayroll":    {"HR_PAYROLL_SERVICE_URL", "http://restpoint_hr_payroll_api:8080", "http://127.0.0.1:5080"},
	"support":      {"SUPPORT_SERVICE_URL", "http://restpoint_support_service:5000", "http://127.0.0.1:8111"},
	"florist":      {"FLORIST_SERVICE_URL", "http://restpoint_florist_service:5000", "http://127.0.0.1:7070"},
	"store":        {"STORE_SERVICE_URL", "http://restpoint_store_service:5000", "http://127.0.0.1:7071"},
}

var serviceRoutes = map[string]string{
	"auth": "auth", "login": "auth", "register": "auth", "logout": "auth",
	"refresh": "auth", "users": "auth", "change-password": "auth", "me": "auth",
	"tenant": "tenant", "tenants": "tenant", "system-admin": "tenant", "uploads": "tenant",
	"blog": "tenant", "blog-engagement": "tenant", "onboarding": "tenant",
	"deceased": "deceased", "autopsy": "deceased", "postmortem": "deceased",
	"postmortem-requests": "deceased", "charges": "deceased", "payments": "deceased",
	"charge-settings": "deceased", "embalming": "deceased", "public": "deceased",
	"hearses": "hearse", "hearse-bookings": "hearse", "hearse-lineups": "hearse",
	"hearse-fuel": "hearse", "all-drivers": "hearse", "drivers": "hearse",
	"availability": "hearse",
	"coffin": "coffin", "coffins": "coffin", "chemicals": "chemicals", "support": "support",
	"invoices": "invoices", "billing": "billing", "workshop": "workshop", "florist": "florist",
	"documents": "documents", "notification": "notification", "notifications": "notification",
	"edocuments": "edocuments", "leaves": "leave", "attendance": "leave", "hr": "hrPayroll",
	"analytics": "analytics", "insurance": "insurance", "mpesa": "mpesa",
	"bodycheckout": "bodycheckout", "body-release": "bodycheckout", "extra": "extra",
	"store": "store", "store-service": "store",
}

func loadConfig() (Config, error) {
	cfg := Config{
		Address:          env("HOST", "0.0.0.0") + ":" + env("PORT", "5000"),
		Environment:      env("NODE_ENV", "development"),
		TrustProxy:       strings.EqualFold(os.Getenv("TRUST_PROXY"), "true"),
		AllowedOrigins:   make(map[string]struct{}),
		RateLimitWindow:  time.Duration(positiveInt("RATE_LIMIT_WINDOW_MS", 900000)) * time.Millisecond,
		AuthRateLimitWindow: time.Duration(positiveInt("RATE_LIMIT_AUTH_WINDOW_MS", 900000)) * time.Millisecond,
		RateLimitGeneral: positiveInt("RATE_LIMIT_MAX_REQUESTS", 600),
		RateLimitAuth:    positiveInt("RATE_LIMIT_AUTH_MAX", 10),
		RateLimitWrite:   positiveInt("RATE_LIMIT_WRITE_MAX", 200),
		ProxyTimeout:     time.Duration(positiveInt("GATEWAY_PROXY_TIMEOUT_MS", 900_000)) * time.Millisecond,
		Services:         make(map[string]*url.URL),
		DeceasedMTLS:     strings.EqualFold(os.Getenv("DECEASED_MTLS_REQUIRED"), "true"),
		DeceasedCAFile:   os.Getenv("DECEASED_MTLS_CA_FILE"),
		DeceasedCertFile: os.Getenv("DECEASED_MTLS_CERT_FILE"),
		DeceasedKeyFile:  os.Getenv("DECEASED_MTLS_KEY_FILE"),
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = os.Getenv("JWT_SECRET_KEY")
	}
	if secret == "" {
		if cfg.Environment == "production" {
			return Config{}, errors.New("JWT_SECRET or JWT_SECRET_KEY is required in production")
		}
		random := make([]byte, 48)
		if _, err := rand.Read(random); err != nil {
			return Config{}, fmt.Errorf("generate development JWT secret: %w", err)
		}
		secret = base64.RawURLEncoding.EncodeToString(random)
	}
	cfg.JWTSecret = []byte(secret)

	defaultOrigins := []string{
		"https://restpoint.co.ke", "https://www.restpoint.co.ke",
		"https://paymontenzuma.restpoint.co.ke", "http://localhost:5173",
		"http://localhost:3000", "http://localhost:5174",
	}
	defaultOrigins = append(defaultOrigins, strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")...)
	for _, origin := range defaultOrigins {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			cfg.AllowedOrigins[origin] = struct{}{}
		}
	}

	inContainer := os.Getenv("RUNNING_IN_DOCKER") == "true"
	if _, err := os.Stat("/.dockerenv"); err == nil {
		inContainer = true
	}
	for name, definition := range serviceDefinitions {
		raw := strings.TrimSpace(os.Getenv(definition.env))
		if raw == "" {
			raw = definition.docker
			if !inContainer && definition.host != "" {
				raw = definition.host
			}
		}
		target, err := url.Parse(raw)
		if err != nil || target.Host == "" || (target.Scheme != "http" && target.Scheme != "https") {
			return Config{}, fmt.Errorf("invalid URL configured for %s", definition.env)
		}
		cfg.Services[name] = target
	}

	if cfg.Environment == "production" && !cfg.DeceasedMTLS {
		return Config{}, errors.New("DECEASED_MTLS_REQUIRED must be true in production")
	}
	if cfg.DeceasedMTLS {
		deceased := cfg.Services["deceased"]
		if deceased.Scheme != "https" {
			return Config{}, errors.New("DECEASED_SERVICE_URL must use HTTPS when deceased-service mTLS is required")
		}
		if cfg.DeceasedCAFile == "" || cfg.DeceasedCertFile == "" || cfg.DeceasedKeyFile == "" {
			return Config{}, errors.New("deceased-service mTLS CA, client certificate, and key file paths are required")
		}
	}

	releaseID := env("SOFTWARE_RELEASE_ID", "")
	if releaseID == "" {
		if commit, err := latestGitCommit(); err == nil && commit != "" {
			releaseID = commit
		} else {
			releaseID = config.Identity.ReleaseID
		}
	}

	identity := &config.SoftwareIdentity{
		Name:          env("SOFTWARE_NAME", config.Identity.Name),
		ProductID:     env("SOFTWARE_PRODUCT_ID", config.Identity.ProductID),
		ProductCode:   env("SOFTWARE_PRODUCT_CODE", config.Identity.ProductCode),
		Version:       env("SOFTWARE_VERSION", config.Identity.Version),
		Build:         env("SOFTWARE_BUILD", config.Identity.Build),
		ReleaseID:     releaseID,
		ReleaseStatus: env("SOFTWARE_RELEASE_STATUS", config.Identity.ReleaseStatus),
		Copyright:     env("SOFTWARE_COPYRIGHT", config.Identity.Copyright),
	}
	cfg.SoftwareIdentity = identity

	return cfg, nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func positiveInt(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

// latestGitCommit returns the short SHA of the latest commit (e.g. "4847a846").
// It is used to stamp the software ReleaseID dynamically from GitHub.
// Returns an empty string and an error if git is unavailable or not a repository.
func latestGitCommit() (string, error) {
	cmd := exec.Command("git", "rev-parse", "--short", "HEAD")
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}
