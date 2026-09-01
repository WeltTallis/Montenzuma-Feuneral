const fs = require('fs');
const f = 'src/modules/landing/LandingPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Replace stat tiles -> glass-morphism cards
let s1 = c.indexOf("                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>\n                            <div style={{ display: 'flex', flexDirection: 'column' }}");
let e1 = c.indexOf("                          </div>\n                      </div>\n                      <div style={{ borderTop:");
if (s1 > 0 && e1 > 0) {
  let oldStat = c.substring(s1, e1);
  let newStat = `                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.8rem 1.1rem', minWidth: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <span style={{ fontSize: '2rem', fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.bone, lineHeight: 1 }}>24</span>
                              <span style={{ color: C.grayLight, fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>ACTIVE CASES</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.8rem 1.1rem', minWidth: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <span style={{ fontSize: '2rem', fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.bone, lineHeight: 1 }}>84K</span>
                              <span style={{ color: C.grayLight, fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>PENDING BILL</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.8rem 1.1rem', minWidth: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <span style={{ fontSize: '2rem', fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.bone, lineHeight: 1 }}>7</span>
                              <span style={{ color: C.grayLight, fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>NEW TODAY</span>
                            </div>
                          </div>`;
  c = c.replace(oldStat, newStat);
  console.log('OK: stat tiles replaced');
} else { console.log('SKIP: stat tiles'); }

// 2. Replace case rows
let s2 = c.indexOf("                        {[{ name: 'Otieno Family'");
let e2 = c.indexOf("                          ))}") + 10;
if (s2 > 0 && e2 > 0) {
  let oldRows = c.substring(s2, e2);
  let newRows = `                        {[{ name: 'Otieno Family', status: 'In Progress', dot: C.verdigrisLight }, { name: 'Mwangi Family', status: 'Documents Pending', dot: C.brass }, { name: 'Kamau Family', status: 'KES 120,000', dot: C.accent }].map((item, i) => (
                          <div
                            key={i}
                            className="glass-row"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.85rem 1rem',
                              marginBottom: i < 2 ? '0.5rem' : '0',
                              borderRadius: '8px',
                              background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.04)',
                              fontSize: '0.85rem',
                              color: C.grayLight,
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: C.bone, fontWeight: 500 }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, display: 'inline-block', boxShadow: \`0 0 6px \${item.dot}\` }} />
                              {item.name}
                            </span>
                            <span style={{ color: C.brass, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{item.status}</span>
                          </div>
                        ))}`;
  c = c.replace(oldRows, newRows);
  console.log('OK: case rows replaced');
} else { console.log('SKIP: case rows'); }

// 3. Fix closing tags for the 2 extra wrapper divs added
let syncPos = c.indexOf("                    Live Sync\n                  </div>");
if (syncPos > 0) {
  let oldClose = "                    Live Sync\n                  </div>\n                </div>\n              </div>\n            </div>";
  let newClose = "                    Live Sync\n                  </div>\n                  </div>\n                </div>\n              </div>\n            </div>";
  if (c.includes(oldClose)) {
    c = c.replace(oldClose, newClose);
    console.log('OK: closing tags fixed');
  } else {
    console.log('SKIP: closing tags');
  }
}

fs.writeFileSync(f, c);
console.log('DONE');