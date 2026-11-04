import {
  EtimsApiError,
  EtimsClientOptions,
  EtimsConfigurationError,
  EtimsResponse,
  OscuSalesRequest,
  VscuSalesRequest,
} from './types';
import { validateSalesRequest } from './validation';

interface TokenResponse {
  access_token: string;
  expires_in?: number | string;
}

export class EtimsClient {
  private readonly baseUrl: URL;
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private authenticationInFlight: Promise<string> | null = null;

  constructor(private readonly options: EtimsClientOptions) {
    if (options.mode !== 'oscu' && options.mode !== 'vscu') {
      throw new EtimsConfigurationError('mode must be either "oscu" or "vscu"');
    }
    this.baseUrl = this.parseBaseUrl(options.baseUrl);
    this.fetchImplementation = options.fetchImplementation || fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;

    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1) {
      throw new EtimsConfigurationError('timeoutMs must be a positive integer');
    }
    if (!/^[A-Z]\d{9}[A-Z]$/.test(options.tin)) {
      throw new EtimsConfigurationError('A valid KRA PIN is required');
    }
    if (!/^[A-Z0-9]{2}$/.test(options.bhfId)) {
      throw new EtimsConfigurationError('A valid 2-character branch ID is required');
    }

    if (options.mode === 'oscu') {
      if (this.baseUrl.protocol !== 'https:') {
        throw new EtimsConfigurationError('OSCU connections must use HTTPS');
      }
      if (
        !options.username?.trim()
        || !options.password
        || !options.communicationKey?.trim()
      ) {
        throw new EtimsConfigurationError(
          'OSCU requires a username, password, and communication key'
        );
      }
    } else if (this.baseUrl.protocol === 'http:' && !options.allowInsecureVscu) {
      throw new EtimsConfigurationError(
        'VSCU HTTP connections require allowInsecureVscu: true on a trusted private network'
      );
    }
  }

  async sendSalesTransaction(
    input: OscuSalesRequest | VscuSalesRequest
  ): Promise<EtimsResponse> {
    const request = validateSalesRequest(this.options.mode, input);
    this.assertTenantMatches(request);

    const endpoint = this.options.mode === 'oscu'
      ? 'etims-oscu/v1/sendSalesTrns'
      : 'trnsSales/saveSales';

    const headers = this.options.mode === 'oscu'
      ? await this.oscuHeaders()
      : { 'Content-Type': 'application/json', Accept: 'application/json' };

    const response = await this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const result = await this.readJson<EtimsResponse>(response);
    const successCode = this.options.mode === 'oscu' ? '0000' : '000';
    if (result.resultCd !== successCode) {
      throw new EtimsApiError(
        result.resultMsg || 'KRA eTIMS rejected the sales transaction',
        response.status,
        result.resultCd
      );
    }
    return result;
  }

  private parseBaseUrl(value: string): URL {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new EtimsConfigurationError('A valid eTIMS base URL is required');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new EtimsConfigurationError('eTIMS base URL must use HTTP or HTTPS');
    }
    if (url.username || url.password || url.search || url.hash) {
      throw new EtimsConfigurationError(
        'eTIMS base URL must not contain credentials, query parameters, or a fragment'
      );
    }
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  }

  private assertTenantMatches(
    request: OscuSalesRequest | VscuSalesRequest
  ): void {
    if (request.tin !== this.options.tin || request.bhfId !== this.options.bhfId) {
      throw new EtimsConfigurationError(
        'Sales request TIN and branch ID must match the configured tenant'
      );
    }
  }

  private async oscuHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await this.getAccessToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      tin: this.options.tin,
      bhfId: this.options.bhfId,
      cmcKey: this.options.communicationKey as string,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }
    if (!this.authenticationInFlight) {
      this.authenticationInFlight = this.authenticate();
    }
    try {
      return await this.authenticationInFlight;
    } finally {
      this.authenticationInFlight = null;
    }
  }

  private async authenticate(): Promise<string> {
    const credentials = Buffer.from(
      `${this.options.username}:${this.options.password}`,
      'utf8'
    ).toString('base64');
    const response = await this.request('oauth2/v1/generate?grant_type=client_credentials', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });

    const result = await this.readJson<TokenResponse>(response);
    if (typeof result.access_token !== 'string' || result.access_token.length === 0) {
      throw new EtimsApiError(
        'OSCU authentication response did not contain an access token',
        response.status
      );
    }

    const expiresIn = Number(result.expires_in ?? 3600);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new EtimsApiError(
        'OSCU authentication response contained an invalid token expiry',
        response.status
      );
    }

    this.accessToken = result.access_token;
    this.accessTokenExpiresAt = Date.now() + Math.max(0, expiresIn * 1000 - 60_000);
    return this.accessToken;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImplementation(new URL(path, this.baseUrl), {
        ...init,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'network error';
      throw new EtimsApiError(`eTIMS request failed: ${message}`, 0);
    }
    if (!response.ok) {
      throw new EtimsApiError(
        `eTIMS request failed with HTTP ${response.status}`,
        response.status
      );
    }
    return response;
  }

  private async readJson<T>(response: Response): Promise<T> {
    try {
      return await response.json() as T;
    } catch {
      throw new EtimsApiError('eTIMS returned an invalid JSON response', response.status);
    }
  }
}

export function createEtimsClient(options: EtimsClientOptions): EtimsClient {
  return new EtimsClient(options);
}
