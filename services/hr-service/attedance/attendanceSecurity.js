'use strict';

const crypto = require('crypto');

const MAX_CLOCK_SKEW_SECONDS = 300;
const EVENT_UID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const DEVICE_USER_ID_RE = /^[A-Za-z0-9._:-]{1,64}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function signRequest(timestamp, rawBody, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
}

function isFreshTimestamp(timestamp, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!/^\d{10}$/.test(String(timestamp))) return false;
  return Math.abs(nowSeconds - Number(timestamp)) <= MAX_CLOCK_SKEW_SECONDS;
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(String(left)) || !/^[a-f0-9]{64}$/i.test(String(right))) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function isValidDate(value) {
  if (!DATE_RE.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeDeviceEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Invalid event');
  if (!EVENT_UID_RE.test(String(event.event_uid || ''))) throw new Error('Invalid event_uid');
  if (!DEVICE_USER_ID_RE.test(String(event.device_user_id || ''))) throw new Error('Invalid device_user_id');
  if (!['check_in', 'check_out'].includes(event.event_type)) throw new Error('Invalid event_type');
  if (typeof event.occurred_at !== 'string' || Number.isNaN(Date.parse(event.occurred_at))) {
    throw new Error('Invalid occurred_at');
  }
  if (!isValidDate(event.work_date)) throw new Error('Invalid work_date');

  const occurredAt = new Date(event.occurred_at);
  return {
    eventUid: String(event.event_uid),
    deviceUserId: String(event.device_user_id),
    eventType: event.event_type,
    occurredAt: occurredAt.toISOString().slice(0, 23).replace('T', ' '),
    workDate: event.work_date,
  };
}

module.exports = {
  DEVICE_USER_ID_RE,
  EVENT_UID_RE,
  isFreshTimestamp,
  isValidDate,
  normalizeDeviceEvent,
  safeEqualHex,
  signRequest,
};