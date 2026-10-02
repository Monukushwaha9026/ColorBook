import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { bookRouter } from './routes/book.routes.js';
import { pageRouter, standalonePageRouter } from './routes/page.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { imageStorage } from './services/storage/local-image-storage.js';
import { ImageProviderService } from './services/image/image-provider.service.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

// Static file serving for stored coloring pages
app.use('/storage/images', express.static(imageStorage.getBaseDir()));
app.use('/api/storage/images', express.static(imageStorage.getBaseDir()));

// API Routes
app.use('/api', healthRouter);
app.use('/api/books', bookRouter);
app.use('/api/books/:bookId/pages', pageRouter);
app.use('/api/pages', standalonePageRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ColorBook AI Server listening on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  ImageProviderService.validateConfiguration();
});
