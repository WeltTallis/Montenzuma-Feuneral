// What does `require('express-rate-limit')` actually return (root, v8.6.2),
// resolved from services/api-gateway like server.js does? server.js does
// `const rateLimit = require('express-rate-limit')` then calls `rateLimit({...})`.
// If 8.6.2 returns { rateLimit } (named) instead of a function, server.js breaks
// even when the package IS present — which determines whether the fix is
// "hoist 8.6.2 to root" or "nest 7.5.1 under services/api-gateway".
const loc = 'c:/Users/User/Downloads/restpoint/services/api-gateway';
const root = 'c:/Users/User/Downloads/restpoint';
process.chdir(loc);
function probe(label, dir) {
  process.chdir(dir);
  try {
    const m = require('express-rate-limit');
    console.log(`[${label}] typeof default:`, typeof m);
    console.log(`[${label}] keys:`, Object.keys(m));
    console.log(`[${label}] m.rateLimit is function:`, typeof m.rateLimit === 'function');
    console.log(`[${label}] typeof m === 'function':`, typeof m === 'function');
    console.log(`[${label}] version:`, require('express-rate-limit/package.json').version);
  } catch (e) {
    console.log(`[${label}] ERROR:`, e.code || e.message);
  }
}
probe('from services/api-gateway (server.js context)', loc);
probe('from repo root', root);
