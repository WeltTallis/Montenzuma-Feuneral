const fs = require('fs');
const p = 'src/components/leave/Dashboard.jsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');

function dump(from, to) {
  console.log('--- lines ' + from + '..' + to + ' ---');
  for (let n = from; n <= to; n++) {
    console.log(n + '|' + JSON.stringify(lines[n - 1]));
  }
}

dump(2155, 2175);   // showEmployees close + showHistory open
dump(2300, 2360);   // showHistory tail + showCalendar open

console.log('--- section open/close scan ---');
for (let i = 0; i < lines.length; i++) {
  const t = lines[i];
  if (/^\s*\{show[A-Za-z]+ && \(/.test(t)) {
    console.log('OPEN line', i + 1, JSON.stringify(t));
  }
  // a line that is just a closer )} at 10-12 space indent
  if (/^\s{10,14}\}\)\s*$/.test(t)) {
    console.log('CLOSE line', i + 1, JSON.stringify(t));
  }
}
