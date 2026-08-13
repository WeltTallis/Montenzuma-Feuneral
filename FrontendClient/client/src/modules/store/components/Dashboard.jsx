import React from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import MiniCalendar from './MiniCalendar';
import {
  actionBadge, formatDate, formatTime, todayKey, dateKey, getStatus,
} from '../seed';

function StockGauge({ pct = 0, color = '#ffffff', size = 56 }) {
  const r = 25;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="stock-gauge">
      <circle cx="32" cy="32" r={r} fill="rgba(255,255,255,.18)" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p / 100)}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="13">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

export default function DashboardView() {
  const { stats, items, transactions } = useStoreContext();

  const usedToday = transactions.filter(
    (t) => dateKey(t.date) === todayKey() && t.action === 'used'
  ).length;
  const lowItems = items.filter((i) => getStatus(i) !== 'ok').sort((a, b) => a.stock - b.stock);
  const recent = [...transactions].slice(0, 12);

  const total = Math.max(1, stats.total);
  const pctOf = (n) => Math.max(0, Math.min(100, Math.round((Number(n) / total) * 100)));
  const cards = [
    {
      label: 'Total Items', value: stats.total, icon: 'fa-solid fa-cubes',
      pct: 100, bg: 'linear-gradient(135deg, #1a5f7a, #2c8ac9)',
    },
    {
      label: 'In Stock', value: stats.inStock, icon: 'fa-solid fa-check',
      pct: pctOf(stats.inStock), bg: 'linear-gradient(135deg, #059669, #34d399)',
    },
    {
      label: 'Low Stock', value: stats.lowStock, icon: 'fa-solid fa-triangle-exclamation',
      pct: pctOf(stats.lowStock), bg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    },
    {
      label: 'Out of Stock', value: stats.outOfStock, icon: 'fa-solid fa-xmark',
      pct: pctOf(stats.outOfStock), bg: 'linear-gradient(135deg, #dc2626, #f87171)',
    },
    {
      label: 'Picked Today', value: usedToday, icon: 'fa-solid fa-arrow-trend-down',
      pct: pctOf(usedToday), bg: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    },
  ];

  return (
    <>
      <Row className="g-3 mb-4">
        {cards.map((c) => (
          <Col key={c.label} xs={6} lg={2}>
            <Card className="stat-card stat-card-color h-100" style={{ background: c.bg, border: 0 }}>
              <Card.Body className="d-flex flex-column align-items-center justify-content-center gap-1 text-center py-3">
                <StockGauge pct={c.pct} color="rgba(255,255,255,.95)" size={56} />
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{c.value}</div>
                <div
                  className="text-uppercase"
                  style={{ fontSize: 10, letterSpacing: '.08em', opacity: 0.9, fontWeight: 600 }}
                >
                  {c.label}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col lg={4} xl={3}>
          <MiniCalendar />
          {lowItems.length === 0 ? (
            <Card className="panel mt-3">
              <Card.Body className="py-2 px-3">
                <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                  <i className="fa-solid fa-check-double text-success" /> All items well stocked
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card className="panel mt-3">
              <Card.Header className="py-2">
                <Card.Title className="h6 mb-0">Low Stock Alerts</Card.Title>
              </Card.Header>
              <Card.Body className="p-2">
                {lowItems.map((i) => {
                  const pct = i.minStock > 0 ? Math.round((i.stock / i.minStock) * 100) : 0;
                  const bar = i.stock === 0 ? 'bg-danger' : 'bg-warning';
                  return (
                    <div key={i.id} className="px-2 py-2 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="fw-medium">{i.name}</small>
                        <small className={i.stock === 0 ? 'text-danger fw-bold' : 'text-warning fw-bold'}>
                          {i.stock} / {i.minStock} {i.unit}
                        </small>
                      </div>
                      <div className="low-bar mt-1">
                        <div className={bar} style={{ width: `${Math.min(100, pct)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          )}
        </Col>
                <Col lg={8} xl={9}>
          <Card className="panel h-100">
            <Card.Header className="d-flex align-items-center justify-content-between py-2">
              <Card.Title className="h6 mb-0">Recent Activity</Card.Title>
              <i className="fa-solid fa-history text-secondary" />
            </Card.Header>
            <div style={{ maxHeight: 520, overflow: 'auto' }}>
              <Table className="table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th><th>Item</th><th>Action</th><th>Qty</th>
                    <th>Staff</th><th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        <i className="fa-solid fa-inbox" /> No activity yet
                      </td>
                    </tr>
                  ) : (
                    recent.map((tx) => {
                      const ab = actionBadge(tx.action);
                      const item = items.find((i) => i.id === tx.itemId);
                      const isLow = item && Number(tx.remaining) <= Number(item.minStock);
                      const bg = ab.variant === 'danger' ? 'danger' : ab.variant === 'success' ? 'success' : 'info';
                      const cls = ab.variant === 'used' ? 'badge-used' : ab.variant === 'restocked' ? 'badge-restocked' : 'badge-adjusted';
                      return (
                        <tr key={tx.id}>
                          <td>
                            <div className="fw-medium">{formatDate(tx.date)}</div>
                            <div className="text-muted small">{formatTime(tx.date)}</div>
                          </td>
                          <td className="fw-medium">{tx.itemName}</td>
                          <td>
                            <Badge bg={bg} className={cls}>
                              <i className={`fa-solid ${ab.icon} me-1`} />{ab.label}
                            </Badge>
                          </td>
                          <td className={tx.action === 'used' ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                            {tx.action === 'used' ? '-' : '+'}
                            {tx.quantity} {tx.unit}
                          </td>
                          <td className="text-muted">{tx.staff}</td>
                          <td className={isLow ? 'text-warning fw-bold' : 'text-muted'}>
                            {tx.remaining} {tx.unit}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
