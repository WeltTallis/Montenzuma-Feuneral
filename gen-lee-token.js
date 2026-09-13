const jwt = require('jsonwebtoken');
const SECRET = 'RestPointJWTSecret2024ChangeMe!SuperSecureInProduction';
const token = jwt.sign({
  userId: '03156683-066b-4a80-a05e-882f251e340c',
  email: 'if@gmail.com',
  tenantId: '2ac84d59-2ced-47ac-a829-6f6dfcd338e4',
  tenantName: 'LEE  FEUNERAL  HOME',
  tenantSlug: 'lee-feuneral-home',
  dbName: 'lee-feuneral-home',
  role: 'admin',
  branchDbName: 'lee-feuneral-home',
  branchSlug: 'lee-feuneral-home-nairobi',
  parentTenantSlug: 'lee-feuneral-home',
  branchId: '997b7c50-20be-4011-8215-89f2d6f4687a'
}, SECRET, { expiresIn: '24h' });
console.log(token);
