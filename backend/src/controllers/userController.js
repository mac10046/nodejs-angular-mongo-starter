const { authService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * User Controller
 * Handles user profile operations
 */

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
};
