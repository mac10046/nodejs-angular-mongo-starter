import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // Guest routes (only accessible when NOT logged in)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
    canActivate: [guestGuard],
  },

  // Public routes (accessible by anyone)
  {
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
  },

  // Protected routes (require authentication)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/dashboard/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/dashboard/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
    canActivate: [authGuard],
  },

  // Fallback route
  {
    path: '**',
    redirectTo: 'login',
  },
];
