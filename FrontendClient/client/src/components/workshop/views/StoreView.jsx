import React, { useMemo } from 'react';

/* ============================================================================
   StoreView — store inventory with coffin types × colors.
   ============================================================================ */
const StoreView = ({ store = [], onRestock, onDispatch }) => {
  const types = useMemo(() => {
    const typeMap = new Map();
    store.forEach((s) => {
      if (!typeMap.has(s.type)) typeMap.set(s.type, []);
      typeMap.get(s.type).push(s);
    });
    return Array.from(typeMap.entries());
  }, [store]);

  const totalUnits = store.reduce((sum, s) => sum + s.qty, 0);
  const lowStock = store.filter((s) => s.qty > 0 && s.qty <= 2).length;
  const outOfStock = store.filter((s) => s.qty === 0).length;

  return (
    <div className="ec-store-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Inventory</div>
          <h1 className="ec-view-title">Store</h1>
        </div>
      </div>

      <div className="ec-top-bar">
        <div className="ec-store-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search store inventory..." style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', color: '#1a1a1a' }} />
        </div>
        <button className="ec-new-order-btn" style={{ background: '#2563eb' }} onClick={() => alert('Use materials form would open here')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3H10L8 7H5a2 2 0 0 0-2 2z" />
            <path d="M9 13l2 2 4-4" />
          </svg>
          Use Materials
        </button>
        <button className="ec-new-order-btn" onClick={() => alert('Dispatch panel would open here')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          Dispatch Coffins
        </button>
      </div>

      {/* Stats */}
      <div className="ec-store-stats">
        <div className="ec-store-stat">
          <div className="ec-store-stat-label">Total in store</div>
          <div className="ec-store-stat-value">{totalUnits}</div>
          <div className="ec-store-stat-sub">{totalUnits >= 40 ? 'Near capacity' : 'Healthy stock'}</div>
        </div>
        <div className="ec-store-stat">
          <div className="ec-store-stat-label">Low stock alerts</div>
          <div className="ec-store-stat-value" style={{ color: (lowStock + outOfStock) > 0 ? '#d63862' : '#1a1a1a' }}>{lowStock + outOfStock}</div>
          <div className="ec-store-stat-sub">{outOfStock} out of stock · {lowStock} low</div>
        </div>
        <div className="ec-store-stat">
          <div className="ec-store-stat-label">Active variants</div>
          <div className="ec-store-stat-value">{store.filter((s) => s.qty > 0).length}</div>
          <div className="ec-store-stat-sub">{store.length} total variants</div>
        </div>
      </div>

      {/* Coffin type list */}
      <div className="ec-store-list-card">
        <div className="ec-store-list-head">
          <div>Coffin type</div>
          <div>Total stock</div>
          <div>Variants</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>
        <div className="ec-store-list-body">
          {types.map(([type, variants]) => {
            const typeTotal = variants.reduce((sum, v) => sum + v.qty, 0);
            const lowCount = variants.filter((v) => v.qty > 0 && v.qty <= 2).length;
            const outCount = variants.filter((v) => v.qty === 0).length;
            let statusCls = 'ok', statusLabel = 'Healthy';
            if (outCount > 0) { statusCls = 'alert'; statusLabel = 'Out of stock'; }
            else if (lowCount > 0) { statusCls = 'warn'; statusLabel = `${lowCount} low`; }

            return (
              <div key={type} className="ec-store-type-row" onClick={(e) => { if (!e.target.closest('.ec-str-actions')) alert(`Viewing ${type} variants`) }}>
                <div className="ec-str-name">
                  <svg className="ec-str-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {type} Coffin
                </div>
                <div><span className="ec-str-qty">{typeTotal}</span> <span className="ec-str-qty-lbl">units</span></div>
                <div>
                  <div className="ec-str-variants">{variants.length} colors</div>
                  <div className="ec-str-variants-sub">{variants.filter((v) => v.qty > 0).length} active</div>
                </div>
                <div><span className={`ec-str-status ${statusCls}`}>{statusLabel}</span></div>
                <div className="ec-str-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="ec-str-act ec-str-act-add" onClick={() => onRestock?.(type)}>+ Add</button>
                  <button className="ec-str-act ec-str-act-dis" onClick={() => onDispatch?.(type)}>Dispatch</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreView;
