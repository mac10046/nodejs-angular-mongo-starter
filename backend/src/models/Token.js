const mongoose = require('mongoose');
const crypto = require('crypto');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['refresh', 'verification', 'passwordReset'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index - auto delete expired tokens
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ token: 1 });

// Static method to generate a random token
tokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash a token for secure storage
tokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to create a verification token
tokenSchema.statics.createVerificationToken = async function (userId) {
  // Delete any existing verification tokens for this user
  await this.deleteMany({ userId, type: 'verification' });

  const token = this.generateToken();
  const hashedToken = this.hashToken(token);

  await this.create({
    userId,
    token: hashedToken,
    type: 'verification',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  return token; // Return unhashed token to send via email
};

// Static method to create a password reset token
tokenSchema.statics.createPasswordResetToken = async function (userId) {
  // Delete any existing password reset tokens for this user
  await this.deleteMany({ userId, type: 'passwordReset' });

  const token = this.generateToken();
  const hashedToken = this.hashToken(token);

  await this.create({
    userId,
    token: hashedToken,
    type: 'passwordReset',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  return token; // Return unhashed token to send via email
};

// Static method to create a refresh token
tokenSchema.statics.createRefreshToken = async function (userId, expiresInDays = 7) {
  const token = this.generateToken();
  const hashedToken = this.hashToken(token);

  await this.create({
    userId,
    token: hashedToken,
    type: 'refresh',
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
  });

  return token;
};

// Static method to verify and find a token
tokenSchema.statics.findByToken = async function (token, type) {
  const hashedToken = this.hashToken(token);
  return this.findOne({
    token: hashedToken,
    type,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to delete a token
tokenSchema.statics.deleteToken = async function (token, type) {
  const hashedToken = this.hashToken(token);
  return this.deleteOne({ token: hashedToken, type });
};

// Static method to delete all tokens for a user
tokenSchema.statics.deleteUserTokens = async function (userId, type = null) {
  const query = { userId };
  if (type) {
    query.type = type;
  }
  return this.deleteMany(query);
};

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
