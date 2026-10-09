import React, { useState } from 'react';
import { formatDate } from '../../utils/dates/parseDates';


const S = {
  primary: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryDark: '#1e3a8a',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#059669',
  successLight: '#ecfdf5',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  info: '#0284c7',
  infoLight: '#e0f2fe',
  purple: '#7c3aed',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.2s ease',
};

const getReqStatus = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'tag-pe' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  // 2-status flow only: Approved → Delivered. Legacy rows stuck in the old
  // "transferring/In Transit" stage are shown as Approved (already dispatched)
  // so nothing ever renders "In Transit".
  const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
    ? 'approved'
    : status;
  return map[normalized] || map.pending;
};

// Big pill action button style factory.
const btnStyle = (bg, color, border) => ({
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
});

const styles = {
  detailCell: {
    background: '#fff',
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${S.borderLight}`,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: S.textLight,
    marginBottom: 4,
  },
};

/**
 * Whether an action footer should render for this row at all — enforces the
 * role rules so a branch only ever sees actions that belong to it.
 */
const actionButtonsVisible = (type, status) =>
  type === 'outgoing'
    ? status === 'pending' || status === 'approved'
    : type === 'incoming'
      ? status === 'pending' || status === 'approved'
      : false;

/**
 * CoffinTransfers — standalone Transfers/Logistics tab for the Coffin dashboard.
 *
 * Direction semantics (REQUEST-centric — fixed):
 *   - from_branch_id = the SOURCE branch that owns/dispatches the coffin
 *   - to_branch_id   = the DESTINATION branch receiving the coffin (the requester)
 *
 * 2-STATUS WORKFLOW (only Approved + Delivered — no "In Transit"):
 *   - Incoming rows (from_branch_id == currentBranch): ANOTHER branch requested
 *     MY stock. This branch is the SOURCE / dispatching branch: it Approves &
 *     Dispatches or Rejects while pending. After approving it waits for the
 *     REQUESTING branch to confirm "Delivered" — it can never mark delivered.
 *   - Outgoing rows (to_branch_id == currentBranch): MY branch SENT the request
 *     (requester/receiver). It can Cancel while pending, is notified on their
 *     bell when the source approves, and is the ONLY side that marks
 *     "Delivered Now" once the source has approved.
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
  const [transferQuery, setTransferQuery] = useState('');

  // REQUEST-centric classification (fixed):
  // Incoming = requests where MY branch is the SOURCE (from_branch_id ==
  // currentBranch) — another branch asked for MY stock (my fulfilment queue).
  const incomingRequests = stockRequests.filter((r) => r.from_branch_id == currentBranch);
  // Outgoing = requests MY branch SENT (to_branch_id == currentBranch) — I asked
  // another branch for stock and am waiting on them.
  const outgoingRequests = stockRequests.filter((r) => r.to_branch_id == currentBranch);

  const totalIncoming = incomingRequests.length;
  const totalOutgoing = outgoingRequests.length;

  const filteredIncoming = incomingRequests.filter((r) => {
    if (!transferQuery) return true;
    const q = transferQuery.toLowerCase();
    const coffin = coffins.find((c) => (c.coffin_id || c.id) == r.coffin_id);
    // I am the source — the other party is the requesting branch (to_branch_id).
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
    // I am the requester — the other party is the source branch (from_branch_id).
    const branch = branches.find((b) => b.id == r.from_branch_id);
    return (
      String(r.id).includes(q) ||
      (coffin?.name || '').toLowerCase().includes(q) ||
      (branch?.name || '').toLowerCase().includes(q)
    );
  });

  const allBranchRequests = [...incomingRequests, ...outgoingRequests];
  const pendingCount = incomingRequests.filter((r) => getReqStatus(r.status).label === 'Pending').length;
  const transitCount = allBranchRequests.filter((r) => getReqStatus(r.status).label === 'Approved').length;
  const deliveredCount = allBranchRequests.filter((r) => getReqStatus(r.status).label === 'Delivered').length;

  const toggleExpand = (id) => setExpandedTransferId(expandedTransferId === id ? null : id);

  const getStatusBadge = (status) => {
    const cfg = getReqStatus(status);
    const map = {
      'tag-pe': { bg: S.warningLight, color: S.warning },
      'tag-ar': { bg: '#e0e7ff', color: S.primaryDark },
      'tag-tr': { bg: S.infoLight, color: S.info },
      'tag-de': { bg: S.successLight, color: S.success },
    };
    const c = map[cfg.cls] || { bg: S.warningLight, color: S.warning };
    return (
      <span
        style={{
          padding: '5px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          background: c.bg,
          color: c.color,
        }}
      >
        {cfg.label}
      </span>
    );
  };

  const timelineSteps = (status) =>
    [
      { key: 'pending', label: 'Request Initiated', icon: 'fa-solid fa-circle-check', done: true },
      {
        key: 'approved',
        label: 'Approved',
        icon: 'fa-solid fa-check',
        done: status === 'approved' || status === 'delivered',
      },
      {
        key: 'delivered',
        label: 'Delivered',
        icon: 'fa-solid fa-flag-checkered',
        done: status === 'delivered',
      },
    ];

  const Timeline = ({ status }) => {
    const steps = timelineSteps(status);
    const completedCount = steps.filter((s) => s.done).length;
    const progressPct =
      completedCount <= 1 ? 0 : ((completedCount - 1) / (steps.length - 1)) * 100;
    return (
      <div style={{ position: 'relative', padding: '0 4px', marginTop: 8 }}>
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 28,
            right: 28,
            height: 2,
            background: S.border,
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 28,
            height: 2,
            background: S.success,
            zIndex: 1,
            width: `calc(${progressPct}% - 20px)`,
          }}
        ></div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {steps.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                width: '25%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#fff',
                  border: `3px solid ${s.done ? S.success : S.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: s.done ? '#fff' : S.textLight,
                  transition: 'all 0.3s',
                }}
              >
                <i className={s.icon}></i>
              </div>
              <div>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: s.done ? S.text : S.textLight }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TransferRow = ({ r, type }) => {
    const coffin = coffins.find((c) => (c.coffin_id || c.id) == r.coffin_id);
    const fromBranchRaw = branches.find((b) => b.id == r.from_branch_id);
    const toBranchRaw = branches.find((b) => b.id == r.to_branch_id);
    // Prefer the friendly stored branch names (e.g. "Nairobi", "Machakos") so users
    // never see raw ids; fall back to the branches lookup when names aren't stored.
    const origin = { ...(fromBranchRaw || {}), name: r.from_branch_name || fromBranchRaw?.name };
    const dest = { ...(toBranchRaw || {}), name: r.to_branch_name || toBranchRaw?.name };
    const isExpanded = expandedTransferId === r.id;

    const waitingHint =
      type === 'incoming'
        ? // I am the SOURCE / dispatcher (another branch requested my stock).
          r.status === 'pending'
          ? `${dest?.name || 'The requesting branch'} is waiting for your approval`
          : r.status === 'approved'
            ? `Approved — awaiting ${dest?.name || 'the requesting branch'} to confirm delivery`
            : null
        : // I am the REQUESTER (I asked another branch for stock).
          r.status === 'pending'
          ? `Waiting for ${origin?.name || 'the source branch'} to approve & dispatch`
          : r.status === 'approved'
            ? `${origin?.name || 'Source branch'} approved — confirm delivery when the goods arrive`
            : null;

    return (
      <>
        <div
          style={{
            borderBottom: isExpanded ? 'none' : `1px solid ${S.borderLight}`,
            background: isExpanded ? '#fbfcfd' : '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => toggleExpand(r.id)}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 2fr 1.5fr 40px',
              gap: 24,
              padding: '18px 24px',
              alignItems: 'center',
            }}
          >
            {/* Asset Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: S.bg,
                  border: `1px solid ${S.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: S.text,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-box"></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: S.textLight,
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  #{r.id} · {type === 'incoming' ? 'INC' : 'OUT'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
                  {coffin?.name || r.coffin_name || 'Unknown Coffin'}
                </div>
              </div>
            </div>

            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: S.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#0f172a',
                      display: 'inline-block',
                    }}
                  ></span>
                  {origin?.name || 'N/A'}
                </div>
                <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 500 }}>Origin</div>
              </div>
              <div
                style={{
                  flex: 1,
                  height: 2,
                  borderTop: '2px dotted',
                  borderColor: S.border,
                  position: 'relative',
                }}
              >
                <i
                  className="fa-solid fa-truck"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#fbfcfd',
                    padding: '0 4px',
                    color: S.textLight,
                    fontSize: 10,
                  }}
                ></i>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: S.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    justifyContent: 'flex-end',
                  }}
                >
                  {dest?.name || 'N/A'}
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: S.success,
                      boxShadow: `0 0 0 3px ${S.successLight}`,
                      display: 'inline-block',
                    }}
                  ></span>
                </div>
                <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 500 }}>Destination</div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: S.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="fa-regular fa-clock" style={{ fontSize: 11 }}></i>{' '}
                {r.service_date
                  ? `Expected ${formatDate(r.service_date)}`
                  : r.transfer_date
                    ? formatDate(r.transfer_date)
                    : '—'}
              </span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {getStatusBadge(r.status)}
            </div>

            {/* Chevron */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                color: S.textLight,
                transform: isExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div
            style={{
              background: S.bg,
              borderBottom: `1px solid ${S.border}`,
              padding: '28px 24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40 }}>
              <div>
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: S.textMuted,
                    marginBottom: 16,
                  }}
                >
                  Shipment Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div
                    style={{
                      background: '#fff',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${S.borderLight}`,
                    }}
                  >
                    <div style={styles.detailLabel}>Quantity</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>
                      {r.quantity || 1} Unit{r.quantity > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${S.borderLight}`,
                    }}
                  >
                    <div style={styles.detailLabel}>Coffin</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>
                      {coffin?.name || r.coffin_name || 'N/A'}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${S.borderLight}`,
                    }}
                  >
                    <div style={styles.detailLabel}>Expected Date</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>
                      {r.service_date ? formatDate(r.service_date) : 'Not set'}
                    </div>
                  </div>
                  {r.client_name && (
                    <div
                      style={{
                        ...styles.detailCell,
                        gridColumn: '1 / -1',
                      }}
                    >
                      <div style={styles.detailLabel}>Client</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>
                        {r.client_name}
                        {r.client_phone ? ` · ${r.client_phone}` : ''}
                      </div>
                    </div>
                  )}
                  {r.notes && (
                    <div
                      style={{
                        ...styles.detailCell,
                        gridColumn: '1 / -1',
                      }}
                    >
                      <div style={styles.detailLabel}>Notes</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: S.textMuted }}>
                        {r.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: S.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Processing Timeline
                </h3>
                <Timeline status={r.status} />

                {waitingHint && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: S.infoLight,
                      color: S.info,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-circle-info"></i> {waitingHint}
                  </div>
                )}

                {actionButtonsVisible(type, r.status) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent: 'flex-end',
                      marginTop: 28,
                      paddingTop: 20,
                      borderTop: `1px solid ${S.border}`,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* INCOMING = my branch is the SOURCE / dispatcher
                        (another branch requested my stock). */}
                    {type === 'incoming' && r.status === 'pending' && (
                      <>
                        <button
                          style={btnStyle(S.dangerLight, S.danger, true)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStockAction(r.id, 'rejected');
                          }}
                        >
                          <i className="fa-solid fa-times"></i> Reject
                        </button>
                        <button
                          style={btnStyle(S.success, '#fff')}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStockAction(r.id, 'approve');
                          }}
                        >
                          <i className="fa-solid fa-check"></i> Approve &amp; Dispatch
                        </button>
                      </>
                    )}
                    {type === 'incoming' && r.status === 'approved' && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: S.textMuted,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-hourglass-half"></i> Awaiting delivery
                        confirmation by {dest?.name || 'the requesting branch'}
                      </span>
                    )}

                    {/* OUTGOING = my branch is the REQUESTER / receiver
                        (I asked another branch for stock). Only this side may
                        write "Delivered". */}
                    {type === 'outgoing' && r.status === 'pending' && (
                      <button
                        style={btnStyle('#fff', S.danger, `1px solid ${S.border}`)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'rejected');
                        }}
                      >
                        <i className="fa-solid fa-times"></i> Cancel Request
                      </button>
                    )}
                    {type === 'outgoing' && r.status === 'approved' && (
                      <button
                        style={btnStyle(S.success, '#fff')}
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
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 28px 40px', background: '#fafaf9', color: '#1c1917', minHeight: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Awaiting your action', value: pendingCount, unit: 'requests', icon: 'fa-hourglass-half', color: S.warning, bg: S.warningLight },
          { label: 'In transit', value: transitCount, unit: 'transfers', icon: 'fa-truck-fast', color: S.info, bg: S.infoLight },
          { label: 'Completed this week', value: deliveredCount, unit: 'delivered', icon: 'fa-circle-check', color: S.success, bg: S.successLight },
        ].map((stat) => (
          <div key={stat.label} style={{ borderRadius: 14, padding: 20, background: stat.bg, border: `1px solid ${stat.color}26` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: stat.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={`fa-solid ${stat.icon}`} /> {stat.label}
            </div>
            <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 700, color: stat.color }}>{stat.value} <span style={{ fontSize: 14, color: S.textMuted, fontWeight: 500 }}>{stat.unit}</span></div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: `1px solid #f0eeec`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: S.bg,
            padding: 4,
            borderRadius: 12,
            border: `1px solid ${S.borderLight}`,
          }}
        >
          <button
            style={{
              padding: '9px 18px',
              border: 'none',
              borderRadius: 8,
              background: transferTab === 'incoming' ? '#fff' : 'transparent',
              color: transferTab === 'incoming' ? S.text : S.textMuted,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: transferTab === 'incoming' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
            onClick={() => setTransferTab('incoming')}
          >
            <i
              className="fa-solid fa-arrow-down"
              style={{ color: transferTab === 'incoming' ? S.info : 'inherit', fontSize: 13 }}
            ></i>{' '}
            Incoming
            <span
              style={{
                background: transferTab === 'incoming' ? '#0f172a' : S.border,
                color: transferTab === 'incoming' ? '#fff' : S.textMuted,
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {totalIncoming}
            </span>
          </button>
          <button
            style={{
              padding: '9px 18px',
              border: 'none',
              borderRadius: 8,
              background: transferTab === 'outgoing' ? '#fff' : 'transparent',
              color: transferTab === 'outgoing' ? S.text : S.textMuted,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: transferTab === 'outgoing' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
            onClick={() => setTransferTab('outgoing')}
          >
            <i
              className="fa-solid fa-arrow-up-right"
              style={{ color: transferTab === 'outgoing' ? S.purple : 'inherit', fontSize: 13 }}
            ></i>{' '}
            Outgoing
            <span
              style={{
                background: transferTab === 'outgoing' ? '#0f172a' : S.border,
                color: transferTab === 'outgoing' ? '#fff' : S.textMuted,
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {totalOutgoing}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <i
              className="fa-solid fa-search"
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: S.textLight,
                fontSize: 12,
              }}
            ></i>
            <input
              type="text"
              placeholder="Search ID, coffin, or branch..."
              value={transferQuery}
              onChange={(e) => setTransferQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                border: `1px solid ${S.border}`,
                borderRadius: 10,
                background: '#fff',
                fontSize: 13,
                fontWeight: 500,
                outline: 'none',
                fontFamily: 'inherit',
                transition: S.transition,
                boxSizing: 'border-box',
              }}
            />
          </div>
          {onRefresh && (
            <button
              style={{
                padding: '8px 14px',
                border: `1px solid ${S.border}`,
                borderRadius: 8,
                background: '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: S.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: S.transition,
                whiteSpace: 'nowrap',
              }}
              onClick={onRefresh}
              title="Refresh transfers"
            >
              <i className="fa-solid fa-arrows-rotate" style={{ fontSize: 12 }}></i> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Transfer List */}
      <div style={{ borderTop: `1px solid ${S.border}`, background: '#fff' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 2fr 1.5fr 40px',
            gap: 24,
            padding: '12px 24px',
            background: S.bg,
            borderBottom: `1px solid ${S.borderLight}`,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: S.textMuted,
          }}
        >
          <div>Asset Details</div>
          <div>Route</div>
          <div>Timeline</div>
          <div style={{ textAlign: 'right' }}>Status</div>
          <div></div>
        </div>

        {transferTab === 'incoming' && filteredIncoming.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: S.textMuted }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: S.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 22,
                color: S.textLight,
              }}
            >
              <i className="fa-solid fa-inbox"></i>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.text }}>
              No incoming deliveries
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>
              Coffins requested from other branches will appear here for you to confirm delivery.
            </p>
          </div>
        )}

        {transferTab === 'outgoing' && filteredOutgoing.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: S.textMuted }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: S.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 22,
                color: S.textLight,
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.text }}>
              No outgoing transfers
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>
              Requests other branches made to your branch will appear here to approve &amp; dispatch.
            </p>
          </div>
        )}

        {(transferTab === 'incoming' ? filteredIncoming : filteredOutgoing).map((r) => (
          <TransferRow key={r.id} r={r} type={transferTab} />
        ))}
      </div>
      </div>
    </div>
  );
};



export   default  CoffinTransfers
