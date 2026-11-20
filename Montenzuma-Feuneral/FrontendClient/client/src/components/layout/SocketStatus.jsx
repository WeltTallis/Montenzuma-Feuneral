import { useSocket } from '../../utils/context/socketContext';

/**
 * SocketStatus — floating connection-state pill for the Socket.IO connection.
 *
 * States:
 *   • connected   → green   "Live · realtime"
 *   • reconnecting→ amber   "Reconnecting…"
 *   • error       → red     "Realtime error" (+ last error message on hover)
 *   • disconnected→ grey    "Realtime offline"
 *

 */
const STYLES = {
    wrap: {
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '999px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
        opacity: 0.92,
        userSelect: 'none',
    },
    dot: (color) => ({
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
    }),
};

export default function SocketStatus() {
    const { connected, reconnecting, connectionError } = useSocket() || {};

    let label;
    let bg;
    let dotColor;
    if (connected) {
        label = 'Live · realtime';
        bg = '#16a34a';
        dotColor = '#dcfce7';
    } else if (reconnecting) {
        label = 'Reconnecting…';
        bg = '#d97706';
        dotColor = '#fef3c7';
    } else if (connectionError) {
        label = `Realtime error — ${connectionError}`;
        bg = '#dc2626';
        dotColor = '#fee2e2';
    } else {
        label = 'Realtime offline';
        bg = '#475569';
        dotColor = '#e2e8f0';
    }

    return (
        <div style={{ ...STYLES.wrap, background: bg }} title={connectionError || label} aria-live="polite">
            <span style={STYLES.dot(dotColor)} />
            <span>{label}</span>
        </div>
    );
}
