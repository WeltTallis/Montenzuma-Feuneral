import React, { useState, useMemo } from 'react';
import { Row, Col, Form, Table, Card, Badge, Button } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { getStatus, statusBadge } from '../seed';

export default function ItemsView() {
  const { items, pendingQuick, setPendingQuick, setView } = useStoreContext();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');

  const cats = useMemo(
    () => {
      const s = new Set(items.map((i) => i.category));
      return [...s].sort();
    },
    [items]
  );

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (cat === 'all' || i.category === cat)
  );

  const quick = (id, type) => {
    setPendingQuick({ type, id });
    setView('movement');
  };

  return (
    <div className="mini-store">
      <Row className="g-3 mb-3">
        <Col md={5} lg={4}>
          <Form.Control
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={3} lg={2}>
          <Form.Select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All Categories</option>
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Card className="panel">
        <Table className="table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>#</th><th>Status</th><th>Name</th><th>Category</th><th>Unit</th>
              <th className="text-end">Stock</th><th>Min</th><th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No items match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((i) => {
                const st = statusBadge(getStatus(i));
                return (
                  <tr key={i.id}>
                    <td className="text-muted">{i.id}</td>
                    <td>
                      <Badge
                        bg={st.variant === 'success' ? 'success' : st.variant === 'warning' ? 'warning' : 'danger'}
                        className={st.variant === 'out' ? 'badge-out' : st.variant === 'low' ? 'badge-low' : 'badge-ok'}
                      >
                        {st.label}
                      </Badge>
                    </td>
                    <td className="fw-medium">{i.name}</td>
                    <td className="text-muted small">{i.category}</td>
                    <td className="text-muted small">{i.unit}</td>
                    <td className="text-end fw-bold">{i.stock}</td>
                    <td className="text-muted">{i.minStock}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="quick-btn me-1"
                        title="Quick Pick"
                        onClick={() => quick(i.id, 'pick')}
                      >
                        <i className="fa-solid fa-minus" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="quick-btn"
                        title="Quick Restock"
                        onClick={() => quick(i.id, 'restock')}
                      >
                        <i className="fa-solid fa-plus" />
                      </Button>
                    </td>
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
