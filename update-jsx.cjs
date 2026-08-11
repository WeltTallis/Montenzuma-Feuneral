const fs = require('fs');
const file = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(file, 'utf8');
const usesCRLF = c.includes('\r\n');

const funcStart = '  function renderAviationDispatchModal() {';
const startIdx = c.indexOf(funcStart);
if (startIdx === -1) { console.log('Function start not found'); process.exit(1); }

const afterStart = c.indexOf('  function renderDispatchModal() {', startIdx);
if (afterStart === -1) { console.log('Next function not found'); process.exit(1); }

const newFunc = fs.readFileSync('d:/new/restpoint/new-dispatch-modal.js', 'utf8');
c = c.substring(0, startIdx) + newFunc + c.substring(afterStart);

// Update history row
const oldHist = `                         <div style={{ fontSize: 11, color: T.textSec }}>{fmtDate(h.date)} · {h.pickedBy}</div>
                   {h.notes && <div style={{ fontSize: 10, color: T.textMuted }}>{h.notes}</div>}`;
const newHist = `                         <div style={{ fontSize: 11, color: T.textSec }}>{fmtDate(h.date)} · {h.pickedBy}{h.assignedToName ? ' · ' + h.assignedToName : ''}</div>
                   {h.notes && <div style={{ fontSize: 10, color: T.textMuted }}>{h.notes}</div>}`;
c = c.split(oldHist).join(newHist);

// Remove old helpers
const oldHelpers = `  const toggleCoffinSelection = (key) => {
    setDispatchForm(f => ({
      ...f,
      selectedIds: f.selectedIds.includes(key)
        ? f.selectedIds.filter(id => id !== key)
        : [...f.selectedIds, key],
    }));
  };

  const toggleAllCoffins = () => {
    setDispatchForm(f => ({
      ...f,
      selectedIds: f.selectedIds.length === readyCoffins.length
        ? []
        : readyCoffins.map(it => it.key),
    }));
  };`;
if (c.includes(oldHelpers)) {
  c = c.split(oldHelpers).join('  // removed toggleCoffinSelection/toggleAllCoffins (replaced by setSelectedCoffin)');
}

if (usesCRLF) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c);
console.log('Done');
