package bootstrap

import (
	"context"
	"log/slog"

	bootstrapInfra "api-server/internal/app/bootstrap/infrastructure"
	bootstrapRepos "api-server/internal/app/bootstrap/repositories"
	bootstrapServices "api-server/internal/app/bootstrap/services"
	"api-server/internal/app/services/asset"
	"api-server/internal/app/services/auth"
	"api-server/internal/app/services/cleanup"
	dbExportSvc "api-server/internal/app/services/db_export"
	"api-server/internal/app/services/employee"
	"api-server/internal/app/services/ledger"
	"api-server/internal/app/services/notification"
	"api-server/internal/app/services/project"
	"api-server/internal/app/services/scheduler"
	"api-server/internal/app/workers"
	"api-server/internal/config"
	"api-server/internal/domain"
	domainServices "api-server/internal/domain/services"
	asynqinfra "api-server/internal/infra/asynq"
	"api-server/internal/infra/events"
	"api-server/internal/infra/persistence"
	"api-server/internal/infra/storage"
	"api-server/internal/pkg/clock"
	"api-server/internal/pkg/tenantqueue"
	"api-server/internal/transport/http/handlers"
	adminHandlers "api-server/internal/transport/http/handlers/admin"
	advPartnerHandlers "api-server/internal/transport/http/handlers/adv_partner"
	advancePaymentHandlers "api-server/internal/transport/http/handlers/advance_payment"
	approvalHandlers "api-server/internal/transport/http/handlers/approval"
	attendanceHandlers "api-server/internal/transport/http/handlers/attendance"
	employeeHandlers "api-server/internal/transport/http/handlers/employee"
	pushHandlers "api-server/internal/transport/http/handlers/push"
	timesheetHandlers "api-server/internal/transport/http/handlers/timesheet"
	"api-server/internal/transport/http/middleware"

	"github.com/gin-gonic/gin"
)

type Container struct {
	Config             *config.Config
	Logger             *slog.Logger
	DB                 *persistence.Database
	Redis              *persistence.RedisClient
	Scheduler          *scheduler.Scheduler
	TenantQueueManager *tenantqueue.Manager
	AsynqClient        *asynqinfra.Client
	AsynqServer        *asynqinfra.Server

	Repos      *bootstrapRepos.Repositories
	Services   *bootstrapServices.Services
	Handlers   *Handlers
	Middleware *Middleware
}

type Handlers struct {
	User                   *handlers.UserHandler
	Auth                   *handlers.AuthHandler
	Dashboard              *handlers.DashboardHandler
	Project                *handlers.ProjectHandler
	Employee               *handlers.EmployeeHandler
	EmployeeUsers          *employeeHandlers.EmployeeUsersHandler
	EmployeeProfile        *handlers.EmployeeProfileHandler
	ProjectEmployee        *handlers.ProjectEmployeeHandler
	AdminClock             *adminHandlers.ClockHandler
	AdminAttendance        *adminHandlers.AttendanceHandler
	Bank                   *handlers.BankHandler
	Timesheet              *handlers.TimesheetHandler
	TimesheetEditRequest   *handlers.TimesheetEditRequestHandler
	Payroll                *handlers.PayrollHandler
	Payrate                *handlers.PayrateHandler
	Ledger                 *handlers.LedgerHandler
	Transaction            *handlers.TransactionHandler
	Health                 *handlers.HealthHandler
	Notification           *handlers.NotificationHandler
	Settings               *handlers.SettingsHandler
	Asset                  *handlers.AssetHandler
	Cache                  *handlers.CacheHandler
	Email                  *handlers.EmailHandler
	Settlement             *handlers.SettlementHandler
	Metric                 *handlers.MetricHandler
	Audit                  *handlers.AuditHandler
	AdvancePayment         *advancePaymentHandlers.AdvancePaymentHandler
	AdvancePaymentFee      *advancePaymentHandlers.FeeScheduleHandler
	AdBanner               *handlers.AdBannerHandler
	EmployeeImport         *employeeHandlers.ImportHandler
	DBExport               *handlers.DBExportHandler
	Push                   *pushHandlers.Handler
	Approval               *approvalHandlers.Handler
	Cron                   *handlers.CronHandler
	WeeklyPaymentFee       *handlers.WeeklyPaymentFeeHandler
	Wallet                 *handlers.WalletHandler
	AdvPartnerUser         *advPartnerHandlers.UserHandler
	BCCImport              *timesheetHandlers.BCCImportHandler
	Attendance             *attendanceHandlers.Handler
}

type Middleware struct {
	Auth                      *middleware.AuthMiddleware
	Authorization             *middleware.AuthorizationMiddleware
	LoginRateLimit            gin.HandlerFunc
	PasswordResetRateLimit    gin.HandlerFunc // Red Team H1: per-normalized-email cap
	APIRateLimit              gin.HandlerFunc
	StrictRateLimit           gin.HandlerFunc
	AdBannerClickRateLimit    gin.HandlerFunc
	TenantSemaphore           *middleware.TenantSemaphoreMiddleware
	APIMetrics                gin.HandlerFunc
}

func NewContainer(cfg *config.Config, version string) (*Container, error) {
	infra, err := bootstrapInfra.Initialize(cfg)
	if err != nil {
		return nil, err
	}

	eventBus := events.NewWorkerPoolEventBus(100, 10000)
	repos := bootstrapRepos.Initialize(infra.DB, eventBus)

	// Seal integration secrets that were stored before a cipher key existed.
	// Without this backfill, configuring SETTINGS_SECRET_KEY later would only
	// protect future writes: the admin API returns protected values as null
	// (treated as "unchanged" on save), so an existing credential row can never
	// be rewritten through the API. Best-effort — a failure must not block boot.
	if sealed, err := repos.Settings.EncryptProtectedValues(context.Background()); err != nil {
		infra.Logger.Warn("settings secret backfill failed", "error", err)
	} else if len(sealed) > 0 {
		infra.Logger.Info("settings secret backfill sealed plaintext values", "keys", sealed)
	}

	// Shared clock instance — must be created before services so attendance
	// service (and others) receive the correct FakeClock in non-prod.
	var clk clock.Clock
	env := cfg.App.Env
	if env == "production" {
		clk = clock.New()
	} else {
		clk = clock.NewAutoFake()
		clock.SetGlobal(clk)
	}

	// Initialize Asynq client before services so it can be injected into ResultProcessor
	asynqClient, err := asynqinfra.NewClient(cfg.Asynq)
	if err != nil {
		return nil, err
	}
	asynqServer := asynqinfra.NewServer(cfg.Asynq)

	services := bootstrapServices.Initialize(repos, cfg, infra.Logger, infra.DB, infra.Redis, eventBus, asynqClient, clk)

	h := initHandlers(services, repos, infra.DB, infra.Redis, infra.Logger, version, eventBus, cfg, asynqClient, clk)
	middlewares := initMiddleware(services.Auth, services.Authorization, services.ProjectPermission, services.EmployeePermission, repos.APIMetric, cfg, infra.Logger)
	// The denormalised projects.*_vnd totals are written by this service alone
	// (the bulk transfer worker builds its own instance from the same
	// repository), so the scheduler reconciliation and the CLI backfill stay the
	// two recovery paths for a missed projection.
	walletBalanceAlertSvc := notification.NewWalletBalanceAlertService(
		services.Wallet,
		services.SettingsConfig,
		repos.WalletBalanceAlertState,
		services.Notification,
		infra.Logger,
	)
	aggregateRecomputeSvc := project.NewAggregateRecomputeService(repos.Project, clock.New(), infra.Logger)
	sched := initScheduler(services.Notification, services.Email, services.ProjectEmployee, services.APIMetricCleanupService, services.Reconcile, repos.APIMetric, repos.AdvancePaymentRequest, services.FlexPayReconciliationService, aggregateRecomputeSvc, walletBalanceAlertSvc, services.Asset, cfg, infra.Logger)
	sched.SetRepo(repos.CronJobStatus)
	h.Cron = handlers.NewCronHandler(repos.CronJobStatus, sched)
	// init tenant queue manager for per-tenant background workers
	tqm := tenantqueue.NewManager(cfg.TenantQueueWorkers, cfg.TenantQueueBuffer)

	// Register Asynq handlers and periodic tasks
	asynqHandlers := asynqinfra.NewHandlers(
		workers.NewEmployeeImportWorker(
			services.EmployeeImport,
			services.EmployeeImportProgress,
			cfg.Asset.StoragePath,
		),
		workers.NewBCCImportWorker(services.BCCImport, services.Audit),
		workers.NewImportJobWorker(
			repos.Asset,
			services.AdvancePayment,
			services.ImportProgress,
			cfg.Asset.StoragePath,
		),
		services.BulkTransferTransactionWorker,
		services.BulkTransferPaymentWorkerConcrete,
		workers.NewAuditLogWriteWorker(repos.AuditLog),
		workers.NewPayrollReportEmailWorker(services.Email, services.Idempotency, infra.Logger),
		workers.NewAutoRejectCheckoutWorker(services.Attendance),
		workers.NewAutoRejectSweepWorker(services.Attendance),
		workers.NewCreditQuotaWorker(services.Attendance),
		workers.NewCreditQuotaSweepWorker(services.Attendance),
	)
	asynqHandlers.SetApprovalRetryProcessor(services.Approval)
	asynqinfra.RegisterHandlers(asynqServer, asynqHandlers)
	if err := asynqinfra.RegisterPeriodicTasks(asynqServer, asynqClient); err != nil {
		return nil, err
	}

	// Register the auto-reject fallback sweep (always on) — finalizes attendance
	// records whose scheduled K+4h task was lost (Redis/process outage at check-in).
	if err := asynqinfra.RegisterAutoRejectSweep(asynqServer); err != nil {
		return nil, err
	}

	// Register the quota-credit fallback sweep (always on) — banks earnings whose
	// scheduled 24h credit task was lost (Redis/process outage at check-out).
	if err := asynqinfra.RegisterCreditQuotaSweep(asynqServer); err != nil {
		return nil, err
	}

	return &Container{
		Config:             cfg,
		Logger:             infra.Logger,
		DB:                 infra.DB,
		Redis:              infra.Redis,
		Scheduler:          sched,
		TenantQueueManager: tqm,
		AsynqClient:        asynqClient,
		AsynqServer:        asynqServer,
		Repos:              repos,
		Services:           services,
		Handlers:           h,
		Middleware:         middlewares,
	}, nil
}

func initHandlers(services *bootstrapServices.Services, repos *bootstrapRepos.Repositories, db *persistence.Database, redis *persistence.RedisClient, logger *slog.Logger, version string, eventBus domain.EventBus, cfg *config.Config, asynqClient *asynqinfra.Client, clk clock.Clock) *Handlers {
	healthCheckers := map[string]handlers.HealthChecker{
		"database": db,
		"redis":    redis,
	}

	// Create fileStorage for handlers (used by employee/advance/timesheet import).
	fileStorage := storage.NewLocalFileStorage(cfg.Asset.StoragePath, cfg.Asset.BaseURL)

	// Create employee import handler with Asynq client
	employeeImportHandler := employeeHandlers.NewImportHandler(
		services.EmployeeImport,
		services.EmployeeImportProgress,
		fileStorage,
		asynqClient,
		services.Audit,
	)

	return &Handlers{
		User:                 handlers.NewUserHandler(services.User, services.PasswordResetJobManager, services.Audit),
		Auth:                 handlers.NewAuthHandler(services.Auth, services.User, services.EmailPasswordReset),
		Dashboard:            handlers.NewDashboardHandler(services.Dashboard),
		Project:              handlers.NewProjectHandlerWithServices(services.Project, services.Payrate, services.Timesheet, services.ProjectEmployee, services.ProjectPermission, clk),
		Employee:             handlers.NewEmployeeHandlerWithServices(services.Employee, services.Timesheet, services.ProjectEmployee, services.EmployeePermission, services.Audit, clk),
		EmployeeUsers:        employeeHandlers.NewEmployeeUsersHandler(services.EmployeePermission),
		EmployeeProfile:      handlers.NewEmployeeProfileHandler(services.EmployeeProfile, services.EmployeeUser),
		ProjectEmployee:      handlers.NewProjectEmployeeHandler(services.ProjectEmployee, services.Employee, services.Project, services.ProjectPermission, services.EmployeePermission, logger, clk),
		Bank:                 handlers.NewBankHandler(services.Bank),
		Timesheet:            handlers.NewTimesheetHandler(services.Timesheet, services.PayrollReport, services.SettingsConfig, services.PayrollReportExporter, services.PayrollReportByProjectService, services.PayrollReportByProjectExporter, services.Project, services.ProjectEmployee, services.Payrate, services.ProjectPermission, services.EmployeePermission, services.SettlementUpload, repos.Timesheet, services.Audit, clk, services.CashReadiness),
		TimesheetEditRequest: handlers.NewTimesheetEditRequestHandler(services.TimesheetEditRequest),
		Payroll:              handlers.NewPayrollHandler(services.Payroll, services.Cache, repos.BulkTransferFile, repos.Asset, fileStorage, eventBus),
		Payrate:              handlers.NewPayrateHandler(services.Payrate, services.Project, services.ProjectPermission, clk),
		Ledger:               handlers.NewLedgerHandler(services.Ledger, clk),
		Transaction:          handlers.NewTransactionHandler(services.Transaction, repos.BulkTransferFile, repos.Timesheet, services.Notification, eventBus, clk),
		Health:               handlers.NewHealthHandler(healthCheckers, version),
		Notification:         handlers.NewNotificationHandler(services.Notification),
		Settings:             handlers.NewSettingsHandler(services.Settings),
		Approval:             approvalHandlers.NewHandler(services.Approval),
		Asset:                handlers.NewAssetHandler(services.Asset),
		Cache:                handlers.NewCacheHandler(services.Cache, logger),
		Email:                handlers.NewEmailHandler(services.Email, asynqClient),
		Settlement:           handlers.NewSettlementHandler(services.SettlementUpload, repos.Notification, clk),
		Metric:               handlers.NewMetricHandler(services.Metric, services.Cache, eventBus, clk),
		Audit:                handlers.NewAuditHandler(repos.AuditLog),
		AdvancePayment:       advancePaymentHandlers.NewAdvancePaymentHandler(services.AdvancePayment, repos.Asset, asynqClient, services.ImportProgress, fileStorage, services.FlexPayReconciliationService, services.FlexPayReconciliationExporter, services.FlexPaySettlementService, services.Email, services.Audit, repos.Notification, repos.WalletPayment, repos.TxWalletPayment, clk),
		AdvancePaymentFee:    advancePaymentHandlers.NewFeeScheduleHandler(services.AdvancePaymentFeeSchedule, clk),
		AdBanner:             handlers.NewAdBannerHandler(services.AdBanner, logger),
		EmployeeImport:       employeeImportHandler,
		DBExport:             handlers.NewDBExportHandler(dbExportSvc.NewDBExportService(db, services.CacheService, cfg.Asset.StoragePath), services.Audit),
		Push:                 pushHandlers.NewHandler(services.Push),
		WeeklyPaymentFee: handlers.NewWeeklyPaymentFeeHandler(services.WeeklyPaymentFeeSchedule, clk),
		AdminClock:             adminHandlers.NewClockHandler(clk, cfg.App.Env),
		AdminAttendance:        adminHandlers.NewAttendanceHandler(services.Attendance, repos.AttendanceFailedAttempt, repos.Project, clk, logger),
		Wallet:                 handlers.NewWalletHandler(services.Wallet),
		AdvPartnerUser:         advPartnerHandlers.NewUserHandler(services.Employee, services.ProjectEmployee, services.User),
		BCCImport:              timesheetHandlers.NewBCCImportHandler(services.BCCImport, repos.Asset, fileStorage, services.ProjectPermission, services.Audit),
		Attendance:             attendanceHandlers.NewHandler(services.Attendance, repos.Employee, repos.AttendanceFailedAttempt, clk, logger),
	}
}

func initMiddleware(authService *auth.AuthService, authorizationService *auth.AuthorizationService, projectPermissionService *project.ProjectPermissionService, employeePermissionService *employee.EmployeePermissionService, apiMetricRepo domain.APIMetricRepository, cfg *config.Config, logger *slog.Logger) *Middleware {
	tenantLimit := 10
	if cfg.TenantConcurrencyLimit > 0 {
		tenantLimit = cfg.TenantConcurrencyLimit
	}

	var authorizationMiddleware *middleware.AuthorizationMiddleware
	if authorizationService != nil {
		authorizationMiddleware = middleware.NewAuthorizationMiddleware(authorizationService, projectPermissionService, employeePermissionService, cfg.OTP)
	} else {
		authorizationMiddleware = middleware.NewAuthorizationMiddleware(nil, projectPermissionService, employeePermissionService, cfg.OTP)
	}

	return &Middleware{
		Auth:                      middleware.NewAuthMiddleware(authService),
		Authorization:             authorizationMiddleware,
		LoginRateLimit:            middleware.CreateLoginRateLimit(cfg.Redis.Addr),
		PasswordResetRateLimit:    middleware.CreatePasswordResetRateLimit(cfg.Redis.Addr, cfg.PasswordReset.RateLimitPerHour),
		APIRateLimit:              middleware.CreateAPIRateLimit(cfg.Redis.Addr),
		StrictRateLimit:           middleware.CreateStrictRateLimit(cfg.Redis.Addr),
		AdBannerClickRateLimit:    middleware.CreateAdBannerClickRateLimit(cfg.Redis.Addr),
		TenantSemaphore:           middleware.NewTenantSemaphoreMiddleware(tenantLimit),
		APIMetrics:                middleware.APIMetrics(apiMetricRepo),
	}
}

func initScheduler(notificationService *notification.NotificationService, emailService *notification.EmailService, projectEmployeeService *project.ProjectEmployeeService, apiMetricCleanupService *cleanup.APIMetricCleanupService, reconcileService *ledger.ReconcileService, apiMetricRepo domain.APIMetricRepository, advancePaymentReqRepo domain.AdvancePaymentRequestRepository, flexPayReconciliationSvc *domainServices.FlexPayReconciliationService, aggregateRecomputeSvc *project.AggregateRecomputeService, walletBalanceAlertSvc *notification.WalletBalanceAlertService, assetSvc *asset.AssetService, cfg *config.Config, logger *slog.Logger) *scheduler.Scheduler {
	s := scheduler.NewScheduler(
		logger,
		cfg.Scheduler.Timezone,
		cfg.Scheduler.Enabled,
	)

	registerSchedulerJobs(
		s,
		notificationService,
		emailService,
		projectEmployeeService,
		apiMetricCleanupService,
		reconcileService,
		apiMetricRepo,
		advancePaymentReqRepo,
		flexPayReconciliationSvc,
		aggregateRecomputeSvc,
		walletBalanceAlertSvc,
		assetSvc,
		logger,
	)

	return s
}
