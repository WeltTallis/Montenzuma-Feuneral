import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { getTenantSlug, getAuthToken, getBranchScopeHeaders } from '../../../utils/globalAuth';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../utils/context/socketContext';

// Import your existing sub-components
import ScanDocumentModal from '../../scanner/ScanDocumentModal';
import DeceasedProfileHeader from './DeceasedProfileHeader';
import ChargeSettingsModal from '../charges/ChargeSettingsModal';
import DeceasedSidebar from './DeceasedSidebar';
import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import env from '../../../utils/config/env';
import PostmortemTab from './PostmortemTab';
import FinancialsTab from './FinancialsTab';
import DocumentsTab from './DocumentsTab';
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

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

const AppContainer = styled.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a; 
  font-size: 14px; 
  line-height: 1.5;
  max-width: 2200px;
  margin: 0 auto; 
  background: rgb(255, 255, 255);
  animation: ${fadeIn} 0.25s ease-out;
  padding: 1rem; /* Base padding for mobile */
  box-sizing: border-box;
  /* Safety net: a wide table must never push the whole page sideways. Every
     table is additionally wrapped in its own scroll box (see the tab files),
     but this guarantees the viewport itself never gains a scrollbar. */
  overflow-x: hidden;
  max-width: 100%;
  
  @media (min-width: 900px) {
    padding: 2rem; /* Desktop padding */
  }
`;

const ProfileLayout = styled.div`
  display: grid; 
  grid-template-columns: 1fr; /* Mobile first: single column */
  gap: 2rem; 
  align-items: flex-start;
  /* Without this the grid track is sized by its widest child, so a wide table
     inside MainContent would stretch the whole row past the viewport. */
  min-width: 0;
  max-width: 100%;
  
  @media (min-width: 900px) { 
    grid-template-columns: minmax(0, 1fr) 320px; 
    gap: 4rem;
  }
`;

const MainContent = styled.div`
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 0; /* Remove fixed padding for mobile, rely on AppContainer */
  
  @media (min-width: 900px) {
    padding: 1rem    1rem;                                     
  }
`;

/* ── Tab bar ──────────────────────────────────────────────────────────────
   On a phone the six tabs simply do not fit on one line, and the old
   `overflow-x: auto` + hidden-scrollbar approach made the cut-off tabs look
   like a broken page. Below 900px they become a 3 x 2 grid so every tab is
   visible and tappable without any horizontal scrolling at all. */
const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 1.5rem;
  
  @media (min-width: 900px) {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #f0f0f0;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Hide scrollbar for Firefox */
    margin-bottom: 2.5rem;
  }
  
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Safari and Chrome */
  }
`;

const TabBtn = styled.button`
  padding: 0.6rem 0.25rem;
  background: none; 
  border: none; 
  cursor: pointer;
  font-size: 0.8rem; 
  font-weight: 600; 
  color: #888888;
  border-bottom: 2px solid transparent; 
  white-space: nowrap;
  transition: all 0.15s ease; 
  font-family: 'Source Sans 3', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
  border-radius: 6px;
  overflow-wrap: anywhere;
  
  &:hover { color: #1a1a1a; }

  /* Active state: a filled pill on mobile, an underline from 900px up. */
  ${p => p.$active && `
    color: #0a0a0a;
    background: #f0f0f0;
  `}
  
  @media (min-width: 900px) {
    padding: 1rem 0;
    margin-right: 2.5rem;
    justify-content: flex-start;
    text-align: left;
    border-radius: 0;
    overflow-wrap: normal;
    flex-shrink: 0;
    ${p => p.$active && `
      background: none;
      border-bottom-color: #0a0a0a;
    `}
  }
`;

const TabContent = styled.div`
  display: grid;
  gap: 1.5rem;
  /* Grid/flex children default to min-width:auto, so a wide child (a table
     with white-space:nowrap) would stretch this box past the viewport and push
     the whole page sideways. min-width:0 lets the child's own overflow-x
     scroll container do its job instead. */
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;

  @media (min-width: 900px) {
    gap: 2.5rem;
  }
`;

const TabPane = styled.div`
  display: ${p => p.$active ? 'grid' : 'none'}; 
  gap: 1.5rem;
  animation: ${fadeIn} 0.2s ease;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;

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
  { key: 'intake', label: 'Intake' },
  { key: 'release', label: 'Release' },
  { key: 'postmortem', label: 'Postmortem' },
  { key: 'financials', label: 'Financials' },
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
  const location = useLocation();
  const { socket } = useSocket();
  const profileBranchSlug = searchParams.get('branch') || location.state?.profileBranchSlug || getTenantSlug();
  const [activeTab, setActiveTab] = useState('intake');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
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

  const fetchData = useCallback(async (forceRefresh = false, silent = false) => {
    if (!deceasedId) return false;

    const safeDeceasedId = encodeURIComponent(deceasedId);
    const cacheKey = `${deceasedId}-${profileBranchSlug}`;

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
        return true;
      }
    } else {
      _deceasedCache.delete(cacheKey);
    }

    setLoading(true);
    try {
      const slug = profileBranchSlug;
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      // `x-tenant-slug` selects the DATABASE the deceased-service reads; for a
      // branch user it must be the BRANCH slug (each branch owns its own DB).
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...getBranchScopeHeaders(slug),
        'x-tenant-slug': slug,
        'x-branch-slug': slug,
        'x-branch-db': slug,
      };

      // Fire ALL API calls in parallel — no waterfall
      const results = await Promise.allSettled([
        axios.get(`${BASE_URL}/${safeDeceasedId}`, { headers }),
        axios.get(`${BASE_URL}/postmortem/${safeDeceasedId}`, { headers }).catch(() => null),
        axios.get(`${BASE_URL}/${safeDeceasedId}/next-of-kin`, { headers }).catch(() => null),
        axios.get(`${env.FULL_API_URL}/documents/${safeDeceasedId}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '', ...getBranchScopeHeaders(slug) },
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
      //
      // GET /deceased/:id already returns a fully resolved `charges` block
      // (per-day AND per-hour rates plus `source`/`is_default` telling us
      // whether the record owns its rates or inherits the home default). This
      // second fetch exists only to pick up edits made from the Charge Settings
      // panel. It therefore has to MERGE, not rebuild.
      //
      // It used to rebuild the object from scratch and, in doing so, dropped
      // `source`/`is_default` and invented 500/125 fallbacks for every missing
      // value. The sidebar labels a record "Deceased-specific" purely from
      // those two flags, so every inherited (home default) rate got mislabelled
      // as deceased-specific — and a per-hour configuration still displayed the
      // daily figure because `storage_rate` was always taken from dailyRate.
      if (csRes.status === 'fulfilled' && csRes.value?.data?.data) {
        const cs = csRes.value.data.data;
        // `exists === false` means there is no row for this deceased AND no home
        // default either. Keep whatever GET /deceased/:id resolved (i.e. leave
        // the charges block untouched) instead of overwriting it with defaults.
        if (cs.exists !== false) {
          const csChargeType = String(cs.chargeType ?? cs.charge_type ?? 'daily').toLowerCase() === 'hourly'
            ? 'hourly'
            : 'daily';
          const csDaily = Number(cs.dailyRate ?? cs.daily_rate ?? cs.per_day ?? 0) || 0;
          const csHourly = Number(cs.hourlyRate ?? cs.hourly_rate ?? cs.per_hour ?? 0) || 0;
          setDeceased(prev => {
            if (!prev) return prev;
            // Provenance comes from this endpoint too, so a rate saved for THIS
            // deceased right after the panel closes is labelled correctly too.
            const csIsDefault = Boolean(cs.isDefault ?? cs.is_default ?? prev?.charges?.is_default);
            const csSource = cs.source ?? (csIsDefault ? 'home_default' : 'deceased_specific');
            return {
              ...prev,
              charges: {
                ...(prev.charges || {}),
                storage_rate: csChargeType === 'hourly' ? csHourly : csDaily,
                per_day: csDaily,
                per_hour: csHourly,
                currency: cs.currency ?? prev?.charges?.currency ?? 'KES',
                rate_profile: cs.rateProfile ?? cs.rate_profile ?? prev?.charges?.rate_profile ?? 'standard',
                charge_type: csChargeType,
                usd_rate: Number(cs.usdRate ?? cs.usd_rate ?? prev?.charges?.usd_rate ?? 130),
                updated_at: cs.updatedAt ?? cs.updated_at ?? prev?.charges?.updated_at ?? null,
                is_default: csIsDefault,
                source: csSource,
              }
            };
          });
        }
      }

      // 7) Release data. The route id is often the public deceased_id, while
      // body_releases is keyed by admission_number; use the admission number
      // from the freshly loaded profile as the authoritative fallback.
      let releaseData = relRes.status === 'fulfilled' && relRes.value?.data?.data
        ? relRes.value.data.data
        : null;
      if (!releaseData && admissionNo) {
        try {
          const admissionReleaseRes = await axios.get(
            `${env.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(admissionNo)}`,
            { headers }
          );
          if (admissionReleaseRes.data?.success && admissionReleaseRes.data?.data) {
            releaseData = admissionReleaseRes.data.data;
          }
        } catch {
          // A missing release is a valid state for an in-care profile.
        }
      }
      if (releaseData) {
        setDeceased(prev => prev ? { ...prev, releaseData } : prev);
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

      // Bump the tab-level version after a forced profile fetch. ReleaseTab owns
      // a separate release lookup, so it must be told to discard any previous
      // result as well as the parent cache.
      if (forceRefresh && mounted.current) {
        setRefreshVersion(version => version + 1);
      }

      return true;
    } catch (err) {
      console.error('Error fetching deceased detail:', err);
      if (!silent) showToast.error('Failed to load deceased details');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [deceasedId, profileBranchSlug]);

  useEffect(() => { fetchData(true, true); }, [fetchData]);

  useEffect(() => {
    if (!deceasedId) return undefined;
    let refreshTimer = null;
    const refreshQuietly = () => {
      if (document.visibilityState !== 'visible') return;
      fetchData(true, true);
    };
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshQuietly();
      }, 350);
    };
    const events = [
      'notification:deceased-admitted', 'deceased-admitted',
      'notification:deceased-removed', 'deceased-removed',
      'notification:deceased-updated', 'deceased-updated',
      'notification:body-released', 'body-released',
      'notification:postmortem-request', 'postmortem-request',
      'notification:postmortem-update', 'postmortem-update',
      'notification:payment-updated', 'payment-updated',
      'notification:charge-updated', 'charge-updated',
    ];
    events.forEach((event) => socket?.on?.(event, scheduleRefresh));

    const interval = setInterval(refreshQuietly, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshQuietly();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      if (refreshTimer) clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', onVisible);
      events.forEach((event) => socket?.off?.(event, scheduleRefresh));
    };
  }, [deceasedId, socket, fetchData]);

  const handleRefresh = useCallback(async () => {
    if (!deceasedId || refreshing) return;
    setRefreshing(true);
    try {
      // forceRefresh = true → drops the in-memory cache and re-hits every endpoint
      const ok = await fetchData(true);
      if (ok) {
        showToast.success('Deceased profile refreshed');
      } else {
        showToast.error('Failed to refresh deceased profile');
      }
    } catch (err) {
      console.error('Error refreshing deceased profile:', err);
      showToast.error('Failed to refresh deceased profile');
    } finally {
      setRefreshing(false);
    }
  }, [deceasedId, fetchData, refreshing]);

  const scheduleDispatch = useCallback(async (dispatchDate, notes) => {
    if (!deceasedId) {
      showToast.error('No deceased ID found');
      return;
    }
    try {
      const response = await axios.post(
        `${env.FULL_API_URL}/deceased/${deceasedId}/schedule-dispatch`,
        { dispatchDate, notes },
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'x-tenant-slug': localStorage.getItem('tenantSlug') || sessionStorage.getItem('tenantSlug'),
            'x-branch-slug': localStorage.getItem('branchSlug') || sessionStorage.getItem('branchSlug'),
          },
        }
      );
      if (response.data?.success) {
        showToast.success('Dispatch scheduled successfully');
        await fetchData(true);
      } else {
        showToast.error(response.data?.message || 'Failed to schedule dispatch');
      }
    } catch (err) {
      console.error('Error scheduling dispatch:', err);
      showToast.error('Failed to schedule dispatch');
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
      <AppContainer>
        <ToastContainer position="top-right" />

        <DeceasedProfileHeader
          deceased={deceased}
          nextOfKin={nextOfKin}
          onBack={() => {
            if (location.state?.from) {
              navigate(location.state.from);
              return;
            }
            navigate(`/${profileBranchSlug}/all-deceased`);
          }}
          onTabSwitch={switchTab}
          onChargeSettingsClick={() => setShowChargeModal(true)}
          scheduleDispatch={scheduleDispatch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
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
              <TabPane $active={activeTab === 'intake'}>
                <OverviewTab deceased={deceased} nextOfKin={nextOfKin} />
              </TabPane>

              <TabPane $active={activeTab === 'release'}>
                <ReleaseTab deceased={deceased} deceasedId={deceasedId} refreshVersion={refreshVersion} branchSlug={profileBranchSlug} />
              </TabPane>

              <TabPane $active={activeTab === 'postmortem'}>
                <PostmortemTab postmortem={postmortem} deceasedId={deceasedId} deceasedName={deceased?.full_name || deceased?.name || ''} deceasedAdmission={deceased?.admission_number || deceased?.admission_no || ''} requests={requests} onRequestsChanged={() => fetchData(true)} branchSlug={profileBranchSlug} refreshVersion={refreshVersion} />
              </TabPane>

              <TabPane $active={activeTab === 'financials'}>
                <FinancialsTab charges={charges} payments={payments} deceasedId={deceasedId} deceased={deceased} onDataChanged={() => fetchData(true)} branchSlug={profileBranchSlug} refreshVersion={refreshVersion} />
              </TabPane>

              <TabPane $active={activeTab === 'docs'}>
                <DocumentsTab documents={deceased?.documents} deceasedId={documentDeceasedId} branchSlug={profileBranchSlug} refreshVersion={refreshVersion} />
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