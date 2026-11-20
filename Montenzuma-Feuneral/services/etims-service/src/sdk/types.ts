export type EtimsMode = 'oscu' | 'vscu';

export interface EtimsClientOptions {
  mode: EtimsMode;
  baseUrl: string;
  tin: string;
  bhfId: string;
  username?: string;
  password?: string;
  communicationKey?: string;
  allowInsecureVscu?: boolean;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
}

export interface OscuSalesItem {
  itemCd: string;
  itemNm: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt?: number;
  dcAmt?: number;
  taxTyCd: string;
  taxAmt: number;
}

export interface OscuSalesRequest {
  tin: string;
  bhfId: string;
  invcNo: string;
  salesTrnsItems: OscuSalesItem[];
}

export interface VscuReceipt {
  custTin?: string | null;
  custMblNo?: string | null;
  rptNo: number;
  trdeNm: string;
  adrs: string;
  topMsg: string;
  btmMsg: string;
  prchrAcptcYn: 'Y' | 'N';
}

export interface VscuSalesItem {
  itemSeq: number;
  itemClsCd?: string | null;
  itemCd: string;
  itemNm: string;
  bcd?: string | null;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt: number;
  dcAmt: number;
  isrccCd?: string | null;
  isrccNm?: string | null;
  isrcRt?: number | null;
  isrcAmt?: number | null;
  taxTyCd: string;
  taxblAmt: number;
  taxAmt: number;
  totAmt: number;
}

export interface VscuSalesRequest {
  tin: string;
  bhfId: string;
  trdInvcNo: string | number;
  invcNo: number;
  orgInvcNo: number;
  custTin?: string | null;
  custNm?: string | null;
  salesTyCd: string;
  rcptTyCd: string;
  pmtTyCd?: string | null;
  salesSttsCd: string;
  cfmDt: string;
  salesDt: string;
  stockRlsDt?: string | null;
  cnclReqDt?: string | null;
  cnclDt?: string | null;
  rfdDt?: string | null;
  rfdRsnCd?: string | null;
  totItemCnt: number;
  taxblAmtA: number;
  taxblAmtB: number;
  taxblAmtC: number;
  taxblAmtD: number;
  taxblAmtE: number;
  taxRtA: number;
  taxRtB: number;
  taxRtC: number;
  taxRtD: number;
  taxRtE: number;
  taxAmtA: number;
  taxAmtB: number;
  taxAmtC: number;
  taxAmtD: number;
  taxAmtE: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  prchrAcptcYn: 'Y' | 'N';
  remark?: string | null;
  regrNm: string;
  regrId: string;
  modrNm: string;
  modrId: string;
  receipt: VscuReceipt;
  itemList: VscuSalesItem[];
}

export interface EtimsResponse<TData = unknown> {
  resultCd: string;
  resultMsg: string;
  resultDt?: string;
  data: TData;
}

export class EtimsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly resultCode?: string
  ) {
    super(message);
    this.name = 'EtimsApiError';
  }
}

export class EtimsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EtimsConfigurationError';
  }
}
