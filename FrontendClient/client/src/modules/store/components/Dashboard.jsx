import React from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import MiniCalendar from './MiniCalendar';
import {
  actionBadge, formatDate, formatTime, todayKey, dateKey, getStatus,
} from '../seed';

export default function DashboardView() {
  const { stats, items, transactions } = useStoreContext();

  const usedToday = transactions.filter(
    (t) => dateKey(t.date) === todayKey() && t.action === 'used'
  ).length;
  const lowItems = items.filter((i) => getStatus(i) !== 'ok').sort((a, b) => a.stock - b.stock);
  const recent = [...transactions].slice(0, 12);

  const cards = [
    { label: 'Total Items', value: stats.total, icon: 'fa-solid fa-cubes', accent: 'var(--k-primary)' },
    { label: 'In Stock', value: stats.inStock, icon: 'fa-solid fa-check', accent: 'var(--k-success-dark)' },
    { label: 'Low Stock', value: stats.lowStock, icon: 'fa-solid fa-triangle-exclamation', accent: 'var(--k-warning-dark)' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: 'fa-solid fa-xmark', accent: 'var(--k-danger-dark)' },
    { label: 'Picked Today', value: usedToday, icon: 'fa-solid fa-arrow-trend-down', accent: 'var(--k-info-dark)' },
  ];

  return (
    <>
      <Row className="g-3 mb-4">
        {cards.map((c) => (
          <Col key={c.label} xs={6} lg={2}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <span
                  className="stat-icon d-flex align-items-center justify-content-center"
                  style={{ background: `${c.accent}14`, color: c.accent }}
                >
                  <i className={c.icon} />
                </span>
                <div>
                  <div className="text-uppercase small fw-semibold text-secondary mb-1" style={{ letterSpacing: '.04em' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{c.value}</div>
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
