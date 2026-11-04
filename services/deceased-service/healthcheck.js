'use strict';

const fs = require('node:fs');
const https = require('node:https');

try {
  const request = https.request({
    hostname: '127.0.0.1',
    servername: 'restpoint_deceased_service',
    port: Number(process.env.PORT) || 5000,
    path: '/health',
    method: 'GET',
    ca: fs.readFileSync(process.env.DECEASED_TLS_CA_FILE),
    cert: fs.readFileSync(process.env.DECEASED_TLS_CERT_FILE),
    key: fs.readFileSync(process.env.DECEASED_TLS_KEY_FILE),
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  }, (response) => {
    response.resume();
    process.exitCode = response.statusCode === 200 ? 0 : 1;
  });

  request.setTimeout(3000, () => request.destroy());
  request.on('error', () => {
    process.exitCode = 1;
  });
  request.end();
} catch {
  process.exitCode = 1;
}
