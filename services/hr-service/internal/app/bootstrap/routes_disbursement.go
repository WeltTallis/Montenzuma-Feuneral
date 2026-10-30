package bootstrap

import "github.com/gin-gonic/gin"

func setupPayrollRoutes(protected *gin.RouterGroup, container *Container) {
	payrolls := protected.Group("/payrolls")
	{
		payrolls.GET("/bulk-transfer-template", container.Handlers.Payroll.GetPayrollTemplate)
		payrolls.POST("/export-bulk-transfer", container.Handlers.Payroll.ExportBulkTransfer)
		payrolls.POST("/simulate-settlement", container.Handlers.Payroll.SimulateSettlement)
		payrolls.POST("/bulk-transfer-external-mark", container.Handlers.Payroll.MarkExternallyPaid)
		payrolls.POST("/bulk-transfer-result", container.Handlers.Payroll.ImportBulkTransferResult)
		payrolls.POST("/bulk-transfer-result/kq", container.Handlers.Payroll.GenerateBulkTransferKQ)
		payrolls.GET("/pending-uploads", container.Handlers.Payroll.GetPendingUploads)
		payrolls.GET("/bulk-transfer-upload-histories", container.Handlers.Payroll.GetBulkTransferUploadHistories)
		payrolls.GET("/bulk-transfer-upload-histories/:id", container.Handlers.Payroll.GetBulkTransferUploadHistoryByID)
		payrolls.GET("/bulk-transfer-upload-histories/:id/download", container.Handlers.Payroll.DownloadBulkTransferHistoryFile)
		payrolls.GET("/histories", container.Handlers.Payroll.GetPayrollHistories)
		payrolls.GET("/bank-transfer-histories", container.Handlers.Payroll.GetBankTransferHistories)
		payrolls.POST("/histories/export", container.Handlers.Payroll.ExportPayrollHistories)
	}
}
