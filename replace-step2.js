const fs = require('fs');
const f = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(f, 'utf8');

const marker = '                  {/* Dispatch Details Form */}';
const marker2 = '                  <div style={{ display: \'grid\', gridTemplateColumns: \'repeat(2, 1fr)\', gap: 12 }}>';
let idx = c.indexOf(marker);
if (idx === -1) { idx = c.indexOf(marker2); }
if (idx === -1) { console.log('marker not found'); process.exit(1); }

const before = c.substring(0, idx);
const after = c.substring(idx);

const newBlock = `                  {/* COFINs TO DISPATCH */}
                  <div style={{ background: T.bg, border: \`1px solid ${T.borderLight}\`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-boxes-stacked" style={{ color: T.danger }} /> COFINs TO DISPATCH
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dispatchCart.map(c => (
                        <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: \`1px solid ${T.borderLight}\`, background: T.surface }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: T.textSec }}>{c.sub}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.danger }}>{c.qty} {c.unit}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', borderTop: \`2px solid ${T.bdr}\` }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Total COFINs</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: T.danger }}>{cartTotalUnits} units</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ background: T.successBg, border: \`1px solid ${T.success}30\`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec }}>Status</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.success, background: T.successBg, padding: '4px 12px', borderRadius: 6 }}>Ready</span>
                  </div>

                  {/* Dispatch Details Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div>
                      <label style={labelS}>Dispatched By</label>
                      <input list="store-pickers" placeholder="Name of person dispatching" value={dispatchForm.dispatchedBy} onChange={setDF('dispatchedBy')} style={inputS} />
                      <datalist id="store-pickers">{workers.map(w => <option key={w.id} value={w.name} />)}</datalist>
                    </div>
                    <div>
                      <label style={{ ...labelS, color: T.danger }}>Received By *</label>
                      <input value={dispatchForm.receivedBy} onChange={setDF('receivedBy')} style={inputS} placeholder="Name (required)" />
                    </div>
                    <div>
                      <label style={labelS}>Destination *</label>
                      <input value={dispatchForm.destination} onChange={setDF('destination')} style={inputS} placeholder="Destination" />
                    </div>
                    <div>
                      <label style={labelS}>Driver</label>
                      <input value={dispatchForm.driver} onChange={setDF('driver')} style={inputS} placeholder="Driver Name" />
                    </div>
                    <div>
                      <label style={labelS}>Purpose</label>
                      <input value={dispatchForm.purpose} onChange={setDF('purpose')} style={inputS} placeholder="Purpose of dispatch" />
                    </div>
                    <div>
                      <label style={labelS}>Remarks</label>
                      <textarea value={dispatchForm.remarks} onChange={setDF('remarks')} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} placeholder="Additional notes" />
                    </div>
                  </div>`;

c = before + newBlock + after;
fs.writeFileSync(f, c);
console.log('Done');
