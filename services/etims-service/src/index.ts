import express, { type ErrorRequestHandler, type Express } from 'express';
import type { Server } from 'node:http';
import config from '../config';
import { configureCors } from '../middleware/cors.middleware';
import apiRoutes from '../routes/api.routes';
import logger from '../utils/logger';
import { formatError } from '../utils/errors';
import authService from '../services/auth.service';
import initializationService from '../services/initialization.service';
import basicDataService from '../services/basic-data.service';
import salesService from '../services/sales.service';
import stockService from '../services/stock.service';
import purchaseService from '../services/purchase.service';
import { closeSalesQueue } from '../queues/salesQueue';

export interface KRAeTimsSDKOptions {
  server?: boolean;
}

export class KRAeTimsSDK {
  readonly auth: Pick<typeof authService, 'getToken'> = authService;
  readonly initialization: Pick<typeof initializationService, 'selectInitOsdcInfo'> =
    initializationService;
  readonly basicData: Pick<
    typeof basicDataService,
    | 'selectCodeList'
    | 'selectItemClsList'
    | 'selectBhfList'
    | 'selectNoticeList'
    | 'selectTaxpayerInfo'
    | 'selectCustomerList'
  > = basicDataService;
  readonly sales: Pick<typeof salesService, 'sendSalesTrns' | 'selectSalesTrns'> = salesService;
  readonly stock: Pick<typeof stockService, 'selectMoveList' | 'saveStockMaster'> = stockService;
  readonly purchase: Pick<typeof purchaseService, 'selectPurchaseTrns'> = purchaseService;
  readonly app?: Express;
  private server: Server | null = null;

  constructor(options: KRAeTimsSDKOptions = {}) {
    if (options.server) this.app = this.initializeServer();
  }

  private initializeServer(): Express {
    const app = express();
    app.use(configureCors());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use((request, _response, next) => {
      logger.info(`${request.method} ${request.path}`);
      next();
    });
    app.use('/api', apiRoutes);
    app.use((_request, response) => {
      response.status(404).json({
        success: false,
        error: { message: 'Resource not found' },
      });
    });

    const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
      logger.error('Error processing eTIMS request', error);
      const formatted = formatError(error);
      response.status(formatted.statusCode).json(formatted);
    };
    app.use(errorHandler);
    return app;
  }

  async start(port = config.port): Promise<void> {
    const app = this.app;
    if (!app) {
      throw new Error('Server not initialized. Set server: true in options.');
    }
    if (this.server) throw new Error('eTIMS server is already running');

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        server.off('error', reject);
        this.server = server;
        logger.info(`KRA eTIMS server listening on port ${port}`);
        resolve();
      });
      server.once('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      const server = this.server;
      this.server = null;
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await closeSalesQueue();
  }
}

export default KRAeTimsSDK;
