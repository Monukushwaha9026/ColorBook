import './env.js';
import express from 'express';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { imageStorage } from './services/storage/local-image-storage.js';
import { pdfStorage } from './services/pdf/pdf-storage.js';
import { ImageProviderService } from './services/image/image-provider.service.js';
import { startDailyCleanupScheduler } from './services/cleanup/daily-cleanup.service.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file serving for stored coloring pages, printable PDFs, and uploaded references
app.use('/storage/images', express.static(imageStorage.getBaseDir()));
app.use('/api/storage/images', express.static(imageStorage.getBaseDir()));
app.use('/storage/pdfs', express.static(pdfStorage.getBaseDir()));
app.use('/api/storage/pdfs', express.static(pdfStorage.getBaseDir()));
app.use('/storage/references', express.static(imageStorage.getReferencesDir()));
app.use('/api/storage/references', express.static(imageStorage.getReferencesDir()));

// API Routes
app.use('/api', healthRouter);
app.use('/api/books', bookRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ColorBook AI Server listening on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  ImageProviderService.validateConfiguration();
  startDailyCleanupScheduler();
});
