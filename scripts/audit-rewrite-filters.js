// Dev-only codemod: replace the SQLi-prone filter fragments in the analytics
// controllers with the bound FilterBuilder output.
const fs = require('fs');
const path = require('path');

const D = '${';
const REPLACEMENTS = [
  [`${D}dateFilter} ${D}branchFilter} ${D}statusFilter} ${D}searchFilter}`, `${D}dateSql} ${D}filters.sql}`],
  [`${D}dateFilter} ${D}statusFilter} ${D}searchFilter}`, `${D}dateSql} ${D}filters.sql}`],
  [`${D}branchFilter} ${D}statusFilter} ${D}searchFilter}`, `${D}filters.sql}`],
  [`${D}branchFilter} ${D}statusFilter}`, `${D}filters.sql}`],
  [`${D}dateFilter}`, `${D}dateSql}`],
  // florist-style aliases
  [`${D}dateFilter} ${D}statusFilter} ${D}searchFilter}`, `${D}dateSql} ${D}filters.sql}`],
];

for (const p of process.argv.slice(2)) {
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  for (const [from, to] of REPLACEMENTS) s = s.split(from).join(to);

  // Any remaining bare ${branchFilter}/${statusFilter}/${searchFilter}
  s = s.split(`${D}branchFilter}`).join(`${D}filters.sql}`);
  s = s.split(`${D}statusFilter}`).join(`${D}filters.sql}`);
  s = s.split(`${D}searchFilter}`).join(`${D}filters.sql}`);

  fs.writeFileSync(p, s);
  const left = (s.match(/branchFilter}|statusFilter}|searchFilter}|dateFilter}/g) || []).length;
  console.log(
    path.basename(p).padEnd(36),
    'changed=' + String(before !== s).padEnd(6),
    'leftoverFragments=' + left
  );
}
