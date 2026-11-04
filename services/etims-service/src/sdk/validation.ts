import Joi from 'joi';
import {
  EtimsMode,
  OscuSalesRequest,
  VscuSalesRequest,
} from './types';

const nonNegativeAmount = Joi.number().min(0).required();
const code = Joi.string().trim().min(1).max(5).required();

const oscuSalesItemSchema = Joi.object({
  itemCd: Joi.string().trim().min(1).max(20).required(),
  itemNm: Joi.string().trim().min(1).max(200).required(),
  qty: Joi.number().greater(0).required(),
  prc: nonNegativeAmount,
  splyAmt: nonNegativeAmount,
  dcRt: Joi.number().min(0).max(100).optional(),
  dcAmt: Joi.number().min(0).optional(),
  taxTyCd: code,
  taxAmt: nonNegativeAmount,
}).unknown(false);

export const oscuSalesSchema = Joi.object({
  tin: Joi.string().trim().length(11).required(),
  bhfId: Joi.string().trim().length(2).required(),
  invcNo: Joi.alternatives().try(Joi.string().trim().min(1).max(50), Joi.number().integer().positive()).required(),
  salesTrnsItems: Joi.array().items(oscuSalesItemSchema).min(1).required(),
}).unknown(false);

const vscuReceiptSchema = Joi.object({
  custTin: Joi.string().trim().length(11).allow(null, '').optional(),
  custMblNo: Joi.string().trim().max(20).allow(null, '').optional(),
  rptNo: Joi.number().integer().min(0).required(),
  trdeNm: Joi.string().max(20).allow('').required(),
  adrs: Joi.string().max(200).allow('').required(),
  topMsg: Joi.string().max(20).allow('').required(),
  btmMsg: Joi.string().max(20).allow('').required(),
  prchrAcptcYn: Joi.string().valid('Y', 'N').required(),
}).unknown(false);

const vscuSalesItemSchema = Joi.object({
  itemSeq: Joi.number().integer().min(1).max(999).required(),
  itemClsCd: Joi.string().max(10).allow(null, '').optional(),
  itemCd: Joi.string().trim().min(1).max(20).required(),
  itemNm: Joi.string().trim().min(1).max(200).required(),
  bcd: Joi.string().max(20).allow(null, '').optional(),
  pkgUnitCd: code,
  pkg: Joi.number().min(0).required(),
  qtyUnitCd: code,
  qty: Joi.number().greater(0).required(),
  prc: nonNegativeAmount,
  splyAmt: nonNegativeAmount,
  dcRt: Joi.number().min(0).max(100).required(),
  dcAmt: nonNegativeAmount,
  isrccCd: Joi.string().max(10).allow(null, '').optional(),
  isrccNm: Joi.string().max(100).allow(null, '').optional(),
  isrcRt: Joi.number().min(0).max(100).allow(null).optional(),
  isrcAmt: Joi.number().min(0).allow(null).optional(),
  taxTyCd: code,
  taxblAmt: nonNegativeAmount,
  taxAmt: nonNegativeAmount,
  totAmt: nonNegativeAmount,
}).unknown(false);

export const vscuSalesSchema = Joi.object({
  tin: Joi.string().trim().length(11).required(),
  bhfId: Joi.string().trim().length(2).required(),
  trdInvcNo: Joi.alternatives().try(Joi.string().trim().min(1).max(50), Joi.number()).required(),
  invcNo: Joi.number().integer().min(0).required(),
  orgInvcNo: Joi.number().integer().min(0).required(),
  custTin: Joi.string().trim().length(11).allow(null, '').optional(),
  custNm: Joi.string().max(60).allow(null, '').optional(),
  salesTyCd: code,
  rcptTyCd: code,
  pmtTyCd: Joi.string().max(5).allow(null, '').optional(),
  salesSttsCd: code,
  cfmDt: Joi.string().pattern(/^\d{14}$/).required(),
  salesDt: Joi.string().pattern(/^\d{8}$/).required(),
  stockRlsDt: Joi.string().pattern(/^\d{14}$/).allow(null, '').optional(),
  cnclReqDt: Joi.string().pattern(/^\d{14}$/).allow(null, '').optional(),
  cnclDt: Joi.string().pattern(/^\d{14}$/).allow(null, '').optional(),
  rfdDt: Joi.string().pattern(/^\d{14}$/).allow(null, '').optional(),
  rfdRsnCd: Joi.string().max(5).allow(null, '').optional(),
  totItemCnt: Joi.number().integer().min(1).required(),
  taxblAmtA: nonNegativeAmount,
  taxblAmtB: nonNegativeAmount,
  taxblAmtC: nonNegativeAmount,
  taxblAmtD: nonNegativeAmount,
  taxblAmtE: nonNegativeAmount,
  taxRtA: Joi.number().min(0).required(),
  taxRtB: Joi.number().min(0).required(),
  taxRtC: Joi.number().min(0).required(),
  taxRtD: Joi.number().min(0).required(),
  taxRtE: Joi.number().min(0).required(),
  taxAmtA: nonNegativeAmount,
  taxAmtB: nonNegativeAmount,
  taxAmtC: nonNegativeAmount,
  taxAmtD: nonNegativeAmount,
  taxAmtE: nonNegativeAmount,
  totTaxblAmt: nonNegativeAmount,
  totTaxAmt: nonNegativeAmount,
  totAmt: nonNegativeAmount,
  prchrAcptcYn: Joi.string().valid('Y', 'N').required(),
  remark: Joi.string().max(400).allow(null, '').optional(),
  regrNm: Joi.string().trim().min(1).max(60).required(),
  regrId: Joi.string().trim().min(1).max(20).required(),
  modrNm: Joi.string().trim().min(1).max(60).required(),
  modrId: Joi.string().trim().min(1).max(20).required(),
  receipt: vscuReceiptSchema.required(),
  itemList: Joi.array().items(vscuSalesItemSchema).min(1).required(),
}).unknown(false);

export function validateSalesRequest(mode: 'oscu', input: unknown): OscuSalesRequest;
export function validateSalesRequest(mode: 'vscu', input: unknown): VscuSalesRequest;
export function validateSalesRequest(
  mode: EtimsMode,
  input: unknown
): OscuSalesRequest | VscuSalesRequest;
export function validateSalesRequest(
  mode: EtimsMode,
  input: unknown
): OscuSalesRequest | VscuSalesRequest {
  const schema = mode === 'oscu' ? oscuSalesSchema : vscuSalesSchema;
  const { error, value } = schema.validate(input, {
    abortEarly: false,
    convert: false,
    stripUnknown: false,
  });
  if (error) {
    const details = error.details.map(({ message, path }) => `${path.join('.')}: ${message}`);
    throw new TypeError(`Invalid ${mode.toUpperCase()} sales request: ${details.join('; ')}`);
  }

  if (mode === 'vscu') {
    const request = value as VscuSalesRequest;
    const matches = (left: number, right: number) => Math.abs(left - right) < 0.01;
    const taxableTotal = request.itemList.reduce((sum, item) => sum + item.taxblAmt, 0);
    const taxTotal = request.itemList.reduce((sum, item) => sum + item.taxAmt, 0);
    const amountTotal = request.itemList.reduce((sum, item) => sum + item.totAmt, 0);

    if (request.totItemCnt !== request.itemList.length) {
      throw new TypeError('Invalid VSCU sales request: totItemCnt must match itemList length');
    }
    if (!matches(request.totTaxblAmt, taxableTotal)) {
      throw new TypeError('Invalid VSCU sales request: totTaxblAmt must equal the item taxable amount total');
    }
    if (!matches(request.totTaxAmt, taxTotal)) {
      throw new TypeError('Invalid VSCU sales request: totTaxAmt must equal the item tax total');
    }
    if (!matches(request.totAmt, amountTotal)) {
      throw new TypeError('Invalid VSCU sales request: totAmt must equal the item total amount');
    }
  }

  return value;
}
