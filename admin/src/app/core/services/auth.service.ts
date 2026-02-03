import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../config/environment';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'admin_access_token';

  // Signals for reactive state
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal<boolean>(true);

  // Public computed signals
  readonly user = this.userSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => {
    const user = this.userSignal();
    return user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
  });
  readonly isSuperAdmin = computed(() => this.userSignal()?.role === 'SUPER_ADMIN');

  // BehaviorSubject for components that need Observable
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getAccessToken();
    if (token) {
      this.loadCurrentUser();
    } else {
      this.loadingSignal.set(false);
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response: any) => {
          // Handle response with data wrapper or direct properties
          const accessToken = response.data?.accessToken || response.accessToken;
          const user = response.data?.user || response.user;

          if (accessToken && user) {
            // Check if user is admin
            if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
              throw new Error('Access denied. Admin privileges required.');
            }
            this.setAccessToken(accessToken);
            this.setUser(user);
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.http
      .post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => {
          this.clearAuth();
          this.router.navigate(['/login']);
        },
        error: () => {
          this.clearAuth();
          this.router.navigate(['/login']);
        },
      });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<any>(
        `${this.API_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          const accessToken = response.data?.accessToken || response.accessToken;
          if (accessToken) {
            this.setAccessToken(accessToken);
          }
        }),
        catchError((error) => {
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  resendVerification(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/resend-verification`, { email });
  }

  private loadCurrentUser(): void {
    this.http
      .get<any>(`${this.API_URL}/users/me`, {
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          // Handle response with data wrapper or direct properties
          const user = response.data?.user || response.user;
          if (user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            this.setUser(user);
          } else {
            this.clearAuth();
          }
          this.loadingSignal.set(false);
        },
        error: () => {
          this.clearAuth();
          this.loadingSignal.set(false);
        },
      });
  }

  private setUser(user: User): void {
    // Normalize user data - ensure _id is set
    const normalizedUser = {
      ...user,
      _id: user._id || user.id || '',
    };
    this.userSignal.set(normalizedUser);
    this.userSubject.next(normalizedUser);
  }

  private clearAuth(): void {
    this.removeAccessToken();
    this.userSignal.set(null);
    this.userSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  private removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }
}
