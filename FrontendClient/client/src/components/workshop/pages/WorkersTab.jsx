import React, { useContext } from 'react';
import { Ctx } from './WorkshopDashboard';

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  warning: '#D97706', warningBg: '#FFFBEB',
};

const WorkersTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { workers, setModal, deleteWorker } = ctx;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: T.textSec, fontWeight: 600 }}>{workers.length} workers</span>
        <button onClick={() => setModal('createWorker')} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
          <i className="fas fa-user-plus" style={{ fontSize: 11 }} /> Add Worker
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {workers.map(worker => (
          <div key={worker.id} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 16, transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: worker.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{worker.name}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{worker.role}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: T.bg, borderRadius: 7 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.primary, lineHeight: 1 }}>{Math.floor(Math.random() * 20) + 1}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>All Time</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: T.bg, borderRadius: 7 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.primary, lineHeight: 1 }}>{Math.floor(Math.random() * 5) + 1}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Month</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: T.bg, borderRadius: 7 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.success, lineHeight: 1 }}>{Math.floor(Math.random() * 3) + 1}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Week</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: T.bg, borderRadius: 7 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.warning, lineHeight: 1 }}>{Math.floor(Math.random() * 2) + 1}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Active</div>
              </div>
            </div>
            <button onClick={() => deleteWorker(worker.id)} style={{ width: '100%', padding: '7px', borderRadius: 6, border: `1px solid ${T.danger}`, background: T.dangerBg, color: T.danger, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              <i className="fas fa-trash" style={{ fontSize: 9, marginRight: 4 }} /> Remove
            </button>
          </div>
        ))}
        {workers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: T.textMuted, background: T.surface, borderRadius: 10, border: `1px solid ${T.borderLight}` }}>
            <i className="fas fa-users" style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No workers yet</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Add your first worker to get started</div>
            <button onClick={() => setModal('createWorker')} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <i className="fas fa-user-plus" style={{ fontSize: 11 }} /> Add Worker
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkersTab;