const { User, Role, Permission } = require('../models');
const { asyncHandler, AppError } = require('../middleware');
const logger = require('../utils/logger');

/**
 * Admin Controller
 * Handles admin panel operations
 */

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, verifiedUsers, roleStats, providerStats, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isEmailVerified: true }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: '$authProvider', count: { $sum: 1 } } },
    ]),
    User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  // Format role stats
  const usersByRole = roleStats.map((stat) => ({
    role: stat._id,
    count: stat.count,
  }));

  // Format provider stats
  const usersByProvider = providerStats.map((stat) => ({
    provider: stat._id,
    count: stat.count,
  }));

  res.json({
    success: true,
    data: {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      usersByRole,
      usersByProvider,
      recentUsers,
    },
  });
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role.toUpperCase();
  }

  // Filter by status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Filter by email verification
  if (req.query.isEmailVerified !== undefined) {
    query.isEmailVerified = req.query.isEmailVerified === 'true';
  }

  // Filter by auth provider
  if (req.query.authProvider) {
    query.authProvider = req.query.authProvider;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Get user's effective permissions
  const permissions = await user.getEffectivePermissions();

  res.json({
    success: true,
    data: {
      user,
      permissions,
    },
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, isEmailVerified, customPermissions, deniedPermissions } = req.body;

  const user = req.targetUser || await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;
  if (customPermissions) user.customPermissions = customPermissions;
  if (deniedPermissions) user.deniedPermissions = deniedPermissions;

  await user.save();

  logger.info({
    type: 'USER_UPDATED_BY_ADMIN',
    adminId: req.user._id.toString(),
    targetUserId: user._id.toString(),
    changes: req.body,
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = req.targetUser || await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Prevent deleting super admin
  if (user.role === 'SUPER_ADMIN') {
    throw new AppError('Cannot delete super admin', 403, 'CANNOT_DELETE_SUPER_ADMIN');
  }

  await User.findByIdAndDelete(user._id);

  logger.info({
    type: 'USER_DELETED_BY_ADMIN',
    adminId: req.user._id.toString(),
    deletedUserId: user._id.toString(),
    deletedUserEmail: user.email,
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Get all roles
 * @route   GET /api/admin/roles
 * @access  Admin
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({ isActive: true }).sort({ level: 1 });

  res.json({
    success: true,
    roles,
  });
});

/**
 * @desc    Update a role
 * @route   PUT /api/admin/roles/:id
 * @access  Super Admin
 */
const updateRole = asyncHandler(async (req, res) => {
  const { displayName, description, permissions } = req.body;

  const role = await Role.findById(req.params.id);
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  // Update fields
  if (displayName !== undefined) role.displayName = displayName;
  if (description !== undefined) role.description = description;
  if (permissions !== undefined) role.permissions = permissions;

  await role.save();

  logger.info({
    type: 'ROLE_UPDATED',
    adminId: req.user._id.toString(),
    roleId: role._id.toString(),
    roleName: role.name,
  });

  res.json({
    success: true,
    message: 'Role updated successfully',
    role,
  });
});

/**
 * @desc    Get all permissions
 * @route   GET /api/admin/permissions
 * @access  Admin
 */
const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find({ isActive: true }).sort({ resource: 1, action: 1 });

  res.json({
    success: true,
    permissions,
  });
});

/**
 * @desc    Create a new permission
 * @route   POST /api/admin/permissions
 * @access  Super Admin
 */
const createPermission = asyncHandler(async (req, res) => {
  const { name, resource, action, description } = req.body;

  // Check if permission already exists
  const existing = await Permission.findOne({ name });
  if (existing) {
    throw new AppError('Permission with this name already exists', 400, 'PERMISSION_EXISTS');
  }

  const permission = await Permission.create({
    name,
    resource: resource.toLowerCase(),
    action: action.toLowerCase(),
    description,
  });

  logger.info({
    type: 'PERMISSION_CREATED',
    adminId: req.user._id.toString(),
    permissionId: permission._id.toString(),
    permissionName: permission.name,
  });

  res.status(201).json({
    success: true,
    message: 'Permission created successfully',
    permission,
  });
});

/**
 * @desc    Update a permission
 * @route   PUT /api/admin/permissions/:id
 * @access  Super Admin
 */
const updatePermission = asyncHandler(async (req, res) => {
  const { description } = req.body;

  const permission = await Permission.findById(req.params.id);
  if (!permission) {
    throw new AppError('Permission not found', 404, 'PERMISSION_NOT_FOUND');
  }

  // Only allow updating description (name/resource/action are immutable)
  if (description !== undefined) {
    permission.description = description;
  }

  await permission.save();

  logger.info({
    type: 'PERMISSION_UPDATED',
    adminId: req.user._id.toString(),
    permissionId: permission._id.toString(),
  });

  res.json({
    success: true,
    message: 'Permission updated successfully',
    permission,
  });
});

/**
 * @desc    Delete a permission
 * @route   DELETE /api/admin/permissions/:id
 * @access  Super Admin
 */
const deletePermission = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);
  if (!permission) {
    throw new AppError('Permission not found', 404, 'PERMISSION_NOT_FOUND');
  }

  // Remove permission from all roles that have it
  await Role.updateMany(
    { permissions: permission._id },
    { $pull: { permissions: permission._id } }
  );

  // Remove from users' custom permissions
  await User.updateMany(
    { customPermissions: permission._id },
    { $pull: { customPermissions: permission._id } }
  );

  await User.updateMany(
    { deniedPermissions: permission._id },
    { $pull: { deniedPermissions: permission._id } }
  );

  await Permission.findByIdAndDelete(permission._id);

  logger.info({
    type: 'PERMISSION_DELETED',
    adminId: req.user._id.toString(),
    permissionId: permission._id.toString(),
    permissionName: permission.name,
  });

  res.json({
    success: true,
    message: 'Permission deleted successfully',
  });
});

/**
 * @desc    Seed default roles and permissions
 * @route   POST /api/admin/seed
 * @access  Super Admin
 */
const seedDefaults = asyncHandler(async (req, res) => {
  await Permission.seedDefaultPermissions();
  await Role.seedDefaultRoles();

  logger.info({
    type: 'DEFAULTS_SEEDED',
    adminId: req.user._id.toString(),
  });

  res.json({
    success: true,
    message: 'Default roles and permissions seeded successfully',
  });
});

module.exports = {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getRoles,
  updateRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  seedDefaults,
};
