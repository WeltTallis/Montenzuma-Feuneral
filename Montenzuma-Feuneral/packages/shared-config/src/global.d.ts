/**
 * Shared Config Global Type Declarations
 */

// Make this file a module so module augmentations work
export {};

declare module 'express' {
  interface Request {
    tenantId?: number;
    tenantSlug?: string;
    tenant?: import('./types').TenantRecord;
  }
}