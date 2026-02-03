const { passwordService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * Password Controller
 * Handles password reset and change endpoints
 */

/**
 * @desc    Request password reset email
 * @route   POST /api/password/forgot
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await passwordService.forgotPassword(email);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/password/reset/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const result = await passwordService.resetPassword(token, password);

  // Clear any existing refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Change password for authenticated user
 * @route   PUT /api/password/change
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const result = await passwordService.changePassword(userId, currentPassword, newPassword);

  // Clear refresh token cookie to force re-login
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  forgotPassword,
  resetPassword,
  changePassword,
};
