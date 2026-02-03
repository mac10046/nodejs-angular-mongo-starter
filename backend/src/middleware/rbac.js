const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * RBAC (Role-Based Access Control) Middleware
 * Provides role and permission-based route protection
 */

/**
 * Require specific role(s) to access a route
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 *
 * Usage:
 * router.get('/admin', protect, requireRole('ADMIN', 'SUPER_ADMIN'), handler);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.logSecurity('role_access_denied', {
        userId: req.user._id.toString(),
        requiredRoles: roles,
        userRole: req.user.role,
        url: req.originalUrl,
        ip: req.ip,
      });

      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
};

/**
 * Require specific permission(s) to access a route
 * @param {...string} permissions - Required permissions (e.g., 'users:read', 'users:delete')
 * @returns {Function} Express middleware
 *
 * Usage:
 * router.delete('/user/:id', protect, requirePermission('users:delete'), handler);
 */
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      // Check if user has all required permissions
      const permissionChecks = await Promise.all(
        permissions.map((permission) => req.user.hasPermission(permission))
      );

      const hasAllPermissions = permissionChecks.every((result) => result === true);

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter((_, index) => !permissionChecks[index]);

        logger.logSecurity('permission_denied', {
          userId: req.user._id.toString(),
          requiredPermissions: permissions,
          missingPermissions,
          userRole: req.user.role,
          url: req.originalUrl,
          ip: req.ip,
        });

        return next(
          new AppError(
            'You do not have permission to perform this action',
            403,
            'INSUFFICIENT_PERMISSION'
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require ANY of the specified permissions (OR logic)
 * @param {...string} permissions - Permissions (user needs at least one)
 * @returns {Function} Express middleware
 *
 * Usage:
 * router.get('/content', protect, requireAnyPermission('content:read', 'admin:access'), handler);
 */
const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      // Check if user has at least one of the permissions
      const permissionChecks = await Promise.all(
        permissions.map((permission) => req.user.hasPermission(permission))
      );

      const hasAnyPermission = permissionChecks.some((result) => result === true);

      if (!hasAnyPermission) {
        logger.logSecurity('permission_denied', {
          userId: req.user._id.toString(),
          requiredPermissions: permissions,
          userRole: req.user.role,
          url: req.originalUrl,
          ip: req.ip,
        });

        return next(
          new AppError(
            'You do not have permission to perform this action',
            403,
            'INSUFFICIENT_PERMISSION'
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require admin access (ADMIN or SUPER_ADMIN role)
 * @returns {Function} Express middleware
 *
 * Usage:
 * router.get('/admin/dashboard', protect, requireAdmin, handler);
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  if (!req.user.isAdmin()) {
    logger.logSecurity('admin_access_denied', {
      userId: req.user._id.toString(),
      userRole: req.user.role,
      url: req.originalUrl,
      ip: req.ip,
    });

    return next(
      new AppError(
        'Admin access required',
        403,
        'ADMIN_REQUIRED'
      )
    );
  }

  next();
};

/**
 * Require super admin access (SUPER_ADMIN role only)
 * @returns {Function} Express middleware
 *
 * Usage:
 * router.delete('/system/reset', protect, requireSuperAdmin, handler);
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  if (!req.user.isSuperAdmin()) {
    logger.logSecurity('super_admin_access_denied', {
      userId: req.user._id.toString(),
      userRole: req.user.role,
      url: req.originalUrl,
      ip: req.ip,
    });

    return next(
      new AppError(
        'Super admin access required',
        403,
        'SUPER_ADMIN_REQUIRED'
      )
    );
  }

  next();
};

/**
 * Attach user permissions to request object
 * Useful when you need to check permissions in the controller
 */
const attachPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      req.userPermissions = await req.user.getEffectivePermissions();
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can modify target user (for user management)
 * Users can only modify users with lower role levels
 */
const canModifyUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const targetUserId = req.params.userId || req.params.id;

    // Users can always modify themselves (for profile updates)
    if (targetUserId === req.user._id.toString()) {
      return next();
    }

    const User = require('../models/User');
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Check if current user has higher role level
    const canModify = await req.user.hasHigherRoleThan(targetUser.role);

    if (!canModify) {
      logger.logSecurity('user_modification_denied', {
        userId: req.user._id.toString(),
        targetUserId: targetUserId,
        userRole: req.user.role,
        targetRole: targetUser.role,
        url: req.originalUrl,
        ip: req.ip,
      });

      return next(
        new AppError(
          'You cannot modify a user with equal or higher privileges',
          403,
          'CANNOT_MODIFY_USER'
        )
      );
    }

    // Attach target user to request for use in controller
    req.targetUser = targetUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAdmin,
  requireSuperAdmin,
  attachPermissions,
  canModifyUser,
};
