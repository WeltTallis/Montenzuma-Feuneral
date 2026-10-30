/**
 * Convert a 5-field cron expression to a human-readable English string.
 * Covers the common patterns used in payroll cron jobs.
 */
export function cronToEnglish(expr: string): string {
  if (!expr) return expr;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [min, hour, dom, month, dow] = parts;

  // Every minute
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }

  // Every hour at :MM
  if (hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `Every hour at :${min}`;
  }

  // Specific time, every day
  if (dom === '*' && month === '*' && dow === '*') {
    return `Daily at ${fmtTime(hour, min)}`;
  }

  // Specific day of week
  if (dow !== '*' && dom === '*' && month === '*') {
    const dayName = dayOfWeekName(dow);
    return `Every ${dayName} at ${fmtTime(hour, min)}`;
  }

  // Specific day of month
  if (dom !== '*' && month === '*' && dow === '*') {
    return `Monthly on day ${dom} at ${fmtTime(hour, min)}`;
  }

  // Fallback
  return expr;
}

function fmtTime(hour: string, min: string): string {
  const h = hour === '*' ? 'every hour' : `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  return h;
}

function dayOfWeekName(dow: string): string {
  const names: Record<string, string> = {
    '0': 'Sunday', '7': 'Sunday',
    '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
  };
  if (names[dow]) return names[dow];
  // Handle comma-separated: "1,3,5"
  return dow.split(',').map(d => names[d] || d).join(', ');
}
