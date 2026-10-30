import type { Employee } from '@hr/types/api/employee.types';

type BankInformationWarningInput = Pick<
  Employee,
  | 'bank'
  | 'bank_account_number'
  | 'bank_account_name'
  | 'bank_account_status'
  | 'bank_account_invalid_reason'
>;

const GENERIC_INVALID_REASON = 'The bank account details are invalid';
const UNSAFE_REASON_PATTERN =
  /\b(?:onepay|9pay|provider|error|invalid|account|timeout|failed|internal)\b|[_{}[\]]/iu;

const RECOGNIZED_INVALID_REASONS = [
  /^Số tài khoản không hợp lệ$/iu,
  /^Tên chủ tài khoản không khớp$/iu,
  /^Tên chủ tài khoản không khớp với ngân hàng(?:\s*\(ngân hàng ghi:\s*[^)]+\))?$/iu,
  /^Không có mã SWIFT của ngân hàng, không thể kiểm tra$/iu,
];

function getConfirmedInvalidReason(reason?: string | null): string {
  const normalizedReason = reason?.trim();
  if (!normalizedReason || UNSAFE_REASON_PATTERN.test(normalizedReason)) {
    return GENERIC_INVALID_REASON;
  }

  if (!RECOGNIZED_INVALID_REASONS.some((pattern) => pattern.test(normalizedReason))) {
    return GENERIC_INVALID_REASON;
  }
  if (/^Số tài khoản không hợp lệ$/iu.test(normalizedReason)) {
    return 'Invalid bank account number';
  }
  if (/^Tên chủ tài khoản không khớp(?: với ngân hàng)?/iu.test(normalizedReason)) {
    return 'Bank account name does not match the bank records';
  }
  return 'The bank does not provide a SWIFT code, so the account could not be verified';
}

export function getBankInformationWarningReason(
  employee: BankInformationWarningInput,
): string {
  if (!employee.bank) return 'Bank name is missing';
  if (!employee.bank_account_number?.trim()) return 'Bank account number is missing';
  if (!employee.bank_account_name?.trim()) return 'Bank account holder name is missing';

  if (employee.bank_account_status === 'invalid') {
    return getConfirmedInvalidReason(employee.bank_account_invalid_reason);
  }

  return GENERIC_INVALID_REASON;
}

/**
 * Classifies why an employee appears in the missing-bank-details warning
 * list: a bank check confirmed the stored info is wrong ('invalid') vs the
 * info is simply incomplete ('missing'). Mirrors the backend SQL predicate in
 * buildMissingBankDetailsBaseQuery, where an 'invalid' status is listed
 * unconditionally while missing fields also require pending work.
 */
export function getBankInformationWarningKind(
  employee: BankInformationWarningInput,
): 'invalid' | 'missing' {
  return employee.bank_account_status === 'invalid' ? 'invalid' : 'missing';
}
