import React, { useState } from 'react';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

const BRANCHES = [
  { name: 'Nairobi HQ', dec: 112, hearses: 38, coffins: 54, primary: true },
  { name: 'Mombasa', dec: 67, hearses: 22, coffins: 31 },
  { name: 'Kisumu', dec: 54, hearses: 18, coffins: 25 },
  { name: 'Nakuru', dec: 31, hearses: 11, coffins: 14 },
  { name: 'Machakos', dec: 20, hearses: 7, coffins: 9 },
];

const ALL_OPTIONS = ['All Branches', 'Nairobi HQ', 'Mombasa', 'Kisumu', 'Nakuru', 'Machakos'];

function BarChart() {
  const maxDec = Math.max(...BRANCHES.map(b => b.dec));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {BRANCHES.map((branch, idx) => {
        const percentage = (branch.dec / maxDec) * 100;
        return (
          <div key={branch.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Branch Name */}
            <div style={{ width: 90, fontSize: 11, fontWeight: 500, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {branch.name}
            </div>
            
            {/* Bar Container */}
            <div style={{ flex: 1, height: 32, background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
              {/* Filled Bar */}
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: branch.primary ? 'var(--color-primary)' : 'var(--color-blue)',
                borderRadius: 'var(--radius-md)',
                transition: 'width .6s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 10,
                minWidth: 40
              }}>
                {/* Value inside bar */}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
                  {branch.dec}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BranchPerformance() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState('All Branches');

  const filtered = selected === 'All Branches' ? BRANCHES : BRANCHES.filter(b => b.name === selected);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-body)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Branch Performance</span>

        {/* Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              color: 'var(--color-foreground)'
            }}
          >
            {selected}
            <Ic size={11} color="var(--color-muted-foreground)" sw={2.5}>
              <path d={dropdownOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
            </Ic>
          </button>

          {dropdownOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setDropdownOpen(false)} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 10,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                minWidth: 160, overflow: 'hidden', padding: '4px 0'
              }}>
                {ALL_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setSelected(opt); setDropdownOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 14px', border: 'none', background: 'transparent',
                      fontSize: 12, fontWeight: opt === selected ? 600 : 400,
                      color: opt === selected ? 'var(--color-primary)' : 'var(--color-foreground)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: opt === selected ? 'var(--color-blue-light)' : 'transparent'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Single Bar Chart */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 16 }}>
          Deceased by Branch
        </div>
        <BarChart />
      </div>
    </div>
  );
}
