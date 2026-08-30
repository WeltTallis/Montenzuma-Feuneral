/**
 * Centralized Upload Service
 * 
 * Provides a unified interface for all services to upload files to the centralized uploads-service.
 * This ensures all files are stored in the correct tenant-specific folders.
 * 
 * Usage:
 *   const result = await centralizedUploadService.uploadSignature(buffer, filename, tenantSlug);
 *   const result = await centralizedUploadService.uploadDocument(buffer, filename, tenantSlug, 'deceased');
 *   const result = await centralizedUploadService.uploadImage(buffer, filename, tenantSlug, 'coffins');
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const UPLOADS_SERVICE_URL = process.env.UPLOADS_SERVICE_URL || 'http://localhost:5012';
const UPLOADS_SERVICE_API_KEY = process.env.UPLOADS_SERVICE_API_KEY;

// Candidate URLs to try in order (Docker DNS, localhost, 127.0.0.1)
const getCandidateUrls = (): string[] => {
  const configured = process.env.UPLOADS_SERVICE_URL || '';
  return [
    configured,
    'http://localhost:5012',
    'http://127.0.0.1:5012',
    'http://uploads-service:5012',
  ].filter(Boolean);
};

export interface UploadResult {
  success: boolean;
  filename: string;
  path: string;
  urlPath: string;
  size: number;
  mimeType: string;
  error?: string;
}

export interface UploadOptions {
  tenantSlug: string;
  category?: string;
  subFolder?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Centralized Upload Service
 */
class CentralizedUploadService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: UPLOADS_SERVICE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        ...(UPLOADS_SERVICE_API_KEY && { 'X-API-Key': UPLOADS_SERVICE_API_KEY }),
      },
    });
  }

  /**
   * Upload signature
   */
  async uploadSignature(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    console.log('[UPLOAD] uploadSignature called:', {
      filename,
      tenantSlug,
      bufferSize: buffer.length,
      uploadUrl: this.axiosInstance.defaults.baseURL,
      options
    });
    
    // Ensure tenant folders exist first
    await this.createTenantFolders(tenantSlug);
    
    // Use the dedicated signature upload endpoint
    const result = await this.uploadToSignatureEndpoint(buffer, filename, tenantSlug, {
      quality: 85,
      maxWidth: 800,
      maxHeight: 300,
      format: 'png',
      ...options,
    });
    
    console.log('[UPLOAD] uploadSignature result:', {
      success: result.success,
      urlPath: result.urlPath,
      error: result.error,
      filename: result.filename
    });
    
    return result;
  }

  /**
   * Upload document (PDF, DOC, etc.)
   */
  async uploadDocument(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    subFolder?: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.uploadFile(buffer, filename, tenantSlug, 'documents', {
      quality: 90,
      format: 'jpeg',
      subFolder,
      ...options,
    });
  }

  /**
   * Upload image (coffins, hearses, florist, etc.)
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    category: string = 'images',
    subFolder?: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.uploadFile(buffer, filename, tenantSlug, category, {
      quality: 85,
      format: 'webp',
      subFolder,
      ...options,
    });
  }

  /**
   * Upload tenant logo
   */
  async uploadTenantLogo(
    buffer: Buffer,
    filename: string,
    tenantSlug: string
  ): Promise<UploadResult> {
    return this.uploadFile(buffer, filename, tenantSlug, 'logos', {
      quality: 90,
      maxWidth: 400,
      maxHeight: 400,
      format: 'webp',
    });
  }

  /**
   * Upload PDF document
   */
  async uploadPDF(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    subFolder?: string
  ): Promise<UploadResult> {
    // For PDFs, we don't want to process them with Sharp
    // We'll upload them as-is to the documents folder
    return this.uploadRawFile(buffer, filename, tenantSlug, 'documents', subFolder);
  }

  /**
   * Upload Excel file
   */
  async uploadExcel(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    subFolder?: string
  ): Promise<UploadResult> {
    return this.uploadRawFile(buffer, filename, tenantSlug, 'exports', subFolder);
  }

  /**
   * Upload signature to the dedicated signature endpoint
   * CRITICAL: Signatures are ALWAYS uploaded as PNG (never webp).
   */
  private async uploadToSignatureEndpoint(
    buffer: Buffer,
    originalName: string,
    tenantSlug: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<UploadResult> {
    const candidateUrls = getCandidateUrls();
    
    // CRITICAL: Always force PNG format for signatures regardless of what was passed
    const signatureOptions = {
      ...options,
      format: 'png' as const, // Always PNG for signatures
    };

    // Ensure the filename has a .png extension
    let pngFilename = originalName;
    if (!pngFilename.toLowerCase().endsWith('.png')) {
      // Replace any existing extension with .png, or append .png
      pngFilename = pngFilename.replace(/\.[^.]+$/, '') + '.png';
    }

    for (const baseUrl of candidateUrls) {
      try {
        // Create a dedicated axios instance for this candidate URL
        // (previously all iterations used the same fixed-baseURL instance, which was a bug)
        const instance = axios.create({
          baseURL: baseUrl,
          timeout: 30000,
          headers: {
            ...(UPLOADS_SERVICE_API_KEY && { 'X-API-Key': UPLOADS_SERVICE_API_KEY }),
          },
        });

        const form = new FormData();
        form.append('file', buffer, {
          filename: pngFilename,
          contentType: 'image/png',
        });
        form.append('tenantSlug', tenantSlug);
        form.append('category', 'signatures');
        form.append('format', 'png'); // Always PNG for signatures
        
        if (signatureOptions.quality) form.append('quality', signatureOptions.quality.toString());
        if (signatureOptions.maxWidth) form.append('maxWidth', signatureOptions.maxWidth.toString());
        if (signatureOptions.maxHeight) form.append('maxHeight', signatureOptions.maxHeight.toString());

        const response = await instance.post('/api/upload/signature', form, {
          headers: form.getHeaders(),
          timeout: 30000,
        });

        console.log('[UPLOAD] Signature upload response from', baseUrl, ':', {
          status: response.status,
          hasSuccess: response.data.hasOwnProperty('success'),
          success: response.data.success,
          hasData: response.data.hasOwnProperty('data'),
          keys: Object.keys(response.data)
        });

        // Handle both response formats: {success: true, data: {...}} or just {...}
        if (response.data.success && response.data.data) {
          // Verify the uploaded file is actually PNG
          const result = response.data.data;
          if (result.filename && !result.filename.toLowerCase().endsWith('.png')) {
            console.warn(`[UPLOAD] Signature was not saved as PNG! Got: ${result.filename}. Forcing mimeType to image/png.`);
            result.mimeType = 'image/png';
          }
          return result;
        } else if (response.data.urlPath) {
          return response.data;
        } else {
          return {
            success: false,
            filename: '',
            path: '',
            urlPath: '',
            size: 0,
            mimeType: '',
            error: response.data.message || response.data.error || 'Upload failed',
          };
        }
      } catch (error: any) {
        console.warn(`[UPLOAD] Signature upload failed for ${baseUrl}:`, error.message);
        // Try next URL
      }
    }
    
    return {
      success: false,
      filename: '',
      path: '',
      urlPath: '',
      size: 0,
      mimeType: '',
      error: 'All upload service URLs failed',
    };
  }

  /**
   * Generic file upload with Sharp processing
   */
  private async uploadFile(
    buffer: Buffer,
    originalName: string,
    tenantSlug: string,
    category: string,
    options: {
      subFolder?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<UploadResult> {
    const candidateUrls = getCandidateUrls();
    
    for (const baseUrl of candidateUrls) {
      try {
        const form = new FormData();
        form.append('file', buffer, {
          filename: originalName,
          contentType: 'application/octet-stream',
        });
        form.append('tenantSlug', tenantSlug);
        form.append('category', category);
        
        if (options.subFolder) {
          form.append('subFolder', options.subFolder);
        }
        if (options.quality) {
          form.append('quality', options.quality.toString());
        }
        if (options.maxWidth) {
          form.append('maxWidth', options.maxWidth.toString());
        }
        if (options.maxHeight) {
          form.append('maxHeight', options.maxHeight.toString());
        }
        if (options.format) {
          form.append('format', options.format);
        }

        // Create a dedicated axios instance for this candidate URL
        const instance = axios.create({
          baseURL: baseUrl,
          timeout: 30000,
          headers: {
            ...(UPLOADS_SERVICE_API_KEY && { 'X-API-Key': UPLOADS_SERVICE_API_KEY }),
          },
        });

        const response = await instance.post('/api/upload/image', form, {
          headers: form.getHeaders(),
          timeout: 30000,
        });

        console.log('[UPLOAD] Raw response from', baseUrl, ':', {
          hasSuccess: response.data.hasOwnProperty('success'),
          success: response.data.success,
          hasData: response.data.hasOwnProperty('data'),
          keys: Object.keys(response.data)
        });

        // Handle both response formats: {success: true, data: {...}} or just {...}
        if (response.data.success && response.data.data) {
          // Standard format: {success: true, data: result}
          return response.data.data;
        } else if (response.data.urlPath) {
          // Direct format: the response IS the result object
          return response.data;
        } else {
          return {
            success: false,
            filename: '',
            path: '',
            urlPath: '',
            size: 0,
            mimeType: '',
            error: response.data.message || response.data.error || 'Upload failed',
          };
        }
      } catch (error: any) {
        console.warn(`[UPLOAD] Upload failed for ${baseUrl}:`, error.message);
        // Try next URL
      }
    }
    
    return {
      success: false,
      filename: '',
      path: '',
      urlPath: '',
      size: 0,
      mimeType: '',
      error: 'All upload service URLs failed',
    };
  }

  /**
   * Upload raw file without Sharp processing (for PDFs, Excel, etc.)
   */
  private async uploadRawFile(
    buffer: Buffer,
    originalName: string,
    tenantSlug: string,
    category: string,
    subFolder?: string
  ): Promise<UploadResult> {
    try {
      const form = new FormData();
      form.append('file', buffer, {
        filename: originalName,
        contentType: 'application/octet-stream',
      });
      form.append('tenantSlug', tenantSlug);
      form.append('category', category);
      
      if (subFolder) {
        form.append('subFolder', subFolder);
      }

      const response = await this.axiosInstance.post('/api/upload/document', form, {
        headers: form.getHeaders(),
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        return {
          success: false,
          filename: '',
          path: '',
          urlPath: '',
          size: 0,
          mimeType: '',
          error: response.data.message || 'Upload failed',
        };
      }
    } catch (error: any) {
      console.error('Upload error:', error.message);
      return {
        success: false,
        filename: '',
        path: '',
        urlPath: '',
        size: 0,
        mimeType: '',
        error: error.message,
      };
    }
  }

  /**
   * Create tenant folders
   */
  async createTenantFolders(tenantSlug: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(`/api/tenants/${tenantSlug}/folders`);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to create tenant folders:', error.message);
      return false;
    }
  }

  /**
   * Check if tenant folder exists
   */
  async tenantFolderExists(tenantSlug: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(`/api/tenants/${tenantSlug}/folders/exists`);
      return response.data.exists;
    } catch (error: any) {
      console.error('Failed to check tenant folder:', error.message);
      return false;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete('/api/files', {
        params: { filePath },
      });
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to delete file:', error.message);
      return false;
    }
  }

  /**
   * Upload from file path
   */
  async uploadFromFile(
    filePath: string,
    tenantSlug: string,
    type: 'signature' | 'document' | 'image' | 'logo' | 'pdf' | 'excel',
    category?: string,
    subFolder?: string
  ): Promise<UploadResult> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const filename = path.basename(filePath);

      switch (type) {
        case 'signature':
          return this.uploadSignature(buffer, filename, tenantSlug);
        case 'document':
          return this.uploadDocument(buffer, filename, tenantSlug, subFolder);
        case 'image':
          return this.uploadImage(buffer, filename, tenantSlug, category || 'images', subFolder);
        case 'logo':
          return this.uploadTenantLogo(buffer, filename, tenantSlug);
        case 'pdf':
          return this.uploadPDF(buffer, filename, tenantSlug, subFolder);
        case 'excel':
          return this.uploadExcel(buffer, filename, tenantSlug, subFolder);
        default:
          return this.uploadFile(buffer, filename, tenantSlug, category || 'general', {
            format: 'webp',
          } as any);
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error.message);
      return {
        success: false,
        filename: '',
        path: '',
        urlPath: '',
        size: 0,
        mimeType: '',
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const centralizedUploadService = new CentralizedUploadService();
export default centralizedUploadService;