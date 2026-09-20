const fs = require('fs');
const { transformSync } = require('esbuild');
const files = [
  'src/components/leave/Dashboard.jsx',
  'src/components/leave/LeaveCalendar.jsx',
];
let ok = true;
for (const f of files) {
  try {
    transformSync(fs.readFileSync(f, 'utf8'), { loader: 'jsx' });
    console.log('PARSE OK:', f);
  } catch (e) {
    ok = false;
    console.error('PARSE FAIL:', f);
    console.error('MSG:', e && e.message ? e.message : String(e));
    if (e && e.errors) console.error('DETAILS:', JSON.stringify(e.errors));
  }
}
process.exit(ok ? 0 : 1);
