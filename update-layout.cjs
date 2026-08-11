const fs = require('fs');
const file = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(file, 'utf8');
const usesCRLF = c.includes('\r\n');
const norm = (s) => s.replace(/\r?\n/g, '\n');

// 1. Add assignWorkerForm state after dispatchForm state
const dispatchFormEnd = `    remarks: '',
  });`;
const newState = `    remarks: '',
  });
  const [assignWorkerForm, setAssignWorkerForm] = useState({ item: null, workerId: '', loading: false });
`;
c = c.split(dispatchFormEnd).join(newState);

// 2. Add openAssignWorker function after setSelectedCoffin
const setSelectedCoffinEnd = `  const setSelectedCoffin = (key) => {
    setDispatchForm(f => ({ ...f, selectedCoffinKey: key, qty: 1 }));
  };`;
const newFunc = `  const setSelectedCoffin = (key) => {
    setDispatchForm(f => ({ ...f, selectedCoffinKey: key, qty: 1 }));
  };

  const openAssignWorker = (item) => {
    setAssignWorkerForm({ item, workerId: '', loading: false });
  };
`;
c = c.split(setSelectedCoffinEnd).join(newFunc);

// 3. Add submitAssignWorker function after submitAviationDispatch
const submitDispatchEnd = `    } finally {
      setLoading(false);
    }
  };`;
const newSubmit = `    } finally {
      setLoading(false);
    }
  };

  const submitAssignWorker = async () => {
    if (!assignWorkerForm.item || !assignWorkerForm.workerId) {
      addToast('Select a worker', 'error');
      return;
    }
    setAssignWorkerForm(f => ({ ...f, loading: true }));
    try {
      const orderId = assignWorkerForm.item.key.replace('cf:', '');
      await workshopService.assignWorker(orderId, { user_id: assignWorkerForm.workerId, role: 'workshop' });
      addToast('Worker assigned successfully', 'success');
      setAssignWorkerForm({ item: null, workerId: '', loading: false });
      loadStore();
    } catch (e) {
      addToast(e?.message || 'Failed to assign worker', 'error');
      setAssignWorkerForm(f => ({ ...f, loading: false }));
    }
  };`;
c = c.split(norm(submitDispatchEnd)).join(norm(newSubmit));

// 4. Add renderAssignWorkerModal function before renderDispatchModal
const renderDispatchModalStart = '  function renderDispatchModal() {';
const newModal = `  function renderAssignWorkerModal() {
    const { item, workerId, loading } = assignWorkerForm;
    if (!item) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setAssignWorkerForm({ item: null, workerId: '', loading: false })}>
        <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + T.borderLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><i className="fas fa-user-plus" style={{ color: T.primary, marginRight: 8 }} />Assign Worker</div>
            <button onClick={() => setAssignWorkerForm({ item: null, workerId: '', loading: false })} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: T.primaryBg, border: '1px solid ' + T.primary + '25', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{item.name}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{item.sub}</div>
            </div>
            <div>
              <label style={labelS}>Select Worker</label>
              <select value={workerId} onChange={e => setAssignWorkerForm(f => ({ ...f, workerId: e.target.value }))} style={{ ...inputS, background: T.surface }}>
                <option value="">-- Choose a worker --</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignWorkerForm({ item: null, workerId: '', loading: false })} style={primaryBtn(T.bg, T.textSec)}>Cancel</button>
              <button onClick={submitAssignWorker} disabled={loading || !workerId} style={{ ...primaryBtn(T.primary, '#fff'), opacity: (!workerId || loading) ? 0.5 : 1, cursor: (!workerId || loading) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Assigning...' : 'Assign Worker'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

`;
c = c.split(renderDispatchModalStart).join(newModal + renderDispatchModalStart);

// 5. Update main return to use 2-column layout with date sidebar
const mainReturnOld = `      {renderInventory()}
      {renderJournal()}`;
const mainReturnNew = `      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {renderInventory()}
        <div style={{ position: 'sticky', top: 12 }}>
          {renderDateSidebar()}
        </div>
      </div>
      {renderJournal()}`;
c = c.split(mainReturnOld).join(mainReturnNew);

// 6. Add renderDateSidebar function
const renderJournalStart = '  function renderJournal() {';
const newSidebar = `  function renderDateSidebar() {
    const dayEntries = selectedEntries.filter(h => h.action === 'DISPATCH');
    const uniqueCoffins = [];
    const seen = new Set();
    dayEntries.forEach(h => {
      const name = h.itemName || h.item_key;
      if (!seen.has(name)) { seen.add(name); uniqueCoffins.push(h); }
    });
    return (
      <div style={{ background: T.surface, border: '1px solid ' + T.bdr, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + T.borderLight, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-calendar-day" style={{ color: T.primary, fontSize: 14 }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Coffins Dispatched</div>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 520, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>{selectedDate}</div>
          {uniqueCoffins.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: 16 }}>No dispatches on this date.</div>
          ) : uniqueCoffins.map((h, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid ' + T.borderLight, background: T.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{h.itemName || h.item_key}</div>
              <div style={{ fontSize: 10, color: T.textSec }}>Qty: {h.qty || 1} · By: {h.pickedBy || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

`;
c = c.split(renderJournalStart).join(newSidebar + renderJournalStart);

if (usesCRLF) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c);
console.log('Done');
