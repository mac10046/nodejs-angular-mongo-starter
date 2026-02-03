# Admin Panel

A comprehensive admin dashboard for managing users, roles, and permissions in the application.

## Features

- **Dashboard**: Overview statistics and recent user activity
- **User Management**: Full CRUD operations for users with role assignment
- **Role Management**: View and edit role permissions
- **Permissions Management**: Create, edit, and delete permissions (Super Admin only)

## Getting Started

### Prerequisites

- Node.js 18+
- Angular CLI 17+
- Backend server running on `http://localhost:5000`

### Installation

```bash
cd admin
npm install
```

### Development Server

```bash
npm start
# or
ng serve --port 4300
```

Navigate to `http://localhost:4300`. The app will automatically reload if you change any source files.

## User Roles

The application supports four user roles with hierarchical access:

| Role | Level | Description |
|------|-------|-------------|
| `USER` | 1 | Basic user with profile access only |
| `MODERATOR` | 2 | Can view users but limited management |
| `ADMIN` | 3 | Full user management, can manage users with lower roles |
| `SUPER_ADMIN` | 4 | Full system access including roles and permissions management |

## Pages

### Dashboard (`/dashboard`)

Displays:
- Total users count
- Verified/unverified users
- Users by role distribution
- Users by auth provider (local/Google)
- Recent user registrations

### Users (`/users`)

User management features:
- **List**: Paginated list with search and filters
- **Search**: By name or email
- **Filter**: By role, auth provider, verification status
- **Role Assignment**: Change user roles (inline dropdown)
- **Delete**: Remove users (cannot delete users with higher/equal role)

### Roles (`/roles`)

Role management features:
- **View Roles**: See all system roles with their permissions
- **Edit Permissions**: Click the edit button to modify role permissions
- **Seed Defaults**: Initialize default roles and permissions (first-time setup)

**To edit a role:**
1. Click the edit (pencil) icon on any role card
2. Modify display name or description if needed
3. Toggle permissions on/off by resource group
4. Click "Save Changes"

### Permissions (`/permissions`) - Super Admin Only

Permission management features:
- **View All**: List of all system permissions
- **Create**: Add new permissions
- **Edit**: Modify permission descriptions
- **Delete**: Remove permissions (cascades to roles/users)
- **Filter**: By resource or action type

## First-Time Setup

When you first access the admin panel with no roles/permissions in the database:

1. **Login** with your admin account
2. Navigate to **Roles** page (`/roles`)
3. Click **"Seed Default Roles"** button
4. This will create:
   - 4 default roles (USER, MODERATOR, ADMIN, SUPER_ADMIN)
   - 16 default permissions organized by resource

## Permission System

Permissions follow the format: `resource:action`

### Default Permissions

| Permission | Description |
|------------|-------------|
| `profile:read` | View own profile |
| `profile:update` | Update own profile |
| `password:change` | Change own password |
| `users:read` | View user details |
| `users:list` | List all users |
| `users:create` | Create new users |
| `users:update` | Update user details |
| `users:delete` | Delete users |
| `roles:read` | View role details |
| `roles:create` | Create new roles |
| `roles:update` | Update role details |
| `roles:delete` | Delete roles |
| `permissions:read` | View permissions |
| `permissions:manage` | Manage permissions |
| `admin:access` | Access admin panel |
| `system:manage` | Manage system settings |

### Role-Permission Mapping

**USER:**
- `profile:read`, `profile:update`, `password:change`

**MODERATOR:**
- All USER permissions
- `users:read`, `users:list`

**ADMIN:**
- All MODERATOR permissions
- `users:create`, `users:update`, `users:delete`
- `roles:read`, `admin:access`

**SUPER_ADMIN:**
- All ADMIN permissions
- `roles:create`, `roles:update`, `roles:delete`
- `permissions:read`, `permissions:manage`
- `system:manage`

## API Endpoints

All admin endpoints require authentication and admin role.

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics

### Users
- `GET /api/admin/users` - List users (paginated)
- `GET /api/admin/users/:id` - Get single user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Roles
- `GET /api/admin/roles` - List all roles
- `PUT /api/admin/roles/:id` - Update role (Super Admin)

### Permissions
- `GET /api/admin/permissions` - List all permissions
- `POST /api/admin/permissions` - Create permission (Super Admin)
- `PUT /api/admin/permissions/:id` - Update permission (Super Admin)
- `DELETE /api/admin/permissions/:id` - Delete permission (Super Admin)

### Seed
- `POST /api/admin/seed` - Seed default roles/permissions (Super Admin)

## Authentication

The admin panel uses JWT authentication with:
- **Access Token**: Short-lived (15 minutes), stored in localStorage
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- **Auto-refresh**: Tokens are automatically refreshed before expiration

## Security Features

- Role-based access control (RBAC)
- Permission-based route guards
- Hierarchical role enforcement (can only modify lower-level users)
- Protected routes with authentication guards
- Super Admin guard for sensitive operations

## Project Structure

```
admin/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         # Auth guards
│   │   │   ├── interceptors/   # HTTP interceptors
│   │   │   ├── models/         # TypeScript interfaces
│   │   │   ├── services/       # API services
│   │   │   └── config/         # Environment config
│   │   ├── features/
│   │   │   ├── dashboard/      # Dashboard component
│   │   │   ├── login/          # Login component
│   │   │   ├── users/          # User management
│   │   │   ├── roles/          # Role management
│   │   │   └── permissions/    # Permission management
│   │   ├── layouts/
│   │   │   └── admin-layout/   # Main layout with sidebar
│   │   └── shared/
│   │       └── components/     # Shared components (sidebar)
│   └── styles.scss
└── package.json
```

## Troubleshooting

### "No roles found" message
- Click "Seed Default Roles" to initialize the database with default roles and permissions.

### "Access denied. Admin privileges required"
- Ensure your user account has `ADMIN` or `SUPER_ADMIN` role.
- Check that the user object from login includes the `role` field.

### Cannot edit roles or permissions
- Only `SUPER_ADMIN` users can edit roles and manage permissions.
- Regular `ADMIN` users can only manage users.

### API errors
- Ensure backend is running on the correct port
- Check CORS configuration includes `http://localhost:4300`
- Verify `withCredentials: true` is set for cookie handling

## Build

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Further Help

For Angular CLI help, use `ng help` or check out the [Angular CLI Overview](https://angular.io/cli).
