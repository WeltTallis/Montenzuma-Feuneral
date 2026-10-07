// Reproduce ORIGINAL logic (without /workshop, /mini-store, /store) to compare
const ORIG = ['/deceased/register','/release-form','/driver-portal','/dashboard','/analytics','/receptionist','/flower-samples','/flowers'];
const NEW  = [...ORIG, '/workshop','/mini-store','/store'];

const toTenantRelative = (pathname, HIDDEN) => {
  const clean = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/';
  const legacy = clean.replace(/^\/tenant\/[^/]+/, '');
  if (legacy !== clean) return legacy || '/';
  const segments = clean.split('/').filter(Boolean);
  if (segments.length > 1) {
    const rest = `/${segments.slice(1).join('/')}`;
    if (HIDDEN.some((r) => rest === r || rest.startsWith(`${r}/`))) return rest;
  }
  return clean;
};
const show = (p, HIDDEN) => {
  const rp = toTenantRelative(p, HIDDEN);
  return !HIDDEN.some((r) => rp === r || rp.startsWith(`${r}/`));
};

console.log('=== ORIGINAL hidden-route list ===');
for (const p of ['/dashboard/all-deceased','/dashboard','/flowers/all-deceased']) {
  console.log(`  show=${show(p, ORIG)}  ${p}`);
}
console.log('=== NEW hidden-route list ===');
for (const p of ['/dashboard/all-deceased','/workshop/all-deceased','/mini-store/all-deceased','/store/all-deceased','/acme/workshop','/acme/store']) {
  console.log(`  show=${show(p, NEW)}  ${p}`);
}
