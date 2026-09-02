const fs = require('fs');
const p = require('path');
function walk(d) {
  let r = [];
  for (const it of fs.readdirSync(d, { withFileTypes: true })) {
    const f = p.join(d, it.name);
    if (it.isDirectory()) {
      if (f.includes('node_modules')) continue;
      r = r.concat(walk(f));
    } else {
      r.push(f);
    }
  }
  return r;
}
const all = walk('c:\\Users\\User\\Downloads\\restpoint\\FrontendClient\\client\\src');
const leave = all.filter(x => x.toLowerCase().includes('leave'));
console.log(leave.join('\n'));
