/**
 * Re-export from shared-services package for backward compatibility.
 * This keeps centralized upload calls available from the legacy shared path.
 */

export type { UploadResult, UploadOptions } from '../packages/shared-services/src/centralizedUploadService';
export {
  default,
  centralizedUploadService,
} from '../packages/shared-services/src/centralizedUploadService';
