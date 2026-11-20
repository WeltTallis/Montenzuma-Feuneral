/**
 * Shared leave theming — SAME palette the leave screens already use.
 * No new colors are introduced; per-type colors are drawn from the
 * existing COLORS object (navy primary + status colors).
 */
export const COLORS = {
    primary: '#0A2463',
    primaryLight: '#1A3A7A',
    white: '#FFFFFF',
    bg: '#F5F7FA',
    border: '#E8ECF0',
    text: '#1A1D24',
    textSecondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#E74C3C',
    info: '#3B82F6',
};

export const LEAVE_TYPES = [
    'annual',
    'sick',
    'maternity',
    'paternity',
    'compassionate',
    'study',
    'unpaid',
];

export const leaveTypeLabel = (type) => ({
    annual: 'Annual',
    sick: 'Sick',
    maternity: 'Maternity',
    paternity: 'Paternity',
    compassionate: 'Compassionate',
    study: 'Study',
    unpaid: 'Unpaid',
}[type] || type);

/** Per-type chip color (light background + strong text + dot) */
export const typeStyle = (type) => {
    const map = {
        annual: { fg: COLORS.success, bg: 'rgba(16, 185, 129, 0.10)' },
        sick: { fg: COLORS.danger, bg: 'rgba(231, 76, 60, 0.10)' },
        maternity: { fg: COLORS.info, bg: 'rgba(59, 130, 246, 0.10)' },
        paternity: { fg: COLORS.info, bg: 'rgba(59, 130, 246, 0.10)' },
        compassionate: { fg: COLORS.warning, bg: 'rgba(245, 158, 11, 0.12)' },
        study: { fg: COLORS.primary, bg: 'rgba(10, 36, 99, 0.08)' },
        unpaid: { fg: COLORS.textSecondary, bg: 'rgba(107, 114, 128, 0.12)' },
    };
    return map[type] || map.unpaid;
};

export const statusLabel = (status) => ({
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
}[status] || status);

export const statusStyle = (status) => {
    const map = {
        pending: { fg: COLORS.warning, bg: 'rgba(245, 158, 11, 0.12)' },
        approved: { fg: COLORS.success, bg: 'rgba(16, 185, 129, 0.10)' },
        rejected: { fg: COLORS.danger, bg: 'rgba(231, 76, 60, 0.10)' },
        cancelled: { fg: COLORS.textSecondary, bg: 'rgba(107, 114, 128, 0.12)' },
    };
    return map[status] || map.cancelled;
};

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const toDateStr = (date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

export const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Business days between two date strings (inclusive, weekends excluded) */
export const countBusinessDays = (start, end) => {
    let count = 0;
    const d = new Date(start);
    const endD = new Date(end);
    while (d <= endD) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) count += 1;
        d.setDate(d.getDate() + 1);
    }
    return count;
};