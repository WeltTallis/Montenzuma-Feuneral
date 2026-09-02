const fs = require('fs');
const LC = 'c:/Users/User/Downloads/restpoint/services/leave-service/leaveController.js';
const lines = fs.readFileSync(LC, 'utf8').split('\n');
const lc = lines;
function dump(arr, from, to, label) {
  console.log('=== ' + label + ' ===');
  for (let i = from; i <= to && i < arr.length; i++) console.log((i + 1) + '|' + arr[i]);
}
// Find key markers in controller
lc.forEach((l, i) => {
  if (/applyForLeave|INSERT INTO leave_requests|const getMyLeaves|reference|LRQ|ref_code|const addEmployee|crypto|randomUUID/.test(l)) {
    console.log('MARKER ' + (i + 1) + '| ' + l.trim().slice(0, 120));
  }
});
