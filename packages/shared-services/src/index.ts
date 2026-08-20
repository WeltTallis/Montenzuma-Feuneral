/**
 * @file packages/shared-services/src/index.ts
 * CENTRALIZED: Exports all shared services
 */

import { fileStorageService, FolderCategory } from './fileStorageService';

export { fileStorageService, FolderCategory };
export { centralizedUploadService } from './centralizedUploadService';
export type { UploadResult, UploadOptions } from './centralizedUploadService';
export * from './centralizedUploadService';
export * from './redisService';
export * from './rabbitmqService';
