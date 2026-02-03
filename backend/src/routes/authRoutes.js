const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const {
  protect,
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  authLimiter,
  registerLimiter,
  resendVerificationLimiter,
} = require('../middleware');

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, registerValidation, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidation, authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, authController.logout);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public (requires refresh token in cookie)
router.post('/refresh-token', authController.refreshToken);

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', authController.googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', authController.googleAuthCallback);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', verifyEmailValidation, authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  resendVerificationValidation,
  authController.resendVerification
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, authController.getMe);

module.exports = router;
