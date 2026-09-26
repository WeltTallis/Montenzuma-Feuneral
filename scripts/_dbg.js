'use strict';
const fs = require('fs');
const file = process.argv[2];
const src = fs.readFileSync(file, 'utf8');
const TICK = String.fromCharCode(96);

console.log('file length:', src.length);
console.log('contains "safeTenantQuery(":', src.indexOf('safeTenantQuery(') > -1);
console.log('backtick count:', src.split(TICK).length - 1);

let n = 0;
let i = -1;
while ((i = src.indexOf('safeTenantQuery(', i + 1)) > -1) {
  n += 1;
  if (n <= 5) {
    console.log('#' + n, JSON.stringify(src.substr(i, 50)));
  }
}
console.log('occurrences:', n);
