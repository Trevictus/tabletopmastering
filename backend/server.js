/**
 * @fileoverview Tabletop Mastering API main server
 * @description Configures Express, middlewares, routes and MongoDB connection
 * @module server
 * @requires express
 * @requires cors
 * @requires helmet
 * @requires express-rate-limit
 * @requires morgan
 * @requires ./config/database
 * @requires Sentry
 */

require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { metricsMiddleware, metricsHandler } = require('./middlewares/metrics');
const { createLogger } = require('./utils/logger');

const logger = createLogger('Server');

// Import routes
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const gameRoutes = require('./routes/gameRoutes');
const matchRoutes = require('./routes/matchRoutes');

// Create Express application
const app = express();

// Initialize Sentry (v8+ API)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 0.2,
  integrations: [
    Sentry.expressIntegration(),
  ],
});

// Connect to database
connectDB();

// ============================================
// BASIC SECURITY
// ============================================

// Helmet.js - HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Necessary to load external images
}));

// Rate Limiting - Limit requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes',
  },
  standardHeaders: true, // Returns rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disables `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Stricter rate limiting for authentication (brute force prevention)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 login attempts per hour per IP
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply strict rate limiting to authentication routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// OTHER MIDDLEWARES
// ============================================

// Middlewares globales
app.use(cors({
  origin: function (origin, callback) {
    // Build list of allowed origins
    const allowedOrigins = [
      'http://localhost',
      'http://localhost:5173',
      'http://localhost:80',
      'http://127.0.0.1',
      'http://127.0.0.1:5173',
    ];

    // Add CLIENT_URL if defined (can have multiple URLs separated by comma)
    if (process.env.CLIENT_URL) {
      const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim());
      allowedOrigins.push(...clientUrls);
    }

    if (!origin) {
      // Allow requests without origin (like Postman, curl, etc.)
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      // Origin in allowed list
      callback(null, true);
    } else {
      // In production, also allow if origin matches server host
      // This helps when accessing by direct IP
      logger.warn('CORS blocked for origin', { origin, allowedOrigins });
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus metrics
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎲 Welcome to Tabletop Mastering API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      games: '/api/games',
      matches: '/api/matches',
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server running correctly',
    timestamp: new Date().toISOString(),
  });
});

// Welcome route for /api
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🎲 Welcome to Tabletop Mastering API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      games: '/api/games',
      matches: '/api/matches',
    },
  });
});

app.get('/sentry-test', (req, res) => {
  throw new Error('Test Sentry backend');
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/matches', matchRoutes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de errores de Sentry (v8+ API)
Sentry.setupExpressErrorHandler(app);

// Middleware para manejo de errores
app.use(errorHandler);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  logger.info('='.repeat(47));
  logger.info('   TABLETOP MASTERING API');
  logger.info('='.repeat(47));
  logger.info(`Server running in ${process.env.NODE_ENV} mode`);
  logger.info(`Port: ${PORT}`);
  logger.info(`URL: http://localhost:${PORT}`);
  logger.info(`Documentation: http://localhost:${PORT}/`);
  logger.info('-'.repeat(47));
});

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received, closing server...');
  server.close(() => {
    logger.info('Server closed successfully');
  });
});

module.exports = app;
