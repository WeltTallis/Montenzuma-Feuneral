var fs = require('fs');
var src = fs.readFileSync('Makefile', 'utf8');
var lines = src.split('\n');
// Remove the scanner-service line (0-indexed 31) from RAW_BUILD_SERVICES
var hit = -1;
for (var i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('scanner-service') !== -1) {
    hit = i;
    break;
  }
}
if (hit === -1) {
  console.log('scanner-service line NOT FOUND');
  process.exit(1);
}
console.log('removing line ' + (hit + 1) + ': ' + JSON.stringify(lines[hit]));
lines.splice(hit, 1);
fs.writeFileSync('Makefile', lines.join('\n'), 'utf8');
console.log('done; new line count = ' + lines.length);
