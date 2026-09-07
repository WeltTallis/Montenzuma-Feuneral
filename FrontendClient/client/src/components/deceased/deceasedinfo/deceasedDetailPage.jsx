
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import React, { useState, useEffect, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';

// Import your existing sub-components
import DeceasedProfileHeader from './DeceasedProfileHeader';
import ChargeSettingsModal from '../ChargeSettingsModal';
import DeceasedSidebar from './DeceasedSidebar';
import env from '../../../utils/config/env';
import PostmortemTab from './PostmortemTab';
import FinancialsTab from './FinancialsTab';
import DocumentsTab from './DocumentsTab';
import OverviewTab from './OverviewTab';
import AuditLogTab from './AuditLogTab';
import ReleaseTab from './ReleaseTab';
import axios from 'axios';


const BASE_URL = `${env.FULL_API_URL}/deceased`;

const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`;

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

const AppContainer = styled.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a; 
  font-size: 14px; 
  line-height: 1.5;
  max-width: 1400px; 
  margin: 0 auto; 
 
  background: rgb(255, 255, 255);
  animation: ${fadeIn} 0.25s ease-out;
`;

const ProfileLayout = styled.div`
  display: grid; 
  grid-template-columns: 1fr 320px; 
  gap: 4rem; 
  align-items: flex-start;
  @media (max-width: 900px) { 
    grid-template-columns: 1fr; 
    gap: 2rem;
  }
`;

const MainContent = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
   padding: 3rem 2rem;
`;

const Tabs = styled.div`
  display: flex; 
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 2.5rem;
  overflow-x: auto;
`;

const TabBtn = styled.button`
  padding: 1rem 0; 
  margin-right: 2.5rem;
  background: none; 
  border: none; 
  cursor: pointer;
  font-size: 0.875rem; 
  font-weight: 600; 
  color: #888888;
  border-bottom: 2px solid transparent; 
  margin-bottom: -2px;
  white-space: nowrap;
  transition: all 0.15s ease; 
  font-family: 'Source Sans 3', sans-serif;
  display: flex;
  align-items: center;
  
  &:hover { color: #1a1a1a; }
  ${p => p.$active && `
    color: #0a0a0a; 
    border-bottom-color: #0a0a0a; 
  `}
`;

const TabContent = styled.div`
  display: grid;
  gap: 2.5rem;
`;

const TabPane = styled.div`
  display: ${p => p.$active ? 'grid' : 'none'}; 
  gap: 2.5rem;
  animation: ${fadeIn} 0.2s ease;
`;

const LoadingState = styled.div`
  text-align: center; 
  padding: 10rem 0; 
  color: #777777;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 1rem;
  
  .spinner {
    width: 24px; 
    height: 24px; 
    border: 2px solid #e0e0e0;
    border-top-color: #0a0a0a; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ChargeSettingsButton = styled.button`
  background: #0a0a0a;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
  width: fit-content;
  
  &:hover {
    background: #333;
  }
`;

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'postmortem', label: 'Postmortem' },
  { key: 'financials', label: 'Financials' },
  { key: 'release', label: 'Release' },
  { key: 'docs', label: 'Documents' },
  { key: 'audit', label: 'Audit Log' },
];

const DeceasedDetailPage = () => {
  const { id: deceasedId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deceased, setDeceased] = useState(null);
  const [postmortem, setPostmortem] = useState(null);
  const [nextOfKin, setNextOfKin] = useState(null);
  const [payments, setPayments] = useState([]);
  const [charges, setCharges] = useState([]);
  const [requests, setRequests] = useState([]);

  const [showChargeModal, setShowChargeModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!deceasedId) return;
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const headers = {
        'x-tenant-slug': slug,
        'Authorization': `Bearer ${token}`,
      };

      // 1) Deceased core info
      const decRes = await axios.get(`${BASE_URL}/${deceasedId}`, { headers });
      if (decRes.data?.data) {
        // Map backend fields to frontend field names
        const backendData = decRes.data.data;
        const mappedData = {
          ...backendData,
          // Map admission fields
          admission_no: backendData.admission_number,
          admission_time: backendData.time_received,
          admitted_by: backendData.receiving_officer,
          // Map death fields
          time_of_death: null, // Not in DB schema
          attending_physician: backendData.physician,
          // Map body/embalming fields
          embalmed: backendData.admission_status === 'embalmed',
          embalmed_date: null, // Not in DB schema
          storage_location: backendData.chamber_assigned,
          morgue_slot: backendData.chamber_assigned,
          body_condition: backendData.body_status,
          // Map contact fields
          tel_number: backendData.phone_number,
          tell_no: backendData.phone_number,
        };
        setDeceased(mappedData);
      }

      // 2) Postmortem
      try {
        const pmRes = await axios.get(`${BASE_URL}/postmortem/${deceasedId}`, { headers });
        if (pmRes.data?.data) setPostmortem(pmRes.data.data);
      } catch (e) { /* no postmortem yet */ }

      // 3) Next of kin
      try {
        const nokRes = await axios.get(`${BASE_URL}/${deceasedId}/next-of-kin`, { headers });
        const nokList = Array.isArray(nokRes.data?.data) ? nokRes.data.data : (nokRes.data?.data ? [nokRes.data.data] : []);
        if (nokList.length > 0) {
          // data is an array - use the first (primary) next of kin
          setNextOfKin(nokList[0]);
        } else {
          // FALLBACK: older registrations never wrote a next_of_kin row.
          // Synthesize one from the deceased record so the panel still shows
          // whatever kin details were captured at intake.
          const src = decRes.data?.data;
          if (src && (src.contact_person || src.phone_number || src.relationship || src.national_id)) {
            setNextOfKin({
              full_name: src.contact_person || '',
              relationship: src.relationship || '',
              contact: src.tel_number || src.phone_number || '',
              alternative_contact: src.alternative_phone || '',
              id_number: src.national_id || '',
              email: src.email || '',
              is_primary: 1,
              _synthetic: true, // read-only hint for UI
            });
          }
        }
      } catch (e) {
        // no nok endpoint/response — fall back to deceased fields
        const src = decRes.data?.data;
        if (src && (src.contact_person || src.phone_number || src.relationship || src.national_id)) {
          setNextOfKin({
            full_name: src.contact_person || '',
            relationship: src.relationship || '',
            contact: src.tel_number || src.phone_number || '',
            alternative_contact: src.alternative_phone || '',
            id_number: src.national_id || '',
            email: src.email || '',
            is_primary: 1,
            _synthetic: true,
          });
        }
      }

      // 4) Documents - fetch from documents service (through the API gateway)
      try {
        const tenantSlug = getTenantSlug();
        const docRes = await axios.get(`${env.FULL_API_URL}/documents/${deceasedId}`, {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': token ? `Bearer ${token}` : ''
          },
          withCredentials: false
        });
        if (docRes.data?.files) {
          const formattedDocs = docRes.data.files.map(f => ({
            name: f.originalName,
            file_name: f.storedName || f.originalName,
            type: f.category || 'Document',
            created_at: f.uploadedAt || f.uploaded_at,
            document_id: f.documentId,
            url: f.url
          }));
          setDeceased(prev => prev ? { ...prev, documents: formattedDocs } : prev);
        } else if (docRes.data?.data) {
          setDeceased(prev => prev ? { ...prev, documents: docRes.data.data } : prev);
        }
      } catch (e) {
        console.warn('[DeceasedDetail] Documents service unavailable, showing empty list:', e.message);
        setDeceased(prev => prev ? { ...prev, documents: [] } : prev);
      }

      // 5) Charges / billing summary
      try {
        const billRes = await axios.get(`${BASE_URL}/billing-summary/${deceasedId}`, { headers });
        if (billRes.data?.data) {
          const bd = billRes.data.data;
          if (bd.charges) setCharges(Array.isArray(bd.charges) ? bd.charges : [bd.charges]);
          if (bd.payments) setPayments(Array.isArray(bd.payments) ? bd.payments : []);
        }
      } catch (e) {
        // Fallback to charges endpoint
        try {
          const chgRes = await axios.get(`${BASE_URL}/charges/${deceasedId}`, { headers });
          if (chgRes.data?.data) {
            setCharges(Array.isArray(chgRes.data.data) ? chgRes.data.data : [chgRes.data.data]);
          }
        } catch (e2) { /* no charges */ }
      }

      // 6) Charge settings (merged into deceased.charges so the sidebar's
      // "Daily storage rate" + storage charge always reflect the saved values)
      try {
        const csRes = await axios.get(`${BASE_URL}/charge-settings/${deceasedId}`, { headers });
        if (csRes.data?.data) {
          const cs = csRes.data.data;
          setDeceased(prev => prev ? {
            ...prev,
            charges: {
              storage_rate: parseFloat(cs.dailyRate ?? cs.daily_rate ?? cs.storage_rate ?? cs.per_day ?? prev?.charges?.storage_rate ?? 500),
              per_day: parseFloat(cs.dailyRate ?? cs.daily_rate ?? prev?.charges?.per_day ?? 500),
              per_hour: parseFloat(cs.hourlyRate ?? cs.hourly_rate ?? prev?.charges?.per_hour ?? 125),
              currency: cs.currency ?? prev?.charges?.currency ?? 'KES',
              rate_profile: cs.rateProfile ?? cs.rate_profile ?? 'standard',
              charge_type: cs.chargeType ?? cs.charge_type ?? 'daily',
              usd_rate: parseFloat(cs.usdRate ?? cs.usd_rate ?? prev?.charges?.usd_rate ?? 130),
              updated_at: cs.updatedAt ?? cs.updated_at ?? null
            }
          } : prev);
        }
      } catch (e) { /* charge settings optional */ }

      // 7) Release data for audit log
      try {
        const relRes = await axios.get(`${env.FULL_API_URL}/bodycheckout/release/${deceasedId}`, { headers });
        if (relRes.data?.data) {
          setDeceased(prev => prev ? { ...prev, releaseData: relRes.data.data } : prev);
        }
      } catch (e) { /* no release yet */ }

      // 7) Postmortem request lifecycle (Postmortem tab + Audit Log trail)
      try {
        const pmReqRes = await axios.get(`${env.FULL_API_URL}/postmortem-requests`, {
          headers,
          params: { deceased_id: deceasedId },
        });
        if (Array.isArray(pmReqRes.data?.data)) setRequests(pmReqRes.data.data);
      } catch (e) { /* no tracked requests yet */ }

    } catch (err) {
      console.error('Error fetching deceased detail:', err);
      showToast.error('Failed to load deceased details');
    } finally {
      setLoading(false);
    }
  }, [deceasedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const switchTab = (key) => setActiveTab(key);

  const totalCharges = charges.reduce((s, c) => s + (parseFloat(c.amount || c.charge_amount || 0)), 0);
  const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount || 0)), 0);
  const balance = totalCharges - totalPaid;

  if (loading) {
    return (
      <>
        <GlobalFonts />
        <AppContainer>
          <LoadingState><div className="spinner" /> Loading deceased details...</LoadingState>
        </AppContainer>
      </>
    );
  }

  return (
    <>
      <GlobalFonts />
      <AppContainer>
        <ToastContainer position="top-right" />

        <DeceasedProfileHeader
          deceased={deceased}
          onBack={() => { const slug = getTenantSlug(); navigate(`/tenant/${slug}/all-deceased`); }}
          onTabSwitch={switchTab}
          onChargeSettingsClick={() => setShowChargeModal(true)}
        />

        <ProfileLayout>
          <MainContent>
            <Tabs>
              {TABS.map(tab => (
                <TabBtn key={tab.key} $active={activeTab === tab.key} onClick={() => switchTab(tab.key)}>
                  {tab.label}
                </TabBtn>
              ))}
            </Tabs>

            <TabContent>
              <TabPane $active={activeTab === 'overview'}>
                <OverviewTab deceased={deceased} nextOfKin={nextOfKin} />
              </TabPane>

              <TabPane $active={activeTab === 'postmortem'}>
                <PostmortemTab postmortem={postmortem} deceasedId={deceasedId} deceasedName={deceased?.full_name || deceased?.name || ''} deceasedAdmission={deceased?.admission_number || deceased?.admission_no || ''} requests={requests} onRequestsChanged={fetchData} />
              </TabPane>

              <TabPane $active={activeTab === 'financials'}>
                <FinancialsTab charges={charges} payments={payments} deceasedId={deceasedId} />
              </TabPane>

              <TabPane $active={activeTab === 'release'}>
                <ReleaseTab deceased={deceased} nextOfKin={nextOfKin} deceasedId={deceasedId} />
              </TabPane>

              <TabPane $active={activeTab === 'docs'}>
                <DocumentsTab documents={deceased?.documents} deceasedId={deceasedId} />
              </TabPane>

              <TabPane $active={activeTab === 'audit'}>
                <AuditLogTab
                  deceased={deceased}
                  postmortem={postmortem}
                  charges={charges}
                  payments={payments}
                  releaseData={deceased?.releaseData || null}
                  requests={requests}
                />
              </TabPane>
            </TabContent>
          </MainContent>

          <DeceasedSidebar
            deceased={deceased}
            postmortem={postmortem}
            bodyStatus={deceased?.body_status || deceased?.status || 'In Morgue'}
            totalCharges={totalCharges}
            balance={balance}
            age={deceased?.age}
          />
        </ProfileLayout>

        {showChargeModal && (
          <ChargeSettingsModal
            isOpen={showChargeModal}
            onClose={() => setShowChargeModal(false)}
            deceasedId={deceasedId}
            deceasedData={deceased}
            onUpdate={fetchData}
          />
        )}
      </AppContainer>
    </>
  );
};

export default DeceasedDetailPage;