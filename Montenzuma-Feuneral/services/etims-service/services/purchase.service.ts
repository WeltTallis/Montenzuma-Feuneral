import config from '../config';
import apiService from './api.service';
import { schemas, validate, type TenantRequest } from '../utils/validation';

class PurchaseService {
  async selectPurchaseTrns(data: unknown) {
    const validated = validate<TenantRequest>(data, schemas.taxpayerInfo);
    const response = await apiService.post(
      config.endpoints.purchaseManagement.selectPurchaseTrns,
      validated,
      {
        tin: validated.tin,
        bhfId: validated.bhfId,
        ...(config.etims.communicationKey
          ? { cmcKey: config.etims.communicationKey }
          : {}),
      }
    );
    return { success: true, data: response };
  }
}

export default new PurchaseService();
