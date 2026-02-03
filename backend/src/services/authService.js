const { User, Token } = require('../models');
const tokenService = require('./tokenService');
const emailService = require('./emailService');

/**
 * Authentication Service
 * Handles user registration, login, and authentication flows
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Created user (without password)
   */
  async register({ name, email, password }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      const error = new Error('Email is already registered');
      error.statusCode = 400;
      throw error;
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: 'local',
      isEmailVerified: false,
    });

    // Try to send verification email (don't fail registration if email fails)
    let emailSent = false;
    try {
      const verificationToken = await tokenService.createVerificationToken(user._id);
      await emailService.sendVerificationEmail(user.email, verificationToken, user.name);
      emailSent = true;
    } catch (emailError) {
      // Log the error but don't fail registration
      const logger = require('../utils/logger');
      logger.warn('Failed to send verification email during registration', {
        userId: user._id,
        email: user.email,
        error: emailError.message,
      });
    }

    return {
      user: this.sanitizeUser(user),
      message: emailSent
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. Email verification is pending - you can request a new verification email later.',
      emailSent,
    };
  }

  /**
   * Login user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user registered with OAuth only
    if (!user.password && user.authProvider === 'google') {
      const error = new Error('Please login with Google');
      error.statusCode = 400;
      throw error;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if email is verified (skip in development if SKIP_EMAIL_VERIFICATION is set)
    const skipEmailVerification = process.env.NODE_ENV === 'development' && process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (!user.isEmailVerified && !skipEmailVerification) {
      const error = new Error('Please verify your email before logging in');
      error.statusCode = 403;
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error('Your account has been deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Handle Google OAuth login/registration
   * @param {Object} googleUser - User object from Passport Google strategy
   * @returns {Promise<Object>} User and tokens
   */
  async googleAuth(googleUser) {
    // Generate tokens for the user
    const tokens = await tokenService.generateTokenPair(googleUser);

    return {
      user: this.sanitizeUser(googleUser),
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const tokenDoc = await tokenService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(tokenDoc.userId);

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user);

    return {
      accessToken,
      expiresIn: tokenService.getExpiryInSeconds(process.env.ACCESS_TOKEN_EXPIRY || '15m'),
    };
  }

  /**
   * Logout user by revoking refresh token
   * @param {string} refreshToken - Refresh token to revoke
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Success message
   */
  async verifyEmail(token) {
    // Verify token
    const tokenDoc = await tokenService.verifyVerificationToken(token);

    // Find and update user
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // Delete the verification token
    await Token.deleteUserTokens(user._id, 'verification');

    // Try to send welcome email (don't fail verification if email fails)
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      const logger = require('../utils/logger');
      logger.warn('Failed to send welcome email', {
        userId: user._id,
        email: user.email,
        error: emailError.message,
      });
    }

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   * @param {string} email - User's email
   */
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a verification link has been sent', emailSent: false };
    }

    if (user.isEmailVerified) {
      const error = new Error('Email is already verified');
      error.statusCode = 400;
      throw error;
    }

    // Generate new verification token and try to send email
    try {
      const verificationToken = await tokenService.createVerificationToken(user._id);
      await emailService.sendVerificationEmail(user.email, verificationToken, user.name);
      return { message: 'Verification email has been sent', emailSent: true };
    } catch (emailError) {
      const logger = require('../utils/logger');
      logger.warn('Failed to resend verification email', {
        userId: user._id,
        email: user.email,
        error: emailError.message,
      });
      const error = new Error('Failed to send verification email. Please try again later or contact support.');
      error.statusCode = 500;
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'avatar'];
    const updates = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Sanitize user object (remove sensitive fields)
   * @param {Object} user - User document
   * @returns {Object} Sanitized user
   */
  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : { ...user };

    return {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      isEmailVerified: userObj.isEmailVerified,
      authProvider: userObj.authProvider,
      avatar: userObj.avatar,
      createdAt: userObj.createdAt,
    };
  }
}

module.exports = new AuthService();
