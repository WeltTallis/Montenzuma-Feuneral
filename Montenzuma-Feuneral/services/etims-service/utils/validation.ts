import Joi from 'joi';
import { ValidationError } from './errors';

export interface TenantRequest {
  tin: string;
  bhfId: string;
  lastReqDt?: string;
  cmcKey?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface OscuSalesRequest extends TenantRequest {
  invcNo: string;
  salesTrnsItems: Array<{
    itemCd: string;
    itemNm: string;
    qty: number;
    prc: number;
    splyAmt: number;
    dcRt?: number;
    dcAmt?: number;
    taxTyCd: string;
    taxAmt: number;
  }>;
}

export interface StockMasterRequest extends TenantRequest {
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  pkgUnitCd: string;
  qtyUnitCd: string;
  splyAmt: number;
  vatTyCd: string;
}

const schemas = {
  auth: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
  initialization: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    dvcSrlNo: Joi.string().required(),
  }),
  codeList: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  itemClsList: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  bhfList: Joi.object({ lastReqDt: Joi.string().required() }),
  noticeList: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  taxpayerInfo: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  customerList: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  salesTrns: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    invcNo: Joi.string().required(),
    salesTrnsItems: Joi.array().items(
      Joi.object({
        itemCd: Joi.string().required(),
        itemNm: Joi.string().required(),
        qty: Joi.number().required(),
        prc: Joi.number().required(),
        splyAmt: Joi.number().required(),
        dcRt: Joi.number().optional(),
        dcAmt: Joi.number().optional(),
        taxTyCd: Joi.string().required(),
        taxAmt: Joi.number().required(),
      })
    ).min(1).required(),
  }),
  selectSalesTrns: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
    invcNo: Joi.string().optional(),
  }),
  moveList: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    lastReqDt: Joi.string().required(),
  }),
  stockMaster: Joi.object({
    tin: Joi.string().required(),
    bhfId: Joi.string().required(),
    itemCd: Joi.string().required(),
    itemClsCd: Joi.string().required(),
    itemNm: Joi.string().required(),
    pkgUnitCd: Joi.string().required(),
    qtyUnitCd: Joi.string().required(),
    splyAmt: Joi.number().required(),
    vatTyCd: Joi.string().required(),
  }),
};

export { schemas };

export function validate<T>(data: unknown, schema: Joi.Schema): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new ValidationError(
      'Validation failed',
      error.details.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      }))
    );
  }

  return value as T;
}
