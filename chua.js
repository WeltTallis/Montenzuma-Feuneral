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
const re = /Chưa tải được|tải được|Kiểm tra kết nối|Đang tải/g;
let n = 0;
const out = [];
for (const f of files) {
  const c = fs.readFileSync(f,'utf8');
  const m = c.match(re);
  if (m) { n++; out.push(f + ' :: ' + [...new Set(m)].join(', ')); }
}
fs.writeFileSync('chua.txt', out.join('\n') + '\nfiles ' + n);
console.log('files', n);
