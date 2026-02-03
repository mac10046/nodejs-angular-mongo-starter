export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  authProvider: 'local' | 'google';
  avatar: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
    accessToken?: string;
    expiresIn?: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}
