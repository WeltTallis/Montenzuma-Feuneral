const fs = require('fs');
const p = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const NL = '\r';
let ADJ = 0;
const at = (orig) => orig + ADJ;

function setLine(orig, text) {
  lines[at(orig)] = text + NL;
}
function insertAfter(orig, block) {
  const arr = block.map((t) => (t === '' ? '' : t + NL));
  lines.splice(at(orig) + 1, 0, ...arr);
  ADJ += arr.length;
}

// --- Edit 1: import parseDate + toDateKey ---
setLine(1, "import { formatDate as fmtDate, parseDate, toDateKey } from '../../../utils/dates/parseDates';");

// --- Edit 2: fix history date (off-by-one) ---
setLine(133, "          unit: h.unit || 'pcs', qty: Number(h.qty) || 0, date: toDateKey(parseDate(h.txn_date)) || '',");

// --- Edit 3: add totalRestocked counter ---
insertAfter(177, [
  "",
  "  const totalRestocked = history.reduce((s, h) => s + (h.action === 'RESTOCK' ? (Number(h.qty) || 0) : 0), 0);",
]);

// --- Edit 4: calendar wrapper -> two-column grid + left column ---
setLine(775, "          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 0, minHeight: 420 }}>");
insertAfter(775, [
  "",
  "            <div style={{ padding: 14, borderRight: `1px solid ${T.borderLight}` }}>",
]);

// --- Edit 5: close left column + open right sidebar (was the "what happened on" container) ---
setLine(847, "            </div>");
insertAfter(847, [
  "",
  "            <div style={{ padding: 16, background: T.bg, display: 'flex', flexDirection: 'column', gap: 12 }}>",
]);

// --- Edit 6: history wrapper -> two-column grid + left column ---
setLine(899, "          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 0, minHeight: 420 }}>");
insertAfter(899, [
  "",
  "            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto', borderRight: `1px solid ${T.borderLight}` }}>",
]);

// --- Edit 7: history sidebar (inserted after the left-column close, originally line 925) ---
const sidebar = [
  "",
  "            <div style={{ padding: 16, background: T.bg, display: 'flex', flexDirection: 'column', gap: 12 }}>",
  "",
  "              <div style={{ fontSize: 12, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>",
  "                <i className=\"fas fa-chart-simple\" style={{ color: T.primary, fontSize: 11 }} /> Store Activity Summary",
  "              </div>",
  "",
  "              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>",
  "                <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 10, padding: '12px 14px' }}>",
  "                  <div style={{ fontSize: 11, color: T.textMuted }}>Total Dispatched</div>",
  "                  <div style={{ fontSize: 22, fontWeight: 800, color: T.danger }}>{totalDispatched} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>coffins</span></div>",
  "                </div>",
  "",
  "                <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 10, padding: '12px 14px' }}>",
  "                  <div style={{ fontSize: 11, color: T.textMuted }}>Total Restocked</div>",
  "                  <div style={{ fontSize: 22, fontWeight: 800, color: T.success }}>{totalRestocked} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>units</span></div>",
  "                </div>",
  "",
  "                <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 10, padding: '12px 14px' }}>",
  "                  <div style={{ fontSize: 11, color: T.textMuted }}>Transactions</div>",
  "                  <div style={{ fontSize: 22, fontWeight: 800, color: T.primary }}>{history.length} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>records</span></div>",
  "                </div>",
  "              </div>",
  "",
  "              <div style={{ fontSize: 12, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>",
  "                <i className=\"fas fa-clock-rotate-left\" style={{ color: T.primary, fontSize: 11 }} /> Most Recent",
  "              </div>",
  "",
  "              {history.length === 0 ? (",
  "                <div style={{ fontSize: 12, color: T.textMuted, padding: '12px 0' }}>No activity recorded yet.</div>",
  "              ) : (",
  "                (() => {",
  "                  const latest = history[0];",
  "                  const isDisp = latest && latest.action === 'DISPATCH';",
  "                  return (",
  "                    <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 10, padding: '12px 14px' }}>",
  "                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{latest ? latest.name : '—'}</div>",
  "                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{latest ? (isDisp ? 'Dispatched' : 'Restocked') + ' · ' + fmtDate(latest.date) + ' · by ' + (latest.pickedBy || '—') : ''}</div>",
  "                    </div>",
  "                  );",
  "                })()",
  "              )}",
  "",
  "            </div>",
  "",
  "          </div>",
];
insertAfter(925, sidebar);

fs.writeFileSync(p, lines.join('\n'));
console.log('StoreTab fixes applied. Total lines:', lines.length);
