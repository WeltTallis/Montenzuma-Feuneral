const fs = require('fs');
const p = 'FrontendClient/client/src/components/coffins/coffininventory.jsx';
let c = fs.readFileSync(p, 'utf8');
const block = fs.readFileSync('C:/Users/User/Downloads/restpoint/tmp_newblock.txt', 'utf8');
const pos = 75916;
fs.writeFileSync(p, c.slice(0, pos) + block + c.slice(pos));
console.log('inserted new block');
