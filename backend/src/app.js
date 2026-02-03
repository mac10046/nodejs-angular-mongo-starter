const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const routes = require('./routes');
const { configurePassport, createTransporter } = require('./config');
const { errorHandler, notFound, generalLimiter } = require('./middleware');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const {
  helmetConfig,
  getCorsConfig,
  additionalSecurityHeaders,
  sanitizeInput,
  sqlInjectionGuard,
} = require('./config/security');

/**
 * Create Express application
 */
const createApp = () => {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Disable X-Powered-By header
  app.disable('x-powered-by');

  // Request logging (early in middleware chain)
  app.use(requestLogger);

  // Security middleware - OWASP compliant headers
  app.use(helmet(helmetConfig));

  // Additional custom security headers
  app.use(additionalSecurityHeaders);

  // CORS configuration
  app.use(cors(getCorsConfig()));

  // Body parsing middleware with size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Cookie parser
  app.use(cookieParser());

  // Input sanitization (XSS prevention)
  app.use(sanitizeInput);

  // SQL injection detection
  app.use(sqlInjectionGuard);

  // Initialize Passport
  app.use(passport.initialize());
  configurePassport();

  // Initialize email transporter
  createTransporter();

  // Rate limiting
  app.use('/api', generalLimiter);

  // API routes
  app.use('/api', routes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Product Name API',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      docs: '/api/health',
    });
  });

  // Health check for PM2/load balancers
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestId: req.requestId,
    });
  });

  // Security headers check endpoint (for testing)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/security-headers', (req, res) => {
      const headers = {};
      const securityHeaders = [
        'content-security-policy',
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
      ];

      // Get response headers that will be sent
      securityHeaders.forEach((header) => {
        const value = res.getHeader(header);
        if (value) headers[header] = value;
      });

      res.json({
        success: true,
        message: 'Security headers configuration',
        headers,
        note: 'This endpoint is only available in development',
      });
    });
  }

  // PM2 ready signal
  if (process.env.PM2_HOME) {
    process.send && process.send('ready');
  }

  // 404 handler
  app.use(notFound);

  // Error logging middleware
  app.use(errorLogger);

  // Global error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
