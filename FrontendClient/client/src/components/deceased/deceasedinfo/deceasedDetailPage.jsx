import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
import ScanDocumentModal from '../../scanner/ScanDocumentModal';
import OverviewTab from './OverviewTab';
import AuditLogTab from './AuditLogTab';
import ReleaseTab from './ReleaseTab';
import axios from 'axios';

// ── In-memory cache for deceased records (avoids refetch on navigation) ──
const _deceasedCache = new Map();
const CACHE_TTL = 30_000; // 30 seconds
function _getCached(key) {
  const hit = _deceasedCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  return null;
}
function _setCache(key, data) {
  _deceasedCache.set(key, { ts: Date.now(), data });
}


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
  padding: 1rem; /* Base padding for mobile */
  
  @media (min-width: 900px) {
    padding: 2rem; /* Desktop padding */
  }
`;

const ProfileLayout = styled.div`
  display: grid; 
  grid-template-columns: 1fr; /* Mobile first: single column */
  gap: 2rem; 
  align-items: flex-start;
  
  @media (min-width: 900px) { 
    grid-template-columns: 1fr 320px; 
    gap: 4rem;
  }
`;

const MainContent = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0; /* Remove fixed padding for mobile, rely on AppContainer */
  
  @media (min-width: 900px) {
    padding: 2rem 1rem; /* Add some breathing room on desktop */
  }
`;

const Tabs = styled.div`
  display: flex; 
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Safari and Chrome */
  }

  @media (min-width: 900px) {
    margin-bottom: 2.5rem;
  }
`;

const TabBtn = styled.button`
  padding: 0.75rem 0; 
  margin-right: 1.5rem;
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

  @media (min-width: 900px) {
    padding: 1rem 0;
    margin-right: 2.5rem;
  }
`;

const TabContent = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (min-width: 900px) {
    gap: 2.5rem;
  }
`;

const TabPane = styled.div`
  display: ${p => p.$active ? 'grid' : 'none'}; 
  gap: 1.5rem;
  animation: ${fadeIn} 0.2s ease;

  @media (min-width: 900px) {
    gap: 2.5rem;
  }
`;

const LoadingState = styled.div`
  text-align: center; 
  padding: 5rem 0; 
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
  
  @media (min-width: 900px) {
    padding: 10rem 0;
  }
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
  // Read the deceased identifier from the query string (?id=XXX); fall back to
  // the path param so legacy /deceased/XXX links keep working.
  const [searchParams] = useSearchParams();
  const pathParams = useParams();
  let deceasedId = searchParams.get('id') || pathParams.id;
  // NOTE: Do NOT strip '=' from the ID — deceased_id values like
  // 'MON-NYAFHJEW39J6FURJG6H=2026' contain '=' as part of the identifier.
  // The URL-encoded form is '%3D' and searchParams.get() already decodes it.
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
  const [showScanModal, setShowScanModal] = useState(false);

  // Ref to track mounted state (avoids setState on unmount)
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ─── Deceased profiles must never be indexed by search engines ────
  useEffect(() => {
    const ROBOTS_CONTENT = 'noindex, nofollow, noarchive';
    let meta = document.querySelector('meta[name="robots"]');
    const previous = meta ? meta.getAttribute('content') : null;
    if (meta) {
      meta.setAttribute('content', ROBOTS_CONTENT);
    } else {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = ROBOTS_CONTENT;
      document.head.appendChild(meta);
    }
    return () => {
      if (previous !== null) meta.setAttribute('content', previous);
      else meta.remove();
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!deceasedId) return;

    const safeDeceasedId = encodeURIComponent(deceasedId);
    const cacheKey = `${deceasedId}-${getTenantSlug()}`;

    // Clear cache on force refresh
    if (forceRefresh) {
      _deceasedCache.delete(cacheKey);
    }

    if (!forceRefresh) {
      const cached = _getCached(cacheKey);
      if (cached) {
        if (cached.deceased) setDeceased(cached.deceased);
        if (cached.nextOfKin) setNextOfKin(cached.nextOfKin);
        if (cached.postmortem) setPostmortem(cached.postmortem);
        if (cached.charges) setCharges(cached.charges);
        if (cached.payments) setPayments(cached.payments);
        if (cached.requests) setRequests(cached.requests);
        setLoading(false);
        return;
      }
    } else {
      _deceasedCache.delete(cacheKey);
    }

    setLoading(true);
    try {
      const slug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const headers = {
        'x-tenant-slug': slug,
        'Authorization': `Bearer ${token}`,
      };

      // Fire ALL API calls in parallel — no waterfall
      const results = await Promise.allSettled([
        axios.get(`${BASE_URL}/${safeDeceasedId}`, { headers }),
        axios.get(`${BASE_URL}/postmortem/${safeDeceasedId}`, { headers }).catch(() => null),
        axios.get(`${BASE_URL}/${safeDeceasedId}/next-of-kin`, { headers }).catch(() => null),
        axios.get(`${env.FULL_API_URL}/documents/${safeDeceasedId}`, {
          headers: { 'x-tenant-slug': slug, 'Authorization': token ? `Bearer ${token}` : '' },
          withCredentials: false
        }).catch(() => null),
        axios.get(`${BASE_URL}/billing-summary/${safeDeceasedId}`, { headers }).catch(() => null),
        axios.get(`${BASE_URL}/charge-settings/${safeDeceasedId}`, { headers }).catch(() => null),
        axios.get(`${env.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(deceasedId)}`, { headers }).catch(() => null),
        axios.get(`${env.FULL_API_URL}/postmortem-requests`, { headers, params: { deceased_id: deceasedId } }).catch(() => null),
      ]);

      if (!mounted.current) return;
      const [decRes, pmRes, nokRes, docRes, billRes, csRes, relRes, pmReqRes] = results;
      // 1) Process deceased core info
      let admissionNo = deceasedId;
      if (decRes.status === 'fulfilled' && decRes.value?.data?.data) {
        const backendData = decRes.value.data.data;
        admissionNo = backendData.admission_number || backendData.admission_no || deceasedId;
        const mappedData = {
          ...backendData,
          admission_no: backendData.admission_number,
          admission_time: backendData.time_received,
          admitted_by: backendData.receiving_officer,
          time_of_death: null,
          attending_physician: backendData.physician,
          embalmed: backendData.admission_status === 'embalmed',
          embalmed_date: null,
          storage_location: backendData.chamber_assigned,
          morgue_slot: backendData.chamber_assigned,
          body_condition: backendData.body_status,
          tel_number: backendData.phone_number,
          tell_no: backendData.phone_number,
        };
        setDeceased(mappedData);
      }

      // 2) Postmortem
      if (pmRes.status === 'fulfilled' && pmRes.value?.data?.data) {
        setPostmortem(pmRes.value.data.data);
      }

      // 3) Next of kin (with fallback to deceased fields)
      let nokSet = false;
      if (nokRes.status === 'fulfilled' && nokRes.value) {
        const nokList = Array.isArray(nokRes.value.data?.data) ? nokRes.value.data.data : (nokRes.value.data?.data ? [nokRes.value.data.data] : []);
        if (nokList.length > 0) { setNextOfKin(nokList[0]); nokSet = true; }
      }
      if (!nokSet && decRes.status === 'fulfilled') {
        const src = decRes.value?.data?.data;
        if (src && (src.contact_person || src.phone_number || src.relationship || src.national_id)) {
          setNextOfKin({
            full_name: src.contact_person || '', relationship: src.relationship || '',
            contact: src.tel_number || src.phone_number || '', alternative_contact: src.alternative_phone || '',
            id_number: src.national_id || '', email: src.email || '', is_primary: 1, _synthetic: true,
          });
        }
      }

      // 4) Documents
      if (docRes.status === 'fulfilled' && docRes.value) {
        if (docRes.value.data?.files) {
          const formattedDocs = docRes.value.data.files.map(f => ({
            name: f.originalName, file_name: f.storedName || f.originalName, type: f.category || 'Document',
            created_at: f.uploadedAt || f.uploaded_at, document_id: f.documentId, url: f.url
          }));
          setDeceased(prev => prev ? { ...prev, documents: formattedDocs } : prev);
        } else if (docRes.value.data?.data) {
          setDeceased(prev => prev ? { ...prev, documents: docRes.value.data.data } : prev);
        }
      }

      // 5) Charges / billing
      if (billRes.status === 'fulfilled' && billRes.value?.data?.data) {
        const bd = billRes.value.data.data;
        if (bd.charges) setCharges(Array.isArray(bd.charges) ? bd.charges : [bd.charges]);
        if (bd.payments) setPayments(Array.isArray(bd.payments) ? bd.payments : [bd.payments]);
        else setPayments([]);
      } else {
        setCharges([]);
        setPayments([]);
      }

      // 6) Charge settings
      if (csRes.status === 'fulfilled' && csRes.value?.data?.data) {
        const cs = csRes.value.data.data;
        setDeceased(prev => prev ? { ...prev, charges: {
          storage_rate: parseFloat(cs.dailyRate ?? cs.daily_rate ?? cs.storage_rate ?? cs.per_day ?? prev?.charges?.storage_rate ?? 500),
          per_day: parseFloat(cs.dailyRate ?? cs.daily_rate ?? prev?.charges?.per_day ?? 500),
          per_hour: parseFloat(cs.hourlyRate ?? cs.hourly_rate ?? prev?.charges?.per_hour ?? 125),
          currency: cs.currency ?? prev?.charges?.currency ?? 'KES',
          rate_profile: cs.rateProfile ?? cs.rate_profile ?? 'standard',
          charge_type: cs.chargeType ?? cs.charge_type ?? 'daily',
          usd_rate: parseFloat(cs.usdRate ?? cs.usd_rate ?? prev?.charges?.usd_rate ?? 130),
          updated_at: cs.updatedAt ?? cs.updated_at ?? null
        }} : prev);
      }

      // 7) Release data
      if (relRes.status === 'fulfilled' && relRes.value?.data?.data) {
        setDeceased(prev => prev ? { ...prev, releaseData: relRes.value.data.data } : prev);
      }   

      // 8) Postmortem requests
      if (pmReqRes.status === 'fulfilled' && Array.isArray(pmReqRes.value?.data?.data)) {
        setRequests(pmReqRes.value.data.data);
      }   

      // Cache for instant repeat loads
      _setCache(cacheKey, {
        deceased: decRes.status === 'fulfilled' ? decRes.value?.data?.data : null,
        nextOfKin: nokRes.status === 'fulfilled' ? (Array.isArray(nokRes.value?.data?.data) ? nokRes.value.data.data[0] : nokRes.value?.data?.data) : null,
        postmortem: pmRes.status === 'fulfilled' ? pmRes.value?.data?.data : null,
        charges: billRes.status === 'fulfilled' ? (billRes.value?.data?.data?.charges || []) : [],
        payments: billRes.status === 'fulfilled' ? (billRes.value?.data?.data?.payments || []) : [],
        requests: pmReqRes.status === 'fulfilled' ? (pmReqRes.value?.data?.data || []) : [],
      });

    } catch (err) {
      console.error('Error fetching deceased detail:', err);
      showToast.error('Failed to load deceased details');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [deceasedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    if (!deceasedId) return;
    try {
      setLoading(true);
      await fetchData(true);
      showToast('Deceased profile refreshed', 'success');
    } catch (err) {
      console.error('Error refreshing deceased profile:', err);
      showToast('Failed to refresh deceased profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [deceasedId, fetchData]);

  const switchTab = (key) => setActiveTab(key);

  // ── Memoized derived values (avoid recalculation on every render) ──
  const totalCharges = useMemo(() => charges.reduce((s, c) => s + (parseFloat(c.amount || c.charge_amount || 0)), 0), [charges]);
  const totalPaid = useMemo(() => payments.reduce((s, p) => s + (parseFloat(p.amount || 0)), 0), [payments]);
  const balance = totalCharges - totalPaid;
  // Uploads and document records use the canonical public deceased_id. The
  // route may contain a numeric database id or another legacy identifier.
  const documentDeceasedId = deceased?.deceased_id || deceased?.deceasedId || deceasedId;

  // ── Show content immediately — no blocking loader ──
  // The page renders instantly from cache/previous data, then updates when fresh data arrives
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
          onRefresh={handleRefresh}
          onScanClick={() => setShowScanModal(true)}
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
                <DocumentsTab documents={deceased?.documents} deceasedId={documentDeceasedId} />
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
            totalPaid={totalPaid}
            balance={balance}
            age={deceased?.age}
          />
        </ProfileLayout>

        {showScanModal && (
          <ScanDocumentModal
            deceasedId={documentDeceasedId}
            deceasedName={deceased?.full_name || deceased?.name || ''}
            onClose={() => setShowScanModal(false)}
            onScanned={() => { setShowScanModal(false); fetchData(); }}
          />
        )}

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