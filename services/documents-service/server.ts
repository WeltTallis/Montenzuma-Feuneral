import * as globalErrorHandler from '../app-global/middlewares/errorHandler';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';

import documentRouter, { GLOBAL_UPLOADS_DIR } from './routes/documentRoutes';

const app = express();
const PORT = Number(process.env.PORT || 8112);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id'],
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, _res, next) => {
  req.tenantSlug = req.tenantSlug || String(req.headers['x-tenant-slug'] || req.headers['x-tenant-id'] || 'system_shared');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'documents-service', tenant: req.tenantSlug });
});

app.use('/uploads', express.static(GLOBAL_UPLOADS_DIR, {
  setHeaders: response => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

app.use('/api/v1/restpoint/documents', documentRouter);
app.use('/v1/restpoint/documents', documentRouter);
app.use('/documents', documentRouter);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error && (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_UNEXPECTED_FILE' || error instanceof multer.MulterError)) {
    return res.status(400).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 50MB limit.' : error.message,
    });
  }
  if (error?.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  next(error);
});

app.use(globalErrorHandler.notFoundHandler);
app.use(globalErrorHandler.errorHandler);

async function startServer(): Promise<void> {
  try {
    if (!fs.existsSync(GLOBAL_UPLOADS_DIR)) fs.mkdirSync(GLOBAL_UPLOADS_DIR, { recursive: true });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[DOCUMENTS] Server running on port ${PORT}`);
      console.log(`[DOCUMENTS] Uploads Directory: ${GLOBAL_UPLOADS_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) void startServer();

export default app;
