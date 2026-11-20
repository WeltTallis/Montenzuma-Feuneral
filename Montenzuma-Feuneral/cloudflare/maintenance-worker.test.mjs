import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import maintenanceWorker from './maintenance-worker.mjs';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const makeRequest = (path = '/', { method = 'GET', accept = 'text/html' } = {}) => (
  new Request(`https://restpoint.co.ke${path}`, {
    method,
    headers: { Accept: accept },
  })
);

const makeAssets = () => ({
  async fetch(request) {
    assert.equal(new URL(request.url).pathname, '/maintenance.html');
    return new Response('<h1>Maintenance</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
});

test('passes successful page responses through unchanged', async () => {
  const originResponse = new Response('<h1>RestPoint</h1>', { status: 200 });
  globalThis.fetch = async () => originResponse;

  const response = await maintenanceWorker.fetch(makeRequest(), { ASSETS: makeAssets() });
  assert.equal(response, originResponse);
});

test('serves maintenance page when the origin returns a server error', async () => {
  globalThis.fetch = async () => new Response('Bad Gateway', { status: 502 });

  const response = await maintenanceWorker.fetch(makeRequest(), { ASSETS: makeAssets() });
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Maintenance/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate');
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('serves maintenance page when the origin is unreachable', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('Origin unavailable');
  };

  const response = await maintenanceWorker.fetch(makeRequest(), { ASSETS: makeAssets() });
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Maintenance/);
});

test('does not replace API failures with an HTML maintenance page', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response('API unavailable', { status: 502 });
  };

  const response = await maintenanceWorker.fetch(
    makeRequest('/api/v1/restpoint/auth/me', { accept: 'application/json' }),
    { ASSETS: makeAssets() },
  );
  assert.equal(response.status, 502);
  assert.equal(await response.text(), 'API unavailable');
  assert.equal(fetchCalls, 1);
});

test('does not add a response body to HEAD maintenance responses', async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 });

  const response = await maintenanceWorker.fetch(
    makeRequest('/', { method: 'HEAD' }),
    { ASSETS: makeAssets() },
  );
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '');
});
