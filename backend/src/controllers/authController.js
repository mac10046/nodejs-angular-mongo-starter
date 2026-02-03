const passport = require('passport');
const { authService, tokenService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * Authentication Controller
 * Handles user authentication endpoints
 */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register({ name, email, password });

  res.status(201).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
    },
  });
});

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  await authService.logout(refreshToken);

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires refresh token cookie)
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken;

  if (!refreshTokenValue) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token provided',
    });
  }

  const result = await authService.refreshAccessToken(refreshTokenValue);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    },
  });
});

/**
 * @desc    Initiate Google OAuth
 * @route   GET /api/auth/google
 * @access  Public
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error('Google auth error:', err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth-callback?error=${encodeURIComponent('Authentication failed')}`
        );
      }

      if (!user) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth-callback?error=${encodeURIComponent('Authentication failed')}`
        );
      }

      // Generate tokens
      const result = await authService.googleAuth(user);

      // Create refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with access token
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-callback?token=${result.accessToken}&expiresIn=${result.expiresIn}`
      );
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-callback?error=${encodeURIComponent('Authentication failed')}`
      );
    }
  })(req, res, next);
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const result = await authService.verifyEmail(token);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.resendVerificationEmail(email);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  googleAuth,
  googleAuthCallback,
  verifyEmail,
  resendVerification,
  getMe,
};
