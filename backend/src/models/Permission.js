const mongoose = require('mongoose');

/**
 * Permission Schema
 * Defines granular permissions for RBAC
 *
 * Permission naming convention: resource:action
 * Examples:
 * - users:read - Read user data
 * - users:create - Create new users
 * - users:update - Update user data
 * - users:delete - Delete users
 * - admin:access - Access admin panel
 */
const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z]+:[a-z]+$/, 'Permission must be in format resource:action'],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ['create', 'read', 'update', 'delete', 'list', 'manage', 'access', 'change'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // System permissions cannot be deleted
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
permissionSchema.index({ name: 1 });
permissionSchema.index({ resource: 1, action: 1 });

// Pre-save middleware to extract resource and action from name
permissionSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const [resource, action] = this.name.split(':');
    this.resource = resource;
    this.action = action;
  }
  next();
});

// Static method to seed default permissions
permissionSchema.statics.seedDefaultPermissions = async function () {
  const defaultPermissions = [
    // Profile permissions
    { name: 'profile:read', displayName: 'View Profile', description: 'View own profile', isSystem: true },
    { name: 'profile:update', displayName: 'Update Profile', description: 'Update own profile', isSystem: true },

    // Password permissions
    { name: 'password:change', displayName: 'Change Password', description: 'Change own password', isSystem: true },

    // User management permissions
    { name: 'users:read', displayName: 'View Users', description: 'View user details', isSystem: true },
    { name: 'users:list', displayName: 'List Users', description: 'List all users', isSystem: true },
    { name: 'users:create', displayName: 'Create Users', description: 'Create new users', isSystem: true },
    { name: 'users:update', displayName: 'Update Users', description: 'Update user details', isSystem: true },
    { name: 'users:delete', displayName: 'Delete Users', description: 'Delete users', isSystem: true },

    // Role management permissions
    { name: 'roles:read', displayName: 'View Roles', description: 'View role details', isSystem: true },
    { name: 'roles:create', displayName: 'Create Roles', description: 'Create new roles', isSystem: true },
    { name: 'roles:update', displayName: 'Update Roles', description: 'Update role details', isSystem: true },
    { name: 'roles:delete', displayName: 'Delete Roles', description: 'Delete roles', isSystem: true },

    // Permission management
    { name: 'permissions:read', displayName: 'View Permissions', description: 'View permissions', isSystem: true },
    { name: 'permissions:manage', displayName: 'Manage Permissions', description: 'Manage permissions', isSystem: true },

    // Admin access
    { name: 'admin:access', displayName: 'Admin Panel Access', description: 'Access admin panel', isSystem: true },

    // System management
    { name: 'system:manage', displayName: 'System Management', description: 'Manage system settings', isSystem: true },
  ];

  for (const permData of defaultPermissions) {
    const [resource, action] = permData.name.split(':');
    const existing = await this.findOne({ name: permData.name });
    if (!existing) {
      await this.create({
        ...permData,
        resource,
        action,
      });
    }
  }
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
