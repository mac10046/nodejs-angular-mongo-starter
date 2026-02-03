import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for certain endpoints
  const skipUrls = ['/auth/login', '/auth/refresh-token'];
  const shouldSkip = skipUrls.some((url) => req.url.includes(url));

  // Clone request with auth header if we have a token
  let authReq = req;
  const token = authService.getAccessToken();

  if (token && !shouldSkip) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - try to refresh token
      if (error.status === 401 && !shouldSkip && !isRefreshing) {
        isRefreshing = true;

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            // Retry the original request with new token
            const newToken = authService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Handle 403 Forbidden - not an admin
      if (error.status === 403) {
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
