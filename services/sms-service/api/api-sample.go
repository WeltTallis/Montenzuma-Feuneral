package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	africastalking "github.com/tech-kenya/africastalkingsms"
)

type Handler struct {
	Client *africastalking.SMSClient
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Tenant-Slug")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load("../.env")
	}
	apiKey := os.Getenv("atApiKey")
	if apiKey == "" {
		apiKey = os.Getenv("AFRICANS_TALKING_API_KEY")
	}
	username := os.Getenv("atUserName")
	if username == "" {
		username = "sandbox"
	}
	atShortCode := os.Getenv("atShortCode")
	sandbox := os.Getenv("sandbox")
	if sandbox == "" {
		sandbox = os.Getenv("sandboxEnv")
	}
	if sandbox == "" {
		sandbox = "true"
	}

	client, err := africastalking.NewSMSClient(apiKey, username, atShortCode, sandbox)
	if err != nil {
		log.Printf("Warning: failed to initialize Africa's Talking client (%v), running in mock fallback mode", err)
	}

	handler := Handler{Client: client}

	r := gin.Default()
	r.Use(corsMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "sms-service", "sandbox": sandbox})
	})
	r.POST("/send-sms", handler.sendSMS)
	r.POST("/send-monthly-reminders", handler.sendMonthlyReminders)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("SMS service running on port %s", port)
	r.Run(":" + port)
}

type SMSRequestBody struct {
	Recipient string `json:"recipient"`
	Phone     string `json:"phone"`
	Message   string `json:"message" binding:"required"`
}

func (h *Handler) sendSMS(c *gin.Context) {
	var reqBody SMSRequestBody
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body", "details": err.Error(),
		})
		return
	}
	targetPhone := strings.TrimSpace(reqBody.Recipient)
	if targetPhone == "" {
		targetPhone = strings.TrimSpace(reqBody.Phone)
	}
	if targetPhone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "recipient or phone number is required"})
		return
	}

	if h.Client == nil {
		log.Printf("[MOCK SMS] To: %s | Message: %s", targetPhone, reqBody.Message)
		c.JSON(http.StatusOK, gin.H{
			"status":  "simulated",
			"message": "SMS simulated (no Africa's Talking credentials provided)",
			"number":  targetPhone,
		})
		return
	}

	resp, err := h.Client.SendSMS(targetPhone, reqBody.Message)
	if err != nil {
		log.Printf("[SMS ERROR] Failed to send to %s: %v", targetPhone, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send SMS", "details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp.SMSMessageData)
}

type ReminderItem struct {
	Phone        string  `json:"phone"`
	FullName     string  `json:"fullName"`
	PolicyNumber string  `json:"policyNumber"`
	PaymentLink  string  `json:"paymentLink"`
	Premium      float64 `json:"premium"`
	CustomText   string  `json:"customText"`
}

func (h *Handler) sendMonthlyReminders(c *gin.Context) {
	type batchRequest struct {
		Reminders []ReminderItem `json:"reminders" binding:"required"`
	}
	var req batchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch request body", "details": err.Error()})
		return
	}

	results := make([]gin.H, 0, len(req.Reminders))
	sentCount := 0

	for _, item := range req.Reminders {
		phone := strings.TrimSpace(item.Phone)
		if phone == "" {
			continue
		}
		msg := item.CustomText
		if msg == "" {
			msg = fmt.Sprintf("Montenzuma Monalisa Funeral Home: Dear %s, your monthly Amani Cover premium of KES %.0f for policy %s is due. Pay securely via M-Pesa: %s. Call (020) 2346928 for help.",
				item.FullName, item.Premium, item.PolicyNumber, item.PaymentLink)
		}

		if h.Client == nil {
			log.Printf("[MOCK MONTHLY REMINDER] To %s: %s", phone, msg)
			results = append(results, gin.H{"phone": phone, "status": "simulated", "message": msg})
			sentCount++
			continue
		}

		resp, err := h.Client.SendSMS(phone, msg)
		if err != nil {
			results = append(results, gin.H{"phone": phone, "status": "error", "error": err.Error()})
		} else {
			results = append(results, gin.H{"phone": phone, "status": "sent", "data": resp.SMSMessageData})
			sentCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"sentCount": sentCount,
		"total":     len(req.Reminders),
		"results":   results,
	})
}
