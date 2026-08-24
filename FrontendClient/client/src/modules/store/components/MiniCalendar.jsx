import React, { useState, useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { dateKey, monthName, formatTime } from '../seed';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const ACTION_COLOR = { used: '#dc2626', restocked: '#16a34a', adjusted: '#64748b' };

export default function MiniCalendar() {
  const { transactions } = useStoreContext();
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return [d.getFullYear(), d.getMonth()];
  });
  const [sel, setSel] = useState(null);

  const [year, month] = ym;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevDays = new Date(year, month, 0).getDate();

  const activity = useMemo(() => {
    const counts = {};
    const colors = {};
    transactions.forEach((t) => {
      const k = dateKey(t.date);
      counts[k] = (counts[k] || 0) + 1;
      const col = ACTION_COLOR[t.action] || '#0f766e';
      if (!colors[k]) colors[k] = [];
      if (!colors[k].includes(col)) colors[k].push(col);
    });
    return { counts, colors };
  }, [transactions]);

  const cells = useMemo(() => {
    const arr = [];
    for (let i = firstDay - 1; i >= 0; i--) arr.push({ outside: true, label: prevDays - i });
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({ day: d, key: k, active: !!activity.counts[k], selected: k === sel, today: k === dateKey(new Date()) });
    }
    while (arr.length % 7) arr.push({ outside: true, label: '' });
    return arr;
  }, [year, month, firstDay, daysInMonth, prevDays, activity, sel]);

  const changeMonth = (dir) => {
    const nm = month + dir;
    if (nm < 0) setYm([year - 1, 11]);
    else if (nm > 11) setYm([year + 1, 0]);
    else setYm([year, nm]);
  };

  const dayTx = sel ? transactions.filter((t) => dateKey(t.date) === sel) : [];

  return (
    <Card className="panel mb-3">
      <Card.Body className="p-3">
        <div className="cal-head">
          <span className="cal-title">{monthName(year, month)}</span>
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button type="button" className="cal-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
        <div className="cal-grid mb-1">
          {WEEKDAYS.map((w) => <div key={w} className="cal-dow">{w}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) => (
            <button
              key={i}
              type="button"
              disabled={c.outside}
              className={`cal-day${c.today && !c.selected ? ' today' : ''}${c.selected ? ' selected' : ''}`}
              onClick={() => !c.outside && c.key && setSel(c.key === sel ? null : c.key)}
              title={c.active ? `${activity.counts[c.key]} event${activity.counts[c.key] > 1 ? 's' : ''}` : undefined}
            >
              <span>{c.day ?? c.label}</span>
              {c.active && (
                <span className="cal-dots">
                  {(activity.colors[c.key] || []).slice(0, 3).map((col, j) => (
                    <span key={j} className="cal-dot" style={{ background: c.selected ? 'rgba(255,255,255,.85)' : col }} />
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card.Body>
      {sel && (
        <Card.Footer className="bg-light py-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-semibold">Day's activity</small>
            <small className="text-muted">{sel}</small>
          </div>
          {dayTx.length === 0 ? (
            <small className="text-muted">No activity on this day</small>
          ) : (
            dayTx.map((tx) => (
              <div key={tx.id} className="small py-1 border-bottom">
                <span className="fw-medium">{tx.itemName}</span> •{' '}
                <span className={tx.action === 'used' ? 'text-danger' : 'text-success'}>
                  {tx.action === 'used' ? '-' : '+'}
                  {tx.quantity} {tx.unit}
                </span>{' '}
                <span className="text-muted">({tx.staff})</span>
                <div className="text-muted">{formatTime(tx.date)}</div>
              </div>
            ))
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
