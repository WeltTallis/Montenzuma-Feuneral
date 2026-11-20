import config from '../config';
import apiService from './api.service';
import { schemas, validate } from '../utils/validation';

class InitializationService {
  async selectInitOsdcInfo(data: unknown) {
    const validated = validate<Record<string, unknown>>(data, schemas.initialization);
    const response = await apiService.post(
      config.endpoints.initialization.selectInitOsdcInfo,
      validated
    );
    return { success: true, data: response };
  }
}

export default new InitializationService();
