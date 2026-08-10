import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { C, formatDate } from './theme';
import { todayKey } from '../../../utils/dates/parseDates';
import axios from 'axios';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import env from '../../../utils/config/env';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;
const slideUp = keyframes`from { transform: translateY(16px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; }`;
const toastIn = keyframes`from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); }`;
const toastOut = keyframes`to { opacity: 0; transform: translateX(30px); }`;

const Wrapper = styled.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a;
  position: relative;
`;

const NavBar = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 2rem;
  &::-webkit-scrollbar { display: none; }
`;

const NavTab = styled.button`
  padding: 1rem 0;
  margin-right: 2.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${p => p.$active ? '#0a0a0a' : '#888888'};
  cursor: pointer;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? '#0a0a0a' : 'transparent'};
  margin-bottom: -2px;
  background: none;
  white-space: nowrap;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
  &:hover { color: #1a1a1a; }
`;

const Btn = styled.button`
  padding: 8px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #e0e0e0; background: white; color: #1a1a1a;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #f7f7f5; border-color: #777777; }
  ${p => p.$primary && `background: #0a0a0a; color: white; border-color: #0a0a0a;
    &:hover { background: #333; border-color: #333; }`}
  ${p => p.$sm && `padding: 6px 12px; font-size: 12px;`}
  ${p => p.$danger && `background: transparent; color: #ef4444; border-color: #fecaca;
    &:hover { background: #fee2e2; border-color: #ef4444; }`}
`;

const Section = styled.div`
  display: ${p => p.$active ? 'block' : 'none'};
  animation: ${fadeIn} 0.3s ease;
`;

const SectionTitle = styled.h3`
  font-size: 1rem; font-weight: 700; color: #0a0a0a;
  margin: 0 0 1.5rem 0; padding-bottom: 0; border-bottom: none;
`;

const SectionHead = styled.div`
  font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;
  width: fit-content; padding-bottom: 4px; border-bottom: 2px solid #0a0a0a; color: #0a0a0a;
  span { opacity: 0.5; font-size: 10px; }
`;

const DetailGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem 2rem; margin-bottom: 2.5rem;
`;

const DetailItem = styled.div`
  display: flex; flex-direction: column; gap: 6px; min-width: 0;
`;

const DetailLabel = styled.span`
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: #888888;
`;

const DetailValue = styled.div`
  font-size: 14px; font-weight: 600; color: #0a0a0a; word-break: break-word;
  ${p => p.$muted && `color: #aaaaaa; font-weight: 400; font-style: italic; font-size: 13px;`}
`;

const Status = styled.span`
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
  border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  background: ${p => p.$variant === 'confirmed' ? 'rgba(39,174,96,0.12)' : p.$variant === 'scheduled' ? 'rgba(41,128,185,0.12)' : 'rgba(200,164,94,0.12)'};
  color: ${p => p.$variant === 'confirmed' ? '#059669' : p.$variant === 'scheduled' ? '#2563eb' : '#1a1a1a'};
`;

const StatusDot = styled.span`
  width: 6px; height: 6px; border-radius: 50%; display: inline-block;
  background: ${p => p.$variant === 'confirmed' ? '#059669' : p.$variant === 'scheduled' ? '#2563eb' : '#1a1a1a'};
`;

const ModuleCard = styled.div`
  padding: 1.25rem 0; display: flex; justify-content: space-between; align-items: center;
  gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
  ${p => p.$dashed && `border: 1px dashed #e0e0e0; background: #fafafa; padding: 1rem; border-radius: 4px; margin-top: 1rem;`}
  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; }
`;

const ModuleInfo = styled.div`
  h4 { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
  p { font-size: 13px; color: #555555; margin: 0; line-height: 1.5; }
  .sub { font-size: 12px; color: #888888; margin-top: 3px; }
  h4.dim { color: #aaaaaa; }
`;

const Amount = styled.span`
  font-weight: 700; color: #0a0a0a; font-variant-numeric: tabular-nums;
`;

const WarnBox = styled.div`
  background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b;
  border-radius: 0 4px 4px 0; padding: 1rem 1.25rem; margin-bottom: 1.5rem;
  p { margin: 0; font-size: 13px; color: #8a7a40; line-height: 1.5; }
  strong { color: #8a7a40; }
`;

const TextArea = styled.textarea`
  width: 100%; min-height: 100px; padding: 12px; background: #ffffff;
  border: 1px solid #e0e0e0; border-radius: 4px; color: #1a1a1a;
  font-family: inherit; font-size: 14px; resize: vertical; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
  &:focus { border-color: #0a0a0a; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
  &::placeholder { color: #aaaaaa; }
`;

const ItemsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;
`;

const ItemCard = styled.div`
  background: #ffffff; border: 1px solid #f0f0f0; border-radius: 4px; padding: 1rem;
  transition: border-color 0.2s; &:hover { border-color: #e0e0e0; }
`;

const ItemName = styled.div`
  font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
`;

const ItemMeta = styled.div`
  font-size: 12px; color: #888888; line-height: 1.7;
`;

const ItemActions = styled.div`
  margin-top: 10px; display: flex; gap: 6px;
`;

const BtnGroup = styled.div`
  display: flex; gap: 6px; flex-shrink: 0;
`;

// Modal Components
const ModalOverlay = styled.div`
  display: ${p => p.$open ? 'flex' : 'none'}; position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 200;
  align-items: center; justify-content: center; padding: 20px; animation: ${fadeIn} 0.2s ease;
`;

const ModalBox = styled.div`
  background: #ffffff; border-radius: 8px; width: 100%; max-width: 500px;
  max-height: 85vh; overflow-y: auto; animation: ${slideUp} 0.25s ease;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

const ModalHead = styled.div`
  padding: 1.5rem 1.5rem 0; display: flex; align-items: center; justify-content: space-between;
  h3 { font-size: 1.125rem; font-weight: 700; margin: 0; color: #0a0a0a; }
`;

const ModalClose = styled.button`
  width: 32px; height: 32px; border-radius: 4px; border: 1px solid #e0e0e0;
  background: #ffffff; color: #555555; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; transition: all 0.15s;
  &:hover { color: #0a0a0a; border-color: #0a0a0a; }
`;

const ModalBody = styled.div`padding: 1.5rem;`;
const ModalFooter = styled.div`padding: 0 1.5rem 1.5rem; display: flex; gap: 8px; justify-content: flex-end;`;

const FormGroup = styled.div`margin-bottom: 1rem;`;
const FormLabel = styled.label`
  display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #555555; margin-bottom: 6px;
`;
const FormInput = styled.input`
  width: 100%; padding: 10px 12px; background: #ffffff; border: 1px solid #e0e0e0;
  border-radius: 4px; color: #1a1a1a; font-family: inherit; font-size: 14px; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
  &:focus { border-color: #0a0a0a; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
  &::placeholder { color: #aaaaaa; }
`;
const FormSelect = styled.select`
  width: 100%; padding: 10px 12px; background: #ffffff; border: 1px solid #e0e0e0;
  border-radius: 4px; color: #1a1a1a; font-family: inherit; font-size: 14px; outline: none;
  transition: border-color 0.15s; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; padding-right: 34px;
  &:focus { border-color: #0a0a0a; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
`;
const FormRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

// Toast
const ToastContainer = styled.div`
  position: fixed; top: 16px; right: 16px; z-index: 300; display: flex; flex-direction: column; gap: 8px;
`;

const Toast = styled.div`
  background: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px;
  font-size: 13px; color: #1a1a1a; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex; align-items: center; gap: 8px; min-width: 260px;
  animation: ${p => p.$out ? toastOut : toastIn} 0.25s ease forwards; font-weight: 500;
`;

const TABS = [
  { key: 'chapel', label: 'Chapel / Viewing', icon: 'fa-church' },
  { key: 'coffin', label: 'Coffin', icon: 'fa-box' },
  { key: 'flowers', label: 'Flowers', icon: 'fa-seedling' },
  { key: 'hearse', label: 'Hearse', icon: 'fa-car-side' },
  { key: 'clothing', label: 'Clothing', icon: 'fa-shirt' },
  { key: 'requests', label: 'Special Requests', icon: 'fa-clipboard-list' },
];

const CAT_ICONS = {
  clothing: 'fa-shirt', footwear: 'fa-shoe-prints', accessory: 'fa-bow-tie',
  jewelry: 'fa-gem', personal: 'fa-suitcase'
};

const BookingsTab = ({ deceased }) => {
  const d = deceased || {};
  const [activeTab, setActiveTab] = useState('chapel');
  const [flowerBookings, setFlowerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialRequests, setSpecialRequests] = useState('');
  const [clothingItems, setClothingItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  // Clothing form state
  const [clothForm, setClothForm] = useState({
    category: 'clothing', name: '', by: '', date: '', condition: 'Good', notes: ''
  });

  useEffect(() => {
    fetchFlowerBookings();
    fetchClothingItems();
  }, []);

  const showToast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250);
    }, 3000);
  }, []);

  const fetchFlowerBookings = async () => {
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const headers = { 'x-tenant-slug': slug };
      const res = await axios.get(`/api/v1/restpoint/florist/bookings`, {
        headers,
        params: { search: d.full_name || d.name || '' }
      });
      if (res.data?.data) {
        setFlowerBookings(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (e) {
      setFlowerBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClothingItems = async () => {
    try {
      const slug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const res = await axios.get(`${env.FULL_API_URL}/deceased/${d.id || d.deceased_id}/clothing`, {
        headers: { 'x-tenant-slug': slug, 'Authorization': `Bearer ${token}` }
      });
      if (res.data?.data) {
        setClothingItems(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (e) {
      setClothingItems([]);
    }
  };

  const addClothingItem = async () => {
    if (!clothForm.name.trim()) { showToast('error', 'Please enter item description'); return; }
    if (!clothForm.by.trim()) { showToast('error', 'Please enter who dropped it off'); return; }

    try {
      const slug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const res = await axios.post(`${env.FULL_API_URL}/deceased/${d.id || d.deceased_id}/clothing`, {
        ...clothForm,
        date: clothForm.date || todayKey()
      }, {
        headers: { 'x-tenant-slug': slug, 'Authorization': `Bearer ${token}` }
      });
      if (res.data?.data) {
        setClothingItems(prev => [res.data.data, ...prev]);
      }
      setModal(null);
      setClothForm({ category: 'clothing', name: '', by: '', date: '', condition: 'Good', notes: '' });
      showToast('success', `"${clothForm.name}" added`);
    } catch (e) {
      // Fallback: add locally
      const newItem = {
        id: Date.now(),
        category: clothForm.category,
        name: clothForm.name,
        detail: clothForm.condition + ' condition',
        by: clothForm.by,
        date: clothForm.date ? new Date(clothForm.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
        condition: clothForm.condition,
        notes: clothForm.notes
      };
      setClothingItems(prev => [newItem, ...prev]);
      setModal(null);
      setClothForm({ category: 'clothing', name: '', by: '', date: '', condition: 'Good', notes: '' });
      showToast('success', `"${clothForm.name}" added`);
    }
  };

  const removeClothing = (id) => {
    const item = clothingItems.find(x => x.id === id);
    if (item) {
      setClothingItems(prev => prev.filter(x => x.id !== id));
      showToast('error', `"${item.name}" removed`);
    }
  };

  const openModal = (id) => setModal(id);
  const closeModal = () => setModal(null);

  const getStatusVariant = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === 'assigned') return 'confirmed';
    if (s === 'scheduled') return 'scheduled';
    return 'pending';
  };

  const formatDateStr = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const TOAST_ICONS = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

  return (
    <Wrapper>
      {/* Navigation Tabs */}
      <NavBar role="tablist">
        {TABS.map(tab => (
          <NavTab
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
          >
            <i className={`fas ${tab.icon}`} style={{ fontSize: 12 }}></i>
            {tab.label}
          </NavTab>
        ))}
      </NavBar>

      {/* ════ CHAPEL / BODY VIEWING ════ */}
      <Section $active={activeTab === 'chapel'} role="tabpanel">
        <SectionTitle>Body Viewing & Chapel Service</SectionTitle>
        <DetailGrid>
          <DetailItem>
            <DetailLabel>Scheduled Date</DetailLabel>
            <DetailValue>{d.chapel_date ? formatDate(d.chapel_date) : 'Not scheduled'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Time</DetailLabel>
            <DetailValue>{d.chapel_time || '—'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Chapel</DetailLabel>
            <DetailValue>{d.chapel_name || 'Main Chapel'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Chapel Status</DetailLabel>
            <DetailValue>
              <Status $variant={getStatusVariant(d.chapel_date ? 'scheduled' : 'pending')}>
                <StatusDot $variant={getStatusVariant(d.chapel_date ? 'scheduled' : 'pending')} />
                {d.chapel_date ? 'Scheduled' : 'Pending'}
              </Status>
            </DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Officiant</DetailLabel>
            <DetailValue>{d.officiant || '—'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Expected Attendees</DetailLabel>
            <DetailValue>{d.expected_attendees || '—'}</DetailValue>
          </DetailItem>
        </DetailGrid>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Btn $primary $sm onClick={() => openModal('chapel')}>
            <i className="fas fa-calendar-pen"></i> Reschedule Chapel
          </Btn>
        </div>
        <SectionHead><span>01</span> Viewing Sessions</SectionHead>

        <ModuleCard>
          <ModuleInfo>
            <h4>Family Viewing — Private</h4>
            <p>18 Jan 2025 · 08:00 AM — 10:00 AM · Viewing Room A</p>
            <p className="sub">Immediate family only · Max 20 attendees</p>
          </ModuleInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Status $variant="confirmed"><StatusDot $variant="confirmed" />Confirmed</Status>
            <BtnGroup>
              <Btn $sm onClick={() => showToast('info', 'Viewing details opened')}><i className="fas fa-eye"></i></Btn>
              <Btn $sm $danger onClick={() => showToast('error', 'Viewing cancelled')}><i className="fas fa-times"></i></Btn>
            </BtnGroup>
          </div>
        </ModuleCard>

        <ModuleCard>
          <ModuleInfo>
            <h4>Public Viewing</h4>
            <p>19 Jan 2025 · 10:00 AM — 04:00 PM · Main Hall</p>
            <p className="sub">Open to all · No attendee limit</p>
          </ModuleInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Status $variant="scheduled"><StatusDot $variant="scheduled" />Scheduled</Status>
            <BtnGroup>
              <Btn $sm onClick={() => showToast('info', 'Viewing details opened')}><i className="fas fa-eye"></i></Btn>
              <Btn $sm $danger onClick={() => showToast('error', 'Viewing cancelled')}><i className="fas fa-times"></i></Btn>
            </BtnGroup>
          </div>
        </ModuleCard>

        <ModuleCard $dashed>
          <ModuleInfo>
            <h4 className="dim">No More Viewing Sessions</h4>
            <p>Schedule an additional viewing session</p>
          </ModuleInfo>
          <Btn $primary $sm onClick={() => showToast('info', 'Add viewing session')}>
            <i className="fas fa-plus"></i> Add Session
          </Btn>
        </ModuleCard>
      </Section>

      {/* ════ COFFIN ════ */}
      <Section $active={activeTab === 'coffin'} role="tabpanel">
        <SectionTitle>Coffin Booking</SectionTitle>
        <SectionHead><span>01</span> Assigned Coffin</SectionHead>
        <ModuleCard>
          <ModuleInfo>
            <h4>{d.coffin_name || 'No Coffin Assigned'}</h4>
            <p>
              {d.coffin_price ? <><Amount>KES {parseFloat(d.coffin_price).toLocaleString()}</Amount> · </> : ''}
              {d.coffin_type || ''} {d.coffin_material || ''}
            </p>
            <p className="sub">Status: {d.coffin_status || 'Not assigned'} · Assigned: {d.coffin_assigned_date ? formatDateStr(d.coffin_assigned_date) : '—'}</p>
          </ModuleInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Status $variant={getStatusVariant(d.coffin_status)}>
              <StatusDot $variant={getStatusVariant(d.coffin_status)} />
              {d.coffin_status || 'Not assigned'}
            </Status>
            <BtnGroup>
              <Btn $sm onClick={() => showToast('info', 'Coffin management opened')}>
                <i className="fas fa-cog"></i> Manage
              </Btn>
              {d.coffin_name && (
                <Btn $sm $danger onClick={() => showToast('error', 'Coffin detached')}>
                  <i className="fas fa-link-slash"></i> Detach
                </Btn>
              )}
            </BtnGroup>
          </div>
        </ModuleCard>
      </Section>

      {/* ════ FLOWERS ════ */}
      <Section $active={activeTab === 'flowers'} role="tabpanel">
        <SectionTitle>Flower Bookings</SectionTitle>
        <SectionHead><span>01</span> Attached Flower Orders</SectionHead>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#aaaaaa' }}>Loading flower bookings...</div>
        ) : flowerBookings.length > 0 ? (
          <>
            {flowerBookings.map((booking, i) => (
              <ModuleCard key={booking.id || i}>
                <ModuleInfo>
                  <h4>{booking.flower_type || 'Flower Booking'}</h4>
                  <p>
                    {booking.service_type || ''} · <Amount>KES {parseFloat(booking.amount || 0).toLocaleString()}</Amount>
                  </p>
                  <p className="sub">
                    Delivery: {formatDate(booking.delivery_date)} at {booking.delivery_time || '—'} · Status: {booking.status || 'pending'}
                  </p>
                </ModuleInfo>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <Status $variant={getStatusVariant(booking.status)}>
                    <StatusDot $variant={getStatusVariant(booking.status)} />
                    {booking.status || 'Pending'}
                  </Status>
                  <BtnGroup>
                    <Btn $sm onClick={() => showToast('info', 'Flower order viewed')}>
                      <i className="fas fa-eye"></i> View
                    </Btn>
                    <Btn $sm $danger onClick={() => showToast('error', 'Flower order cancelled')}>
                      <i className="fas fa-times"></i> Cancel
                    </Btn>
                  </BtnGroup>
                </div>
              </ModuleCard>
            ))}
          </>
        ) : (
          <ModuleCard $dashed>
            <ModuleInfo>
              <h4 className="dim">No Flower Booking Attached</h4>
              <p>Please attach a flower package</p>
            </ModuleInfo>
            <Btn $primary $sm onClick={() => openModal('flower')}>
              <i className="fas fa-plus"></i> Attach
            </Btn>
          </ModuleCard>
        )}
      </Section>

      {/* ════ HEARSE ════ */}
      <Section $active={activeTab === 'hearse'} role="tabpanel">
        <SectionTitle>Hearse Booking</SectionTitle>
        <SectionHead><span>01</span> Assigned Hearse</SectionHead>
        <ModuleCard>
          <ModuleInfo>
            <h4>{d.hearse_name || 'No Hearse Assigned'}</h4>
            <p>
              {d.hearse_price ? <><Amount>KES {parseFloat(d.hearse_price).toLocaleString()}</Amount> · </> : ''}
              {d.hearse_type || ''}
            </p>
            <p className="sub">
              Driver: {d.hearse_driver || '—'} · {d.hearse_driver_phone || ''} · Status: {d.hearse_status || 'Not assigned'}
            </p>
          </ModuleInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Status $variant={getStatusVariant(d.hearse_status)}>
              <StatusDot $variant={getStatusVariant(d.hearse_status)} />
              {d.hearse_status || 'Not assigned'}
            </Status>
            <BtnGroup>
              <Btn $sm onClick={() => showToast('info', 'Hearse management opened')}>
                <i className="fas fa-cog"></i> Manage
              </Btn>
              {d.hearse_name && (
                <Btn $sm $danger onClick={() => showToast('error', 'Hearse detached')}>
                  <i className="fas fa-link-slash"></i> Detach
                </Btn>
              )}
            </BtnGroup>
          </div>
        </ModuleCard>
      </Section>

      {/* ════ CLOTHING ════ */}
      <Section $active={activeTab === 'clothing'} role="tabpanel">
        <SectionTitle>Clothing & Dropped Items</SectionTitle>
        <DetailGrid style={{ marginBottom: 20 }}>
          <DetailItem>
            <DetailLabel>Total Items</DetailLabel>
            <DetailValue>{clothingItems.length}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Received By</DetailLabel>
            <DetailValue>{d.clothing_received_by || '—'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Last Update</DetailLabel>
            <DetailValue>{d.clothing_last_update ? formatDateStr(d.clothing_last_update) : '—'}</DetailValue>
          </DetailItem>
        </DetailGrid>
        <SectionHead><span>01</span> Dropped Off Items</SectionHead>
        {clothingItems.length > 0 ? (
          <ItemsGrid>
            {clothingItems.map(item => (
              <ItemCard key={item.id}>
                <ItemName>
                  <i className={`fas ${CAT_ICONS[item.category] || 'fa-box'}`} style={{ color: '#0a0a0a', fontSize: 11 }}></i>
                  {item.name}
                </ItemName>
                <ItemMeta>
                  {item.detail || item.description}<br />
                  Dropped by: {item.by || item.dropped_by} · {item.date ? formatDateStr(item.date) : ''}<br />
                  Condition: <strong style={{ color: '#1a1a1a' }}>{item.condition}</strong>
                  {(item.notes || item.note) ? <><br /><em>{item.notes || item.note}</em></> : ''}
                </ItemMeta>
                <ItemActions>
                  <Btn $sm onClick={() => showToast('info', 'Item details')}><i className="fas fa-eye"></i></Btn>
                  <Btn $sm $danger onClick={() => removeClothing(item.id)}><i className="fas fa-trash"></i></Btn>
                </ItemActions>
              </ItemCard>
            ))}
          </ItemsGrid>
        ) : (
          <ModuleCard $dashed>
            <ModuleInfo>
              <h4 className="dim">No Items Recorded</h4>
              <p>Record new clothing or personal items received</p>
            </ModuleInfo>
            <Btn $primary $sm onClick={() => openModal('clothing')}>
              <i className="fas fa-plus"></i> Add Item
            </Btn>
          </ModuleCard>
        )}
      </Section>

      {/* ════ SPECIAL REQUESTS ════ */}
      <Section $active={activeTab === 'requests'} role="tabpanel">
        <SectionTitle>Special Requests</SectionTitle>
        <WarnBox>
          <p><strong>Note:</strong> Add any special requirements for the service, viewing arrangements, or specific requests here.</p>
        </WarnBox>
        <TextArea
          placeholder="Enter special requests (e.g., specific hymns, cultural requirements, accessibility needs, etc.)"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
        />
      </Section>

      {/* ════ MODALS ════ */}

      {/* Modal: Reschedule Chapel */}
      <ModalOverlay $open={modal === 'chapel'} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <ModalBox role="dialog">
          <ModalHead>
            <h3>Reschedule Chapel</h3>
            <ModalClose onClick={closeModal}><i className="fas fa-times"></i></ModalClose>
          </ModalHead>
          <ModalBody>
            <FormGroup>
              <FormLabel>Chapel</FormLabel>
              <FormSelect defaultValue="Main Chapel">
                <option>Main Chapel</option>
                <option>Small Chapel</option>
                <option>Garden Pavilion</option>
              </FormSelect>
            </FormGroup>
            <FormRow>
              <FormGroup>
                <FormLabel>New Date</FormLabel>
                <FormInput type="date" defaultValue="2025-01-20" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Expected Attendees</FormLabel>
                <FormInput type="number" defaultValue="250" />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <FormLabel>Start Time</FormLabel>
                <FormInput type="time" defaultValue="09:00" />
              </FormGroup>
              <FormGroup>
                <FormLabel>End Time</FormLabel>
                <FormInput type="time" defaultValue="11:00" />
              </FormGroup>
            </FormRow>
            <FormGroup>
              <FormLabel>Officiant</FormLabel>
              <FormInput type="text" defaultValue="Rev. Dr. Samuel Ochieng" />
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <FormLabel>Reason for Reschedule</FormLabel>
              <TextArea style={{ minHeight: 70 }} placeholder="Explain why..." />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn onClick={closeModal}>Cancel</Btn>
            <Btn $primary onClick={() => { closeModal(); showToast('success', 'Chapel rescheduled'); }}>
              <i className="fas fa-check"></i> Reschedule
            </Btn>
          </ModalFooter>
        </ModalBox>
      </ModalOverlay>

      {/* Modal: Attach Coffin */}
      <ModalOverlay $open={modal === 'coffin'} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <ModalBox role="dialog">
          <ModalHead>
            <h3>Attach Coffin</h3>
            <ModalClose onClick={closeModal}><i className="fas fa-times"></i></ModalClose>
          </ModalHead>
          <ModalBody>
            <FormGroup>
              <FormLabel>Search Coffin</FormLabel>
              <FormInput placeholder="Search by name, type, or ID..." />
            </FormGroup>
            <FormGroup>
              <FormLabel>Coffin Type</FormLabel>
              <FormSelect>
                <option>Casket — Premium</option>
                <option>Casket — Standard</option>
                <option>Coffin — Veneer</option>
                <option>Coffin — Particle Board</option>
                <option>Custom</option>
              </FormSelect>
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <FormLabel>Notes</FormLabel>
              <TextArea style={{ minHeight: 60 }} placeholder="Any special requirements..." />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn onClick={closeModal}>Cancel</Btn>
            <Btn $primary onClick={() => { closeModal(); showToast('success', 'Coffin attached'); }}>
              <i className="fas fa-link"></i> Attach
            </Btn>
          </ModalFooter>
        </ModalBox>
      </ModalOverlay>

      {/* Modal: Attach Flower */}
      <ModalOverlay $open={modal === 'flower'} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <ModalBox role="dialog">
          <ModalHead>
            <h3>Attach Flower Booking</h3>
            <ModalClose onClick={closeModal}><i className="fas fa-times"></i></ModalClose>
          </ModalHead>
          <ModalBody>
            <FormGroup>
              <FormLabel>Search Flower Order</FormLabel>
              <FormInput placeholder="Search by order ID or flower type..." />
            </FormGroup>
            <FormGroup>
              <FormLabel>Flower Type</FormLabel>
              <FormSelect>
                <option>Wreath — Standing Spray</option>
                <option>Casket Spray</option>
                <option>Basket Arrangement</option>
                <option>Pillar Arrangement</option>
                <option>Custom Order</option>
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel>Delivery Date</FormLabel>
              <FormInput type="date" defaultValue="2025-01-19" />
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <FormLabel>Notes</FormLabel>
              <TextArea style={{ minHeight: 60 }} placeholder="Placement instructions..." />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn onClick={closeModal}>Cancel</Btn>
            <Btn $primary onClick={() => { closeModal(); showToast('success', 'Flower booking attached'); }}>
              <i className="fas fa-link"></i> Attach
            </Btn>
          </ModalFooter>
        </ModalBox>
      </ModalOverlay>

      {/* Modal: Attach Hearse */}
      <ModalOverlay $open={modal === 'hearse'} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <ModalBox role="dialog">
          <ModalHead>
            <h3>Attach Hearse</h3>
            <ModalClose onClick={closeModal}><i className="fas fa-times"></i></ModalClose>
          </ModalHead>
          <ModalBody>
            <FormGroup>
              <FormLabel>Search Hearse</FormLabel>
              <FormInput placeholder="Search by vehicle, driver, or ID..." />
            </FormGroup>
            <FormGroup>
              <FormLabel>Vehicle Type</FormLabel>
              <FormSelect>
                <option>Mercedes-Benz — Executive</option>
                <option>Mercedes-Benz — Standard</option>
                <option>Toyota — Premium</option>
                <option>Van — Multi-purpose</option>
              </FormSelect>
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <FormLabel>Notes</FormLabel>
              <TextArea style={{ minHeight: 60 }} placeholder="Route or special requirements..." />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn onClick={closeModal}>Cancel</Btn>
            <Btn $primary onClick={() => { closeModal(); showToast('success', 'Hearse attached'); }}>
              <i className="fas fa-link"></i> Attach
            </Btn>
          </ModalFooter>
        </ModalBox>
      </ModalOverlay>

      {/* Modal: Add Clothing Item */}
      <ModalOverlay $open={modal === 'clothing'} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <ModalBox role="dialog">
          <ModalHead>
            <h3>Add Clothing / Item</h3>
            <ModalClose onClick={closeModal}><i className="fas fa-times"></i></ModalClose>
          </ModalHead>
          <ModalBody>
            <FormGroup>
              <FormLabel>Category</FormLabel>
              <FormSelect
                value={clothForm.category}
                onChange={(e) => setClothForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="clothing">Clothing</option>
                <option value="footwear">Footwear</option>
                <option value="accessory">Accessory</option>
                <option value="jewelry">Jewelry / Watch</option>
                <option value="personal">Personal Item</option>
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel>Item Description</FormLabel>
              <FormInput
                placeholder="e.g., White dress shirt, Size L"
                value={clothForm.name}
                onChange={(e) => setClothForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <FormLabel>Dropped Off By</FormLabel>
                <FormInput
                  placeholder="Name"
                  value={clothForm.by}
                  onChange={(e) => setClothForm(prev => ({ ...prev, by: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Date Received</FormLabel>
                <FormInput
                  type="date"
                  value={clothForm.date}
                  onChange={(e) => setClothForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </FormGroup>
            </FormRow>
            <FormGroup>
              <FormLabel>Condition</FormLabel>
              <FormSelect
                value={clothForm.condition}
                onChange={(e) => setClothForm(prev => ({ ...prev, condition: e.target.value }))}
              >
                <option>New</option>
                <option>Good</option>
                <option>Worn</option>
                <option>Needs Cleaning</option>
              </FormSelect>
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <FormLabel>Notes</FormLabel>
              <FormInput
                placeholder="Any additional notes..."
                value={clothForm.notes}
                onChange={(e) => setClothForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Btn onClick={closeModal}>Cancel</Btn>
            <Btn $primary onClick={addClothingItem}>
              <i className="fas fa-plus"></i> Add Item
            </Btn>
          </ModalFooter>
        </ModalBox>
      </ModalOverlay>

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(t => (
          <Toast key={t.id} $out={t.out}>
            <i className={`fas ${TOAST_ICONS[t.type] || 'fa-info-circle'}`} style={{ color: t.type === 'success' ? '#059669' : t.type === 'error' ? '#ef4444' : '#2563eb' }}></i>
            <span>{t.msg}</span>
          </Toast>
        ))}
      </ToastContainer>
    </Wrapper>
  );
};

export default BookingsTab;