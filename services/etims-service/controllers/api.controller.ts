import type { RequestHandler } from 'express';
import logger from '../utils/logger';
import authService from '../services/auth.service';
import initializationService from '../services/initialization.service';
import basicDataService from '../services/basic-data.service';
import salesService from '../services/sales.service';
import stockService from '../services/stock.service';
import purchaseService from '../services/purchase.service';

function controller(
  name: string,
  action: (body: unknown) => Promise<unknown>
): RequestHandler {
  return async (request, response, next) => {
    try {
      logger.info(name);
      response.json(await action(request.body));
    } catch (error) {
      next(error);
    }
  };
}

export const authController = {
  getToken: controller('Getting authentication token', (body) => authService.getToken(body)),
};

export const initializationController = {
  selectInitOsdcInfo: controller(
    'Initializing OSDC information',
    (body) => initializationService.selectInitOsdcInfo(body)
  ),
};

export const basicDataController = {
  selectCodeList: controller('Getting code list', (body) => basicDataService.selectCodeList(body)),
  selectItemClsList: controller(
    'Getting item classification list',
    (body) => basicDataService.selectItemClsList(body)
  ),
  selectBhfList: controller('Getting branch list', (body) => basicDataService.selectBhfList(body)),
  selectNoticeList: controller('Getting notice list', (body) => basicDataService.selectNoticeList(body)),
  selectTaxpayerInfo: controller(
    'Getting taxpayer information',
    (body) => basicDataService.selectTaxpayerInfo(body)
  ),
  selectCustomerList: controller(
    'Getting customer list',
    (body) => basicDataService.selectCustomerList(body)
  ),
};

export const salesController = {
  sendSalesTrns: controller(
    'Queueing sales transaction',
    (body) => salesService.sendSalesTrns(body)
  ),
  selectSalesTrns: controller(
    'Getting sales transaction',
    (body) => salesService.selectSalesTrns(body)
  ),
};

export const stockController = {
  selectMoveList: controller('Getting move list', (body) => stockService.selectMoveList(body)),
  saveStockMaster: controller('Saving stock master', (body) => stockService.saveStockMaster(body)),
};

export const purchaseController = {
  selectPurchaseTrns: controller(
    'Getting purchase transactions',
    (body) => purchaseService.selectPurchaseTrns(body)
  ),
};
