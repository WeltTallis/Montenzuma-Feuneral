package handler

import (
    "bytes"
    "encoding/json"
    "errors"
    "fmt"
    "net/http"
    "os"
    "strconv"
    "strings"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-mpesa-integration/interfacex"
    "github.com/go-mpesa-integration/internals/model"
    "github.com/go-mpesa-integration/internals/services"
    "github.com/sirupsen/logrus"
    "gorm.io/gorm"
)

type MpesaHandler struct {
    mpesaService services.MpesaService
}

func NewMpesaHandler(mpesaService services.MpesaService) *MpesaHandler {
    return &MpesaHandler{
        mpesaService: mpesaService,
    }
}

func (h *MpesaHandler) InitiateSTKPush(c *gin.Context) {
    var request interfacex.STKPushRequest
    if err := c.ShouldBindJSON(&request); err != nil {
        logrus.Errorf("error binding request: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    response, err := h.mpesaService.STKPush(c.Request.Context(), &request)
    if err != nil {
        logrus.Errorf("error initiating STK push: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, response)
}

func (h *MpesaHandler) PaymentStatus(c *gin.Context) {
    checkoutRequestID := strings.TrimSpace(c.Param("checkoutRequestID"))
    if checkoutRequestID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"status": "failed", "resultDescription": "A checkout request ID is required."})
        return
    }

    if _, err := h.mpesaService.GetSTKPushByCheckoutRequestID(c.Request.Context(), checkoutRequestID); err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"status": "failed", "resultDescription": "Payment request not found."})
        } else {
            logrus.Errorf("error looking up STK request: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"status": "pending", "resultDescription": "Could not check payment status."})
        }
        return
    }

    callback, err := h.mpesaService.GetCallbackRequestByCheckoutRequestID(c.Request.Context(), checkoutRequestID)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            c.JSON(http.StatusOK, gin.H{"status": "pending"})
            return
        }
        logrus.Errorf("error looking up payment status: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"status": "pending", "resultDescription": "Could not check payment status."})
        return
    }
    if callback == nil {
        c.JSON(http.StatusOK, gin.H{"status": "pending"})
        return
    }
    if callback.ResultCode == "0" {
        c.JSON(http.StatusOK, gin.H{
            "status": "paid",
            "resultDescription": "Payment received.",
            "receipt": callback.TransactionReference,
            "amount": callback.Amount,
            "phoneNumber": callback.PhoneNumber,
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "failed",
        "resultDescription": callback.ResultDesc,
        "resultCode": callback.ResultCode,
    })
}

func (h *MpesaHandler) STKCallback(c *gin.Context) {
    // Get query parameters from URL
    businessNumber := c.Query("businessnumber")
    orderID := c.Query("reference")

    logrus.Infof("Callback received - BusinessNumber: %s, OrderID: %s", businessNumber, orderID)

    var callbackResponse map[string]interface{}
    if err := c.ShouldBindJSON(&callbackResponse); err != nil {
        logrus.Errorf("Error binding request: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    body, ok := callbackResponse["Body"].(map[string]interface{})
    if !ok {
        logrus.Error("Invalid callback body format")
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid callback body format"})
        return
    }

    stkCallback, ok := body["stkCallback"].(map[string]interface{})
    if !ok {
        logrus.Error("Invalid stkCallback format")
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stkCallback format"})
        return
    }

    merchantRequestID, _ := stkCallback["MerchantRequestID"].(string)
    checkoutRequestID, _ := stkCallback["CheckoutRequestID"].(string)
    
    // Safaricom sends ResultCode as a number (float64 in Go). 
    // We safely convert it to a clean string without decimals.
    var resultCode string
    if rc, ok := stkCallback["ResultCode"].(float64); ok {
        resultCode = fmt.Sprintf("%d", int(rc))
    } else {
        resultCode = fmt.Sprint(stkCallback["ResultCode"])
    }

    resultDesc, _ := stkCallback["ResultDesc"].(string)

    var amount, mpesaReceiptNumber, transactionDate, phoneNumber string

    // Helper to prevent "<nil>" from being saved as a string
    getString := func(v interface{}) string {
        if v == nil {
            return ""
        }
        return fmt.Sprintf("%v", v)
    }

    callbackMetadata, ok := stkCallback["CallbackMetadata"].(map[string]interface{})
    if ok {
        items, _ := callbackMetadata["Item"].([]interface{})
        for _, item := range items {
            itemMap, _ := item.(map[string]interface{})
            name, _ := itemMap["Name"].(string)
            value := itemMap["Value"]
            switch name {
            case "Amount":
                amount = getString(value)
            case "MpesaReceiptNumber":
                mpesaReceiptNumber = getString(value)
            case "TransactionDate":
                transactionDate = getString(value)
            case "PhoneNumber":
                if number, ok := value.(float64); ok {
                    phoneNumber = fmt.Sprintf("%.0f", number)
                } else {
                    phoneNumber = getString(value)
                }
            }
        }
    }

    // save the callback data to the database
    callbackRequest := &model.CallbackRequest{
        MerchantRequestID:    merchantRequestID,
        CheckoutRequestID:    checkoutRequestID,
        ResultCode:           resultCode,
        ResultDesc:           resultDesc,
        Amount:               amount,
        TransactionDate:      transactionDate,
        PhoneNumber:          phoneNumber,
        OrderID:              orderID,
        BusinessID:           businessNumber,
        CallbackString:       fmt.Sprintf("%v", stkCallback),
        TransactionReference: mpesaReceiptNumber,
    }

    h.mpesaService.SaveCallbackRequest(callbackRequest)

    // Forward the normalized result to insurance so contribution statuses are
    // updated after Safaricom confirms the STK request. Map the raw ResultDesc
    // to the same friendly reason shown to the payer, so the insurance copy
    // matches even if its own mapper is behind.
    friendly := resultDesc
    switch resultCode {
    case "0":
        friendly = "Payment received."
    case "1":
        friendly = "Insufficient M-Pesa balance. Please top up and try again."
    case "1032":
        friendly = "You cancelled the M-Pesa request. Start a new payment when ready."
    case "1038":
        friendly = "The M-Pesa prompt expired before approval. Please try again."
    case "1025", "2001":
        friendly = "Wrong M-Pesa PIN or account locked. Check your PIN and try again."
    case "1019":
        friendly = "A payment request is already in progress for this phone. Wait a minute, then try again."
    case "2029":
        friendly = "Payment could not be routed. Please contact support and quote your payment reference."
    default:
        if friendly == "" {
            friendly = "The M-Pesa request was not completed. Please try again."
        }
    }
    if target := os.Getenv("INSURANCE_CALLBACK_URL"); target != "" {
        forward, _ := json.Marshal(map[string]string{
            "reference":           orderID,
            "ResultCode":          resultCode,
            "ResultDesc":          friendly,
            "MpesaReceiptNumber":  mpesaReceiptNumber,
        })
        
        req, err := http.NewRequest(http.MethodPost, target, bytes.NewReader(forward))
        if err == nil {
            req.Header.Set("Content-Type", "application/json")
            if secret := os.Getenv("INSURANCE_CALLBACK_SECRET"); secret != "" {
                req.Header.Set("X-Mpesa-Callback-Secret", secret)
            }
            client := &http.Client{Timeout: 5 * time.Second}
            if res, callErr := client.Do(req); callErr != nil {
                logrus.Errorf("insurance callback forwarding failed: %v", callErr)
            } else {
                res.Body.Close()
            }
        } else {
            logrus.Errorf("invalid insurance callback request: %v", err)
        }
    }

    if resultCode == "0" {
        target := os.Getenv("DECEASED_PAYMENT_CALLBACK_URL")
        tenantSlug := c.Query("tenantSlug")
        deceasedID := c.Query("deceasedId")
        admissionNumber := c.Query("admissionNumber")
        payerName := c.Query("payerName")
        secret := os.Getenv("DECEASED_PAYMENT_CALLBACK_SECRET")
        if secret == "" {
            secret = os.Getenv("JWT_SECRET")
        }
        initiated, lookupErr := h.mpesaService.GetSTKPushByCheckoutRequestID(c.Request.Context(), checkoutRequestID)
        requestedAmount := ""
        if initiated != nil {
            requestedAmount = initiated.Amount
        }
        amountRequested, requestedAmountErr := strconv.ParseFloat(requestedAmount, 64)
        amountReceived, receivedAmountErr := strconv.ParseFloat(amount, 64)
        validInitiatedPayment := lookupErr == nil && initiated != nil &&
            initiated.TenantSlug == tenantSlug &&
            initiated.DeceasedID == deceasedID &&
            initiated.AdmissionNumber == admissionNumber &&
            initiated.AccountReference == orderID &&
            initiated.PhoneNumber == phoneNumber &&
            requestedAmountErr == nil && receivedAmountErr == nil && amountRequested == amountReceived
        if !validInitiatedPayment {
            logrus.Warnf("deceased payment callback did not match an initiated STK request: CheckoutRequestID=%s lookupError=%v", checkoutRequestID, lookupErr)
        }
        if target != "" && tenantSlug != "" && deceasedID != "" && admissionNumber != "" && secret != "" && validInitiatedPayment {
            forward, marshalErr := json.Marshal(map[string]string{
                "tenantSlug":       tenantSlug,
                "deceasedId":       deceasedID,
                "admissionNumber":  admissionNumber,
                "payerName":        payerName,
                "reference":        orderID,
                "checkoutRequestId": checkoutRequestID,
                "amount":           amount,
                "phoneNumber":      phoneNumber,
                "receiptNumber":    mpesaReceiptNumber,
                "transactionDate":  transactionDate,
            })
            if marshalErr != nil {
                logrus.Errorf("deceased payment callback marshal failed: %v", marshalErr)
            } else {
                req, reqErr := http.NewRequest(http.MethodPost, target, bytes.NewReader(forward))
                if reqErr != nil {
                    logrus.Errorf("invalid deceased payment callback URL: %v", reqErr)
                } else {
                    req.Header.Set("Content-Type", "application/json")
                    req.Header.Set("X-Mpesa-Payment-Secret", secret)
                    client := &http.Client{Timeout: 5 * time.Second}
                    if res, callErr := client.Do(req); callErr != nil {
                        logrus.Errorf("deceased payment callback forwarding failed: %v", callErr)
                    } else {
                        res.Body.Close()
                        if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
                            logrus.Errorf("deceased payment callback returned HTTP %d", res.StatusCode)
                        }
                    }
                }
            }
        } else {
            logrus.Warn("deceased payment callback skipped: callback URL, secret, metadata, or matching STK request is missing")
        }
    }

    if resultCode == "0" {
        logrus.Infof("STK Push successful. MerchantRequestID: %s, CheckoutRequestID: %s, Amount: %s, MpesaReceiptNumber: %s, TransactionDate: %s, PhoneNumber: %s, OrderID: %s, BusinessNumber: %s",
            merchantRequestID, checkoutRequestID, amount, mpesaReceiptNumber, transactionDate, phoneNumber, orderID, businessNumber)
    } else {
        // Failure
        logrus.Errorf("STK Push failed. MerchantRequestID: %s, CheckoutRequestID: %s, ResultCode: %s, ResultDesc: %s",
            merchantRequestID, checkoutRequestID, resultCode, resultDesc)
    }

    // Safaricom expects an HTTP 200 OK and a JSON response with ResultCode 0 for ALL callbacks.
    c.JSON(http.StatusOK, gin.H{
        "ResultCode": 0,
        "ResultDesc": "Accepted",
    })
}