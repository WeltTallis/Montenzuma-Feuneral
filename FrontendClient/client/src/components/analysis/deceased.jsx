import React, { useState, useMemo } from 'react';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

/* ─── Data ─── */
const RECORDS = [
  { id: 'DC-2408-001', name: 'Joseph Kamau', branch: 'Nairobi HQ', admitted: 'Aug 21, 2024', status: 'Admitted', pm: 'Pending' },
  { id: 'DC-2408-002', name: 'Beatrice Otieno', branch: 'Kisumu', admitted: 'Aug 21, 2024', status: 'Released', pm: 'Done' },
  { id: 'DC-2408-003', name: 'Francis Mutua', branch: 'Machakos', admitted: 'Aug 20, 2024', status: 'Admitted', pm: 'In Progress' },
  { id: 'DC-2408-004', name: 'Eunice Wanjiku', branch: 'Nairobi HQ', admitted: 'Aug 20, 2024', status: 'Admitted', pm: 'Pending' },
  { id: 'DC-2408-005', name: 'Kevin Rotich', branch: 'Nakuru', admitted: 'Aug 19, 2024', status: 'Released', pm: 'Done' },
  { id: 'DC-2408-006', name: 'Rahab Hassan', branch: 'Mombasa', admitted: 'Aug 19, 2024', status: 'Admitted', pm: 'Done' },
];

const STATUS_CFG = {
  'Admitted': { color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
  'Released': { color: 'var(--color-green)', bg: 'var(--color-green-light)' },
};

const PM_CFG = {
  'Pending': { color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  'In Progress': { color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
  'Done': { color: 'var(--color-green)', bg: 'var(--color-green-light)' },
};

function DeceasedDetailPanel({ record, onClose }) {
  if (!record) return null;
  const statusCfg = STATUS_CFG[record.status];
  const pmCfg = PM_CFG[record.pm];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-muted)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-muted-foreground)'
          }}>
            {record.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>{record.name}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', fontFamily: 'monospace', letterSpacing: '0.3px' }}>{record.id}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)', background: 'var(--color-background)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--color-muted-foreground)'
        }}>
          <Ic size={14} color="var(--color-muted-foreground)" sw={2.5}><path d="M18 6L6 18M6 6l12 12" /></Ic>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 18, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge text={record.status} />
          <Badge text={record.pm} />
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic size={16} color="var(--color-blue)" sw={2.2}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></Ic>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', marginBottom: 2 }}>Branch</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>{record.branch}</div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic size={16} color="var(--color-green)" sw={2.2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Ic>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', marginBottom: 2 }}>Admission Date</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>{record.admitted}</div>
            </div>
          </div>
        </div>

        {/* Postmortem Progress */}
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Postmortem Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-muted)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: pmCfg.color,
                width: record.pm === 'Done' ? '100%' : record.pm === 'In Progress' ? '50%' : '0%',
                transition: 'width .3s'
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: pmCfg.color }}>{record.pm}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, background: 'var(--color-background)' }}>
        <button style={{
          flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
          border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          View Details
        </button>
        <button style={{
          flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', color: 'var(--color-foreground)',
          border: '1px solid var(--color-border)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Edit Record
        </button>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = ['All Records', 'Admitted', 'Released'];

const COLUMNS = [
  { key: 'id', label: 'Record ID', width: '15%', align: 'left' },
  { key: 'name', label: 'Name', width: '20%', align: 'left' },
  { key: 'branch', label: 'Branch', width: '17%', align: 'left' },
  { key: 'admitted', label: 'Admitted', width: '17%', align: 'left' },
  { key: 'status', label: 'Status', width: '16%', align: 'center' },
  { key: 'pm', label: 'Postmortem', width: '15%', align: 'center' },
];

function Badge({ text }) {
  const isStatus = text === 'Admitted' || text === 'Released';
  const cfg = isStatus ? STATUS_CFG[text] : PM_CFG[text];
  if (!cfg) return <span style={{ fontSize: 11, color: 'var(--color-foreground)' }}>{text}</span>;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap'
    }}>
      {text === 'In Progress' && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          border: `1.5px solid ${cfg.color}`,
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }} />
      )}
      {text}
    </span>
  );
}

export default function RecentDeceasedRecords() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Records');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    return RECORDS.filter(r => {
      const matchSearch = !search ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.branch.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All Records' || r.status === filter;
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const selected = useMemo(() => RECORDS.find(r => r.id === selectedId) || null, [selectedId]);

  const counts = useMemo(() => {
    const c = { 'All Records': RECORDS.length };
    RECORDS.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, []);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, borderBottom: '1px solid var(--color-border)'
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Recent Deceased Records</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', background: 'var(--color-background)',
            width: 200, transition: 'border-color .15s'
          }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}>
              <path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />
            </Ic>
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, color: 'var(--color-foreground)', fontFamily: 'inherit',
                width: '100%', padding: 0,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-muted-foreground)', display: 'flex' }}>
                <Ic size={10} color="var(--color-muted-foreground)" sw={2.5}><path d="M18 6L6 18M6 6l12 12" /></Ic>
              </button>
            )}
          </div>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', border: 'none',
                  background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                  fontSize: 11, fontWeight: filter === f ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                  borderRight: f !== 'Released' ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {f}
                <span style={{
                  marginLeft: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
                  fontSize: 9, fontWeight: 700,
                  background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--color-muted)',
                  color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)'
                }}>
                  {counts[f] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {COLUMNS.map(col => (
                <th key={col.key} style={{
                  padding: '10px 12px', fontSize: 10, fontWeight: 600,
                  color: 'var(--color-muted-foreground)', textTransform: 'uppercase',
                  letterSpacing: '0.5px', textAlign: col.align,
                  whiteSpace: 'nowrap',
                  background: 'var(--color-background)'
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const isHovered = hoveredRow === r.id;
              return (
                <tr key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  onMouseEnter={() => setHoveredRow(r.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--color-border)',
                    background: isHovered || selectedId === r.id ? 'var(--color-blue-light)' : 'var(--color-surface)',
                    transition: 'background .1s',
                    cursor: 'pointer',
                  }}
                >
                  {/* Record ID */}
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--color-primary)',
                      fontFamily: 'monospace', letterSpacing: '0.3px'
                    }}>
                      {r.id}
                    </span>
                  </td>

                  {/* Name */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--color-muted)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 700,
                        color: 'var(--color-muted-foreground)', flexShrink: 0
                      }}>
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </span>
                    </div>
                  </td>

                  {/* Branch */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Ic size={10} color="var(--color-muted-foreground)" sw={2.5}>
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </Ic>
                      <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{r.branch}</span>
                    </div>
                  </td>

                  {/* Admitted */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Ic size={10} color="var(--color-muted-foreground)" sw={2.5}>
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </Ic>
                      <span style={{ fontSize: 11, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>{r.admitted}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                    <Badge text={r.status} />
                  </td>

                  {/* Postmortem */}
                  <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                    <Badge text={r.pm} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{
                  padding: '40px 18px', textAlign: 'center',
                  fontSize: 12, color: 'var(--color-muted-foreground)', fontWeight: 500
                }}>
                  No records match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 18px', borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-background)'
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}>
          Showing {filtered.length} of {RECORDS.length} records
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button disabled style={{
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'not-allowed', color: 'var(--color-muted-foreground)', opacity: 0.5
          }}>
            <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}><path d="m15 18-6-6 6-6" /></Ic>
          </button>
          <button style={{
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-primary)', background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-primary-foreground)', fontSize: 10, fontWeight: 700
          }}>
            1
          </button>
          <button style={{
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'not-allowed', color: 'var(--color-muted-foreground)', opacity: 0.5
          }}>
            <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}><path d="m9 18 6-6-6-6" /></Ic>
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedId && selected && (
        <div onClick={() => setSelectedId(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 320,
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            <DeceasedDetailPanel record={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}