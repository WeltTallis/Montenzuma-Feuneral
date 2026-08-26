/* ─────────────────────────────────────────────────────────────────────────
   DeceasedSidePanel — a right-drawer that shows the FULL deceased record,
   matching the deceased profile detail page. Fetches the live record by id
   and falls back to whatever the dashboard row already carried.

   Icons are inline SVG components — no lucide-react import.
   ───────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import Loader from "../../components/loader/loader";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";


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

export default function DeceasedSidePanel({ booking, onClose }) {
  const navigate = useNavigate();
  const [deceased, setDeceased] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const id = booking?.deceased_id || booking?.id || booking?.admission_number;

  const fetchDeceased = useCallback(async () => {
    if (!id) { setDeceased(booking); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await api.get(`/deceased/deceased-id/${id}`);
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
  const gslug = window.location.pathname.match(/\/tenant\/([^/]+)/)?.[1] || galleryResolveSlug();

  const fullName    = d.full_name || d.name || d.deceased_name || "Unknown";
  const admissionNo = d.admission_number || d.admission_no || "—";
  const status      = d.admission_status || d.status || "—";
  const openFull    = () => navigate(`/tenant/${gslug}/deceased/${id}`);

  const tiles = [
    { icon: Tag,       label: "Admission No",   value: admissionNo },
    { icon: User,      label: "Gender / Age",   value: `${d.gender || "—"}${d.age ? ` · ${d.age} yrs` : ""}` },
    { icon: Calendar,  label: "Date Admitted",  value: d.date_admitted || d.adm_date || "—" },
    { icon: Droplets,  label: "Body Status",    value: d.body_status || d.embalming_status || "—" },
    { icon: Building2, label: "Chamber / Slot", value: d.chamber_assigned || d.morgue_slot || "—" },
    { icon: User,      label: "Cause of Death", value: d.cause_of_death || "—" },
    { icon: MapPin,    label: "Place of Death", value: d.place_of_death || "—" },
    { icon: Phone,     label: "Contact Person", value: d.contact_person || "—" },
    { icon: Phone,     label: "Telephone",      value: d.tel_number || d.tell_no || d.phone_number || "—" },
    { icon: IdCard,    label: "National ID",    value: d.id_number || d.national_id || "—" },
        { icon: Building2, label: "Received From",  value: d.received_from || "—" },
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
        style={{ width: "min(560px, 100vw)", borderColor: "rgba(15,23,42,0.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-5 border-b"
          style={{ borderColor: "#eef1f5" }}
        >
          <div className="flex-1 pr-3">
            <div className="text-[10px] font-mono text-slate-400 mb-1">
              Deceased Profile
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {fullName}
            </h3>
            <div className="text-xs text-slate-500 mt-1">
              {d.deceased_id || id} · {admissionNo}
            </div>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold mt-2 capitalize"
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
        <div className="flex-1 overflow-y-auto px-5 py-4">
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
            <div className="grid grid-cols-1 gap-2.5">
              {tiles.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg"
                    style={{ background: "#0F766E12" }}
                  >
                    <Icon size={15} className="text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </div>
                    <div className="text-[13px] text-slate-800 break-words">
                      {String(value ?? "—")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-2 px-5 py-4 border-t"
          style={{ borderColor: "#eef1f5" }}
        >
          <button
            onClick={openFull}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white border transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F766E", borderColor: "#0F766E" }}
          >
            View Full Record
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            style={{ borderColor: "#e2e8f0" }}
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

// Resolve tenant slug from localStorage (mirrors the module helper).
function galleryResolveSlug() {
  return (
    localStorage.getItem("tenantSlug") ||
    localStorage.getItem("tenant_slug") ||
    window.location.pathname.match(/\/tenant\/([^/]+)/)?.[1] ||
    ""
  );
}