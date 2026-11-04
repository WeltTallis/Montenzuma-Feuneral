package constants

// Error Messages
const (
	// Authentication & Authorization
	MsgInvalidRequestFormat      = "Invalid Request Format"
	MsgUserIDNotFoundInContext   = "User ID Not Found In Context"
	MsgUserRoleNotFoundInContext = "User Role Not Found In Context"
	MsgUnauthorized              = "Unauthorized"
	MsgForbidden                 = "Forbidden"

	// Validation Errors
	MsgInvalidRequestBody         = "Invalid Request Body"
	MsgInvalidEmployeeID          = "Invalid Employee ID"
	MsgInvalidUserID              = "Invalid User ID"
	MsgInvalidProjectID           = "Invalid Project ID"
	MsgInvalidPayrateID           = "Invalid Payrate ID"
	MsgInvalidDateFormat          = "Invalid Date Format"
	MsgInvalidFromDateFormat      = "Invalid From Date Format"
	MsgInvalidToDateFormat        = "Invalid To Date Format"
	MsgInvalidStartDateFormat     = "Invalid Start Date Format"
	MsgInvalidEndDateFormat       = "Invalid End Date Format"
	MsgInvalidEffectiveFromFormat = "Invalid Effective From Format"
	MsgInvalidAtDateFormat        = "Invalid At Date Format"
	MsgInvalidQueryParameters     = "Invalid Query Parameters"
	MsgInvalidPaymentSchedule     = "Invalid Payment Schedule"
	MsgBothPaymentSchedules       = "Both Payment Schedules"

	// Required Fields
	MsgCCCDRequired  = "National ID Required"
	MsgFieldRequired = "Field Required"

	// Business Logic Errors
	MsgCannotCreatePayrateForProject = "Cannot Create Payrate For Project"
	MsgInvalidPayrateConfiguration   = "Invalid Payrate Configuration"
	MsgProjectNotFound               = "Project Not Found"
	MsgEmployeeNotFound              = "Employee Not Found"
	MsgUserNotFound                  = "User Not Found"
	MsgPayrateNotFound               = "Payrate Not Found"
	MsgTimesheetNotFound             = "Timesheet Not Found"

	// Service Errors
	MsgTimesheetServiceNotAvailable        = "Timesheet Service Not Available"
	MsgProjectEmployeeServiceNotAvailable  = "Project Employee Service Not Available"
	MsgFailedToRetrieveTimesheetSummary    = "Failed To Retrieve Timesheet Summary"
	MsgFailedToRetrievePayrollHistory      = "Failed To Retrieve Payroll History"
	MsgFailedToCountTimesheets             = "Failed To Count Timesheets"
	MsgFailedToListEmployees               = "Failed To List Employees"
	MsgFailedToCountEmployees              = "Failed To Count Employees"
	MsgFailedToRetrieveUnassignedEmployees = "Failed To Retrieve Unassigned Employees"
	MsgFailedToCountUnassignedEmployees    = "Failed To Count Unassigned Employees"
	MsgFailedToBuildComprehensiveResponse  = "Failed To Build Comprehensive Response"

	// Success Messages
	MsgSuccess                        = "Success"
	MsgCreatedSuccessfully            = "Created Successfully"
	MsgUpdatedSuccessfully            = "Updated Successfully"
	MsgDeletedSuccessfully            = "Deleted Successfully"
	MsgEmailHistoryRetrieved          = "Email History Retrieved"
	MsgEmployeesRetrievedSuccessfully = "Employees Retrieved Successfully"

	// Payroll specific
	PayrollHistoriesFetched = "Payroll Histories Fetched"

	// Generic Messages
	MsgInternalServerError = "Internal Server Error"
	MsgNotFound            = "Not Found"
	MsgConflict            = "Conflict"
	MsgValidationFailed    = "Validation Failed"
)

// Additional compatibility messages
const (
	// Authentication & Authorization
	MsgInvalidRequestFormatVN      = "Invalid Request Format"
	MsgUserIDNotFoundInContextVN   = "User ID Not Found In Context"
	MsgUserRoleNotFoundInContextVN = "User Role Not Found In Context"
	MsgUnauthorizedVN              = "Unauthorized"
	MsgForbiddenVN                 = "Forbidden"

	// Validation Errors
	MsgInvalidRequestBodyVN         = "Invalid Request Body"
	MsgInvalidEmployeeIDVN          = "Invalid Employee ID"
	MsgInvalidUserIDVN              = "Invalid User ID"
	MsgInvalidProjectIDVN           = "Invalid Project ID"
	MsgInvalidPayrateIDVN           = "Invalid Payrate ID"
	MsgInvalidDateFormatVN          = "Invalid Date Format"
	MsgInvalidFromDateFormatVN      = "Invalid From Date Format"
	MsgInvalidToDateFormatVN        = "Invalid To Date Format"
	MsgInvalidStartDateFormatVN     = "Invalid Start Date Format"
	MsgInvalidEndDateFormatVN       = "Invalid End Date Format"
	MsgInvalidEffectiveFromFormatVN = "Invalid Effective From Format"
	MsgInvalidAtDateFormatVN        = "Invalid At Date Format"
	MsgInvalidQueryParametersVN     = "Invalid Query Parameters"
	MsgInvalidPaymentScheduleVN     = "Invalid Payment Schedule"
	MsgBothPaymentSchedulesVN       = "Both Payment Schedules"

	// Required Fields
	MsgCCCDRequiredVN  = "National ID Required"
	MsgFieldRequiredVN = "Field Required"

	// Business Logic Errors
	MsgCannotCreatePayrateForProjectVN = "Cannot Create Payrate For Project"
	MsgInvalidPayrateConfigurationVN   = "Invalid Payrate Configuration"
	MsgProjectNotFoundVN               = "Project Not Found"
	MsgEmployeeNotFoundVN              = "Employee Not Found"
	MsgUserNotFoundVN                  = "User Not Found"
	MsgPayrateNotFoundVN               = "Payrate Not Found"
	MsgTimesheetNotFoundVN             = "Timesheet Not Found"

	// Service Errors
	MsgTimesheetServiceNotAvailableVN        = "Timesheet Service Not Available"
	MsgProjectEmployeeServiceNotAvailableVN  = "Project Employee Service Not Available"
	MsgFailedToRetrieveTimesheetSummaryVN    = "Failed To Retrieve Timesheet Summary"
	MsgFailedToRetrievePayrollHistoryVN      = "Failed To Retrieve Payroll History"
	MsgFailedToCountTimesheetsVN             = "Failed To Count Timesheets"
	MsgFailedToListEmployeesVN               = "Failed To List Employees"
	MsgFailedToCountEmployeesVN              = "Failed To Count Employees"
	MsgFailedToRetrieveUnassignedEmployeesVN = "Failed To Retrieve Unassigned Employees"
	MsgFailedToCountUnassignedEmployeesVN    = "Failed To Count Unassigned Employees"
	MsgFailedToBuildComprehensiveResponseVN  = "Failed To Build Comprehensive Response"
	MsgFailedToCreateEmployeeVN              = "Failed To Create Employee"
	MsgFailedToUpdateEmployeeVN              = "Failed To Update Employee"
	MsgFailedToDeleteEmployeeVN              = "Failed To Delete Employee"
	MsgFailedToDeleteEmployeeAssignmentsVN   = "Failed To Delete Employee Assignments"
	MsgFailedToValidateBankVN                = "Failed To Validate Bank"

	// Success Messages
	MsgSuccessVN                        = "Success"
	MsgCreatedSuccessfullyVN            = "Created Successfully"
	MsgUpdatedSuccessfullyVN            = "Updated Successfully"
	MsgDeletedSuccessfullyVN            = "Deleted Successfully"
	MsgEmailSentSuccessfullyVN          = "Email Sent Successfully"
	MsgPayrollEmailSentSuccessfullyVN   = "Payroll Email Sent Successfully"
	MsgPayrollEmailQueuedSuccessfullyVN = "Payroll Email Queued Successfully"
	MsgEmailHistoryRetrievedVN          = "Email History Retrieved"

	// Generic Messages
	MsgInternalServerErrorVN = "Internal Server Error"
	MsgNotFoundVN            = "Not Found"
	MsgConflictVN            = "Conflict"
	MsgValidationFailedVN    = "Validation Failed"

	// Additional Auth Messages
	MsgUserNotAuthenticatedVN        = "User Not Authenticated"
	MsgAuthorizationHeaderRequiredVN = "Authorization Header Required"
	MsgInvalidAuthorizationFormatVN  = "Invalid Authorization Format"

	// Additional Service Messages
	MsgFailedToListPayratesVN          = "Failed To List Payrates"
	MsgFailedToCountPayratesVN         = "Failed To Count Payrates"
	MsgCannotUpdatePayrateForProjectVN = "Cannot Update Payrate For Project"
	MsgPayrateCreatedSuccessfullyVN    = "Payrate Created Successfully"
	MsgPayrateRetrievedSuccessfullyVN  = "Payrate Retrieved Successfully"
	MsgPayrateUpdatedSuccessfullyVN    = "Payrate Updated Successfully"
	MsgPayratesRetrievedSuccessfullyVN = "Payrates Retrieved Successfully"
	MsgNoPayratesFoundVN               = "No Payrates Found"
	MsgPageOfPayratesRetrievedVN       = "Page Of Payrates Retrieved: %d"

	// Domain Error Messages
	MsgInvalidCredentialsVN     = "Invalid Credentials"
	MsgFailedToGenerateTokenVN  = "Failed To Generate Token"
	MsgInvalidEmployeeDataVN    = "Invalid Employee Data"
	MsgGoogleAccountNotLinkedVN = "Google Account Not Linked"

	// Email-OTP 2FA messages
	MsgOTPAccountMissingEmailVN            = "OTP Account Missing Email"
	MsgOTPAccountLockedVN                  = "OTP Account Locked"
	MsgOTPInvalidCodeOrSessionVN           = "OTP Invalid Code Or Session"
	MsgOTPStartFailedVN                    = "OTP Start Failed"
	MsgOTPVerifyFailedVN                   = "OTP Verify Failed"
	MsgOTPSessionIDRequiredVN              = "OTP Session ID Required"
	MsgOTPSessionIDMissingVN               = "OTP Session ID Missing"
	MsgOTPCodeRequiredVN                   = "OTP Code Required"
	MsgOTPResendTooSoonVN                  = "OTP Resend Too Soon"
	MsgOTPVerificationRequiredVN           = "OTP Verification Required"
	MsgRateLimitExceededVN                 = "Rate Limit Exceeded"
	MsgCaptchaFailedVN                     = "Captcha Failed"
	MsgCaptchaRequiredVN                   = "Captcha Required"
	MsgPasswordChangeNotAllowedOnProfileVN = "Password Change Not Allowed On Profile"

	// Timesheet Validation Messages
	MsgEmployeeAlreadyHasTimesheetVN = "Employee Already Has Timesheet: %d %d %s"

	// Project Messages
	MsgProjectCreatedSuccessfullyVN          = "Project Created Successfully"
	MsgProjectDetailsRetrievedSuccessfullyVN = "Project Details Retrieved Successfully"
	MsgProjectRetrievedSuccessfullyVN        = "Project Retrieved Successfully"
	MsgProjectsRetrievedSuccessfullyVN       = "Projects Retrieved Successfully"
	MsgProjectUpdatedSuccessfullyVN          = "Project Updated Successfully"
	MsgProjectsActivatedSuccessfullyVN       = "Projects Activated Successfully"
	MsgNoProjectsFoundVN                     = "No Projects Found"
	MsgPageOfProjectsRetrievedVN             = "Page Of Projects Retrieved: %d"
	MsgCannotModifyProjectWithStatusVN       = "Cannot Modify Project With Status"
	MsgFailedToListProjectsVN                = "Failed To List Projects"
	MsgFailedToCountProjectsVN               = "Failed To Count Projects"
	MsgFailedToGetUpdatedProjectVN           = "Failed To Get Updated Project"
	MsgFailedToActivateProjectsVN            = "Failed To Activate Projects"
	MsgProjectActivationCompletedVN          = "Project Activation Completed"
	MsgProjectUsersRetrievedSuccessfullyVN   = "Project Users Retrieved Successfully"
	MsgEmployeeUsersRetrievedSuccessfullyVN  = "Employee Users Retrieved Successfully"
	MsgAccessGrantedSuccessfullyVN           = "Access Granted Successfully"
	MsgAccessRevokedSuccessfullyVN           = "Access Revoked Successfully"
	MsgEmployeeAccessRequestedVN             = "Employee Access Requested"
	MsgEmployeeAccessAlreadyRequestedVN      = "Employee Access Already Requested"
	MsgOnlyPartnerCanRequestEmployeeAccessVN = "Only Partner Can Request Employee Access"
	MsgDuplicateCheckRequiresIdentifierVN    = "Duplicate Check Requires Identifier"
	MsgEmployeeDuplicatesFoundVN             = "Employee Duplicates Found"
	MsgCanOnlyGrantProjectAccessToPartnerVN  = "Can Only Grant Project Access To Partner"
	MsgCanOnlyGrantEmployeeAccessToPartnerVN = "Can Only Grant Employee Access To Partner"

	// Project Payrate Messages
	MsgNoPayratesFoundForProjectVN         = "No Payrates Found For Project"
	MsgProjectPayratesRetrievedVN          = "Project Payrates Retrieved"
	MsgPageOfProjectPayratesRetrievedVN    = "Page Of Project Payrates Retrieved: %d"
	MsgProjectPayrateCreatedSuccessfullyVN = "Project Payrate Created Successfully"
	MsgCurrentProjectPayrateRetrievedVN    = "Current Project Payrate Retrieved"
	MsgInvalidRequestBodyFormatVN          = "Invalid Request Body Format: %s"
	MsgEffectiveToNotSupportedVN           = "Effective To Not Supported"

	// Project Summary Messages
	MsgFailedToGetProjectSummaryVN        = "Failed To Get Project Summary"
	MsgProjectSummaryRetrievedVN          = "Project Summary Retrieved"
	MsgFailedToGetPartnerProjectSummaryVN = "Failed To Get Partner Project Summary"
	MsgPartnerProjectSummaryRetrievedVN   = "Partner Project Summary Retrieved"

	// Timesheet Messages
	MsgFailedToListTimesheetsVN                 = "Failed To List Timesheets"
	MsgTimesheetsRetrievedSuccessfullyVN        = "Timesheets Retrieved Successfully"
	MsgTimesheetCreatedSuccessfullyVN           = "Timesheet Created Successfully"
	MsgTimesheetUpdatedSuccessfullyVN           = "Timesheet Updated Successfully"
	MsgTimesheetDeletedSuccessfullyVN           = "Timesheet Deleted Successfully"
	MsgTimesheetApprovedSuccessfullyVN          = "Timesheet Approved Successfully"
	MsgTimesheetRejectedSuccessfullyVN          = "Timesheet Rejected Successfully"
	MsgTimesheetMarkedForNextPayrollVN          = "Timesheet Marked For Next Payroll"
	MsgTimesheetSummaryRetrievedVN              = "Timesheet Summary Retrieved"
	MsgDateParameterRequiredVN                  = "Date Parameter Required"
	MsgInvalidTimesheetIDVN                     = "Invalid Timesheet ID"
	MsgFailedToGetUpdatedTimesheetVN            = "Failed To Get Updated Timesheet"
	MsgFailedToGetPendingTimesheetsVN           = "Failed To Get Pending Timesheets"
	MsgFailedToGetTimesheetSummaryVN            = "Failed To Get Timesheet Summary"
	MsgCashReadinessRetrievedVN                 = "Cash Readiness Retrieved"
	MsgFailedToGetCashReadinessVN               = "Failed To Get Cash Readiness"
	MsgBulkTimesheetsCreatedSuccessfullyVN      = "Bulk Timesheets Created Successfully"
	MsgBulkTimesheetsUpdatedSuccessfullyVN      = "Bulk Timesheets Updated Successfully"
	MsgBulkTimesheetsDeletedSuccessfullyVN      = "Bulk Timesheets Deleted Successfully"
	MsgProjectTimesheetsRetrievedSuccessfullyVN = "Project Timesheets Retrieved Successfully"
	MsgNoProjectTimesheetsFoundVN               = "No Project Timesheets Found"

	// Payroll Messages
	MsgInvalidPeriodStartFormatVN       = "Invalid Period Start Format"
	MsgInvalidPeriodEndFormatVN         = "Invalid Period End Format"
	MsgInvalidPayDateFormatVN           = "Invalid Pay Date Format"
	MsgInvalidPayrollIDVN               = "Invalid Payroll ID"
	MsgFailedToListPayrollsVN           = "Failed To List Payrolls"
	MsgFailedToCountPayrollsVN          = "Failed To Count Payrolls"
	MsgPayrollCreatedSuccessfullyVN     = "Payroll Created Successfully"
	MsgPayrollsRetrievedSuccessfullyVN  = "Payrolls Retrieved Successfully"
	MsgPayrollRetrievedSuccessfullyVN   = "Payroll Retrieved Successfully"
	MsgPayrollUpdatedSuccessfullyVN     = "Payroll Updated Successfully"
	MsgPayrollDeletedSuccessfullyVN     = "Payroll Deleted Successfully"
	MsgInvalidPaymentDateFormatVN       = "Invalid Payment Date Format"
	MsgFailedToGetTemplateFileVN        = "Failed To Get Template File"
	MsgNoFileUploadedVN                 = "No File Uploaded"
	MsgFileNameEmptyVN                  = "File Name Empty"
	MsgFileSizeExceedsLimitVN           = "File Size Exceeds Limit"
	MsgFileNotExcelFormatVN             = "File Not Excel Format"
	MsgPayrollProcessedSuccessfullyVN   = "Payroll Processed Successfully"
	MsgTemplateDownloadedSuccessfullyVN = "Template Downloaded Successfully"

	// Service Layer Domain Error Messages
	MsgSelectedBankNotExistVN                   = "Selected Bank Not Exist"
	MsgSearchParameterRequiredVN                = "Search Parameter Required"
	MsgSearchTermMinLengthVN                    = "Search Term Min Length"
	MsgInvalidEmailFormatVN                     = "Invalid Email Format"
	MsgExcelFileNoSheetsVN                      = "Excel File No Sheets"
	MsgExcelFileMinRowsVN                       = "Excel File Min Rows"
	MsgCannotUpdatePayrateInvalidDateVN         = "Cannot Update Payrate Invalid Date"
	MsgCannotUpdatePayrateConflictingConfigVN   = "Cannot Update Payrate Conflicting Config"
	MsgCannotUpdatePayratePastLinkedTimesheetVN = "Cannot Update Payrate Past Linked Timesheet"
	MsgCannotUpdateEndedPayrateVN               = "Cannot Update Ended Payrate"
	MsgCannotDeletePayrateUsedByTimesheetsVN    = "Cannot Delete Payrate Used By Timesheets"
	// From-date-only model: a config's end is implied by its successor, so only
	// the latest config is editable and new configs must start after it.
	MsgPayrateCreateNotAfterLatestVN       = "Payrate Create Not After Latest: %s"
	MsgCannotUpdateNonLatestPayrateVN      = "Cannot Update Non Latest Payrate: %s"
	MsgCannotDeletePayrateApprovedLinkedVN = "Cannot Delete Payrate Approved Linked"
	MsgPayrateFoldKeyCollisionVN           = "Payrate Fold Key Collision: %s %s"
	MsgAtLeastOneEntryRequiredVN           = "At Least One Entry Required"
	MsgFromDateAfterToDateVN               = "From Date After To Date"
	MsgSearchQueryRequiredVN               = "Search Query Required"
	MsgSearchQueryMinLengthVN              = "Search Query Min Length"
	MsgTransactionGroupCannotBeNilVN       = "Transaction Group Cannot Be Nil"
	MsgDatabaseConstraintViolationVN       = "Database Constraint Violation"
	MsgValidationFailedWithDetailsVN       = "Validation Failed With Details: %s"
	MsgTimesheetAlreadyExistsPendingVN     = "Timesheet Already Exists Pending"
	MsgTimesheetAlreadyExistsApprovedVN    = "Timesheet Already Exists Approved"
	MsgTimesheetCannotBeEditedVN           = "Timesheet Cannot Be Edited"
	MsgFailedToExportBulkTransferVN        = "Failed To Export Bulk Transfer"
	MsgTransactionAlreadySettledVN         = "Transaction Already Settled"

	// Dashboard Messages
	MsgDashboardSummaryRetrievedVN      = "Dashboard Summary Retrieved"
	MsgFinancialOverviewRetrievedVN     = "Financial Overview Retrieved"
	MsgRecentActivitiesRetrievedVN      = "Recent Activities Retrieved"
	MsgSystemNotificationsRetrievedVN   = "System Notifications Retrieved"
	MsgNewEmployeesRetrievedVN          = "New Employees Retrieved"
	MsgProjectStatusOverviewRetrievedVN = "Project Status Overview Retrieved"
	MsgProjectionRetrievedVN            = "Projection Retrieved"

	// Employee Messages
	MsgEmployeeCreatedSuccessfullyVN         = "Employee Created Successfully"
	MsgEmployeeRetrievedSuccessfullyVN       = "Employee Retrieved Successfully"
	MsgEmployeeUpdatedSuccessfullyVN         = "Employee Updated Successfully"
	MsgEmployeeDeletedSuccessfullyVN         = "Employee Deleted Successfully"
	MsgEmployeeTimesheetSummaryRetrievedVN   = "Employee Timesheet Summary Retrieved"
	MsgEmployeeProjectAssignmentUpdatedVN    = "Employee Project Assignment Updated"
	MsgCannotDeleteEmployeeHasTimesheetsVN   = "Cannot Delete Employee Has Timesheets"
	MsgEmployeeDeletedWithAssignmentsVN      = "Employee Deleted With Assignments"
	MsgEmployeeUnlinkedFromProjectsVN        = "Employee Unlinked From Projects"
	MsgCannotDeleteEmployeeFlexiblePaymentVN = "Cannot Delete Employee Flexible Payment"

	// Asset Messages
	MsgInvalidFormDataVN                   = "Invalid Form Data"
	MsgInvalidUploadTypeVN                 = "Invalid Upload Type"
	MsgNoFileUploadedAssetVN               = "No File Uploaded Asset"
	MsgAssetUploadedSuccessfullyVN         = "Asset Uploaded Successfully"
	MsgAssetIDMustBeValidNumberVN          = "Asset ID Must Be Valid Number"
	MsgAssetRetrievedSuccessfullyVN        = "Asset Retrieved Successfully"
	MsgFailedToListAssetsVN                = "Failed To List Assets"
	MsgFailedToCountAssetsVN               = "Failed To Count Assets"
	MsgNoAssetsFoundVN                     = "No Assets Found"
	MsgAssetsRetrievedSuccessfullyVN       = "Assets Retrieved Successfully"
	MsgPageOfAssetsRetrievedVN             = "Page Of Assets Retrieved: %s"
	MsgAssetDeletedSuccessfullyVN          = "Asset Deleted Successfully"
	MsgAssetReferenceUpdatedSuccessfullyVN = "Asset Reference Updated Successfully"
	MsgAssetFileNotFoundVN                 = "Asset File Not Found"
	MsgFailedToAccessAssetFileVN           = "Failed To Access Asset File"

	// Ledger Messages
	MsgLedgerEntryCreatedSuccessfullyVN         = "Ledger Entry Created Successfully"
	MsgLedgerEntryIDMustBeValidNumberVN         = "Ledger Entry ID Must Be Valid Number"
	MsgLedgerEntryRetrievedSuccessfullyVN       = "Ledger Entry Retrieved Successfully"
	MsgLedgerAccountRequiredVN                  = "Ledger Account Required"
	MsgLedgerPartyRequiredVN                    = "Ledger Party Required"
	MsgLedgerDescriptionRequiredVN              = "Ledger Description Required"
	MsgLedgerDateRequiredVN                     = "Ledger Date Required"
	MsgLedgerDebitCannotBeNegativeVN            = "Ledger Debit Cannot Be Negative"
	MsgLedgerCreditCannotBeNegativeVN           = "Ledger Credit Cannot Be Negative"
	MsgLedgerDuplicateAssetVN                   = "Ledger Duplicate Asset"
	MsgLedgerDuplicateEntryVN                   = "Ledger Duplicate Entry"
	MsgLedgerDuplicateAssetInBatchVN            = "Ledger Duplicate Asset In Batch"
	MsgFailedToListLedgerEntriesVN              = "Failed To List Ledger Entries"
	MsgFailedToCountLedgerEntriesVN             = "Failed To Count Ledger Entries"
	MsgNoLedgerEntriesFoundVN                   = "No Ledger Entries Found"
	MsgLedgerEntriesRetrievedSuccessfullyVN     = "Ledger Entries Retrieved Successfully"
	MsgPageOfLedgerEntriesRetrievedVN           = "Page Of Ledger Entries Retrieved: %s"
	MsgLedgerEntriesCreatedSuccessfullyVN       = "Ledger Entries Created Successfully"
	MsgFailedToGetBalanceVN                     = "Failed To Get Balance"
	MsgBalanceRetrievedSuccessfullyVN           = "Balance Retrieved Successfully"
	MsgBothFromDateAndToDateRequiredVN          = "Both From Date And To Date Required"
	MsgFromDateCannotBeAfterToDateVN            = "From Date Cannot Be After To Date"
	MsgCashFlowSummaryRetrievedSuccessfullyVN   = "Cash Flow Summary Retrieved Successfully"
	MsgLedgerBalancesRecalculatedSuccessfullyVN = "Ledger Balances Recalculated Successfully"
	MsgLedgerEntryReversedSuccessfullyVN        = "Ledger Entry Reversed Successfully"
	MsgBothFromAndToDateRequiredVN              = "Both From And To Date Required"
	MsgInvalidFromDateFormatLedgerVN            = "Invalid From Date Format Ledger"
	MsgInvalidToDateFormatLedgerVN              = "Invalid To Date Format Ledger"
	MsgInvalidProjectIDParameterVN              = "Invalid Project ID Parameter"
	MsgLedgerSummaryRetrievedSuccessfullyVN     = "Ledger Summary Retrieved Successfully"
	MsgAccountMetadataRetrievedSuccessfullyVN   = "Account Metadata Retrieved Successfully"

	// User Messages
	MsgUserCreatedSuccessfullyVN                = "User Created Successfully"
	MsgUserRetrievedSuccessfullyVN              = "User Retrieved Successfully"
	MsgUserUpdatedSuccessfullyVN                = "User Updated Successfully"
	MsgUsersRetrievedSuccessfullyVN             = "Users Retrieved Successfully"
	MsgNoUsersFoundVN                           = "No Users Found"
	MsgUserSummaryFetchedSuccessfullyVN         = "User Summary Fetched Successfully"
	MsgPasswordResetSuccessfullyVN              = "Password Reset Successfully"
	MsgUserPasswordResetSuccessfullyVN          = "User Password Reset Successfully"
	MsgUserPasswordResetProcessingVN            = "User Password Reset Processing"
	MsgUserPasswordResetJobNotFoundVN           = "User Password Reset Job Not Found"
	MsgUserActivitySummaryFetchedSuccessfullyVN = "User Activity Summary Fetched Successfully"
	MsgEmployeePasswordChangedSuccessfullyVN    = "Employee Password Changed Successfully"

	// Password reset (self-service email flow) — Red Team C2/H2/H5/H6
	MsgPasswordResetRequestedVN        = "Password Reset Requested"
	MsgPasswordResetSuccessVN          = "Password Reset Success"
	MsgPasswordResetTokenInvalidVN     = "Password Reset Token Invalid"
	MsgPasswordResetStoreUnavailableVN = "Password Reset Store Unavailable"

	// Zalo OTP password reset (employee mobile channel) — self-service flow.
	MsgZaloResetRequestedVN      = "Zalo Reset Requested"
	MsgZaloResetCodeInvalidVN    = "Zalo Reset Code Invalid"
	MsgZaloResetStoreDownVN      = "Zalo Reset Store Down"
	MsgZaloResetSuccessVN        = "Zalo Reset Success"
	MsgZaloResetMobileRequiredVN = "Zalo Reset Mobile Required"
	MsgZaloResetResendTooSoonVN  = "Zalo Reset Resend Too Soon"

	// Integration API (machine API key channel).
	MsgAPIKeyMissingVN     = "API Key Missing"
	MsgAPIKeyInvalidVN     = "API Key Invalid"
	MsgAPIKeyScopeDeniedVN = "API Key Scope Denied"
	MsgAPIKeyCreatedVN     = "API Key Created"
	MsgAPIKeyRevokedVN     = "API Key Revoked"
	MsgAPIKeyNotFoundVN    = "API Key Not Found"

	// Vendor integration API (machine-key authenticated TingHire channel).
	MsgIntegrationPhoneInvalidVN      = "Integration Phone Invalid"
	MsgIntegrationAccountNotFoundVN   = "Integration Account Not Found"
	MsgIntegrationOTPSentVN           = "Integration OTP Sent"
	MsgIntegrationOTPDisabledVN       = "Integration OTP Disabled"
	MsgIntegrationOTPSendFailedVN     = "Integration OTP Send Failed"
	MsgIntegrationOTPVerifiedVN       = "Integration OTP Verified"
	MsgIntegrationResetTokenInvalidVN = "Integration Reset Token Invalid"
	MsgIntegrationResetSuccessVN      = "Integration Reset Success"
	MsgIntegrationEmployeeFoundVN     = "Integration Employee Found"
	MsgIntegrationEmployeeNotFoundVN  = "Integration Employee Not Found"
	MsgIntegrationZaloTokenVN         = "Integration Zalo Token"

	// Self check-in via the vendor integration API.
	MsgSelfCheckinProjectNotSupportedVN = "Self Checkin Project Not Supported"
	MsgSelfCheckinAlreadyEnabledVN      = "Self Checkin Already Enabled"
	MsgSelfCheckinAlreadyDisabledVN     = "Self Checkin Already Disabled"
	MsgSelfCheckinPendingExistsVN       = "Self Checkin Pending Exists"
	MsgSelfCheckinUpdateSuccessVN       = "Self Checkin Update Success"
	MsgSelfCheckinOTPSentVN             = "Self Checkin OTP Sent"
	MsgSelfCheckinOTPVerifiedVN         = "Self Checkin OTP Verified"
	MsgSelfCheckinTokenInvalidVN        = "Self Checkin Token Invalid"


	// Bank Messages
	MsgInvalidBankIDVN             = "Invalid Bank ID"
	MsgBankNotFoundVN              = "Bank Not Found"
	MsgFailedToCreateBankVN        = "Failed To Create Bank"
	MsgBankCreatedSuccessfullyVN   = "Bank Created Successfully"
	MsgFailedToRetrieveBankVN      = "Failed To Retrieve Bank"
	MsgBankRetrievedSuccessfullyVN = "Bank Retrieved Successfully"
	MsgFailedToUpdateBankVN        = "Failed To Update Bank"
	MsgBankUpdatedSuccessfullyVN   = "Bank Updated Successfully"
	MsgFailedToDeleteBankVN        = "Failed To Delete Bank"
	MsgBankDeletedSuccessfullyVN   = "Bank Deleted Successfully"

	// Project Employee Messages
	MsgAssignmentNotFoundVN                     = "Assignment Not Found"
	MsgActiveAssignmentNotFoundVN               = "Active Assignment Not Found"
	MsgAssignmentOverlapVN                      = "Assignment Overlap"
	MsgAssignmentUpdateExcludesPaidTimesheetsVN = "Assignment Update Excludes Paid Timesheets"
	MsgCannotAssignToProjectStatusVN            = "Cannot Assign To Project Status"
	MsgAtLeastOneAssignmentRequiredVN           = "At Least One Assignment Required"
	MsgFailedToSuggestStartDateVN               = "Failed To Suggest Start Date"
	MsgAssignmentSuccessVN                      = "Assignment Success"
	MsgMultipleAssignmentsSuccessVN             = "Multiple Assignments Success: %d"

	// Employee Domain Service Messages
	MsgEmployeeWithCCCDExistsVN  = "Employee With National ID Exists"
	MsgEmployeeWithEmailExistsVN = "Employee With Email Exists"
	MsgInvalidAgeRangeVN         = "Invalid Age Range"
	MsgDateCannotBeInFutureVN    = "Date Cannot Be In Future"

	// Timesheet Domain Service Messages
	MsgTimesheetNotPendingApprovalVN       = "Timesheet Not Pending Approval"
	MsgTimesheetTooOldForApprovalVN        = "Timesheet Too Old For Approval"
	MsgCannotApproveSelfCreatedTimesheetVN = "Cannot Approve Self Created Timesheet"
	MsgRejectionReasonRequiredVN           = "Rejection Reason Required"
	MsgCannotRejectSelfCreatedTimesheetVN  = "Cannot Reject Self Created Timesheet"
	MsgCanOnlyPayApprovedTimesheetsVN      = "Can Only Pay Approved Timesheets"
	MsgPaidAmountRequiredVN                = "Paid Amount Required"
	MsgPaymentReferenceRequiredVN          = "Payment Reference Required"
	MsgInvalidDateRangeVN                  = "Invalid Date Range"
	MsgDateRangeTooLargeVN                 = "Date Range Too Large"
	MsgCannotModifyApprovedTimesheetVN     = "Cannot Modify Approved Timesheet"
	MsgCannotModifyRejectedTimesheetVN     = "Cannot Modify Rejected Timesheet"
	MsgTimesheetTooOldForModificationVN    = "Timesheet Too Old For Modification"
	MsgCannotDeleteApprovedTimesheetVN     = "Cannot Delete Approved Timesheet"
	MsgCannotDeletePaidTimesheetVN         = "Cannot Delete Paid Timesheet"
	MsgInvalidPaymentStatusVN              = "Invalid Payment Status"
	MsgInvalidPaymentStatusTransitionVN    = "Invalid Payment Status Transition"
	MsgBulkTimesheetApprovalFailedVN       = "Bulk Timesheet Approval Failed"
	MsgBulkTimesheetApprovalPartialVN      = "Bulk Timesheet Approval Partial: %d %d %d"
	MsgTimesheetCannotBeApprovedVN         = "Timesheet Cannot Be Approved"
	MsgTimesheetApprovalFailedVN           = "Timesheet Approval Failed"
	MsgTimesheetCannotBeRejectedVN         = "Timesheet Cannot Be Rejected"
	MsgTimesheetRejectionFailedVN          = "Timesheet Rejection Failed"
	MsgTimesheetUpdateFailedVN             = "Timesheet Update Failed"

	// Bulk Transfer Messages
	MsgBulkTransferFileAlreadyProcessedVN = "Bulk Transfer File Already Processed: %d"
	MsgOrphanTransferFilesDeletedVN       = "Orphan Transfer Files Deleted: %d"
	MsgNoOrphanTransferFilesVN            = "No Orphan Transfer Files"
	MsgTransferListingHeaderNotFoundVN    = "Transfer Listing Header Not Found"
	MsgTransferListingNoRowsVN            = "Transfer Listing No Rows"
	MsgFailedToGenerateKQVN               = "Failed To Generate KQ"

	// Payrate Update Restriction Messages
	MsgCannotUpdatePayrateWithTimesheetsVN = "Cannot Update Payrate With Timesheets"
	MsgPayrateAlreadyExistsForDateVN       = "Payrate Already Exists For Date: %s"

	// Timesheet Work Period Validation Messages
	MsgTimesheetDateOutsideWorkPeriodVN = "Timesheet Date Outside Work Period: %s %d %s %s"

	// Timesheet Deletion Validation Messages
	MsgCanOnlyDeletePendingOrRejectedTimesheetVN = "Can Only Delete Pending Or Rejected Timesheet"
	MsgCannotEditPaidTimesheetVN                 = "Cannot Edit Paid Timesheet"
	MsgCannotEditPaidTimesheetDetailedVN         = "Cannot Edit Paid Timesheet Detailed: %s %s %s %s %s"
	MsgOnlyAdminCanEditApprovedTimesheetVN       = "Only Admin Can Edit Approved Timesheet"
	MsgTimesheetAccessDeniedVN                   = "Timesheet Access Denied"

	// Payrate Configuration Messages
	MsgPayrateConfigurationRequiredVN  = "Payrate Configuration Required"
	MsgNoActivePayrateConfigVN         = "No Active Payrate Config"
	MsgPayTypeRequiredVN               = "Pay Type Required"
	MsgPositionNotFoundInAssignmentVN  = "Position Not Found In Assignment"
	MsgCannotCreateTimesheetZeroRateVN = "Cannot Create Timesheet Zero Rate: %s"

	// Default Password Notification Messages
	MsgFailedToNotifyDefaultPasswordUsersVN = "Failed To Notify Default Password Users"

	// Notification Messages
	MsgUnreadNotificationsRetrievedVN = "Unread Notifications Retrieved"

	// Transaction Messages
	MsgFailedToListTransactionsVN  = "Failed To List Transactions"
	MsgFailedToCreateExcelFileVN   = "Failed To Create Excel File"
	MsgFailedToWriteExcelHeadersVN = "Failed To Write Excel Headers"
	MsgFailedToWriteExcelDataVN    = "Failed To Write Excel Data"
	MsgFailedToAutoSizeColumnsVN   = "Failed To Auto Size Columns"
	MsgFailedToCreateExcelBufferVN = "Failed To Create Excel Buffer"
	MsgExportAdminOnlyVN           = "Export Admin Only"

	// General Data Retrieval Messages
	MsgFailedToRetrieveDataVN      = "Failed To Retrieve Data"
	MsgDataRetrievedSuccessfullyVN = "Data Retrieved Successfully"
	MsgInvalidIDFormatVN           = "Invalid ID Format"

	// Settings Messages
	MsgInvalidSettingIDVN          = "Invalid Setting ID"
	MsgFailedToCreateSettingVN     = "Failed To Create Setting"
	MsgFailedToGetSettingVN        = "Failed To Get Setting"
	MsgFailedToUpdateSettingVN     = "Failed To Update Setting"
	MsgFailedToDeleteSettingVN     = "Failed To Delete Setting"
	MsgFailedToListSettingsVN      = "Failed To List Settings"
	MsgFailedToGetActiveSettingsVN = "Failed To Get Active Settings"

	// Payment Schedule Messages
	MsgInvalidPaymentScheduleValueVN          = "Invalid Payment Schedule Value"
	MsgFailedToRequestScheduleChangeVN        = "Failed To Request Schedule Change"
	MsgFailedToRetrievePendingSchedulesVN     = "Failed To Retrieve Pending Schedules"
	MsgFailedToCancelScheduleChangeVN         = "Failed To Cancel Schedule Change"
	MsgCannotRemoveEmployeesProjectStatusVN   = "Cannot Remove Employees Project Status"
	MsgCannotUpdateAssignmentsProjectStatusVN = "Cannot Update Assignments Project Status"

	// Notification Messages (additional)
	MsgFailedToRetrieveNotificationsVN = "Failed To Retrieve Notifications"
	MsgFailedToCountNotificationsVN    = "Failed To Count Notifications"
	MsgFailedToGetUnreadCountVN        = "Failed To Get Unread Count"
	MsgInvalidNotificationIDVN         = "Invalid Notification ID"
	MsgFailedToMarkNotificationReadVN  = "Failed To Mark Notification Read"
	MsgFailedToMarkAllNotificationsVN  = "Failed To Mark All Notifications"
	MsgInvalidContentTypeVN            = "Invalid Content Type"
	MsgFailedToCreateNotificationVN    = "Failed To Create Notification"
	MsgAtLeastOneRecipientRequiredVN   = "At Least One Recipient Required"
	MsgOnlyAdminCanSendNotificationsVN = "Only Admin Can Send Notifications"

	// Advance Payment / Reconciliation Messages
	MsgInvalidRequestParametersVN           = "Invalid Request Parameters"
	MsgInvalidMonthFormatVN                 = "Invalid Month Format"
	MsgFailedToGenerateReconciliationVN     = "Failed To Generate Reconciliation"
	MsgFailedToGenerateReconciliationFileVN = "Failed To Generate Reconciliation File"
	MsgFailedToSendReconciliationEmailVN    = "Failed To Send Reconciliation Email"

	// Bank Messages (additional)
	MsgFailedToRetrieveBanksVN = "Failed To Retrieve Banks"

	// Employee Import Messages
	MsgFailedToOpenFileVN          = "Failed To Open File"
	MsgFailedToStoreFileVN         = "Failed To Store File"
	MsgFailedToInitImportVN        = "Failed To Init Import"
	MsgFailedToQueueImportJobVN    = "Failed To Queue Import Job"
	MsgFailedToInitEmployeeUsersVN = "Failed To Init Employee Users"

	// Mobile Backfill Import Messages
	MsgMobileBackfillAdminOnlyVN = "Mobile Backfill Admin Only"
	MsgFailedToParseMobileFileVN = "Failed To Parse Mobile File"
	MsgFailedToBackfillMobilesVN = "Failed To Backfill Mobiles"

	// Timesheet Export Messages
	MsgInvalidStatusFilterVN            = "Invalid Status Filter"
	MsgFailedToGetTimesheetsVN          = "Failed To Get Timesheets"
	MsgFailedToGetPayrollReportDataVN   = "Failed To Get Payroll Report Data"
	MsgFailedToGeneratePayrollReportVN  = "Failed To Generate Payroll Report"
	MsgFailedToCheckProjectAccessVN     = "Failed To Check Project Access"
	MsgFailedToGetAccessibleEmployeesVN = "Failed To Get Accessible Employees"
	MsgEmployeeAccessDeniedVN           = "Employee Access Denied: %d"
	MsgFailedToGetProjectEmployeesVN    = "Failed To Get Project Employees"
	MsgFailedToExtractDayTypesVN        = "Failed To Extract Day Types"
	MsgFailedToExtractShiftTypesVN      = "Failed To Extract Shift Types"
	MsgFailedToGenerateTemplateVN       = "Failed To Generate Template"
	MsgFailedToSaveExcelFileVN          = "Failed To Save Excel File"
	MsgInvalidMonthFormatTimesheetVN    = "Invalid Month Format Timesheet"

	// Employee Payroll Messages
	MsgInvalidPayrollStatusVN            = "Invalid Payroll Status"
	MsgFailedToRetrieveCurrentProjectsVN = "Failed To Retrieve Current Projects"
	MsgFailedToRetrieveTimesheetsVN      = "Failed To Retrieve Timesheets"
	MsgInvalidEmployeeStatusFilterVN     = "Invalid Employee Status Filter"
	MsgInvalidUserIDFormatVN             = "Invalid User ID Format"

	// Auth Service
	MsgInvalidTokenVN                = "Invalid Token"
	MsgTokenBlacklistedVN            = "Token Blacklisted"
	MsgFailedToCheckTokenBlacklistVN = "Failed To Check Token Blacklist"
	MsgFailedToBlacklistTokenVN      = "Failed To Blacklist Token"

	// Dashboard Services
	MsgInvalidPeriodFormatVN                  = "Invalid Period Format"
	MsgFailedToGetRecentActivitiesVN          = "Failed To Get Recent Activities"
	MsgFailedToCountActivitiesVN              = "Failed To Count Activities"
	MsgFailedToConvertAuditLogsToActivitiesVN = "Failed To Convert Audit Logs To Activities"
	MsgFailedToCountTotalEmployeesVN          = "Failed To Count Total Employees"
	MsgFailedToCountWorkingEmployeesVN        = "Failed To Count Working Employees"
	MsgFailedToGetEmployeesSummaryForHiresVN  = "Failed To Get Employees Summary For Hires"
	MsgFailedToGetTotalPaidSalaryVN           = "Failed To Get Total Paid Salary"
	MsgFailedToGetPendingSalaryVN             = "Failed To Get Pending Salary"
	MsgFailedToGetPaidSalaryVN                = "Failed To Get Paid Salary"
	MsgFailedToGetMonthlyFinancialsVN         = "Failed To Get Monthly Financials"
	MsgFailedToGetFinancialChartDataVN        = "Failed To Get Financial Chart Data"
	MsgFailedToGetNotificationsVN             = "Failed To Get Notifications"
	MsgFailedToCountUnreadNotificationsVN     = "Failed To Count Unread Notifications"
	MsgFailedToGetUnreadNotificationsVN       = "Failed To Get Unread Notifications"

	// Notification Service
	MsgEmailSentEventRequiredVN                    = "Email Sent Event Required"
	MsgFailedToSerializeRecipientsVN               = "Failed To Serialize Recipients"
	MsgFailedToLogEmailNotificationVN              = "Failed To Log Email Notification"
	MsgRequestPayloadRequiredVN                    = "Request Payload Required"
	MsgFailedToFetchPayrollReportDataVN            = "Failed To Fetch Payroll Report Data"
	MsgLimitMustBeGreaterThanZeroVN                = "Limit Must Be Greater Than Zero"
	MsgFailedToGeneratePayrollEmailReportVN        = "Failed To Generate Payroll Email Report"
	MsgOffsetCannotBeNegativeVN                    = "Offset Cannot Be Negative"
	MsgFailedToRetrieveEmailHistoryVN              = "Failed To Retrieve Email History"
	MsgFailedToCountEmailHistoryVN                 = "Failed To Count Email History"
	MsgEmailHistoryRecordNotFoundVN                = "Email History Record Not Found"
	MsgFailedToParseEmailMetadataVN                = "Failed To Parse Email Metadata"
	MsgFailedToSerializeUpdatedMetadataVN          = "Failed To Serialize Updated Metadata"
	MsgRecipientsCannotBeEmptyVN                   = "Recipients Cannot Be Empty"
	MsgFailedToRenderPayrollEmailTemplateVN        = "Failed To Render Payroll Email Template"
	MsgPaymentCycleChangedEventRequiredVN          = "Payment Cycle Changed Event Required"
	MsgFailedToLogPaymentCycleChangeNotificationVN = "Failed To Log Payment Cycle Change Notification"
	MsgNotificationNotFoundOrAccessDeniedVN        = "Notification Not Found Or Access Denied"
	MsgRecipientUserNotFoundVN                     = "Recipient User Not Found"

	// Advance Payment Service
	MsgFailedToRetrieveTransferFilesVN    = "Failed To Retrieve Transfer Files"
	MsgTransferHistoryNotFoundVN          = "Transfer History Not Found"
	MsgFailedToParseTransferDataVN        = "Failed To Parse Transfer Data"
	MsgFailedToGetCurrentProgressVN       = "Failed To Get Current Progress"
	MsgFailedToCalculateDateRangeVN       = "Failed To Calculate Date Range"
	MsgFailedToAcquireLockVN              = "Failed To Acquire Lock"
	MsgFailedToGetPreviousResultVN        = "Failed To Get Previous Result"
	MsgFailedToCancelPendingRequestsVN    = "Failed To Cancel Pending Requests"
	MsgFailedToGetPaidRequestsVN          = "Failed To Get Paid Requests"
	MsgFailedToExportReconciliationFileVN = "Failed To Export Reconciliation File"
	MsgFailedToGetPendingRequestsVN       = "Failed To Get Pending Requests"
	MsgFailedToGroupRequestsVN            = "Failed To Group Requests"
	MsgFailedToMarshalBulkTransferDataVN  = "Failed To Marshal Bulk Transfer Data"
	MsgFailedToSaveBulkTransferFileVN     = "Failed To Save Bulk Transfer File"

	// Asset Service
	MsgFailedToResetFilePointerForChecksumVN = "Failed To Reset File Pointer For Checksum"
	MsgFailedToCalculateFileChecksumVN       = "Failed To Calculate File Checksum"
	MsgFailedToResetFilePointerForStorageVN  = "Failed To Reset File Pointer For Storage"
	MsgFailedToStoreFileBytesVN              = "Failed To Store File Bytes"

	// Employee Import

	// General Pattern Constants
	MsgFailedToCreateXVN = "Failed To Create item: %s"
	MsgFailedToUpdateXVN = "Failed To Update item: %s"
	MsgFailedToDeleteXVN = "Failed To Delete item: %s"
	MsgFailedToListXVN   = "Failed To List item: %s"
	MsgFailedToCountXVN  = "Failed To Count item: %s"
	MsgFailedToGetXVN    = "Failed To Get item: %s"
	MsgXNotFoundVN       = "item Not Found: %s"
	MsgXRequiredVN       = "item Required: %s"
	MsgInvalidXFormatVN  = "Invalid item Format: %s"

	// Additional Service Errors
	MsgAccountDisabledVN                           = "Account Disabled"
	MsgCurrentPasswordIncorrectVN                  = "Current Password Incorrect"
	MsgEmailAlreadyTakenVN                         = "Email Already Taken"
	MsgUsernameAlreadyTakenVN                      = "Username Already Taken"
	MsgMobileAlreadyTakenVN                        = "Mobile Already Taken"
	MsgUserWithEmailExistsVN                       = "User With Email Exists"
	MsgUserWithMobileExistsVN                      = "User With Mobile Exists"
	MsgUserWithUsernameExistsVN                    = "User With Username Exists"
	MsgUserNotFoundVN2                             = "User Not Found"
	MsgCannotDeleteProjectWithApprovedTimesheetsVN = "Cannot Delete Project With Approved Timesheets"
	MsgCannotDeleteProjectWithAssignedEmployeesVN  = "Cannot Delete Project With Assigned Employees"
	MsgCannotEndAssignmentBeforeTimesheetDatesVN   = "Cannot End Assignment Before Timesheet Dates"
	MsgCannotGrantAccessToEmployeeCreatorVN        = "Cannot Grant Access To Employee Creator"
	MsgOnlyEmployeeCreatorOrAdminCanGrantAccessVN  = "Only Employee Creator Or Admin Can Grant Access"
	MsgOnlyEmployeeCreatorOrAdminCanRevokeAccessVN = "Only Employee Creator Or Admin Can Revoke Access"
	MsgOnlyProjectCreatorOrAdminCanGrantAccessVN   = "Only Project Creator Or Admin Can Grant Access"
	MsgOnlyProjectCreatorOrAdminCanRevokeAccessVN  = "Only Project Creator Or Admin Can Revoke Access"
	MsgUserAlreadyHasAccessToEmployeeVN            = "User Already Has Access To Employee"
	MsgUserAlreadyHasAccessToProjectVN             = "User Already Has Access To Project"
	MsgRecipientUserNotActiveVN                    = "Recipient User Not Active"
	MsgNoRecipientsOrRolesProvidedVN               = "No Recipients Or Roles Provided"
	MsgEmailHistoryRepoNotConfiguredVN             = "Email History Repo Not Configured"
	MsgNotificationRepoNotConfiguredVN             = "Notification Repo Not Configured"
	MsgEmailDeliveryFailedVN                       = "Email Delivery Failed"
	MsgMissingResendAPIKeyVN                       = "Missing Resend API Key"
	MsgFailedToCreateProjectVN                     = "Failed To Create Project"
	MsgFailedToGetProjectsVN                       = "Failed To Get Projects"
	MsgFailedToHashPasswordVN                      = "Failed To Hash Password"
	MsgFailedToHashNewPasswordVN                   = "Failed To Hash New Password"
	MsgFailedToUpdateUserPasswordVN                = "Failed To Update User Password"
	MsgFailedToValidateProjectDeletionVN           = "Failed To Validate Project Deletion"
	MsgFailedToCountNewEmployeesVN                 = "Failed To Count New Employees"
	MsgFailedToGetRecentEmployeesVN                = "Failed To Get Recent Employees"
	MsgFailedToGetStatusCountsVN                   = "Failed To Get Status Counts"
	MsgFailedToGetActiveEmployeeCountVN            = "Failed To Get Active Employee Count"
	MsgFailedToGetUserActivitiesVN                 = "Failed To Get User Activities"
	MsgBulkTransferHistoryNotFoundVN               = "Bulk Transfer History Not Found"

	// Advance Payment Business Errors
	MsgNoEmployeesThisMonthVN           = "No Employees This Month"
	MsgMonthRequiredVN                  = "Month Required"
	MsgInvalidMonthFormatYYYYMMVN       = "Invalid Month Format YYYYMM"
	MsgInvalidDateFormatGenericVN       = "Invalid Date Format Generic"
	MsgEmployeeInfoNotFoundVN           = "Employee Info Not Found"
	MsgMinAdvanceAmountVN               = "Min Advance Amount"
	MsgEmployeeNoFlexiblePayScheduleVN  = "Employee No Flexible Pay Schedule"
	MsgAdvanceAmountExceedsLimitVN      = "Advance Amount Exceeds Limit"
	MsgSalaryInfoNotFoundForMonthVN     = "Salary Info Not Found For Month"
	MsgCannotCancelRequestVN            = "Cannot Cancel Request"
	MsgCanOnlyCancelPendingRequestVN    = "Can Only Cancel Pending Request"
	MsgCanOnlyCancelPendingOrApprovedVN = "Can Only Cancel Pending Or Approved"
	MsgAdvanceRequestsDisabledVN        = "Advance Requests Disabled"
	MsgAdvanceRequestPausedTitleVN      = "Advance Request Paused Title"
	MsgAdvanceRequestPausedReasonVN     = "Advance Request Paused Reason"

	// Advance Payment Cutoff Errors
	MsgAdvanceRequestCutoffVN       = "Advance Request Cutoff"
	MsgAdvancePeriodNotAvailableVN  = "Advance Period Not Available"
	MsgAdvanceCutoffTitleVN         = "Advance Cutoff Title: %s"
	MsgAdvanceCutoffWaitingUploadVN = "Advance Cutoff Waiting Upload: %s"

	// Advance-payment source exclusivity. A salary period may be funded by the
	// admin workbook OR by self check-in/out, never both, so the employee-facing
	// refusals below point at the single correct surface.
	MsgAdvancePeriodMixedSourcesVN   = "Advance Period Mixed Sources: %s"
	MsgAdvancePeriodCheckInOnlyVN    = "Advance Period Check In Only: %s"
	MsgAdvanceCheckInOnlyTitleVN     = "Advance Check In Only Title"
	MsgCheckInEnableUploadConflictVN = "Check In Enable Upload Conflict: %s"

	// Auth Business Errors
	MsgCCCDUsedByAnotherAccountVN  = "National ID Used By Another Account"
	MsgPhoneUsedByAnotherAccountVN = "Phone Used By Another Account"
	MsgInvalidMobileFormatVN       = "Invalid Mobile Format"
	MsgUserMobileRoleRestrictedVN  = "User Mobile Role Restricted"
	// MsgMobileSharedByEmployeesVN is returned when one phone number is carried
	// by several employee records: the number cannot be tied to a single
	// account, so login and password reset must refuse it (fail closed) instead
	// of guessing which employee the caller is.
	MsgMobileSharedByEmployeesVN = "Mobile Shared By Employees"

	// Employee mobile rules: the required check is admin policy (settings
	// toggle, default off); the uniqueness check is always on — one phone
	// number must identify one employee or identity.Resolver fails closed and
	// every holder loses phone login and Zalo OTP.
	MsgEmployeeMobileRequiredVN = "Employee Mobile Required"
	MsgEmployeeMobileTakenVN    = "Employee Mobile Taken"

	// Employee Business Errors
	MsgEmployeeNoUserAccountVN = "Employee No User Account"
	MsgFailedToCheckAccessVN   = "Failed To Check Access"

	// Settlement Business Errors
	MsgCannotOpenFileVN                     = "Cannot Open File"
	MsgCannotReadExcelFileVN                = "Cannot Read Excel File"
	MsgEmptyCurrencyValueVN                 = "Empty Currency Value"
	MsgInternalSheetNoTimesheetIDsVN        = "Internal Sheet No Timesheet I Ds"
	MsgCannotGetTimesheetInfoVN             = "Cannot Get Timesheet Info"
	MsgCannotFindTransactionsVN             = "Cannot Find Transactions"
	MsgTransactionFullySettledVN            = "Transaction Fully Settled"
	MsgCannotOpenFileForUploadVN            = "Cannot Open File For Upload"
	MsgCannotUploadFileVN                   = "Cannot Upload File"
	MsgTimesheetListNotEmptyVN              = "Timesheet List Not Empty"
	MsgReceiveAmountMustBePositiveVN        = "Receive Amount Must Be Positive"
	MsgReconciledFileNotFoundVN             = "Reconciled File Not Found"
	MsgInvalidAssetIDVN                     = "Invalid Asset ID"
	MsgCannotPublishSettlementEventVN       = "Cannot Publish Settlement Event"
	MsgCannotWriteFractionalLedgerVN        = "Cannot Write Fractional Ledger"
	MsgCannotPublishTimesheetMarkingEventVN = "Cannot Publish Timesheet Marking Event"

	// Reconciliation Business Errors
	MsgCanOnlyReconcileFromStatementEmailVN = "Can Only Reconcile From Statement Email"
	MsgStatementEmailNoTimesheetsVN         = "Statement Email No Timesheets"
	MsgStatementEmailNoFinancialDataVN      = "Statement Email No Financial Data"
	MsgStatementEmailNoAttachmentsVN        = "Statement Email No Attachments"
	MsgStatementEmailAlreadyReconciledVN    = "Statement Email Already Reconciled"

	// Payroll Business Errors
	MsgNoPayrollDataForPeriodVN = "No Payroll Data For Period"

	// Ledger reversal (POST /ledger/entries/:id/reverse). A reversal mirrors a
	// whole balanced block, so the messages name the group and the state that
	// makes a second reversal impossible.
	MsgReversalReasonRequiredVN       = "Reversal Reason Required"
	MsgCannotReverseAReversalVN       = "Cannot Reverse A Reversal"
	MsgEntryAlreadyReversedVN         = "Entry Already Reversed"
	MsgCannotReverseUnbalancedBlockVN = "Cannot Reverse Unbalanced Block: %d %d"
	MsgLedgerReversedBlockVN          = "Ledger Reversed Block: %d"
	MsgInvalidAssignmentDataVN        = "Invalid Assignment Data"
	MsgForMonthRequiredVN             = "For Month Required"
	MsgForMonthInvalidFormatVN        = "For Month Invalid Format"
	MsgFromDateRequiredForWeeklyVN    = "From Date Required For Weekly"
	MsgFromDateInvalidFormatVN2       = "From Date Invalid Format"
	MsgToDateInvalidFormatVN2         = "To Date Invalid Format"
	MsgFromDateAfterToDateVN2         = "From Date After To Date"
	MsgFromDateAfterToDateVN3         = "From Date After To Date"
	MsgFromDateInvalidVN              = "From Date Invalid"
	MsgToDateInvalidVN                = "To Date Invalid"

	// Timesheet Edit Request
	MsgEditRequestAlreadyPendingVN   = "Edit Request Already Pending"
	MsgCanOnlyCancelOwnEditRequestVN = "Can Only Cancel Own Edit Request"

	// Request Validation
	MsgLimitCannotExceed1000VN    = "Limit Cannot Exceed"
	MsgInvalidSortFieldVN         = "Invalid Sort Field"
	MsgSortOrderMustBeAscOrDescVN = "Sort Order Must Be Asc Or Desc"
)
