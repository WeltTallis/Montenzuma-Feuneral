'use strict';

const crypto = require('crypto');
const express = require('express');
const { safeTenantExecute, safeTenantQuery } = require('../../shared/dbConfig');
const { authorize, enforceTenant, protect } = require('../../services/app-global/middlewares/authMiddleware');
const {
  DEVICE_USER_ID_RE,
  isFreshTimestamp,
  normalizeDeviceEvent,
  safeEqualHex,
  signRequest,
} = require('./attedance/attendanceSecurity');

const router = express.Router();
const MANAGER_ROLES = ['admin', 'manager', 'director', 'systemadmin', 'superadmin'];
const BATCH_LIMIT = 100;
const DEVICE_ID_RE = /^[a-f0-9]{24}$/;
const HASH_RE = /^[a-f0-9]{64}$/;

function getDb(req) {
  return req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
}

function getTenant(req) {
  return req.tenant?.tenant_slug || req.tenantSlug;
}

function getActorId(req) {
  return String(req.user?.userId || req.user?.user_id || '');
}

function requireTenant(req, res, next) {
  const tenantSlug = getTenant(req);
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(400).json({ success: false, message: 'A tenant-scoped attendance request is required' });
  }
  next();
}

function requireManager(req, res, next) {
  return authorize(...MANAGER_ROLES)(req, res, next);
}

function respondError(res, label, error) {
  console.error(`[ATTENDANCE] ${label}:`, error.message);
  return res.status(500).json({ success: false, message: 'Attendance request failed' });
}

function parseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
}

function parseDeviceId(value) {
  return DEVICE_ID_RE.test(String(value || ''));
}

async function findEmployee(dbName, userId) {
  if (!userId || String(userId).length > 36) return null;
  const rows = await safeTenantQuery(
    dbName,
    'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
    [String(userId)]
  );
  return rows[0] || null;
}

// Machine endpoint: the gateway permits this route before user authentication,
// but the device bearer key and body signature are mandatory here.
router.post('/devices/:deviceId/events', async (req, res) => {
  const tenantSlug = getTenant(req);
  const deviceId = String(req.params.deviceId || '');
  const authorization = String(req.headers.authorization || '');
  const credential = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const timestamp = String(req.headers['x-device-timestamp'] || '');
  const signature = String(req.headers['x-device-signature'] || '');

  if (!tenantSlug || tenantSlug === 'system_shared' || !parseDeviceId(deviceId) || !credential || !req.rawBody) {
    return res.status(400).json({ success: false, message: 'Invalid device request' });
  }
  if (!isFreshTimestamp(timestamp)) {
    return res.status(401).json({ success: false, message: 'Device request timestamp is stale' });
  }

  try {
    const dbName = getDb(req);
    const devices = await safeTenantQuery(
      dbName,
      `SELECT credential_hash FROM attendance_devices
       WHERE device_id = ? AND tenant_slug = ? AND is_active = 1 LIMIT 1`,
      [deviceId, tenantSlug]
    );
    const credentialHash = crypto.createHash('sha256').update(credential).digest('hex');
    if (!devices[0] || !safeEqualHex(credentialHash, devices[0].credential_hash)) {
      return res.status(401).json({ success: false, message: 'Device is not authorized' });
    }

    const expectedSignature = signRequest(timestamp, req.rawBody, credential);
    if (!safeEqualHex(signature, expectedSignature)) {
      return res.status(401).json({ success: false, message: 'Device signature is invalid' });
    }

    const events = req.body?.events;
    if (!Array.isArray(events) || events.length < 1 || events.length > BATCH_LIMIT) {
      return res.status(400).json({ success: false, message: `events must contain 1-${BATCH_LIMIT} records` });
    }
    let normalized;
    try {
      normalized = events.map(normalizeDeviceEvent);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const userIds = [...new Set(normalized.map((event) => event.deviceUserId))];
    const placeholders = userIds.map(() => '?').join(',');
    const mappings = await safeTenantQuery(
      dbName,
      `SELECT device_user_id, user_id FROM attendance_device_users
       WHERE device_id = ? AND device_user_id IN (${placeholders})`,
      [deviceId, ...userIds]
    );
    const userByDeviceId = new Map(mappings.map((row) => [String(row.device_user_id), row.user_id]));

    let inserted = 0;
    let duplicates = 0;
    for (const event of normalized) {
      const result = await safeTenantExecute(
        dbName,
        `INSERT INTO attendance_events
         (device_id, event_uid, device_user_id, user_id, event_type, occurred_at, work_date, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'device')
         ON DUPLICATE KEY UPDATE event_uid = VALUES(event_uid)`,
        [deviceId, event.eventUid, event.deviceUserId, userByDeviceId.get(event.deviceUserId) || null,
          event.eventType, event.occurredAt, event.workDate]
      );
      if (result.affectedRows === 1) inserted += 1;
      else duplicates += 1;
    }

    await safeTenantExecute(
      dbName,
      'UPDATE attendance_devices SET last_seen_at = NOW() WHERE device_id = ? AND tenant_slug = ?',
      [deviceId, tenantSlug]
    );
    return res.status(200).json({ success: true, received: events.length, inserted, duplicates });
  } catch (error) {
    return respondError(res, 'device event upload', error);
  }
});

router.use(protect, enforceTenant, requireTenant);
router.use('/devices', requireManager);

router.get('/devices', async (req, res) => {
  try {
    const devices = await safeTenantQuery(
      getDb(req),
      `SELECT device_id, device_name, is_active, last_seen_at, created_at
       FROM attendance_devices WHERE tenant_slug = ? ORDER BY created_at DESC`,
      [getTenant(req)]
    );
    return res.json({ success: true, data: devices });
  } catch (error) {
    return respondError(res, 'list devices', error);
  }
});

router.post('/devices', async (req, res) => {
  const deviceName = String(req.body?.device_name || '').trim();
  if (!deviceName || deviceName.length > 120) {
    return res.status(400).json({ success: false, message: 'device_name is required (max 120 characters)' });
  }
  try {
    const dbName = getDb(req);
    const deviceId = crypto.randomBytes(12).toString('hex');
    const credential = crypto.randomBytes(32).toString('base64url');
    const credentialHash = crypto.createHash('sha256').update(credential).digest('hex');
    await safeTenantExecute(
      dbName,
      `INSERT INTO attendance_devices (device_id, tenant_slug, device_name, credential_hash, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [deviceId, getTenant(req), deviceName, credentialHash, getActorId(req) || null]
    );
    return res.status(201).json({
      success: true,
      data: { device_id: deviceId, device_name: deviceName, credential },
      warning: 'Copy the credential now. It cannot be retrieved later.',
    });
  } catch (error) {
    return respondError(res, 'create device', error);
  }
});

router.patch('/devices/:deviceId/status', async (req, res) => {
  if (!parseDeviceId(req.params.deviceId) || typeof req.body?.is_active !== 'boolean') {
    return res.status(400).json({ success: false, message: 'deviceId and boolean is_active are required' });
  }
  try {
    const result = await safeTenantExecute(
      getDb(req),
      'UPDATE attendance_devices SET is_active = ? WHERE device_id = ? AND tenant_slug = ?',
      [req.body.is_active ? 1 : 0, req.params.deviceId, getTenant(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Device not found' });
    return res.json({ success: true });
  } catch (error) {
    return respondError(res, 'update device', error);
  }
});

router.post('/devices/:deviceId/rotate-credential', async (req, res) => {
  if (!parseDeviceId(req.params.deviceId)) return res.status(400).json({ success: false, message: 'Invalid deviceId' });
  try {
    const credential = crypto.randomBytes(32).toString('base64url');
    const credentialHash = crypto.createHash('sha256').update(credential).digest('hex');
    const result = await safeTenantExecute(
      getDb(req),
      'UPDATE attendance_devices SET credential_hash = ? WHERE device_id = ? AND tenant_slug = ?',
      [credentialHash, req.params.deviceId, getTenant(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Device not found' });
    return res.json({ success: true, data: { credential }, warning: 'Copy the credential now. It cannot be retrieved later.' });
  } catch (error) {
    return respondError(res, 'rotate device credential', error);
  }
});

router.put('/devices/:deviceId/users/:deviceUserId', async (req, res) => {
  const { deviceId, deviceUserId } = req.params;
  const userId = String(req.body?.user_id || '');
  if (!parseDeviceId(deviceId) || !DEVICE_USER_ID_RE.test(deviceUserId) || !userId) {
    return res.status(400).json({ success: false, message: 'Valid device, device user, and user_id are required' });
  }
  try {
    const dbName = getDb(req);
    const [device, employee] = await Promise.all([
      safeTenantQuery(dbName, 'SELECT device_id FROM attendance_devices WHERE device_id = ? AND tenant_slug = ? LIMIT 1', [deviceId, getTenant(req)]),
      findEmployee(dbName, userId),
    ]);
    if (!device[0]) return res.status(404).json({ success: false, message: 'Device not found' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    await safeTenantExecute(
      dbName,
      `INSERT INTO attendance_device_users (device_id, device_user_id, user_id, created_by)
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), created_by = VALUES(created_by)`,
      [deviceId, deviceUserId, userId, getActorId(req) || null]
    );
    return res.json({ success: true });
  } catch (error) {
    return respondError(res, 'map device user', error);
  }
});

router.delete('/devices/:deviceId/users/:deviceUserId', async (req, res) => {
  const { deviceId, deviceUserId } = req.params;
  if (!parseDeviceId(deviceId) || !DEVICE_USER_ID_RE.test(deviceUserId)) {
    return res.status(400).json({ success: false, message: 'Invalid device user mapping' });
  }
  try {
    await safeTenantExecute(
      getDb(req),
      `DELETE m FROM attendance_device_users m
       JOIN attendance_devices d ON d.device_id = m.device_id
       WHERE m.device_id = ? AND m.device_user_id = ? AND d.tenant_slug = ?`,
      [deviceId, deviceUserId, getTenant(req)]
    );
    return res.json({ success: true });
  } catch (error) {
    return respondError(res, 'remove device user mapping', error);
  }
});

router.get('/events', requireManager, async (req, res) => {
  const { start_date: startDate, end_date: endDate, user_id: userId, device_id: deviceId } = req.query;
  if (!parseDate(startDate) || !parseDate(endDate) || startDate > endDate) {
    return res.status(400).json({ success: false, message: 'Valid start_date and end_date (YYYY-MM-DD) are required' });
  }
  const filters = ['e.work_date BETWEEN ? AND ?'];
  const params = [startDate, endDate];
  if (userId) { filters.push('e.user_id = ?'); params.push(String(userId)); }
  if (deviceId) { filters.push('e.device_id = ?'); params.push(String(deviceId)); }
  try {
    const rows = await safeTenantQuery(
      getDb(req),
      `SELECT e.id, e.device_id, d.device_name, e.device_user_id, e.user_id,
              COALESCE(NULLIF(u.full_name, ''), NULLIF(u.username, ''), u.email, e.device_user_id) AS employee_name,
              e.event_type, e.occurred_at, e.work_date, e.source, e.created_by
       FROM attendance_events e
       LEFT JOIN attendance_devices d ON d.device_id = e.device_id
       LEFT JOIN users u ON u.user_id = e.user_id
       WHERE ${filters.join(' AND ')} ORDER BY e.occurred_at DESC LIMIT 2000`,
      params
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return respondError(res, 'list events', error);
  }
});

router.get('/daily', requireManager, async (req, res) => {
  const workDate = parseDate(req.query.date);
  if (!workDate) return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
  try {
    const rows = await safeTenantQuery(
      getDb(req),
      `SELECT e.user_id, COALESCE(NULLIF(u.full_name, ''), NULLIF(u.username, ''), u.email, e.device_user_id) AS employee_name,
              e.device_user_id, e.work_date,
              MIN(CASE WHEN e.event_type = 'check_in' THEN e.occurred_at END) AS first_check_in,
              MAX(CASE WHEN e.event_type = 'check_out' THEN e.occurred_at END) AS last_check_out,
              COUNT(*) AS event_count,
              SUM(e.user_id IS NULL) AS unmapped_event_count
       FROM attendance_events e LEFT JOIN users u ON u.user_id = e.user_id
       WHERE e.work_date = ? GROUP BY e.user_id, employee_name, e.device_user_id, e.work_date
       ORDER BY employee_name`,
      [workDate]
    );
    return res.json({ success: true, date: workDate, data: rows });
  } catch (error) {
    return respondError(res, 'daily attendance', error);
  }
});

router.get('/me', async (req, res) => {
  const userId = getActorId(req);
  const startDate = parseDate(req.query.start_date);
  const endDate = parseDate(req.query.end_date);
  if (!userId) return res.status(403).json({ success: false, message: 'Authenticated employee id is missing' });
  if (!startDate || !endDate || startDate > endDate) {
    return res.status(400).json({ success: false, message: 'Valid start_date and end_date (YYYY-MM-DD) are required' });
  }
  try {
    const rows = await safeTenantQuery(
      getDb(req),
      `SELECT id, device_id, device_user_id, event_type, occurred_at, work_date, source
       FROM attendance_events WHERE user_id = ? AND work_date BETWEEN ? AND ?
       ORDER BY occurred_at DESC LIMIT 500`,
      [userId, startDate, endDate]
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return respondError(res, 'employee history', error);
  }
});

router.post('/manual-events', requireManager, async (req, res) => {
  const userId = String(req.body?.user_id || '');
  const eventType = String(req.body?.event_type || '');
  const workDate = parseDate(req.body?.work_date);
  const occurredAt = String(req.body?.occurred_at || '');
  if (!userId || userId.length > 36 || !['check_in', 'check_out'].includes(eventType) || !workDate || Number.isNaN(Date.parse(occurredAt))) {
    return res.status(400).json({ success: false, message: 'user_id, event_type, work_date, and occurred_at are required' });
  }
  const normalizedAt = new Date(occurredAt).toISOString().slice(0, 23).replace('T', ' ');
  const reason = String(req.body?.reason || '').trim();
  if (!reason || reason.length > 500) return res.status(400).json({ success: false, message: 'A reason (max 500 characters) is required' });
  try {
    const dbName = getDb(req);
    if (!await findEmployee(dbName, userId)) return res.status(404).json({ success: false, message: 'Employee not found' });
    const eventUid = crypto.randomUUID();
    const deviceId = 'manual';
    const result = await safeTenantExecute(
      dbName,
      `INSERT INTO attendance_events
       (device_id, event_uid, device_user_id, user_id, event_type, occurred_at, work_date, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?)`,
      [deviceId, eventUid, userId, userId, eventType, normalizedAt, workDate, getActorId(req) || null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId, event_uid: eventUid, user_id: userId, event_type: eventType, occurred_at: normalizedAt, work_date: workDate, source: 'manual', reason } });
  } catch (error) {
    return respondError(res, 'manual attendance event', error);
  }
});

module.exports = router;