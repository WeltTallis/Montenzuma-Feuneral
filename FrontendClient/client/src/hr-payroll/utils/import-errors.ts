import type { ImportError } from '@hr/types/api/timesheet.types';

const TECHNICAL_VALUE_PATTERN =
  /^(?:id\s+\d+)\b|\b(?:onepay|9pay|provider|error|failed|internal|timeout|employee_id)\b|[_{}[\]=]/iu;
const ISO_DATE_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/u;

export function getSafeImportErrorReason(reason: string): string {
  const normalized = reason.trim().toLocaleLowerCase('vi');

  if (
    normalized.includes('phê duyệt') ||
    normalized.includes('đã duyệt') ||
    normalized.includes('approved')
  ) {
    return 'This timesheet has already been approved.';
  }
  if (
    normalized.includes('trùng') ||
    normalized.includes('đã có') ||
    normalized.includes('tồn tại') ||
    normalized.includes('duplicate')
  ) {
    return 'This data already exists.';
  }
  if (normalized.includes('không tìm thấy') && normalized.includes('nhân viên')) {
    return 'Employee not found.';
  }
  if (normalized.includes('không thể tạo nhân viên')) {
    return 'Could not create the employee record.';
  }
  if (normalized.includes('không tìm thấy mức lương')) {
    return 'No matching pay rate is configured for this shift.';
  }
  // "ca làm \"OT400\" không có trong cấu hình lương…" / "vị trí … không có
  // trong cấu hình lương…": name the offending shift or position so the
  // partner can align the sheet name (or add the shift) in the payrate
  // config; without a safe name fall back to the payrate category hint.
  if (normalized.includes('cấu hình lương')) {
    const named = reason.match(
      /(ca làm|vị trí)\s+"([^"]{1,40})"\s+không có trong cấu hình lương/u,
    );
    if (named && !TECHNICAL_VALUE_PATTERN.test(named[2].trim())) {
      const noun = named[1];
      const label = named[2].trim();
      const englishNoun = noun === 'ca làm' ? 'Shift' : 'Position';
      return `${englishNoun} "${label}" is not included in this project's pay rates.`;
    }
    return 'No pay rates are configured for this project.';
  }
  if (normalized.includes('bảng lương') || normalized.includes('payrate')) {
    return 'No pay rates are configured for this project.';
  }
  if (
    normalized.includes('ngày trong tương lai') ||
    normalized.includes('ngày chấm công chưa đến')
  ) {
    return 'The attendance date is in the future.';
  }
  if (normalized.includes('thanh toán') || normalized.includes('paid')) {
    return 'This timesheet has already been paid.';
  }
  if (normalized.includes('không thể tạo bảng chấm công')) {
    return 'Could not create the timesheet.';
  }
  if (normalized.includes('thiếu')) {
    return 'Required data is missing.';
  }
  if (normalized.includes('không hợp lệ')) {
    return 'The data is invalid.';
  }
  // Operator-facing file-level guidance from the backend (e.g. every hour in
  // the file falls outside the chosen month): already clean Vietnamese that
  // names the data range and the fix — pass it through instead of masking it
  // behind a generic category label.
  if (normalized.includes('ngoài tháng')) {
    return 'The attendance dates fall outside the selected month.';
  }

  return 'Could not process this row.';
}

function getSafeEmployeeLabel(employee: unknown): string {
  if (typeof employee !== 'string') return '';
  const normalized = employee.trim();
  if (
    normalized.length > 120 ||
    TECHNICAL_VALUE_PATTERN.test(normalized)
  ) {
    return '';
  }
  return normalized;
}

/** Extract the first ISO date in a reason and format it as DD/MM/YYYY. */
function extractErrorDate(reason: string): string | undefined {
  const dateMatch = reason.match(ISO_DATE_PATTERN);
  if (!dateMatch) return undefined;
  return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
}

/**
 * Parse the JSON-encoded error_detail string from a PartnerImportFile.
 * Returns an empty array if the detail is missing, empty, or invalid JSON.
 * The reason is normalized to a stable per-category message (so identical
 * errors can be grouped); the affected date, when present in the raw reason,
 * is returned separately on `date`.
 */
export function parseImportErrors(detail?: string | null): ImportError[] {
  if (!detail) return [];
  try {
    const parsed: unknown = JSON.parse(detail);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): ImportError[] => {
      if (
        !value ||
        typeof value !== 'object' ||
        typeof (value as { reason?: unknown }).reason !== 'string'
      ) {
        return [];
      }
      const item = value as {
        row?: unknown;
        employee?: unknown;
        reason: string;
      };
      return [{
        row: typeof item.row === 'number' ? item.row : 0,
        employee: getSafeEmployeeLabel(item.employee),
        reason: getSafeImportErrorReason(item.reason),
        date: extractErrorDate(item.reason),
      }];
    });
  } catch {
    return [];
  }
}

export interface GroupedImportError {
  employee: string;
  reason: string;
  count: number;
  /** Unique affected dates (DD/MM/YYYY), in first-seen order. */
  dates: string[];
  /** Unique row numbers, in first-seen order (0 excluded). */
  rows: number[];
}

/**
 * Collapse parsed errors into one group per (employee, reason) pair so the UI
 * renders the reason once instead of one identical line per row.
 */
export function groupImportErrors(errors: ImportError[]): GroupedImportError[] {
  const groups = new Map<string, GroupedImportError>();
  for (const error of errors) {
    const key = `${error.employee}${error.reason}`;
    const group = groups.get(key) ?? {
      employee: error.employee,
      reason: error.reason,
      count: 0,
      dates: [],
      rows: [],
    };
    group.count += 1;
    if (error.date && !group.dates.includes(error.date)) {
      group.dates.push(error.date);
    }
    if (error.row > 0 && !group.rows.includes(error.row)) {
      group.rows.push(error.row);
    }
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

const DETAIL_LIST_CAP = 5;

/**
 * Build the context suffix for a grouped error, e.g. " (dates 25/06/2026, 26/06/2026)".
 * Lists are capped; the row count carries the scale once the list is truncated.
 */
export function describeGroupedError(group: GroupedImportError): string {
  const parts: string[] = [];
  if (group.dates.length > 0) {
    const truncated = group.dates.length > DETAIL_LIST_CAP;
    const shown = group.dates.slice(0, DETAIL_LIST_CAP).join(', ');
    parts.push(
      `${group.dates.length === 1 ? 'date' : 'dates'} ${shown}${truncated ? '…' : ''}`,
    );
  } else if (group.rows.length > 0) {
    const truncated = group.rows.length > DETAIL_LIST_CAP;
    const shown = group.rows.slice(0, DETAIL_LIST_CAP).join(', ');
    parts.push(
      `${group.rows.length === 1 ? 'row' : 'rows'} ${shown}${truncated ? '…' : ''}`,
    );
  }
  if (
    group.count > 1 &&
    (group.dates.length > DETAIL_LIST_CAP ||
      (group.dates.length === 0 && group.rows.length === 0))
  ) {
    parts.push(`${group.count} rows`);
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}
