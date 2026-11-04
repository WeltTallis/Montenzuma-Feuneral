package services

import (
	"log/slog"
	"time"

	bootstrapRepos "api-server/internal/app/bootstrap/repositories"
	"api-server/internal/app/services"
	"api-server/internal/app/services/ad_banner"
	"api-server/internal/app/services/advance_payment"
	"api-server/internal/app/services/approval"
	"api-server/internal/app/services/asset"
	"api-server/internal/app/services/attendance"
	"api-server/internal/app/services/auth"
	"api-server/internal/app/services/cleanup"
	"api-server/internal/app/services/config"
	"api-server/internal/app/services/dashboard"
	"api-server/internal/app/services/disbursement"
	"api-server/internal/app/services/employee"
	"api-server/internal/app/services/flex_pay"
	infraServices "api-server/internal/app/services/infrastructure"
	"api-server/internal/app/services/ledger"
	"api-server/internal/app/services/notification"
	"api-server/internal/app/services/otp"
	"api-server/internal/app/services/passwordreset"
	"api-server/internal/app/services/payroll"
	"api-server/internal/app/services/project"
	pushService "api-server/internal/app/services/push"
	"api-server/internal/app/services/reporting"
	"api-server/internal/app/services/settlement"
	"api-server/internal/app/services/timesheet"
	"api-server/internal/app/services/user"
	"api-server/internal/app/workers"
	appConfig "api-server/internal/config"
	"api-server/internal/constants"
	"api-server/internal/domain"
	domainServices "api-server/internal/domain/services"
	"api-server/internal/domain/wallet"
	"api-server/internal/infra/cache"
	"api-server/internal/infra/email"
	"api-server/internal/infra/events"
	"api-server/internal/infra/persistence"
	"api-server/internal/infra/persistence/repositories"
	"api-server/internal/infra/storage"
	"api-server/internal/pkg/clock"

	// Adapter imports
	cacheAdapter "api-server/internal/adapters/cache"
	notificationAdapter "api-server/internal/adapters/notification"
	serviceAdapters "api-server/internal/adapters/services"
	serviceports "api-server/internal/domain/ports/services"
	asynqinfra "api-server/internal/infra/asynq"
)

type Services struct {
	User                              *user.UserService
	PasswordResetJobManager           *user.PasswordResetJobManager
	EmailPasswordReset                *passwordreset.Service          // Red Team M2: distinct name (collides with PasswordResetJobManager otherwise)
	Auth                              *auth.AuthService
	Authorization                     *auth.AuthorizationService
	Dashboard                         *dashboard.Service
	Project                           *project.ProjectService
	ProjectPermission                 *project.ProjectPermissionService
	Employee                          *employee.EmployeeService
	EmployeePermission                *employee.EmployeePermissionService
	EmployeeUser                      *employee.EmployeeUserService
	EmployeeProfile                   *employee.EmployeeProfileService
	ProjectEmployee                   *project.ProjectEmployeeService
	Bank                              *asset.BankService
	Payrate                           *payroll.PayrateService
	Timesheet                         *timesheet.TimesheetService
	TimesheetEditRequest              *timesheet.TimesheetEditRequestService
	PayrollReport                     *payroll.PayrollReportService
	Payroll                           *payroll.PayrollService
	PayrollReportExporter             *payroll.PayrollReportExporter
	PayrollReportByProjectService     *payroll.PayrollReportByProjectService
	PayrollReportByProjectExporter    *payroll.PayrollReportByProjectExporter
	Ledger                            *settlement.LedgerService
	Transaction                       *settlement.TransactionService
	TransactionPort                   serviceports.TransactionPort
	SettlementUpload                  *settlement.SettlementUploadService
	Notification                      *notification.NotificationService
	EmployeeNotifier                  notification.EmployeeNotifier
	Settings                          *config.SettingsService
	SettingsConfig                    *config.SettingsConfigService
	Approval                          *approval.Service
	ExcelConverter                    *reporting.ExcelConverterService
	Asset                             *asset.AssetService
	Cache                             domain.CacheServiceUseCase
	CacheService                      *infraServices.CacheService
	Email                             *notification.EmailService
	Metric                            *infraServices.MetricService
	Audit                             *infraServices.AuditService
	APIMetricCleanupService           *cleanup.APIMetricCleanupService
	Idempotency                       *infraServices.IdempotencyService
	Reconcile                         *ledger.ReconcileService
	AdvancePayment                    *advance_payment.Service
	AdvancePaymentFeeSchedule         *advance_payment.FeeScheduleService
	WeeklyPaymentFeeSchedule          *payroll.WeeklyPaymentFeeScheduleService
	AdBanner                          *ad_banner.Service
	ImportProgress                    *advance_payment.ImportProgressService
	EmployeeImport                    *employee.ImportService
	EmployeeImportProgress            *infraServices.EmployeeImportProgressService
	FlexPayReconciliationService      *domainServices.FlexPayReconciliationService
	FlexPayReconciliationExporter     *flex_pay.FlexPayReconciliationExporter
	FlexPaySettlementService          *flex_pay.FlexPaySettlementService
	BulkTransferTransactionWorker     *workers.BulkTransferTransactionWorker
	BulkTransferPaymentWorkerConcrete *workers.BulkTransferPaymentWorker
	Push                              *pushService.PushService
	DisbursementRegistry              *disbursement.Registry
	Wallet                            wallet.WalletService
	CashReadiness                     *services.CashReadinessForecastService
	BulkTransferPayment               workers.TransferTimesheetUpdater
	BCCImport                         *services.BCCImportService
	Attendance                        *attendance.AttendanceService
	TransactionManager                *infraServices.TransactionManager
}

func Initialize(repos *bootstrapRepos.Repositories, cfg *appConfig.Config, logger *slog.Logger, db *persistence.Database, redis *persistence.RedisClient, eventBus domain.EventBus, asynqClient *asynqinfra.Client, clk clock.Clock) *Services {
	// Step 1: Initialize concrete infrastructure services first
	cacheService := infraServices.NewCacheService(redis)

	// Step 2: Create infrastructure adapters (ports)
	cachePort := cacheAdapter.NewRedisAdapter(cacheService)

	// Step 3: Create base services needed for other services
	userService := user.NewUserService(repos.User, repos.AuditLog, eventBus, cfg.Security.HashSecret, cfg.Security.HashSalt, clk)
	passwordResetJobManager := user.NewPasswordResetJobManager(userService, cacheService)
	pushSvc := pushService.NewPushService(repos.PushSubscription, cfg.Notification, logger)
	notificationService := notification.NewNotificationService(repos.Notification, repos.User, repos.Project, userService, pushSvc, logger)
	employeeNotificationService := notification.NewEmployeeNotificationService(notificationService, repos.Employee, logger)
	transactionManager := infraServices.NewTransactionManager(db.DB)
	settingsService := config.NewSettingsService(repos.Settings, repos.AdvancePayment, repos.Attendance, transactionManager, cacheService, eventBus, asynqClient)
	settingsConfigService := config.NewSettingsConfigService(settingsService)
	// A committed settings change must reach the in-process business-settings
	// cache immediately: statement emails and Excel exports read the beneficiary
	// bank details from it, and a stale value would print the previous account.
	settingsService.SetConfigCacheInvalidator(settingsConfigService)

	excelConverterService := reporting.NewExcelConverterService()
	pdfService := reporting.NewPDFService("fonts/Roboto-Regular.ttf")
	fileStorage := storage.NewLocalFileStorage(cfg.Asset.StoragePath, cfg.Asset.BaseURL)
	assetService := asset.NewAssetService(repos.Asset, fileStorage, cfg.Asset.MaxFileSize, eventBus)

	// Step 4: Create domain services using infrastructure ports
	ledgerService := settlement.NewLedgerService(repos.Ledger, eventBus, cachePort)
	timesheetService := timesheet.NewTimesheetService(repos.Timesheet, repos.Employee, repos.Project, repos.ProjectEmployee, repos.Payrate, transactionManager, cachePort, eventBus)

	// Create email service for notification adapter (needed before adapter creation)
	emailNotificationPublisher := notification.NewEmailNotificationPublisher(repos.Notification, logger)
	payCycleNotificationPublisher := notification.NewPaymentCycleNotificationPublisher(repos.Notification, logger)
	payrollReportByProjectService := payroll.NewPayrollReportByProjectService(repos.Timesheet, repos.Project, repos.Employee)
	payrollReportByProjectExporter := payroll.NewPayrollReportByProjectExporter(settingsConfigService, settingsConfigService)
	payrollReportAdapter := notification.NewPayrollReportAdapter(payrollReportByProjectService, payrollReportByProjectExporter)

	// Select email provider based on environment
	var emailProvider domain.EmailDeliveryPort
	if cfg.App.Env != "production" {
		emailProvider = email.NewSandboxProvider(logger)
	} else {
		emailProvider = email.NewResendProvider(cfg.Notification.ResendAPIKey)
	}
	emailService := notification.NewEmailService(cfg.Notification, emailProvider, payrollReportAdapter, repos.Notification, repos.User, emailNotificationPublisher, assetService, settingsConfigService, logger)

	// Create notification adapter port
	notificationPort := notificationAdapter.NewEmailAdapter(notificationService, emailService)

	// Create timesheet edit request service with ports
	timesheetEditRequestService := timesheet.NewTimesheetEditRequestService(repos.TimesheetEditRequest, repos.Timesheet, repos.AuditLog, eventBus, transactionManager)

	// Create transaction service with ports
	transactionService := settlement.NewTransactionService(db.DB, repos.Transaction, repos.Settlement, repos.Ledger, repos.Loan, repos.User, repos.Timesheet, cachePort, eventBus)
	transactionPort := serviceAdapters.NewTransactionAdapter(transactionService)

	// Create salary calculation service
	salaryCalculationService := domainServices.NewSalaryCalculationService(repos.BulkTransferFile)

	// Create query repositories
	timesheetQueryRepo := repositories.NewTimesheetQueryRepository(db.DB)
	timesheetAnalyticsRepo := repositories.NewTimesheetAnalyticsRepository(db.DB)

	dashboardService := dashboard.NewService(repos.User, repos.Project, repos.Employee, repos.Timesheet, timesheetQueryRepo, timesheetAnalyticsRepo, repos.Ledger, repos.Notification, repos.AuditLog, repos.ProjectEmployee, repos.BulkTransferFile, repos.AdvancePaymentRequest, repos.AdvancePayment, repos.Attendance, repos.AttendanceFailedAttempt, settingsConfigService, cacheService, salaryCalculationService, db.DB, logger)
	// Create remaining services
	settlementUploadService := settlement.NewSettlementUploadService(db.DB, repos.Timesheet, repos.Transaction, assetService, repos.Ledger, eventBus, repos.AdvancePaymentRequest, repos.AdvancePayment, repos.Notification)
	projectPermissionService := project.NewProjectPermissionService(repos.Project, repos.ProjectUser, repos.ProjectEmployee, repos.EmployeeUser, repos.User, eventBus)
	employeePermissionService := employee.NewEmployeePermissionService(repos.Employee, repos.EmployeeUser, repos.ProjectEmployee, repos.User, eventBus)
	payrollReportService := payroll.NewPayrollReportService(repos.Timesheet, repos.Employee, repos.ProjectEmployee, repos.Project, repos.BulkTransferFile)
	payrollReportExporter := payroll.NewPayrollReportExporter(settingsConfigService)
	authorizationService, err := auth.NewAuthorizationService(
		auth.GetDefaultModelPath(),
		auth.GetDefaultPolicyPath(),
		timesheetService,
		logger,
	)
	if err != nil {
		logger.Error("Failed to initialize authorization service", "error", err)
		authorizationService = nil
	}

	employeeUserService := employee.NewEmployeeUserService(repos.Employee, userService)
	employeeProfileService := employee.NewEmployeeProfileService(repos.Employee, repos.Timesheet, repos.ProjectEmployee, repos.Payrate, repos.Attendance, userService, eventBus)
	attendanceService := attendance.NewAttendanceService(repos.Attendance, repos.ProjectEmployee, repos.Project, repos.Payrate, repos.AdvancePayment, settingsConfigService, transactionManager, asynqClient, clk)

	// Geofence gates are now DB-backed (project.geofence_gates JSON column).
	// No in-memory registration needed.

	// Register global event handlers after all core services are constructed.
	auditEventHandler := events.NewAuditEventHandler(asynqClient)
	eventBus.SubscribeAll(auditEventHandler)

	// Register cache invalidation handler for async cache updates
	cacheInvalidationHandler := events.NewCacheInvalidationHandler(cacheService)
	eventBus.SubscribeAll(cacheInvalidationHandler)

	// Resolve company-wide cash-forecast snapshots from weekly bulk-transfer
	// exports. The handler is advisory measurement only and cannot mutate wallet
	// or disbursement state.
	cashForecastAccuracyHandler := events.NewCashForecastAccuracyHandler(repos.CashForecastSnapshot)
	eventBus.SubscribeAll(cashForecastAccuracyHandler)

	// Register employee user creation handler to decouple user creation from HTTP request path
	employeeUserCreatedHandler := events.NewEmployeeUserCreatedHandler(repos.Employee, employeeUserService)
	eventBus.SubscribeAll(employeeUserCreatedHandler)

	// Register settlement event handler for transaction and timesheet marking operations
	settlementEventHandler := events.NewSettlementEventHandler(
		db.DB,
		repos.Timesheet,
		repos.Transaction,
		repos.Settlement,
		repos.Ledger,
		transactionPort,
		eventBus,
		employeeNotificationService,
	)
	eventBus.SubscribeAll(settlementEventHandler)

	// Wire the settlement event handler as the synchronous settlement applier so the
	// upload flow settles each transaction inline (atomic + self-verifying) instead of
	// via a fire-and-forget event that can silently drop (txn 99 / timesheet 11579 bug).
	settlementUploadService.SetSettlementApplier(settlementEventHandler)

	logger.Info("Event bus initialized with handlers",
		"audit", true,
		"cache_invalidation", true,
		"employee_user_created", true,
		"settlement", true,
	)

	// Step 6: Create services that depend on other domain services using ports

	// Initialize FlexPay reconciliation services
	flexPayReconciliationService := domainServices.NewFlexPayReconciliationService(
		repos.AdvancePaymentRequest,
		repos.AdvancePayment,
		repos.Project,
		repos.Employee,
	)
	apiMetricCleanupService := cleanup.NewAPIMetricCleanupService(repos.APIMetric, logger)
	reconcileService := ledger.NewReconcileService(db.DB, repos.Ledger, repos.Notification)

	// Initialize import progress service
	importProgressService := advance_payment.NewImportProgressService(cacheService)

	// Fee schedule service drives all advance-payment fee resolution. Created
	// before the advance-payment service so we can inject its FeeResolver, and
	// bound back into settingsConfigService so legacy callers (bulk transfer
	// worker, payroll exporter, headline-rate UI) read the active schedule
	// instead of the retired flat-rate settings keys.
	feeScheduleService := advance_payment.NewFeeScheduleService(db.DB, cacheService, eventBus, logger)
	settingsConfigService.BindFeeScheduleResolver(feeScheduleService)

	// Weekly-payment fee schedule (phí trả lương tuần): decoupled from the
	// FlexPay schedule; bound into settingsConfigService so weekly bulk
	// transfers and statement reports resolve the weekly rate.
	weeklyPaymentFeeScheduleService := payroll.NewWeeklyPaymentFeeScheduleService(db.DB, eventBus, logger)
	settingsConfigService.BindWeeklyFeeScheduleResolver(weeklyPaymentFeeScheduleService)

	// Ad banner campaigns (employee portal "Quảng cáo").
	adBannerService := ad_banner.NewService(repos.AdBanner, repos.ProjectEmployee, repos.Employee, eventBus, cacheService, logger)

	// Payroll disbursements are completed through manual bank-file workflows.
	disbursementRegistry := disbursement.NewRegistry()

	// Initialize advance payment service
	advancePaymentConfig := &advance_payment.Config{
		AdvancePaymentRepo:              repos.AdvancePayment,
		AdvancePaymentRequestRepo:       repos.AdvancePaymentRequest,
		TransactionCodeRepo:             repos.TransactionCode,
		TransactionRepo:                 repos.Transaction,
		EmployeeRepo:                    repos.Employee,
		ProjectEmployeeRepo:             repos.ProjectEmployee,
		ProjectRepo:                     repos.Project,
		BankRepo:                        repos.Bank,
		BulkTransferFileRepo:            repos.BulkTransferFile,
		AssetRepo:                       repos.Asset,
		CacheService:                    cacheService,
		EmployeeUserService:             employeeUserService,
		LedgerRepo:                      repos.Ledger,
		EmployeeNotifier:                employeeNotificationService,
		FeeResolver:                     feeScheduleService,
		GetAdvancePaymentPercentage:     settingsConfigService.GetAdvancePaymentPercentage,
		GetAdvancePaymentFeeMin:         settingsConfigService.GetAdvancePaymentFeeMin,
		GetAdvanceCashFeePercentage:     settingsConfigService.GetAdvanceCashFeePercentage,
		GetPartnerCompany:               settingsConfigService.GetPartnerCompany,
		GetSelfCheckInAdvancePercentage: settingsConfigService.GetSelfCheckInAdvancePercentage,
	}
	// Create audit service
	auditService := infraServices.NewAuditService(eventBus)

	advancePaymentService := advance_payment.NewService(advancePaymentConfig, logger)

	// Initialize FlexPay reconciliation exporter
	flexPayReconciliationExporter := flex_pay.NewFlexPayReconciliationExporter(settingsConfigService)

	// Initialize FlexPay settlement service
	flexPaySettlementService := flex_pay.NewFlexPaySettlementService(
		db.DB,
		repos.AdvancePaymentRequest,
		repos.AdvancePayment,
		repos.Ledger,
		repos.Transaction,
		repos.SettlementUpload,
		settingsConfigService.GetPartnerCompany,
	)

	// Initialize employee import progress service
	employeeImportProgressService := infraServices.NewEmployeeImportProgressService(cacheService)

	idempotencyService := infraServices.NewIdempotencyService(redis.Client, logger)

	// Initialize bulk transfer payment worker for per-transfer timesheet updates
	bulkTransferPaymentWorker := workers.NewBulkTransferPaymentWorker(
		db.DB,
		repos.Timesheet,
		repos.Project,
		repos.ProjectEmployee,
		repos.TransactionCode,
		settingsConfigService,
		idempotencyService,
		notificationService,
		employeeNotificationService,
		cachePort,
	)

	// Initialize bulk transfer transaction worker for async transaction creation
	bulkTransferTransactionWorker := workers.NewBulkTransferTransactionWorker(
		db.DB,
		repos.Transaction,
		repos.Timesheet,
		repos.Asset,
		ledgerService,
		transactionService,
		settingsConfigService,
		idempotencyService,
		eventBus,
	)

	// Create employee service config (11 params → 1)
	employeeConfig := &employee.Config{
		EmployeeRepo:             repos.Employee,
		TimesheetRepo:            repos.Timesheet,
		AttendanceRepo:           repos.Attendance,
		BankRepo:                 repos.Bank,
		ProjectEmployeeRepo:      repos.ProjectEmployee,
		EmployeeUserRepo:         repos.EmployeeUser,
		UserRepo:                 repos.User,
		EmployeeDomainService:    domainServices.NewEmployeeDomainService(repos.Employee, repos.ProjectEmployee, repos.Timesheet),
		UserService:              userService,
		TransactionManager:       transactionManager,
		Events:                   eventBus,
		Cache:                    cacheService,
		Logger:                   logger,
		BankAccountValidator:     employee.NewBankAccountValidator(disbursementRegistry, repos.Bank, cacheService, logger),
		IsEmployeeMobileRequired: settingsConfigService.IsEmployeeMobileRequired,
	}

	walletService := services.NewWalletService(repos.WalletTopup, repos.WalletPayment)
	cashReadinessService := services.NewCashReadinessForecastService(
		repos.Timesheet,
		walletService,
		nil,
		clk,
		cfg.CashForecast,
		settingsConfigService,
		repos.CashForecastSnapshot,
	).WithCacheService(cacheService)

	// Approval engine.
	approvalService := approval.NewService(approval.Deps{
		Repo:          repos.ApprovalRequest,
		Payloads:      approval.NewPayloadBuilderRegistry(payrollReportByProjectService, repos.ProjectUser, repos.User, repos.Timesheet, repos.Employee, repos.Project),
		Preconditions: approval.NewPreconditionRegistry(payrollReportByProjectService, repos.Timesheet),
		Users:         repos.User,
		Notifier:      notificationService,
		Retry:         approval.NewAsynqRetryScheduler(asynqClient),
		Audit:         approval.NewAsynqEventWriter(asynqClient),
		Executers: map[domain.ApprovalRequestType]approval.Executer{
			domain.ApprovalTypeSendSaoKeEmail:   approval.NewEmailExecuter(asynqClient),
			domain.ApprovalTypeSendPayrollEmail: approval.NewEmailExecuter(asynqClient),
		},
		Clock: clk,
	})

	// Create payroll service (which contains the bulk transfer module)
	payrollSvc := payroll.NewPayrollService(db.DB, repos.Timesheet, repos.Employee, repos.EmployeeUser, repos.Project, repos.ProjectEmployee, repos.User, ledgerService, transactionService, assetService, excelConverterService, settingsConfigService, repos.BulkTransferFile, repos.TransactionCode, pdfService, notificationService, eventBus, asynqClient)
	payrollSvc.SetWalletBulkPaymentReader(repos.TxWalletPayment)

	// Wire the settlement simulation service: it reuses the production
	// PayrollReportByProjectService (same selection logic as "Xuất sao kê")
	// and the ledger for reconciliation.
	payrollSvc.SetSimulationService(payroll.NewSettlementSimulationService(
		payrollReportByProjectService,
		repos.Timesheet,
		ledgerService,
		clk,
	))

	employeeService := employee.NewEmployeeService(employeeConfig)

	advancePaymentConfig.EmployeeService = employeeService
	// Initialize employee import service
	employeeImportService := employee.NewImportService(
		employeeService,
		repos.Employee,
		repos.Project,
		repos.ProjectEmployee,
		employeeImportProgressService,
	)

	projectEmployeeSvc := project.NewProjectEmployeeService(repos.ProjectEmployee, repos.Employee, repos.EmployeeUser, repos.Project, repos.Timesheet, repos.AuditLog, transactionManager, repos.AdvancePayment, repos.Payrate, notificationPort, eventBus, payCycleNotificationPublisher, timesheetService, cacheService)

	// Email-OTP 2FA: build the pending-session store (Redis) + OTP service.
	//
	// OTP delivery ALWAYS uses the real Resend provider when OTP is enabled,
	// regardless of environment. Login depends on the code reaching the inbox,
	// and a sandbox/no-op provider would silently swallow the code and lock
	// every account out once MaxAttempts is hit. The Resend API key is
	// fail-fast validated at boot when OTP_ENABLE=true, so it is guaranteed
	// present here. General notifications keep the env-selected provider
	// (sandbox in dev) so development does not spam real mailboxes. When
	// OTP_ENABLE=false the service is still constructed (cheap) but
	// AuthService.requiresOTP() short-circuits and login behaves as before.
	otpEmailSender := emailProvider
	if cfg.OTP.Enabled {
		// Real Resend — login codes must reach inboxes.
		otpEmailSender = email.NewResendProvider(cfg.Notification.ResendAPIKey)
	}
	otpPendingStore := cache.NewOTPPendingStore(redis.Client, cfg.OTP.CodeTTL)
	otpFromEmail := constants.DefaultEmailSenderName + " <" + constants.DefaultEmailSenderAddress + ">"
	otpService := otp.NewOTPService(otpPendingStore, repos.User, otpEmailSender, otpFromEmail, cfg.OTP, clk, logger)

	// Self-service email password-reset (Red Team C4: reuse otpEmailSender so
	// reset emails reach real inboxes under the same env-gating as OTP).
	pwresetTokenStore := cache.NewPasswordResetTokenStore(redis.Client, cfg.PasswordReset.TokenTTL)
	emailPasswordResetService := passwordreset.NewService(
		pwresetTokenStore, repos.User, userService, otpEmailSender, eventBus,
		constants.DefaultEmailSenderAddress, cfg.PasswordReset.ResetURL, clk, logger,
	)

	// Google OIDC nonce store (Redis) — single-use replay defense for id_tokens.
	nonceStore := cache.NewNonceStore(redis.Client, 10*time.Minute)

	// Self-hosted image CAPTCHA (base64Captcha + Redis). Reuses the shared
	// Redis client. When CAPTCHA_ENABLE=false the service is still constructed
	// (cheap) but RequiredForFailures() short-circuits.
	captchaService := auth.NewCaptchaService(redis.Client, auth.CaptchaConfig{
		Enabled:    cfg.Captcha.Enabled,
		Threshold:  cfg.Captcha.Threshold,
		CodeTTL:    cfg.Captcha.CodeTTL,
		CodeLength: cfg.Captcha.CodeLength,
	})

	servicesStruct := &Services{
		User:                              userService,
		PasswordResetJobManager:           passwordResetJobManager,
		EmailPasswordReset:                emailPasswordResetService,
		Auth:                              auth.NewAuthService(userService, repos.Employee, repos.BlacklistedToken, eventBus, cfg.Auth.JWTSecret, cfg.Auth.AccessTTL, otpService, cfg.OTP, cfg.Google.ClientID, nonceStore, captchaService, logger),
		Authorization:                     authorizationService,
		Dashboard:                         dashboardService,
		Project:                           project.NewProjectService(repos.Project, repos.Employee, repos.ProjectEmployee, repos.Timesheet, eventBus, cacheService, logger),
		ProjectPermission:                 projectPermissionService,
		Employee:                          employeeService,
		EmployeePermission:                employeePermissionService,
		EmployeeUser:                      employeeUserService,
		EmployeeProfile:                   employeeProfileService,
		ProjectEmployee:                   projectEmployeeSvc,
		Bank:                              asset.NewBankService(repos.Bank, cacheService, eventBus),
		Payrate:                           payroll.NewPayrateService(repos.Payrate, eventBus, db.DB),
		Timesheet:                         timesheetService,
		TimesheetEditRequest:              timesheetEditRequestService,
		PayrollReport:                     payrollReportService,
		PayrollReportExporter:             payrollReportExporter,
		PayrollReportByProjectService:     payrollReportByProjectService,
		PayrollReportByProjectExporter:    payrollReportByProjectExporter,
		Transaction:                       transactionService,
		TransactionPort:                   transactionPort,
		SettlementUpload:                  settlementUploadService,
		Payroll:                           payrollSvc,
		Ledger:                            ledgerService,
		Notification:                      notificationService,
		EmployeeNotifier:                  employeeNotificationService,
		Settings:                          settingsService,
		SettingsConfig:                    settingsConfigService,
		Approval:                          approvalService,
		ExcelConverter:                    excelConverterService,
		Asset:                             assetService,
		Cache:                             cacheService,
		CacheService:                      cacheService,
		Email:                             emailService,
		Metric:                            infraServices.NewMetricService(repos.APIMetric, repos.AuditLog),
		Audit:                             auditService,
		APIMetricCleanupService:           apiMetricCleanupService,
		Idempotency:                       idempotencyService,
		Reconcile:                         reconcileService,
		AdvancePayment:                    advancePaymentService,
		AdvancePaymentFeeSchedule:         feeScheduleService,
		WeeklyPaymentFeeSchedule:          weeklyPaymentFeeScheduleService,
		AdBanner:                          adBannerService,
		ImportProgress:                    importProgressService,
		EmployeeImport:                    employeeImportService,
		EmployeeImportProgress:            employeeImportProgressService,
		FlexPayReconciliationService:      flexPayReconciliationService,
		FlexPayReconciliationExporter:     flexPayReconciliationExporter,
		FlexPaySettlementService:          flexPaySettlementService,
		BulkTransferTransactionWorker:     bulkTransferTransactionWorker,
		BulkTransferPaymentWorkerConcrete: bulkTransferPaymentWorker,
		Push:                              pushSvc,
		DisbursementRegistry:              disbursementRegistry,
		Wallet:                            walletService,
		CashReadiness:                     cashReadinessService,
		BulkTransferPayment:               bulkTransferPaymentWorker,
		BCCImport: services.NewBCCImportService(
			repos.Payrate,
			repos.Timesheet,
			timesheetService,
			repos.Asset,
			fileStorage,
			transactionManager,
			redis.Client,
			employeeService,
			employeeUserService,
			projectEmployeeSvc,
			repos.TimesheetImportJob,
			asynqClient,
		),
		Attendance:         attendanceService,
		TransactionManager: transactionManager,
	}

	return servicesStruct
}
