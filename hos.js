const fs = require('fs');
function walk(d, r=[]) {
  if (!fs.existsSync(d)) return r;
  for (const f of fs.readdirSync(d, {withFileTypes:true})) {
    const p = d + '/' + f.name;
    if (f.isDirectory()) {
      if (['node_modules','.git','dist','build'].includes(f.name)) continue;
      walk(p, r);
    } else if (/\.(tsx?|jsx?)$/.test(f.name)) r.push(p);
  }
  return r;
}
const files = walk('FrontendClient/client/src/hr-payroll');
const out = [];
for (const f of files) {
  const c = fs.readFileSync(f,'utf8');
  const lines = c.split('\n');
  for (let i=0;i<lines.length;i++) {
    if (lines[i].includes('hồ sơ') || lines[i].includes('Hồ sơ')) out.push(f+':'+(i+1)+':'+lines[i].trim());
  }
}
fs.writeFileSync('hos.txt', out.join('\n'));
console.log('lines', out.length);
