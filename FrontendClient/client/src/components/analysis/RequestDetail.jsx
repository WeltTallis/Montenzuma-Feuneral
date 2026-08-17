import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const S = {
  wrap: {
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
    color: '#15171A',
    minHeight: '60vh',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.25rem',
  },
  sub: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '2rem',
  },
  card: {
    background: '#FAFAFA',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: '#9CA3AF',
  },
  icon: {
    width: 56,
    height: 56,
    opacity: 0.4,
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

      <h1 style={S.title}>Request Detail</h1>
      <p style={S.sub}>Request ID: {id || '—'}</p>

      <div style={S.card}>
        <svg style={S.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>Request details coming soon</p>
        <p style={{ margin: 0, fontSize: '0.82rem', textAlign: 'center', maxWidth: 360 }}>
          Detailed view for branch transfer requests will be available here.
        </p>
      </div>
    </div>
  );
}
