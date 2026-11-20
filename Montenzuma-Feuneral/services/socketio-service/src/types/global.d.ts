/**
 * SocketIO Service Global Type Declarations
 */

// Make this file a module so module augmentations work
export {};

declare module 'express' {
  interface Request {
    tenantSlug?: string;
    tenantId?: number;
  }
}
