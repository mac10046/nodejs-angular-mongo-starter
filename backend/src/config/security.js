/**
 * Security Configuration
 * OWASP Top 10 compliant security headers and settings
 */

/**
 * Helmet.js configuration for security headers
 * Reference: https://owasp.org/www-project-secure-headers/
 */
const helmetConfig = {
  // Content-Security-Policy
  // Prevents XSS attacks by specifying valid sources of content
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust for your needs
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
    reportOnly: process.env.NODE_ENV !== 'production', // Report-only in dev
  },

  // X-DNS-Prefetch-Control
  // Controls browser DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Frame-Options (via frameguard)
  // Prevents clickjacking attacks
  frameguard: {
    action: 'deny',
  },

  // Strict-Transport-Security
  // Forces HTTPS connections
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  noSniff: true,

  // X-XSS-Protection (legacy but still useful)
  // Enables browser XSS filtering
  xssFilter: true,

  // Referrer-Policy
  // Controls referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies
  // Restricts Adobe Flash and PDF cross-domain policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // X-Download-Options
  // Prevents IE from executing downloads in site's context
  ieNoOpen: true,

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Set to true if needed

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-Origin-Resource-Policy
  // Use 'cross-origin' in development to allow requests from frontend/admin
  crossOriginResourcePolicy: {
    policy: process.env.NODE_ENV === 'production' ? 'same-origin' : 'cross-origin',
  },

  // Origin-Agent-Cluster
  originAgentCluster: true,
};

/**
 * CORS configuration
 */
const getCorsConfig = () => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:4200',
    process.env.ADMIN_URL || 'http://localhost:4300',
  ];

  // Add additional origins from environment (comma-separated)
  if (process.env.ADDITIONAL_ORIGINS) {
    allowedOrigins.push(...process.env.ADDITIONAL_ORIGINS.split(',').map((o) => o.trim()));
  }

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const logger = require('../utils/logger');
        logger.logSecurity('cors_blocked', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours preflight cache
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };
};

/**
 * Cookie security configuration
 */
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Session configuration (if using sessions)
 */
const sessionConfig = {
  name: 'sessionId', // Don't use default 'connect.sid'
  secret: process.env.SESSION_SECRET || process.env.JWT_ACCESS_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    ...cookieConfig,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * Additional security middleware
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Permissions-Policy (formerly Feature-Policy)
  // Controls browser features
  res.setHeader(
    'Permissions-Policy',
    [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()', // Opt out of FLoC
    ].join(', ')
  );

  // Cache-Control for API responses
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Add request ID for tracing
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize common XSS vectors from request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential script tags and event handlers
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

/**
 * SQL Injection prevention patterns (for logging/blocking)
 */
const sqlInjectionPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
];

/**
 * Check for SQL injection attempts
 */
const detectSqlInjection = (value) => {
  if (typeof value !== 'string') return false;
  return sqlInjectionPatterns.some((pattern) => pattern.test(value));
};

/**
 * SQL injection detection middleware
 */
const sqlInjectionGuard = (req, res, next) => {
  const checkValues = [
    ...Object.values(req.query || {}),
    ...Object.values(req.params || {}),
    ...(typeof req.body === 'object' ? Object.values(req.body || {}) : []),
  ];

  const suspiciousValue = checkValues.find((val) => detectSqlInjection(val));

  if (suspiciousValue) {
    const logger = require('../utils/logger');
    logger.logSecurity('sql_injection_attempt', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      value: suspiciousValue.substring(0, 100), // Limit logged value
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid request',
    });
  }

  next();
};

module.exports = {
  helmetConfig,
  getCorsConfig,
  cookieConfig,
  sessionConfig,
  additionalSecurityHeaders,
  sanitizeInput,
  sqlInjectionGuard,
  generateRequestId,
};
