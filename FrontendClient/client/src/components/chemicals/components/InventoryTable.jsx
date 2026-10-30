import React from 'react';
import { Beaker, Edit3, FlaskConical, Plus, Search, Truck } from 'lucide-react';
import { PrimaryButton } from './InventoryStyles';

const stockPercent = (chemical) => {
  const quantity = Number(chemical.current_stock ?? chemical.quantity_available ?? 0);
  const minimum = Number(chemical.min_stock_level || 0);
  if (!minimum) return quantity > 0 ? 100 : 0;
  return Math.min(100, Math.round(quantity / minimum * 100));
};

const InventoryTable = ({
  chemicals, loading, branchName, search, onSearch, categories, category, onCategory,
  stockFilter, onStockFilter, onAdd, onReceive, onUse, onEdit,
}) => (
  <section className="panel inventory-panel">
    <div className="panel-heading inventory-heading">
      <div>
        <div className="inventory-title-line">
          <h2>{branchName || 'Inventory overview'}</h2>
          <span className="item-count">{chemicals.length} items</span>
        </div>
        <p>Stock levels and safety details from your live inventory</p>
      </div>
      <PrimaryButton type="button" onClick={onAdd}><Plus size={15} /> Add chemical</PrimaryButton>
    </div>
    <div className="inventory-toolbar">
      <label className="search-field">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name or batch..." />
      </label>
      <select aria-label="Filter by category" value={category} onChange={(event) => onCategory(event.target.value)}>
        <option value="all">All categories</option>
        {categories.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <select aria-label="Filter by stock status" value={stockFilter} onChange={(event) => onStockFilter(event.target.value)}>
        <option value="all">All stock</option><option value="low">Low stock</option><option value="healthy">Healthy</option>
      </select>
    </div>
    <div className="table-scroll">
      <table>
        <thead><tr><th>Item</th><th>Category</th><th>Stock level</th><th>Hazard</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {loading && !chemicals.length ? (
            <tr><td colSpan="5"><div className="table-state">Loading your inventory…</div></td></tr>
          ) : chemicals.length === 0 ? (
            <tr><td colSpan="5"><div className="table-state"><Beaker size={23} /><strong>No inventory found</strong><span>Try changing a filter, or add your first chemical.</span></div></td></tr>
          ) : chemicals.map((chemical) => {
            const quantity = Number(chemical.current_stock ?? chemical.quantity_available ?? 0);
            const minimum = Number(chemical.min_stock_level || 0);
            const low = quantity <= minimum;
            const health = stockPercent(chemical);
            return (
              <tr key={chemical.chemical_id}>
                <td>
                  <div className="item-name"><span className={`item-icon ${low ? 'low' : ''}`}><Beaker size={16} /></span><span><strong>{chemical.chemical_name}</strong><small>{chemical.chemical_uid || `ID ${chemical.chemical_id}`}{chemical.batch_number ? ` · Batch ${chemical.batch_number}` : ''}</small></span></div>
                </td>
                <td><span className="category-chip">{chemical.category || 'Uncategorised'}</span></td>
                <td>
                  <div className="stock-cell"><div className="stock-amount"><strong className={low ? 'text-low' : ''}>{quantity.toLocaleString()} {chemical.unit}</strong><small>Minimum {minimum.toLocaleString()} {chemical.unit}</small></div>
                    <div className="stock-meter"><span className={low ? 'low' : ''} style={{ width:`${health}%` }} /></div>
                  </div>
                </td>
                <td><span className={`hazard-tag hazard-${String(chemical.hazard_level || 'low').toLowerCase()}`}>{chemical.hazard_level || 'Low'}</span></td>
                <td><div className="row-actions">
                  <button type="button" title={`Receive stock for ${chemical.chemical_name}`} aria-label={`Receive stock for ${chemical.chemical_name}`} onClick={() => onReceive(chemical)}><Truck size={15} /></button>
                  <button type="button" title={`Record usage for ${chemical.chemical_name}`} aria-label={`Record usage for ${chemical.chemical_name}`} onClick={() => onUse(chemical)}><FlaskConical size={15} /></button>
                  <button type="button" title={`Edit ${chemical.chemical_name}`} aria-label={`Edit ${chemical.chemical_name}`} onClick={() => onEdit(chemical)}><Edit3 size={15} /></button>
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <style>{`
      .inventory-heading { align-items:center; }
      .inventory-title-line { display:flex;align-items:center;gap:9px;flex-wrap:wrap; }
      .item-count { padding:4px 8px;border-radius:20px;background:#f0f5f2;color:#638375;font-size:10px;font-weight:750; }
      .inventory-toolbar { display:flex;align-items:center;gap:8px;padding:0 20px 14px; }
      .search-field { display:flex;align-items:center;gap:8px;flex:1;min-width:170px;height:38px;padding:0 11px;border:1px solid #e6ece8;border-radius:9px;color:#8b9b95;background:#fbfcfb; }
      .search-field input { width:100%;border:0;outline:0;background:transparent;color:#34544a;font-size:12px; }
      .inventory-toolbar select { height:38px;padding:0 10px;border:1px solid #e6ece8;border-radius:9px;background:#fff;color:#5d746a;font-size:11px; }
      .table-scroll { overflow-x:auto; }
      table { width:100%;border-collapse:collapse;text-align:left; }
      thead { background:#f7faf8; }
      th { padding:10px 15px;color:#899890;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap; }
      td { padding:12px 15px;border-top:1px solid #eef2ef;color:#536c61;font-size:11px; }
      .item-name { display:flex;align-items:center;gap:10px;min-width:190px; }
      .item-icon { width:33px;height:33px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;color:#267858;background:#eaf5ee; }
      .item-icon.low { color:#bf6929;background:#fff2e4; }
      .item-name strong,.item-name small,.stock-amount strong,.stock-amount small { display:block; }
      .item-name strong { color:#26463a;font-size:12px;font-weight:750; }
      .item-name small { margin-top:4px;color:#91a098;font-size:10px; }
      .category-chip { display:inline-block;padding:5px 8px;border-radius:6px;background:#f1f5f2;color:#668075;font-size:10px; }
      .stock-cell { min-width:155px; }
      .stock-amount { display:flex;align-items:center;justify-content:space-between;gap:6px; }
      .stock-amount strong { color:#315a48;font-size:11px;white-space:nowrap; }
      .stock-amount small { color:#94a29b;font-size:9px;white-space:nowrap; }
      .stock-amount .text-low { color:#b9573e; }
      .stock-meter { height:4px;margin-top:8px;overflow:hidden;border-radius:4px;background:#edf2ee; }
      .stock-meter span { display:block;height:100%;border-radius:4px;background:#4b9b75; }
      .stock-meter span.low { background:#e2a35c; }
      .hazard-tag { display:inline-block;padding:4px 8px;border-radius:20px;font-size:9px;font-weight:750;text-transform:capitalize; }
      .hazard-high { color:#ad493e;background:#fff0ed; }.hazard-medium { color:#ae7626;background:#fff6e8; }.hazard-low { color:#408160;background:#eaf6ed; }
      .row-actions { display:flex;justify-content:flex-end;gap:4px; }
      .row-actions button { width:29px;height:29px;display:grid;place-items:center;border:1px solid transparent;border-radius:8px;color:#7a9185;background:transparent; }
      .row-actions button:hover { color:#176b53;border-color:#dbe9e0;background:#f3f8f5; }
      .table-state { min-height:170px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#91a098;font-size:12px; }
      .table-state strong { color:#405c50;font-size:13px; }.table-state span { font-size:11px; }
      .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }
      @media(max-width:620px) { .inventory-heading { align-items:flex-start;flex-direction:column; }.inventory-toolbar { flex-wrap:wrap;padding:0 13px 12px; }.search-field { flex-basis:100%; }.inventory-toolbar select { flex:1;min-width:0; }.inventory-heading { padding:16px 14px 12px; } th,td { padding-left:10px;padding-right:10px; } }
    `}</style>
  </section>
);

export default InventoryTable;
