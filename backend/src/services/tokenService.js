const jwt = require('jsonwebtoken');
const { Token } = require('../models');

/**
 * Token Service
 * Handles JWT access tokens and refresh tokens
 */

class TokenService {
  /**
   * Generate JWT access token
   * @param {Object} user - User object
   * @returns {string} Access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      type: 'access',
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    });
  }

  /**
   * Generate refresh token and store in database
   * @param {Object} user - User object
   * @returns {Promise<string>} Refresh token
   */
  async generateRefreshToken(user) {
    // Parse expiry (e.g., "7d" -> 7)
    const expiryString = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    const expiryDays = parseInt(expiryString) || 7;

    const token = await Token.createRefreshToken(user._id, expiryDays);
    return token;
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Promise<Object>} Object containing accessToken and refreshToken
   */
  async generateTokenPair(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryInSeconds(process.env.ACCESS_TOKEN_EXPIRY || '15m'),
    };
  }

  /**
   * Verify JWT access token
   * @param {string} token - Access token
   * @returns {Object} Decoded payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<Object>} Token document with user
   */
  async verifyRefreshToken(token) {
    const tokenDoc = await Token.findByToken(token, 'refresh');

    if (!tokenDoc) {
      throw new Error('Invalid or expired refresh token');
    }

    return tokenDoc;
  }

  /**
   * Revoke refresh token
   * @param {string} token - Refresh token
   */
  async revokeRefreshToken(token) {
    await Token.deleteToken(token, 'refresh');
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   */
  async revokeAllUserTokens(userId) {
    await Token.deleteUserTokens(userId, 'refresh');
  }

  /**
   * Create verification token for email verification
   * @param {string} userId - User ID
   * @returns {Promise<string>} Verification token
   */
  async createVerificationToken(userId) {
    return Token.createVerificationToken(userId);
  }

  /**
   * Verify email verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Token document
   */
  async verifyVerificationToken(token) {
    const tokenDoc = await Token.findByToken(token, 'verification');

    if (!tokenDoc) {
      throw new Error('Invalid or expired verification token');
    }

    return tokenDoc;
  }

  /**
   * Create password reset token
   * @param {string} userId - User ID
   * @returns {Promise<string>} Reset token
   */
  async createPasswordResetToken(userId) {
    return Token.createPasswordResetToken(userId);
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Token document
   */
  async verifyPasswordResetToken(token) {
    const tokenDoc = await Token.findByToken(token, 'passwordReset');

    if (!tokenDoc) {
      throw new Error('Invalid or expired reset token');
    }

    return tokenDoc;
  }

  /**
   * Delete password reset token after use
   * @param {string} token - Reset token
   */
  async deletePasswordResetToken(token) {
    await Token.deleteToken(token, 'passwordReset');
  }

  /**
   * Convert expiry string to seconds
   * @param {string} expiry - Expiry string (e.g., "15m", "1h", "7d")
   * @returns {number} Expiry in seconds
   */
  getExpiryInSeconds(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}

module.exports = new TokenService();
