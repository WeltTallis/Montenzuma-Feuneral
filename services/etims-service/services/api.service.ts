import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { AuthenticationError, handleApiResponse } from '../utils/errors';

type ApiData = Record<string, unknown>;
type ApiHeaders = Record<string, string>;

class ApiService {
  readonly client: AxiosInstance;
  username: string | undefined = config.apiUsername;
  password: string | undefined = config.apiPassword;
  token: string | null = null;
  tokenExpiry: Date | null = null;
  private authenticationInFlight: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (request: InternalAxiosRequestConfig) => {
      if (request.url === config.endpoints.auth.generateToken) return request;
      if (!this.isTokenValid()) await this.authenticate();
      if (this.token) request.headers.Authorization = `Bearer ${this.token}`;
      return request;
    }, (error: unknown) => {
      logger.error('eTIMS API request setup failed', error);
      return Promise.reject(error);
    });
  }

  isTokenValid(): boolean {
    return Boolean(
      this.token
      && this.tokenExpiry
      && Date.now() < this.tokenExpiry.getTime() - 5 * 60_000
    );
  }

  async authenticate(): Promise<string> {
    if (this.authenticationInFlight) return this.authenticationInFlight;
    this.authenticationInFlight = this.performAuthentication();
    try {
      return await this.authenticationInFlight;
    } finally {
      this.authenticationInFlight = null;
    }
  }

  private async performAuthentication(): Promise<string> {
    if (!this.username || !this.password) {
      throw new AuthenticationError('eTIMS API credentials are not configured');
    }

    try {
      logger.info('Authenticating with KRA eTIMS API');
      const response = await this.client.post<{ access_token?: string; expires_in?: number }>(
        config.endpoints.auth.generateToken,
        null,
        {
          auth: { username: this.username, password: this.password },
          params: { grant_type: 'client_credentials' },
        }
      );
      if (typeof response.data.access_token !== 'string' || !response.data.access_token) {
        throw new AuthenticationError('Invalid authentication response from KRA eTIMS');
      }

      const expiresIn = Number(response.data.expires_in ?? 3600);
      if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
        throw new AuthenticationError('KRA eTIMS returned an invalid token expiry');
      }

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      logger.info('Successfully authenticated with KRA eTIMS API');
      return this.token;
    } catch (error) {
      logger.error('KRA eTIMS authentication failed', error);
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Failed to authenticate with KRA eTIMS API');
    }
  }

  async request<T extends ApiData = ApiData>(
    method: AxiosRequestConfig['method'],
    endpoint: string,
    data?: unknown,
    headers: ApiHeaders = {},
    params?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
        headers,
        params,
      });
      return handleApiResponse(response);
    } catch (error) {
      const response = axios.isAxiosError<T>(error) ? error.response : undefined;
      if (response) return handleApiResponse(response);
      logger.error(`KRA eTIMS request failed (${method} ${endpoint})`, error);
      throw error;
    }
  }

  get<T extends ApiData = ApiData>(
    endpoint: string,
    params: Record<string, unknown> = {},
    headers: ApiHeaders = {}
  ): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers, params);
  }

  post<T extends ApiData = ApiData>(
    endpoint: string,
    data: unknown = {},
    headers: ApiHeaders = {}
  ): Promise<T> {
    return this.request<T>('POST', endpoint, data, headers);
  }
}

const apiService = new ApiService();
export default apiService;
