import config from '../config';
import apiService from './api.service';
import { schemas, validate, type TenantRequest } from '../utils/validation';

type Result = Record<string, unknown>;

class BasicDataService {
  private tenantHeaders(data: TenantRequest): Record<string, string> {
    return {
      tin: data.tin,
      bhfId: data.bhfId,
      ...(config.etims.communicationKey
        ? { cmcKey: config.etims.communicationKey }
        : {}),
    };
  }

  private async select(
    endpoint: string,
    data: unknown,
    schema: typeof schemas.codeList,
    includeTenantHeaders = true
  ): Promise<{ success: true; data: Result }> {
    const validated = validate<TenantRequest>(data, schema);
    const response = await apiService.post<Result>(
      endpoint,
      validated,
      includeTenantHeaders ? this.tenantHeaders(validated) : {}
    );
    return { success: true, data: response };
  }

  selectCodeList(data: unknown) {
    return this.select(config.endpoints.basicData.selectCodeList, data, schemas.codeList);
  }

  selectItemClsList(data: unknown) {
    return this.select(
      config.endpoints.basicData.selectItemClsList,
      data,
      schemas.itemClsList
    );
  }

  selectBhfList(data: unknown) {
    return this.select(config.endpoints.basicData.selectBhfList, data, schemas.bhfList, false);
  }

  selectNoticeList(data: unknown) {
    return this.select(config.endpoints.basicData.selectNoticeList, data, schemas.noticeList);
  }

  selectTaxpayerInfo(data: unknown) {
    return this.select(
      config.endpoints.basicData.selectTaxpayerInfo,
      data,
      schemas.taxpayerInfo
    );
  }

  selectCustomerList(data: unknown) {
    return this.select(
      config.endpoints.basicData.selectCustomerList,
      data,
      schemas.customerList
    );
  }
}

export default new BasicDataService();
