const fs = require('fs');
const path = 'FrontendClient/client/src/components/coffins/coffininventory.jsx';
let c = fs.readFileSync(path, 'utf8');
const oldStr = "        {bkView === 'calendar' ? (" + "`n          <div>";
const newStr = oldStr + "`n            <style>{`.coffin-detail-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:12px}.coffin-detail-title{font-size:14px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}.coffin-detail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.coffin-detail-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;cursor:pointer;transition:all .15s}.coffin-detail-card:hover{box-shadow:0 12px 40px rgba(0,0,0,.1);border-color:#000;transform:translateY(-1px)}.coffin-detail-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.coffin-detail-card-client{font-size:12px;font-weight:700;color:#0f172a}.coffin-detail-card-meta{font-size:10px;color:#64748b;line-height:1.5}`}</style>";
if (c.includes(oldStr)) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(path, c);
  console.log('added style tag');
} else {
  console.log('old string not found');
}
