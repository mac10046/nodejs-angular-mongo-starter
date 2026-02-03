const mongoose = require('mongoose');

/**
 * Role Schema
 * Defines user roles and their associated permissions
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      uppercase: true,
      enum: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
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
    permissions: [
      {
        type: String,
        // Stores permission names like 'users:read', not ObjectIds
      },
    ],
    // Hierarchy level (higher = more privileges)
    level: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // System roles cannot be deleted
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

// Static method to get default permissions for a role
roleSchema.statics.getDefaultPermissions = function (roleName) {
  const defaultPermissions = {
    USER: [
      'profile:read',
      'profile:update',
      'password:change',
    ],
    MODERATOR: [
      'profile:read',
      'profile:update',
      'password:change',
      'users:read',
      'users:list',
    ],
    ADMIN: [
      'profile:read',
      'profile:update',
      'password:change',
      'users:read',
      'users:list',
      'users:create',
      'users:update',
      'users:delete',
      'roles:read',
      'admin:access',
    ],
    SUPER_ADMIN: [
      'profile:read',
      'profile:update',
      'password:change',
      'users:read',
      'users:list',
      'users:create',
      'users:update',
      'users:delete',
      'roles:read',
      'roles:create',
      'roles:update',
      'roles:delete',
      'permissions:read',
      'permissions:manage',
      'admin:access',
      'system:manage',
    ],
  };

  return defaultPermissions[roleName] || [];
};

// Static method to seed default roles
roleSchema.statics.seedDefaultRoles = async function () {
  const defaultRoles = [
    {
      name: 'USER',
      displayName: 'User',
      description: 'Regular user with basic permissions',
      level: 1,
      isSystem: true,
    },
    {
      name: 'MODERATOR',
      displayName: 'Moderator',
      description: 'Moderator with limited admin access',
      level: 2,
      isSystem: true,
    },
    {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Administrator with full user management access',
      level: 3,
      isSystem: true,
    },
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Super admin with full system access',
      level: 4,
      isSystem: true,
    },
  ];

  for (const roleData of defaultRoles) {
    const existing = await this.findOne({ name: roleData.name });
    if (!existing) {
      roleData.permissions = this.getDefaultPermissions(roleData.name);
      await this.create(roleData);
    }
  }
};

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
