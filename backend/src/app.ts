import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import path from 'path';

const app = express();

// Static files
app.use('/uploads', (req, res, next) => {
  if (req.path.startsWith('/reports/')) {
    res.status(403).json({ success: false, message: 'Direct access to reports is forbidden. Use the download API.' });
    return;
  }
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Security
app.use(helmet());
app.use(cors({
  origin: config.env === 'development' 
    ? (origin: any, callback: any) => callback(null, true)
    : [config.cors.frontendUrl, config.cors.mobileUrl],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
