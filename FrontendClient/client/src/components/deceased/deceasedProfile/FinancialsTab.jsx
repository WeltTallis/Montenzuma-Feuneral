
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

/* Horizontal scroll box for the wide tables. Without it the 7-column payment
   table pushes the whole profile page sideways on a phone. */
const TableScroll = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid ${C.borderLight || '#e0e0e0'};
  border-radius: 6px;
  
  /* The table keeps a sensible min-width so columns stay readable and the
     wrapper scrolls instead of squeezing everything into unreadable slivers. */
  table { min-width: 620px; }
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
const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
`;
const ModalCard = styled.div`
  background: #fff; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${C.borderLight};
  font-size: 16px; font-weight: 700;
`;
const ModalBody = styled.div` padding: 20px; `;
const ModalFoot = styled.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${C.borderLight};
`;
const CloseBtn = styled.button`
  background: none; border: none; font-size: 24px; cursor: pointer; color: ${C.gray};
  &:hover { color: ${C.black}; }
`;



const FinancialsTab = ({ charges: initialCharges, payments: initialPayments, deceasedId, onDataChanged }) => {
  const [payments, setPayments] = useState(initialPayments || []);
  const [chargeList, setChargeList] = useState(initialCharges || []);
  const [isRecording, setIsRecording] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState(null);
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    charge_type: '',
    amount: '',
    currency: 'KES',
    description: '',
    service_date: todayKey()
  });
  // KES-first billing — USD stays selectable for foreign payments. Insurance
  // payments additionally carry the name of the insurance provider.
  const [paymentForm, setPaymentForm] = useState({
    date: todayKey(),
    currency: 'KES',
    payment_method: 'Cash',
    reference: '',
    amount: '',
    description: '',
    insurance_provider: ''
  });

  // Keep local mirrors in sync with parent data
  useEffect(() => { setChargeList(initialCharges || []); }, [initialCharges]);

  // Currency-aware billing math (KES-first; USD kept for foreign payments)
  const currencySymbol = (cur) => (cur === 'KES' ? 'KES' : '$');
  const fmtMoney = (amount, cur) =>
    `${currencySymbol(cur)} ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const CURRENCIES = ['KES', 'USD'];
  const sumBy = (rows, cur, getAmount) => rows
    .filter(r => (r.currency || 'KES') === cur)
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

    // An insurance settlement must name the insurer — the provider is stored
    // with the payment and shown in the payment history.
    if (paymentForm.payment_method === 'Insurance' && !(paymentForm.insurance_provider || '').trim()) {
      showToast.error('Please enter the name of the insurance provider');
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
          currency: paymentForm.currency || 'KES',
          payment_method: paymentForm.payment_method,
          insurance_provider: paymentForm.payment_method === 'Insurance'
            ? (paymentForm.insurance_provider || '').trim() || null
            : null,
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
        setShowPaymentModal(false);
        setPaymentForm({
          date: todayKey(),
          currency: paymentForm.currency || 'KES',
          payment_method: 'Cash',
          reference: '',
          amount: '',
          description: '',
          insurance_provider: ''
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
          currency: chargeForm.currency || 'KES',
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
          currency: chargeForm.currency || 'KES',
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
      {showPaymentModal && (
        <ModalOverlay onClick={() => setShowPaymentModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <span>Record Payment</span>
              <CloseBtn onClick={() => setShowPaymentModal(false)}>×</CloseBtn>
            </ModalHead>
            <form onSubmit={handleRecordPayment}>
              <ModalBody>
                <FormRow>
                  <FormGroup>
                    <FormLabel>Date</FormLabel>
                    <FormInput type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} required />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Currency</FormLabel>
                    <FormSelect value={paymentForm.currency} onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}>
                      <option value="KES">KES (KSh)</option>
                      <option value="USD">USD ($)</option>
                    </FormSelect>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Payment Method</FormLabel>
                    <FormSelect value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                      <option>Cash</option>
                      <option>M-Pesa</option>
                      <option>Card</option>
                      <option>Bank Transfer</option>
                      <option>Insurance</option>
                    </FormSelect>
                  </FormGroup>
                </FormRow>
                {paymentForm.payment_method === 'Insurance' && (
                  <FormRow>
                    <FormGroup style={{ flex: 2, minWidth: '220px' }}>
                      <FormLabel>Name of Insurance *</FormLabel>
                      <FormInput
                        placeholder="e.g. CIC Insurance, Jubilee Insurance, Britam"
                        value={paymentForm.insurance_provider}
                        onChange={(e) => setPaymentForm({ ...paymentForm, insurance_provider: e.target.value })}
                        required
                      />
                    </FormGroup>
                  </FormRow>
                )}
                <FormRow>
                  <FormGroup>
                    <FormLabel>Reference Number</FormLabel>
                    <FormInput placeholder="e.g. QXR89YU72" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} required />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Amount ({paymentForm.currency === 'KES' ? 'KES' : 'USD'})</FormLabel>
                    <FormInput type="number" placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                  </FormGroup>
                  <FormGroup style={{ flex: 2, minWidth: '200px' }}>
                    <FormLabel>Description / Notes (Optional)</FormLabel>
                    <FormInput placeholder="e.g. Facility fee, Coffin, Embalming, etc." value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} />
                  </FormGroup>
                </FormRow>
              </ModalBody>
              <ModalFoot>
                <Btn type="button" onClick={() => setShowPaymentModal(false)}>Cancel</Btn>
                <Btn $primary type="submit" disabled={isRecording}>{isRecording ? 'Recording...' : 'Save Payment'}</Btn>
              </ModalFoot>
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* Payment History with Record button */}
      <SectionHead $mt4 style={{ justifyContent: 'space-between', width: '100%' }}>
        <span><span style={{ opacity: 0.5, fontSize: '10px' }}>02</span> Payment History</span>
        <Btn $primary onClick={() => setShowPaymentModal(true)} style={{ padding: '4px 12px', fontSize: '11px' }}>
          + Record Payment
        </Btn>
      </SectionHead>
      {/* Seven columns do not fit a phone. The wrapper scrolls the table on its
          own so the page itself never gains a horizontal scrollbar. */}
      <TableScroll>
        <DataTable>
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Insurance</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: C.gray, padding: '24px 0' }}>No payments recorded</td></tr>
            ) : payments.map((p, i) => (
              <tr key={i}>
                <td>{formatDate(p.created_at || p.payment_date)}</td>
                <td>
                  <StatusTag $info={p.payment_method === 'M-Pesa'} $warning={p.payment_method === 'Cash'} $success={p.payment_method === 'Insurance'}>
                    {p.payment_method || '—'}
                  </StatusTag>
                </td>
                <td>{p.insurance_provider || '—'}</td>
                <td>{p.reference || '—'}</td>
                <td>{p.description || p.notes || '—'}</td>
                <td><strong>{fmtMoney(p.amount, p.currency)}</strong></td>
                <td>{p.recorded_by || '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableScroll>
    </>
  );
};

export default FinancialsTab;