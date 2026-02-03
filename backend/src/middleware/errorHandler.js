const logger = require('../utils/logger');

/**
 * Global Error Handler Middleware
 * Handles all errors in the application with systematic logging
 */

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB CastError (invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Handle MongoDB duplicate key error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists. Please use another value.`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

// Handle MongoDB validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

// Handle JWT error
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');

// Handle JWT expired error
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

// Send error response for development
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    code: err.code,
    message: err.message,
    error: err,
    stack: err.stack,
    requestId: req.requestId,
  });
};

// Send error response for production
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      code: err.code || undefined,
      message: err.message,
      requestId: req.requestId,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.',
      requestId: req.requestId,
    });
  }
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  if (err.statusCode >= 500) {
    // Server errors - log as error
    logger.logError(err, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?._id?.toString(),
      ip: req.ip,
    });
  } else if (err.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn({
      type: 'CLIENT_ERROR',
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?._id?.toString(),
    });
  }

  // Log security-related errors
  if (err.statusCode === 401 || err.statusCode === 403) {
    logger.logSecurity(err.statusCode === 401 ? 'authentication_failed' : 'authorization_failed', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
      userId: req.user?._id?.toString(),
      code: err.code,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.create(err);
    error.message = err.message;
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.isOperational = err.isOperational;
    error.code = err.code;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404, 'NOT_FOUND');
  next(error);
};

// Async handler wrapper to catch errors in async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
};
