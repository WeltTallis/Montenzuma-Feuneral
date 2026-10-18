import React, { useMemo } from 'react';
import { SearchBar } from '../components/SearchBar';

/* ============================================================================
   MaterialsView — materials inventory table.
   ============================================================================ */
const MaterialsView = ({ materials = [], onRestock, onDelete, onUseMaterial }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = materials;
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    return list;
  }, [materials, search]);

  return (
    <div className="ec-materials-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Inventory</div>
          <h1 className="ec-view-title">Materials stock</h1>
        </div>
      </div>

      <div className="ec-top-bar">
        <SearchBar placeholder="Search materials..." value={search} onChange={setSearch} />
        <button className="ec-new-order-btn" onClick={() => alert('Add material form would open here')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Material
        </button>
      </div>

      <div className="ec-mat-table-wrap">
        <table className="ec-mat-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Level</th>
              <th>Unit</th>
              <th>Per Coffin</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const isCrit = m.quantity <= m.minLevel * 0.5;
              const isLow = m.quantity <= m.minLevel;
              const pct = Math.max(0, Math.min(100, (m.quantity / (m.minLevel * 3)) * 100));
              const status = isCrit ? 'critical' : isLow ? 'low' : 'ok';
              const statusLabel = isCrit ? 'Critical' : isLow ? 'Low' : 'OK';
              const statusBg = isCrit ? '#fdecee' : isLow ? '#fff4d6' : '#eafaf0';
              const statusColor = isCrit ? '#d63862' : isLow ? '#d97706' : '#1f9d50';

              return (
                <tr key={m.id}>
                  <td className="ec-mat-name">{m.name}</td>
                  <td style={{ color: '#666', textTransform: 'capitalize' }}>{m.category}</td>
                  <td className={`ec-mat-qty ${status}`}>{m.quantity}</td>
                  <td>
                    <div className="ec-mat-bar"><div className={`ec-mat-bar-fill ${status}`} style={{ width: `${pct}%` }} /></div>
                  </td>
                  <td style={{ color: '#666', textTransform: 'capitalize' }}>{m.unit}</td>
                  <td style={{ color: '#666' }}>{m.perCoffin}</td>
                  <td>
                    <span className={`ec-mat-pill ${status}`} style={{ background: statusBg, color: statusColor }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="ec-mat-actions">
                      <button className="ec-mat-act ec-mat-act-use" onClick={() => onUseMaterial?.(m)} title="Use stock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Use
                      </button>
                      <button className="ec-mat-act ec-mat-act-add" onClick={() => onRestock?.(m)} title="Add stock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add
                      </button>
                      <button className="ec-mat-act ec-mat-act-del" onClick={() => onDelete?.(m)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No materials found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialsView;
