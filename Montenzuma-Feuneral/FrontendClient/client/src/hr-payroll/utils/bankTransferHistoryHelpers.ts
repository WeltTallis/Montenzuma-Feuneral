export const BANK_TRANSFER_CYCLE_LABELS = {
  1: 'Period 1 · days 1–7',
  2: 'Period 2 · days 8–14',
  3: 'Period 3 · days 15–21',
  4: 'Period 4 · days 22–end of month',
} as const;

const bankTransferDateFormatter = new Intl.DateTimeFormat('en-KE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Africa/Nairobi',
});

const bankTransferTimeFormatter = new Intl.DateTimeFormat('en-KE', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Africa/Nairobi',
});

export function getCurrentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatBankTransferDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatBankTransferPeriod(fromDate: string, toDate: string): string {
  const [fromYear, fromMonth, fromDay] = fromDate.split('-');
  const [toYear, toMonth, toDay] = toDate.split('-');

  if (fromYear === toYear && fromMonth === toMonth) {
    return `${fromDay}–${toDay}/${toMonth}/${toYear}`;
  }

  return `${formatBankTransferDate(fromDate)}–${formatBankTransferDate(toDate)}`;
}

export function formatBankTransferDateTime(value?: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return `${bankTransferDateFormatter.format(date)} · ${bankTransferTimeFormatter.format(date)}`;
}

export function formatBankTransferTime(value?: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return bankTransferTimeFormatter.format(date);
}
