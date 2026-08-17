import React from 'react';
import { useNavigate } from 'react-router-dom';

const S = {
  wrap: {
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
    color: '#15171A',
    minHeight: '60vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
  },
  sub: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginTop: '0.25rem',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    color: '#9CA3AF',
    gap: '1rem',
    border: '1px dashed #E5E7EB',
    borderRadius: '12px',
    marginTop: '2rem',
    background: '#FAFAFA',
  },
  icon: {
    width: 56,
    height: 56,
    opacity: 0.4,
  },
};

export default function CoffinRequests() {
  const navigate = useNavigate();
  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Branch Requests</h1>
          <p style={S.sub}>Inter-branch coffin and item transfer requests</p>
        </div>
      </div>

      <div style={S.empty}>
        <svg style={S.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
        </svg>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>No requests yet</p>
        <p style={{ margin: 0, fontSize: '0.82rem', textAlign: 'center', maxWidth: 360 }}>
          Branch transfer requests will appear here once they are created.
        </p>
      </div>
    </div>
  );
}
