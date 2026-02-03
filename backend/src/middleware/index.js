const { protect, optionalAuth, requireEmailVerified } = require('./auth');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  updateProfileValidation,
} = require('./validators');
const { AppError, errorHandler, notFound, asyncHandler } = require('./errorHandler');
const {
  generalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
} = require('./rateLimiter');
const {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAdmin,
  requireSuperAdmin,
  attachPermissions,
  canModifyUser,
} = require('./rbac');
const { requestLogger, errorLogger } = require('./requestLogger');

module.exports = {
  // Auth middleware
  protect,
  optionalAuth,
  requireEmailVerified,

  // RBAC middleware
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAdmin,
  requireSuperAdmin,
  attachPermissions,
  canModifyUser,

  // Validators
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  updateProfileValidation,

  // Error handling
  AppError,
  errorHandler,
  notFound,
  asyncHandler,

  // Logging
  requestLogger,
  errorLogger,

  // Rate limiters
  generalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
};
