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
const viRegex = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;
const set = new Set();
for (const f of files) {
  const c = fs.readFileSync(f,'utf8');
  // match single/double/backtick strings
  const re = /'([^'\n]*?)'|"([^"\n]*?)"|`([^`\n]*?)`/g;
  let m;
  while ((m = re.exec(c)) !== null) {
    const s = m[1] || m[2] || m[3];
    if (viRegex.test(s)) set.add(s.trim());
  }
}
const arr = [...set].sort();
fs.writeFileSync('uniq.txt', arr.join('\n'));
console.log('unique strings', arr.length);
