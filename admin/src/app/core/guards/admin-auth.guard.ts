import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect admin routes
 * Only allows access if user is authenticated AND is an admin
 */
export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const checkAuth = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(checkAuth);
          if (authService.isAuthenticated() && authService.isAdmin()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 100);
    });
  }

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guard to allow only non-authenticated users (for login page)
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const checkAuth = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(checkAuth);
          if (authService.isAuthenticated() && authService.isAdmin()) {
            router.navigate(['/dashboard']);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      }, 100);
    });
  }

  if (authService.isAuthenticated() && authService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Guard to protect super admin only routes
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const checkAuth = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(checkAuth);
          if (authService.isSuperAdmin()) {
            resolve(true);
          } else {
            router.navigate(['/dashboard']);
            resolve(false);
          }
        }
      }, 100);
    });
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
