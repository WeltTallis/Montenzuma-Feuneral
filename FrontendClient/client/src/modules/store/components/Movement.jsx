import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Table, Badge } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { PICK_REASONS, getStatus, statusBadge } from '../seed';
import { getCurrentUserName } from '../../../utils/globalAuth';
import notify from '../../../utils/notify';
export default function MovementView() {
  const ctx = useStoreContext();
  const { items, pickItem, restockItem, pendingQuick, setPendingQuick, setView } = ctx;

  // "Done by" is the signed-in user, not a free-text field.
  const currentUser = getCurrentUserName();
  const [mode, setMode] = useState('pick');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    qty: '', reason: PICK_REASONS[0], notes: '', supplier: '',
  });

  useEffect(() => {
    if (pendingQuick && items.some((i) => i.id === pendingQuick.id)) {
      setMode(pendingQuick.type === 'restock' ? 'restock' : 'pick');
      setSelected(pendingQuick.id);
      setPendingQuick(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuick, items]);

  const selectedItem = selected ? items.find((i) => i.id === selected) : null;
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const qty = Number(form.qty);
    if (!selectedItem) return;
    if (qty <= 0) { notify.warning('Invalid quantity', 'Enter a valid quantity.'); return; }
    if (mode === 'pick') {
      pickItem(selectedItem.id, qty, currentUser, form.reason, form.notes);
    } else {
      restockItem(selectedItem.id, qty, form.supplier || undefined);
    }
    setForm({ qty: '', reason: PICK_REASONS[0], notes: '', supplier: '' });
  };

  const quickQty = (n) => setForm((f) => ({ ...f, qty: String(n) }));
  const lowItems = items.filter((i) => getStatus(i) !== 'ok');

  return (
    <Row className="g-3">
      <Col lg={8}>
        <Card className="panel h-100">
          <Card.Header className="py-2 d-flex align-items-center justify-content-between">
            <Card.Title className="h6 mb-0">Select Item</Card.Title>
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                size="sm"
                style={{ maxWidth: 160 }}
                value={mode}
                onChange={(e) => { setMode(e.target.value); setSelected(null); }}
              >
                <option value="pick">Use / Pick Item</option>
                <option value="restock">Restock Item</option>
              </Form.Select>
              <Button variant="outline-secondary" size="sm" onClick={() => setView('items')}>Back to items</Button>
            </div>
          </Card.Header>
          <Table className="table-sm align-middle mb-0" style={{ maxHeight: 460, overflow: 'auto' }}>
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th className="text-end">Stock</th><th>Status</th><th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const st = getStatus(i);
                const sb = statusBadge(st);
                return (
                  <tr key={i.id}>
                    <td className="fw-medium">{i.name}</td>
                    <td className="text-muted small">{i.category}</td>
                    <td className="text-end">{i.stock} {i.unit}</td>
                    <td>
                      <Badge bg={sb.variant === 'ok' ? 'success' : sb.variant === 'low' ? 'warning' : 'danger'} className={sb.variant === 'out' ? 'badge-out' : sb.variant === 'low' ? 'badge-low' : 'badge-ok'}>
                        {st === 'ok' ? 'OK' : sb.label}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant={selected === i.id ? 'primary' : 'outline-secondary'}
                        onClick={() => setSelected(i.id)}
                      >
                        <i className="fa-solid fa-chevron-right" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </Col>
            <Col lg={4}>
        <Card className="panel h-100">
          <Card.Header className="py-2">
            <Card.Title className="h6 mb-0">{mode === 'pick' ? 'Use Item' : 'Restock Item'}</Card.Title>
          </Card.Header>
          <Card.Body>
            {!selectedItem ? (
              <p className="text-muted small mb-0">Select an item to continue.</p>
            ) : (
              <>
                <h6 className="fw-bold">{selectedItem.name}</h6>
                <p className="text-muted small mb-3">
                  {selectedItem.category} • {selectedItem.unit} • on hand: <b>{selectedItem.stock}</b>
                </p>

                <Form.Group className="mb-2">
                  <Form.Label className="small">Quantity</Form.Label>
                  <div className="d-flex gap-1 mb-1">
                    {[1, 5, 10, 20].map((n) => (
                      <Button key={n} variant="outline-secondary" size="sm" onClick={() => quickQty(n)}>{n}</Button>
                    ))}
                  </div>
                  <Form.Control
                    type="number"
                    min={1}
                    value={form.qty}
                    onChange={(e) => upd('qty', e.target.value)}
                  />
                </Form.Group>

                {mode === 'pick' && (
                  <>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Reason</Form.Label>
                      <Form.Select size="sm" value={form.reason} onChange={(e) => upd('reason', e.target.value)}>
                        {PICK_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Done by</Form.Label>
                      <div className="store-identity store-identity-sm" role="status">
                        <span className="store-identity-avatar" aria-hidden="true">
                          {(currentUser || '?').trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="store-identity-text">
                          <span className="store-identity-name">
                            {currentUser || 'Signed-in user unavailable'}
                          </span>
                          <span className="store-identity-hint">
                            <i className="fa-solid fa-lock me-1" />
                            From your signed-in account
                          </span>
                        </span>
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Notes (optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Add a note..."
                        value={form.notes}
                        onChange={(e) => upd('notes', e.target.value)}
                      />
                    </Form.Group>
                  </>
                )}

                {mode === 'restock' && (
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Supplier (optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Supplier name"
                      value={form.supplier}
                      onChange={(e) => upd('supplier', e.target.value)}
                    />
                  </Form.Group>
                )}

                {mode === 'pick' && selectedItem.stock === 0 && (
                  <div className="alert alert-warning py-1 small mb-0 mt-2">
                    <i className="fa-solid fa-triangle-exclamation me-1" /> This item is out of stock.
                  </div>
                )}

                <Button variant="primary" className="w-100 mt-3 btn-sm" onClick={submit}>
                  <i className={`fa-solid ${mode === 'pick' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />{' '}
                  {mode === 'pick' ? 'Record Pick' : 'Record Restock'}
                </Button>
              </>
            )}
          </Card.Body>
          {lowItems.length > 0 && (
            <Card.Footer className="bg-light py-2">
              <small className="fw-semibold d-block mb-1 text-warning">Needs restocking</small>
              <Table className="table table-xs mb-0 small">
                <tbody>
                  {lowItems.slice(0, 4).map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td className="text-end">{i.stock}</td>
                      <td className="text-muted">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Footer>
          )}
        </Card>
      </Col>
    </Row>
  );
}
