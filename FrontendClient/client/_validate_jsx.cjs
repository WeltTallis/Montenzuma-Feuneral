const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/dashboard/CoffinStoreTracker.jsx'],
  loader: { '.jsx': 'jsx' },
  write: false,
});
console.log('SYNTAX OK: CoffinStoreTracker.jsx parses cleanly');
