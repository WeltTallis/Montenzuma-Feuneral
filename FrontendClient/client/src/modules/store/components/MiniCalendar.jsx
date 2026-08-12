import React, { useState, useMemo } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { dateKey, monthName, formatTime } from '../seed';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
    const m = {};
    transactions.forEach((t) => {
      const k = dateKey(t.date);
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [transactions]);

  const cells = useMemo(() => {
    const arr = [];
    for (let i = firstDay - 1; i >= 0; i--) arr.push({ outside: true, label: prevDays - i });
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({ day: d, key: k, active: !!activity[k], selected: k === sel, today: k === dateKey(new Date()) });
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
        <div className="d-flex align-items-center justify-content-between mb-2">
          <Button variant="outline-secondary" size="sm" onClick={() => changeMonth(-1)}>
            <i className="fa-solid fa-chevron-left" />
          </Button>
          <h6 className="mb-0 fw-bold">{monthName(year, month)}</h6>
          <Button variant="outline-secondary" size="sm" onClick={() => changeMonth(1)}>
            <i className="fa-solid fa-chevron-right" />
          </Button>
        </div>
        <div className="row g-1 small text-uppercase text-muted mb-1" style={{ letterSpacing: '.03em' }}>
          {WEEKDAYS.map((w) => <div key={w} className="col text-center">{w}</div>)}
        </div>
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((c, i) => (
            <button
              key={i}
              type="button"
              disabled={c.outside}
              className={`btn btn-sm cal-day ${c.outside ? 'text-muted' : ''} ${c.today && !c.selected ? 'border border-primary' : ''} ${c.selected ? 'bg-primary text-white' : 'btn-light'} ${c.active && !c.selected ? 'fw-bold' : ''}`}
              style={{
                width: 32,
                height: 32,
                color: c.active && !c.selected && !c.outside ? 'var(--k-primary-dark)' : undefined,
              }}
              onClick={() => !c.outside && c.key && setSel(c.key === sel ? null : c.key)}
              title={c.active ? `${activity[c.key]} events` : undefined}
            >
              {c.day ?? c.label}
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
