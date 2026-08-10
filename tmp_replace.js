const fs = require('fs');
const path = 'FrontendClient/client/src/components/coffins/coffininventory.jsx';
let c = fs.readFileSync(path, 'utf8');
const start = '    // Normalize service_date into';
const end = '        ) : (';
const i = c.indexOf(start);
const j = c.indexOf(end, i);
console.log('start', i, 'end', j);
if (i >= 0 && j >= 0) {
  const before = c.slice(0, i);
  const after = c.slice(j);
  fs.writeFileSync(path, before + after);
  console.log('removed old block');
}
