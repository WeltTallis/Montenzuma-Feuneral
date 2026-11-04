import config from '../config';
import { validateSalesRequest } from '../src/sdk/validation';
import { submitSalesTransaction } from '../queues/salesQueue';
import apiService from './api.service';
import { schemas, validate, type TenantRequest } from '../utils/validation';

class SalesService {
  async sendSalesTrns(data: unknown) {
    const response = config.etims.mode === 'oscu'
      ? await submitSalesTransaction({
        mode: 'oscu',
        request: validateSalesRequest('oscu', data),
      })
      : await submitSalesTransaction({
        mode: 'vscu',
        request: validateSalesRequest('vscu', data),
      });
    return { success: true, data: response };
  }

  async selectSalesTrns(data: unknown) {
    const validated = validate<TenantRequest & { invcNo?: string }>(
      data,
      schemas.selectSalesTrns
    );
    const response = await apiService.post(
      config.endpoints.salesManagement.selectSalesTrns,
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

export default new SalesService();
