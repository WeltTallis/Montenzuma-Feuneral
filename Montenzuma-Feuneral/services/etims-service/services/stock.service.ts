import config from '../config';
import apiService from './api.service';
import { schemas, validate, type StockMasterRequest, type TenantRequest } from '../utils/validation';

class StockService {
  private tenantHeaders(data: TenantRequest): Record<string, string> {
    return {
      tin: data.tin,
      bhfId: data.bhfId,
      ...(config.etims.communicationKey
        ? { cmcKey: config.etims.communicationKey }
        : {}),
    };
  }

  async selectMoveList(data: unknown) {
    const validated = validate<TenantRequest>(data, schemas.moveList);
    const response = await apiService.post(
      config.endpoints.stockManagement.selectMoveList,
      validated,
      this.tenantHeaders(validated)
    );
    return { success: true, data: response };
  }

  async saveStockMaster(data: unknown) {
    const validated = validate<StockMasterRequest>(data, schemas.stockMaster);
    const response = await apiService.post(
      config.endpoints.stockManagement.saveStockMaster,
      validated,
      this.tenantHeaders(validated)
    );
    return { success: true, data: response };
  }
}

export default new StockService();
