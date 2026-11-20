/**
 * Global File Storage Service
 *
 * Re-export from shared-services package for backward compatibility.
 * This file exists at the legacy path `services/global/services/fileStorageService.ts`
 * and re-exports from `packages/shared-services/src/fileStorageService.ts`.
 */

export type {
  MulterFile,
  TenantFolderInfo,
  UploadConfig,
  UploadedFile,
} from '../packages/shared-services/src/fileStorageService';
export {
  default,
  FileType,
  FolderCategory,
  fileStorageService,
} from '../packages/shared-services/src/fileStorageService';
