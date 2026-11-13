package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-mpesa-integration/cmd/server"
	"github.com/go-mpesa-integration/internals/handler"
)

func RegisterMpesaRoutes(server server.GinServer, mpesaHandler *handler.MpesaHandler) {
	server.RegisterRoute("GET", "/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "service": "mpesa-service"})
	})
	server.RegisterRoute("POST", "/api/v1/stkpush", mpesaHandler.InitiateSTKPush)
	server.RegisterRoute("POST", "/api/v1/stkcallback", mpesaHandler.STKCallback)
	server.RegisterRoute("GET", "/api/v1/payment-status/:checkoutRequestID", mpesaHandler.PaymentStatus)
}

