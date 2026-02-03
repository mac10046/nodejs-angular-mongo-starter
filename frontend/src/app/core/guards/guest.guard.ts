import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard for guest-only routes (login, register, etc.)
 * Redirects to dashboard if user is already authenticated
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasValidToken()) {
    return true;
  }

  // User is already authenticated, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};
