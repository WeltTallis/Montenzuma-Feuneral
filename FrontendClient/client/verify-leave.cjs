const fs = require('fs');
const { transformSync } = require('esbuild');
const { bundleSync } = require('esbuild');
const out = [];
const files = [
  'src/components/leave/Dashboard.jsx',
  'src/components/leave/LeaveCalendar.jsx',
];
let ok = true;
for (const f of files) {
  try {
    const res = transformSync(fs.readFileSync(f, 'utf8'), { loader: 'jsx', sourcefile: f });
    out.push('PARSE OK: ' + f + ' (out ' + res.code.length + ' chars)');
  } catch (e) {
    ok = false;
    out.push('PARSE FAIL: ' + f);
    out.push('MSG: ' + (e && e.message ? e.message : String(e)));
    if (e && e.errors) out.push('DETAILS: ' + JSON.stringify(e.errors));
  }
}
fs.writeFileSync('verify-result.txt', out.join('\n'));
process.exit(ok ? 0 : 1);
