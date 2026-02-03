# PROJECT-NAME - Full-Stack Authentication Boilerplate

A production-ready, full-stack authentication system built with Node.js/Express backend and Angular frontend. This boilerplate provides a complete authentication solution including local authentication, Google OAuth, email verification, password management, and a comprehensive admin panel with RBAC (Role-Based Access Control).

## Using This Boilerplate

This is a starter template. To use it for your project:

1. **Clone/Fork** this repository
2. **Rename** `PROJECT-NAME` / `project-name` to your actual project name in:
   - This README.md
   - `package.json` (root, backend, frontend, admin)
   - `scripts/dev-start.sh` and `scripts/dev-start.bat`
   - `scripts/deploy.config.sh`
   - `backend/ecosystem.config.js`
   - `backend/.env` (EMAIL_FROM field, MONGODB_URI database name)
3. **Configure** your environment:
   - Copy `backend/.env.example` to `backend/.env`
   - Set up Google OAuth credentials (see instructions below)
   - Configure Gmail App Password for email sending
4. **Run setup**: `npm run setup && npm run dev`

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express.js, MongoDB (Mongoose) |
| **Frontend** | Angular 17+ (Standalone Components) |
| **Admin Panel** | Angular 17+ (Separate App) |
| **Styling** | Bootstrap 5, SCSS |
| **Auth** | JWT (Access + Refresh Tokens), Google OAuth 2.0 |
| **Email** | Nodemailer (Gmail SMTP) |
| **Process Manager** | PM2 |
| **Logging** | Winston |

## Support This Project

If you find this boilerplate useful, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/abdeali.c)

## Features

### Authentication
- **Local Authentication**: Email/password registration and login with JWT tokens
- **Google OAuth 2.0**: One-click sign-in with Google
- **JWT Token System**: Access tokens (15min) + refresh tokens (7 days) with httpOnly cookies
- **Email Verification**: Required for local authentication users
- **Password Management**: Forgot password flow with email reset links
- **Secure Password Storage**: bcrypt hashing with cost factor 12

### Security (OWASP Compliant)
- **Security Headers**: Full OWASP-compliant header configuration
  - Content-Security-Policy (CSP)
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy
  - Cross-Origin-Opener-Policy
  - Cross-Origin-Resource-Policy
- **Input Sanitization**: XSS attack prevention
- **SQL Injection Detection**: Request monitoring and blocking
- **Rate Limiting**: Protection against brute-force attacks
- **CORS**: Configurable cross-origin resource sharing

### Admin Panel
- **Separate Angular App**: Dedicated admin interface at port 4300
- **RBAC System**: Role-based access control with granular permissions
- **User Management**: View, update roles, delete users
- **Dashboard**: User statistics and analytics
- **Role Management**: View and seed default roles/permissions

### Roles & Permissions
| Role | Level | Description |
|------|-------|-------------|
| USER | 1 | Standard user with basic permissions |
| MODERATOR | 2 | Can moderate content and view users |
| ADMIN | 3 | Full user management capabilities |
| SUPER_ADMIN | 4 | All permissions including system settings |

### Logging & Monitoring
- **Winston Logger**: Structured logging with multiple transports
- **PM2 Compatible**: Works seamlessly with PM2 log management
- **Request Logging**: All API requests are logged with request IDs
- **Error Tracking**: Detailed error logs with stack traces

### Notifications
- **Toast Notifications**: Sitewide configurable toast system
- **7-Second Default**: Configurable display duration
- **Centralized Config**: Single file configuration for all toasts

### Developer Experience
- **One-Command Setup**: `npm run setup && npm run dev` starts everything
- **Concurrent Dev Servers**: All 3 apps run simultaneously with colored output
- **Cross-Platform Scripts**: Startup scripts for Windows, Mac, and Linux
- **Git-Based Deployment**: Deploy from any branch with `deploy.sh`
- **PM2 Integration**: Production-ready process management

## Project Structure

```
project-name/
├── scripts/                    # Development and deployment scripts
│   ├── dev-start.sh           # Unix dev startup script
│   ├── dev-start.bat          # Windows dev startup script
│   ├── deploy.sh              # Production deployment script
│   ├── deploy.config.sh       # Deployment configuration
│   └── db-setup.js            # Database initialization script
│
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/            # Database, passport, email, security configs
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, RBAC, validators, error handling
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Logger and utilities
│   │   └── app.js             # Express app setup
│   ├── ecosystem.config.js    # PM2 configuration
│   ├── package.json
│   └── server.js              # Entry point
│
├── frontend/                   # Angular user application
│   ├── src/app/
│   │   ├── core/              # Guards, interceptors, services
│   │   ├── features/          # Feature modules (auth, dashboard)
│   │   └── shared/            # Shared components
│   └── package.json
│
├── admin/                      # Angular admin panel
│   ├── src/app/
│   │   ├── core/              # Admin-specific services
│   │   ├── features/          # Admin features (users, roles)
│   │   └── shared/            # Admin shared components
│   └── package.json
│
└── package.json                # Root package with dev scripts
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## MongoDB Setup

### Option A: Local MongoDB (Recommended for Development)

#### Windows Installation
1. **Download MongoDB Community Server** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer and select "Complete" installation
3. **Important**: Check "Install MongoDB as a Service" during installation
4. Install **MongoDB Compass** (GUI tool) when prompted

#### Start MongoDB on Windows
**Method 1: Windows Service (Recommended)**
1. Press `Win + R`, type `services.msc`, press Enter
2. Find **MongoDB Server** in the list
3. Right-click → **Start**
4. Right-click → **Properties** → Set Startup type to **Automatic**

**Method 2: Manual Start**
```cmd
# Open Command Prompt as Administrator
# Navigate to MongoDB bin folder (adjust version number)
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Create data directory if it doesn't exist
mkdir C:\data\db

# Start MongoDB
mongod --dbpath="C:\data\db"
```

#### macOS Installation
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian) Installation
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Verify MongoDB is Running
```bash
# Connect to MongoDB shell
mongosh

# You should see a prompt like:
# test>

# Type 'exit' to quit
```

#### Connect with MongoDB Compass
1. Open **MongoDB Compass**
2. Connection string: `mongodb://localhost:27017`
3. Click **Connect**
4. You'll see default databases: `admin`, `config`, `local`

> **Note**: The application database (`project-name-db`) will be created automatically when you first run the backend and it writes data.

### Option B: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string
5. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/project-name-db
   ```
6. **Important**: Add your IP to the whitelist in Atlas (Network Access → Add IP Address)

### Option 1: One-Command Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd project-name

# Install all dependencies and start development servers
npm run setup
npm run dev
```

### Option 2: Using Startup Scripts

**On Unix/Mac/Linux:**
```bash
chmod +x scripts/dev-start.sh
./scripts/dev-start.sh
```

**On Windows:**
```cmd
scripts\dev-start.bat
```

### Option 3: Manual Setup

```bash
# Install all dependencies
npm run install:all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install

# Start all services concurrently
npm run dev

# Or start individually in separate terminals:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:4200
npm run dev:admin     # http://localhost:4300
```

### First-Time Database Setup

For first-time application runners, use the database setup script to initialize MongoDB with required collections, roles, and permissions:

```bash
# Basic setup - creates collections, permissions, and default roles
npm run db:setup

# Setup with admin user - also creates a Super Admin account
npm run db:setup:admin
```

**What the setup script does:**
1. Connects to MongoDB using `backend/.env` configuration
2. Creates required collections: `users`, `tokens`, `roles`, `permissions`
3. Seeds default permissions (users, roles, admin, settings)
4. Seeds default roles (USER, MODERATOR, ADMIN, SUPER_ADMIN)
5. Optionally creates a Super Admin user for accessing the admin panel

**Create admin with custom credentials:**
```bash
node scripts/db-setup.js --with-admin --admin-email=admin@example.com --admin-password=YourSecurePassword123
```

> **Note**: Make sure MongoDB is running and `backend/.env` is configured before running the setup script.

### Environment Configuration

Create `backend/.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/project-name-db

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-64-character-secret-for-access-tokens
JWT_REFRESH_SECRET=your-64-character-secret-for-refresh-tokens

# Google OAuth (see setup instructions below)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PROJECT-NAME <your-email@gmail.com>

# Frontend URLs
FRONTEND_URL=http://localhost:4200
ADMIN_URL=http://localhost:4300

# Additional CORS origins (optional, comma-separated)
ADDITIONAL_ORIGINS=
```

**Application URLs:**
- Frontend: http://localhost:4200
- Admin Panel: http://localhost:4300
- API Server: http://localhost:5000
- API Health: http://localhost:5000/health

## Production Deployment

### Using the Deploy Script

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy from main branch (default)
./scripts/deploy.sh

# Deploy from specific branch
./scripts/deploy.sh -b develop
./scripts/deploy.sh -b release/v1.2.0

# Deploy to staging environment
./scripts/deploy.sh -b develop -e staging

# Restart services only (no code update)
./scripts/deploy.sh -r

# Skip frontend build
./scripts/deploy.sh -s
```

### Deploy Script Options
| Option | Description |
|--------|-------------|
| `-b, --branch` | Git branch to deploy (default: main) |
| `-e, --env` | Environment: production or staging |
| `-s, --skip-build` | Skip frontend build step |
| `-r, --restart-only` | Only restart PM2 processes |
| `-h, --help` | Show help message |

### Manual PM2 Deployment

```bash
cd backend

# Start with PM2
npm run pm2:start

# Other PM2 commands
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
npm run pm2:monit
```

### Build Frontend Apps

```bash
# Build both frontends
npm run build

# Or individually:
npm run build:frontend
npm run build:admin
```

## Security Configuration

### OWASP Security Headers

The application implements comprehensive security headers per OWASP guidelines. Configuration is in `backend/src/config/security.js`:

| Header | Purpose |
|--------|---------|
| Content-Security-Policy | Prevents XSS by specifying valid content sources |
| Strict-Transport-Security | Forces HTTPS connections (HSTS) |
| X-Content-Type-Options | Prevents MIME type sniffing |
| X-Frame-Options | Prevents clickjacking attacks |
| X-XSS-Protection | Enables browser XSS filtering |
| Referrer-Policy | Controls referrer information |
| Permissions-Policy | Controls browser features |
| Cross-Origin-Opener-Policy | Isolates browsing context |
| Cross-Origin-Resource-Policy | Controls resource loading |

### Verify Security Headers (Development Only)

```bash
# Check configured security headers
curl http://localhost:5000/api/security-headers
```

### Additional Security Features

- **Input Sanitization**: Automatic XSS vector removal from inputs
- **SQL Injection Detection**: Monitors and blocks suspicious patterns
- **Request ID Tracking**: Every request gets a unique ID for tracing
- **Rate Limiting**: Configurable limits per endpoint type

## Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name and click "Create"

### Step 2: Configure OAuth Consent Screen
1. Navigate to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields:
   - App name: "PROJECT-NAME"
   - User support email: your email
   - Developer contact email: your email
4. Save and continue through remaining steps

### Step 3: Create OAuth Credentials
1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:4200`
   - `http://localhost:5000`
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Gmail App Password Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Click "Generate"
4. Copy the 16-character password to `EMAIL_PASS` in `.env`

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/logout` | Logout and clear tokens |
| POST | `/refresh-token` | Get new access token |
| GET | `/google` | Initiate Google OAuth |
| GET | `/google/callback` | Google OAuth callback |
| GET | `/verify-email/:token` | Verify email address |
| POST | `/resend-verification` | Resend verification email |

### Password (`/api/password`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/forgot` | Request password reset email |
| POST | `/reset/:token` | Reset password with token |
| PUT | `/change` | Change password (authenticated) |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update profile |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard statistics |
| GET | `/users` | List all users (paginated) |
| GET | `/users/:id` | Get single user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/roles` | Get all roles |
| GET | `/permissions` | Get all permissions |
| POST | `/seed` | Seed default roles (Super Admin) |

## Configuration Reference

### Toast Configuration
Located at `frontend/src/app/core/config/toast.config.ts` and `admin/src/app/core/config/toast.config.ts`:

```typescript
export const TOAST_CONFIG = {
  timeOut: 7000,           // Display duration (ms)
  extendedTimeOut: 3000,   // Extra time on hover
  positionClass: 'toast-top-right',
  progressBar: true,
  closeButton: true,
  maxOpened: 5,
};
```

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Registration: 3 requests per hour
- Password reset: 3 requests per hour

## NPM Scripts Reference

### Root Level (`package.json`)
| Script | Description |
|--------|-------------|
| `npm run setup` | Install all dependencies |
| `npm run dev` | Start all dev servers concurrently |
| `npm run build` | Build all frontend apps |
| `npm run start:prod` | Start production with PM2 |
| `npm run stop:prod` | Stop PM2 processes |
| `npm run logs` | View PM2 logs |
| `npm run db:setup` | Initialize database with collections and roles |
| `npm run db:setup:admin` | Initialize database and create admin user |

### Backend Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run pm2:start` | Start with PM2 |
| `npm run pm2:logs` | View logs |

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets (64+ characters)
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure allowed origins for production
5. **Rate Limiting**: Adjust limits based on your needs
6. **Database**: Use MongoDB Atlas with IP whitelisting in production
7. **Security Headers**: Review and adjust CSP for your specific needs
8. **Dependencies**: Regularly update dependencies for security patches

## Extending the Application

### Adding New Permissions
1. Add permission to `backend/src/controllers/adminController.js` in `seedDefaults`
2. Assign to appropriate roles
3. Use `requirePermission('resource:action')` middleware

### Adding New Roles
1. Define role in `seedDefaults` with level and permissions
2. Update frontend/admin role displays if needed

### Adding New Features
1. Create controller in `backend/src/controllers/`
2. Create routes in `backend/src/routes/`
3. Add to main router in `backend/src/routes/index.js`
4. Create corresponding Angular components

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running locally or Atlas connection string is correct
- Check IP whitelist in MongoDB Atlas

**Google OAuth Not Working**
- Verify OAuth credentials are correct
- Check authorized redirect URIs match exactly
- Ensure consent screen is configured

**Email Not Sending**
- Verify Gmail App Password is correct
- Check 2FA is enabled on Gmail account
- Verify EMAIL_USER matches the account

**CORS Errors**
- Check FRONTEND_URL and ADMIN_URL in `.env`
- Add additional origins to ADDITIONAL_ORIGINS if needed

**Port Already in Use**
- Check for running processes on ports 5000, 4200, 4300
- Use startup scripts which check port availability

## License

MIT License - feel free to use this boilerplate for your projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with Node.js, Express, MongoDB, Angular, and Bootstrap.

---

## Support

If this boilerplate saved you time or helped with your project, consider supporting its development:

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/abdeali.c)

Your support helps maintain and improve this project!
