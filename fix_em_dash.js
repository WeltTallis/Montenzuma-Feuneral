const fs = require('fs');
const p = 'FrontendClient/client/src/components/releaseform/ReleaseFormPage.jsx';
let s = fs.readFileSync(p, 'utf8');
const target = "|| '\u00EF\u00BF\u00BD')";
const replacement = "|| '\u2014')";
const idx = s.indexOf(target);
if (idx !== -1) {
  s = s.replace(target, replacement);
  fs.writeFileSync(p, s, 'utf8');
  console.log('Fixed corrupted em dash on line: ' + s.slice(0, idx).split('\n').length);
} else {
  console.log('Corrupted target NOT found. Checking raw...');
  // check if a proper em dash already exists
  const ok = "|| '\u2014')";
  if (s.includes(ok)) { console.log('Em dash already correct.'); }
  else { console.log('Searching for any mojibake patterns...'); }
}