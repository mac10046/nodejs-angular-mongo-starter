const logger = require('../utils/logger');

/**
 * Request Logging Middleware
 * Logs all HTTP requests with timing and metadata
 */

const requestLogger = (req, res, next) => {
  // Skip logging for health checks to reduce noise
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  // Record start time
  const startTime = Date.now();

  // Generate request ID
  const requestId = generateRequestId();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  logger.debug({
    type: 'REQUEST_START',
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log request completion
    logger.logRequest(req, res.statusCode, responseTime);

    // Log slow requests
    if (responseTime > 3000) {
      logger.warn({
        type: 'SLOW_REQUEST',
        requestId,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      });
    }
  });

  // Capture response errors
  res.on('error', (error) => {
    logger.logError(error, {
      type: 'RESPONSE_ERROR',
      requestId,
      method: req.method,
      url: req.originalUrl,
    });
  });

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Error logging middleware
 * Must be placed after all routes
 */
const errorLogger = (err, req, res, next) => {
  // Log the error with context
  logger.logError(err, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?._id,
    body: sanitizeBody(req.body),
    query: req.query,
  });

  // Log security events
  if (err.statusCode === 401 || err.statusCode === 403) {
    logger.logSecurity(err.statusCode === 401 ? 'unauthorized_access' : 'forbidden_access', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
      userId: req.user?._id,
    });
  }

  next(err);
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return undefined;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token', 'secret'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  requestLogger,
  errorLogger,
};
