// Temporary smoke test — deleted right after it runs.
const mod = await import('./services/store-service/routes/storeRoutes.ts');
const r = mod.default;
console.log('ROUTES OK — default export type:', typeof r);
console.log('router stack registered:', typeof r?.stack === 'object' && r.stack.length > 0, `(${r?.stack?.length} layers)`);
process.exit(0);
