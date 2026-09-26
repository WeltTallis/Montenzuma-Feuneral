// Dev-only diagnostic: report, for every [...dateFilter.params] call site in an
// analytics controller, whether the enclosing query actually uses ${dateFilter.sql}.
const fs = require('fs');
const path = require('path');

const targets = process.argv.slice(2);
for (const p of targets) {
  const L = fs.readFileSync(p, 'utf8').split('\n');
  console.log('=== ' + path.basename(p) + ' ===');
  for (let i = 0; i < L.length; i++) {
    if (!L[i].includes('...dateFilter.params')) continue;
    // Walk back to the opening call.
    let start = i;
    while (start >= 0 && !/safeTenant(Query|Execute)\(/.test(L[start])) start--;
    const usesFilter = L.slice(start, i + 1).some((l) => l.includes('dateFilter.sql'));
    const q = L[start].trim().slice(0, 46);
    console.log(
      '  line ' + String(i + 1).padStart(4) +
      '  usesFilter=' + String(usesFilter).padEnd(6) + ' ' + q
    );
  }
}
