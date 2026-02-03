const { User, Token } = require('../models');
const tokenService = require('./tokenService');
const emailService = require('./emailService');
const bcrypt = require('bcryptjs');

/**
 * Password Service
 * Handles password reset and change operations
 */

class PasswordService {
  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise<Object>} Success message
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message to prevent email enumeration
    const successMessage = {
      message: 'If an account exists with this email, a password reset link has been sent',
    };

    if (!user) {
      return successMessage;
    }

    // Check if user registered with Google only (no password)
    if (user.authProvider === 'google' && !user.password) {
      // Don't reveal that the user exists, just return success
      return successMessage;
    }

    // Generate password reset token
    const resetToken = await tokenService.createPasswordResetToken(user._id);

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

    return successMessage;
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async resetPassword(token, newPassword) {
    // Verify the reset token
    const tokenDoc = await tokenService.verifyPasswordResetToken(token);

    // Find user
    const user = await User.findById(tokenDoc.userId).select('+password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if new password is same as old (if user has a password)
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        const error = new Error('New password must be different from your current password');
        error.statusCode = 400;
        throw error;
      }
    }

    // Update password
    user.password = newPassword;
    user.authProvider = user.authProvider === 'google' ? 'google' : 'local'; // Keep Google if linked
    await user.save();

    // Delete the reset token
    await tokenService.deletePasswordResetToken(token);

    // Revoke all refresh tokens for security
    await tokenService.revokeAllUserTokens(user._id);

    // Send password changed notification
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Change password for authenticated user
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user has a password (might be Google-only user)
    if (!user.password) {
      // Allow Google users to set a password
      user.password = newPassword;
      await user.save();

      // Send password changed notification
      await emailService.sendPasswordChangedEmail(user.email, user.name);

      return { message: 'Password has been set successfully. You can now login with email and password.' };
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const error = new Error('New password must be different from your current password');
      error.statusCode = 400;
      throw error;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens except current session (optional - for stricter security, revoke all)
    // For now, we'll revoke all tokens, requiring re-login on all devices
    await tokenService.revokeAllUserTokens(user._id);

    // Send password changed notification
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    return { message: 'Password changed successfully. Please log in again.' };
  }
}

module.exports = new PasswordService();
