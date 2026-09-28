/* Exercises the REAL applyTenantIdentity with a stubbed signed identity. */
const path = require('path');
const fs = require('fs');
const Module = require('module');

const TENANT = 'montenzuma-monalisa-feuneral-home';
const B = {};
['nairobi', 'machakos', 'thika'].forEach((b) => { B[b] = TENANT + '-' + b; });
const RIVAL = 'other-funeral-home-machakos';

function loadGateway(role, sessionBranch) {
  const gwPath = path.resolve('services/api-gateway/tenantIdentity.js');
  const m = new Module(gwPath);
  m.filename = gwPath;
  m.paths = Module._nodeModulePaths(path.dirname(gwPath));
  m.require = function (r) {
    if (r === 'jsonwebtoken') {
      return {
        verify: function () {
          return {
            tenantSlug: TENANT,
            tenantId: 7,
            userId: 42,
            role: role,
            branchSlug: sessionBranch ? sessionBranch.split('-').pop() : undefined,
            branchDbName: sessionBranch,
          };
        },
      };
    }
    return require(r);
  };
  m._compile(fs.readFileSync(gwPath, 'utf8'), gwPath);
  return m.exports;
}

function ask(role, sessionBranch, askBranch) {
  const { applyTenantIdentity } = loadGateway(role, sessionBranch);
  const sent = {};
  const proxyReq = {
    setHeader: function (k, v) { sent[k] = v; },
    removeHeader: function (k) { delete sent[k]; },
  };
  const headers = { 'x-tenant-slug': askBranch, 'x-branch-slug': askBranch, 'x-branch-db': askBranch };
  const req = { method: 'GET', originalUrl: '/api/v1/restpoint/deceased/deceased-all', headers, cookies: {} };
  applyTenantIdentity(proxyReq, req, { warn: function () {}, debug: function () {}, error: function () {} });
  return sent['x-branch-db'];
}

let fails = 0;
function show(label, got, want) {
  const g = got ? String(got).replace(TENANT + '-', '') : '(none)';
  const ok = g === want;
  if (!ok) fails += 1;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + label.padEnd(46) + '-> ' + g);
}

console.log('Dashboard fan-out — admin signed in at nairobi:');
show('asks nairobi', ask('admin', B.nairobi, B.nairobi), 'nairobi');
show('asks machakos', ask('admin', B.nairobi, B.machakos), 'machakos');
show('asks thika', ask('admin', B.nairobi, B.thika), 'thika');

console.log('\nIsolation — must stay pinned unless admin/manager:');
show('staff asks sibling branch', ask('staff', B.nairobi, B.machakos), 'nairobi');
show('staff asks own branch', ask('staff', B.nairobi, B.nairobi), 'nairobi');
show('manager asks sibling (own org)', ask('manager', B.nairobi, B.thika), 'thika');
show('admin asks SIBLING TENANT', ask('admin', B.nairobi, RIVAL), 'nairobi');
show('admin asks information_schema', ask('admin', B.nairobi, 'information_schema'), 'nairobi');
show('admin asks parent slug', ask('admin', B.nairobi, TENANT), 'nairobi');
show('admin (HQ, no branch) asks machakos', ask('admin', null, B.machakos), 'machakos');
show('staff (HQ, no branch) asks machakos', ask('staff', null, B.machakos), 'machakos');

console.log(fails ? '\n' + fails + ' FAILED' : '\nAll gateway branch-scope cases pass');
process.exit(fails ? 1 : 0);