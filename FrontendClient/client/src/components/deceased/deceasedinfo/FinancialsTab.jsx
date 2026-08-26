
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { todayKey } from '../../../utils/dates/parseDates';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import env from '../../../utils/config/env';
import { showToast } from '../../../utils/toast';
import axios from 'axios';

const SectionHead = styled.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${C.black};
  color: ${C.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${p => p.$mt0 && 'margin-top: 0;'}
  ${p => p.$mt4 && 'margin-top: 32px;'}
`;

// Dedicated Grid for the Top Summary - forces 3 columns on large screens
const SummaryGrid = styled.div`
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 2rem; 
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0; /* Clean separator */
  
  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
    gap: 1.5rem;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const DetailLabel = styled.span`
  font-size: 11px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${p => p.$color || C.gray}; 
`;

const DetailValue = styled.div`
  font-size: 1.75rem; /* Larger, cooler numbers */
  font-weight: 700; 
  color: ${p => p.$color || C.black}; 
  word-break: break-word;
  line-height: 1.2;
`;

const FormRow = styled.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;
`;

const FormGroup = styled.div`
  flex: 1; 
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${C.gray}; 
`;

const FormInput = styled.input`
  height: 40px; 
  width: 100%; 
  border: 1px solid ${C.border || '#e0e0e0'}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${C.dark || '#1a1a1a'}; 
  background: #ffffff; 
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: ${C.black}; 
  }
`;

const FormSelect = styled.select`
  height: 40px; 
  width: 100%; 
  border: 1px solid ${C.border || '#e0e0e0'}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${C.dark || '#1a1a1a'}; 
  background: #ffffff; 
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: ${C.black}; 
  }
`;

const Btn = styled.button`
  padding: 10px 20px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${C.border || '#e0e0e0'}; 
  background: white; 
  color: ${C.dark || '#1a1a1a'};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${C.bgField || '#f7f7f5'}; 
    border-color: ${C.gray || '#777777'}; 
  }
  
  ${p => p.$primary && `
    background: ${C.black}; 
    color: white; 
    border-color: ${C.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
`;

const DataTable = styled.table`
  width: 100%; 
  border-collapse: collapse;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${C.gray}; 
    padding: 12px 8px; 
    border-bottom: 2px solid ${C.borderLight || '#e0e0e0'}; 
    white-space: nowrap; 
  }
  
  td { 
    padding: 12px 8px; 
    font-size: 13px; 
    border-bottom: 1px solid ${C.borderLight || '#e0e0e0'}; 
    vertical-align: middle; 
  }
  
  /* Make table take full width and align nicely */
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const StatusTag = styled.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 4px 10px;
  border-radius: 4px; 
  font-size: 11px; 
  font-weight: 700;
  background: ${p => p.$success ? C.successBg : p.$warning ? C.warningBg : p.$info ? C.infoBg : C.bgField};
  color: ${p => p.$success ? C.success : p.$warning ? C.warning : p.$info ? C.info : C.gray};
  border: 1px solid ${p => p.$success ? '#a7f3d0' : p.$warning ? '#fde68a' : p.$info ? '#bfdbfe' : C.borderLight};
`;

const FinancialsTab = ({ charges: initialCharges, payments: initialPayments, deceasedId, onDataChanged }) => {
  const [payments, setPayments] = useState(initialPayments || []);
  const [chargeList, setChargeList] = useState(initialCharges || []);
  const [isRecording, setIsRecording] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState(null);
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    charge_type: '',
    amount: '',
    currency: 'USD',
    description: '',
    service_date: todayKey()
  });
  const [paymentForm, setPaymentForm] = useState({
    date: todayKey(),
    currency: 'USD',
    payment_method: 'Cash',
    reference: '',
    amount: '',
    description: ''
  });

  // Keep local mirrors in sync with parent data
  useEffect(() => { setChargeList(initialCharges || []); }, [initialCharges]);

  // Currency-aware billing math (USD-first; KES kept as an option)
  const currencySymbol = (cur) => (cur === 'KES' ? 'KES' : '$');
  const fmtMoney = (amount, cur) =>
    `${currencySymbol(cur)} ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const CURRENCIES = ['USD', 'KES'];
  const sumBy = (rows, cur, getAmount) => rows
    .filter(r => (r.currency || 'USD') === cur)
    .reduce((s, r) => s + (parseFloat(getAmount(r) || 0) || 0), 0);

  const summaryRows = CURRENCIES
    .map(cur => {
      const chargesTotal = sumBy(chargeList, cur, c => c.amount ?? c.charge_amount);
      const paidTotal = sumBy(payments, cur, p => p.amount);
      return { currency: cur, chargesTotal, paidTotal, balance: chargesTotal - paidTotal };
    })
    // Only show currencies that actually have billing/payment activity.
    // This hides the all-zero row (e.g. "USD 0.00 / Balance Due 0.00")
    // when everything is billed and paid in KES.
    .filter(r => r.chargesTotal !== 0 || r.paidTotal !== 0);

  // Load payments from API
  useEffect(() => {
    if (deceasedId) {
      loadPayments();
    }
  }, [deceasedId]);

  const loadPayments = async () => {
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      const response = await axios.get(
        `${env.FULL_API_URL}/payments/${deceasedId}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data?.success) {
        setPayments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount || !paymentForm.reference) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setIsRecording(true);
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || localStorage.getItem('authToken') || '';

      const userEmail = (() => {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return user.email || user.username || 'Unknown';
          }
        } catch (e) {
          console.error('Error getting user email:', e);
        }
        return 'Unknown';
      })();

      const response = await axios.post(
        `${env.FULL_API_URL}/payments`,
        {
          deceased_id: deceasedId,
          amount: parseFloat(paymentForm.amount),
          currency: paymentForm.currency || 'USD',
          payment_method: paymentForm.payment_method,
          reference: paymentForm.reference,
          payment_date: paymentForm.date,
          description: paymentForm.description || null,
          recorded_by: userEmail
        },
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        showToast.success('Payment recorded successfully');
        setPaymentForm({
          date: todayKey(),
          currency: paymentForm.currency || 'USD',
          payment_method: 'Cash',
          reference: '',
          amount: '',
          description: ''
        });
        await loadPayments();
        if (onDataChanged) onDataChanged();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast.error('Failed to record payment');
    } finally {
      setIsRecording(false);
    }
  };

  // ---------------- Individual charges (bill per deceased, USD-first) --------
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!chargeForm.charge_type || !chargeForm.amount || parseFloat(chargeForm.amount) <= 0) {
      showToast.error('Please provide a charge type and a valid amount');
      return;
    }

    setIsAddingCharge(true);
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || localStorage.getItem('authToken') || '';

      const response = await axios.post(
        `${env.FULL_API_URL}/charges`,
        {
          deceased_id: deceasedId,
          charge_type: chargeForm.charge_type,
          amount: parseFloat(chargeForm.amount),
          currency: chargeForm.currency || 'USD',
          description: chargeForm.description || null,
          service_date: chargeForm.service_date
        },
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        showToast.success('Charge added to bill');
        const created = response.data.data;
        if (created) setChargeList(prev => [created, ...prev]);
        setChargeForm({
          charge_type: '',
          amount: '',
          currency: chargeForm.currency || 'USD',
          description: '',
          service_date: todayKey()
        });
        if (onDataChanged) onDataChanged();
      } else {
        throw new Error(response.data?.message || 'Failed to add charge');
      }
    } catch (error) {
      console.error('Error adding charge:', error);
      showToast.error(error.response?.data?.message || 'Failed to add charge');
    } finally {
      setIsAddingCharge(false);
    }
  };

  const handleDeleteCharge = async (chargeId) => {
    if (!window.confirm('Remove this charge from the bill?')) return;

    setDeletingChargeId(chargeId);
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || localStorage.getItem('authToken') || '';

      await axios.delete(`${env.FULL_API_URL}/charges/${chargeId}`, {
        headers: {
          'x-tenant-slug': tenantSlug,
          'Authorization': `Bearer ${token}`
        }
      });

      setChargeList(prev => prev.filter(c => (c.charge_id ?? c.id) !== chargeId));
      showToast.success('Charge removed');
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting charge:', error);
      showToast.error(error.response?.data?.message || 'Failed to remove charge');
    } finally {
      setDeletingChargeId(null);
    }
  };

  return (
    <>
      {/* Sleek 3-column Financial Summary - grouped per currency (USD-first) */}
      <SectionHead $mt0><span>01</span> Financial Summary</SectionHead>
      <SummaryGrid>
        {summaryRows.length === 0 ? (
          <DetailItem>
            <DetailLabel $color={C.gray}>No charges or payments recorded yet</DetailLabel>
            <DetailValue style={{ fontSize: '1rem' }} $color={C.gray}>—</DetailValue>
          </DetailItem>
        ) : (
          summaryRows.map(row => (
            <React.Fragment key={row.currency}>
              <DetailItem>
                <DetailLabel $color="#1e40af">Total Charges ({row.currency})</DetailLabel>
                <DetailValue $color="#1e3a8a">{fmtMoney(row.chargesTotal, row.currency)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel $color="#047857">Amount Paid ({row.currency})</DetailLabel>
                <DetailValue $color="#064e3b">{fmtMoney(row.paidTotal, row.currency)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel $color={row.balance < 0 ? '#047857' : '#b91c1c'}>
                  {row.balance < 0 ? 'Credit / Overpayment' : 'Balance Due'}
                </DetailLabel>
                <DetailValue $color={row.balance < 0 ? '#064e3b' : '#7f1d1d'}>
                  {fmtMoney(Math.abs(row.balance), row.currency)}
                </DetailValue>
              </DetailItem>
            </React.Fragment>
          ))
        )}
      </SummaryGrid>

      {/* Individual charges - bill per deceased */}
      <SectionHead $mt4><span>02</span> Charges on this Deceased</SectionHead>
      <form onSubmit={handleAddCharge} style={{ marginBottom: '16px' }}>
        <FormRow>
          <FormGroup>
            <FormLabel>Charge Type</FormLabel>
            <FormInput
              placeholder="e.g. Storage Fee, Embalming, Hearse"
              value={chargeForm.charge_type}
              onChange={(e) => setChargeForm({ ...chargeForm, charge_type: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Currency</FormLabel>
            <FormSelect
              value={chargeForm.currency}
              onChange={(e) => setChargeForm({ ...chargeForm, currency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="KES">KES</option>
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormLabel>Amount ({chargeForm.currency === 'KES' ? 'KES' : 'USD'})</FormLabel>
            <FormInput
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={chargeForm.amount}
              onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Date</FormLabel>
            <FormInput
              type="date"
              value={chargeForm.service_date}
              onChange={(e) => setChargeForm({ ...chargeForm, service_date: e.target.value })}
            />
          </FormGroup>
          <FormGroup style={{ flex: 2, minWidth: '200px' }}>
            <FormLabel>Description (Optional)</FormLabel>
            <FormInput
              placeholder="Brief description of the charge"
              value={chargeForm.description}
              onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
            />
          </FormGroup>
        </FormRow>
        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <Btn $primary type="submit" disabled={isAddingCharge}>
            {isAddingCharge ? 'Adding...' : '+ Add Charge'}
          </Btn>
        </div>
      </form>

      <DataTable style={{ marginBottom: '40px' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {chargeList.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: C.gray, padding: '24px 0' }}>No charges billed yet</td></tr>
          ) : chargeList.map(c => {
            const cId = c.charge_id ?? c.id;
            const cur = c.currency || 'USD';
            return (
              <tr key={cId}>
                <td>{formatDate(c.service_date || c.created_at)}</td>
                <td><strong>{c.charge_type || '—'}</strong></td>
                <td>{c.description || c.notes || '—'}</td>
                <td>
                  <StatusTag $success={c.status === 'paid'}>{c.status || 'pending'}</StatusTag>
                </td>
                <td><strong>{fmtMoney(c.amount ?? c.charge_amount, cur)}</strong></td>
                <td>
                  <Btn
                    type="button"
                    onClick={() => handleDeleteCharge(cId)}
                    disabled={deletingChargeId === cId}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    {deletingChargeId === cId ? '...' : 'Remove'}
                  </Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {/* Sleek Form without wrapper box */}
      <SectionHead><span>03</span> Record Payment</SectionHead>
      <form onSubmit={handleRecordPayment} style={{ marginBottom: '40px' }}>
        <FormRow>
          <FormGroup>
            <FormLabel>Date</FormLabel>
            <FormInput
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Currency</FormLabel>
            <FormSelect
              value={paymentForm.currency}
              onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="KES">KES</option>
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormLabel>Payment Method</FormLabel>
            <FormSelect
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
            >
              <option>Cash</option>
              <option>M-Pesa</option>
              <option>Card</option>
              <option>Bank Transfer</option>
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormLabel>Reference Number</FormLabel>
            <FormInput
              placeholder="e.g. QXR89YU72"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Amount ({paymentForm.currency === 'KES' ? 'KES' : 'USD'})</FormLabel>
            <FormInput
              type="number"
              placeholder="0.00"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup style={{ flex: 2, minWidth: '200px' }}>
            <FormLabel>Description / Notes (Optional)</FormLabel>
            <FormInput
              placeholder="e.g. Facility fee, Coffin, Embalming, etc."
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />
          </FormGroup>
        </FormRow>
        <div style={{ textAlign: 'right' }}>
          <Btn $primary type="submit" disabled={isRecording}>
            {isRecording ? 'Recording...' : '+ Record Payment'}
          </Btn>
        </div>
      </form>

      {/* Sleek Table without wrapper box */}
      <SectionHead $mt4><span>04</span> Payment History</SectionHead>
      <DataTable>
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Recorded By</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: C.gray, padding: '24px 0' }}>No payments recorded</td></tr>
          ) : payments.map((p, i) => (
            <tr key={i}>
              <td>{formatDate(p.created_at || p.payment_date)}</td>
              <td>
                <StatusTag $info={p.payment_method === 'M-Pesa'} $warning={p.payment_method === 'Cash'}>
                  {p.payment_method || '—'}
                </StatusTag>
              </td>
              <td>{p.reference || '—'}</td>
              <td>{p.description || p.notes || '—'}</td>
              <td><strong>{fmtMoney(p.amount, p.currency)}</strong></td>
              <td>{p.recorded_by || '—'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
};

export default FinancialsTab;