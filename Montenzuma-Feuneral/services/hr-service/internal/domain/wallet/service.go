package wallet

import (
	"context"
)

// WalletService defines the interface for wallet business logic.
type WalletService interface {
	GetBalance(ctx context.Context) (*WalletBalance, error)
	GetTransactions(ctx context.Context, filter TransactionFilter) ([]*UnifiedTransaction, int64, error)
	GetTopupByID(ctx context.Context, id uint64) (*WalletTopup, error)
	ListTopups(ctx context.Context, filter WalletTopupFilter) ([]*WalletTopup, int64, error)
	GetPaymentByID(ctx context.Context, id uint64) (*WalletPayment, error)
	ListPayments(ctx context.Context, filter WalletPaymentFilter) ([]*WalletPayment, int64, error)
}
