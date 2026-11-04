package services

import (
	"api-server/internal/pkg/clock"
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
	"api-server/internal/domain/wallet"
)

type walletService struct {
	topupRepo   wallet.WalletTopupRepository
	paymentRepo wallet.WalletPaymentRepository
}

func NewWalletService(
	topupRepo wallet.WalletTopupRepository,
	paymentRepo wallet.WalletPaymentRepository,
) wallet.WalletService {
	return &walletService{
		topupRepo:   topupRepo,
		paymentRepo: paymentRepo,
	}
}

func (s *walletService) GetBalance(ctx context.Context) (*wallet.WalletBalance, error) {
	topupTotal, err := s.topupRepo.Sum(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get topup total: %w", err)
	}

	completedPayments, err := s.paymentRepo.SumByStatuses(ctx, []string{"completed"})
	if err != nil {
		return nil, fmt.Errorf("failed to get completed payments total: %w", err)
	}

	pendingPayments, err := s.paymentRepo.SumByStatuses(ctx, []string{"pending", "authorised"})
	if err != nil {
		return nil, fmt.Errorf("failed to get pending payments total: %w", err)
	}

	// Historical failed payments remain visible without affecting the balance.
	unreconciledFailed, err := s.paymentRepo.SumUnreconciledByStatuses(ctx, []string{"failed"})
	if err != nil {
		return nil, fmt.Errorf("failed to get unreconciled failed payments total: %w", err)
	}

	// Include pending payments in the historical balance calculation so the
	// original ledger semantics remain stable for archived records.
	return &wallet.WalletBalance{
		Available:  topupTotal - completedPayments - pendingPayments,
		PendingIn:  0, // topups are confirmed on insert
		PendingOut: pendingPayments,
		Limbo:      unreconciledFailed,
		Currency:   "VND",
		AsOf:       clock.Now().Format(time.RFC3339),
	}, nil
}

func (s *walletService) GetTransactions(ctx context.Context, filter wallet.TransactionFilter) ([]*wallet.UnifiedTransaction, int64, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 50
	}

	var all []*wallet.UnifiedTransaction

	// Fetch topups (unless filtered to payments only, or status excludes completed)
	if (filter.Type == "" || filter.Type == "topup") && (filter.Status == "" || filter.Status == "completed") {
		topupFilter := wallet.WalletTopupFilter{
			StartDate: parseTimePtr(filter.FromDate),
			EndDate:   parseTimePtr(filter.ToDate),
			Page:      1,
			PageSize:  1000, // fetch enough to merge
		}
		topups, _, err := s.topupRepo.List(ctx, topupFilter)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to list topups: %w", err)
		}
		for _, t := range topups {
			note := ""
			if t.Note != nil {
				note = *t.Note
			}
			all = append(all, &wallet.UnifiedTransaction{
				ID:         t.ID,
				Type:       "topup",
				Amount:     t.Amount,
				Status:     "completed",
				OccurredAt: t.OccurredAt.Format(time.RFC3339),
				Reference:  t.BankRef,
				Note:       note,
			})
		}
	}

	// Fetch payments (unless filtered to topups only)
	if filter.Type == "" || filter.Type == "payment" {
		paymentFilter := wallet.WalletPaymentFilter{
			Status:    filter.Status,
			StartDate: parseTimePtr(filter.FromDate),
			EndDate:   parseTimePtr(filter.ToDate),
			Page:      1,
			PageSize:  1000,
		}
		payments, _, err := s.paymentRepo.List(ctx, paymentFilter)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to list payments: %w", err)
		}
		for _, p := range payments {
			desc := ""
			if p.Description != nil {
				desc = *p.Description
			}
			all = append(all, &wallet.UnifiedTransaction{
				ID:           p.ID,
				Type:         "payment",
				Amount:       -p.RequestedAmount,
				Status:       p.Status,
				OccurredAt:   p.CreatedAt.Format(time.RFC3339),
				Reference:    p.RequestID,
				Counterparty: fmt.Sprintf("%s — %s %s", p.RecipientName, p.RecipientBank, p.RecipientAccountNo),
				Note:         desc,
			})
		}
	}

	// Search across counterparty, reference, and note (case-insensitive).
	// Applied after the merge so both topups and payments are covered, and
	// before the in-memory sort/paginate.
	if filter.Search != "" {
		q := strings.ToLower(strings.TrimSpace(filter.Search))
		if q != "" {
			filtered := make([]*wallet.UnifiedTransaction, 0, len(all))
			for _, tx := range all {
				hay := strings.ToLower(tx.Counterparty + " " + tx.Reference + " " + tx.Note)
				if strings.Contains(hay, q) {
					filtered = append(filtered, tx)
				}
			}
			all = filtered
		}
	}

	// Sort by occurred_at descending
	sort.Slice(all, func(i, j int) bool {
		return all[i].OccurredAt > all[j].OccurredAt
	})

	// Paginate
	total := int64(len(all))
	start := (filter.Page - 1) * filter.PageSize
	if start >= len(all) {
		return []*wallet.UnifiedTransaction{}, total, nil
	}
	end := min(start+filter.PageSize, len(all))

	return all[start:end], total, nil
}

func (s *walletService) GetTopupByID(ctx context.Context, id uint64) (*wallet.WalletTopup, error) {
	return s.topupRepo.GetByID(ctx, id)
}

func (s *walletService) ListTopups(ctx context.Context, filter wallet.WalletTopupFilter) ([]*wallet.WalletTopup, int64, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	return s.topupRepo.List(ctx, filter)
}

func (s *walletService) GetPaymentByID(ctx context.Context, id uint64) (*wallet.WalletPayment, error) {
	return s.paymentRepo.GetByID(ctx, id)
}

func (s *walletService) ListPayments(ctx context.Context, filter wallet.WalletPaymentFilter) ([]*wallet.WalletPayment, int64, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	return s.paymentRepo.List(ctx, filter)
}

func parseTimePtr(s *string) *time.Time {
	if s == nil || *s == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil
	}
	return &t
}
