/* ─────────────────────────────────────────────────────────────────────────
   DeceasedSidePanel — a right-drawer that shows the FULL deceased record,
   matching the deceased profile detail page. Fetches the live record by id
   and falls back to whatever the dashboard row already carried.

   Icons are inline SVG components — no lucide-react import.
   ───────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import Loader from "../../components/loader/loader";
import api from "../../api/axios";
import { deceasedApi } from "../../api/deceasedApi";
import { formatDate, getDaysInMorgue, getInitials } from "../../components/deceased/deceasedinfo/theme";


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

export default function DeceasedSidePanel({ booking, onClose }) {
  const [deceased, setDeceased] = useState(null);
  const [nextOfKin, setNextOfKin] = useState(null);
  const [postmortem, setPostmortem] = useState(null);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const id = booking?.deceased_id || booking?.id || booking?.admission_number;

  // Branch-aware detail fetches: records aggregated across every branch carry
  // the owning branch's slug (_branchSlug) — scope NOK / postmortem / billing
  // calls to that branch so cross-branch records resolve their own data.
  const branchSlug = booking?._branchSlug || booking?.branch_slug || booking?.branchDbName || null;
  const branchCfg = branchSlug ? { headers: { "x-tenant-slug": branchSlug } } : undefined;

  // Next of kin — same endpoint the deceased profile page uses.
  useEffect(() => {
    let alive = true;
    if (!id) return undefined;
    deceasedApi.getNextOfKin(id, branchCfg)
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
        setNextOfKin(list[0] || null);
      })
      .catch(() => { /* NOK is optional — falls back to row fields */ });
    return () => { alive = false; };
  }, [id, branchSlug]);

  // Postmortem + charges/payments — same endpoints the profile sidebar uses.
  useEffect(() => {
    let alive = true;
    if (!id) return undefined;

    api.get(`/deceased/postmortem/${id}`, branchCfg)
      .then((res) => { if (alive && res.data?.data) setPostmortem(res.data.data); })
      .catch(() => { /* no postmortem yet */ });

    api.get(`/deceased/billing-summary/${id}`, branchCfg)
      .then((res) => {
        if (!alive) return;
        const bd = res.data?.data;
        if (bd?.charges) setCharges(Array.isArray(bd.charges) ? bd.charges : [bd.charges]);
        if (bd?.payments) setPayments(Array.isArray(bd.payments) ? bd.payments : []);
      })
      .catch(() =>
        // Fallback to the plain charges endpoint (no payments list).
        api.get(`/deceased/charges/${id}`, branchCfg)
          .then((r2) => {
            if (alive && r2.data?.data) {
              setCharges(Array.isArray(r2.data.data) ? r2.data.data : [r2.data.data]);
            }
          })
          .catch(() => { /* no charges */ })
      );

    return () => { alive = false; };
  }, [id, branchSlug]);

  const fetchDeceased = useCallback(async () => {
    if (!id) { setDeceased(booking); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await api.get(`/deceased/deceased-id/${id}`, branchCfg);
      const data = res.data?.data || res.data?.deceased || booking;
      setDeceased(data);
    } catch (e) {
      console.warn("[DeceasedSidePanel] fetch failed, using row data:", e?.message);
      setError(e?.response?.status ? `Couldn't refresh (HTTP ${e.response.status})` : "");
      setDeceased(booking);
    } finally {
      setLoading(false);
    }
  }, [id, booking]);

  useEffect(() => { fetchDeceased(); }, [fetchDeceased]);

  const d = deceased || booking || {};
  // Next-of-kin fallback — same one the profile page uses when the
  // deceased row predates the next_of_kin table.
  const k = nextOfKin || (d.contact_person || d.phone_number || d.relationship || d.national_id ? {
    full_name: d.contact_person || "",
    relationship: d.relationship || "",
    id_number: d.national_id || d.id_number || "",
    contact: d.phone_number || d.tel_number || "",
  } : {});

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

  const totalCharges = charges.reduce((s, c) => s + parseFloat(c.amount || c.charge_amount || 0), 0);
  const totalPaid    = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const balance      = totalCharges - totalPaid;
  const fmtK = (n) => (Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`);

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
        style={{ width: "min(430px, 94vw)", borderColor: "rgba(15,23,42,0.08)" }}
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

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5">
          {loading && (
            <Loader
              text="Loading Deceased"
              size="small"
              overlay={false}
              fullScreen={false}
              style={{ position: "relative", minHeight: 160 }}
            />
          )}

          {!loading && error && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200">
              {error} — showing summary data.
            </div>
          )}

          {!loading && (
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

              {/* Notifications */}
              <PanelSection num="!" title="Notifications">
                <div className="flex gap-2.5 py-2">
                  <div
                    className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
                    style={{ background: "#eff6ff", color: "#1d4ed8" }}
                  >
                    i
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-700 leading-snug">
                      Record status: {bodyStatus}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Updated {formatDate(d.updated_at) || "—"}
                    </div>
                  </div>
                </div>
                {daysInMorgue > 7 && (
                  <div className="flex gap-2.5 py-2 border-t border-slate-100">
                    <div
                      className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
                      style={{ background: "#fef3c7", color: "#b45309" }}
                    >
                      !
                    </div>
                    <div>
                      <div className="text-[12px] text-slate-700 leading-snug">
                        Body has been in the morgue for {daysInMorgue} days. Please contact next of kin.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Active</div>
                    </div>
                  </div>
                )}
              </PanelSection>

              <PanelSection num="01" title="Admission">
                <div className="grid grid-cols-2 gap-x-4">
                  {admissionRows.map(({ label, value, mono, full }) => (
                    <Row key={label} label={label} value={value} mono={mono} full={full} />
                  ))}
                </div>
              </PanelSection>

              <PanelSection num="02" title="Next of Kin">
                <div className="grid grid-cols-2 gap-x-4">
                  {nokRows.map(({ label, value, mono }) => (
                    <Row key={label} label={label} value={value} mono={mono} />
                  ))}
                </div>
              </PanelSection>

              {/* 03 — Postmortem Requests (only when a request row was clicked) */}
              {pmReq && (
                <PanelSection num="03" title="Postmortem Requests">
                  <div
                    className="flex items-center justify-between gap-2 py-1.5 mb-1"
                  >
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
                    <Row
                      label="Sent To Authority"
                      value={pmReq.sent_at ? formatDate(pmReq.sent_at) : "Not sent yet"}
                    />
                    <Row
                      label="Official Exam"
                      value={
                        pmStatus === "completed" ? "Completed"
                          : pmStatus === "pending" || pmStatus === "in_progress" ? "In Progress"
                            : pmStatus ? pmStatus
                              : "Not carried out yet"
                      }
                    />
                  </div>
                </PanelSection>
              )}

              {/* 04 — Mortuary Progress (mirrors the profile sidebar timeline) */}
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
            </>
          )}
        </div>

      </aside>
    </>
  );
}