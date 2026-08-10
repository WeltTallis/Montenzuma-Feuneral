const fs = require('fs');
const path = require('path');

const p = path.join('c:\\Users\\User\\Downloads\\restpoint\\FrontendClient\\client\\src\\components\\analysis', 'comprehensivedashboard.jsx');
const c = fs.readFileSync(p, 'utf8');

const oldText = `          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <LiveHearseOperations />
            </section>
            <div className="dash-grid dash-grid--2-sm">
              <section className="dash-card">
                <BranchPerformance />
              </section>
              <section className="dash-card">
                <CoffinInventory />
              </section>
            </div>
          </div>`;

const newText = `          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <BranchPerformance />
            </section>
            <section className="dash-card">
              <CoffinInventory />
            </section>
          </div>

          <section className="dashboard-section">
            <div className="dash-card dash-card--flush">
              <LiveHearseOperations />
            </div>
          </section>`;

if (!c.includes(oldText)) {
  console.log('OLD TEXT NOT FOUND');
  const idx = c.indexOf('LiveHearseOperations');
  console.log(c.substring(idx - 100, idx + 300));
  process.exit(1);
}

const updated = c.replace(oldText, newText);
fs.writeFileSync(p, updated, 'utf8');
console.log('Updated successfully');
