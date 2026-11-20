import React, { useState, useMemo } from 'react';
import { Row, Col, Form, Card, Table, Badge } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { actionBadge, formatDate, formatTime, dateKey } from '../seed';

export default function HistoryView() {
  const { transactions, items } = useStoreContext();
  const [actionFilter, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesAction = actionFilter === 'all' || t.action === actionFilter;
      const matchesSearch =
        (t.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.staff || '').toLowerCase().includes(search.toLowerCase());
      const matchesDay = !day || dateKey(t.date) === dateKey(day);
      return matchesAction && matchesSearch && matchesDay;
    });
  }, [transactions, actionFilter, search, day]);

  return (
    <div className="mini-store">
      <Row className="g-3 mb-3">
        <Col md={3} lg={2}>
          <Form.Control type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Col>
        <Col md={3} lg={2}>
          <Form.Select value={actionFilter} onChange={(e) => setAction(e.target.value)}>
            <option value="all">All Actions</option>
            <option value="used">Used</option>
            <option value="restocked">Restocked</option>
            <option value="adjusted">Adjusted</option>
          </Form.Select>
        </Col>
        <Col md={4} lg={4}>
          <Form.Control
            type="text"
            placeholder="Search items / staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>

      <Card className="panel">
        <Table className="table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Item</th><th>Action</th><th className="text-end">Qty</th>
              <th>Remaining</th><th>Staff</th><th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  <i className="fa-solid fa-inbox" /> No transactions match
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const ab = actionBadge(t.action);
                const bg = ab.variant === 'danger' ? 'danger' : ab.variant === 'success' ? 'success' : 'info';
                const cls = ab.variant === 'used' ? 'badge-used' : ab.variant === 'restocked' ? 'badge-restocked' : 'badge-adjusted';
                return (
                  <tr key={t.id}>
                    <td className="small">{formatDate(t.date)}</td>
                    <td className="small text-muted">{formatTime(t.date)}</td>
                    <td className="fw-medium">{t.itemName}</td>
                    <td>
                      <Badge bg={bg} className={cls}>
                        <i className={`fa-solid ${ab.icon} me-1`} />{ab.label}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold">
                      {t.action === 'used' ? '-' : '+'}
                      {t.quantity}
                    </td>
                    <td className="small">
                      {t.remaining !== undefined ? `${t.remaining} ${t.unit}` : '—'}
                    </td>
                    <td className="small text-muted">{t.staff}</td>
                    <td className="small text-muted">{t.reason || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
