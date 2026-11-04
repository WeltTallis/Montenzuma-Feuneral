import assert from 'node:assert/strict';
import test from 'node:test';
import { EtimsClient, EtimsConfigurationError } from '../src/sdk';
import type { VscuSalesRequest } from '../src/sdk';

const vscuRequest: VscuSalesRequest = {
  tin: 'P123456789Z',
  bhfId: '00',
  trdInvcNo: 'INV-001',
  invcNo: 1,
  orgInvcNo: 0,
  salesTyCd: 'N',
  rcptTyCd: 'S',
  pmtTyCd: '01',
  salesSttsCd: '02',
  cfmDt: '20260701120000',
  salesDt: '20260701',
  totItemCnt: 1,
  taxblAmtA: 0,
  taxblAmtB: 100,
  taxblAmtC: 0,
  taxblAmtD: 0,
  taxblAmtE: 0,
  taxRtA: 0,
  taxRtB: 16,
  taxRtC: 0,
  taxRtD: 0,
  taxRtE: 0,
  taxAmtA: 0,
  taxAmtB: 16,
  taxAmtC: 0,
  taxAmtD: 0,
  taxAmtE: 0,
  totTaxblAmt: 100,
  totTaxAmt: 16,
  totAmt: 116,
  prchrAcptcYn: 'N',
  regrNm: 'Restpoint',
  regrId: 'restpoint',
  modrNm: 'Restpoint',
  modrId: 'restpoint',
  receipt: {
    rptNo: 1,
    trdeNm: '',
    adrs: '',
    topMsg: '',
    btmMsg: '',
    prchrAcptcYn: 'N',
  },
  itemList: [{
    itemSeq: 1,
    itemClsCd: '5059690800',
    itemCd: 'KE1NTXU0000001',
    itemNm: 'Service',
    pkgUnitCd: 'NT',
    pkg: 1,
    qtyUnitCd: 'U',
    qty: 1,
    prc: 100,
    splyAmt: 100,
    dcRt: 0,
    dcAmt: 0,
    taxTyCd: 'B',
    taxblAmt: 100,
    taxAmt: 16,
    totAmt: 116,
  }],
};

test('VSCU posts to the local saveSales endpoint with the official request body', async () => {
  let observedUrl = '';
  let observedInit: RequestInit = {};
  const client = new EtimsClient({
    mode: 'vscu',
    baseUrl: 'http://vscu.local:8088/',
    tin: 'P123456789Z',
    bhfId: '00',
    allowInsecureVscu: true,
    fetchImplementation: async (url, init) => {
      observedUrl = String(url);
      observedInit = init ?? {};
      return new Response(JSON.stringify({ resultCd: '000', resultMsg: 'Succeeded', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  await client.sendSalesTransaction(vscuRequest);
  assert.equal(observedUrl, 'http://vscu.local:8088/trnsSales/saveSales');
  assert.equal(new Headers(observedInit.headers).get('accept'), 'application/json');
  assert.equal(
    JSON.parse(String(observedInit.body)).itemList[0].itemCd,
    'KE1NTXU0000001'
  );
});

test('OSCU obtains one token and applies identity headers to sales calls', async () => {
  let authCalls = 0;
  let salesCalls = 0;
  const client = new EtimsClient({
    mode: 'oscu',
    baseUrl: 'https://etims-api-sbx.kra.go.ke/etims-api/',
    tin: 'P123456789Z',
    bhfId: '00',
    username: 'test-user',
    password: 'test-password',
    communicationKey: 'test-cmc-key',
    fetchImplementation: async (url, init) => {
      if (String(url).includes('/oauth2/v1/generate')) {
        authCalls += 1;
        assert.match(new Headers(init?.headers).get('authorization') ?? '', /^Basic /);
        return new Response(JSON.stringify({ access_token: 'test-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      salesCalls += 1;
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('authorization'), 'Bearer test-token');
      assert.equal(headers.get('tin'), 'P123456789Z');
      assert.equal(headers.get('bhfid'), '00');
      assert.equal(headers.get('cmckey'), 'test-cmc-key');
      return new Response(JSON.stringify({ resultCd: '0000', resultMsg: 'Succeeded', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });
  const request = {
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

  await Promise.all([
    client.sendSalesTransaction(request),
    client.sendSalesTransaction(request),
  ]);
  assert.equal(authCalls, 1);
  assert.equal(salesCalls, 2);
});

test('sales requests cannot cross the configured tenant boundary', async () => {
  const client = new EtimsClient({
    mode: 'vscu',
    baseUrl: 'http://vscu.local:8088',
    tin: 'P123456789Z',
    bhfId: '00',
    allowInsecureVscu: true,
    fetchImplementation: async () => {
      throw new Error('network should not be called');
    },
  });

  await assert.rejects(
    client.sendSalesTransaction({ ...vscuRequest, tin: 'A123456789Z' }),
    EtimsConfigurationError
  );
});

test('invalid request totals are rejected without sending a transaction', async () => {
  let fetchCalls = 0;
  const client = new EtimsClient({
    mode: 'vscu',
    baseUrl: 'http://vscu.local:8088',
    tin: 'P123456789Z',
    bhfId: '00',
    allowInsecureVscu: true,
    fetchImplementation: async () => {
      fetchCalls += 1;
      throw new Error('network should not be called');
    },
  });

  await assert.rejects(
    client.sendSalesTransaction({ ...vscuRequest, totAmt: 999 }),
    /totAmt must equal the item total amount/
  );
  assert.equal(fetchCalls, 0);
});
