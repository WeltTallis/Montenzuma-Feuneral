import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AlertCircle,
  CarFront,
  CheckCircle2,
  CreditCard,
  MapPin,
  RefreshCw,
  Search,
  Settings2,
  Truck,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import env from '../../utils/config/env';
import { getTenantHeaders } from '../../api/endpoints';
import notify from '../../utils/notify';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const STATUS_META = {
  available: { label: 'Available', color: 'green' },
  booked: { label: 'Booked', color: 'gold' },
  in_transit: { label: 'In transit', color: 'blue' },
  maintenance: { label: 'Maintenance', color: 'red' },
  out_of_service: { label: 'Out of service', color: 'gray' },
  disabled: { label: 'Out of service', color: 'gray' },
  pending_inspection: { label: 'Pending inspection', color: 'gold' },
};

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_service', label: 'Out of service' },
];

const statusKey = (status) => {
  const normalized = String(status || '').toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (['off_duty', 'out_of_service'].includes(normalized)) return 'out_of_service';
  return normalized || 'unknown';
};

const statusMeta = (status) => STATUS_META[statusKey(status)] || {
  label: String(status || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  color: 'gray',
};

const imageUrl = (image) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  const apiRoot = API_BASE_URL.replace(/\/api\/v1\/restpoint\/?$/, '');
  return `${apiRoot}/${String(image).replace(/^\/+/, '')}`;
};

const formatKES = (amount) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(amount) || 0);

const todayDate = () => new Date().toISOString().slice(0, 10);

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...getTenantHeaders(), ...(options.headers || {}) },
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(response.ok ? 'Service returned an invalid response.' : `Request failed (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  }
  return payload;
};

const FleetPage = styled.main`
  min-height: ${({ $embedded }) => ($embedded ? '100%' : '100vh')};
  padding: ${({ $embedded }) => ($embedded ? '24px 28px 36px' : '28px')};
  background: ${({ $embedded }) => ($embedded ? 'transparent' : '#f4f5f8')};
  color: #1a1d29;

  @media (max-width: 700px) { padding: ${({ $embedded }) => ($embedded ? '18px 16px 28px' : '16px')}; }
`;

const PageWidth = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const HeaderIcon = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 14px;
  background: #1a1d29;
  color: #f4d03f;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(22px, 3vw, 30px);
  letter-spacing: -0.04em;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid ${({ $primary }) => ($primary ? '#1a1d29' : '#e1e4e9')};
  border-radius: 10px;
  background: ${({ $primary }) => ($primary ? '#1a1d29' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#343946')};
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  &:focus-visible { outline: 2px solid #315f95; outline-offset: 2px; }
  transition: transform .15s ease, background .15s ease;
  &:hover { transform: translateY(-1px); background: ${({ $primary }) => ($primary ? '#2b3040' : '#f8f8fa')}; }
  &:disabled { opacity: .55; cursor: wait; transform: none; }
`;

const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 92px;
  padding: 17px;
  border: 1px solid #e7e9ee;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 8px #1a1d2908;
`;

const SummaryIcon = styled.span`
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: ${({ $tone }) => $tone === 'gold' ? '#fff7d6' : $tone === 'green' ? '#eaf8ef' : $tone === 'red' ? '#fff0ef' : '#eef2f8'};
  color: ${({ $tone }) => $tone === 'gold' ? '#9d7600' : $tone === 'green' ? '#16824b' : $tone === 'red' ? '#bd4237' : '#44516b'};
`;

const SummaryValue = styled.div`
  font-size: 24px;
  line-height: 1.1;
  font-weight: 750;
  letter-spacing: -0.04em;
`;

const SummaryLabel = styled.div`
  margin-top: 4px;
  color: #737987;
  font-size: 12px;
`;

const MainGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(330px, 410px) minmax(0, 1fr);
  min-height: 620px;
  overflow: hidden;
  border: 1px solid #e5e7ec;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 28px #1a1d2908;
  @media (max-width: 900px) { grid-template-columns: minmax(0, 1fr); }
`;

const FleetList = styled.div`
  min-width: 0;
  border-right: 1px solid #e8e9ed;
  @media (max-width: 900px) { border-right: 0; border-bottom: 1px solid #e8e9ed; }
`;

const ListHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eceef2;
`;

const ListTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  h2 { margin: 0; font-size: 17px; letter-spacing: -.02em; }
  span { color: #767c89; font-size: 12px; }
`;

const SearchBox = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 11px;
  border: 1px solid #e2e5eb;
  border-radius: 9px;
  color: #848b98;
  input { width: 100%; border: 0; outline: 0; background: transparent; color: #252a36; font: inherit; font-size: 13px; }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 7px;
  margin-top: 12px;
  overflow-x: auto;
`;

const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 0;
  border-radius: 20px;
  background: ${({ $active }) => ($active ? '#1a1d29' : '#f0f1f4')};
  color: ${({ $active }) => ($active ? '#fff' : '#646a76')};
  font: inherit;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
`;

const HearseList = styled.div`
  max-height: 670px;
  overflow-y: auto;
  padding: 12px;
`;

const HearseCard = styled.div`
  display: flex;
  width: 100%;
  min-height: 100px;
  margin-bottom: 9px;
  padding: 0;
  overflow: hidden;
  border: 1px solid ${({ $selected }) => ($selected ? '#e5c531' : '#e8e9ed')};
  border-radius: 12px;
  background: #fff;
  box-shadow: ${({ $selected }) => ($selected ? '0 0 0 2px #f4d03f30' : 'none')};
  color: #202432;
  text-align: left;
  cursor: pointer;
  &:hover { border-color: ${({ $selected }) => ($selected ? '#e5c531' : '#c9cdd5')}; }
`;

const HearseCardText = styled.div`
  display: block;
  flex: 1;
  min-width: 0;
  padding: 13px 14px;
`;

const HearseCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Plate = styled.strong`
  display: block;
  font-size: 15px;
  letter-spacing: .015em;
`;

const CardName = styled.span`
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #747a87;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 5px 8px;
  border-radius: 20px;
  background: ${({ $tone }) => $tone === 'green' ? '#e9f7ef' : $tone === 'gold' ? '#fff6d8' : $tone === 'blue' ? '#eaf2ff' : $tone === 'red' ? '#fff0ef' : '#f0f1f4'};
  color: ${({ $tone }) => $tone === 'green' ? '#187847' : $tone === 'gold' ? '#856500' : $tone === 'blue' ? '#315b9d' : $tone === 'red' ? '#b83f37' : '#626875'};
  font-size: 10px;
  font-weight: 700;
`;

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  color: #747a87;
  font-size: 11px;
  span { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
  svg { flex: 0 0 auto; }
`;

const CardBalance = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  strong { color: #252a36; font-size: 13px; font-variant-numeric: tabular-nums; }
  span { color: ${({ $low }) => ($low ? '#b45309' : '#747a87')}; font-size: 10px; font-weight: 700; }
`;

const CardChart = styled.div`
  height: 112px;
  margin-top: 8px;
  padding: 7px 6px 2px;
  border: 1px solid #edf0f3;
  border-radius: 9px;
  background: #fbfcfd;
`;

const CardChartLabel = styled.div`
  margin: 0 0 2px 4px;
  color: #747a87;
  font-size: 9px;
  font-weight: 700;
`;

const CardChartEmpty = styled.div`
  display: grid;
  height: 80px;
  place-items: center;
  color: #818794;
  font-size: 10px;
  text-align: center;
`;

const VehicleThumb = styled.span`
  display: grid;
  width: 88px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  background: #f5f6f8;
  color: #747a87;
  img { width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 520px) { width: 64px; }
`;

const Details = styled.div`
  min-width: 0;
  padding: 22px;
  background: #f7f8fa;
  @media (max-width: 600px) { padding: 15px; }
`;

const DetailCard = styled.section`
  margin-bottom: 14px;
  padding: 19px;
  border: 1px solid #e7e9ee;
  border-radius: 14px;
  background: #fff;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const VehicleIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const VehicleMark = styled.div`
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  background: #f4d03f;
  color: #1a1d29;
`;

const DetailTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  letter-spacing: -.035em;
`;

const DetailSub = styled.p`
  margin: 4px 0 0;
  color: #707684;
  font-size: 12px;
`;

const FactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
  @media (max-width: 650px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const Fact = styled.div`
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: #f6f7f9;
  span { display: block; color: #818794; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
  strong { display: block; margin-top: 5px; overflow: hidden; color: #282d39; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
`;

const Empty = styled.div`
  display: grid;
  min-height: 220px;
  place-items: center;
  align-content: center;
  gap: 9px;
  padding: 24px;
  color: #7c8290;
  text-align: center;
  svg { color: #a8adba; }
  strong { color: #3e4350; font-size: 14px; }
  span { max-width: 320px; font-size: 12px; line-height: 1.5; }
`;

const InlineAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #f0c9c5;
  border-radius: 10px;
  background: #fff5f4;
  color: #a1372f;
  font-size: 13px;
`;

const StatusEditor = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;
  select { min-height: 38px; padding: 0 10px; border: 1px solid #e0e3e8; border-radius: 9px; background: #fff; color: #343946; font: inherit; font-size: 12px; }
`;

const FuelCardEditor = styled.form`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #eff0f3;
  color: #777e8b;
  svg { flex: 0 0 auto; }
  label { display: flex; flex: 1; flex-direction: column; gap: 5px; min-width: 0; }
  label span { color: #626977; font-size: 11px; font-weight: 700; }
  input { width: 100%; min-height: 38px; padding: 0 10px; border: 1px solid #e0e3e8; border-radius: 9px; background: #fff; color: #343946; font: inherit; font-size: 12px; }
  @media (max-width: 520px) { align-items: stretch; flex-wrap: wrap; label { flex-basis: 100%; } }
`;

const FuelPanel = styled.section`
  margin-top: 18px;
  padding: 17px;
  border: 1px solid #e7e9ee;
  border-radius: 12px;
  background: #fff;
`;

const FuelPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 15px;
  h3 { margin: 0; color: #282d39; font-size: 14px; font-weight: 800; }
`;

const FuelBalanceBadge = styled.span`
  padding: 4px 9px;
  border: 1px solid ${({ $tone }) => $tone === 'low' ? '#fde68a' : '#a7f3d0'};
  border-radius: 999px;
  background: ${({ $tone }) => $tone === 'low' ? '#fffbeb' : '#ecfdf5'};
  color: ${({ $tone }) => $tone === 'low' ? '#b45309' : '#047857'};
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
`;

const AccountPanel = styled.section`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(320px, 1.2fr);
  gap: 22px;
  margin-bottom: 18px;
  padding: 22px;
  border: 1px solid #e5e7ec;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 18px #1a1d2908;
  @media (max-width: 850px) { grid-template-columns: 1fr; }
`;

const AccountOverview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AccountBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  img { width: 54px; height: 54px; object-fit: contain; }
  h2 { margin: 0; color: #252a36; font-size: 18px; }
  p { margin: 4px 0 0; color: #747a87; font-size: 11px; line-height: 1.4; }
`;

const AccountBalance = styled.div`
  strong { display: block; color: #1a1d29; font-size: clamp(27px, 4vw, 38px); letter-spacing: -.05em; line-height: 1.1; }
  span { display: block; margin-top: 5px; color: #747a87; font-size: 12px; }
`;

const AccountStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const AccountStat = styled.div`
  padding: 12px;
  border-radius: 10px;
  background: #f6f7f9;
  strong { display: block; color: #343946; font-size: 16px; }
  span { display: block; margin-top: 3px; color: #818794; font-size: 10px; }
`;

const AccountControls = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 12px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const LedgerForm = styled.form`
  display: grid;
  align-content: start;
  gap: 9px;
  padding: 14px;
  border: 1px solid #eceef2;
  border-radius: 12px;
  background: #fcfcfd;
  h3 { margin: 0 0 2px; color: #343946; font-size: 12px; }
  input, select {
    width: 100%;
    min-height: 36px;
    padding: 0 9px;
    border: 1px solid #e0e3e8;
    border-radius: 8px;
    background: #fff;
    color: #343946;
    font: inherit;
    font-size: 12px;
  }
`;

const FuelFacts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 14px 0;
`;

const FuelFact = styled.div`
  min-width: 0;
  padding: 11px;
  border-radius: 9px;
  background: #f6f7f9;
  span { display: block; color: #818794; font-size: 10px; }
  strong { display: block; margin-top: 4px; overflow-wrap: anywhere; color: #343946; font-size: 14px; }
`;

const FuelHistory = styled.section`
  margin-bottom: 18px;
  padding: 16px 20px;
  border: 1px solid #e5e7ec;
  border-radius: 14px;
  background: #fff;
  h2 { margin: 0 0 12px; color: #343946; font-size: 14px; }
`;

const FuelHistoryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(90px, .7fr) auto;
  gap: 12px;
  align-items: center;
  padding: 9px 0;
  border-top: 1px solid #eff0f3;
  color: #626977;
  font-size: 11px;
  strong { color: #343946; font-size: 11px; }
  @media (max-width: 600px) { grid-template-columns: 1fr auto; }
`;

function FleetDashboard({ embedded = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [hearses, setHearses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fuelWallet, setFuelWallet] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [fuelCardDraft, setFuelCardDraft] = useState('');
  const [savingFuelCard, setSavingFuelCard] = useState(false);
  const [savingFuelAction, setSavingFuelAction] = useState('');
  const [depositDraft, setDepositDraft] = useState({ amount: '', reference: '', transactionDate: todayDate() });
  const [allocationDraft, setAllocationDraft] = useState({ amount: '', reference: '', transactionDate: todayDate() });
  const [thresholdDraft, setThresholdDraft] = useState('5000.00');

  const loadFleet = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [fleetResponse, walletResponse] = await Promise.all([
        request(`/hearses?t=${Date.now()}`),
        request(`/hearse-fuel?t=${Date.now()}`),
      ]);
      if (!Array.isArray(fleetResponse.hearses)) {
        throw new Error('Fleet service returned an invalid hearse list.');
      }
      if (!Array.isArray(walletResponse.cards) || !Array.isArray(walletResponse.transactions)) {
        throw new Error('Fuel account service returned an invalid account summary.');
      }
      const fleetRows = fleetResponse.hearses;
      setHearses(fleetRows);
      setFuelWallet(walletResponse);
      setThresholdDraft(walletResponse.low_balance_threshold);
      setSelectedId((current) => fleetRows.some((hearse) => String(hearse.id) === String(current))
        ? current
        : (fleetRows[0]?.id ?? null));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the hearse fleet.');
      if (quiet) notify.error(loadError.message || 'Unable to refresh the hearse fleet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFleet(); }, [loadFleet]);

  const counts = useMemo(() => {
    const countStatus = (key) => hearses.filter((hearse) => statusKey(hearse.status) === key).length;
    return {
      total: hearses.length,
      available: countStatus('available'),
      maintenance: countStatus('maintenance') + countStatus('pending_inspection'),
      lowFuelCards: (fuelWallet?.cards || []).filter((card) => card.is_low).length,
    };
  }, [hearses, fuelWallet]);

  const filteredHearses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hearses.filter((hearse) => {
      const key = statusKey(hearse.status);
      if (filter !== 'all') {
        const inFilter = filter === 'in_use'
          ? ['booked', 'in_transit'].includes(key)
          : filter === 'maintenance'
            ? ['maintenance', 'pending_inspection'].includes(key)
            : key === filter;
        if (!inFilter) return false;
      }
      if (!query) return true;
      return [hearse.plate_number, hearse.hearse_name, hearse.model, hearse.branch_name, hearse.branch_code]
        .some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [hearses, filter, search]);

  const selectedHearse = hearses.find((hearse) => String(hearse.id) === String(selectedId)) || null;
  const selectedFuelCard = fuelWallet?.cards.find((card) => String(card.hearse_id) === String(selectedHearse?.id)) || null;
  const lowBalanceThreshold = Number(fuelWallet?.low_balance_threshold || 0);
  const lowFuelCards = (fuelWallet?.cards || []).filter((card) => card.is_low);
  useEffect(() => {
    setStatusDraft(selectedHearse ? STATUS_OPTIONS.some((option) => option.value === statusKey(selectedHearse.status))
      ? statusKey(selectedHearse.status)
      : 'available' : '');
    setFuelCardDraft(selectedHearse?.fuel_card_number || '');
  }, [selectedHearse]);

  const saveStatus = async (event) => {
    event.preventDefault();
    if (!selectedHearse || !statusDraft) return;
    setSavingStatus(true);
    try {
      await request(`/hearses/${encodeURIComponent(selectedHearse.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft }),
      });
      setHearses((current) => current.map((hearse) => String(hearse.id) === String(selectedHearse.id)
        ? { ...hearse, status: statusDraft }
        : hearse));
      notify.success('Fleet status updated.');
    } catch (saveError) {
      notify.error(saveError.message || 'Unable to update fleet status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const saveFuelCard = async (event) => {
    event.preventDefault();
    if (!selectedHearse) return;
    setSavingFuelCard(true);
    try {
      const fuelCardNumber = fuelCardDraft.trim();
      await request(`/hearses/${encodeURIComponent(selectedHearse.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fuel_card_number: fuelCardNumber || null }),
      });
      setHearses((current) => current.map((hearse) => String(hearse.id) === String(selectedHearse.id)
        ? { ...hearse, fuel_card_number: fuelCardNumber }
        : hearse));
      await loadFleet(true);
      notify.success('Fuel card details updated.');
    } catch (saveError) {
      notify.error(saveError.message || 'Unable to update fuel card details.');
    } finally {
      setSavingFuelCard(false);
    }
  };

  const submitFuelAction = async (event, action, path, body, successMessage) => {
    event.preventDefault();
    setSavingFuelAction(action);
    try {
      const response = await request(path, {
        method: action === 'threshold' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setFuelWallet(response);
      setThresholdDraft(response.low_balance_threshold);
      if (action === 'deposit') setDepositDraft({ amount: '', reference: '', transactionDate: todayDate() });
      if (action === 'allocation') setAllocationDraft({ amount: '', reference: '', transactionDate: todayDate() });
      notify.success(successMessage);
    } catch (actionError) {
      notify.error(actionError.message || 'Unable to save the fuel account transaction.');
    } finally {
      setSavingFuelAction('');
    }
  };

  const filters = [
    { id: 'all', label: 'All', count: hearses.length },
    { id: 'available', label: 'Available', count: counts.available },
    { id: 'in_use', label: 'In use', count: hearses.filter((hearse) => ['booked', 'in_transit'].includes(statusKey(hearse.status))).length },
    { id: 'maintenance', label: 'Maintenance', count: counts.maintenance },
    { id: 'out_of_service', label: 'Out of service', count: hearses.filter((hearse) => statusKey(hearse.status) === 'out_of_service').length },
  ];

  return (
    <FleetPage $embedded={embedded}>
      <PageWidth>
        <Header>
          <TitleGroup>
            <HeaderIcon><Truck size={23} /></HeaderIcon>
            <div>
              <Title>Hearse Fleet</Title>
              <Subtitle>Vehicle details, registration plates, status and fuel cards</Subtitle>
            </div>
          </TitleGroup>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <ActionButton onClick={() => loadFleet(true)} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'fleet-spin' : ''} /> Refresh
            </ActionButton>
            <ActionButton $primary onClick={() => navigate(`/${slug}/hearse`)}>
              <CarFront size={15} /> Vehicle registration
            </ActionButton>
          </div>
        </Header>

        <AccountPanel aria-label="TotalEnergies fuel account">
          <AccountOverview>
            <AccountBrand>
              <img src="https://apifactory.totalenergies.com/images/total_energies_logo.png" alt="TotalEnergies" />
              <div>
                  <h2>TotalEnergies main account</h2>
                <p>RestPoint ledger · manually recorded funds, not a live provider connection</p>
              </div>
            </AccountBrand>
            <AccountBalance>
              <strong>{fuelWallet ? formatKES(fuelWallet.account_balance) : 'Loading...'}</strong>
              <span>Unallocated balance available in the TotalEnergies account</span>
            </AccountBalance>
            <AccountStats>
              <AccountStat><strong>{fuelWallet ? formatKES(fuelWallet.total_on_cards) : '...'}</strong><span>Remaining on fuel cards</span></AccountStat>
              <AccountStat><strong>{fuelWallet ? formatKES(fuelWallet.total_spent) : '...'}</strong><span>Recorded fuel purchases</span></AccountStat>
            </AccountStats>
          </AccountOverview>
          <AccountControls>
            <LedgerForm onSubmit={(event) => submitFuelAction(
              event,
              'deposit',
              '/hearse-fuel/deposits',
              { amount: depositDraft.amount, reference: depositDraft.reference, transaction_date: depositDraft.transactionDate },
              'Cheque deposit added to the TotalEnergies ledger.'
            )}>
              <h3>Load cheque / deposit</h3>
              <input type="number" min="0.01" step="0.01" required value={depositDraft.amount} onChange={(event) => setDepositDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount (KES)" aria-label="Cheque deposit amount in KES" />
              <input type="text" value={depositDraft.reference} onChange={(event) => setDepositDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="Cheque or deposit reference" aria-label="Cheque or deposit reference" />
              <input type="date" required value={depositDraft.transactionDate} onChange={(event) => setDepositDraft((current) => ({ ...current, transactionDate: event.target.value }))} aria-label="Cheque deposit date" />
              <ActionButton type="submit" $primary disabled={savingFuelAction !== ''}>{savingFuelAction === 'deposit' ? 'Recording...' : 'Record deposit'}</ActionButton>
            </LedgerForm>
            <LedgerForm onSubmit={(event) => submitFuelAction(
              event,
              'threshold',
              '/hearse-fuel/threshold',
              { low_balance_threshold: thresholdDraft },
              'Low-balance alert threshold updated.'
            )}>
              <h3>Low card balance alert</h3>
              <input type="number" min="0" step="0.01" required value={thresholdDraft} onChange={(event) => setThresholdDraft(event.target.value)} aria-label="Low fuel-card balance threshold in KES" />
              <p style={{ margin: 0, color: '#747a87', fontSize: 11 }}>Alert when an assigned card balance falls below this KES amount.</p>
              <ActionButton type="submit" disabled={savingFuelAction !== '' || Number(thresholdDraft) === lowBalanceThreshold}>{savingFuelAction === 'threshold' ? 'Saving...' : 'Save threshold'}</ActionButton>
            </LedgerForm>
          </AccountControls>
        </AccountPanel>

        {lowFuelCards.length > 0 && (
          <InlineAlert role="status">
            <AlertCircle size={17} />
            <span><strong>{lowFuelCards.length} fuel card{lowFuelCards.length === 1 ? '' : 's'} below threshold:</strong> {lowFuelCards.map((card) => `${card.plate_number} (${formatKES(card.balance)})`).join(', ')}</span>
          </InlineAlert>
        )}

        {(fuelWallet?.transactions || []).length > 0 && (
          <FuelHistory>
            <h2>Recent fuel account activity</h2>
            {fuelWallet.transactions.slice(0, 6).map((transaction) => {
              const label = transaction.transaction_type === 'deposit'
                ? 'Cheque / account deposit'
                : transaction.transaction_type === 'allocation'
                  ? `Allocated to ${transaction.hearse_plate || 'fuel card'}`
                  : `Fuel purchase · ${transaction.station || 'station not entered'}`;
              const signedAmount = transaction.transaction_type === 'deposit' ? `+${formatKES(transaction.amount)}` : `−${formatKES(transaction.amount)}`;
              return (
                <FuelHistoryRow key={transaction.id}>
                  <strong>{label}</strong>
                  <span>{transaction.reference || transaction.fuel_card_number || 'No reference'}</span>
                  <span>{String(transaction.transaction_date).slice(0, 10)}</span>
                  <strong>{signedAmount}</strong>
                </FuelHistoryRow>
              );
            })}
          </FuelHistory>
        )}

        <SummaryGrid aria-label="Fleet summary">
          <SummaryCard><SummaryIcon><Truck size={19} /></SummaryIcon><div><SummaryValue>{counts.total}</SummaryValue><SummaryLabel>Total hearses</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone="green"><CheckCircle2 size={19} /></SummaryIcon><div><SummaryValue>{counts.available}</SummaryValue><SummaryLabel>Marked available</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone="gold"><Wrench size={19} /></SummaryIcon><div><SummaryValue>{counts.maintenance}</SummaryValue><SummaryLabel>Maintenance / inspection</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone={counts.lowFuelCards ? 'red' : 'green'}><CreditCard size={19} /></SummaryIcon><div><SummaryValue>{counts.lowFuelCards}</SummaryValue><SummaryLabel>Cards below balance threshold</SummaryLabel></div></SummaryCard>
        </SummaryGrid>

        {error && (
          <InlineAlert role="alert">
            <AlertCircle size={17} /> {error}
            <ActionButton onClick={() => loadFleet(true)} disabled={refreshing}>Try again</ActionButton>
          </InlineAlert>
        )}

        <MainGrid>
          <FleetList>
            <ListHeader>
              <ListTitleRow><h2>Fleet vehicles</h2><span>{filteredHearses.length} of {hearses.length}</span></ListTitleRow>
              <SearchBox>
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plate, name, model..." aria-label="Search fleet" />
              </SearchBox>
              <FilterRow>
                {filters.map((item) => (
                  <FilterButton key={item.id} type="button" $active={filter === item.id} onClick={() => setFilter(item.id)}>
                    {item.label}<span>{item.count}</span>
                  </FilterButton>
                ))}
              </FilterRow>
            </ListHeader>
            <HearseList>
              {loading ? (
                <Empty><RefreshCw size={24} /><strong>Loading fleet</strong><span>Fetching registered vehicles.</span></Empty>
              ) : filteredHearses.length === 0 ? (
                <Empty><CarFront size={26} /><strong>{hearses.length ? 'No matching hearses' : 'No hearses registered'}</strong><span>{hearses.length ? 'Try another search or status filter.' : 'Use Vehicle registration to add the first vehicle.'}</span></Empty>
              ) : filteredHearses.map((hearse) => {
                const meta = statusMeta(hearse.status);
                const cardBalance = fuelWallet?.cards.find((card) => String(card.hearse_id) === String(hearse.id));
                const cardActivity = (fuelWallet?.transactions || []).reduce((activityByDate, transaction) => {
                  if (String(transaction.fuel_card_number || '') !== String(hearse.fuel_card_number || '')) return activityByDate;
                  const date = String(transaction.transaction_date || transaction.created_at || '').slice(0, 10);
                  const amount = Number(transaction.amount);
                  const field = transaction.transaction_type === 'allocation'
                    ? 'allocations'
                    : transaction.transaction_type === 'fuel_purchase'
                      ? 'purchases'
                      : null;
                  if (!date || !field || !Number.isFinite(amount)) return activityByDate;
                  const row = activityByDate.get(date) || { date, allocations: 0, purchases: 0 };
                  row[field] += amount;
                  activityByDate.set(date, row);
                  return activityByDate;
                }, new Map());
                const chartData = [...cardActivity.values()]
                  .sort((left, right) => left.date.localeCompare(right.date))
                  .map((row) => ({ ...row, label: row.date.slice(5) }));
                return (
                  <HearseCard
                    key={hearse.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={String(hearse.id) === String(selectedId)}
                    $selected={String(hearse.id) === String(selectedId)}
                    onClick={() => setSelectedId(hearse.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(hearse.id);
                      }
                    }}
                  >
                    <HearseCardText>
                      <HearseCardTop>
                        <span>
                          <Plate>{hearse.plate_number || `Hearse ${hearse.id}`}</Plate>
                          <CardName>{hearse.hearse_name || 'Unnamed hearse'}{hearse.model ? ` · ${hearse.model}` : ''}</CardName>
                        </span>
                        <StatusBadge $tone={meta.color}><StatusDot />{meta.label}</StatusBadge>
                      </HearseCardTop>
                      <CardFooter>
                        <span><MapPin size={13} />{hearse.branch_name || hearse.branch_code || 'Branch not set'}</span>
                        <span><CreditCard size={13} />{hearse.fuel_card_number || 'No fuel card'}</span>
                      </CardFooter>
                      {hearse.fuel_card_number && (
                        <>
                          <CardBalance $low={cardBalance?.is_low}>
                            <strong>{fuelWallet ? formatKES(cardBalance?.balance || 0) : 'Loading balance...'}</strong>
                            <span>{cardBalance?.is_low ? 'LOW BALANCE' : 'CARD BALANCE'}</span>
                          </CardBalance>
                          <CardChart aria-label={`${hearse.plate_number || 'Hearse'} fuel-card activity chart`}>
                            <CardChartLabel>Card activity · KES</CardChartLabel>
                            {chartData.length ? (
                              <ResponsiveContainer width="100%" height="82%">
                                <BarChart data={chartData} margin={{ top: 3, right: 4, bottom: 0, left: 0 }}>
                                  <CartesianGrid stroke="#eef0f4" vertical={false} />
                                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#747a87' }} />
                                  <Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value) => formatKES(Number(value))} />
                                  <Legend wrapperStyle={{ fontSize: 8, lineHeight: '10px' }} />
                                  <Bar dataKey="allocations" name="Added" fill="#547eb5" radius={[2, 2, 0, 0]} />
                                  <Bar dataKey="purchases" name="Used" fill="#d88445" radius={[2, 2, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <CardChartEmpty>No card activity recorded yet.</CardChartEmpty>
                            )}
                          </CardChart>
                        </>
                      )}
                    </HearseCardText>
                    <VehicleThumb>
                      {hearse.image ? <img src={imageUrl(hearse.image)} alt="" /> : <Truck size={25} />}
                    </VehicleThumb>
                  </HearseCard>
                );
              })}
            </HearseList>
          </FleetList>

          <Details>
            {selectedHearse ? (
              <>
                <DetailCard>
                  <DetailHeader>
                    <VehicleIdentity>
                      <VehicleMark>
                        {selectedHearse.image ? <img src={imageUrl(selectedHearse.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 13 }} /> : <Truck size={26} />}
                      </VehicleMark>
                      <div>
                        <DetailTitle>{selectedHearse.plate_number || `Hearse ${selectedHearse.id}`}</DetailTitle>
                        <DetailSub>{selectedHearse.hearse_name || 'Unnamed hearse'}{selectedHearse.model ? ` · ${selectedHearse.model}` : ''}</DetailSub>
                      </div>
                    </VehicleIdentity>
                    <StatusBadge $tone={statusMeta(selectedHearse.status).color}><StatusDot />{statusMeta(selectedHearse.status).label}</StatusBadge>
                  </DetailHeader>
                  <FactsGrid>
                    <Fact><span>Fleet ID</span><strong>{selectedHearse.id}</strong></Fact>
                    <Fact><span>Capacity</span><strong>{selectedHearse.capacity || 'Not recorded'}</strong></Fact>
                    <Fact><span>Branch</span><strong>{selectedHearse.branch_name || selectedHearse.branch_code || 'Not assigned'}</strong></Fact>
                    <Fact><span>Driver record</span><strong>{selectedHearse.driver_id || 'Not assigned'}</strong></Fact>
                    <Fact><span>Model</span><strong>{selectedHearse.model || 'Not recorded'}</strong></Fact>
                    <Fact><span>Registration</span><strong>{selectedHearse.plate_number || 'Not recorded'}</strong></Fact>
                  </FactsGrid>
                  <FuelPanel>
                    <FuelPanelHeader>
                      <h3><CreditCard size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Fuel-card funds</h3>
                      {selectedFuelCard && <FuelBalanceBadge $tone={selectedFuelCard.is_low ? 'low' : 'good'}>{selectedFuelCard.is_low ? 'Low balance' : 'Balance OK'}</FuelBalanceBadge>}
                    </FuelPanelHeader>
                    {!selectedHearse.fuel_card_number ? (
                      <Subtitle>Assign a TotalEnergies card to this vehicle to display and track its balance. Drivers record fuelling from the Drivers Portal.</Subtitle>
                    ) : (
                      <>
                        <FuelFacts>
                          <FuelFact><span>Recorded card</span><strong>{selectedHearse.fuel_card_number}</strong></FuelFact>
                          <FuelFact><span>Recorded balance</span><strong>{fuelWallet ? formatKES(selectedFuelCard?.balance || 0) : 'Loading...'}</strong></FuelFact>
                        </FuelFacts>
                        <AccountControls>
                          <LedgerForm onSubmit={(event) => submitFuelAction(
                            event,
                            'allocation',
                            '/hearse-fuel/allocations',
                            { hearse_id: selectedHearse.id, amount: allocationDraft.amount, reference: allocationDraft.reference, transaction_date: allocationDraft.transactionDate },
                            `Funds allocated to ${selectedHearse.plate_number}.`
                          )}>
                            <h3>Allocate account funds to this card</h3>
                            <p style={{ margin: 0, color: '#747a87', fontSize: 11 }}>Available to allocate: {formatKES(fuelWallet?.available_to_allocate)}</p>
                            <input type="number" min="0.01" step="0.01" required value={allocationDraft.amount} onChange={(event) => setAllocationDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount (KES)" aria-label="Card allocation amount in KES" />
                            <input type="text" value={allocationDraft.reference} onChange={(event) => setAllocationDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="Optional transfer reference" aria-label="Card allocation reference" />
                            <input type="date" required value={allocationDraft.transactionDate} onChange={(event) => setAllocationDraft((current) => ({ ...current, transactionDate: event.target.value }))} aria-label="Card allocation date" />
                            <ActionButton type="submit" disabled={savingFuelAction !== ''}>{savingFuelAction === 'allocation' ? 'Allocating...' : 'Allocate funds'}</ActionButton>
                          </LedgerForm>
                        </AccountControls>
                      </>
                    )}
                  </FuelPanel>
                  <FuelCardEditor onSubmit={saveFuelCard}>
                    <CreditCard size={18} />
                    <label>
                      <span>Fuel card number</span>
                      <input
                        value={fuelCardDraft}
                        onChange={(event) => setFuelCardDraft(event.target.value)}
                        placeholder="Enter assigned fuel card number"
                        aria-label="Fuel card number"
                      />
                    </label>
                    <ActionButton
                      type="submit"
                      disabled={savingFuelCard || fuelCardDraft.trim() === String(selectedHearse.fuel_card_number || '').trim()}
                    >
                      {savingFuelCard ? 'Saving...' : 'Save fuel card'}
                    </ActionButton>
                  </FuelCardEditor>
                  {['booked', 'in_transit'].includes(statusKey(selectedHearse.status)) ? (
                    <Subtitle style={{ marginTop: 16 }}>This vehicle is assigned to active work, so its operational availability is managed by the assignment workflow.</Subtitle>
                  ) : (
                    <>
                      <StatusEditor onSubmit={saveStatus} style={{ marginTop: 16 }}>
                        <Settings2 size={16} color="#777e8b" />
                        <select aria-label="Change hearse status" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <ActionButton type="submit" disabled={savingStatus || statusDraft === statusKey(selectedHearse.status)}>
                          {savingStatus ? 'Saving...' : 'Update status'}
                        </ActionButton>
                      </StatusEditor>
                      <Subtitle style={{ marginTop: 8 }}>Use this control to update the vehicle’s service status.</Subtitle>
                    </>
                  )}
                </DetailCard>
              </>
            ) : (
              <Empty style={{ minHeight: 420 }}>
                <Truck size={30} />
                <strong>{loading ? 'Loading fleet details' : 'Select a hearse'}</strong>
                <span>Choose a vehicle to inspect its registration, fuel card and service status.</span>
              </Empty>
            )}
          </Details>
        </MainGrid>
      </PageWidth>
      <style>{`
        @keyframes fleetSpin { to { transform: rotate(360deg); } }
        .fleet-spin { animation: fleetSpin 1s linear infinite; }
      `}</style>
    </FleetPage>
  );
}

export default FleetDashboard;
