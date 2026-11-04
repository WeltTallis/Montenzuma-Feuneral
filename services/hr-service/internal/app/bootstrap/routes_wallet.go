package bootstrap

import (
	"github.com/gin-gonic/gin"
)

func setupWalletRoutes(v1 *gin.RouterGroup, container *Container) {
	if container == nil || container.Handlers == nil || container.Handlers.Wallet == nil {
		return
	}
	w := v1.Group("/wallet")
	w.Use(container.Middleware.Auth.Authenticate())
	if container.Middleware.Authorization != nil {
		w.Use(container.Middleware.Authorization.Authorize())
	}
	{
		w.GET("/balance", container.Handlers.Wallet.GetBalance)
		w.GET("/transactions", container.Handlers.Wallet.GetTransactions)

		w.GET("/topups", container.Handlers.Wallet.ListTopups)
		w.GET("/topups/:id", container.Handlers.Wallet.GetTopupByID)

		w.GET("/payments", container.Handlers.Wallet.ListPayments)
		w.GET("/payments/:id", container.Handlers.Wallet.GetPaymentByID)
	}
}
