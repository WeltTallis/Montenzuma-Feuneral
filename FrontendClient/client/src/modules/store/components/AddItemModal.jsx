import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { STORE_CATEGORIES, STAFF_MEMBERS, STORE_UNITS } from '../seed';

export default function AddItemModal({ show, onHide }) {
  const { addItem } = useStoreContext();
  const [payload, setPayload] = useState({
    name: '',
    category: STORE_CATEGORIES[0],
    unit: 'pcs',
    stock: '',
    minStock: '',
    staff: STAFF_MEMBERS[0],
  });

  const upd = (k, v) => setPayload((p) => ({ ...p, [k]: v }));
  const reset = () =>
    setPayload({ name: '', category: STORE_CATEGORIES[0], unit: 'pcs', stock: '', minStock: '', staff: STAFF_MEMBERS[0] });

  const onSave = () => {
    if (!payload.name || !payload.stock) {
      alert('Name and stock are required');
      return;
    }
    addItem({ ...payload, stock: Number(payload.stock), minStock: Number(payload.minStock) });
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Add New Item</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Item name"
              value={payload.name}
              onChange={(e) => upd('name', e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control
              type="text"
              list="store-categories-list"
              placeholder="e.g. Dairy & Chilled, Beverages"
              value={payload.category}
              onChange={(e) => upd('category', e.target.value)}
            />
            <datalist id="store-categories-list">
              {STORE_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Unit</Form.Label>
            <Form.Control
              type="text"
              list="store-units-list"
              placeholder="e.g. cartons, pcs, packs"
              value={payload.unit}
              onChange={(e) => upd('unit', e.target.value)}
            />
            <datalist id="store-units-list">
              {STORE_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            <Form.Text className="text-muted">
              e.g. Cartons of Milk, Crates of Eggs, Packs of Sugar
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Initial Stock</Form.Label>
            <Form.Control type="number" min={0} value={payload.stock} onChange={(e) => upd('stock', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Minimum Stock</Form.Label>
            <Form.Control type="number" min={0} value={payload.minStock} onChange={(e) => upd('minStock', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Added by</Form.Label>
            <Form.Select value={payload.staff} onChange={(e) => upd('staff', e.target.value)}>
              {STAFF_MEMBERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => { reset(); onHide(); }}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>Save Item</Button>
      </Modal.Footer>
    </Modal>
  );
}
