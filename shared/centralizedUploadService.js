/**
 * Centralized upload service
 *
 * Re-export from shared-services package for backward compatibility.
 */
var __importDefault =
  (this && this.__importDefault) || ((mod) => (mod && mod.__esModule ? mod : { default: mod }));
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = exports.centralizedUploadService = void 0;
var centralizedUploadService_1 = require('../packages/shared-services/src/centralizedUploadService');
Object.defineProperty(exports, 'centralizedUploadService', {
  enumerable: true,
  get: () => centralizedUploadService_1.centralizedUploadService,
});
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: () => __importDefault(centralizedUploadService_1).default,
});
//# sourceMappingURL=centralizedUploadService.js.map
