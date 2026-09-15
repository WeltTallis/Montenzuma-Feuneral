/* ─────────────────────────────────────────────────────────────────────────
   DeceasedSidePanel — a right-drawer that shows the FULL deceased record,
   matching the deceased profile detail page. Fetches the live record by id
   and falls back to whatever the dashboard row already carried.

   PERFORMANCE: All API calls are parallelized with Promise.allSettled.
   Content renders INSTANTLY from cached row data, then updates when
   fresh data arrives. No loader blocking — stale-while-revalidate pattern.

   Icons are inline SVG components — no lucide-react import.
   ───────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import Loader from "../../components/loader/loader";
import api from "../../api/axios";
import { deceasedApi } from "../../api/deceasedApi";
import { formatDate, getDaysInMorgue, getInitials } from "../../components/deceased/deceasedinfo/theme";
import env from "../../utils/config/env";
import { rebaseUploadUrl } from "../../utils/tenantResolver/tenantBranding";

// ── Simple in-memory cache (survives within session, avoids refetch) ──────
const _cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function _getCached(key) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  return null;
}
function _setCache(key, data) {
  _cache.set(key, { ts: Date.now(), data });
}


// ── inline SVG icon factory ────────────────────────────────────────────────
function SvgIcon({ path, circle, size = 16, color = "currentColor", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {circle && <circle cx={circle.cx} cy={circle.cy} r={circle.r} />}
      {path && <path d={path} />}
    </svg>
  );
}

// Named icon paths (replacing X, Phone, User, MapPin, Calendar, Tag,
// Droplets, IdCard, Building2 from the broken lucide-react export)
const SVG_ICONS = {
  X: "M18 6 6 18M6 6l12 12",
  Phone: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10ZM8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z",
  User: "M16 21v-2a4 4 0 0 0-3-3.87M9 19v2a4 4 0 0 0 3.87 3M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  MapPin: "M21 10.25A9 9 0 1 1 13.75 2a9 9 0 0 1 7.25 8.25Z",
  Calendar: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H4V9h13v9Z",
  Tag: "M9 4h6a2 2 0 0 1 2 2v2.59a2 2 0 0 1-.59 1.42L12 14.83l-4.41 4.42A2 2 0 0 1 6 18V8a2 2 0 0 1 2-2h1Z",
  Droplets: "M12 2C7.58 2 4 5.58 4 10c0 4.42 7.16 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8Z",
  IdCard: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H4V6h16v12Z",
  Building2: "M4 6h16v2H4ZM4 10h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z",
  UserCheck: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM16 11l2 2 4-4",
};

const X = (p) => <SvgIcon path={SVG_ICONS.X}         {...p} />;
const Phone = (p) => <SvgIcon path={SVG_ICONS.Phone}     {...p} />;
const User = (p) => <SvgIcon path={SVG_ICONS.User}      {...p} />;
const MapPin = (p) => <SvgIcon path={SVG_ICONS.MapPin}    {...p} />;
const Calendar = (p) => <SvgIcon path={SVG_ICONS.Calendar}  {...p} />;
const Tag = (p) => <SvgIcon path={SVG_ICONS.Tag}       {...p} />;
const Droplets = (p) => <SvgIcon path={SVG_ICONS.Droplets}  {...p} />;
const IdCard = (p) => <SvgIcon path={SVG_ICONS.IdCard}    {...p} />;
const Building2 = (p) => <SvgIcon path={SVG_ICONS.Building2} {...p} />;
const UserCheck = (p) => <SvgIcon path={SVG_ICONS.UserCheck} {...p} />;

// ── Profile-style section head, matching the deceased profile page ─────────
function PanelSection({ num, title, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <div
        className="flex items-center gap-1.5 pb-1 mb-1.5 border-b-2 text-[11px] font-bold uppercase tracking-wider text-slate-900"
        style={{ borderColor: "#0f172a", width: "fit-content" }}
      >
        <span className="opacity-45 text-[9px]">{num}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Compact label/value row (tiny uppercase label, semibold value) ─────────
function Row({ label, value, mono, full }) {
  return (
    <div
      className={
        (full ? "col-span-2 " : "") +
        "py-1.5 border-b border-slate-100 last:border-0 min-w-0"
      }
    >
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div
        className={
          "text-[13px] font-semibold text-slate-900 break-words" +
          (mono ? " font-mono text-[12px]" : "")
        }
      >
        {String(value ?? "—")}
      </div>
    </div>
  );
}

function SignatureDisplay({ path }) {
  const [failed, setFailed] = useState(false);

  const buildUrl = (p) => {
    if (!p) return null;
    if (p.startsWith("data:image")) return p;
    if (p.startsWith("http")) return rebaseUploadUrl(p);
    if (p.startsWith("/")) return `${env.UPLOADS_URL}${p}`;
    const clean = p.replace(/^\/+/, "");
    return `${env.UPLOADS_URL}/${clean}`;
  };

  const src = buildUrl(path);
  if (!path) return null;

  return failed ? (
    <a href={src} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 underline">
      Click to view signature ↗
    </a>
  ) : (
    <img
      src={src}
      alt="Next of Kin Signature"
      onError={() => setFailed(true)}
      style={{ maxWidth: "100%", maxHeight: 200, marginTop: 6, background: "#fff", padding: 6, objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: 8 }}
    />
  );
}

export default function DeceasedSidePanel({ booking, onClose }) {
  // ── State — start with INSTANT row data, no loader ─────────────────────
  const [deceased, setDeceased] = useState(booking); // instant from row
  const [nextOfKin, setNextOfKin] = useState(null);
  const [postmortem, setPostmortem] = useState(null);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false); // NO loader on open
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("overview");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Ref to track if component is still mounted (avoids setState on unmount)
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const id = booking?.deceased_id || booking?.id || booking?.admission_number;

  // Branch-aware detail fetches: records aggregated across every branch carry
  // the owning branch's slug (_branchSlug) — scope NOK / postmortem / billing
  // calls to that branch so cross-branch records resolve their own data.
  const branchSlug = booking?._branchSlug || booking?.branch_slug || booking?.branchDbName || null;
  const branchCfg = branchSlug ? { headers: { "x-tenant-slug": branchSlug } } : undefined;

  // ── PARALLEL fetch: all endpoints at once, no waterfall ──────────────
  const fetchAll = useCallback(async () => {
    if (!id) { setDeceased(booking); return; }

    // Check cache first — instant render if fresh
    const cacheKey = `${id}-${branchSlug}`;
    const cached = _getCached(cacheKey);
    if (cached) {
      if (cached.deceased) setDeceased(cached.deceased);
      if (cached.nextOfKin) setNextOfKin(cached.nextOfKin);
      if (cached.postmortem) setPostmortem(cached.postmortem);
      if (cached.charges) setCharges(cached.charges);
      if (cached.payments) setPayments(cached.payments);
      setLastRefreshed(new Date());
      return;
    }

    // Fire ALL requests in parallel — no waiting between them
    setLoading(true); setError("");
    try {
      const [deceasedRes, nokRes, pmRes, billingRes] = await Promise.allSettled([
        api.get(`/deceased/deceased-id/${id}`, branchCfg),
        deceasedApi.getNextOfKin(id, branchCfg).catch(() => null),
        api.get(`/deceased/postmortem/${id}`, branchCfg).catch(() => null),
        api.get(`/deceased/billing-summary/${id}`, branchCfg).catch(() => null),
      ]);

      if (!mounted.current) return;

      // Process deceased result
      if (deceasedRes.status === "fulfilled") {
        const data = deceasedRes.value?.data?.data || deceasedRes.value?.data?.deceased || booking;
        setDeceased(data);
      } else {
        setDeceased(booking);
        setError("Couldn't refresh — using row data");
      }

      // Process NOK result
      if (nokRes.status === "fulfilled" && nokRes.value) {
        const list = Array.isArray(nokRes.value?.data) ? nokRes.value.data : (nokRes.value?.data ? [nokRes.value.data] : []);
        if (list[0]) setNextOfKin(list[0]);
      }

      // Process postmortem result
      if (pmRes.status === "fulfilled" && pmRes.value?.data?.data) {
        setPostmortem(pmRes.value.data.data);
      }

      // Process billing result
      if (billingRes.status === "fulfilled") {
        const bd = billingRes.value?.data?.data;
        if (bd) {
          if (bd.charges) setCharges(Array.isArray(bd.charges) ? bd.charges : [bd.charges]);
          if (bd.payments) setPayments(Array.isArray(bd.payments) ? bd.payments : []);
        }
      }

      // Update cache & timestamp (pre-compute values for clarity)
      const ts = new Date();
      setLastRefreshed(ts);

      const _nokList = (() => {
        if (nokRes.status !== "fulfilled" || !nokRes.value) return [];
        const l = Array.isArray(nokRes.value.data) ? nokRes.value.data : (nokRes.value.data ? [nokRes.value.data] : []);
        return l;
      })();
      const _billData = billingRes.status === "fulfilled" ? billingRes.value?.data?.data : null;
      _setCache(cacheKey, {
        deceased: deceasedRes.status === "fulfilled" ? (deceasedRes.value?.data?.data || deceasedRes.value?.data?.deceased || booking) : booking,
        nextOfKin: _nokList[0] || null,
        postmortem: pmRes.status === "fulfilled" ? (pmRes.value?.data?.data || null) : null,
        charges: _billData?.charges ? (Array.isArray(_billData.charges) ? _billData.charges : [_billData.charges]) : [],
        payments: _billData?.payments ? (Array.isArray(_billData.payments) ? _billData.payments : []) : [],
      });
    } catch (e) {
      console.warn("[DeceasedSidePanel] fetch error:", e?.message);
      setDeceased(booking);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [id, booking, branchSlug]);

  // Initial fetch — fires once on mount
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Refresh handler — only shows spinner on refresh button ─────────────
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchAll();
  };

  // ── Derived values (memoized to avoid recalculation) ────────────────────
  const d = useMemo(() => deceased || booking || {}, [deceased, booking]);
  const k = useMemo(() => nextOfKin || (d.contact_person || d.phone_number || d.relationship || d.national_id ? {
    full_name: d.contact_person || "",
    relationship: d.relationship || "",
    id_number: d.national_id || d.id_number || "",
    contact: d.phone_number || d.tel_number || "",
  } : {}), [nextOfKin, d.contact_person, d.phone_number, d.relationship, d.national_id, d.id_number, d.tel_number]);
  const signaturePath = d.signature || nextOfKin?.signature || k?.signature;

  const fullName    = d.full_name || d.name || d.deceased_name || d.name_of_deceased || "Unknown";
  const admissionNo = d.admission_number || d.admission_no || "—";
  const status      = d.admission_status || d.status || "—";

  // ── Sidebar stats (mirrors the profile's DeceasedSidebar) ──
  const sex          = d.sex || d.gender || "";
  const isFemale     = sex.toLowerCase() === "female";
  const age          = d.age || null;
  const bodyStatus   = d.body_status || d.body_condition || d.embalming_status || "In Morgue";
  const embalmed     = d.embalmed ?? (String(d.admission_status || "").toLowerCase() === "embalmed");
  const daysInMorgue = getDaysInMorgue(d.date_admitted || d.admission_date || d.created_at);

  const totalCharges = useMemo(() => charges.reduce((s, c) => s + parseFloat(c.amount || c.charge_amount || 0), 0), [charges]);
  const totalPaid    = useMemo(() => payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0), [payments]);
  const balance      = totalCharges - totalPaid;
  const fmtK = (n) => (Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`);

  // ── Storage charge math (mirrors the profile sidebar) ──
  const dailyRate     = parseFloat(d.charges?.storage_rate) || 500;
  const storageCharge = Math.round(daysInMorgue * dailyRate);

  const pmStatus = postmortem?.status || null;

  // Tracked postmortem REQUEST payload (carried by the dashboard row when the
  // user clicked a postmortem-request row in the quad / day-breakdown panels).
  const pmReq = booking?.pm_request || null;
  const pmReqStatus = String(pmReq?.status || "").toLowerCase();

  const progressSteps = [
    { done: true, text: "Admitted to Morgue", time: formatDate(d.created_at || d.date_admitted) },
    {
      done: !!embalmed,
      active: !embalmed,
      text: embalmed ? "Body Embalmed" : "Body Awaiting Embalming",
      time: embalmed ? formatDate(d.embalmed_date) : "Pending",
    },
    {
      done: pmStatus === "completed",
      active: pmStatus === "pending" || pmStatus === "in_progress",
      text: pmStatus
        ? (pmStatus === "completed" ? "Postmortem Completed"
          : pmStatus === "pending" || pmStatus === "in_progress" ? "Postmortem In Progress"
          : "Postmortem Requested")
        : "Postmortem Not Requested",
      time: pmStatus === "completed"
        ? formatDate(postmortem.completed_at || postmortem.updated_at)
        : pmStatus === "pending" || pmStatus === "in_progress"
          ? "Awaiting Results"
          : postmortem ? formatDate(postmortem.requested_at || postmortem.created_at) : "—",
    },
    {
      active: bodyStatus === "In Morgue" || bodyStatus === "Active",
      text: `In Storage (${bodyStatus})`,
      time: "Currently Active",
    },
    { muted: true, text: "Released to Family", time: "Pending", timeMuted: true },
  ];

  // Rows mirror the profile Overview tab (01 Admission / 02 Next of Kin).
  const admissionRows = [
    { label: "Admission Number", value: admissionNo, mono: true },
    { label: "Date Admitted", value: formatDate(d.date_admitted || d.adm_date || d.created_at) },
    { label: "Time Received", value: d.time_received || d.admission_time, mono: true },
    { label: "Receiving Officer", value: d.receiving_officer || d.admitted_by || d.admitted_by_name },
    { label: "Body Status", value: d.body_status || d.body_condition || d.embalming_status },
    { label: "Received From", value: d.received_from },
    { label: "Date of Death", value: formatDate(d.date_of_death) },
    { label: "Place of Death", value: d.place_of_death },
    { label: "Physician", value: d.physician || d.attending_physician },
    { label: "Permit Number", value: d.permit_number, mono: true },
    { label: "Cause of Death", value: d.cause_of_death, full: true },
  ];

  const nokRows = [
    { label: "NOK Name", value: k.full_name || k.contact_person },
    { label: "Relationship", value: k.relationship },
    { label: "National ID", value: k.id_number || k.national_id, mono: true },
    { label: "Telephone", value: k.contact || k.phone_number || k.tel_number || k.tell_no },
    { label: "Alt. Phone", value: k.alternative_phone },
  ];

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-[200] flex flex-col shadow-2xl border-l bg-white"
        style={{ width: "min(640px, 94vw)", borderColor: "rgba(15,23,42,0.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-4 py-4 border-b"
          style={{ borderColor: "#eef1f5" }}
        >
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[15px]"
                style={{
                  fontFamily: "'Merriweather', serif",
                  background: isFemale ? "#7c5c46" : "#0f172a",
                }}
              >
                {getInitials(fullName)}
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold text-slate-900 leading-snug truncate">
                  {fullName}
                </h3>
                <div className="text-xs text-slate-500">
                  {sex ? `${sex}, ${age ? `${age} Years` : "—"}` : (age ? `${age} Years` : "")}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-2">
              {admissionNo}
            </div>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold mt-1.5 capitalize"
              style={{ backgroundColor: "#0F766E18", color: "#0F766E", border: "1px solid #0F766E28" }}
            >
              {status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="text-right mr-1 hidden sm:block">
              <div className="text-[9px] uppercase tracking-wide text-slate-400">Updated</div>
              <div className="text-[10px] text-slate-500 font-mono">
                {lastRefreshed
                  ? lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={refreshing ? "animate-spin" : ""}
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab bar — Overview / Postmortem / Financials (mirrors the profile tabs) */}
        <div
          className="flex gap-1 px-4 border-b"
          style={{ borderColor: "#eef1f5" }}
        >
          {[
            ["overview", "Overview"],
            ["postmortem", "Postmortem"],
            ["financials", "Financials"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide border-b-2 transition-colors " +
                (tab === key
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600 border-transparent")
              }
              style={{ borderColor: tab === key ? "#0f766e" : "transparent" }}
            >
              {label}
              {key === "financials" && charges.length > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: "#0f766e18", color: "#0f766e" }}
                >
                  {charges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body — renders IMMEDIATELY from row data, no loader blocking */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5">
          {error && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200">
              {error} — showing summary data.
            </div>
          )}

          {tab === "overview" ? (
            <div className="profile-panel-root">
              <style>{`
                .profile-panel-root {
                  --black: #0F172A;
                  --gray: #64748B;
                  --mid: #475569;
                  --lightGray: #94A3B8;
                  --borderLight: #E2E8F0;
                  --bg: #F1F5F9;
                  --white: #FFFFFF;
                  --success: #16A34A;
                  --successBg: #F0FDF4;
                  --warning: #D97706;
                  --warningBg: #FFFBEB;
                }
                .profile-sidebar-card {
                  background: var(--white);
                  border: 1px solid var(--borderLight);
                  border-radius: 16px;
                  width: 100%;
                  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                }
                .profile-sidebar-header {
                  background: var(--black);
                  color: white;
                  padding: 22px 24px;
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  border-bottom: 1px solid var(--borderLight);
                }
                .profile-header-avatar {
                  width: 54px; height: 54px;
                  border-radius: 12px;
                  background: rgba(255,255,255,0.1);
                  display: flex; align-items: center; justify-content: center;
                  font-family: 'IBM Plex Mono', monospace;
                  font-weight: 700; font-size: 18px;
                  flex-shrink: 0;
                }
                .profile-header-info { min-width: 0; flex: 1; }
                .profile-header-name {
                  font-family: 'Merriweather', serif;
                  font-size: 21px;
                  font-weight: 700;
                  line-height: 1.2;
                  white-space: normal;
                }
                .profile-header-meta {
                  font-size: 11px;
                  color: rgba(255,255,255,0.68);
                  margin-top: 4px;
                  font-family: 'IBM Plex Mono', monospace;
                  text-transform: uppercase;
                  letter-spacing: 0.08em;
                }
                .profile-tracker-container {
                  padding: 20px 24px;
                  border-bottom: 1px solid var(--borderLight);
                  background: #F8FAFC;
                }
                .profile-tracker { display: flex; align-items: center; justify-content: space-between; position: relative; }
                .profile-track-line { position: absolute; top: 10px; left: 18px; right: 18px; height: 2px; background: var(--borderLight); z-index: 1; }
                .profile-track-line.active { background: var(--success); width: 50%; left: 25%; }
                .profile-track-step { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 33.3%; }
                .profile-track-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--white); border: 2px solid var(--borderLight); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; }
                .profile-track-step.done .profile-track-dot { background: var(--success); border-color: var(--success); }
                .profile-track-step.active .profile-track-dot { background: var(--warning); border-color: var(--warning); box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.2); }
                .profile-track-label { font-size: 11px; font-weight: 600; color: var(--gray); }
                .profile-track-step.done .profile-track-label, .profile-track-step.active .profile-track-label { color: var(--black); }
                .profile-track-date { font-size: 9px; color: var(--lightGray); font-family: 'IBM Plex Mono', monospace; }
                .profile-sidebar-body {
                  padding: 22px 24px 12px;
                  overflow-y: auto;
                  flex: 1;
                }
                .profile-section-head {
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.1em;
                  text-transform: uppercase;
                  margin-bottom: 16px;
                  margin-top: 18px;
                  color: var(--mid);
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }
                .profile-section-head:first-child { margin-top: 0; }
                .profile-section-head::after {
                  content: '';
                  flex: 1;
                  height: 1px;
                  background: var(--borderLight);
                }
                .profile-section-head span {
                  background: var(--black);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 9px;
                  font-family: 'IBM Plex Mono', monospace;
                }
                .profile-detail-grid {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 16px 18px;
                }
                .profile-detail-grid + .profile-detail-grid {
                  margin-top: 14px;
                  padding-top: 14px;
                  border-top: 1px solid var(--borderLight);
                }
                .profile-detail-item {
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
                  min-width: 0;
                }
                .profile-detail-item.full { grid-column: span 2; }
                .profile-detail-item.full-3 { grid-column: 1 / -1; }
                .profile-detail-label {
                  font-size: 9px;
                  font-weight: 700;
                  letter-spacing: 0.12em;
                  text-transform: uppercase;
                  color: var(--lightGray);
                }
                .profile-detail-value {
                  font-size: 13px;
                  font-weight: 600;
                  color: var(--black);
                  word-break: break-word;
                  line-height: 1.4;
                }
                .profile-detail-value.empty {
                  color: var(--lightGray);
                  font-weight: 500;
                }
                .profile-pill {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  padding: 5px 10px;
                  border-radius: 6px;
                  text-transform: uppercase;
                  letter-spacing: 0.03em;
                }
                .profile-pill i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .profile-pill.success { background: var(--successBg); color: var(--success); }
                .profile-sidebar-footer {
                  background: #F8FAFC;
                  padding: 14px 24px;
                  display: flex;
                  align-items: center;
                  gap: 14px;
                  border-top: 1px solid var(--borderLight);
                }
                .profile-qr-box { background: white; padding: 4px; border: 1px solid var(--borderLight); border-radius: 6px; }
                .profile-footer-info { flex: 1; }
                .profile-footer-title { font-size: 13px; font-weight: 700; color: var(--black); }
                .profile-footer-sub { font-size: 11px; color: var(--gray); margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
                @media (max-width: 540px) {
                  .profile-detail-grid { grid-template-columns: 1fr 1fr; }
                }
              `}</style>

              <div className="profile-sidebar-card">
                <div className="profile-sidebar-header">
                  <div className="profile-header-avatar">{getInitials(fullName)}</div>
                  <div className="profile-header-info">
                    <div className="profile-header-name">{fullName}</div>
                    <div className="profile-header-meta">Deceased Profile Overview</div>
                  </div>
                </div>

                <div className="profile-tracker-container">
                  <div className="profile-tracker">
                    <div className="profile-track-line" />
                    <div className="profile-track-line active" />
                    <div className="profile-track-step done">
                      <div className="profile-track-dot">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span className="profile-track-label">Admitted</span>
                      <span className="profile-track-date">{formatDate(d.date_admitted || d.adm_date || d.created_at) || '—'}</span>
                    </div>
                    <div className="profile-track-step active">
                      <div className="profile-track-dot" />
                      <span className="profile-track-label">Postmortem</span>
                      <span className="profile-track-date">{postmortem ? 'In Progress' : 'Pending'}</span>
                    </div>
                    <div className="profile-track-step">
                      <div className="profile-track-dot" />
                      <span className="profile-track-label">Released</span>
                      <span className="profile-track-date">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="profile-sidebar-body">
                  <div className="profile-section-head"><span>01</span> Admission</div>
                  <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Admission Number</span>
                      <div className="profile-detail-value">{admissionNo}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Date Admitted</span>
                      <div className="profile-detail-value">{formatDate(d.date_admitted || d.adm_date || d.created_at) || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Time Received</span>
                      <div className="profile-detail-value">{d.time_received || d.admission_time || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Receiving Officer</span>
                      <div className="profile-detail-value">{d.receiving_officer || d.admitted_by || d.admitted_by_name || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Body Status</span>
                      <div className="profile-detail-value"><span className="profile-pill success"><i></i> {bodyStatus}</span></div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Permit Number</span>
                      <div className="profile-detail-value">{d.permit_number || '—'}</div>
                    </div>
                    <div className="profile-detail-item full-3">
                      <span className="profile-detail-label">Received From</span>
                      <div className="profile-detail-value">{d.received_from || '—'}</div>
                    </div>
                  </div>

                  <div className="profile-section-head"><span>02</span> Death Specifics</div>
                  <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Date of Death</span>
                      <div className="profile-detail-value">{formatDate(d.date_of_death) || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Place of Death</span>
                      <div className="profile-detail-value">{d.place_of_death || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Physician</span>
                      <div className="profile-detail-value empty">{d.physician || d.attending_physician || '—'}</div>
                    </div>
                    <div className="profile-detail-item full-3">
                      <span className="profile-detail-label">Cause of Death</span>
                      <div className="profile-detail-value">{d.cause_of_death || '—'}</div>
                    </div>
                  </div>

                  <div className="profile-section-head"><span>03</span> Next of Kin</div>
                  <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">NOK Name</span>
                      <div className="profile-detail-value">{k.full_name || k.contact_person || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Relationship</span>
                      <div className="profile-detail-value">{k.relationship || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">National ID</span>
                      <div className="profile-detail-value">{k.id_number || k.national_id || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Telephone</span>
                      <div className="profile-detail-value">{k.contact || k.phone_number || k.tel_number || '—'}</div>
                    </div>
                    <div className="profile-detail-item full-3">
                      <span className="profile-detail-label">Signature</span>
                      {signaturePath ? (
                        <div className="profile-detail-value" style={{ marginTop: 4 }}>
                          <SignatureDisplay path={signaturePath} />
                        </div>
                      ) : (
                        <div className="profile-detail-value empty">—</div>
                      )}
                    </div>
                  </div>

                  <div className="profile-section-head">Release Details</div>
                  <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Release ID</span>
                      <div className="profile-detail-value empty">—</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Scheduled Release Date</span>
                      <div className="profile-detail-value">Not scheduled</div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="profile-detail-label">Scheduled Release Time</span>
                      <div className="profile-detail-value empty">—</div>
                    </div>
                    <div className="profile-detail-item full-3">
                      <span className="profile-detail-label">Deceased</span>
                      <div className="profile-detail-value">{fullName}</div>
                    </div>
                  </div>
                </div>

                <div className="profile-sidebar-footer">
                  <div className="profile-qr-box">
                    <QRCodeSVG value={`https://restpoint.co/deceased/${admissionNo || fullName}`} size={52} bgColor="#ffffff" fgColor="#0F172A" />
                  </div>
                  <div className="profile-footer-info">
                    <div className="profile-footer-title">Body ID Tag</div>
                    <div className="profile-footer-sub">Scan to verify profile</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats strip — mirrors the profile sidebar */}
              <div
                className="grid grid-cols-4 rounded-lg overflow-hidden mb-4"
                style={{ border: "1px solid #e8ecef", background: "#e8ecef", gap: 1 }}
              >
                {[
                  { v: daysInMorgue, l: "Days in Morgue", c: "#b45309" },
                  { v: age ?? "—", l: "Age", c: "#0f172a" },
                  { v: `${fmtK(totalCharges)}`, l: "Charges (KES)", c: "#0f172a" },
                  { v: `${fmtK(balance)}`, l: "Balance (KES)", c: balance > 0 ? "#b91c1c" : "#0f766e" },
                ].map(({ v, l, c }) => (
                  <div key={l} className="bg-white px-1 py-2.5 text-center">
                    <div className="text-[15px] font-bold leading-tight" style={{ color: c }}>{v}</div>
                    <div className="text-[8.5px] uppercase tracking-wide text-slate-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>

              {tab === "postmortem" && (<>
                {!pmReq && !postmortem && (
                  <div className="rounded-lg px-3 py-6 text-center text-[12.5px] text-slate-400 bg-slate-50 border border-slate-100">
                    No postmortem recorded for this deceased.
                  </div>
                )}
                {postmortem && (
                  <PanelSection num="01" title="Postmortem Record">
                    <div className="grid grid-cols-2 gap-x-4">
                      <Row label="Status" value={pmStatus ? String(pmStatus).replace(/_/g, " ") : "—"} />
                      <Row label="Requested On" value={formatDate(postmortem.requested_at || postmortem.created_at)} />
                      <Row label="Completed On" value={postmortem.completed_at ? formatDate(postmortem.completed_at) : "Not completed"} />
                      <Row label="Doctor / Pathologist" value={postmortem.doctor_name || postmortem.pathologist || postmortem.requested_by} />
                      <Row label="Findings / Notes" value={postmortem.findings || postmortem.notes || postmortem.results} full />
                    </div>
                  </PanelSection>
                )}
                {pmReq && (
                  <PanelSection num="02" title="Postmortem Requests">
                    <div className="flex items-center justify-between gap-2 py-1.5 mb-1">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider"
                        style={
                          pmReqStatus === "cancelled"
                            ? { background: "#f1f5f9", color: "#64748b" }
                            : pmReqStatus === "sent"
                              ? { background: "#dbeafe", color: "#1d4ed8" }
                              : { background: "#fef3c7", color: "#b45309" }
                        }
                      >
                        {pmReqStatus === "cancelled" ? "Cancelled"
                          : (String(pmReq.exam_status || "").toLowerCase() === "completed" || pmStatus === "completed") ? "Completed"
                            : pmReqStatus === "sent" ? "Sent · Awaiting Exam"
                              : "Requested"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pmReq.request_ref || `REQ-${pmReq.id || ""}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <Row label="Requesting Authority" value={pmReq.requesting_authority} />
                      <Row label="Requested By" value={pmReq.requested_by} />
                      <Row label="Reason" value={pmReq.reason} full />
                      <Row label="Requested On" value={formatDate(pmReq.created_at)} />
                      <Row label="Sent To Authority" value={pmReq.sent_at ? formatDate(pmReq.sent_at) : "Not sent yet"} />
                      <Row label="Official Exam" value={pmStatus === "completed" ? "Completed" : pmStatus === "pending" || pmStatus === "in_progress" ? "In Progress" : pmStatus ? pmStatus : "Not carried out yet"} />
                    </div>
                  </PanelSection>
                )}

                <PanelSection num="04" title="Mortuary Progress">
                  <div>
                    {progressSteps.map(({ done, active, muted, text, time, timeMuted }) => (
                      <div key={text} className="flex gap-3 items-start mb-3 last:mb-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                          style={{ background: done ? "#0f766e" : active ? "#d97706" : "#e2e8f0" }}
                        />
                        <div>
                          <div
                            className="text-[12.5px] font-semibold leading-snug"
                            style={{ color: muted ? "#94a3b8" : "#1e293b" }}
                          >
                            {text}
                          </div>
                          <div
                            className="text-[10.5px] mt-0.5"
                            style={{ color: timeMuted ? "#cbd5e1" : "#64748b" }}
                          >
                            {time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </PanelSection>
              </>)}

              {tab === "financials" && (<>
                <PanelSection num="01" title="Storage Charges">
                  <div className="grid grid-cols-2 gap-x-4">
                    <Row label="Days in Morgue" value={`${daysInMorgue} day${daysInMorgue === 1 ? "" : "s"}`} />
                    <Row label="Daily Storage Rate" value={`KES ${dailyRate.toLocaleString()}`} />
                    <Row label="Storage Charge So Far" value={`KES ${storageCharge.toLocaleString()}`} />
                    <Row label="Total Charges (All Services)" value={`KES ${totalCharges.toLocaleString()}`} />
                    <Row label="Total Paid" value={`KES ${totalPaid.toLocaleString()}`} />
                    <Row label="Balance" value={`KES ${balance.toLocaleString()}`} />
                  </div>
                </PanelSection>

                <PanelSection num="02" title="Itemised Charges">
                  {charges.length === 0 ? (
                    <div className="rounded-lg px-3 py-4 text-center text-[12px] text-slate-400 bg-slate-50 border border-slate-100">
                      No charges recorded yet.
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e8ecef" }}>
                      <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Charge</span>
                        <span>Amount (KES)</span>
                      </div>
                      {charges.map((c, i) => (
                        <div
                          key={c.id ?? i}
                          className="grid grid-cols-[1fr_auto] items-center px-3 py-2 border-t border-slate-100 text-[12.5px]"
                        >
                          <span className="text-slate-700 font-semibold truncate pr-2">
                            {c.description || c.charge_type || c.name || `Charge #${c.id ?? i + 1}`}
                          </span>
                          <span className="font-mono text-[12px] text-slate-900">
                            {parseFloat(c.amount || c.charge_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelSection>

                <PanelSection num="03" title="Payments">
                  {payments.length === 0 ? (
                    <div className="rounded-lg px-3 py-4 text-center text-[12px] text-slate-400 bg-slate-50 border border-slate-100">
                      No payments recorded yet.
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e8ecef" }}>
                      <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Date</span>
                        <span>Method</span>
                        <span>Amount (KES)</span>
                      </div>
                      {payments.map((p, i) => (
                        <div
                          key={p.id ?? i}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2 border-t border-slate-100 text-[12.5px]"
                        >
                          <span className="text-slate-700">
                            {formatDate(p.payment_date || p.paid_at || p.created_at)}
                          </span>
                          <span className="text-[10.5px] uppercase text-slate-400">
                            {p.payment_method || p.method || "—"}
                          </span>
                          <span className="font-mono text-[12px] text-emerald-700">
                            {parseFloat(p.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelSection>
              </>)}
            </>
          )}
        </div>

      </aside>
    </>
  );
}