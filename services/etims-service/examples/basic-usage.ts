import dotenv from 'dotenv';
import KRAeTimsSDK from '../src';

dotenv.config();
const sdk = new KRAeTimsSDK();

export async function authenticate(): Promise<string> {
  const result = await sdk.auth.getToken({
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
  });
  return result.data.access_token;
}

export async function initializeOsdc() {
  return sdk.initialization.selectInitOsdcInfo({
    tin: 'P000000045R',
    bhfId: '00',
    dvcSrlNo: 'MOVA22',
  });
}

export async function getCodeList() {
  return sdk.basicData.selectCodeList({
    tin: 'P000000045R',
    bhfId: '00',
    lastReqDt: '20220101010101',
  });
}

export async function sendSalesTrns() {
  return sdk.sales.sendSalesTrns({
    tin: 'P000000045R',
    bhfId: '00',
    invcNo: 'INV001',
    salesTrnsItems: [{
      itemCd: 'ITEM001',
      itemNm: 'Test Item',
      qty: 1,
      prc: 100,
      splyAmt: 100,
      taxTyCd: 'B',
      taxAmt: 16,
    }],
  });
}

export async function runExamples(): Promise<void> {
  await authenticate();
  await initializeOsdc();
  await getCodeList();
  await sendSalesTrns();
}

if (require.main === module) {
  runExamples().catch((error: unknown) => {
    console.error('Example execution failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
