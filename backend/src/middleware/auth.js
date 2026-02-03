const { tokenService } = require('../services');
const { User } = require('../models');

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request
 */

/**
 * Protect routes - require valid access token
 */
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please log in again.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token',
    });
  }
};

/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

/**
 * Require email verification
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this resource',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireEmailVerified,
};
