const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
  protect,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  canModifyUser,
} = require('../middleware');

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require authentication and admin access
 */

// Apply authentication and admin check to all routes
router.use(protect);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', adminController.getDashboard);

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin (requires users:list permission)
router.get('/users', requirePermission('users:list'), adminController.getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Admin (requires users:read permission)
router.get('/users/:id', requirePermission('users:read'), adminController.getUser);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin (requires users:update permission and higher role)
router.put(
  '/users/:id',
  requirePermission('users:update'),
  canModifyUser,
  adminController.updateUser
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin (requires users:delete permission and higher role)
router.delete(
  '/users/:id',
  requirePermission('users:delete'),
  canModifyUser,
  adminController.deleteUser
);

// @route   GET /api/admin/roles
// @desc    Get all roles
// @access  Admin (requires roles:read permission)
router.get('/roles', requirePermission('roles:read'), adminController.getRoles);

// @route   PUT /api/admin/roles/:id
// @desc    Update a role
// @access  Super Admin only
router.put('/roles/:id', requireSuperAdmin, adminController.updateRole);

// @route   GET /api/admin/permissions
// @desc    Get all permissions
// @access  Admin (requires permissions:read permission)
router.get('/permissions', requirePermission('permissions:read'), adminController.getPermissions);

// @route   POST /api/admin/permissions
// @desc    Create a new permission
// @access  Super Admin only
router.post('/permissions', requireSuperAdmin, adminController.createPermission);

// @route   PUT /api/admin/permissions/:id
// @desc    Update a permission
// @access  Super Admin only
router.put('/permissions/:id', requireSuperAdmin, adminController.updatePermission);

// @route   DELETE /api/admin/permissions/:id
// @desc    Delete a permission
// @access  Super Admin only
router.delete('/permissions/:id', requireSuperAdmin, adminController.deletePermission);

// @route   POST /api/admin/seed
// @desc    Seed default roles and permissions
// @access  Super Admin only
router.post('/seed', requireSuperAdmin, adminController.seedDefaults);

module.exports = router;
