import fs from 'node:fs';
const l = JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const pkgs = l.packages || {};
console.log('=== crypto-js entries ===');
for (const [k,v] of Object.entries(pkgs)) {
  if (k.includes('crypto-js') && !k.includes('FrontendClient')) console.log(k, '→', v.version);
}
console.log('\n=== pdfkit entries ===');
for (const [k,v] of Object.entries(pkgs)) {
  if (k.includes('/pdfkit') && !k.includes('FrontendClient')) console.log(k, '→', v.version);
}
