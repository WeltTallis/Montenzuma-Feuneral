const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'uptime-kuma-data', 'kuma.db');

// Wait for database file to exist (Uptime Kuma needs to initialize it first)
if (!fs.existsSync(DB_PATH)) {
  console.log(`Database not found at ${DB_PATH}. Please start Uptime Kuma first.`);
  process.exit(1);
}

const db = new Database(DB_PATH);

const endpoints = [
  { name: 'API Gateway', url: 'http://restpoint_api_gateway:5000/health' },
  { name: 'Auth Service', url: 'http://restpoint_auth_service:5000/health' },
  { name: 'Tenant Service', url: 'http://restpoint_tenant_service:5000/health' },
  { name: 'Deceased Service', url: 'http://restpoint_deceased_service:5000/health' },
  { name: 'Hearse Service', url: 'http://restpoint_hearse_service:5000/health' },
  { name: 'Coffin Service', url: 'http://restpoint_coffin_service:5000/health' },
  { name: 'Workshop Service', url: 'http://restpoint_workshop_service:5000/health' },
  { name: 'Billing Service', url: 'http://restpoint_billing_service:5000/health' },
  { name: 'Analytics Service', url: 'http://restpoint_analytics_service:5000/health' },
  { name: 'Socket.IO Service', url: 'http://restpoint_socketio_service:5000/health' },
  { name: 'Documents Service', url: 'http://restpoint_documents_service:5000/health' },
  { name: 'Support Service', url: 'http://restpoint_support_service:5000/health' },
  { name: 'Chemical Service', url: 'http://restpoint_chemical_service:5000/health' },
  { name: 'Leave Service', url: 'http://restpoint_leave_service:5000/health' },
  { name: 'Scanner Service', url: 'http://restpoint_scanner_service:2024/health' },
  { name: 'Invoice Service', url: 'http://restpoint_invoice_service:5000/health' },
  { name: 'Frontend Client', url: 'http://restpoint_frontend:80' }
];

const tcpEndpoints = [
  { name: 'MariaDB', hostname: 'restpoint_mariadb', port: 3306 },
  { name: 'Redis', hostname: 'restpoint_redis', port: 6379 },
  { name: 'RabbitMQ', hostname: 'restpoint_rabbitmq', port: 5672 }
];

try {
  const insertMonitor = db.prepare(`
    INSERT INTO monitor (
      name, type, url, hostname, port, interval, retry_interval, maxretries, weight, active
    ) VALUES (
      ?, ?, ?, ?, ?, 60, 60, 1, 2000, 1
    )
  `);

  const checkMonitor = db.prepare('SELECT id FROM monitor WHERE name = ?');

  db.transaction(() => {
    // Insert HTTP monitors
    for (const ep of endpoints) {
      const exists = checkMonitor.get(ep.name);
      if (!exists) {
        insertMonitor.run(ep.name, 'http', ep.url, null, null);
        console.log(`Added HTTP monitor: ${ep.name}`);
      } else {
        console.log(`Monitor already exists: ${ep.name}`);
      }
    }

    // Insert TCP monitors
    for (const ep of tcpEndpoints) {
      const exists = checkMonitor.get(ep.name);
      if (!exists) {
        insertMonitor.run(ep.name, 'port', null, ep.hostname, ep.port);
        console.log(`Added TCP monitor: ${ep.name}`);
      } else {
        console.log(`Monitor already exists: ${ep.name}`);
      }
    }
  })();

  console.log('Successfully initialized Uptime Kuma monitors.');
} catch (error) {
  console.error('Error initializing monitors:', error);
} finally {
  db.close();
}
