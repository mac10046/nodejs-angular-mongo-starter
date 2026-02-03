const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { protect, updateProfileValidation } = require('../middleware');

/**
 * User Routes
 * Base path: /api/users
 */

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, userController.getProfile);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, updateProfileValidation, userController.updateProfile);

module.exports = router;
