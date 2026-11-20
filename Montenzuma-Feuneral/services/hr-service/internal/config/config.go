package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App           AppConfig
	DB            DBConfig
	Auth          AuthConfig
	Log           LogConfig
	RateLimit     RateLimitConfig
	Casbin        CasbinConfig
	Redis         RedisConfig
	Asynq         AsynqConfig
	Security      SecurityConfig
	CORS          CORSConfig
	Notification  NotificationConfig
	WebSocket     WebSocketConfig
	Scheduler     SchedulerConfig
	Asset         AssetConfig
	OTP           OTPConfig
	Google        GoogleConfig
	Captcha       CaptchaConfig
	PasswordReset PasswordResetConfig
	CashForecast  CashForecastConfig
	// Tenant concurrency limit for per-tenant middleware
	TenantConcurrencyLimit int
	// Request timeout applied to each incoming HTTP request (e.g. "10s")
	RequestTimeout time.Duration
	// Tenant queue worker settings for per-tenant background tasks
	TenantQueueWorkers int
	TenantQueueBuffer  int
}

type AppConfig struct {
	Env  string
	Port string
	// TrustedProxies is a list of CIDRs/IPs whose X-Forwarded-For headers gin
	// will trust when resolving the real client IP (used for rate limiting and
	// audit logging). Defaults to loopback only; set to your nginx/LB CIDR in
	// production via the TRUSTED_PROXIES env var (comma-separated).
	TrustedProxies []string
}

type DBConfig struct {
	Driver string
	DSN    string
	// Connection pool settings
	MaxIdleConns    int
	MaxOpenConns    int
	ConnMaxLifetime time.Duration
	// If true, app expects to be behind a connection pooler like PgBouncer
	UseConnectionPooler bool
}

type AuthConfig struct {
	JWTSecret string
	AccessTTL time.Duration
}

// OTPConfig backs the email-OTP 2FA feature gated behind OTP_ENABLE (default off).
// When Enabled, admin/partner logins require an emailed one-time code; see
// plans/260704-1400-otp-2fa-admin-partner/. No stored secret is required
// (email-OTP generates codes per-login), so unlike a TOTP scheme there is no key.
type OTPConfig struct {
	Enabled        bool
	CodeTTL        time.Duration // pending-session TTL (default 5m)
	MaxAttempts    int           // per-account failed-verify cap (default 5)
	LockDuration   time.Duration // lockout window once cap hit (default 15m)
	ResendCooldown time.Duration // min gap between resend requests (default 30s)
}

// PasswordResetConfig backs the self-service email password-reset feature.
// Users with an email on file can request a single-use magic link (30-min TTL)
// to set a new password; the flow reuses the existing Resend email infra and
// Redis for token storage. See plans/260724-2100-password-reset-email/.
type PasswordResetConfig struct {
	Enabled          bool          // PASSWORD_RESET_ENABLE (default true — low-risk self-service)
	TokenTTL         time.Duration // PASSWORD_RESET_TOKEN_TTL (default 30m)
	RateLimitPerHour int           // PASSWORD_RESET_RATE_LIMIT (default 3, per normalized email)
	ResetURL         string        // PASSWORD_RESET_URL (default "https://restpoint.co.ke/reset-password")
}

// GoogleConfig holds Google OIDC settings. GoogleClientID is the OAuth client
// id_token audience; GoogleOAuthEnabled flips the "Sign in with Google" flow on
// (when off, the endpoint 404s / errors). The client ID is public by design —
// it is not a secret — but is fail-fast-validated at boot so a misconfigured
// deploy fails to start rather than failing at first Google login.
type GoogleConfig struct {
	OAuthEnabled bool
	ClientID     string
}

// CaptchaConfig controls the self-hosted image CAPTCHA (base64Captcha + Redis).
// When Enabled, a digit-image CAPTCHA is required after `Threshold` consecutive
// login failures. Default off — purely additive. Gated by CAPTCHA_ENABLE.
type CaptchaConfig struct {
	Enabled    bool
	Threshold  int           // failures before CAPTCHA is required (default 3)
	CodeTTL    time.Duration // challenge lifetime (default 5m)
	CodeLength int           // digits in the code (default 5)
}

type LogConfig struct {
	Level string
	File  string
}

type RateLimitConfig struct {
	RPS int
}

type CasbinConfig struct {
	ModelPath  string
	PolicyPath string
}

type RedisConfig struct {
	Addr string
	DB   int
}

type AsynqConfig struct {
	RedisAddr       string
	RedisDB         int
	Concurrency     int
	RetryMax        int
	ShutdownTimeout time.Duration
}

type SecurityConfig struct {
	HashSecret string
	HashSalt   string
}

type CORSConfig struct {
	AllowOrigins     []string
	AllowCredentials bool
}

type NotificationConfig struct {
	EmailEnabled      bool
	DefaultRecipients []string
	DefaultCC         []string
	DefaultBCC        []string
	ResendAPIKey      string
	SendTimeout       time.Duration
	VAPIDPublicKey    string
	VAPIDPrivateKey   string
	VAPIDSubject      string // e.g. "mailto:admin@tingting.vip"
}

type WebSocketConfig struct {
	Enabled      bool
	Path         string
	Port         string
	AllowOrigins []string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	PingInterval time.Duration
}

type SchedulerConfig struct {
	Enabled                  bool
	Timezone                 string
	TimesheetReminderEnabled bool
	PayrollReminderEnabled   bool
	NotificationDays         []int // Days of month (9, 16, 23, -1 for last day)
	ReminderDays             []int // T-1 days (8, 15, 22, -2 for last-1 day)
}

type AssetConfig struct {
	StoragePath string
	BaseURL     string
	MaxFileSize int64
	CleanupDays int
}

// CashForecastConfig governs the advisory timesheet cash-readiness forecast on
// /admin/timesheet ("how much cash to prepare for the next weekly bulk
// transfer"). Like the wallet forecast, this is DISPLAY ONLY — it never
// initiates a bank transfer or modifies wallet records.
//
// All fields optional; defaults give a p95 band, a 5000-draw Monte Carlo, a
// 6-month cohort lookback (≈ 24 Ky observations across Ky 1–4), a 2-day
// prepare-by lead window, and no extra safety stock.
type CashForecastConfig struct {
	ServiceLevel              float64 // env CASH_FORECAST_SERVICE_LEVEL, default 0.95
	NSim                      int     // env CASH_FORECAST_N_SIM, default 5000
	HistoryMonths             int     // env CASH_FORECAST_HISTORY_MONTHS, default 6
	LeadDays                  int     // env CASH_FORECAST_LEAD_DAYS, default 2
	GrowthEWMAlpha            float64 // retained for v1 compatibility
	WAPEThreshold             float64 // measured reliability threshold, default 0.10
	AbsBiasThreshold          float64 // measured reliability threshold, default 0.03
	ReserveShortfallThreshold float64 // measured reliability threshold, default 0.10
	CoverageMin               float64 // central interval coverage lower bound, default 0.85
	CoverageMax               float64 // central interval coverage upper bound, default 0.95
}

func Load() (*Config, error) {
	// Load .env file if it exists (ignore errors in production)
	_ = godotenv.Load()

	// Determine environment-aware defaults
	env := getEnv("APP_ENV", "dev")
	storagePath := "./uploads"
	storageBaseURL := "http://localhost:8080/uploads"
	if env == "production" {
		storagePath = "/app/uploads"
		storageBaseURL = "https://tingting.vip/uploads"
	}

	cfg := &Config{
		App: AppConfig{
			Env:            getEnv("APP_ENV", "dev"),
			Port:           getEnv("APP_PORT", "8080"),
			TrustedProxies: parseStringSlice(getEnv("TRUSTED_PROXIES", "127.0.0.1,::1")),
		},
		DB: DBConfig{
			Driver:              getEnv("DB_DRIVER", "mysql"),
			DSN:                 getEnv("DB_DSN", "user:pass@tcp(localhost:3306)/appdb?parseTime=true&loc=Local"),
			MaxIdleConns:        parseInt(getEnv("DB_MAX_IDLE_CONNS", "10")),
			MaxOpenConns:        parseInt(getEnv("DB_MAX_OPEN_CONNS", "100")),
			ConnMaxLifetime:     parseDuration(getEnv("DB_CONN_MAX_LIFETIME", "1h")),
			UseConnectionPooler: parseBool(getEnv("DB_USE_POOLER", "false")),
		},
		Auth: AuthConfig{
			JWTSecret: getEnv("JWT_SECRET", ""),
			AccessTTL: 14 * 24 * time.Hour, // 14 days — hardcoded, not configurable via env
		},
		Log: LogConfig{
			Level: getEnv("LOG_LEVEL", "info"),
			File:  getEnv("LOG_FILE", "logs/app.log"),
		},
		RateLimit: RateLimitConfig{
			RPS: parseInt(getEnv("RATE_LIMIT_RPS", "50")),
		},
		Casbin: CasbinConfig{
			ModelPath:  getEnv("CASBIN_MODEL_PATH", "./configs/casbin_model.conf"),
			PolicyPath: getEnv("CASBIN_POLICY_PATH", "./configs/casbin_policy.csv"),
		},
		Redis: RedisConfig{
			Addr: getEnv("REDIS_ADDR", "localhost:6379"),
			DB:   parseInt(getEnv("REDIS_DB", "0")),
		},
		Asynq: AsynqConfig{
			RedisAddr:       getEnv("ASYNQ_REDIS_ADDR", getEnv("REDIS_ADDR", "localhost:6379")),
			RedisDB:         parseInt(getEnv("ASYNQ_REDIS_DB", "1")),
			Concurrency:     parseInt(getEnv("ASYNQ_CONCURRENCY", "20")),
			RetryMax:        parseInt(getEnv("ASYNQ_RETRY_MAX", "5")),
			ShutdownTimeout: parseDuration(getEnv("ASYNQ_SHUTDOWN_TIMEOUT", "30s")),
		},
		Security: SecurityConfig{
			HashSecret: getEnv("HASH_SECRET", ""),
			HashSalt:   getEnv("HASH_SALT", ""),
		},
		CORS: CORSConfig{
			AllowOrigins:     parseStringSlice(getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://tingting.vip,https://www.tingting.vip")),
			AllowCredentials: parseBool(getEnv("CORS_ALLOW_CREDENTIALS", "true")),
		},
		Notification: NotificationConfig{
			EmailEnabled:      true,
			DefaultRecipients: []string{},
			DefaultCC:         []string{},
			DefaultBCC:        []string{},
			ResendAPIKey:      getEnv("RESEND_API_KEY", ""),
			SendTimeout:       parseDuration(getEnv("EMAIL_SEND_TIMEOUT", "30s")),
			VAPIDPublicKey:    getEnv("VAPID_PUBLIC_KEY", ""),
			VAPIDPrivateKey:   getEnv("VAPID_PRIVATE_KEY", ""),
			VAPIDSubject:      getEnv("VAPID_SUBJECT", "mailto:admin@tingting.vip"),
		},
		WebSocket: WebSocketConfig{
			Enabled:      parseBool(getEnv("WEBSOCKET_ENABLED", "true")),
			Path:         getEnv("WEBSOCKET_PATH", "/ws"),
			Port:         getEnv("WEBSOCKET_PORT", "8081"),
			AllowOrigins: parseStringSlice(getEnv("WEBSOCKET_ALLOW_ORIGINS", "http://localhost:3000")),
			ReadTimeout:  parseDuration(getEnv("WEBSOCKET_READ_TIMEOUT", "60s")),
			WriteTimeout: parseDuration(getEnv("WEBSOCKET_WRITE_TIMEOUT", "10s")),
			PingInterval: parseDuration(getEnv("WEBSOCKET_PING_INTERVAL", "54s")),
		},
		Scheduler: SchedulerConfig{
			Enabled:                  parseBool(getEnv("SCHEDULER_ENABLED", "true")),
			Timezone:                 getEnv("SCHEDULER_TIMEZONE", "Africa/Nairobi"),
			TimesheetReminderEnabled: parseBool(getEnv("TIMESHEET_REMINDER_ENABLED", "true")),
			PayrollReminderEnabled:   parseBool(getEnv("PAYROLL_REMINDER_ENABLED", "true")),
			NotificationDays:         parseIntSlice(getEnv("NOTIFICATION_DAYS", "9,16,23,-1")),
			ReminderDays:             parseIntSlice(getEnv("REMINDER_DAYS", "8,15,22,-2")),
		},
		Asset: AssetConfig{
			StoragePath: getEnv("ASSET_STORAGE_PATH", storagePath),
			BaseURL:     getEnv("ASSET_BASE_URL", storageBaseURL),
			MaxFileSize: parseInt64(getEnv("ASSET_MAX_FILE_SIZE", "10485760")), // 10MB default
			CleanupDays: parseInt(getEnv("ASSET_CLEANUP_DAYS", "30")),
		},
		OTP: OTPConfig{
			Enabled:        parseBool(getEnv("OTP_ENABLE", "false")),
			CodeTTL:        parseDuration(getEnv("OTP_CODE_TTL", "5m")),
			MaxAttempts:    parseInt(getEnv("OTP_MAX_ATTEMPTS", "5")),
			LockDuration:   parseDuration(getEnv("OTP_LOCK_DURATION", "15m")),
			ResendCooldown: parseDuration(getEnv("OTP_RESEND_COOLDOWN", "30s")),
		},
		Google: GoogleConfig{
			OAuthEnabled: parseBool(getEnv("GOOGLE_OAUTH_ENABLED", "true")),
			ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		},
		PasswordReset: PasswordResetConfig{
			Enabled:          parseBool(getEnv("PASSWORD_RESET_ENABLE", "true")),
			TokenTTL:         parseDuration(getEnv("PASSWORD_RESET_TOKEN_TTL", "30m")),
			RateLimitPerHour: parseInt(getEnv("PASSWORD_RESET_RATE_LIMIT", "3")),
			ResetURL:         getEnv("PASSWORD_RESET_URL", "https://restpoint.co.ke/reset-password"),
		},
		Captcha: CaptchaConfig{
			Enabled:    parseBool(getEnv("CAPTCHA_ENABLE", "false")),
			Threshold:  parseInt(getEnv("CAPTCHA_THRESHOLD", "3")),
			CodeTTL:    parseDuration(getEnv("CAPTCHA_CODE_TTL", "5m")),
			CodeLength: parseInt(getEnv("CAPTCHA_CODE_LENGTH", "5")),
		},
		CashForecast: CashForecastConfig{
			ServiceLevel:              parseFloat(getEnv("CASH_FORECAST_SERVICE_LEVEL", "0.95")),
			NSim:                      parseInt(getEnv("CASH_FORECAST_N_SIM", "5000")),
			HistoryMonths:             parseInt(getEnv("CASH_FORECAST_HISTORY_MONTHS", "6")),
			LeadDays:                  parseInt(getEnv("CASH_FORECAST_LEAD_DAYS", "2")),
			GrowthEWMAlpha:            parseFloat(getEnv("CASH_FORECAST_GROWTH_EWMA_ALPHA", "0.5")),
			WAPEThreshold:             parseFloat(getEnv("CASH_FORECAST_WAPE_THRESHOLD", "0.10")),
			AbsBiasThreshold:          parseFloat(getEnv("CASH_FORECAST_ABS_BIAS_THRESHOLD", "0.03")),
			ReserveShortfallThreshold: parseFloat(getEnv("CASH_FORECAST_RESERVE_SHORTFALL_THRESHOLD", "0.10")),
			CoverageMin:               parseFloat(getEnv("CASH_FORECAST_COVERAGE_MIN", "0.85")),
			CoverageMax:               parseFloat(getEnv("CASH_FORECAST_COVERAGE_MAX", "0.95")),
		},
		TenantConcurrencyLimit: parseInt(getEnv("TENANT_CONCURRENCY_LIMIT", "10")),
		RequestTimeout:         parseDuration(getEnv("REQUEST_TIMEOUT", "10s")),
		TenantQueueWorkers:     parseInt(getEnv("TENANT_QUEUE_WORKERS", "5")),
		TenantQueueBuffer:      parseInt(getEnv("TENANT_QUEUE_BUFFER", "20")),
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return cfg, nil
}

// LoadSecurityConfig loads and validates only the password-hashing subset of
// the config (HASH_SECRET + HASH_SALT) for offline tools like cmd/hashpw.
// Unlike Load(), it does not require the full app config (JWT, OAuth, email
// gates) because none of it affects hash generation, and the hashes it
// produces must verify against the SAME values the local server runs with.
func LoadSecurityConfig() (SecurityConfig, error) {
	// Load .env if present (same behavior as Load(); godotenv does not
	// override variables already set in the environment).
	_ = godotenv.Load()

	c := SecurityConfig{
		HashSecret: getEnv("HASH_SECRET", ""),
		HashSalt:   getEnv("HASH_SALT", ""),
	}

	var missing []string
	if c.HashSecret == "" {
		missing = append(missing, "HASH_SECRET")
	}
	if c.HashSalt == "" {
		missing = append(missing, "HASH_SALT")
	}
	if len(missing) > 0 {
		return c, fmt.Errorf("%s must be set", strings.Join(missing, ", "))
	}
	return c, nil
}

func (c *Config) validate() error {
	if c.Auth.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET must be set")
	}

	if c.Security.HashSecret == "" {
		return fmt.Errorf("HASH_SECRET must be set")
	}

	if c.Security.HashSalt == "" {
		return fmt.Errorf("HASH_SALT must be set")
	}

	// Email-OTP 2FA fail-fast: when the feature is enabled, a working email
	// config is mandatory (codes are delivered via Resend). Without this, an
	// enabled-but-misconfigured deploy would silently lock out every admin/partner.
	if c.OTP.Enabled {
		if c.Notification.ResendAPIKey == "" {
			return fmt.Errorf("RESEND_API_KEY must be set when OTP_ENABLE=true")
		}
	}

	// Google OIDC fail-fast: when the flow is enabled, the client ID must be set
	// (it is the audience the id_token is bound to). The ID is public, not a
	// secret — but a missing one means Google login silently fails at runtime.
	if c.Google.OAuthEnabled && c.Google.ClientID == "" {
		return fmt.Errorf("GOOGLE_CLIENT_ID must be set when GOOGLE_OAUTH_ENABLED=true")
	}

	// Cash-readiness forecast: the band upper quantile must be a valid
	// probability and the lead window non-negative.
	if c.CashForecast.ServiceLevel > 0 && (c.CashForecast.ServiceLevel < 0.5 || c.CashForecast.ServiceLevel > 0.999) {
		return fmt.Errorf(
			"config: CASH_FORECAST_SERVICE_LEVEL must be in [0.5, 0.999], got %v",
			c.CashForecast.ServiceLevel,
		)
	}
	if c.CashForecast.LeadDays < 0 {
		return fmt.Errorf(
			"config: CASH_FORECAST_LEAD_DAYS must be non-negative, got %d",
			c.CashForecast.LeadDays,
		)
	}
	if c.CashForecast.HistoryMonths > 0 && c.CashForecast.HistoryMonths < 3 {
		return fmt.Errorf(
			"config: CASH_FORECAST_HISTORY_MONTHS must be 0 (default 6) or >= 3, got %d",
			c.CashForecast.HistoryMonths,
		)
	}
	if c.CashForecast.NSim > 0 && c.CashForecast.NSim < 1000 {
		return fmt.Errorf(
			"config: CASH_FORECAST_N_SIM must be 0 (default 5000) or >= 1000, got %d",
			c.CashForecast.NSim,
		)
	}
	if c.CashForecast.GrowthEWMAlpha < 0 || c.CashForecast.GrowthEWMAlpha > 1 {
		return fmt.Errorf(
			"config: CASH_FORECAST_GROWTH_EWMA_ALPHA must be in (0, 1], got %v",
			c.CashForecast.GrowthEWMAlpha,
		)
	}
	if c.CashForecast.WAPEThreshold < 0 || c.CashForecast.WAPEThreshold > 1 {
		return fmt.Errorf("config: CASH_FORECAST_WAPE_THRESHOLD must be 0 (default) or in (0, 1], got %v", c.CashForecast.WAPEThreshold)
	}
	if c.CashForecast.AbsBiasThreshold < 0 || c.CashForecast.AbsBiasThreshold > 1 {
		return fmt.Errorf("config: CASH_FORECAST_ABS_BIAS_THRESHOLD must be 0 (default) or in (0, 1], got %v", c.CashForecast.AbsBiasThreshold)
	}
	if c.CashForecast.ReserveShortfallThreshold < 0 || c.CashForecast.ReserveShortfallThreshold > 1 {
		return fmt.Errorf("config: CASH_FORECAST_RESERVE_SHORTFALL_THRESHOLD must be 0 (default) or in (0, 1], got %v", c.CashForecast.ReserveShortfallThreshold)
	}
	if c.CashForecast.CoverageMin < 0 || c.CashForecast.CoverageMin > 1 || c.CashForecast.CoverageMax < 0 || c.CashForecast.CoverageMax > 1 {
		return fmt.Errorf("config: cash forecast coverage bounds must be 0 (default) or in (0, 1], got [%v, %v]", c.CashForecast.CoverageMin, c.CashForecast.CoverageMax)
	}
	if c.CashForecast.CoverageMin > 0 && c.CashForecast.CoverageMax > 0 && c.CashForecast.CoverageMin > c.CashForecast.CoverageMax {
		return fmt.Errorf("config: CASH_FORECAST_COVERAGE_MIN must not exceed CASH_FORECAST_COVERAGE_MAX, got [%v, %v]", c.CashForecast.CoverageMin, c.CashForecast.CoverageMax)
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// splitCSV parses a comma-separated env value into trimmed, non-empty parts —
// "LGD, ABC" → ["LGD", "ABC"]; "" → nil.
func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// getEnvWithEmpty is like getEnv but distinguishes between "not set" (returns
// default) and "set to empty string" (returns ""). This lets callers express
// "I explicitly want no values" — e.g. ONEPAY_ALLOWED_IPS= disables the IP
// whitelist in development so the mock's Docker-internal IP isn't blocked.
func getEnvWithEmpty(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

func parseInt(s string) int {
	i, _ := strconv.Atoi(s)
	return i
}

func parseInt64(s string) int64 {
	i, _ := strconv.ParseInt(s, 10, 64)
	return i
}

func parseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func parseDuration(s string) time.Duration {
	d, _ := time.ParseDuration(s)
	return d
}

func parseBool(s string) bool {
	b, _ := strconv.ParseBool(s)
	return b
}

func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func parseIntSlice(s string) []int {
	if s == "" {
		return []int{}
	}
	parts := strings.Split(s, ",")
	result := make([]int, 0, len(parts))
	for _, part := range parts {
		if num, err := strconv.Atoi(strings.TrimSpace(part)); err == nil {
			result = append(result, num)
		}
	}
	return result
}
