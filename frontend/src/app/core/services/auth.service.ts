import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'accessToken';
  private expiresAtKey = 'tokenExpiresAt';

  // Reactive state using signals
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  // For storing redirect URL
  redirectUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Try to load user on init if token exists
    this.loadUserOnInit();
  }

  private loadUserOnInit(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired()) {
      this.getMe().subscribe({
        error: () => {
          this.clearTokens();
        },
      });
    }
  }

  /**
   * Register a new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login with email and password
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data, { withCredentials: true }).pipe(
      tap((response) => {
        this.isLoadingSignal.set(false);
        if (response.success && response.data) {
          this.setTokens(response.data.accessToken!, response.data.expiresIn!);
          this.currentUserSignal.set(response.data.user!);
        }
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Initiate Google OAuth login
   */
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  /**
   * Handle OAuth callback
   */
  handleOAuthCallback(token: string, expiresIn: number): void {
    this.setTokens(token, expiresIn);
    this.getMe().subscribe({
      next: () => {
        const redirectUrl = this.redirectUrl || '/dashboard';
        this.redirectUrl = null;
        this.router.navigate([redirectUrl]);
      },
      error: () => {
        this.clearTokens();
        this.router.navigate(['/login']);
      },
    });
  }

  /**
   * Logout user
   */
  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        this.clearTokens();
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, {}, { withCredentials: true }).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setTokens(response.data.accessToken!, response.data.expiresIn!);
        }
      })
    );
  }

  /**
   * Get current user
   */
  getMe(): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        this.isLoadingSignal.set(false);
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
        }
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify email
   */
  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/verify-email/${token}`);
  }

  /**
   * Resend verification email
   */
  resendVerification(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  /**
   * Request password reset
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/password/forgot`, data).pipe(
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, data: ResetPasswordRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/password/reset/${token}`, data).pipe(
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.put<AuthResponse>(`${this.apiUrl}/password/change`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
        this.clearTokens();
        this.currentUserSignal.set(null);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update profile
   */
  updateProfile(data: UpdateProfileRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.put<AuthResponse>(`${this.apiUrl}/users/me`, data).pipe(
      tap((response) => {
        this.isLoadingSignal.set(false);
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
        }
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set tokens
   */
  private setTokens(token: string, expiresIn: number): void {
    localStorage.setItem(this.tokenKey, token);
    const expiresAt = new Date().getTime() + expiresIn * 1000;
    localStorage.setItem(this.expiresAtKey, expiresAt.toString());
  }

  /**
   * Clear tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.expiresAtKey);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.expiresAtKey);
    if (!expiresAt) return true;
    return new Date().getTime() > parseInt(expiresAt, 10);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  hasValidToken(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }
}
