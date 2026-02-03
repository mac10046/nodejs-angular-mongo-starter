import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip interceptor for refresh token requests to avoid infinite loops
  if (req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  // Add auth header if token exists
  const token = authService.getAccessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && token) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            if (response.success && response.data?.accessToken) {
              // Retry the original request with new token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.data.accessToken}`,
                },
              });
              return next(newReq);
            }
            // Refresh failed, redirect to login
            authService.logout().subscribe();
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            // Refresh failed, redirect to login
            authService.logout().subscribe();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
