const fs = require('fs');

let changed = [];
const apply = (file, oldStr, newStr, label) => {
  if (!fs.existsSync(file)) { console.log('MISSING FILE:', file); return; }
  let c = fs.readFileSync(file, 'utf8');
  // Normalize both to handle CRLF files
  const search = oldStr.replace(/\r?\n/g, '\n');
  const haystack = c.replace(/\r?\n/g, '\n');
  if (haystack.includes(search)) {
    const fixed = (haystack.split(search).join(newStr.replace(/\r?\n/g, '\n')));
    // Restore original line endings (CRLF if the file used CRLF)
    const usesCRLF = c.includes('\r\n');
    const out = usesCRLF ? fixed.replace(/\n/g, '\r\n') : fixed;
    fs.writeFileSync(file, out);
    changed.push(label);
    console.log('OK -', label);
  } else {
    console.log('NOT FOUND -', label);
  }
};

// ============ BACKEND: storeController.js ============
const storeCtrl = 'd:/new/restpoint/services/workshop-service/dist/controllers/storeController.js';
{
  const oldQ = "const items = await (0, db_1.safeTenantQuery)(tenantDb, 'SELECT * FROM store_items ORDER BY item_type, item_name');";
  const newQ = "const items = await (0, db_1.safeTenantQuery)(tenantDb, `SELECT si.*, (SELECT w.full_name FROM worker_assignments wa JOIN workshop_workers w ON wa.user_id = w.id WHERE wa.coffin_order_id = CAST(REPLACE(si.item_key, 'cf:', '') AS UNSIGNED) ORDER BY wa.assigned_at DESC LIMIT 1) as assigned_to_name FROM store_items si ORDER BY si.item_type, si.item_name`);";
  apply(storeCtrl, oldQ, newQ, 'backend: assigned_to_name in store inventory');
}

// ============ FRONTEND: StoreTab.jsx ============
const storeTab = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';

// 1. dispatchForm state
apply(storeTab,
`  const [dispatchForm, setDispatchForm] = useState({
    selectedIds: [],
    dispatchedBy: '',
    receivedBy: '',
    vehicle: '',
    driver: '',
    date: toKey(new Date()),
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    destination: '',
    purpose: '',
    remarks: '',
  });`,
`  const [dispatchForm, setDispatchForm] = useState({
    selectedCoffinKey: '',
    qty: 1,
    dispatchedBy: '',
    receivedBy: '',
    driver: '',
    date: toKey(new Date()),
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    destination: '',
    purpose: '',
    remarks: '',
  });`,
'frontend: dispatchForm state');

// 2. loadStore items mapping - add assignedToName
apply(storeTab,
`          sub: it.item_sub || '', unit: it.unit || 'pcs', quantity: Number(it.quantity) || 0,
        })) : []);`,
`          sub: it.item_sub || '', unit: it.unit || 'pcs', quantity: Number(it.quantity) || 0,
          assignedToName: it.assigned_to_name || '',
        })) : []);`,
'frontend: items assignedToName');

// 3. loadStore history mapping - add assignedToName
apply(storeTab,
`          pickedBy: h.txn_by || '', notes: h.notes || '',
        })) : []);`,
`          pickedBy: h.txn_by || '', notes: h.notes || '', assignedToName: h.assigned_to_name || '',
        })) : []);`,
'frontend: history assignedToName');

// 4. openAviationDispatch
apply(storeTab,
`      selectedIds: readyCoffins.map(it => it.key),
      date: toKey(new Date()),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      dispatchedBy: '',
      receivedBy: '',
      vehicle: '',
      driver: '',
      destination: '',
      purpose: '',
      remarks: '',`,
`      selectedCoffinKey: readyCoffins[0]?.key || '',
      qty: 1,
      date: toKey(new Date()),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      dispatchedBy: '',
      receivedBy: '',
      driver: '',
      destination: '',
      purpose: '',
      remarks: '',`,
'frontend: openAviationDispatch');

// 5. toggleCoffinSelection + toggleAllCoffins -> setSelectedCoffin
apply(storeTab,
`  const toggleCoffinSelection = (key) => {
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
  };`,
`  const setSelectedCoffin = (key) => {
    setDispatchForm(f => ({ ...f, selectedCoffinKey: key, qty: 1 }));
  };`,
'frontend: helper functions');

console.log('\nApplied changes:', changed.length);
console.log(changed.join('\n'));