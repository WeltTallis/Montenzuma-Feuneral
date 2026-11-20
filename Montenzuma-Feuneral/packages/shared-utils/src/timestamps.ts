/**
 * @file packages/shared-utils/src/timestamps.ts
 * CENTRALIZED: All services MUST use this for timestamps
 * Persists timestamps in UTC; Nairobi time is reserved for display formatting.
 * All DB timestamp fields should be nullable; values set here at application level
 */

import { DateTime } from 'luxon';

const DEFAULT_TZ = 'Africa/Nairobi';

/**
 * Get current UTC time as SQL-friendly ISO string (YYYY-MM-DD HH:mm:ss)
 * This is the ONE source of truth for all timestamps across all services
 */
export function getKenyaTimeISO(): string {
  try {
    const luxonTime = DateTime.utc().toFormat('yyyy-LL-dd HH:mm:ss');

    if (luxonTime) return luxonTime;
  } catch (err) {
    console.error('⚠️ Luxon failed in getKenyaTimeISO:', (err as Error).message);
  }

  // Native fallback
  try {
    const date = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);

    return fmt.replace(',', '');
  } catch (err) {
    console.error('⚠️ Native TZ fallback failed:', (err as Error).message);
  }

  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Get current Kenya time as a formatted string
 */
export function getKenyaTimeFormatted(format: string = 'dd-LLL-yyyy HH:mm:ss'): string {
  try {
    return DateTime.now().setZone(DEFAULT_TZ).toFormat(format);
  } catch {
    const iso = getKenyaTimeISO();
    return iso.replace(/-/g, '/');
  }
}

/**
 * Get current Kenya time as a Luxon DateTime object
 */
export function getKenyaDateTime(): DateTime {
  return DateTime.now().setZone(DEFAULT_TZ);
}

/**
 * Get current Kenya timestamp in milliseconds
 */
export function getKenyaTimeMs(): number {
  return DateTime.now().setZone(DEFAULT_TZ).toMillis();
}

/**
 * Format a Date or ISO string to Kenya timezone
 */
export function toKenyaTime(input: Date | string, format: string = 'yyyy-LL-dd HH:mm:ss'): string {
  try {
    const dt = typeof input === 'string' ? DateTime.fromISO(input) : DateTime.fromJSDate(input);
    return dt.setZone(DEFAULT_TZ).toFormat(format);
  } catch {
    return getKenyaTimeISO();
  }
}

/**
 * Get current date portion only (YYYY-MM-DD)
 */
export function getKenyaDate(): string {
  return DateTime.now().setZone(DEFAULT_TZ).toFormat('yyyy-LL-dd');
}

export default {
  getKenyaTimeISO,
  getKenyaTimeFormatted,
  getKenyaDateTime,
  getKenyaTimeMs,
  toKenyaTime,
  getKenyaDate,
};
