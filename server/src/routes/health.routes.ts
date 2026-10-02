import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ColorBook AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
