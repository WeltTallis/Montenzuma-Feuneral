const fs = require('fs');
const p = 'src/components/leave/Dashboard.jsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');
console.log('TOTAL LINES:', lines.length);
for (let n = 2316; n <= 2358; n++) {
  console.log(n + '|' + JSON.stringify(lines[n - 1]));
}
console.log('--- scanning for stray trailing dots on JSX-close lines ---');
for (let i = 0; i < lines.length; i++) {
  const t = lines[i];
  if (/[\s)]\.\s*$/.test(t) && /\}|[\)\}]\s*$/.test(t)) {
    // print lines ending with a dot right after braces/parens
  }
  if (/\)}\.\s*$/.test(t) || /\)\}\}\.\s*$/.test(t)) {
    console.log('DOT-LINE', (i + 1), JSON.stringify(t));
  }
}
