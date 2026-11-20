import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useStoreContext } from '../storeContext';
import { STORE_CATEGORIES, STORE_UNITS } from '../seed';
import { getCurrentUserName } from '../../../utils/globalAuth';
import notify from '../../../utils/notify';
export default function AddItemModal({ show, onHide }) {
  const { addItem, connected } = useStoreContext();
  const [saving, setSaving] = useState(false);
  // "Added by" is attributed to the signed-in user instead of being typed in.
  // Hand-typed names were misspelled, inconsistent, and trivially forged.
  const currentUser = getCurrentUserName();
  const [payload, setPayload] = useState({
    name: '',
    category: STORE_CATEGORIES[0],
    unit: 'pcs',
    stock: '',
    minStock: '',
  });

  const upd = (k, v) => setPayload((p) => ({ ...p, [k]: v }));
  const reset = () =>
    setPayload({ name: '', category: STORE_CATEGORIES[0], unit: 'pcs', stock: '', minStock: '' });

  const onSave = async () => {
    if (!payload.name.trim() || payload.stock === '') {
      notify.warning('Missing details', 'Name and stock are required.');
      return;
    }
    setSaving(true);
    try {
      const saved = await addItem({
        ...payload,
        staff: currentUser,
        stock: Number(payload.stock),
        minStock: Number(payload.minStock),
      });
      if (saved) {
        reset();
        onHide();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg" scrollable contentClassName="store-modal">
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
            <div className="store-identity" role="status">
              <span className="store-identity-avatar" aria-hidden="true">
                {(currentUser || '?').trim().charAt(0).toUpperCase()}
              </span>
              <span className="store-identity-text">
                <span className="store-identity-name">
                  {currentUser || 'Signed-in user unavailable'}
                </span>
                <span className="store-identity-hint">
                  <i className="fa-solid fa-lock me-1" />
                  Taken from your signed-in account
                </span>
              </span>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" disabled={saving} onClick={() => { reset(); onHide(); }}>Cancel</Button>
        <Button variant="primary" disabled={saving || !connected} onClick={onSave}>
          {saving ? 'Saving…' : 'Save Item'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
