import React, { useState, useEffect } from 'react';

const ChargeSettingsModal = ({ isOpen, onClose, deceased, onSave }) => {
  const [charges, setCharges] = useState({
    per_hour: 0,
    per_day: 0,
    currency: 'KSH',
    storage_type: 'standard',
    notes: ''
  });

  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deceased && deceased.charges) {
      setCharges({
        per_hour: deceased.charges.per_hour || 0,
        per_day: deceased.charges.per_day || 0,
        currency: deceased.charges.currency || 'KSH',
        storage_type: deceased.charges.storage_type || 'standard',
        notes: deceased.charges.notes || ''
      });
    }
  }, [deceased]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave({
        ...charges,
        deceased_id: deceased.id
      });
      onClose();
    } catch (error) {
      console.error('Error saving charges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Charge Settings</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Pricing</h3>
              
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Per Hour Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charges.per_hour}
                    onChange={(e) => setCharges({...charges, per_hour: parseFloat(e.target.value) || 0})}
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Per Day Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charges.per_day}
                    onChange={(e) => setCharges({...charges, per_day: parseFloat(e.target.value) || 0})}
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Currency</label>
                <select
                  value={charges.currency}
                  onChange={(e) => setCharges({...charges, currency: e.target.value})}
                  style={styles.select}
                >
                  <option value="KSH">KSH (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Storage Type</h3>
              <div style={styles.field}>
                <select
                  value={charges.storage_type}
                  onChange={(e) => setCharges({...charges, storage_type: e.target.value})}
                  style={styles.select}
                >
                  <option value="standard">Standard Storage</option>
                  <option value="cold">Cold Storage</option>
                  <option value="premium">Premium Storage</option>
                </select>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Notes</h3>
              <div style={styles.field}>
                <textarea
                  value={charges.notes}
                  onChange={(e) => setCharges({...charges, notes: e.target.value})}
                  style={styles.textarea}
                  rows="4"
                  placeholder="Add any additional notes about charges..."
                />
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveBtn}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Charges'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f9fafb'
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  field: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    background: '#ffffff',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    background: '#f9fafb'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveBtn: {
    padding: '10px 20px',
    border: 'none',
    background: '#000000',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default ChargeSettingsModal;