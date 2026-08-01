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

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const UPLOADS_SERVICE_URL = process.env.UPLOADS_SERVICE_URL || 'http://localhost:5012';
const UPLOADS_SERVICE_API_KEY = process.env.UPLOADS_SERVICE_API_KEY;

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
  private axiosInstance: axios.AxiosInstance;

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
    return this.uploadFile(buffer, filename, tenantSlug, 'signatures', {
      quality: 85,
      maxWidth: 800,
      maxHeight: 300,
      format: 'webp',
      ...options,
    });
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

      const response = await this.axiosInstance.post('/api/upload/image', form, {
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