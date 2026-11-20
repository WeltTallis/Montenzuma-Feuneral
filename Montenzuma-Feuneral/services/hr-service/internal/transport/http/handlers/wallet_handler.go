package handlers

import (
	"strconv"
	"time"

	"api-server/internal/domain/wallet"
	"api-server/internal/transport/http/response"

	"github.com/gin-gonic/gin"
)

type WalletHandler struct {
	service wallet.WalletService
}

func NewWalletHandler(service wallet.WalletService) *WalletHandler {
	return &WalletHandler{service: service}
}

func (h *WalletHandler) GetBalance(c *gin.Context) {
	balance, err := h.service.GetBalance(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}
	response.Success(c, balance, "Wallet balance retrieved")
}

func (h *WalletHandler) GetTransactions(c *gin.Context) {
	filter := wallet.TransactionFilter{
		Type:     c.Query("type"),
		Status:   c.Query("status"),
		Search:   c.Query("search"),
		Page:     1,
		PageSize: 50,
	}

	if page, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && page > 0 {
		filter.Page = page
	}
	if pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "50")); err == nil && pageSize > 0 {
		filter.PageSize = pageSize
	}

	fromDate := c.Query("from")
	if fromDate != "" {
		filter.FromDate = &fromDate
	}
	toDate := c.Query("to")
	if toDate != "" {
		filter.ToDate = &toDate
	}

	items, total, err := h.service.GetTransactions(c.Request.Context(), filter)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	totalPages := int(total) / filter.PageSize
	if int(total)%filter.PageSize > 0 {
		totalPages++
	}

	response.SuccessWithPagination(c, items, "Lấy danh sách giao dịch thành công", response.Pagination{
		Page:         filter.Page,
		PageSize:     filter.PageSize,
		TotalPages:   totalPages,
		TotalRecords: int(total),
	})
}

func (h *WalletHandler) GetTopupByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "ID không hợp lệ")
		return
	}

	topup, err := h.service.GetTopupByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Không tìm thấy bản ghi nạp tiền")
		return
	}

	response.Success(c, toWalletTopupResponse(topup), "Top-up record retrieved")
}

func (h *WalletHandler) ListTopups(c *gin.Context) {
	filter := wallet.WalletTopupFilter{
		BankRef:  c.Query("bank_ref"),
		Page:     1,
		PageSize: 20,
	}

	if page, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && page > 0 {
		filter.Page = page
	}
	if pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20")); err == nil && pageSize > 0 {
		filter.PageSize = pageSize
	}

	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			filter.StartDate = &t
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			filter.EndDate = &t
		}
	}

	topups, total, err := h.service.ListTopups(c.Request.Context(), filter)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	totalPages := int(total) / filter.PageSize
	if int(total)%filter.PageSize > 0 {
		totalPages++
	}

	response.SuccessWithPagination(c, toWalletTopupResponses(topups), "Top-up records retrieved", response.Pagination{
		Page:         filter.Page,
		PageSize:     filter.PageSize,
		TotalPages:   totalPages,
		TotalRecords: int(total),
	})
}

func (h *WalletHandler) GetPaymentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "ID không hợp lệ")
		return
	}

	payment, err := h.service.GetPaymentByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Không tìm thấy giao dịch")
		return
	}

	response.Success(c, toWalletPaymentResponse(payment), "Payment record retrieved")
}

func (h *WalletHandler) ListPayments(c *gin.Context) {
	filter := wallet.WalletPaymentFilter{
		TxnID:            c.Query("txn_id"),
		RequestID:        c.Query("request_id"),
		InvoiceNo:        c.Query("invoice_no"),
		Status:           c.Query("status"),
		ErrorCode:        c.Query("error_code"),
		RecipientName:    c.Query("recipient_name"),
		RecipientAccount: c.Query("recipient_account"),
		RecipientBank:    c.Query("recipient_bank"),
		Page:             1,
		PageSize:         20,
	}

	if page, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && page > 0 {
		filter.Page = page
	}
	if pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20")); err == nil && pageSize > 0 {
		filter.PageSize = pageSize
	}

	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			filter.StartDate = &t
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			filter.EndDate = &t
		}
	}

	payments, total, err := h.service.ListPayments(c.Request.Context(), filter)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	totalPages := int(total) / filter.PageSize
	if int(total)%filter.PageSize > 0 {
		totalPages++
	}

	response.SuccessWithPagination(c, toWalletPaymentResponses(payments), "Payment records retrieved", response.Pagination{
		Page:         filter.Page,
		PageSize:     filter.PageSize,
		TotalPages:   totalPages,
		TotalRecords: int(total),
	})
}

func toWalletTopupResponse(t *wallet.WalletTopup) *wallet.WalletTopupResponse {
	return &wallet.WalletTopupResponse{
		ID:         t.ID,
		Amount:     t.Amount,
		BankRef:    t.BankRef,
		OccurredAt: t.OccurredAt.Format(time.RFC3339),
		Note:       t.Note,
		CreatedBy:  t.CreatedBy,
		CreatedAt:  t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  t.UpdatedAt.Format(time.RFC3339),
	}
}

func toWalletTopupResponses(topups []*wallet.WalletTopup) []*wallet.WalletTopupResponse {
	responses := make([]*wallet.WalletTopupResponse, len(topups))
	for i, t := range topups {
		responses[i] = toWalletTopupResponse(t)
	}
	return responses
}

func toWalletPaymentResponse(p *wallet.WalletPayment) *wallet.WalletPaymentResponse {
	settledAt := (*string)(nil)
	if p.SettledAt != nil {
		timeStr := p.SettledAt.Format(time.RFC3339)
		settledAt = &timeStr
	}

	return &wallet.WalletPaymentResponse{
		ID:                 p.ID,
		TxnID:              p.TxnID,
		RequestID:          p.RequestID,
		InvoiceNo:          p.InvoiceNo,
		RequestedAmount:    p.RequestedAmount,
		Fee:                p.Fee,
		RecipientName:      p.RecipientName,
		RecipientAccountNo: p.RecipientAccountNo,
		RecipientBank:      p.RecipientBank,
		Description:        p.Description,
		Status:             p.Status,
		ErrorCode:          p.ErrorCode,
		ErrorMessage:       p.ErrorMessage,
		EntityID:           p.EntityID,
		CreatedBy:          p.CreatedBy,
		Version:            p.Version,
		CreatedAt:          p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          p.UpdatedAt.Format(time.RFC3339),
		SettledAt:          settledAt,
	}
}

func toWalletPaymentResponses(payments []*wallet.WalletPayment) []*wallet.WalletPaymentResponse {
	responses := make([]*wallet.WalletPaymentResponse, len(payments))
	for i, p := range payments {
		responses[i] = toWalletPaymentResponse(p)
	}
	return responses
}
