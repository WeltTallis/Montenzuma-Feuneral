/**
 * DEPRECATED — do not wire this component up.
 *
 * This is an older profile-level charge panel that was superseded by
 * `components/deceased/charges/ChargeSettingsModal.jsx`, which is the component
 * the deceased profile actually renders (see deceasedDetailPage.jsx).
 *
 * It is kept only as a historical reference and is deliberately NOT imported
 * anywhere. It would not work if it were:
 *   • it POSTs to `/deceased/update-charge-settings/:id`, which the deceased
 *     service does not expose (charge settings are written with
 *     `PUT /deceased/charge-settings/:id`);
 *   • its rate fields read/write a `charges` state that was never declared.
 *
 * Use `charges/ChargeSettingsModal.jsx` for per-deceased rates. Remember: a
 * record inherits the tenant-wide home default (Settings → Care Charges) until
 * a rate is saved against that record's own id.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

const ChargeSettingsModal = ({ isOpen, onClose, deceased, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [chargeType, setChargeType] = useState('daily');
  const [currency, setCurrency] = useState('KES');
  const [dailyRate, setDailyRate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [usdRate, setUsdRate] = useState('');
  const [storageRate, setStorageRate] = useState('');
  const [embalmingRate, setEmbalmingRate] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [notes, setNotes] = useState('');

  const symbols = { KES: 'KSh', USD: '$' };


  useEffect(() => {
    if (deceased && isOpen) {
      setChargeType(deceased.charges?.chargeType || 'daily');
      setCurrency(deceased.charges?.currency || 'KES');
      setDailyRate(deceased.charges?.per_day?.toString() || '');
      setHourlyRate(deceased.charges?.per_hour?.toString() || '');
      setUsdRate(deceased.charges?.usdRate?.toString() || '');
      setStorageRate(deceased.charges?.storage_rate?.toString() || '');
      setEmbalmingRate(deceased.charges?.embalming_rate?.toString() || '');
      setTaxRate(deceased.charges?.tax_rate?.toString() || '');
      setNotes(deceased.charges?.notes || '');
    }
  }, [deceased, isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const commas = (v) => {
    if (!v) return '';
    const d = v.replace(/[^\d]/g, '').replace(/^0+/, '');
    return d ? parseInt(d, 10).toLocaleString('en-US') : '';
  };

  const digits = (v) => v.replace(/[^\d]/g, '').replace(/^0+/, '');

  const currentRate = chargeType === 'daily' ? dailyRate : hourlyRate;
  const setCurrentRate = chargeType === 'daily' ? setDailyRate : setHourlyRate;

  const fmt = (n, cur = currency) => symbols[cur] + ' ' + Number(n).toLocaleString('en-US');

  const getProjection = useCallback(() => {
    const rate = parseInt(currentRate || '0', 10);
    if (!rate) return null;
    if (chargeType === 'daily') {
      return { label: 'Estimated 30-day charge', total: rate * 30 };
    }
    return { label: 'Estimated 30-day charge', total: rate * 24 * 30 };
  }, [currentRate, chargeType]);

  const handleRateInput = (value) => {
    const clean = digits(value);
    setCurrentRate(clean);
  };

  const handleSave = async () => {
    const rate = parseInt(currentRate || '0', 10);
    if (!rate || rate <= 0) {
      toast.error(`Please enter a valid ${chargeType} rate.`);
      return;
    }
    if (currency === 'USD' && (!usdRate || parseInt(usdRate, 10) <= 0)) {
      toast.error('Please enter a valid USD exchange rate.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deceased_id: deceased?.id || deceased?.deceased_id,
        chargeType,
        currency,
        per_day: chargeType === 'daily' ? rate : 0,
        per_hour: chargeType === 'hourly' ? rate : 0,
        usdRate: currency === 'USD' ? parseInt(usdRate, 10) : null,
        storage_rate: parseInt(storageRate || '0', 10) || 0,
        embalming_rate: parseInt(embalmingRate || '0', 10) || 0,
        tax_rate: parseInt(taxRate || '0', 10) || 0,
        notes,
      };

      await api.post(`/deceased/update-charge-settings/${deceased?.id || deceased?.deceased_id}`, payload);

      if (onSave) await onSave(payload);
      toast.success('Charge configuration saved.');
      onClose();
    } catch (error) {
      console.error('Error saving charge settings:', error);
      toast.error('Failed to save charge settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const projection = getProjection();
  const per = chargeType === 'daily' ? 'day' : 'hour';

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
                  <label style={styles.label}>Daily Rate (Ksh)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charges.per_day}
                    onChange={(e) => setCharges({ ...charges, per_day: parseFloat(e.target.value) || 0 })}
                    style={styles.input}
                    placeholder="1500"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Embalming Rate (Ksh)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charges.embalming_rate}
                    onChange={(e) => setCharges({ ...charges, embalming_rate: parseFloat(e.target.value) || 0 })}
                    style={styles.input}
                    placeholder="3000"
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Storage Rate (Ksh/day)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charges.storage_rate}
                    onChange={(e) => setCharges({ ...charges, storage_rate: parseFloat(e.target.value) || 0 })}
                    style={styles.input}
                    placeholder="500"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={charges.tax_rate}
                    onChange={(e) => setCharges({ ...charges, tax_rate: parseFloat(e.target.value) || 0 })}
                    style={styles.input}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Currency</label>
                <select
                  value={charges.currency}
                  onChange={(e) => setCharges({ ...charges, currency: e.target.value })}
                  style={styles.select}
                >
                  <option value="KES">KES - Kenyan Shilling (Ksh)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Storage Type</h3>
              <div style={styles.field}>
                <select
                  value={charges.storage_type}
                  onChange={(e) => setCharges({ ...charges, storage_type: e.target.value })}
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
                  onChange={(e) => setCharges({ ...charges, notes: e.target.value })}
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