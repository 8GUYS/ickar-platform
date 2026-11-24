import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import { authRouter } from './routes/auth.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { streamingRouter } from './routes/streaming.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { googlePlayRouter } from './routes/google-play.routes.js';
import { appleIapRouter } from './routes/apple-iap.routes.js';
import { downloaderRouter } from './routes/downloader.routes.js';

// ============================================================
// Bootstrap admin user (dev only)
// ============================================================
import { createUser, findUserByEmail } from './store.js';
import bcrypt from 'bcryptjs';

(async () => {
  if (!findUserByEmail('admin@ickar.ng')) {
    const passwordHash = await bcrypt.hash('ickar_admin_2026', 12);
    createUser({ email: 'admin@ickar.ng', passwordHash, name: 'ICKAR Admin', role: 'admin' });
    console.log('[BOOTSTRAP] ✅ Admin user seeded: admin@ickar.ng / ickar_admin_2026');
  }
})();

// ============================================================
// App setup
// ============================================================
const app = express();
const PORT = process.env.PORT || 3001;

// Security middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// Rate limiting — global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Paystack webhook MUST receive raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Routes
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'ICKAR API',
    version: '1.0.0-sprint1',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stream', streamingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/downloader', downloaderRouter);
app.use('/api/webhooks/google-play', googlePlayRouter);
app.use('/api/webhooks/apple-iap', appleIapRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ICKAR API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Catalog:      http://localhost:${PORT}/api/catalog`);
  console.log(`   Auth:         http://localhost:${PORT}/api/auth`);
  console.log(`   Admin:        http://localhost:${PORT}/api/admin\n`);
});
