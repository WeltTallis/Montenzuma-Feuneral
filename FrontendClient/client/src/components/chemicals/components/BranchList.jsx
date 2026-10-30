import React from 'react';
import { Building2, MapPin } from 'lucide-react';

const BranchList = ({ branches, chemicals, selectedBranchId, onSelect }) => {
  const branchCount = (id) => chemicals.filter((chemical) => String(chemical.branch_id) === String(id)).length;
  const lowStockCount = (id) => chemicals.filter((chemical) =>
    String(chemical.branch_id) === String(id) &&
    Number(chemical.current_stock ?? chemical.quantity_available) <= Number(chemical.min_stock_level || 0)
  ).length;

  return (
    <aside className="panel branch-panel">
      <div className="panel-heading">
        <div><h2>Branches</h2><p>Choose a location to view its stock</p></div>
        <Building2 size={18} color="#6e9182" />
      </div>
      <div className="branch-list">
        <button type="button" className={`branch-option ${selectedBranchId === 'all' ? 'selected' : ''}`} onClick={() => onSelect('all')}>
          <span className="branch-mark"><Building2 size={17} /></span>
          <span className="branch-copy"><strong>All branches</strong><small>Tenant-wide inventory</small></span>
          <span className="branch-count">{chemicals.length}</span>
        </button>
        {branches.map((branch) => (
          <button type="button" className={`branch-option ${String(selectedBranchId) === String(branch.id) ? 'selected' : ''}`} onClick={() => onSelect(String(branch.id))} key={branch.id}>
            <span className="branch-mark"><MapPin size={17} /></span>
            <span className="branch-copy"><strong>{branch.name}</strong><small>{branch.location || `${lowStockCount(branch.id)} low-stock items`}</small></span>
            <span className="branch-count">{branchCount(branch.id)}</span>
          </button>
        ))}
        {!branches.length && <p className="branch-empty">Branch details are not available.</p>}
      </div>
      <style>{`
        .branch-panel { position:sticky;top:18px;overflow:hidden; }
        .branch-list { padding:2px 10px 12px;display:grid;gap:5px; }
        .branch-option { display:flex;align-items:center;gap:10px;width:100%;padding:11px 10px;text-align:left;color:#34544a;border:1px solid transparent;border-radius:11px;background:transparent; }
        .branch-option:hover { background:#f7faf8; }
        .branch-option.selected { background:#edf6f1;border-color:#d6e9df;color:#176b53; }
        .branch-mark { width:32px;height:32px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;background:#f1f5f2;color:#638375; }
        .selected .branch-mark { color:#176b53;background:#deeee5; }
        .branch-copy { min-width:0;display:grid;gap:4px;flex:1; }
        .branch-copy strong { font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .branch-copy small { color:#8b9b95;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .branch-count { display:grid;place-items:center;min-width:25px;height:24px;padding:0 6px;border-radius:8px;background:#f0f4f1;color:#587267;font-size:11px;font-weight:750; }
        .branch-empty { color:#879790;font-size:12px;padding:12px; }
        @media(max-width:900px) { .branch-panel { position:static; }.branch-list { grid-template-columns:repeat(auto-fit,minmax(205px,1fr)); } }
      `}</style>
    </aside>
  );
};

export default BranchList;