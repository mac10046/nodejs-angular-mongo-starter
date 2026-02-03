const express = require('express');
const router = express.Router();
const { passwordController } = require('../controllers');
const {
  protect,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  passwordResetLimiter,
} = require('../middleware');

/**
 * Password Routes
 * Base path: /api/password
 */

// @route   POST /api/password/forgot
// @desc    Request password reset email
// @access  Public
router.post('/forgot', passwordResetLimiter, forgotPasswordValidation, passwordController.forgotPassword);

// @route   POST /api/password/reset/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset/:token', resetPasswordValidation, passwordController.resetPassword);

// @route   PUT /api/password/change
// @desc    Change password for authenticated user
// @access  Private
router.put('/change', protect, changePasswordValidation, passwordController.changePassword);

module.exports = router;
