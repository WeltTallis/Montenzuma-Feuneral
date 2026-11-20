declare module '../../../services/app-global/middlewares/authMiddleware' {
  import { Request, Response, NextFunction } from 'express';
  
  export function optionalAuth(req: Request, res: Response, next: NextFunction): void;
  export function requireAuth(req: Request, res: Response, next: NextFunction): void;
}