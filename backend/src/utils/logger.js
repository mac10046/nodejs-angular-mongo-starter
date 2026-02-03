const winston = require('winston');
const path = require('path');

/**
 * Logger Configuration
 * Systematic logging with PM2 compatibility
 *
 * PM2 Integration:
 * - When running with PM2, logs are automatically captured from stdout/stderr
 * - Use: pm2 start ecosystem.config.js
 * - View logs: pm2 logs [app-name]
 * - Flush logs: pm2 flush
 *
 * Log Levels (from highest to lowest priority):
 * - error: Error events that might still allow the application to continue running
 * - warn: Potentially harmful situations
 * - info: Informational messages highlighting application progress
 * - http: HTTP request logging
 * - debug: Detailed debug information
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    // Handle case where message is an object or undefined
    let msg;
    if (typeof message === 'object' && message !== null) {
      msg = JSON.stringify(message);
    } else if (message === undefined || message === null) {
      // If no message, use type from metadata or stringify metadata
      msg = metadata.type || JSON.stringify(metadata);
      delete metadata.type; // Don't duplicate type in metadata
    } else {
      msg = message;
    }

    let log = `${timestamp} [${level.toUpperCase()}]: ${msg}`;

    // Add metadata if present (and has meaningful content)
    const metaKeys = Object.keys(metadata);
    if (metaKeys.length > 0 && !(metaKeys.length === 1 && metaKeys[0] === 'type')) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// JSON format for structured logging (useful for log aggregation services)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Define transports based on environment
const transports = [];

// Console transport - always enabled, PM2 captures this
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  })
);

// File transports - only in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // HTTP access log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

/**
 * Log error with context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (userId, requestId, etc.)
 */
logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context,
  });
};

/**
 * Log API request
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in ms
 */
logger.logRequest = (req, statusCode, responseTime) => {
  logger.http({
    method: req.method,
    url: req.originalUrl,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
  });
};

/**
 * Log security event
 * @param {string} event - Event type (login_failed, unauthorized_access, etc.)
 * @param {Object} details - Event details
 */
logger.logSecurity = (event, details = {}) => {
  logger.warn({
    type: 'SECURITY',
    event,
    ...details,
  });
};

/**
 * Log database operation
 * @param {string} operation - Operation type (query, insert, update, delete)
 * @param {string} collection - Collection name
 * @param {number} duration - Duration in ms
 */
logger.logDb = (operation, collection, duration) => {
  logger.debug({
    type: 'DATABASE',
    operation,
    collection,
    duration: `${duration}ms`,
  });
};

module.exports = logger;
