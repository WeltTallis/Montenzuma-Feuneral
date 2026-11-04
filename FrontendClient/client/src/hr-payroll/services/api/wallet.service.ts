import { apiClient } from './client';
import type {
  WalletBalance,
  WalletTopup,
  WalletTopupListResponse,
  WalletPayment,
  WalletPaymentListResponse,
  WalletPaymentFilter,
  UnifiedTransaction,
  UnifiedTransactionListResponse,
  UnifiedTransactionFilter,
} from '../../types/api/wallet.types';

const WALLET_BASE_PATH = '/wallet';

export const walletService = {
  // ── Balance ──────────────────────────────────────────────────────────────
  async getBalance(): Promise<WalletBalance> {
    const r = await apiClient.get<WalletBalance>(`${WALLET_BASE_PATH}/balance`);
    return r.data!;
  },

  // ── Historical top-ups ──────────────────────────────────────────────────
  async getTopupById(id: number): Promise<WalletTopup> {
    const r = await apiClient.get<WalletTopup>(`${WALLET_BASE_PATH}/topups/${id}`);
    return r.data!;
  },

  async listTopups(params?: {
    bank_ref?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<WalletTopupListResponse> {
    const r = await apiClient.get<WalletTopup[]>(`${WALLET_BASE_PATH}/topups`, { params });
    return {
      data: r.data ?? [],
      total: r.pagination?.totalRecords ?? 0,
      page: r.pagination?.page ?? 1,
      page_size: r.pagination?.pageSize ?? 20,
    };
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  async getPaymentById(id: number): Promise<WalletPayment> {
    const r = await apiClient.get<WalletPayment>(`${WALLET_BASE_PATH}/payments/${id}`);
    return r.data!;
  },

  async listPayments(filter?: WalletPaymentFilter): Promise<WalletPaymentListResponse> {
    const r = await apiClient.get<WalletPayment[]>(`${WALLET_BASE_PATH}/payments`, { params: filter });
    return {
      data: r.data ?? [],
      total: r.pagination?.totalRecords ?? 0,
      page: r.pagination?.page ?? 1,
      page_size: r.pagination?.pageSize ?? 20,
    };
  },

  // ── Unified transactions ────────────────────────────────────────────────
  async getTransactions(
    params?: UnifiedTransactionFilter,
  ): Promise<UnifiedTransactionListResponse> {
    const r = await apiClient.get<UnifiedTransaction[]>(`${WALLET_BASE_PATH}/transactions`, {
      params,
    });
    return {
      data: r.data ?? [],
      total: r.pagination?.totalRecords ?? 0,
      page: r.pagination?.page ?? params?.page ?? 1,
      page_size: r.pagination?.pageSize ?? params?.page_size ?? 20,
    };
  },

};
