  function renderAviationDispatchModal() {
    const selItem = items.find(it => it.key === dispatchForm.selectedCoffinKey);
    return (
      <>
      <style>{`@keyframes storeDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000 }} onClick={() => setShowDispatchModal(false)}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(640px, 98vw)', background: T.surface, boxShadow: '-14px 0 44px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', animation: 'storeDrawerIn .28s ease-out' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><i className="fas fa-truck-fast" style={{ color: T.danger, marginRight: 8 }} />Dispatch Coffin</div>
            <button onClick={() => setShowDispatchModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dispatchStep === s ? 1 : dispatchStep > s ? 0.8 : 0.45 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: dispatchStep >= s ? T.primary : T.bg, color: dispatchStep >= s ? '#fff' : T.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    {dispatchStep > s ? <i className="fas fa-check" style={{ fontSize: 9 }} /> : s}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: dispatchStep === s ? T.text : T.textSec }}>{s === 1 ? 'Select Coffin' : 'Dispatch Details'}</span>
                  {s === 1 && <i className="fas fa-chevron-right" style={{ fontSize: 10, color: T.textMuted }} />}
                </div>
              ))}
            </div>

            {dispatchStep === 1 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.textSec }}>{readyCoffins.length} coffin(s) in store</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, minHeight: 340, padding: 6, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg }}>
                  {readyCoffins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 28, fontSize: 13, color: T.textMuted }}>
                      <i className="fas fa-warehouse" style={{ fontSize: 32, opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                      No coffins available to dispatch.
                    </div>
                  ) : readyCoffins.map(it => {
                    const sel = dispatchForm.selectedCoffinKey === it.key;
                    return (
                      <label key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${sel ? T.primary : T.borderLight}`, background: sel ? T.primaryBg : T.surface, cursor: 'pointer', boxShadow: sel ? `0 0 0 2px ${T.primary}15` : 'none', transition: 'all .15s' }}>
                        <input type="radio" name="dispatch-coffin" checked={sel} onChange={() => setSelectedCoffin(it.key)} style={{ accentColor: T.primary, width: 18, height: 18 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{it.name}</div>
                          <div style={{ fontSize: 11, color: T.textSec }}>{it.sub} · Available: {effQty(it)} {it.unit}{it.assignedToName ? ' · Assigned: ' + it.assignedToName : ''}</div>
                        </div>
                        <button type="button" onClick={(e) => { e.preventDefault(); openAssignWorker(it); }} style={{ ...primaryBtn(T.warningBg, T.warning), padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap' }}>
                          <i className="fas fa-user-plus" style={{ fontSize: 10 }} /> Assign
                        </button>
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowDispatchModal(false)} style={primaryBtn(T.bg, T.textSec)}>Cancel</button>
                  <button onClick={() => dispatchForm.selectedCoffinKey ? setDispatchStep(2) : addToast('Select a coffin first', 'error')} disabled={!dispatchForm.selectedCoffinKey} style={{ ...primaryBtn(T.danger, '#fff'), opacity: dispatchForm.selectedCoffinKey ? 1 : 0.5, cursor: dispatchForm.selectedCoffinKey ? 'pointer' : 'not-allowed' }}>
                    Next <i className="fas fa-arrow-right" style={{ fontSize: 11, marginLeft: 6 }} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {selItem && (
                  <div style={{ background: T.dangerBg, border: `1px solid ${T.danger}30`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{selItem.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{selItem.sub} · Available: {effQty(selItem)} {selItem.unit}{selItem.assignedToName ? ' · Assigned to: ' + selItem.assignedToName : ''}</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <label style={labelS}>Quantity to Dispatch</label>
                    <input type="number" min={1} max={selItem ? effQty(selItem) : 1} value={dispatchForm.qty} onChange={setDF('qty')} style={inputS} />
                  </div>
                  <div>
                    <label style={labelS}>Date Dispatched</label>
                    <input type="date" value={dispatchForm.date} onChange={setDF('date')} style={inputS} />
                  </div>
                  <div>
                    <label style={labelS}>Dispatched By</label>
                    <input list="store-pickers" placeholder="Name of person picking up" value={dispatchForm.dispatchedBy} onChange={setDF('dispatchedBy')} style={inputS} />
                    <datalist id="store-pickers">{workers.map(w => <option key={w.id} value={w.name} />)}</datalist>
                  </div>
                  <div>
                    <label style={{ ...labelS, color: T.danger }}>Received By *</label>
                    <input value={dispatchForm.receivedBy} onChange={setDF('receivedBy')} style={inputS} placeholder="Name (required)" />
                  </div>
                  <div>
                    <label style={labelS}>Driver</label>
                    <input value={dispatchForm.driver} onChange={setDF('driver')} style={inputS} placeholder="Driver Name" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelS}>Destination</label>
                    <input value={dispatchForm.destination} onChange={setDF('destination')} style={inputS} placeholder="Destination" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelS}>Purpose</label>
                    <input value={dispatchForm.purpose} onChange={setDF('purpose')} style={inputS} placeholder="Purpose of dispatch" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelS}>Remarks</label>
                    <textarea value={dispatchForm.remarks} onChange={setDF('remarks')} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} placeholder="Additional notes" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button onClick={() => setDispatchStep(1)} style={primaryBtn(T.bg, T.textSec)}><i className="fas fa-arrow-left" style={{ fontSize: 11, marginRight: 6 }} />Back</button>
                  <button onClick={submitAviationDispatch} disabled={loading} style={{ ...primaryBtn(T.danger, '#fff'), opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-truck-fast" style={{ fontSize: 12 }} /> {loading ? 'Dispatching...' : 'Dispatch Coffin'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }
