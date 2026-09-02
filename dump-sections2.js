const fs = require('fs');
const L = (p, a, b) => {
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  console.log('=== ' + p + ' [' + a + '-' + b + '] ===');
  for (let i = a - 1; i < Math.min(b, lines.length); i++) console.log((i + 1) + '|' + lines[i]);
};
const C = 'c:/Users/User/Downloads/restpoint';
const ctrl = C + '/services/leave-service/leaveController.js';
const mig = C + '/shared/services/all-service-migrations.js';

// 1. Find function spans in controller
const cl = fs.readFileSync(ctrl, 'utf8').split('\n');
const starts = [];
cl.forEach((l, i) => {
  if (/(applyForLeave|addEmployee|getMyLeaves|getAllLeaves)\s*=\s*async|^async function (applyForLeave|addEmployee|getMyLeaves|getAllLeaves)/.test(l)) {
    starts.push({ name: l.trim().slice(0, 60), line: i + 1 });
  }
});
console.log('FUNCTION STARTS:', JSON.stringify(starts, null, 1));
for (const s of starts) L(ctrl, s.line, s.line + 3);

// 2. grep tokens in controller
console.log('\n=== controller grep ===');
cl.forEach((l, i) => { if (/reference|LRQ|randomUUID|crypto|INSERT INTO leave_requests/i.test(l)) console.log((i + 1) + '|' + l.trim().slice(0, 120)); });

// 3. migrations leave section
const ml = fs.readFileSync(mig, 'utf8').split('\n');
console.log('\n=== migrations grep ===');
ml.forEach((l, i) => { if (/leave_requests|leave_day_additions|holiday_compensations/.test(l)) console.log((i + 1) + '|' + l.trim().slice(0, 130)); });

// 4. Frontend render spots
const F = C + '/FrontendClient/client/src/components/leave';
for (const f of ['AllLeaves.jsx', 'MyLeaves.jsx', 'ApplyLeave.jsx']) {
  const fl = fs.readFileSync(F + '/' + f, 'utf8').split('\n');
  console.log('\n=== ' + f + ' ===');
  fl.forEach((l, i) => { if (/leaves\.map|leave\.id|setLeaves|reference|LRQ|response\.data\.data|toast|Success/i.test(l)) console.log((i + 1) + '|' + l.trim().slice(0, 120)); });
}
