import assert from 'node:assert/strict';
import test from 'node:test';
import { salesJobId, salesJobOptions } from '../queues/salesQueue';
import { formatError, ValidationError } from '../utils/errors';
import { schemas, validate, type OscuSalesRequest } from '../utils/validation';

const salesRequest: OscuSalesRequest = {
  tin: 'P123456789Z',
  bhfId: '00',
  invcNo: 'INV-001',
  salesTrnsItems: [{
    itemCd: 'ITEM-1',
    itemNm: 'Service',
    qty: 1,
    prc: 100,
    splyAmt: 100,
    taxTyCd: 'B',
    taxAmt: 16,
  }],
};

test('sales jobs use stable invoice identity and do not retry submissions', () => {
  const job = { mode: 'oscu' as const, request: salesRequest };
  assert.equal(salesJobId(job), salesJobId(job));
  assert.equal(salesJobId(job).startsWith('sale-'), true);
  assert.equal(salesJobOptions.attempts, 1);
});

test('legacy API validation rejects malformed requests with field details', () => {
  assert.throws(
    () => validate({ tin: '', bhfId: '00' }, schemas.codeList),
    (error: unknown) => error instanceof ValidationError
      && error.errors.some((issue) => issue.field === 'tin')
  );
});

test('error formatting preserves known status codes', () => {
  assert.equal(formatError(new ValidationError('Invalid input')).statusCode, 400);
});
