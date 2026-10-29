import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import {
  AlertCircle, CarFront, CheckCircle2, CreditCard, MapPin, RefreshCw,
  Search, Settings2, Truck, Wrench, ChevronLeft, ChevronRight,
  Wallet, Zap, TrendingUp, Edit3,
} from 'lucide-react';
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import env from '../../utils/config/env';
import { getTenantHeaders } from '../../api/endpoints';
import { useSocket } from '../../utils/context/socketContext';
import notify from '../../utils/notify';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

// ── Button palette — ONLY these two backgrounds ────────────────────────────
const BTN_PRIMARY = '#0F3040';
const BTN_BLUE = '#00296B';

// ── Activity type colours ──────────────────────────────────────────────────
const ACTIVITY_META = {
  deposit: { label: 'Cheque deposit', color: '#0d9d6c', bg: '#e6f7f0' },
  allocation: { label: 'Fund allocation', color: '#3a5a8a', bg: '#ebf0f8' },
  fuel_purchase: { label: 'Fuel purchase', color: '#e45a4f', bg: '#fdedec' },
};
const activityMeta = (type) => ACTIVITY_META[type] || { label: type || 'Unknown', color: '#6b7280', bg: '#f0f1f4' };

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
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusKey = (s) => {
  const n = String(s || '').toLowerCase().replace(/[\-\s]+/g, '_');
  if (['off_duty', 'out_of_service'].includes(n)) return 'out_of_service';
  return n || 'unknown';
};
const statusMeta = (s) => STATUS_META[statusKey(s)] || { label: String(s || 'Unknown').replace(/_/g, ' '), color: 'gray' };

const imageUrl = (image) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL.replace(/\/api\/v1\/restpoint\/?$/, '')}/${String(image).replace(/^\/+/, '')}`;
};

const formatKES = (amount) => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES',
  minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(amount) || 0);

const todayDate = () => new Date().toISOString().slice(0, 10);

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...getTenantHeaders(), ...(options.headers || {}) },
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error(response.ok ? 'Invalid response.' : `Request failed (${response.status})`); }
  if (!response.ok) throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  return payload;
};

// ── SweetAlert2 helpers ─────────────────────────────────────────────────────
const swalTheme = { confirmButtonColor: BTN_PRIMARY, cancelButtonColor: BTN_BLUE };
const swalConfirm = (opts) => Swal.fire({ icon: 'question', showCancelButton: true, ...swalTheme, ...opts });
const swalSuccess = (title, text) => Swal.fire({ title, text, icon: 'success', timer: 2500, showConfirmButton: false, confirmButtonColor: BTN_PRIMARY });
const swalError = (title, text) => Swal.fire({ title, text, icon: 'error', confirmButtonColor: BTN_BLUE });

// ── Styled components ─────────────────────────────────────────────────────
const FleetPage = styled.main`
  min-height: ${({ $embedded }) => ($embedded ? '100%' : '100vh')};
  padding: ${({ $embedded }) => ($embedded ? '24px 28px 36px' : '28px')};
  background: ${({ $embedded }) => ($embedded ? 'transparent' : '#f6f7fb')};
  color: #141828;
  @media (max-width: 700px) { padding: 10px; }
`;
const PageWidth = styled.div`max-width: 1600px; margin: 0 auto;`;
const Header = styled.header`display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 22px; flex-wrap: wrap;`;
const TitleGroup = styled.div`display: flex; align-items: center; gap: 14px; min-width: 0;`;
const HeaderIcon = styled.div`display: grid; width: 48px; height: 48px; place-items: center; border-radius: 14px; background: ${BTN_BLUE}; color: #c89936;`;
const Title = styled.h1`margin: 0; font-size: clamp(22px, 3vw, 30px); letter-spacing: -.04em; font-weight: 800;`;
const Subtitle = styled.p`margin: 4px 0 0; color: #6b7180; font-size: 13px;`;

// ── Buttons — ALL backgrounds are ONLY #0F3040 or #00296B, white text always ─
const ActionButton = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 40px; padding: 0 14px;
  border: 1px solid ${({ $primary }) => ($primary ? BTN_PRIMARY : BTN_BLUE)};
  border-radius: 10px; appearance: none;
  background: ${({ $primary }) => ($primary ? BTN_PRIMARY : BTN_BLUE)};
  color: #fff;
  font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background .15s ease, transform .15s ease;
  &:hover { transform: translateY(-1px); background: ${({ $primary }) => ($primary ? BTN_BLUE : BTN_PRIMARY)}; }
  &:disabled { opacity: .55; cursor: wait; transform: none; }
`;
const SmButton = styled(ActionButton)`
  min-height: 32px; padding: 0 10px; font-size: 11px;
  background: ${BTN_PRIMARY}; border-color: ${BTN_PRIMARY};
  &:hover { background: ${BTN_BLUE}; }
`;

const SummaryGrid = styled.section`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }`;
const SummaryCard = styled.div`display: flex; align-items: center; gap: 13px; min-height: 92px; padding: 17px; border: 1px solid #e7e9ee; border-radius: 14px; background: #fff; box-shadow: 0 2px 8px rgba(20,24,40,.05);`;
const SummaryIcon = styled.span`display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: ${({ $tone }) => $tone === 'gold' ? '#faf3e0' : $tone === 'green' ? '#e6f7f0' : $tone === 'red' ? '#fdedec' : '#eef2f8'}; color: ${({ $tone }) => $tone === 'gold' ? '#8a6618' : $tone === 'green' ? '#0d9d6c' : $tone === 'red' ? '#e45a4f' : '#44516b'};`;
const SummaryValue = styled.div`font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums;`;
const SummaryLabel = styled.div`margin-top: 4px; color: #737987; font-size: 12px;`;

const MainGrid = styled.section`display: grid; grid-template-columns: minmax(330px, 410px) minmax(0, 1fr); border: 1px solid #e4e7ee; border-radius: 16px; background: #fff; box-shadow: 0 10px 30px rgba(20,24,40,.07); overflow: hidden; @media (max-width: 900px) { grid-template-columns: 1fr; }`;
const FleetList = styled.div`min-width: 0; border-right: 1px solid #ebeef3; @media (max-width: 900px) { border-right: 0; border-bottom: 1px solid #ebeef3; }`;
const ListHeader = styled.div`padding: 20px; border-bottom: 1px solid #eceef2;`;
const ListTitleRow = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; h2 { margin: 0; font-size: 17px; } span { color: #767c89; font-size: 12px; }`;
const SearchBox = styled.label`display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 11px; border: 1px solid #e2e5eb; border-radius: 9px; color: #848b98; input { width: 100%; border: 0; outline: 0; background: transparent; color: #252a36; font: inherit; font-size: 13px; }`;
const FilterRow = styled.div`display: flex; gap: 7px; margin-top: 12px; overflow-x: auto;`;
// Filter pills — also use the two approved colours (inactive = faded blue, active = primary)
const FilterButton = styled.button`
  display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 7px 10px;
  border: 0; border-radius: 20px;
  background: ${({ $active }) => ($active ? BTN_PRIMARY : BTN_BLUE)};
  color: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.75)')};
  font: inherit; font-size: 11px; font-weight: 600; cursor: pointer;
  &:hover { background: ${BTN_PRIMARY}; color: #fff; }
`;
const HearseList = styled.div`padding: 12px;`;
const HearseCard = styled.div`display: flex; width: 100%; min-height: 100px; margin-bottom: 9px; border: 1px solid ${({ $selected }) => ($selected ? '#c89936' : '#ebeef3')}; border-radius: 12px; background: #fff; cursor: pointer; overflow: hidden; box-shadow: ${({ $selected }) => ($selected ? '0 0 0 2px rgba(200,153,54,.19)' : 'none')}; transition: all .15s ease; &:hover { border-color: #c9cdd5; transform: translateY(-1px); }`;
const HearseCardText = styled.div`flex: 1; min-width: 0; padding: 13px 14px;`;
const HearseCardTop = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 8px;`;
const Plate = styled.strong`display: block; font-size: 15px; font-weight: 800;`;
const CardName = styled.span`display: block; margin-top: 3px; overflow: hidden; color: #747a87; font-size: 11px; text-overflow: ellipsis; white-space: nowrap;`;
const StatusBadge = styled.span`display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 5px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ${({ $tone }) => $tone === 'green' ? '#e6f7f0' : $tone === 'gold' ? '#faf3e0' : $tone === 'blue' ? '#ebf0f8' : $tone === 'red' ? '#fdedec' : '#f0f1f4'}; color: ${({ $tone }) => $tone === 'green' ? '#0d9d6c' : $tone === 'gold' ? '#8a6618' : $tone === 'blue' ? '#3a5a8a' : $tone === 'red' ? '#e45a4f' : '#626875'};`;
const StatusDot = styled.span`width: 6px; height: 6px; border-radius: 50%; background: currentColor;`;
const CardFooter = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 10px; color: #747a87; font-size: 11px; span { display: inline-flex; align-items: center; gap: 5px; }`;
const VehicleThumb = styled.span`display: grid; width: 88px; flex: 0 0 auto; place-items: center; background: #f5f6f8; color: #747a87; img { width: 100%; height: 100%; object-fit: cover; }`;
const Details = styled.div`min-width: 0; padding: 22px; background: #f7f8fa; @media (max-width: 600px) { padding: 12px; }`;
const DetailCard = styled.section`margin-bottom: 14px; padding: 19px; border: 1px solid #e7e9ee; border-radius: 14px; background: #fff;`;
const DetailHeader = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;`;
const VehicleIdentity = styled.div`display: flex; align-items: center; gap: 14px; min-width: 0;`;
const VehicleMark = styled.div`display: grid; width: 54px; height: 54px; flex: 0 0 auto; place-items: center; border-radius: 13px; background: #c89936; color: ${BTN_BLUE}; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; }`;
const DetailTitle = styled.h2`margin: 0; font-size: 22px; letter-spacing: -.035em; font-weight: 800;`;
const DetailSub = styled.p`margin: 4px 0 0; color: #707684; font-size: 12px;`;
const FuelCardRow = styled.div`display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 12px 14px; border: 1px solid #ebeef3; border-radius: 10px; background: #f8f9fb;`;
const FCIcon = styled.div`width: 36px; height: 36px; border-radius: 8px; background: ${BTN_BLUE}; color: #fff; display: grid; place-items: center; flex-shrink: 0;`;
const FCInfo = styled.div`flex: 1; min-width: 0; span { display: block; color: #8a8f9e; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; } strong { display: block; margin-top: 2px; font-size: 14px; font-weight: 700; font-family: ui-monospace, monospace; }`;
const FactsGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; @media (max-width: 650px) { grid-template-columns: repeat(2, 1fr); }`;
const Fact = styled.div`padding: 12px; border-radius: 10px; background: #f6f7f9; span { display: block; color: #818794; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; } strong { display: block; margin-top: 5px; color: #282d39; font-size: 13px; }`;
const Empty = styled.div`display: grid; min-height: 220px; place-items: center; align-content: center; gap: 9px; padding: 24px; color: #7c8290; text-align: center; strong { color: #3e4350; font-size: 14px; } span { max-width: 320px; font-size: 12px; }`;
const InlineAlert = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 12px 14px; border: 1px solid #f0c9c5; border-radius: 10px; background: #fff5f4; color: #a1372f; font-size: 13px;`;
const StatusEditor = styled.form`display: flex; align-items: center; gap: 8px; margin-top: 16px; select { min-height: 38px; padding: 0 10px; border: 1px solid #e0e3e8; border-radius: 9px; background: #fff; color: #343946; font: inherit; font-size: 12px; }`;
const FuelPanel = styled.section`margin-top: 18px; padding: 17px; border: 1px solid #e7e9ee; border-radius: 12px; background: #fff;`;
const FuelPanelHeader = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; .fph-left { display: flex; align-items: center; gap: 8px; } .fph-right { display: flex; align-items: center; gap: 8px; } h3 { margin: 0; font-size: 14px; font-weight: 800; }`;
const BalanceBadge = styled.span`padding: 4px 9px; border-radius: 999px; font-size: 10px; font-weight: 800; &.low { border: 1px solid #fde68a; background: #fffbeb; color: #b45309; } &.good { border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; }`;
const FuelFacts = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; margin: 14px 0;`;
const FuelFact = styled.div`padding: 11px; border-radius: 9px; background: #f6f7f9; span { display: block; color: #818794; font-size: 10px; } strong { display: block; margin-top: 4px; color: #343946; font-size: 14px; }`;
const FuelChartsGrid = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 16px 0; @media (max-width: 700px) { grid-template-columns: 1fr; }`;
const FuelMetricCard = styled.section`display: flex; min-width: 0; min-height: 290px; flex-direction: column; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #fff;`;
const FuelMetricHeader = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px;`;
const FuelMetricTitle = styled.div`display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 650;`;
const FuelMetricIcon = styled.span`display: grid; width: 24px; height: 24px; place-items: center; border-radius: 6px; background: ${BTN_BLUE}; color: #fff;`;
const FuelMetricTotal = styled.div`text-align: right; strong { display: block; font-size: 17px; font-weight: 750; font-variant-numeric: tabular-nums; } span { display: block; margin-top: 3px; color: #888; font-size: 10px; }`;
const BalanceDonut = styled.div`position: relative; width: 150px; height: 150px; margin: 2px auto 0;`;
const DonutCenter = styled.div`position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; strong { font-size: 19px; font-weight: 800; } span { margin-top: 3px; color: #888; font-size: 10px; }`;
const FuelStatRow = styled.div`display: flex; gap: 18px; margin-top: auto; padding-top: 13px;`;
const FuelStat = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 2px; strong { color: #111; font-size: 12px; font-weight: 700; } span { color: #888; font-size: 10px; }`;
const FuelTrendChart = styled.div`width: 100%; height: 145px; margin-top: auto;`;
const FuelActivityValue = styled.div`margin: 6px 0 0; color: #111; font-size: 33px; font-weight: 800; font-variant-numeric: tabular-nums;`;
const FuelActivitySparkline = styled.div`width: 100%; height: 92px; margin-top: auto;`;
const FuelGaugeWrap = styled.div`position: relative; width: 190px; height: 125px; margin: auto auto 0;`;
const FuelGaugeCenter = styled.div`position: absolute; right: 0; bottom: 2px; left: 0; display: flex; flex-direction: column; align-items: center; pointer-events: none; strong { color: #3a5a8a; font-size: 25px; font-weight: 800; } span { margin-top: 4px; color: #888; font-size: 10px; }`;
const NoChartData = styled.div`display: grid; min-height: 90px; flex: 1; place-items: center; color: #888; font-size: 11px; text-align: center;`;
const AccountPanel = styled.section`display: grid; grid-template-columns: minmax(260px, 1fr) minmax(320px, 1.2fr); gap: 22px; margin-bottom: 18px; padding: 22px; border: 1px solid #e5e7ec; border-radius: 16px; background: #fff; box-shadow: 0 4px 18px rgba(20,24,40,.05); @media (max-width: 850px) { grid-template-columns: 1fr; }`;
const AccountOverview = styled.div`display: flex; flex-direction: column; gap: 16px; min-width: 0;`;
const AccountBrand = styled.div`display: flex; align-items: center; gap: 12px; img { width: 54px; height: 54px; object-fit: contain; } h2 { margin: 0; font-size: 18px; }`;
const AccountBalance = styled.div`strong { display: block; font-size: clamp(28px, 4vw, 38px); font-weight: 800; letter-spacing: -.05em; } span { display: block; margin-top: 5px; color: #747a87; font-size: 12px; }`;
const AccountStats = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;`;
const AccountStat = styled.div`padding: 12px; border-radius: 10px; background: #f6f7f9; strong { display: block; font-size: 16px; } span { display: block; margin-top: 3px; color: #818794; font-size: 10px; }`;
const AccountControls = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; @media (max-width: 700px) { grid-template-columns: 1fr; }`;
const LedgerForm = styled.form`display: grid; gap: 9px; padding: 14px; border: 1px solid #eceef2; border-radius: 12px; background: #fcfcfd; h3 { margin: 0 0 2px; font-size: 12px; font-weight: 700; } input { width: 100%; min-height: 36px; padding: 0 9px; border: 1px solid #e0e3e8; border-radius: 8px; font: inherit; font-size: 12px; }`;
const ActivityPanel = styled.section`margin-bottom: 18px; padding: 18px 20px; border: 1px solid #e5e7ec; border-radius: 14px; background: #fff;`;
const ActivityPanelHeader = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; h2 { margin: 0; font-size: 15px; font-weight: 800; }`;
const ActivityFilters = styled.div`display: flex; gap: 7px; flex-wrap: wrap;`;
const ActivityFilterBtn = styled.button`display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: 1px solid ${({ $active, $color }) => ($active ? $color : '#e2e5eb')}; border-radius: 20px; background: ${({ $active, $bg }) => ($active ? $bg : '#fff')}; color: ${({ $active, $color }) => ($active ? $color : '#646a76')}; font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; .dot { width: 8px; height: 8px; border-radius: 50%; background: ${({ $color }) => $color}; }`;
const ActivityLayout = styled.div`display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 18px; @media (max-width: 850px) { grid-template-columns: 1fr; }`;
const CalendarWrap = styled.div`border: 1px solid #ebeef3; border-radius: 12px; overflow: hidden;`;
const CalendarHeader = styled.div`display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: ${BTN_BLUE}; color: #fff;`;
const CalendarMonthNav = styled.div`display: flex; align-items: center; gap: 8px; strong { font-size: 13px; font-weight: 700; }`;
const CalNavBtn = styled.button`width: 26px; height: 26px; border: 0; border-radius: 6px; background: rgba(255,255,255,.15); color: #fff; cursor: pointer; display: grid; place-items: center; &:hover { background: rgba(255,255,255,.3); }`;
const CalendarTable = styled.table`width: 100%; border-collapse: collapse; table-layout: fixed;`;
const CalHead = styled.th`padding: 8px 2px; font-size: 10px; font-weight: 700; color: #8a8f9e; text-transform: uppercase;`;
const CalCell = styled.td`padding: 0; text-align: center; vertical-align: top; border: 1px solid #f3f4f6; height: 48px; cursor: pointer; position: relative; &:hover { background: #f8f9fb; } &.other-month { background: #fafbfc; .cal-day { color: #c9cdd5; } } &.today { background: #eef2f8; .cal-day { color: ${BTN_BLUE}; font-weight: 800; } } .cal-day { display: block; font-size: 11px; font-weight: 600; color: #343946; padding: 3px 0; } .cal-dots { display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; padding: 0 2px; } .cal-dot { width: 5px; height: 5px; border-radius: 50%; }`;
const CalendarLegend = styled.div`display: flex; gap: 12px; padding: 10px 14px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; span { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #6b7180; } .dot { width: 8px; height: 8px; border-radius: 50%; }`;
const ActivityList = styled.div`min-width: 0;`;
const ActivityRow = styled.div`display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 14px; margin-bottom: 8px; border: 1px solid #ebeef3; border-radius: 10px; border-left: 4px solid ${({ $color }) => $color}; background: ${({ $bg }) => $bg}10; transition: transform .12s ease; &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.04); }`;
const ActivityIcon = styled.div`width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: ${({ $bg }) => $bg}; color: ${({ $color }) => $color}; flex-shrink: 0;`;
const ActivityBody = styled.div`min-width: 0; strong { display: block; font-size: 13px; font-weight: 700; color: #141828; } span { display: block; margin-top: 2px; font-size: 11px; color: #6b7180; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`;
const ActivityAmount = styled.div`text-align: right; strong { display: block; font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; } &.pos strong { color: #0d9d6c; } &.neg strong { color: #e45a4f; } span { display: block; margin-top: 2px; font-size: 10px; color: #8a8f9e; }`;
const ViewMoreBtn = styled.button`display: block; width: 100%; margin-top: 10px; padding: 10px; border: 1px solid ${BTN_PRIMARY}; border-radius: 10px; background: ${BTN_BLUE}; color: #fff; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; &:hover { background: ${BTN_PRIMARY}; }`;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — ALL hooks in ONE contiguous block, then derived consts, then
// handler functions, then JSX. SweetAlert is only called in event handlers
// (never during render). Recharts is only in JSX (never as hooks).
// ═══════════════════════════════════════════════════════════════════════════
function FleetDashboard({ embedded = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  // ── ALL useState (block 1) ────────────────────────────────────────────────
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
  const [thresholdDraft, setThresholdDraft] = useState('5000.00');
  const [activityFilter, setActivityFilter] = useState('all');
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [allocateDraft, setAllocateDraft] = useState({ amount: '', reference: '', transactionDate: todayDate() });
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  // ── ALL useCallback (block 2) ───────────────────────────────────────────────
  const loadFleet = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [fleetResponse, walletResponse] = await Promise.all([
        request(`/hearses?t=${Date.now()}`),
        request(`/hearse-fuel?t=${Date.now()}`),
      ]);
      const fleetRows = Array.isArray(fleetResponse?.hearses) ? fleetResponse.hearses : [];
      const walletCards = Array.isArray(walletResponse?.cards) ? walletResponse.cards : [];
      const walletTxns = Array.isArray(walletResponse?.transactions) ? walletResponse.transactions : [];
      if (!fleetRows.length) throw new Error('Fleet service returned an invalid hearse list.');
      if (!walletCards.length && !walletTxns.length) throw new Error('Fuel account service returned an invalid account summary.');
      setHearses(fleetRows);
      setFuelWallet({ ...walletResponse, cards: walletCards, transactions: walletTxns });
      setThresholdDraft(walletResponse?.low_balance_threshold || '5000.00');
      setSelectedId((current) => fleetRows.some((h) => String(h.id) === String(current)) ? current : (fleetRows[0]?.id ?? null));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the hearse fleet.');
      if (quiet) notify.error(loadError.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  // ── ALL useEffect (block 3) ───────────────────────────────────────────────
  useEffect(() => { loadFleet(); }, [loadFleet]);
  useEffect(() => {
    if (!socket || !connected) return undefined;
    loadFleet(true);
    const handler = (event = {}) => {
      loadFleet(true);
      if (event.changeType === 'driver_fuel_purchase') notify.info(`${event.driverName || 'A driver'} recorded fuelling${event.plateNumber ? ` for ${event.plateNumber}` : ''}.`);
    };
    socket.on('hearse_data_changed', handler);
    return () => socket.off('hearse_data_changed', handler);
  }, [socket, connected, loadFleet]);
  useEffect(() => {
    const h = hearses.find((x) => String(x.id) === String(selectedId)) || null;
    const draft = h ? (STATUS_OPTIONS.some((o) => o.value === statusKey(h.status)) ? statusKey(h.status) : 'available') : '';
    setStatusDraft(draft);
    setFuelCardDraft(h?.fuel_card_number || '');
  }, [selectedId, hearses]);

  // ── ALL useMemo (block 4) ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = (k) => hearses.filter((h) => statusKey(h.status) === k).length;
    const cards = Array.isArray(fuelWallet?.cards) ? fuelWallet.cards : [];
    return { total: hearses.length, available: c('available'), maintenance: c('maintenance') + c('pending_inspection'), lowFuelCards: cards.filter((card) => card.is_low).length };
  }, [hearses, fuelWallet]);
  const filteredHearses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hearses.filter((h) => {
      const key = statusKey(h.status);
      if (filter !== 'all') {
        const inFilter = filter === 'in_use' ? ['booked', 'in_transit'].includes(key) : filter === 'maintenance' ? ['maintenance', 'pending_inspection'].includes(key) : key === filter;
        if (!inFilter) return false;
      }
      if (!q) return true;
      return [h.plate_number, h.hearse_name, h.model, h.branch_name, h.branch_code].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [hearses, filter, search]);
  const allTransactions = useMemo(() => Array.isArray(fuelWallet?.transactions) ? fuelWallet.transactions : [], [fuelWallet]);
  const filteredTransactions = useMemo(() => {
    const txns = showAllActivity ? allTransactions : allTransactions.slice(0, 3);
    return activityFilter === 'all' ? txns : txns.filter((t) => t.transaction_type === activityFilter);
  }, [allTransactions, showAllActivity, activityFilter]);
  const activityCounts = useMemo(() => ({
    all: allTransactions.length,
    deposit: allTransactions.filter((t) => t.transaction_type === 'deposit').length,
    allocation: allTransactions.filter((t) => t.transaction_type === 'allocation').length,
    fuel_purchase: allTransactions.filter((t) => t.transaction_type === 'fuel_purchase').length,
  }), [allTransactions]);
  const calendarActivities = useMemo(() => {
    const map = new Map();
    const calYear = calendarMonth.getFullYear();
    const calMonth = calendarMonth.getMonth();
    allTransactions.forEach((t) => {
      const dStr = String(t.transaction_date || '').slice(0, 10);
      const d = new Date(dStr + 'T00:00:00');
      if (!isNaN(d.getTime()) && d.getFullYear() === calYear && d.getMonth() === calMonth) {
        if (!map.has(dStr)) map.set(dStr, []);
        map.get(dStr).push(t);
      }
    });
    return map;
  }, [allTransactions, calendarMonth]);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, otherMonth: true, date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, otherMonth: false, date: new Date(year, month, d) });
    const trailing = 42 - cells.length;
    for (let i = 1; i <= trailing; i++) cells.push({ day: i, otherMonth: true, date: null });
    return cells;
  }, [calendarMonth]);

  // ── DERIVED CONSTS (NO hooks below this line) ──────────────────────────────
  const selectedHearse = hearses.find((h) => String(h.id) === String(selectedId)) || null;
  const fuelCards = Array.isArray(fuelWallet?.cards) ? fuelWallet.cards : [];
  const selectedFuelCard = selectedHearse ? fuelCards.find((c) => String(c.hearse_id) === String(selectedHearse.id)) || null : null;
  const lowFuelCards = fuelCards.filter((c) => c.is_low);
  const cardBalance = Number(selectedFuelCard?.balance) || 0;
  const cardSpent = Number(selectedFuelCard?.total_spent) || 0;
  const cardAllocated = Number(selectedFuelCard?.total_allocated) || 0;
  const spentThisMonth = Number(selectedFuelCard?.spent_this_month) || 0;
  const balanceHistory = Array.isArray(selectedFuelCard?.balance_history) ? selectedFuelCard.balance_history : [];
  const balanceDonutData = [
    { name: 'Available', value: Math.max(cardBalance, 0), color: BTN_BLUE },
    { name: 'Spent', value: Math.max(cardSpent, 0), color: '#e45a4f' },
  ];
  const activityTotal = Number(selectedFuelCard?.latest_activity?.amount) || 0;
  const latestActivityLabel = selectedFuelCard?.latest_activity?.transaction_type === 'fuel_purchase' ? 'Fuel purchase'
    : selectedFuelCard?.latest_activity?.transaction_type === 'allocation' ? 'Funds added'
      : selectedFuelCard?.latest_activity?.transaction_type === 'deposit' ? 'Account deposit' : 'No recent activity';
  const latestActivityDriver = String(selectedFuelCard?.latest_activity?.notes || '').match(/Driver fuelling(?: by: ([^·]+))?/i)?.[1]?.trim();
  const allocatedFunds = Math.max(cardAllocated, 0);
  const remainPct = allocatedFunds > 0 ? Math.round((cardBalance / allocatedFunds) * 100) : 0;
  const consumptionData = [
    { name: 'Remaining', value: Math.max(cardBalance, 0), color: BTN_BLUE },
    { name: 'Spent', value: Math.max(cardSpent, 0), color: '#e0e3e8' },
  ];
  const todayKey = todayDate();
  const calendarMonthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const filters = [
    { id: 'all', label: 'All', count: hearses.length },
    { id: 'available', label: 'Available', count: counts.available },
    { id: 'in_use', label: 'In use', count: hearses.filter((h) => ['booked', 'in_transit'].includes(statusKey(h.status))).length },
    { id: 'maintenance', label: 'Maintenance', count: counts.maintenance },
    { id: 'out_of_service', label: 'Out of service', count: hearses.filter((h) => statusKey(h.status) === 'out_of_service').length },
  ];
  const cellActivityColor = (dateKey) => {
    const acts = calendarActivities.get(dateKey);
    if (!acts || !acts.length) return null;
    if (activityFilter !== 'all') { const f = acts.filter((a) => a.transaction_type === activityFilter); return f.length ? activityMeta(f[0].transaction_type).color : null; }
    return activityMeta(acts[0].transaction_type).color;
  };

  // ── HANDLER FUNCTIONS (NOT hooks — safe here) ──────────────────────────────
  const saveStatus = async (event) => {
    event.preventDefault();
    if (!selectedHearse || !statusDraft) return;
    const label = STATUS_OPTIONS.find((o) => o.value === statusDraft)?.label || statusDraft;
    const confirmed = await swalConfirm({
      title: 'Update status?',
      html: `Change <strong>${selectedHearse.plate_number}</strong>'s status to <strong>${label}</strong>?`,
      confirmButtonText: 'Yes, update', cancelButtonText: 'Cancel',
    });
    if (!confirmed.isConfirmed) return;
    setSavingStatus(true);
    try {
      await request(`/hearses/${encodeURIComponent(selectedHearse.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: statusDraft }) });
      setHearses((c) => c.map((h) => String(h.id) === String(selectedHearse.id) ? { ...h, status: statusDraft } : h));
      await swalSuccess('Status updated', `${selectedHearse.plate_number} is now ${label}.`);
    } catch (e) { await swalError('Failed', e.message); }
    finally { setSavingStatus(false); }
  };

  const saveFuelCard = async (event) => {
    event.preventDefault();
    if (!selectedHearse) return;
    const trimmed = fuelCardDraft.trim();
    if (!trimmed) { await swalError('Missing', 'Please enter a fuel card number.'); return; }
    const confirmed = await swalConfirm({
      title: 'Save fuel card?',
      html: `Update <strong>${selectedHearse.plate_number}</strong>'s card to <strong style="font-family:monospace">${trimmed}</strong>?`,
      confirmButtonText: 'Yes, save', cancelButtonText: 'Cancel',
    });
    if (!confirmed.isConfirmed) return;
    setSavingFuelCard(true);
    try {
      await request(`/hearses/${encodeURIComponent(selectedHearse.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fuel_card_number: trimmed }) });
      setHearses((c) => c.map((h) => String(h.id) === String(selectedHearse.id) ? { ...h, fuel_card_number: trimmed } : h));
      await loadFleet(true);
      await swalSuccess('Fuel card saved', `${selectedHearse.plate_number} now uses ${trimmed}.`);
    } catch (e) { await swalError('Failed', e.message); }
    finally { setSavingFuelCard(false); }
  };

  const submitFuelAction = async (event, action, path, body, successMessage) => {
    event.preventDefault();
    if (action === 'allocation') {
      const c = await swalConfirm({
        title: 'Allocate funds?',
        html: `Allocate <strong style="color:${BTN_PRIMARY}">${formatKES(body.amount)}</strong> to <strong>${selectedHearse?.plate_number}</strong>?`,
        confirmButtonText: 'Yes, allocate', cancelButtonText: 'Cancel',
      });
      if (!c.isConfirmed) return;
    } else if (action === 'deposit') {
      const c = await swalConfirm({
        title: 'Record deposit?',
        html: `Add <strong style="color:${BTN_PRIMARY}">${formatKES(body.amount)}</strong> as a cheque deposit?`,
        confirmButtonText: 'Yes, record', cancelButtonText: 'Cancel',
      });
      if (!c.isConfirmed) return;
    } else if (action === 'threshold') {
      const c = await swalConfirm({
        title: 'Save threshold?',
        html: `Set the low-balance alert to <strong>${formatKES(body.low_balance_threshold)}</strong>?`,
        confirmButtonText: 'Yes, save', cancelButtonText: 'Cancel',
      });
      if (!c.isConfirmed) return;
    }
    setSavingFuelAction(action);
    try {
      const response = await request(path, { method: action === 'threshold' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setFuelWallet(response);
      setThresholdDraft(response?.low_balance_threshold || '5000.00');
      if (action === 'deposit') setDepositDraft({ amount: '', reference: '', transactionDate: todayDate() });
      if (action === 'allocation') setAllocateDraft({ amount: '', reference: '', transactionDate: todayDate() });
      await swalSuccess('Done', successMessage);
    } catch (e) { await swalError('Failed', e.message); }
    finally { setSavingFuelAction(''); }
  };

  const openAllocateModal = () => {
    if (!selectedHearse || !selectedHearse.fuel_card_number) { swalError('No fuel card', 'Assign a fuel card to this vehicle first.'); return; }
    Swal.fire({
      title: 'Allocate account funds',
      html: `<p style="color:#6b7180;font-size:12px;margin:0 0 16px">Available to allocate: <strong style="color:${BTN_PRIMARY}">${formatKES(fuelWallet?.available_to_allocate)}</strong></p><input id="swal-amt" class="swal2-input" type="number" min="0.01" step="0.01" placeholder="Amount (KES)"><input id="swal-ref" class="swal2-input" placeholder="Optional reference"><input id="swal-date" class="swal2-input" type="date" value="${todayDate()}">`,
      showCancelButton: true, confirmButtonText: 'Allocate', cancelButtonText: 'Cancel', ...swalTheme, focusConfirm: false,
      preConfirm: () => {
        const amount = document.getElementById('swal-amt')?.value;
        if (!amount || Number(amount) <= 0) { Swal.showValidationMessage('Enter a valid amount'); return false; }
        return { amount, reference: document.getElementById('swal-ref')?.value || '', transactionDate: document.getElementById('swal-date')?.value || todayDate() };
      },
    }).then(async (result) => {
      if (!result.isConfirmed || !result.value) return;
      const { amount, reference, transactionDate } = result.value;
      const confirm2 = await swalConfirm({
        title: 'Are you sure?',
        html: `Allocate <strong style="color:${BTN_PRIMARY}">${formatKES(amount)}</strong> to <strong>${selectedHearse.plate_number}</strong>?`,
        confirmButtonText: 'Yes, allocate', cancelButtonText: 'Cancel',
      });
      if (!confirm2.isConfirmed) return;
      setSavingFuelAction('allocation');
      try {
        const response = await request('/hearse-fuel/allocations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hearse_id: selectedHearse.id, amount, reference, transaction_date: transactionDate }) });
        setFuelWallet(response);
        await swalSuccess('Funds allocated', `${formatKES(amount)} allocated to ${selectedHearse.plate_number}.`);
      } catch (e) { await swalError('Failed', e.message); }
      finally { setSavingFuelAction(''); }
    });
  };

  const openFuelCardEditor = () => {
    if (!selectedHearse) return;
    Swal.fire({
      title: 'Edit fuel card',
      html: `<input id="swal-fc" class="swal2-input" placeholder="Fuel card number" value="${selectedHearse.fuel_card_number || ''}" style="font-family:monospace">`,
      showCancelButton: true, confirmButtonText: 'Save', cancelButtonText: 'Cancel', ...swalTheme, focusConfirm: false,
      preConfirm: () => (document.getElementById('swal-fc')?.value || '').trim(),
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      const val = result.value;
      if (!val) { await swalError('Missing', 'Please enter a fuel card number.'); return; }
      const confirm2 = await swalConfirm({
        title: 'Save fuel card?',
        html: `Update <strong>${selectedHearse.plate_number}</strong>'s card to <strong style="font-family:monospace">${val}</strong>?`,
        confirmButtonText: 'Yes, save', cancelButtonText: 'Cancel',
      });
      if (!confirm2.isConfirmed) return;
      setSavingFuelCard(true);
      try {
        await request(`/hearses/${encodeURIComponent(selectedHearse.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fuel_card_number: val }) });
        setHearses((c) => c.map((h) => String(h.id) === String(selectedHearse.id) ? { ...h, fuel_card_number: val } : h));
        await loadFleet(true);
        await swalSuccess('Fuel card saved', `${selectedHearse.plate_number} now uses ${val}.`);
      } catch (e) { await swalError('Failed', e.message); }
      finally { setSavingFuelCard(false); }
    });
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <FleetPage $embedded={embedded}>
      <PageWidth>
        <Header>
          <TitleGroup>
            <HeaderIcon><Truck size={23} /></HeaderIcon>
            <div><Title>Hearse Fleet</Title><Subtitle>Vehicle details, registration plates, status and fuel cards</Subtitle></div>
          </TitleGroup>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <ActionButton onClick={() => loadFleet(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'fleet-spin' : ''} /> Refresh</ActionButton>
            <ActionButton $primary onClick={() => navigate(`/${slug}/hearse`)}><CarFront size={15} /> Vehicle registration</ActionButton>
          </div>
        </Header>

        <AccountPanel>
          <AccountOverview>
            <AccountBrand>
              <img src="https://apifactory.totalenergies.com/images/total_energies_logo.png" alt="TotalEnergies" />
              <div><h2>TotalEnergies main account</h2></div>
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
            <LedgerForm onSubmit={(e) => submitFuelAction(e, 'deposit', '/hearse-fuel/deposits', { amount: depositDraft.amount, reference: depositDraft.reference, transaction_date: depositDraft.transactionDate }, 'Cheque deposit added.')}>
              <h3>Load cheque / deposit</h3>
              <input type="number" min="0.01" step="0.01" required value={depositDraft.amount} onChange={(e) => setDepositDraft((c) => ({ ...c, amount: e.target.value }))} placeholder="Amount (KES)" />
              <input type="text" value={depositDraft.reference} onChange={(e) => setDepositDraft((c) => ({ ...c, reference: e.target.value }))} placeholder="Cheque or deposit reference" />
              <input type="date" required value={depositDraft.transactionDate} onChange={(e) => setDepositDraft((c) => ({ ...c, transactionDate: e.target.value }))} />
              <ActionButton type="submit" $primary disabled={savingFuelAction !== ''}>{savingFuelAction === 'deposit' ? 'Recording...' : 'Record deposit'}</ActionButton>
            </LedgerForm>
            <LedgerForm onSubmit={(e) => submitFuelAction(e, 'threshold', '/hearse-fuel/threshold', { low_balance_threshold: thresholdDraft }, 'Threshold updated.')}>
              <h3>Low card balance alert</h3>
              <input type="number" min="0" step="0.01" required value={thresholdDraft} onChange={(e) => setThresholdDraft(e.target.value)} />
              <p style={{ margin: 0, color: '#747a87', fontSize: 11 }}>Alert when card balance falls below this KES amount.</p>
              <ActionButton type="submit" $primary disabled={savingFuelAction !== ''}>{savingFuelAction === 'threshold' ? 'Saving...' : 'Save threshold'}</ActionButton>
            </LedgerForm>
          </AccountControls>
        </AccountPanel>

        {lowFuelCards.length > 0 && (
          <InlineAlert role="status">
            <AlertCircle size={17} />
            <span><strong>{lowFuelCards.length} fuel card{lowFuelCards.length === 1 ? '' : 's'} below threshold:</strong> {lowFuelCards.map((c) => `${c.plate_number} (${formatKES(c.balance)})`).join(', ')}</span>
          </InlineAlert>
        )}

        {/* ── ACTIVITY PANEL — hidden by default, shown after clicking "View" ── */}
        {!showActivityPanel ? (
          <ActivityPanel style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: BTN_BLUE, color: '#fff', display: 'grid', placeItems: 'center' }}><Zap size={18} /></span>
                <div>
                  <strong style={{ fontSize: 14, fontWeight: 800 }}>Fuel account activity</strong>
                  <div style={{ fontSize: 11, color: '#6b7180', marginTop: 2 }}>{allTransactions.length} transaction{allTransactions.length === 1 ? '' : 's'} recorded</div>
                </div>
              </div>
              <SmButton type="button" onClick={() => setShowActivityPanel(true)}><ChevronRight size={13} /> View activity</SmButton>
            </div>
          </ActivityPanel>
        ) : (
          <ActivityPanel>
            <ActivityPanelHeader>
              <h2>Fuel account activity</h2>
              <ActivityFilters>
                <ActivityFilterBtn $active={activityFilter === 'all'} $color={BTN_PRIMARY} $bg="#eef2f8" onClick={() => setActivityFilter('all')}><span className="dot" /> All <span style={{ opacity: .6 }}>({activityCounts.all})</span></ActivityFilterBtn>
                {Object.entries(ACTIVITY_META).map(([key, meta]) => (
                  <ActivityFilterBtn key={key} $active={activityFilter === key} $color={meta.color} $bg={meta.bg} onClick={() => setActivityFilter(key)}><span className="dot" /> {meta.label} <span style={{ opacity: .6 }}>({activityCounts[key]})</span></ActivityFilterBtn>
                ))}
              </ActivityFilters>
            </ActivityPanelHeader>
            <ActivityLayout>
              <CalendarWrap>
                <CalendarHeader>
                  <CalendarMonthNav>
                    <CalNavBtn type="button" onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={14} /></CalNavBtn>
                    <strong>{calendarMonthLabel}</strong>
                    <CalNavBtn type="button" onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={14} /></CalNavBtn>
                  </CalendarMonthNav>
                  <CalNavBtn type="button" onClick={() => { const n = new Date(); setCalendarMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }}>Today</CalNavBtn>
                </CalendarHeader>
                <CalendarTable>
                  <thead><tr>{WEEKDAYS.map((d) => <CalHead key={d}>{d}</CalHead>)}</tr></thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, weekIdx) => (
                      <tr key={weekIdx}>
                        {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, ci) => {
                          const dateKey = cell.date ? `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}` : '';
                          const acts = calendarActivities.get(dateKey) || [];
                          const visibleActs = activityFilter === 'all' ? acts : acts.filter((a) => a.transaction_type === activityFilter);
                          return (
                            <CalCell key={ci} className={[cell.otherMonth ? 'other-month' : '', dateKey === todayKey ? 'today' : ''].join(' ')}>
                              <span className="cal-day">{cell.day}</span>
                              {visibleActs.length > 0 && <div className="cal-dots">{visibleActs.slice(0, 4).map((a, i) => <span key={i} className="cal-dot" style={{ background: activityMeta(a.transaction_type).color }} />)}</div>}
                            </CalCell>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </CalendarTable>
                <CalendarLegend>
                  {Object.entries(ACTIVITY_META).map(([key, meta]) => (<span key={key}><span className="dot" style={{ background: meta.color }} /> {meta.label}</span>))}
                </CalendarLegend>
              </CalendarWrap>
              <ActivityList>
                {filteredTransactions.length === 0 ? (
                  <Empty><Zap size={24} /><strong>No activity yet</strong><span>Fuel transactions will appear here once recorded.</span></Empty>
                ) : filteredTransactions.map((t) => {
                  const meta = activityMeta(t.transaction_type);
                  const label = t.transaction_type === 'deposit' ? 'Cheque / account deposit' : t.transaction_type === 'allocation' ? `Allocated to ${t.hearse_plate || 'fuel card'}` : `Fuel purchase · ${t.station || 'station not entered'}`;
                  const Icon = t.transaction_type === 'deposit' ? Wallet : t.transaction_type === 'allocation' ? CreditCard : Zap;
                  return (
                    <ActivityRow key={t.id} $color={meta.color} $bg={meta.bg}>
                      <ActivityIcon $bg={meta.bg} $color={meta.color}><Icon size={16} /></ActivityIcon>
                      <ActivityBody><strong>{label}</strong><span>{t.reference || t.fuel_card_number || 'No reference'} · {String(t.transaction_date).slice(0, 10)}</span></ActivityBody>
                      <ActivityAmount className={t.transaction_type === 'deposit' ? 'pos' : 'neg'}><strong>{t.transaction_type === 'deposit' ? `+${formatKES(t.amount)}` : `−${formatKES(t.amount)}`}</strong><span>{meta.label}</span></ActivityAmount>
                    </ActivityRow>
                  );
                })}
                {allTransactions.length > 3 && (<ViewMoreBtn type="button" onClick={() => setShowAllActivity((v) => !v)}>{showAllActivity ? 'Show less' : `View more (${allTransactions.length - 3} more)`}</ViewMoreBtn>)}
              </ActivityList>
            </ActivityLayout>
            <ViewMoreBtn type="button" onClick={() => setShowActivityPanel(false)} style={{ marginTop: 14 }}>▲ Hide activity panel</ViewMoreBtn>
          </ActivityPanel>
        )}

        <SummaryGrid>
          <SummaryCard><SummaryIcon><Truck size={19} /></SummaryIcon><div><SummaryValue>{counts.total}</SummaryValue><SummaryLabel>Total hearses</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone="green"><CheckCircle2 size={19} /></SummaryIcon><div><SummaryValue>{counts.available}</SummaryValue><SummaryLabel>Marked available</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone="gold"><Wrench size={19} /></SummaryIcon><div><SummaryValue>{counts.maintenance}</SummaryValue><SummaryLabel>Maintenance / inspection</SummaryLabel></div></SummaryCard>
          <SummaryCard><SummaryIcon $tone={counts.lowFuelCards ? 'red' : 'green'}><CreditCard size={19} /></SummaryIcon><div><SummaryValue>{counts.lowFuelCards}</SummaryValue><SummaryLabel>Cards below threshold</SummaryLabel></div></SummaryCard>
        </SummaryGrid>

        {error && (<InlineAlert role="alert"><AlertCircle size={17} /> {error}<ActionButton $primary onClick={() => loadFleet(true)} disabled={refreshing}>Try again</ActionButton></InlineAlert>)}

        <MainGrid>
          <FleetList>
            <ListHeader>
              <ListTitleRow><h2>Fleet vehicles</h2><span>{filteredHearses.length} of {hearses.length}</span></ListTitleRow>
              <SearchBox><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate, name, model..." /></SearchBox>
              <FilterRow>{filters.map((item) => (<FilterButton key={item.id} type="button" $active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{item.count}</span></FilterButton>))}</FilterRow>
            </ListHeader>
            <HearseList>
              {loading ? (<Empty><RefreshCw size={24} /><strong>Loading fleet</strong><span>Fetching registered vehicles.</span></Empty>)
                : filteredHearses.length === 0 ? (<Empty><CarFront size={26} /><strong>{hearses.length ? 'No matching hearses' : 'No hearses registered'}</strong><span>{hearses.length ? 'Try another search or filter.' : 'Use Vehicle registration to add the first vehicle.'}</span></Empty>)
                  : filteredHearses.map((h) => {
                    const meta = statusMeta(h.status);
                    return (
                      <HearseCard key={h.id} role="button" tabIndex={0} $selected={String(h.id) === String(selectedId)} onClick={() => setSelectedId(h.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(h.id); } }}>
                        <HearseCardText>
                          <HearseCardTop>
                            <span><Plate>{h.plate_number || `Hearse ${h.id}`}</Plate><CardName>{h.hearse_name || 'Unnamed hearse'}{h.model ? ` · ${h.model}` : ''}</CardName></span>
                            <StatusBadge $tone={meta.color}><StatusDot />{meta.label}</StatusBadge>
                          </HearseCardTop>
                          <CardFooter><span><MapPin size={13} />{h.branch_name || h.branch_code || 'Branch not set'}</span><span><CreditCard size={13} />{h.fuel_card_number || 'No fuel card'}</span></CardFooter>
                        </HearseCardText>
                        <VehicleThumb>{h.image ? <img src={imageUrl(h.image)} alt="" /> : <Truck size={25} />}</VehicleThumb>
                      </HearseCard>
                    );
                  })}
            </HearseList>
          </FleetList>

          <Details>
            {selectedHearse ? (
              <DetailCard>
                <DetailHeader>
                  <VehicleIdentity>
                    <VehicleMark>{selectedHearse.image ? <img src={imageUrl(selectedHearse.image)} alt="" /> : <Truck size={26} />}</VehicleMark>
                    <div><DetailTitle>{selectedHearse.plate_number || `Hearse ${selectedHearse.id}`}</DetailTitle><DetailSub>{selectedHearse.hearse_name || 'Unnamed hearse'}{selectedHearse.model ? ` · ${selectedHearse.model}` : ''}</DetailSub></div>
                  </VehicleIdentity>
                  <StatusBadge $tone={statusMeta(selectedHearse.status).color}><StatusDot />{statusMeta(selectedHearse.status).label}</StatusBadge>
                </DetailHeader>

                <FuelCardRow>
                  <FCIcon><CreditCard size={18} /></FCIcon>
                  <FCInfo><span>Fuel card number</span><strong>{selectedHearse.fuel_card_number || 'Not assigned'}</strong></FCInfo>
                  <SmButton type="button" onClick={openFuelCardEditor} disabled={savingFuelCard}><Edit3 size={13} /> Edit</SmButton>
                </FuelCardRow>

                <FactsGrid>
                  <Fact><span>Fleet ID</span><strong>{selectedHearse.id}</strong></Fact>
                  <Fact><span>Capacity</span><strong>{selectedHearse.capacity || 'N/A'}</strong></Fact>
                  <Fact><span>Branch</span><strong>{selectedHearse.branch_name || selectedHearse.branch_code || 'N/A'}</strong></Fact>
                  <Fact><span>Model</span><strong>{selectedHearse.model || 'N/A'}</strong></Fact>
                  <Fact><span>Registration</span><strong>{selectedHearse.plate_number || 'N/A'}</strong></Fact>
                  <Fact><span>Total allocated</span><strong>{formatKES(cardAllocated)}</strong></Fact>
                </FactsGrid>

                <FuelPanel>
                  <FuelPanelHeader>
                    <div className="fph-left"><CreditCard size={15} /><h3>Fuel-card funds</h3></div>
                    <div className="fph-right">
                      <SmButton type="button" disabled={savingFuelAction !== ''} onClick={openAllocateModal}><Wallet size={13} /> Allocate funds</SmButton>
                      {selectedFuelCard && <BalanceBadge className={selectedFuelCard.is_low ? 'low' : 'good'}>{selectedFuelCard.is_low ? 'Low balance' : 'Balance OK'}</BalanceBadge>}
                    </div>
                  </FuelPanelHeader>
                  {!selectedHearse.fuel_card_number ? (
                    <DetailSub>Assign a TotalEnergies card to this vehicle to display and track its balance.</DetailSub>
                  ) : (
                    <>
                      <FuelFacts>
                        <FuelFact><span>Recorded card</span><strong>{selectedHearse.fuel_card_number}</strong></FuelFact>
                        <FuelFact><span>Recorded balance</span><strong>{formatKES(cardBalance)}</strong></FuelFact>
                      </FuelFacts>
                      <FuelChartsGrid>
                        {/* Chart 1: Donut — Balance vs Spent */}
                        <FuelMetricCard>
                          <FuelMetricHeader>
                            <FuelMetricTitle><FuelMetricIcon><CreditCard size={14} /></FuelMetricIcon>Fuel Card Balance</FuelMetricTitle>
                            <FuelMetricTotal><strong>{formatKES(cardAllocated)}</strong><span>Total allocated</span></FuelMetricTotal>
                          </FuelMetricHeader>
                          {cardAllocated > 0 ? (
                            <BalanceDonut>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={balanceDonutData} dataKey="value" nameKey="name" innerRadius={47} outerRadius={66} paddingAngle={2} startAngle={90} endAngle={-270}>
                                    {balanceDonutData.map((e) => <Cell key={e.name} fill={e.color} />)}
                                  </Pie>
                                  <Tooltip formatter={(v) => formatKES(Number(v))} />
                                </PieChart>
                              </ResponsiveContainer>
                              <DonutCenter><strong>{formatKES(cardBalance)}</strong><span>Available</span></DonutCenter>
                            </BalanceDonut>
                          ) : <NoChartData>No allocated funds recorded for this card yet.</NoChartData>}
                          <FuelStatRow>
                            <FuelStat><strong>{formatKES(cardSpent)}</strong><span>Spent to date</span></FuelStat>
                            <FuelStat><strong>{formatKES(spentThisMonth)}</strong><span>Spent this month</span></FuelStat>
                          </FuelStatRow>
                        </FuelMetricCard>

                        {/* Chart 2: Line — Balance Trend */}
                        <FuelMetricCard>
                          <FuelMetricHeader>
                            <FuelMetricTitle><FuelMetricIcon><TrendingUp size={14} /></FuelMetricIcon>Card Balance Trend</FuelMetricTitle>
                            <FuelMetricTotal><strong>{formatKES(cardBalance)}</strong><span>Current balance</span></FuelMetricTotal>
                          </FuelMetricHeader>
                          <FuelTrendChart>
                            {balanceHistory.length ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={balanceHistory} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="2 2" />
                                  <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                                  <Tooltip labelFormatter={(d) => `Date: ${d}`} formatter={(v) => formatKES(Number(v))} />
                                  <Line type="monotone" dataKey="balance" name="Recorded balance" stroke="#e45a4f" strokeWidth={2} dot={{ r: 2, fill: '#e45a4f' }} activeDot={{ r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : <NoChartData>No balance history recorded this week.</NoChartData>}
                          </FuelTrendChart>
                          <FuelStatRow>
                            <FuelStat><strong>{statusMeta(selectedHearse.status).label}</strong><span>Current status</span></FuelStat>
                            <FuelStat><strong>7 days</strong><span>Balance history</span></FuelStat>
                          </FuelStatRow>
                        </FuelMetricCard>

                        {/* Chart 3: Latest Activity + Sparkline */}
                        <FuelMetricCard>
                          <FuelMetricHeader>
                            <FuelMetricTitle><FuelMetricIcon><Zap size={14} /></FuelMetricIcon>Latest Activity</FuelMetricTitle>
                            <FuelMetricTotal>
                              <strong>{selectedFuelCard?.latest_activity?.transaction_date ? String(selectedFuelCard.latest_activity.transaction_date).slice(0, 10) : '—'}</strong>
                              <span>{selectedFuelCard?.latest_activity?.station || selectedFuelCard?.latest_activity?.reference || 'Card ledger'}</span>
                            </FuelMetricTotal>
                          </FuelMetricHeader>
                          <FuelStat><span>{latestActivityDriver ? `Driver fuelling · ${latestActivityDriver}` : latestActivityLabel}</span></FuelStat>
                          <FuelActivityValue>{selectedFuelCard?.latest_activity ? `${selectedFuelCard.latest_activity.transaction_type === 'fuel_purchase' ? '−' : '+'}${formatKES(activityTotal)}` : 'No activity'}</FuelActivityValue>
                          <FuelActivitySparkline>
                            {balanceHistory.length ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={balanceHistory} margin={{ top: 8, right: 2, bottom: 0, left: 2 }}>
                                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="2 2" />
                                  <Tooltip labelFormatter={(d) => `Date: ${d}`} formatter={(v) => formatKES(Number(v))} />
                                  <Line type="monotone" dataKey="purchases" name="Fuel purchases" stroke="#e45a4f" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : <NoChartData>No recent card activity.</NoChartData>}
                          </FuelActivitySparkline>
                        </FuelMetricCard>

                        {/* Chart 4: Gauge — Balance remaining */}
                        <FuelMetricCard>
                          <FuelMetricHeader>
                            <FuelMetricTitle><FuelMetricIcon><Settings2 size={14} /></FuelMetricIcon>Fuel Spend</FuelMetricTitle>
                            <FuelMetricTotal><strong>{formatKES(spentThisMonth)}</strong><span>Spent this month</span></FuelMetricTotal>
                          </FuelMetricHeader>
                          {allocatedFunds > 0 ? (
                            <>
                              <FuelGaugeWrap>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={consumptionData} dataKey="value" nameKey="name" cx="50%" cy="82%" innerRadius={53} outerRadius={72} startAngle={180} endAngle={0} paddingAngle={2}>
                                      {consumptionData.map((e) => <Cell key={e.name} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatKES(Number(v))} />
                                  </PieChart>
                                </ResponsiveContainer>
                                <FuelGaugeCenter><strong>{remainPct}%</strong><span>balance remaining</span></FuelGaugeCenter>
                              </FuelGaugeWrap>
                              <FuelStatRow>
                                <FuelStat><strong>{formatKES(cardBalance)}</strong><span>Remaining on card</span></FuelStat>
                                <FuelStat><strong>{formatKES(cardAllocated)}</strong><span>Total allocated</span></FuelStat>
                              </FuelStatRow>
                            </>
                          ) : <NoChartData>No funds allocated to this card yet.</NoChartData>}
                        </FuelMetricCard>
                      </FuelChartsGrid>
                    </>
                  )}
                </FuelPanel>

                {['booked', 'in_transit'].includes(statusKey(selectedHearse.status)) ? (
                  <DetailSub style={{ marginTop: 16 }}>This vehicle is assigned to active work, so its operational availability is managed by the assignment workflow.</DetailSub>
                ) : (
                  <StatusEditor onSubmit={saveStatus} style={{ marginTop: 16 }}>
                    <Settings2 size={16} color="#777e8b" />
                    <select aria-label="Change hearse status" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ActionButton type="submit" $primary disabled={savingStatus || statusDraft === statusKey(selectedHearse.status)}>{savingStatus ? 'Saving...' : 'Update status'}</ActionButton>
                  </StatusEditor>
                )}
              </DetailCard>
            ) : (
              <Empty style={{ minHeight: 420 }}><Truck size={30} /><strong>{loading ? 'Loading fleet details' : 'Select a hearse'}</strong><span>Choose a vehicle to inspect its registration, fuel card and service status.</span></Empty>
            )}
          </Details>
        </MainGrid>
      </PageWidth>
      <style>{`@keyframes fleetSpin { to { transform: rotate(360deg); } } .fleet-spin { animation: fleetSpin 1s linear infinite; }`}</style>
    </FleetPage>
  );
}

export default FleetDashboard;
