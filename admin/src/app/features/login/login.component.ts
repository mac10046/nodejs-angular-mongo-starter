import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <div class="admin-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 class="mt-3 mb-1">Admin Panel</h2>
          <p class="text-muted">Sign in to access the admin dashboard</p>
        </div>

        <!-- Error Alert with Resend Button -->
        @if (errorMessage) {
        <div class="alert" [class.alert-danger]="!showResendVerification" [class.alert-warning]="showResendVerification">
          <div>{{ errorMessage }}</div>
          @if (showResendVerification) {
          <button
            type="button"
            class="btn btn-sm btn-outline-warning mt-2"
            (click)="resendVerificationEmail()"
            [disabled]="isResendingVerification"
          >
            @if (isResendingVerification) {
            <span class="spinner-border spinner-border-sm me-1"></span>
            Sending...
            } @else {
            Resend Verification Email
            }
          </button>
          }
        </div>
        }

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="mb-3">
            <label for="email" class="form-label">Email address</label>
            <input
              type="email"
              class="form-control"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              placeholder="admin@example.com"
              [disabled]="isLoading"
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              class="form-control"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="8"
              placeholder="Enter your password"
              [disabled]="isLoading"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100"
            [disabled]="loginForm.invalid || isLoading"
          >
            @if (isLoading) {
              <span class="spinner-border spinner-border-sm me-2"></span>
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="mt-4 text-center">
          <small class="text-muted">
            Only administrators can access this panel.
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      padding: 1rem;
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
    }

    .admin-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      color: white;
    }

    h2 {
      color: #1e3a5f;
      font-weight: 700;
    }

    .form-control {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;

      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 600;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
      }

      &:disabled {
        opacity: 0.7;
      }
    }

    .alert {
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
    }

    .alert-danger {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-warning {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      color: #92400e;
    }

    .btn-outline-warning {
      color: #92400e;
      border-color: #fbbf24;

      &:hover:not(:disabled) {
        background-color: #fbbf24;
        color: #1f2937;
      }
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showResendVerification = false;
  isResendingVerification = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.showResendVerification = false;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.notificationService.success('Welcome to the admin panel!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.errorMessage = 'Please verify your email before logging in.';
          this.showResendVerification = true;
          this.notificationService.warning(
            'Click "Resend Verification Email" to get a new verification link.',
            'Email Not Verified'
          );
        } else {
          this.errorMessage = error?.error?.message || error?.message || 'Login failed';
          this.notificationService.error(this.errorMessage);
        }
      },
    });
  }

  resendVerificationEmail(): void {
    if (!this.email || this.isResendingVerification) return;

    this.isResendingVerification = true;

    this.authService.resendVerification(this.email).subscribe({
      next: () => {
        this.isResendingVerification = false;
        this.notificationService.success(
          'Please check your inbox and spam folder.',
          'Verification Email Sent'
        );
        this.showResendVerification = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.isResendingVerification = false;
        const message = error?.error?.message || 'Failed to send verification email.';
        this.notificationService.error(message);
      },
    });
  }
}
