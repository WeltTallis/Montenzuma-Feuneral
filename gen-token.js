const jwt = require('jsonwebtoken');
const SECRET = 'RestPointJWTSecret2024ChangeMe!SuperSecureInProduction';
const token = jwt.sign({
  id: 1,
  userId: 1,
  role: 'superadmin',
  name: 'Export Test',
  email: 'test@restpoint.local',
  tenantId: 1,
  tenantSlug: 'monezuma-monalisa-feuneral-home-nairobi'
}, SECRET, { expiresIn: '1h' });
console.log(token);