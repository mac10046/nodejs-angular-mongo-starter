#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script sets up the initial database for the application:
 * 1. Connects to MongoDB
 * 2. Creates required collections
 * 3. Seeds default roles and permissions
 * 4. Optionally creates a default admin user
 *
 * Usage:
 *   node scripts/db-setup.js
 *   node scripts/db-setup.js --with-admin
 *   node scripts/db-setup.js --with-admin --admin-email=admin@example.com --admin-password=YourPassword123
 */

const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Use mongoose from backend's node_modules to ensure same instance as models
const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
const mongoose = require(path.join(backendNodeModules, 'mongoose'));
const bcrypt = require(path.join(backendNodeModules, 'bcryptjs'));
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`${colors.cyan}[Step ${num}]${colors.reset} ${msg}`),
};

// Parse command line arguments
const args = process.argv.slice(2);
const withAdmin = args.includes('--with-admin');
let adminEmail = '';
let adminPassword = '';

args.forEach((arg) => {
  if (arg.startsWith('--admin-email=')) {
    adminEmail = arg.split('=')[1];
  }
  if (arg.startsWith('--admin-password=')) {
    adminPassword = arg.split('=')[1];
  }
});

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

// Import models after dotenv is loaded
let User, Role, Permission;

async function loadModels() {
  // We need to require these after mongoose is set up
  const modelsPath = path.join(__dirname, '..', 'backend', 'src', 'models');
  User = require(path.join(modelsPath, 'User'));
  Role = require(path.join(modelsPath, 'Role'));
  Permission = require(path.join(modelsPath, 'Permission'));
}

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    log.error('MONGODB_URI not found in environment variables!');
    log.info('Make sure backend/.env file exists with MONGODB_URI configured.');
    process.exit(1);
  }

  log.info(`Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

  try {
    await mongoose.connect(mongoUri);
    log.success(`MongoDB Connected: ${mongoose.connection.host}`);
    log.success(`Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    log.error(`Failed to connect: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      log.warn('\nMongoDB is not running. Please start MongoDB first:');
      log.info('  Windows: Open Services (services.msc) and start "MongoDB Server"');
      log.info('  macOS:   brew services start mongodb-community');
      log.info('  Linux:   sudo systemctl start mongod');
    }

    return false;
  }
}

async function createCollections() {
  log.step(1, 'Creating collections...');

  const collections = ['users', 'tokens', 'roles', 'permissions'];
  const existingCollections = await mongoose.connection.db.listCollections().toArray();
  const existingNames = existingCollections.map((c) => c.name);

  for (const collName of collections) {
    if (existingNames.includes(collName)) {
      log.info(`  Collection '${collName}' already exists`);
    } else {
      await mongoose.connection.db.createCollection(collName);
      log.success(`  Collection '${collName}' created`);
    }
  }
}

async function seedPermissions() {
  log.step(2, 'Seeding default permissions...');

  const count = await Permission.countDocuments();
  if (count > 0) {
    log.info(`  ${count} permissions already exist`);
    return;
  }

  await Permission.seedDefaultPermissions();
  const newCount = await Permission.countDocuments();
  log.success(`  Created ${newCount} default permissions`);
}

async function seedRoles() {
  log.step(3, 'Seeding default roles...');

  const count = await Role.countDocuments();
  if (count > 0) {
    log.info(`  ${count} roles already exist`);
    return;
  }

  await Role.seedDefaultRoles();
  const newCount = await Role.countDocuments();
  log.success(`  Created ${newCount} default roles`);

  // Display roles
  const roles = await Role.find().select('name displayName level');
  console.log('\n  Roles created:');
  roles.forEach((role) => {
    console.log(`    - ${role.displayName} (${role.name}) - Level ${role.level}`);
  });
}

async function createAdminUser() {
  log.step(4, 'Creating admin user...');

  // Check if admin exists
  const existingAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (existingAdmin) {
    log.info(`  Admin user already exists: ${existingAdmin.email}`);
    return;
  }

  // Get admin credentials
  if (!adminEmail) {
    adminEmail = await question('\n  Enter admin email: ');
  }
  if (!adminPassword) {
    adminPassword = await question('  Enter admin password (min 8 chars): ');
  }

  // Validate inputs
  if (!adminEmail || !adminEmail.includes('@')) {
    log.error('  Invalid email address');
    return;
  }
  if (!adminPassword || adminPassword.length < 8) {
    log.error('  Password must be at least 8 characters');
    return;
  }

  // Check if user with this email exists
  const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingUser) {
    log.warn(`  User with email ${adminEmail} already exists`);
    const upgrade = await question('  Upgrade this user to SUPER_ADMIN? (y/n): ');
    if (upgrade.toLowerCase() === 'y') {
      existingUser.role = 'SUPER_ADMIN';
      await existingUser.save();
      log.success(`  User ${adminEmail} upgraded to SUPER_ADMIN`);
    }
    return;
  }

  // Create admin user (password will be hashed by User model's pre-save hook)
  const adminUser = await User.create({
    name: 'Admin',
    email: adminEmail.toLowerCase(),
    password: adminPassword, // Plain text - User model will hash it
    role: 'SUPER_ADMIN',
    isEmailVerified: true, // Admin doesn't need email verification
    authProvider: 'local',
  });

  log.success(`  Admin user created: ${adminUser.email}`);
}

async function displaySummary() {
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bright}Database Setup Summary${colors.reset}`);
  console.log('='.repeat(50));

  const userCount = await User.countDocuments();
  const roleCount = await Role.countDocuments();
  const permCount = await Permission.countDocuments();

  console.log(`
  Database:     ${mongoose.connection.name}
  Host:         ${mongoose.connection.host}

  Collections:
    - users:        ${userCount} documents
    - roles:        ${roleCount} documents
    - permissions:  ${permCount} documents

  Admin Panel:  http://localhost:4300
  API Server:   http://localhost:5000
  `);
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bright}${colors.cyan}  PROJECT-NAME Database Setup${colors.reset}`);
  console.log('='.repeat(50) + '\n');

  // Step 0: Check environment
  log.info('Checking environment...');
  log.info(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  log.info(`  MONGODB_URI: ${process.env.MONGODB_URI ? 'configured' : 'NOT FOUND'}`);

  if (!process.env.MONGODB_URI) {
    log.error('\nMONGODB_URI not found!');
    log.info('Please ensure backend/.env file exists with proper configuration.');
    log.info('You can copy from backend/.env.example');
    process.exit(1);
  }

  console.log('');

  // Connect to database
  const connected = await connectDatabase();
  if (!connected) {
    process.exit(1);
  }

  console.log('');

  // Load models
  await loadModels();

  // Create collections
  await createCollections();
  console.log('');

  // Seed permissions
  await seedPermissions();
  console.log('');

  // Seed roles
  await seedRoles();
  console.log('');

  // Create admin user if requested
  if (withAdmin) {
    await createAdminUser();
    console.log('');
  }

  // Display summary
  await displaySummary();

  // Next steps
  console.log(`${colors.bright}Next Steps:${colors.reset}`);
  if (!withAdmin) {
    console.log(`
  1. Run with --with-admin to create an admin user:
     ${colors.cyan}node scripts/db-setup.js --with-admin${colors.reset}

  2. Or register a user and upgrade manually:
     ${colors.cyan}db.users.updateOne({email:"your@email.com"}, {$set:{role:"SUPER_ADMIN"}})${colors.reset}
`);
  } else {
    console.log(`
  1. Start the development servers:
     ${colors.cyan}npm run dev${colors.reset}

  2. Access the admin panel:
     ${colors.cyan}http://localhost:4300${colors.reset}

  3. Login with your admin credentials
`);
  }

  // Cleanup
  rl.close();
  await mongoose.connection.close();
  log.success('Database connection closed');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
