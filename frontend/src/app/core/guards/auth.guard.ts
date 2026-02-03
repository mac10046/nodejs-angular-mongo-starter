import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  authService.redirectUrl = state.url;

  // Navigate to login page
  router.navigate(['/login']);
  return false;
};
