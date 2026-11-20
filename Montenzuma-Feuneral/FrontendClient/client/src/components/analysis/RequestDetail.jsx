import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const request = {
  id: 'REQ-066824-D11B79',
  coffin: 'MAHOGANY HERITAGE',
  fromBranch: 'Machakos',
  toBranch: 'Nairobi',
  requester: 'Esther Mwangi',
  receiver: 'James Kariuki',
  expectedDate: '24 Aug 2026',
  status: 'Delivered',
  route: 'Machakos → Nairobi',
  quantity: '1 Unit',
  origin: 'Machakos',
  destination: 'Nairobi',
  timeline: [
    { label: 'Requested', date: '20 Aug 2026' },
    { label: 'Approved', date: '21 Aug 2026' },
    { label: 'Dispatched', date: '22 Aug 2026' },
    { label: 'Delivered', date: '24 Aug 2026' },
  ],
};

const S = {
  wrap: {
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
    color: '#0f172a',
    minHeight: '60vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef5ff 100%)',
    borderRadius: '24px',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.76rem',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    borderRadius: '999px',
    cursor: 'pointer',
    padding: '0.6rem 0.9rem',
    marginBottom: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    margin: '0 0 0.35rem',
    letterSpacing: '-0.04em',
  },
  sub: {
    fontSize: '0.9rem',
    color: '#475569',
    margin: 0,
  },
  badge: {
    padding: '0.55rem 0.9rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#166534',
    background: '#dcfce7',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '24px',
    boxShadow: '0 18px 35px rgba(15, 23, 42, 0.08)',
    padding: '1.4rem',
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '1.2rem',
    marginBottom: '1.5rem',
  },
  section: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '1rem 1.1rem',
  },
  sectionTitle: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.7rem',
  },
  requestId: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: '0 0 0.35rem',
  },
  coffinName: {
    fontSize: '1.6rem',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '1rem',
    marginTop: '0.7rem',
  },
  infoItem: {
    padding: '0.8rem 0.9rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    background: '#fff',
  },
  infoLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '0.35rem',
  },
  infoValue: {
    fontSize: '0.98rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  routeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.8rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '0.9rem 1rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  timeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.9rem',
    marginTop: '1rem',
  },
  timelineItem: {
    position: 'relative',
    padding: '0.9rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#1d4ed8',
    marginBottom: '0.6rem',
    boxShadow: '0 0 0 4px rgba(59,130,246,0.12)',
  },
  timelineLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  timelineDate: {
    fontSize: '0.9rem',
    fontWeight: 700,
    marginTop: '0.25rem',
  },
};

export default function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div style={S.wrap}>
      <button style={S.back} onClick={() => navigate(-1)}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m12 19-7-7 7-7m7 7H5" />
        </svg>
        Back
      </button>

      <div style={S.header}>
        <div>
          <h1 style={S.title}>Request Details</h1>
          <p style={S.sub}>Request ID: {id || request.id}</p>
        </div>
        <span style={S.badge}>{request.status}</span>
      </div>

      <div style={S.card}>
        <div style={S.topRow}>
          <section style={S.section}>
            <span style={S.sectionTitle}>Request</span>
            <p style={S.requestId}>{request.id}</p>
            <h2 style={S.coffinName}>{request.coffin}</h2>
          </section>

          <section style={S.section}>
            <span style={S.sectionTitle}>Route</span>
            <div style={S.routeBox}>
              <span>{request.origin}</span>
              <span style={{ color: '#94a3b8' }}>→</span>
              <span>{request.destination}</span>
            </div>
            <div style={{ ...S.infoGrid, marginTop: '0.9rem' }}>
              <div style={S.infoItem}>
                <span style={S.infoLabel}>Quantity</span>
                <div style={S.infoValue}>{request.quantity}</div>
              </div>
              <div style={S.infoItem}>
                <span style={S.infoLabel}>Expected</span>
                <div style={S.infoValue}>{request.expectedDate}</div>
              </div>
            </div>
          </section>
        </div>

        <div style={S.infoGrid}>
          <div style={S.infoItem}>
            <span style={S.infoLabel}>Requested By</span>
            <div style={S.infoValue}>{request.requester}</div>
          </div>
          <div style={S.infoItem}>
            <span style={S.infoLabel}>Receiver</span>
            <div style={S.infoValue}>{request.receiver}</div>
          </div>
          <div style={S.infoItem}>
            <span style={S.infoLabel}>Origin</span>
            <div style={S.infoValue}>{request.fromBranch}</div>
          </div>
          <div style={S.infoItem}>
            <span style={S.infoLabel}>Destination</span>
            <div style={S.infoValue}>{request.toBranch}</div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <span style={S.sectionTitle}>Timeline</span>
          <div style={S.timeline}>
            {request.timeline.map((point) => (
              <div key={point.label} style={S.timelineItem}>
                <div style={S.dot} />
                <span style={S.timelineLabel}>{point.label}</span>
                <div style={S.timelineDate}>{point.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
