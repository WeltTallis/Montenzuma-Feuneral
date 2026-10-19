import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { workshopService } from '../services/workshopService';

const panelStyle = {
  border: '1px solid #e8e9ec',
  borderRadius: 16,
  background: '#fff',
  padding: 20,
  boxShadow: '0 8px 24px rgba(18, 24, 40, 0.04)',
};

const sectionTitle = { margin: 0, fontSize: 16, fontWeight: 750, color: '#171923' };
const muted = { color: '#737783', fontSize: 12 };

const CoffinInsights = () => {
  const [inventory, setInventory] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    const [inventoryResult, salesResult] = await Promise.all([
      workshopService.getCoffinInventoryAnalytics(),
      workshopService.getCoffinSalesAnalytics(),
    ]);

    const errors = [inventoryResult, salesResult]
      .filter((result) => !result?.success)
      .map((result) => result?.error || 'Could not load coffin analytics.');
    if (errors.length) {
      setError(errors.join(' '));
      setLoading(false);
      return;
    }

    setInventory(inventoryResult.data || null);
    setSales(Array.isArray(salesResult.data) ? salesResult.data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadInsights(); }, [loadInsights]);

  const topMoving = useMemo(
    () => sales.filter((item) => Number(item.sold) > 0)
      .sort((a, b) => Number(b.sold) - Number(a.sold))
      .slice(0, 5),
    [sales],
  );
  const lowStock = useMemo(
    () => (inventory?.variants || [])
      .filter((variant) => Number(variant.available) <= 2)
      .slice(0, 6),
    [inventory],
  );
  const summary = inventory?.summary || {};

  return (
    <section style={{ ...panelStyle, marginBottom: 22 }} aria-labelledby="coffin-insights-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div>
          <p style={{ ...muted, margin: '0 0 5px', fontWeight: 700, letterSpacing: '.08em' }}>PRODUCTION DECISIONS</p>
          <h2 id="coffin-insights-title" style={sectionTitle}>Coffin demand &amp; stock</h2>
          <p style={{ ...muted, margin: '5px 0 0' }}>Use completed bookings to see what moves, and low stock to guide the next build.</p>
        </div>
        <button
          type="button"
          className="workshop-outline-button"
          onClick={loadInsights}
          disabled={loading}
          aria-label="Refresh coffin demand and stock analytics"
        >
          <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && !inventory && !error && (
        <div className="workshop-feedback"><span className="workshop-spinner" /><strong>Loading coffin analytics</strong></div>
      )}
      {error && (
        <div className="workshop-feedback workshop-error" role="alert">
          <i className="fas fa-triangle-exclamation" /><strong>Could not load coffin analytics</strong>
          <small>{error}</small>
          <button type="button" className="workshop-outline-button" onClick={loadInsights}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 18 }}>
            {[
              ['Designs tracked', summary.totalTypes ?? 0],
              ['Available coffins', summary.totalAvailable ?? 0],
              ['Reserved', summary.totalReserved ?? 0],
              ['Low / out-of-stock variants', lowStock.length],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '12px 14px', border: '1px solid #eff0f2', borderRadius: 12, background: '#fafbfc' }}>
                <div style={{ color: '#737783', fontSize: 11, fontWeight: 650 }}>{label}</div>
                <strong style={{ display: 'block', marginTop: 5, color: '#171923', fontSize: 22 }}>{value}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <i className="fas fa-arrow-trend-up" style={{ color: '#059669' }} />
                <h3 style={{ ...sectionTitle, fontSize: 14 }}>Most moving variants</h3>
              </div>
              {topMoving.length ? topMoving.map((item, index) => (
                <div key={`${item.type}-${item.color}-${item.size}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f1f3' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 25, height: 25, flexShrink: 0, borderRadius: 8, background: index === 0 ? '#ecfdf5' : '#f4f5f7', color: index === 0 ? '#047857' : '#626774', fontSize: 11, fontWeight: 750 }}>{index + 1}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', color: '#232630', fontSize: 12 }}>{item.type} · {item.color}</strong>
                    <small style={muted}>{item.size}</small>
                  </span>
                  <strong style={{ color: '#047857', whiteSpace: 'nowrap', fontSize: 12 }}>{item.sold} completed</strong>
                </div>
              )) : <p style={muted}>No completed coffin bookings yet. Completed bookings will identify the best-selling variants.</p>}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <i className="fas fa-triangle-exclamation" style={{ color: '#dc2626' }} />
                <h3 style={{ ...sectionTitle, fontSize: 14 }}>Build or restock next</h3>
              </div>
              {lowStock.length ? lowStock.map((variant) => (
                <div key={variant.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f1f3' }}>
                  <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: Number(variant.available) === 0 ? '#dc2626' : '#d97706' }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', color: '#232630', fontSize: 12 }}>{variant.type} · {variant.color}</strong>
                    <small style={muted}>{variant.size} · {variant.reserved} reserved</small>
                  </span>
                  <strong style={{ color: Number(variant.available) === 0 ? '#b91c1c' : '#b45309', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {variant.available === 0 ? 'Out' : `${variant.available} left`}
                  </strong>
                </div>
              )) : <p style={muted}>No variants are at or below the low-stock threshold of 2 available.</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CoffinInsights;
