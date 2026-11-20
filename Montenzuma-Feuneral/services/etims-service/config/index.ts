import dotenv from 'dotenv';
import type { EtimsMode } from '../src/sdk/types';

dotenv.config();

function requiredInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const etimsMode: EtimsMode = process.env.ETIMS_MODE === 'vscu' ? 'vscu' : 'oscu';

const config = {
  apiBaseUrl: nodeEnv === 'production'
    ? process.env.PROD_API_BASE_URL || 'https://etims-api.kra.go.ke/etims-api'
    : process.env.DEV_API_BASE_URL || 'https://etims-api-sbx.kra.go.ke',
  apiUsername: process.env.API_USERNAME,
  apiPassword: process.env.API_PASSWORD,
  nodeEnv,
  port: requiredInteger(process.env.PORT, 5000, 'PORT'),
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400,
  },
  endpoints: {
    auth: { generateToken: '/oauth2/v1/generate' },
    initialization: { selectInitOsdcInfo: '/etims-oscu/v1/selectInitOsdcInfo' },
    basicData: {
      selectCodeList: '/etims-oscu/v1/selectCodeList',
      selectItemClsList: '/etims-oscu/v1/selectItemClsList',
      selectBhfList: '/etims-oscu/v1/selectBhfList',
      selectNoticeList: '/etims-oscu/v1/selectNoticeList',
      selectTaxpayerInfo: '/etims-oscu/v1/selectTaxpayerInfo',
      selectCustomerList: '/etims-oscu/v1/selectCustomerList',
    },
    itemManagement: { saveItem: '/etims-oscu/v1/saveItem' },
    salesManagement: {
      sendSalesTrns: '/etims-oscu/v1/sendSalesTrns',
      selectSalesTrns: '/etims-oscu/v1/selectSalesTrns',
    },
    stockManagement: {
      selectMoveList: '/etims-oscu/v1/selectMoveList',
      saveStockMaster: '/etims-oscu/v1/saveStockMaster',
    },
    purchaseManagement: { selectPurchaseTrns: '/etims-oscu/v1/selectPurchaseTrns' },
    importsManagement: { selectImportItemList: '/etims-oscu/v1/selectImportItemList' },
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: requiredInteger(process.env.REDIS_PORT, 6379, 'REDIS_PORT'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  queueWaitTimeoutMs: requiredInteger(
    process.env.ETIMS_QUEUE_WAIT_TIMEOUT_MS,
    120_000,
    'ETIMS_QUEUE_WAIT_TIMEOUT_MS'
  ),
  etims: {
    mode: etimsMode,
    baseUrl: process.env.ETIMS_BASE_URL || (
      etimsMode === 'vscu'
        ? 'http://127.0.0.1:8088/'
        : nodeEnv === 'production'
          ? 'https://etims-api.kra.go.ke/etims-api/'
          : 'https://etims-api-sbx.kra.go.ke/etims-api/'
    ),
    tin: process.env.ETIMS_TIN,
    bhfId: process.env.ETIMS_BHF_ID,
    username: process.env.ETIMS_USERNAME,
    password: process.env.ETIMS_PASSWORD,
    communicationKey: process.env.ETIMS_COMMUNICATION_KEY,
    allowInsecureVscu: process.env.ETIMS_ALLOW_INSECURE_VSCU === 'true',
  },
};

export default config;
