import React, { useState } from 'react';
import { formatDate } from '../../utils/dates/parseDates';

/* ─────────────── palette ─────────────── */
const S = {
  text: '#0f172a',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#edf0f4',
  bg: '#f7f8fa',
  border: '#e2e8f0',
  amber: '#d97706', amberDot: '#f59e0b',
  blue: '#1d4ed8', blueDot: '#3b82f6',
  green: '#059669', greenDot: '#10b981',
  red: '#dc2626', redDot: '#ef4444',
  petrol: '#0F3040',
  gold: '#C9A227',
  info: '#0284c7',
  infoLight: '#e0f2fe',
};

/* status — legacy "in transit" rows are shown as Approved */
const normalizeStatus = (status) =>
  ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status) ? 'approved' : status;

const STATUS_META = {
  pending: { label: 'Pending', color: S.amber, dot: S.amberDot, icon: 'fa-solid fa-hourglass-half' },
  approved: { label: 'Approved', color: S.blue, dot: S.blueDot, icon: 'fa-solid fa-truck-fast' },
  delivered: { label: 'Delivered', color: S.green, dot: S.greenDot, icon: 'fa-solid fa-circle-check' },
  rejected: { label: 'Rejected', color: S.red, dot: S.redDot, icon: 'fa-solid fa-ban' },
};
const getMeta = (status) => STATUS_META[normalizeStatus(status)] || STATUS_META.pending;

/* premium petrol action button (original style) */
const btnStyle = (bg, color, border, shadow) => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: border || 'none',
  background: bg,
  color,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: shadow || 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
});

/* role rules — which branch sees which actions */
const actionButtonsVisible = (type, status) =>
  type === 'outgoing'
    ? status === 'pending' || status === 'approved'
    : type === 'incoming'
      ? status === 'pending' || status === 'approved'
      : false;

/* section heading (small caps) */
const sectionHead = {
  fontSize: 10.5,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: S.muted,
  marginBottom: 6,
};

/* flat label → value line (no cards) */
const Fact = ({ k, v, soft, last }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 24,
      padding: '10px 0',
      borderBottom: last ? 'none' : `1px solid ${S.line}`,
      fontSize: 13.5,
    }}
  >
    <span style={{ color: S.faint, fontWeight: 500, flexShrink: 0 }}>{k}</span>
    <span
      style={{
        fontWeight: soft ? 500 : 600,
        textAlign: 'right',
        minWidth: 0,
        overflowWrap: 'anywhere',
        ...(soft ? { color: S.muted, fontSize: 13 } : {}),
      }}
    >
      {v}
    </span>
  </div>
);

/* colored dot + text status */
const StatusDot = ({ status }) => {
  const m = getMeta(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 12.5,
        fontWeight: 600,
        color: m.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

/* status sentence shown at the top of the expanded panel */
const statusMessage = (type, r, origin, dest) => {
  const qty = `${r.quantity || 1} unit${(r.quantity || 1) > 1 ? 's' : ''}`;
  const st = normalizeStatus(r.status);
  if (type === 'incoming') {
    if (st === 'pending')
      return `Waiting for your approval — ${dest?.name || 'the requesting branch'} requested ${qty}.`;
    if (st === 'approved')
      return `Dispatched — waiting for ${dest?.name || 'the requesting branch'} to confirm delivery.`;
    if (st === 'delivered')
      return `Completed — confirmed by ${dest?.name || 'the destination'}.`;
    return 'Request rejected — no stock was moved.';
  }
  if (st === 'pending')
    return `You requested ${qty} — waiting for ${origin?.name || 'the source branch'} to approve & dispatch.`;
  if (st === 'approved')
    return `${origin?.name || 'Source branch'} approved — confirm delivery once goods arrive.`;
  if (st === 'delivered')
    return 'Delivery confirmed — stock updated in your inventory.';
  return 'Request cancelled — no stock was moved.';
};

/* PREMIUM Timeline — original petrol/gold style, unchanged */
const timelineSteps = (status) => {
  const st = normalizeStatus(status);
  return [
    { key: 'pending', label: 'Request Initiated', icon: 'fa-solid fa-circle-check', done: true },
    { key: 'approved', label: 'Approved', icon: 'fa-solid fa-check', done: st === 'approved' || st === 'delivered' },
    { key: 'delivered', label: 'Delivered', icon: 'fa-solid fa-flag-checkered', done: st === 'delivered' },
  ];
};

const Timeline = ({ status }) => {
  const steps = timelineSteps(status);
  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = completedCount <= 1 ? 0 : ((completedCount - 1) / (steps.length - 1)) * 100;

  return (
    <div style={{ position: 'relative', padding: '20px 0' }}>
      {/* track */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '20px',
          right: '20px',
          height: '4px',
          background: S.border,
          borderRadius: '4px',
          zIndex: 0,
        }}
      />
      {/* petrol → gold gradient fill */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '20px',
          height: '4px',
          background: `linear-gradient(90deg, ${S.petrol}, ${S.gold})`,
          borderRadius: '4px',
          zIndex: 1,
          width: `calc(${progressPct}% - 20px)`,
          boxShadow: '0 0 8px rgba(201, 162, 39, 0.4)',
          transition: 'width 0.3s ease',
        }}
      />
      {/* steps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        {steps.map((s) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              width: '33.33%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#fff',
                border: `2px solid ${s.done ? S.petrol : S.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: s.done ? '#fff' : S.faint,
                boxShadow: s.done ? '0 4px 10px rgba(15, 48, 64, 0.2)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              <i className={s.icon}></i>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.done ? S.text : S.faint }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CoffinTransfers — clean flat Transfers/Logistics tab.
 * Click a row → all details visible as simple text lines,
 * "Requested by" above the petrol/gold timeline, original action buttons.
 */
const CoffinTransfers = ({
  stockRequests = [],
  coffins = [],
  branches = [],
  currentBranch = null,
  onStockAction,
  onRefresh,
}) => {
  const [transferTab, setTransferTab] = useState('incoming');
  const [expandedTransferId, setExpandedTransferId] = useState(null);
  const [hoveredTransferId, setHoveredTransferId] = useState(null);
  const [transferQuery, setTransferQuery] = useState('');

  const incomingRequests = stockRequests.filter((r) => r.from_branch_id == currentBranch);
  const outgoingRequests = stockRequests.filter((r) => r.to_branch_id == currentBranch);
  const totalIncoming = incomingRequests.length;
  const totalOutgoing = outgoingRequests.length;

  const filteredIncoming = incomingRequests.filter((r) => {
    if (!transferQuery) return true;
    const q = transferQuery.toLowerCase();
    const coffin = coffins.find((c) => (c.coffin_id || c.id) == r.coffin_id);
    const branch = branches.find((b) => b.id == r.to_branch_id);
    return (
      String(r.id).includes(q) ||
      (coffin?.name || '').toLowerCase().includes(q) ||
      (branch?.name || '').toLowerCase().includes(q)
    );
  });

  const filteredOutgoing = outgoingRequests.filter((r) => {
    if (!transferQuery) return true;
    const q = transferQuery.toLowerCase();
    const coffin = coffins.find((c) => (c.coffin_id || c.id) == r.coffin_id);
    const branch = branches.find((b) => b.id == r.from_branch_id);
    return (
      String(r.id).includes(q) ||
      (coffin?.name || '').toLowerCase().includes(q) ||
      (branch?.name || '').toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id) => setExpandedTransferId(expandedTransferId === id ? null : id);

  const myBranchName = branches.find((b) => b.id == currentBranch)?.name;

  const tabs = [
    { key: 'incoming', label: 'Incoming', icon: 'fa-solid fa-arrow-down', iconColor: S.blue, count: totalIncoming, list: filteredIncoming },
    { key: 'outgoing', label: 'Outgoing', icon: 'fa-solid fa-arrow-up-right', iconColor: '#7c3aed', count: totalOutgoing, list: filteredOutgoing },
  ];

  const activeTab = tabs.find((t) => t.key === transferTab);
  const visibleList = activeTab.list;
  const hasAny = transferTab === 'incoming' ? totalIncoming > 0 : totalOutgoing > 0;

  const TransferRow = ({ r, type }) => {
    const coffin = coffins.find((c) => (c.coffin_id || c.id) == r.coffin_id);
    const fromBranchRaw = branches.find((b) => b.id == r.from_branch_id);
    const toBranchRaw = branches.find((b) => b.id == r.to_branch_id);
    const origin = { ...(fromBranchRaw || {}), name: r.from_branch_name || fromBranchRaw?.name };
    const dest = { ...(toBranchRaw || {}), name: r.to_branch_name || toBranchRaw?.name };
    const isExpanded = expandedTransferId === r.id;
    const isHovered = hoveredTransferId === r.id;
    const meta = getMeta(r.status);

    /* "Requested by" — the STAFF member who raised the request, plus their branch.
     *
     * This used to read `r.client_name || 'You'`. `client_name` is the funeral
     * client's contact, not the requester, and the `'You'` fallback made every
     * request that carried no client name display the literal word "You" —
     * which reads as if the signed-in officer raised all of them. The record
     * already stores the real requester in `requested_by` (the coffin service
     * writes the signed-in user's email there and returns it from
     * GET /coffins/stock-requests), so use it and only fall back when it is
     * genuinely absent. */
    const requestedBy =
      r.requested_by_name || r.requester_name || r.requested_by || r.requestedBy || '';
    const requesterLabel =
      type === 'incoming'
        ? requestedBy || 'Requesting branch'
        : [requestedBy, myBranchName].filter(Boolean).join(' · ') || 'Unknown requester';
    const requestedDate = r.created_at || r.transfer_date || r.service_date;

    /* flat facts — one array, mapped to clean label/value lines */
    const qtyText = `${r.quantity || 1} unit${(r.quantity || 1) > 1 ? 's' : ''}`;
    const facts = [
      ['Coffin', coffin?.name || r.coffin_name || 'N/A'],
      ['Quantity', qtyText],
      ['From', type === 'incoming' ? `${origin?.name || 'N/A'} (you)` : origin?.name || 'N/A'],
      ['To', type === 'outgoing' ? `${dest?.name || 'N/A'} (you)` : dest?.name || 'N/A'],
      [r.service_date ? 'Expected' : 'Date',
      r.service_date ? formatDate(r.service_date) : r.transfer_date ? formatDate(r.transfer_date) : '—'],
      ...(r.client_name
        ? [['Client', `${r.client_name}${r.client_phone ? ` · ${r.client_phone}` : ''}`]]
        : []),
      ...(r.notes ? [['Notes', r.notes, true]] : []),
    ];

    return (
      <>
        {/* ── list row ── */}
        <div
          onClick={() => toggleExpand(r.id)}
          onMouseEnter={() => setHoveredTransferId(r.id)}
          onMouseLeave={() => setHoveredTransferId(null)}
          style={{
            display: 'grid',
            gridTemplateColumns: '46px 1.4fr 1.1fr auto 18px',
            gap: 16,
            alignItems: 'center',
            padding: '15px 30px',
            cursor: 'pointer',
            background: isExpanded || isHovered ? S.bg : '#fff',
            borderBottom: `1px solid ${S.line}`,
            transition: 'background 0.13s',
          }}
        >
          {/* icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isExpanded ? S.petrol : S.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: isExpanded ? '#fff' : S.muted,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-box"></i>
          </div>

          {/* request */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: S.faint, fontWeight: 600, marginBottom: 2 }}>
              #{r.id} · {type === 'incoming' ? 'Incoming' : 'Outgoing'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: S.text, letterSpacing: '-0.01em' }}>
              {coffin?.name || r.coffin_name || 'Unknown Coffin'}
            </div>
          </div>

          {/* route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: S.muted, minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {origin?.name || 'N/A'}
            </span>
            <span style={{ color: '#cbd5e1', fontSize: 11, flexShrink: 0 }}>→</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dest?.name || 'N/A'}
            </span>
          </div>

          {/* status + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StatusDot status={r.status} />
            <i
              className="fa-solid fa-chevron-down"
              style={{
                fontSize: 11,
                color: isExpanded ? S.text : '#cbd5e1',
                transform: isExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.22s ease, color 0.15s',
              }}
            ></i>
          </div>
          <span />
        </div>

        {/* ── expanded detail — flat, all visible ── */}
        {isExpanded && (
          <div
            style={{
              background: S.bg,
              borderBottom: `1px solid ${S.line}`,
              padding: '6px 30px 28px',
              animation: 'ctSlide 0.22s ease',
            }}
          >
            {/* colored status line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '16px 0 2px',
                fontSize: 13,
                fontWeight: 600,
                color: meta.color,
              }}
            >
              <i className={meta.icon} style={{ fontSize: 13 }}></i>
              {statusMessage(type, r, origin, dest)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 44, marginTop: 14 }}>
              {/* LEFT — details */}
              <div>
                <div style={sectionHead}>Details</div>
                {facts.map(([k, v, soft], i) => (
                  <Fact key={k} k={k} v={v} soft={soft} last={i === facts.length - 1} />
                ))}
              </div>

              {/* RIGHT — requested by + timeline + actions */}
              <div>
                {/* Requested by (user icon) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 0 4px' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#fff',
                      border: `1px solid ${S.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: S.petrol,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-regular fa-user"></i>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: S.faint,
                      }}
                    >
                      Requested by
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: S.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {requesterLabel}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: S.faint,
                      marginLeft: 'auto',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <i className="fa-regular fa-clock"></i>
                    {requestedDate ? formatDate(requestedDate) : '—'}
                  </span>
                </div>

                <div style={{ ...sectionHead, marginTop: 6 }}>Processing Timeline</div>
                <Timeline status={r.status} />

                {actionButtonsVisible(type, normalizeStatus(r.status)) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent: 'flex-end',
                      marginTop: 20,
                      paddingTop: 18,
                      borderTop: `1px solid ${S.border}`,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {/* INCOMING = my branch is the SOURCE / dispatcher */}
                    {type === 'incoming' && normalizeStatus(r.status) === 'pending' && (
                      <>
                        <button
                          style={btnStyle('#fff', S.red, `1px solid ${S.border}`)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStockAction(r.id, 'rejected');
                          }}
                        >
                          <i className="fa-solid fa-times"></i> Reject
                        </button>
                        <button
                          style={btnStyle(S.petrol, '#fff', 'none', '0 4px 10px rgba(15, 48, 64, 0.15)')}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStockAction(r.id, 'approve');
                          }}
                        >
                          <i className="fa-solid fa-check"></i> Approve &amp; Dispatch
                        </button>
                      </>
                    )}
                    {type === 'incoming' && normalizeStatus(r.status) === 'approved' && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: S.info,
                          background: S.infoLight,
                          padding: '10px 14px',
                          borderRadius: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-hourglass-half"></i> Awaiting delivery confirmation
                        by {dest?.name || 'the requesting branch'}
                      </span>
                    )}

                    {/* OUTGOING = my branch is the REQUESTER / receiver */}
                    {type === 'outgoing' && normalizeStatus(r.status) === 'pending' && (
                      <button
                        style={btnStyle('#fff', S.red, `1px solid ${S.border}`)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'rejected');
                        }}
                      >
                        <i className="fa-solid fa-times"></i> Cancel Request
                      </button>
                    )}
                    {type === 'outgoing' && normalizeStatus(r.status) === 'approved' && (
                      <button
                        style={btnStyle(S.petrol, '#fff', 'none', '0 4px 10px rgba(15, 48, 64, 0.15)')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'delivered');
                        }}
                      >
                        <i className="fa-solid fa-circle-check"></i> Delivered Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* expand animation */}
      <style>{`@keyframes ctSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 12px 32px rgba(15,23,42,0.05)',
        }}
      >
        {/* header */}
        <div style={{ padding: '26px 30px 2px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, color: S.text }}>
            Transfers
          </h1>
          <p style={{ fontSize: 13, color: S.muted, margin: '4px 0 0' }}>
            Click any request to see all its details.
          </p>
        </div>

        {/* controls — underline tabs + quiet search */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            padding: '14px 30px 0',
            borderBottom: `1px solid ${S.line}`,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 26 }}>
            {tabs.map((t) => {
              const active = transferTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTransferTab(t.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '10px 2px 12px',
                    borderBottom: `2px solid ${active ? S.text : 'transparent'}`,
                    marginBottom: -1,
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    color: active ? S.text : S.faint,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 0.15s',
                  }}
                >
                  <i className={t.icon} style={{ fontSize: 12, color: active ? t.iconColor : 'inherit' }}></i>
                  {t.label}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: active ? '#eef1f5' : S.bg,
                      color: active ? S.text : S.faint,
                      padding: '1px 8px',
                      borderRadius: 9,
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 11 }}>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', color: S.faint, fontSize: 12 }}
              ></i>
              <input
                type="text"
                placeholder="Search request, coffin, branch…"
                value={transferQuery}
                onChange={(e) => setTransferQuery(e.target.value)}
                style={{
                  border: 'none',
                  borderBottom: `1px solid ${S.line}`,
                  padding: '8px 4px 8px 24px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  outline: 'none',
                  width: 220,
                  background: 'transparent',
                  color: S.text,
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh transfers"
                style={{
                  padding: '7px 12px',
                  border: `1px solid ${S.line}`,
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: S.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <i className="fa-solid fa-arrows-rotate" style={{ fontSize: 11 }}></i> Refresh
              </button>
            )}
          </div>
        </div>

        {/* list header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '46px 1.4fr 1.1fr auto 18px',
            gap: 16,
            padding: '12px 30px',
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: S.faint,
          }}
        >
          <span />
          <span>Request</span>
          <span>Route</span>
          <span>Status</span>
          <span />
        </div>

        {/* rows */}
        {visibleList.map((r) => (
          <TransferRow key={r.id} r={r} type={transferTab} />
        ))}

        {/* empty states */}
        {visibleList.length === 0 && (
          <div style={{ padding: '56px 30px', textAlign: 'center', color: S.faint, fontSize: 13 }}>
            <i
              className={transferQuery ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-inbox'}
              style={{ display: 'block', fontSize: 20, marginBottom: 10, color: '#cbd5e1' }}
            ></i>
            {transferQuery
              ? 'Nothing matches your search.'
              : transferTab === 'incoming'
                ? 'No incoming requests.'
                : 'No outgoing requests.'}
          </div>
        )}
      </div>
    </>
  );
};

export default CoffinTransfers;