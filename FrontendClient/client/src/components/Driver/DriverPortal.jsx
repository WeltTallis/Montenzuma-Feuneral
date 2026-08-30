import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Car, RefreshCw, CheckCircle, Phone, LogOut, Calendar, Clock, 
    AlertCircle, Truck, Loader2, Zap, Navigation, ArrowRight, Route, 
    Sun, Moon, CloudSun, User, Shield, Timer, CalendarDays, MapPin 
} from '../../utils/icons/icons';
import { useSocket } from '../../utils/context/socketContext';
import env from '../../utils/config/env';

const API_BASE_URL = env.FULL_API_URL;

const getTenantSlug = () =>
    localStorage.getItem('tenantSlug') || sessionStorage.getItem('tenantSlug') || '';

const getUser = () => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : {}; }
    catch { return {}; }
};

const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

const fmtDateShort = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

const genId = (id) => `BK-${String(id).padStart(4, '0')}`;

const getAuthHeaders = () => {
    const slug = getTenantSlug();
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = { 'x-tenant-slug': slug };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

function getNairobiNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
}

function relativeDate(dateStr) {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = getNairobiNow();

    const tStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = tStart - nStart;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = target.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const fullDate = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (diffDays === 0) return { label: 'Today', sub: timeStr, urgency: 'now', full: fullDate, color: '#10B981' };
    if (diffDays === 1) return { label: 'Tomorrow', sub: timeStr, urgency: 'soon', full: fullDate, color: '#3B82F6' };
    if (diffDays > 1 && diffDays <= 4) return { label: `In ${diffDays} days`, sub: fullDate + ' · ' + timeStr, urgency: 'upcoming', full: fullDate, color: '#8B5CF6' };
    if (diffDays > 4) return { label: fullDate, sub: timeStr, urgency: 'later', full: fullDate, color: '#64748B' };
    if (diffDays === -1) return { label: 'Yesterday', sub: timeStr, urgency: 'past', full: fullDate, color: '#64748B' };
    if (diffDays < -1) return { label: `${Math.abs(diffDays)} days ago`, sub: fullDate, urgency: 'past', full: fullDate, color: '#475569' };
    
    return { label: fullDate, sub: timeStr, urgency: 'later', full: fullDate, color: '#64748B' };
}

function getTripDate(b) {
    return b.scheduled_date || b.pickup_date || b.booking_date || b.date || b.created_at || null;
}

const useGreeting = () => {
    const [now, setNow] = useState(() => getNairobiNow());
    useEffect(() => {
        const i = setInterval(() => setNow(getNairobiNow()), 20000);
        return () => clearInterval(i);
    }, []);

    const h = now.getHours();
    let text, icon, sub;
    if (h >= 5 && h < 12) { text = 'Good Morning'; icon = Sun; sub = 'Ready for a safe drive today'; }
    else if (h >= 12 && h < 17) { text = 'Good Afternoon'; icon = CloudSun; sub = 'Keep the momentum going'; }
    else if (h >= 17 && h < 20) { text = 'Good Evening'; icon = Moon; sub = 'Wrapping up the day'; }
    else if (h >= 20 && h < 23) { text = 'Good Evening'; icon = Moon; sub: 'Safe travels home'; }
    else { text = 'Working Late'; icon = Moon; sub = 'Take care on the road'; }

    return {
        text, icon, sub,
        timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        dateStr: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        dayNum: now.getDate(),
        monthShort: now.toLocaleDateString('en-US', { month: 'short' }),
    };
};

/* ─── DESIGN SYSTEM (Dark Command Center) ───────────────────────────────── */
const T = {
    bg: '#08090A',
    surface: '#111315',
    surface2: '#18191C',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    text: '#F8FAFC',
    textDim: '#94A3B8',
    textMute: '#64748B',
    primary: '#6366F1',     // Indigo
    success: '#10B981',     // Emerald
    warning: '#F59E0B',     // Amber
    danger: '#EF4444',       // Red
    info: '#3B82F6',        // Blue
    glow: 'rgba(99, 102, 241, 0.3)',
    successGlow: 'rgba(16, 185, 129, 0.3)',
};

const STATUS = {
    booked: { label: 'Booked', color: T.warning, bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    in_transit: { label: 'In Transit', color: T.info, bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
    completed: { label: 'Completed', color: T.success, bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
    cancelled: { label: 'Cancelled', color: T.danger, bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    postponed: { label: 'Postponed', color: T.primary, bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)' },
};

const LEAVE = {
    approved: { color: T.success, label: 'Approved', bg: 'rgba(16, 185, 129, 0.1)' },
    rejected: { color: T.danger, label: 'Rejected', bg: 'rgba(239, 68, 68, 0.1)' },
    pending: { color: T.warning, label: 'Pending', bg: 'rgba(245, 158, 11, 0.1)' },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

@keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; }
.anim-up { animation: slideUp .5s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
.anim-spin { animation: spin 0.8s linear infinite; }
.anim-pulse-glow { animation: pulseGlow 2s infinite; }
.anim-ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
.anim-press { transition: transform 0.15s ease, background 0.2s ease; }
.anim-press:active { transform: scale(0.97); }

input, select, textarea, button { font-family: 'Inter', sans-serif; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${T.borderStrong}; border-radius: 2px; }

.glass-header {
    background: rgba(8, 9, 10, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid ${T.border};
}
.route-line {
    background: linear-gradient(to bottom, ${T.info} 0%, ${T.primary} 50%, ${T.success} 100%);
}
`;

/* ─── UI COMPONENTS ─────────────────────────────────────────────────────── */

const Toast = ({ type, message, onClose }) => {
    if (!message) return null;
    const err = type === 'error';
    const c = err ? T.danger : T.success;
    const Icon = err ? AlertCircle : CheckCircle;
    useEffect(() => { const t = setTimeout(() => onClose?.(), 3200); return () => clearTimeout(t); }, [message, onClose]);
    return (
        <div className="anim-up" style={{
            position: 'fixed', top: 20, left: 20, right: 20, zIndex: 9999,
            padding: '16px 20px', borderRadius: 16, background: T.surface,
            border: `1px solid ${c}30`, color: T.text, fontSize: '.9rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${c}20`,
            maxWidth: 420, margin: '0 auto',
        }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${c}20`, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={2.5} />
            </div>
            <span style={{ flex: 1 }}>{message}</span>
        </div>
    );
};

const Plate = ({ number, model }) => {
    if (!number) return null;
    const n = number.replace(/\s+/g, '').toUpperCase();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
                background: '#0F172A', border: '1px solid #334155',
                borderRadius: 6, padding: '4px 10px', position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '.75rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '.12em', textAlign: 'center', minWidth: 48 }}>{n}</div>
            </div>
            {model && <span style={{ fontSize: '.55rem', color: T.textMute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{model}</span>}
        </div>
    );
};

const Pill = ({ status }) => {
    const s = STATUS[status] || { label: status || '?', color: T.textMute, bg: 'rgba(255,255,255,0.05)', border: T.border };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.color, fontSize: '.65rem', fontWeight: 600,
            letterSpacing: '.05em', textTransform: 'uppercase',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%', background: s.color,
                boxShadow: `0 0 8px ${s.color}`,
                className: status === 'in_transit' ? 'anim-pulse-glow' : undefined,
            }} />
            {s.label}
        </span>
    );
};

const StatCard = ({ value, label, color, icon: Icon, pulse }) => (
    <div style={{
        flex: 1, padding: '18px 12px', textAlign: 'center',
        background: T.surface, borderRadius: 16,
        border: `1px solid ${T.border}`,
        position: 'relative', overflow: 'hidden'
    }}>
        <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${color}15`, border: `1px solid ${color}25`,
            color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', position: 'relative',
        }}>
            <Icon size={18} strokeWidth={2} />
            {pulse && (
                <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: color, border: `2px solid ${T.surface}`,
                }} />
            )}
        </div>
        <div style={{
            fontSize: '1.75rem', fontWeight: 700, color: T.text,
            lineHeight: 1, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif",
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em',
        }}>{value}</div>
        <div style={{ fontSize: '.6rem', color: T.textMute, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
    </div>
);

const DateBadge = ({ booking }) => {
    const dateStr = getTripDate(booking);
    const rel = relativeDate(dateStr);
    if (!rel) return null;

    const isUrgent = rel.urgency === 'now';
    const isSoon = rel.urgency === 'soon';
    const isPast = rel.urgency === 'past';

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: isUrgent ? `${T.success}08` : isSoon ? `${T.info}06` : T.surface2,
            borderRadius: 12,
            border: `1px solid ${isUrgent ? T.success + '30' : isSoon ? T.info + '30' : T.border}`,
            marginBottom: 16,
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isUrgent ? `${T.success}15` : isSoon ? `${T.info}15` : `${T.textMute}10`,
                border: `1px solid ${isUrgent ? T.success + '30' : isSoon ? T.info + '30' : T.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {dateStr && (
                    <>
                        <span style={{ fontSize: '.5rem', fontWeight: 700, color: rel.color, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '.05em' }}>
                            {new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: rel.color, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {new Date(dateStr).getDate()}
                        </span>
                    </>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: T.text, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {isUrgent && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, boxShadow: `0 0 10px ${T.success}` }} />}
                    {rel.label}
                </div>
                <div style={{ fontSize: '.7rem', color: T.textMute, fontWeight: 500 }}>{rel.sub}</div>
            </div>
            {isUrgent && (
                <div style={{ padding: '5px 10px', borderRadius: 8, background: `${T.success}15`, border: `1px solid ${T.success}30`, color: T.success, fontSize: '.55rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Timer size={10} /> Due
                </div>
            )}
            {isSoon && (
                <div style={{ padding: '5px 10px', borderRadius: 8, background: `${T.info}15`, border: `1px solid ${T.info}30`, color: T.info, fontSize: '.55rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={10} /> Soon
                </div>
            )}
            {isPast && (
                <div style={{ padding: '5px 10px', borderRadius: 8, background: `${T.textMute}10`, border: `1px solid ${T.border}`, color: T.textMute, fontSize: '.55rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    Past
                </div>
            )}
        </div>
    );
};

const TripCard = ({ booking, onStatusChange, i }) => {
    const b = booking;
    const sc = STATUS[b.status] || {};
    const accent = sc.color || T.primary;

    return (
        <div className="anim-up" style={{
            background: T.surface, borderRadius: 20,
            marginBottom: 16, overflow: 'hidden',
            border: `1px solid ${T.border}`,
            animationDelay: `${(i || 0) * .05}s`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            <div style={{ padding: '20px 18px' }}>

                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}15`, border: `1px solid ${accent}25`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Truck size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <div style={{ color: T.text, fontSize: '.9rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-.01em' }}>{genId(b.booking_id)}</div>
                            <div style={{ fontSize: '.65rem', color: T.textMute, marginTop: 2, fontWeight: 500 }}>
                                Created {fmtDateShort(b.created_at)} at {fmtTime(b.created_at)}
                            </div>
                        </div>
                    </div>
                    <Pill status={b.status} />
                </div>

                <DateBadge booking={b} />

                {/* Client Info */}
                <div style={{
                    marginBottom: 16, padding: '14px 16px',
                    background: T.surface2, borderRadius: 14,
                    border: `1px solid ${T.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.6rem', color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Client</div>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: T.text, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{b.client_name}</div>
                        {b.client_phone && (
                            <div style={{ fontSize: '.75rem', color: T.textDim, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                <Phone size={11} style={{ color: T.textMute }} /> {b.client_phone}
                            </div>
                        )}
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${accent}10`, border: `1px solid ${accent}20`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
                        <User size={16} />
                    </div>
                </div>

                {/* Route Timeline */}
                <div style={{ marginBottom: 16, padding: '16px', background: T.surface2, borderRadius: 14, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${T.danger}20`, border: `2px solid ${T.danger}`, boxShadow: `0 0 8px ${T.danger}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.danger }} />
                            </div>
                            <div className="route-line" style={{ width: 2, flex: 1, minHeight: 40, margin: '4px 0' }} />
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${T.success}20`, border: `2px solid ${T.success}`, boxShadow: `0 0 8px ${T.success}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.success }} />
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: '.6rem', color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Pickup</div>
                                <div style={{ fontSize: '.85rem', color: T.text, fontWeight: 500, lineHeight: 1.3 }}>{b.from_location || b.destination || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '.6rem', color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Destination</div>
                                <div style={{ fontSize: '.85rem', color: T.text, fontWeight: 500, lineHeight: 1.3 }}>{b.destination || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: 1, background: T.border, margin: '14px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}20`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Car size={15} />
                            </div>
                            <div>
                                <div style={{ fontSize: '.55rem', color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Vehicle</div>
                                <div style={{ fontSize: '.8rem', color: T.text, fontWeight: 600, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{b.vehicle_name || b.model || 'Assigned'}</div>
                            </div>
                        </div>
                        <Plate number={b.plate_number || b.number_plate} model={b.model} />
                    </div>
                </div>

                {/* Actions */}
                {b.status === 'booked' && (
                    <button onClick={() => onStatusChange(b.booking_id, 'in_transit')} className="anim-press" style={{
                        width: '100%', padding: '16px', border: 'none', borderRadius: 14, cursor: 'pointer',
                        background: `linear-gradient(135deg, ${T.primary}, #4F46E5)`,
                        color: '#FFFFFF', fontWeight: 700, fontSize: '.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: `0 4px 20px ${T.glow}`, transition: 'all .2s', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-.01em'
                    }}>
                        <Zap size={18} strokeWidth={2.5} /> Accept Trip
                        <ArrowRight size={15} style={{ opacity: .8 }} />
                    </button>
                )}
                {b.status === 'in_transit' && (
                    <button onClick={() => onStatusChange(b.booking_id, 'completed')} className="anim-press" style={{
                        width: '100%', padding: '16px', border: 'none', borderRadius: 14, cursor: 'pointer',
                        background: `linear-gradient(135deg, ${T.success}, #059669)`,
                        color: '#FFFFFF', fontWeight: 700, fontSize: '.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: `0 4px 20px ${T.successGlow}`, transition: 'all .2s', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-.01em'
                    }}>
                        <CheckCircle size={18} strokeWidth={2.5} /> Complete Trip
                    </button>
                )}
            </div>
        </div>
    );
};

const LeaveCard = ({ leave }) => {
    const s = (leave.status || 'pending').toLowerCase();
    const c = LEAVE[s] || LEAVE.pending;

    const startDate = leave.start_date ? new Date(leave.start_date) : null;
    const endDate = leave.end_date ? new Date(leave.end_date) : null;
    const relStart = relativeDate(leave.start_date);

    const daysCount = startDate && endDate ? Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : null;

    return (
        <div style={{
            background: T.surface, borderRadius: 16, padding: '16px 18px',
            marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: `1px solid ${T.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, border: `1px solid ${c.color}30`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} />
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: T.text, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{leave.leave_type || 'Leave'}</div>
                    <div style={{ fontSize: '.7rem', color: T.textMute, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                        <Clock size={11} />
                        {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        {' — '}
                        {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        {daysCount && daysCount > 0 && (
                            <span style={{ padding: '2px 7px', borderRadius: 6, background: c.bg, color: c.color, fontSize: '.6rem', fontWeight: 700, marginLeft: 4 }}>{daysCount}d</span>
                        )}
                    </div>
                    {relStart && <div style={{ fontSize: '.65rem', color: relStart.color, fontWeight: 600, marginTop: 3 }}>{relStart.label}</div>}
                </div>
            </div>
            <span style={{ padding: '5px 12px', borderRadius: 8, background: c.bg, border: `1px solid ${c.color}30`, color: c.color, fontSize: '.6rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c.label}</span>
        </div>
    );
};

const Empty = ({ icon: Icon, title, sub }) => (
    <div style={{ textAlign: 'center', padding: '64px 28px', background: T.surface, borderRadius: 20, border: `1px dashed ${T.border}` }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: T.surface2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: T.textMute }}>
            <Icon size={26} />
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
        <div style={{ fontSize: '.8rem', color: T.textMute, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>{sub}</div>
    </div>
);

const Loading = ({ text }) => (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={22} className="anim-spin" style={{ color: T.primary }} />
        </div>
        <div style={{ fontSize: '.85rem', fontWeight: 600, color: T.textMute, fontFamily: "'Inter',sans-serif" }}>{text}</div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const DriverPortal = () => {
    const navigate = useNavigate();
    const { socket, connected } = useSocket();
    const [bookings, setBookings] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loadingB, setLoadingB] = useState(true);
    const [loadingL, setLoadingL] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tab, setTab] = useState('bookings');
    const [refreshing, setRefreshing] = useState(false);

    const slug = getTenantSlug();
    const user = getUser();
    const g = useGreeting();
    const GI = g.icon;

    const loadB = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoadingB(true);
        setError('');
        try {
            const r = await fetch(`${API_BASE_URL}/hearse-bookings?t=${Date.now()}`, { headers: getAuthHeaders() });
            const t = await r.text();
            try {
                const d = JSON.parse(t);
                if (d.status === 'success' || d.bookings) setBookings(d.bookings || []);
                else setError(d.message || 'Failed to load');
            } catch { setError('Invalid response'); }
        } catch (e) { setError(e.message || 'Network error'); }
        finally { setLoadingB(false); setRefreshing(false); }
    }, []);

    const loadL = useCallback(async () => {
        setLoadingL(true);
        try {
            const h = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const r = await fetch(`${API_BASE_URL}/leaves/my-leaves`, { headers: h });
            const d = await r.json();
            setLeaves(d?.leaves || d?.data || []);
        } catch { setLeaves([]); }
        finally { setLoadingL(false); }
    }, []);

    useEffect(() => {
        if (!slug || slug === 'default') { setError('No tenant configured.'); return; }
        loadB(); loadL();
    }, [slug, loadB, loadL]);

    useEffect(() => {
        if (!socket || !connected) return;
        const handleNewBooking = (data) => {
            if (data.booking) setBookings(prev => [data.booking, ...prev]);
            else loadB(true);
            setRefreshing(false);
        };
        const handleStatusUpdate = (data) => {
            if (data.booking_id && data.status) {
                setBookings(prev => prev.map(b => b.booking_id === data.booking_id ? { ...b, status: data.status, ...(data.booking || {}) } : b));
            } else loadB(true);
            setRefreshing(false);
        };
        socket.on('new_booking', handleNewBooking);
        socket.on('booking_status_updated', handleStatusUpdate);
        socket.on('booking_postponed', () => loadB(true));
        return () => {
            socket.off('new_booking', handleNewBooking);
            socket.off('booking_status_updated', handleStatusUpdate);
            socket.off('booking_postponed');
        };
    }, [loadB, socket, connected]);

    const changeStatus = async (id, s) => {
        try {
            const h = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const r = await fetch(`${API_BASE_URL}/hearse-bookings/${id}/status`, { method: 'PUT', headers: h, body: JSON.stringify({ status: s }) });
            if (!r.ok) throw new Error();
            setSuccess(`Trip ${STATUS[s]?.label || s}`);
            setTimeout(() => setSuccess(''), 3000);
            loadB(true);
        } catch { setError('Failed to update.'); setTimeout(() => setError(''), 3500); }
    };

    const logout = () => {
        localStorage.removeItem('authToken'); localStorage.removeItem('user');
        localStorage.removeItem('tenantSlug'); localStorage.removeItem('refreshToken');
        sessionStorage.clear(); navigate('/login');
    };

    const active = bookings.filter(b => !['completed', 'cancelled', 'postponed'].includes(b.status));
    const transit = bookings.filter(b => b.status === 'in_transit').length;
    const done = bookings.filter(b => b.status === 'completed').length;
    const first = user?.name ? user.name.split(' ')[0] : 'Driver';

    return (
        <div style={{
            minHeight: '100vh', background: T.bg,
            fontFamily: "'Inter',sans-serif", color: T.text,
            WebkitFontSmoothing: 'antialiased',
            backgroundImage: `radial-gradient(circle at 80% -20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)`
        }}>
            <style>{css}</style>
            <Toast type="error" message={error} onClose={() => setError('')} />
            <Toast type="success" message={success} onClose={() => setSuccess('')} />

            {/* ─── HEADER ─── */}
            <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, #4F46E5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${T.glow}` }}>
                            <Car size={18} color="#FFFFFF" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text, letterSpacing: '-.02em', fontFamily: "'Space Grotesk',sans-serif" }}>RestPoint</div>
                            <div style={{ fontSize: '.65rem', color: T.textMute, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>Driver Portal</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => loadB(true)} disabled={refreshing} className="anim-press" style={{
                            width: 40, height: 40, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`,
                            color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                            <RefreshCw size={16} className={refreshing ? 'anim-spin' : ''} />
                        </button>
                        <button onClick={logout} className="anim-press" style={{
                            padding: '0 16px', height: 40, borderRadius: 12, background: `${T.danger}10`,
                            border: `1px solid ${T.danger}20`, color: T.danger, fontSize: '.75rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                        }}>
                            <LogOut size={14} /><span>Exit</span>
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 18px 120px' }}>
                
                {/* ─── GREETING ─── */}
                <div className="anim-up" style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ padding: '6px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: T.primary, fontSize: '.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <GI size={12} />{g.text}
                        </div>
                        <div style={{ padding: '6px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: T.textDim, fontSize: '.7rem', fontWeight: 500 }}>
                            {g.timeStr}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.03em', color: T.text, marginBottom: 8, fontFamily: "'Space Grotesk',sans-serif" }}>{first}</h1>
                            <div style={{ fontSize: '.8rem', color: T.textDim, fontWeight: 500, marginBottom: 4 }}>{g.dateStr}</div>
                            <div style={{ fontSize: '.75rem', color: T.textMute, fontWeight: 500, fontStyle: 'italic' }}>{g.sub}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 14 }}>
                            <div style={{ width: 60, height: 60, borderRadius: 20, background: `linear-gradient(145deg, ${T.primary}, #4F46E5)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: `0 8px 24px ${T.glow}`, position: 'relative' }}>
                                <span style={{ fontSize: '.45rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .9, lineHeight: 1 }}>{g.monthShort}</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1, marginTop: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{g.dayNum}</span>
                            </div>
                        </div>
                    </div>

                    {active.length > 0 && (
                        <div style={{ marginTop: 20, padding: '14px 16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: T.warning, flexShrink: 0, boxShadow: `0 0 10px ${T.warning}` }} />
                            <span style={{ fontSize: '.8rem', color: T.text, fontWeight: 500 }}>
                                <strong>{active.length}</strong> trip{active.length !== 1 ? 's' : ''} waiting for you
                            </span>
                            <ArrowRight size={14} style={{ color: T.textMute, marginLeft: 'auto' }} />
                        </div>
                    )}
                </div>

                {/* ─── STATS ─── */}
                <div className="anim-up" style={{ display: 'flex', gap: 12, marginBottom: 28, animationDelay: '.06s' }}>
                    <StatCard value={active.length} label="Active" color={T.warning} icon={Zap} pulse={active.length > 0} />
                    <StatCard value={transit} label="En Route" color={T.info} icon={Navigation} />
                    <StatCard value={done} label="Done" color={T.success} icon={CheckCircle} />
                </div>

                {/* ─── TABS ─── */}
                <div className="anim-up" style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, animationDelay: '.09s' }}>
                    {[
                        { k: 'bookings', l: 'Trips', icon: Route, n: active.length, c: T.primary },
                        { k: 'leaves', l: 'Leaves', icon: Calendar, n: leaves.length, c: T.info },
                    ].map(t => {
                        const on = tab === t.k;
                        const Icon = t.icon;
                        return (
                            <button key={t.k} onClick={() => setTab(t.k)} className="anim-press" style={{
                                flex: 1, padding: '12px 8px', borderRadius: 11, background: on ? T.surface2 : 'transparent',
                                border: '1px solid transparent', color: on ? T.text : T.textMute,
                                fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'all .2s', fontFamily: "'Space Grotesk',sans-serif"
                            }}>
                                <Icon size={14} style={{ color: on ? t.c : undefined }} />
                                {t.l}
                                {t.n > 0 && <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: on ? `${t.c}20` : `${T.textMute}15`, color: on ? t.c : T.textMute }}>{t.n}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* ─── CONTENT ─── */}
                <div className="anim-up" style={{ animationDelay: '.12s' }}>
                    {tab === 'bookings' ? (
                        loadingB ? <Loading text="Loading trips..." /> :
                        active.length === 0 ? <Empty icon={Car} title="All Clear" sub="No active trips right now. You'll be notified when a new one is assigned." /> :
                        active.map((b, i) => <TripCard key={b.booking_id} booking={b} onStatusChange={changeStatus} i={i} />)
                    ) : (
                        loadingL ? <Loading text="Loading leaves..." /> :
                        leaves.length === 0 ? <Empty icon={Calendar} title="No Leaves" sub="No leave requests submitted yet." /> :
                        leaves.map((l, i) => <div key={l.id || i} className="anim-up" style={{ animationDelay: `${i * .04}s` }}><LeaveCard leave={l} /></div>)
                    )}
                </div>

                {/* ─── FOOTER ─── */}
                <div style={{ textAlign: 'center', padding: '40px 0 0', borderTop: `1px solid ${T.border}`, marginTop: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                        <Shield size={11} style={{ color: T.textMute }} />
                        <span style={{ fontSize: '.65rem', color: T.textMute, fontWeight: 600 }}>Secure · Encrypted</span>
                    </div>
                    <div style={{ fontSize: '.6rem', color: T.textMute, fontWeight: 500 }}>RestPoint v2.0 · {slug} · Nairobi</div>
                </div>
            </main>
        </div>
    );
};

export default DriverPortal;