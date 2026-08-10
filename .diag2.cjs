const fs = require('fs');
const path = require('path');
const root = 'c:\\Users\\User\\Downloads\\restpoint';
const f = path.join(root, 'FrontendClient/client/src/components/analysis/comprehensivedashboard.jsx');
const bak = f + '.bak';
const terms = ['function lineOpts', 'function HrR2', 'function HrR1', 'DECEASED CHARTS', 'export default ComprehensiveDashboard', 'branch: b.branch_name'];

function report(name, content) {
  const lines = content.split('\n');
  console.log(name, 'lines:', lines.length);
  terms.forEach(t => console.log('   ', t, '=>', content.includes(t)));
}

try { report('WORKING', fs.readFileSync(f, 'utf8')); } catch (e) { console.log('WORKING read error:', e.message); }
try { report('BAK   ', fs.readFileSync(bak, 'utf8')); } catch (e) { console.log('BAK read error:', e.message); }

// HEAD version
const { execSync } = require('child_process');
try {
  const head = execSync('git show HEAD:"FrontendClient/client/src/components/analysis/comprehensivedashboard.jsx"', { cwd: root, encoding: 'utf8' });
  report('HEAD   ', head);
} catch (e) { console.log('HEAD read error:', e.message); }
