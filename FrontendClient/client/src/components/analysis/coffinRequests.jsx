import React from 'react';
import { useNavigate } from 'react-router-dom';

const requests = [
  {
    id: 'REQ-066824-D11B79',
    item: 'Mahogany Heritage',
    from: 'Machakos',
    to: 'Nairobi',
    requestedBy: 'Esther Mwangi',
    date: '12 Aug 2026',
    status: 'Pending',
    priority: 'High',
  },

  {
    id: 'REQ-066825-D11B80',
    item: 'Oak Classic',
    from: 'Nakuru',
    to: 'Machakos',
    requestedBy: 'Daniel Kibet',
    date: '14 Aug 2026',
    status: 'Approved',
    priority: 'Medium',
  },

  {
    id: 'REQ-066826-D11B81',
    item: 'Pearl Walnut',
    from: 'Mombasa',
    to: 'Kisumu',
    requestedBy: 'Joyce Otieno',
    date: '18 Aug 2026',
    status: 'In Transit',
    priority: 'Low',
  },
  
];

const S = {
  wrap: {
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
    color: '#0f172a',
    minHeight: '60vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)',
    borderRadius: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.75rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.04em',
  },
  sub: {
    fontSize: '0.9rem',
    color: '#475569',
    margin: 0,
  },
  panel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    padding: '1rem 1.1rem',
    borderRadius: '18px',
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  filterRow: {
    display: 'flex',
    gap: '0.7rem',
    flexWrap: 'wrap',
    marginBottom: '1.2rem',
  },
  chip: {
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: '#fff',
    color: '#334155',
    borderRadius: '999px',
    padding: '0.5rem 0.9rem',
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  chipActive: {
    borderColor: '#c7d2fe',
    background: '#eef2ff',
    color: '#3730a3',
  },
  list: {
    display: 'grid',
    gap: '1rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '20px',
    padding: '1.1rem 1.2rem',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  },
  cardLeft: {
    display: 'grid',
    gap: '0.55rem',
    flex: 1,
  },
  requestHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '0.35rem 0.7rem',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  idText: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#1d4ed8',
    letterSpacing: '0.04em',
  },
  itemName: {
    fontSize: '1.08rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.8rem',
    color: '#475569',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  route: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '0.38rem 0.7rem',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.45rem',
  },
  priority: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#475569',
  },
  date: {
    fontSize: '0.76rem',
    color: '#64748b',
    fontWeight: 600,
  },
};

const statusStyles = {
  Pending: { background: '#fef3c7', color: '#92400e' },
  Approved: { background: '#dcfce7', color: '#166534' },
  'In Transit': { background: '#dbeafe', color: '#1d4ed8' },
};

export default function CoffinRequests() {
  const navigate = useNavigate();

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.titleWrap}>
          <h1 style={S.title}>Branch Requests</h1>
          <p style={S.sub}>Inter-branch coffin and item transfer requests</p>
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.statCard}>
          <span style={S.statLabel}>Total Requests</span>
          <div style={S.statValue}>24</div>
        </div>
        <div style={S.statCard}>
          <span style={S.statLabel}>Pending</span>
          <div style={S.statValue}>8</div>
        </div>
        <div style={S.statCard}>
          <span style={S.statLabel}>Approved</span>
          <div style={S.statValue}>12</div>
        </div>
      </div>

      <div style={S.filterRow}>
        <button style={{ ...S.chip, ...S.chipActive }}>All</button>
        <button style={S.chip}>Pending</button>
        <button style={S.chip}>Approved</button>
        <button style={S.chip}>In Transit</button>
      </div>

      <div style={S.list}>
        {requests.map((request) => (
          <div
            key={request.id}
            style={S.card}
            onClick={() => navigate(`/tenant/${localStorage.getItem('tenantSlug') || 'tenant'}/requests/${request.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 35px rgba(15, 23, 42, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
            }}
          >
            <div style={S.cardLeft}>
              <div style={S.requestHead}>
                <span style={{ ...S.badge, ...statusStyles[request.status] }}>{request.status}</span>
                <span style={S.idText}>{request.id}</span>
              </div>

              <p style={S.itemName}>{request.item}</p>

              <div style={S.meta}>
                <span style={S.route}>From: {request.from}</span>
                <span style={{ color: '#94a3b8' }}>→</span>
                <span style={S.route}>To: {request.to}</span>
              </div>

              <div style={S.meta}>
                <span>Requested by {request.requestedBy}</span>
              </div>
            </div>

            <div style={S.cardRight}>
              <span style={S.priority}>{request.priority} Priority</span>
              <span style={S.date}>{request.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
