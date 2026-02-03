const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    // RBAC: Role-based access control
    role: {
      type: String,
      enum: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
      default: 'USER',
    },
    // Custom permissions (in addition to role permissions)
    customPermissions: [
      {
        type: String,
      },
    ],
    // Denied permissions (override role permissions)
    deniedPermissions: [
      {
        type: String,
      },
    ],
    passwordChangedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  // Skip if no password (OAuth users)
  if (!this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update passwordChangedAt when password changes
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check (e.g., 'users:read')
 * @returns {boolean}
 */
userSchema.methods.hasPermission = async function (permission) {
  const Role = mongoose.model('Role');

  // Check if permission is explicitly denied
  if (this.deniedPermissions && this.deniedPermissions.includes(permission)) {
    return false;
  }

  // Check custom permissions first
  if (this.customPermissions && this.customPermissions.includes(permission)) {
    return true;
  }

  // Get role and check permissions
  const role = await Role.findOne({ name: this.role });
  if (role && role.permissions.includes(permission)) {
    return true;
  }

  return false;
};

/**
 * Get all effective permissions for the user
 * @returns {Promise<string[]>}
 */
userSchema.methods.getEffectivePermissions = async function () {
  const Role = mongoose.model('Role');

  // Get role permissions
  const role = await Role.findOne({ name: this.role });
  let permissions = role ? [...role.permissions] : [];

  // Add custom permissions
  if (this.customPermissions) {
    permissions = [...new Set([...permissions, ...this.customPermissions])];
  }

  // Remove denied permissions
  if (this.deniedPermissions) {
    permissions = permissions.filter((p) => !this.deniedPermissions.includes(p));
  }

  return permissions;
};

/**
 * Check if user has admin access
 */
userSchema.methods.isAdmin = function () {
  return ['ADMIN', 'SUPER_ADMIN'].includes(this.role);
};

/**
 * Check if user is super admin
 */
userSchema.methods.isSuperAdmin = function () {
  return this.role === 'SUPER_ADMIN';
};

/**
 * Check if user's role level is higher than another role
 * @param {string} otherRole - Role to compare
 */
userSchema.methods.hasHigherRoleThan = async function (otherRole) {
  const Role = mongoose.model('Role');
  const [myRole, theirRole] = await Promise.all([
    Role.findOne({ name: this.role }),
    Role.findOne({ name: otherRole }),
  ]);

  return myRole && theirRole && myRole.level > theirRole.level;
};

// Return user without sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Virtual for checking if user can access admin panel
userSchema.virtual('canAccessAdmin').get(function () {
  return ['ADMIN', 'SUPER_ADMIN'].includes(this.role);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
