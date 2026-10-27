'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isFreshTimestamp,
  isValidDate,
  normalizeDeviceEvent,
  safeEqualHex,
  signRequest,
} = require('./attendanceSecurity');

test('device signatures bind the timestamp and body', () => {
  const signature = signRequest('1790000000', '{"events":[]}', 'test-secret');
  assert.equal(signature.length, 64);
  assert.equal(safeEqualHex(signature, signRequest('1790000000', '{"events":[]}', 'test-secret')), true);
  assert.equal(safeEqualHex(signature, signRequest('1790000001', '{"events":[]}', 'test-secret')), false);
  assert.equal(safeEqualHex('invalid', signature), false);
});

test('device timestamps are limited to a five-minute replay window', () => {
  assert.equal(isFreshTimestamp('1790000000', 1790000000), true);
  assert.equal(isFreshTimestamp('1790000000', 1790000300), true);
  assert.equal(isFreshTimestamp('1790000000', 1790000301), false);
  assert.equal(isFreshTimestamp('not-a-time', 1790000000), false);
});

test('work dates reject impossible calendar dates', () => {
  assert.equal(isValidDate('2026-02-28'), true);
  assert.equal(isValidDate('2026-02-30'), false);
});

test('device events normalize timezone-aware timestamps and reject invalid input', () => {
  const normalized = normalizeDeviceEvent({
    event_uid: 'serial-4:uid-10',
    device_user_id: '00027',
    event_type: 'check_in',
    occurred_at: '2026-10-26T08:30:00+03:00',
    work_date: '2026-10-26',
  });

  assert.equal(normalized.occurredAt, '2026-10-26 05:30:00.000');
  assert.equal(normalized.deviceUserId, '00027');
  assert.throws(() => normalizeDeviceEvent({ event_uid: 'x', device_user_id: '27', event_type: 'bad', occurred_at: '2026-10-26T08:30:00Z', work_date: '2026-10-26' }));
});