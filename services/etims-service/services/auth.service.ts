import apiService from './api.service';
import { schemas, validate, type AuthCredentials } from '../utils/validation';

class AuthService {
  async getToken(credentials: unknown) {
    const validated = validate<AuthCredentials>(credentials, schemas.auth);
    apiService.username = validated.username;
    apiService.password = validated.password;
    const accessToken = await apiService.authenticate();
    return {
      success: true,
      data: {
        access_token: accessToken,
        expires_at: apiService.tokenExpiry,
      },
    };
  }
}

export default new AuthService();
