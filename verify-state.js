// One-shot state dump so all edits can be made in a single batch afterwards.
const fs = require('fs');
const dir = 'c:/Users/User/Downloads/restpoint';
const SEP = '='.repeat(70);

// ── A. Files already referencing reference_code / LRQ ──
const hits = [];
(function walk(d) {
  for (const it of fs.readdirSync(d, { withFileTypes: true })) {
    if (it.name === 'node_modules' || it.name === '.git' || it.name === 'dist') continue;
    const f = d + '/' + it.name;
    if (it.isDirectory()) walk(f);
    else if (/\.(js|jsx|ts|tsx)$/.test(it.name)) {
      const c = fs.readFileSync(f, 'utf8');
      if (/reference_code|referenceCode|LRQ-/.test(c)) hits.push(f.replace(/\\/g, '/').replace(dir, ''));
    }
  }
})(dir);
console.log(SEP + '\nA. FILES WITH reference_code/LRQ:\n' + (hits.length ? hits.join('\n') : '(none)'));

const show = (path, from, to, tag) => {
  const L = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  console.log('\n' + SEP + '\n' + tag + '  (total ' + L.length + ' lines)');
  for (let i = Math.max(0, from - 1); i < Math.min(to, L.length); i++) console.log((i + 1) + '| ' + L[i]);
};

const LC = dir + '/services/leave-service/leaveController.js';
const LCc = fs.readFileSync(LC, 'utf8').split(/\r?\n/);

show(LC, 1, 33, 'B. leaveController.js head/requires');

const idx = LCc.findIndex(l => l.includes('INSERT INTO leave_requests'));
console.log('\n' + SEP + '\nD. applyForLeave INSERT context (INSERT at line ' + (idx + 1) + ')');
if (idx >= 0) for (let i = Math.max(0, idx - 32); i < Math.min(LCc.length, idx + 42); i++) console.log((i + 1) + '| ' + LCc[i]);
else console.log('NOT FOUND');

const sel = [];
LCc.forEach((l, i) => { if (l.includes('FROM leave_requests')) sel.push(i); });
console.log('\n' + SEP + '\nE. All "FROM leave_requests" occurrences:');
for (const s of sel) {
  console.log('--- around line ' + (s + 1) + ' ---');
  for (let i = Math.max(0, s - 6); i <= Math.min(LCc.length - 1, s + 4); i++) console.log((i + 1) + '| ' + LCc[i]);
}

const a = LCc.findIndex(l => l.includes('const addEmployee'));
console.log('\n' + SEP + '\nF. addEmployee head (starts line ' + (a + 1) + ')');
if (a >= 0) for (let i = a; i < Math.min(LCc.length, a + 62); i++) console.log((i + 1) + '| ' + LCc[i]);
else console.log('NOT FOUND');

show(dir + '/services/leave-service/migrate-tenant-tables.js', 11, 64, 'G. migrate-tenant-tables.js schema');
show(dir + '/shared/services/all-service-migrations.ts', 311, 354, 'H. all-service-migrations.ts leave block');

// ── Frontend ──
const FE = dir + '/FrontendClient/client/src/components/leave';

const M = fs.readFileSync(FE + '/MyLeaves.jsx', 'utf8').split(/\r?\n/);
let i = M.findIndex(l => l.includes('<LeaveCard'));
console.log('\n' + SEP + '\nI. MyLeaves.jsx LeaveCard render (line ' + (i + 1) + ')');
if (i >= 0) for (let k = Math.max(0, i - 12); k < Math.min(M.length, i + 32); k++) console.log((k + 1) + '| ' + M[k]);
else console.log('NOT FOUND');

const A = fs.readFileSync(FE + '/ApplyLeave.jsx', 'utf8').split(/\r?\n/);
const sIdx = A.findIndex(l => l.includes('LEAVE.APPLY'));
console.log('\n' + SEP + '\nJ. ApplyLeave.jsx submit context (LEAVE.APPLY at line ' + (sIdx + 1) + ')');
if (sIdx >= 0) for (let k = Math.max(0, sIdx - 24); k < Math.min(A.length, sIdx + 34); k++) console.log((k + 1) + '| ' + A[k]);
else console.log('NOT FOUND');

const Al = fs.readFileSync(FE + '/AllLeaves.jsx', 'utf8').split(/\r?\n/);
let rIdx = Al.findIndex(l => /leaves\.map|\.map\(l/.test(l));
if (rIdx === -1) rIdx = Al.findIndex(l => /tbody|<tr|LeaveRow/.test(l));
console.log('\n' + SEP + '\nK. AllLeaves.jsx row render (map at line ' + (rIdx + 1) + ')');
if (rIdx >= 0) for (let k = Math.max(0, rIdx - 12); k < Math.min(Al.length, rIdx + 48); k++) console.log((k + 1) + '| ' + Al[k]);
else console.log('NOT FOUND');
