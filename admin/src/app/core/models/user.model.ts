export interface User {
  _id: string;
  id?: string; // Backend sometimes returns id instead of _id
  name: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  isEmailVerified: boolean;
  authProvider: 'local' | 'google';
  avatar?: string;
  customPermissions?: string[];
  deniedPermissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  permissions: string[] | Permission[];
  isSystem: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  user?: User;
}

export interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersByRole: { role: string; count: number }[];
  usersByProvider: { provider: string; count: number }[];
  recentUsers: User[];
}
