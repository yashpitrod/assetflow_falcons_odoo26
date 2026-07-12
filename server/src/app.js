// src/app.js
import express from 'express';
import cors from 'cors';

// Import Utilities & Middleware
import { errorResponse } from './utils/responseFormatter.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import allocationsRoutes from './routes/allocations.routes.js';
import transferRequestsRoutes from './routes/transferRequests.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';

const app = express();

// Global Middleware
// Restrict CORS to the frontend URL only — wildcard would allow any site to call our API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Parse incoming JSON, limit body size to prevent payload attacks

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/transfer-requests', transferRequestsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Fallback route for 404 Not Found
app.use((req, res) => {
  return errorResponse(res, 404, 'API endpoint not found');
});

// Central Error Handler Middleware (Must be the last app.use)
app.use(errorHandler);

export default app;