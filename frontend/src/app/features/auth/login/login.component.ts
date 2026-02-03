import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  isLoading = false;
  showPassword = false;
  errorMessage = '';
  showResendVerification = false;
  isResendingVerification = false;
  unverifiedEmail = '';

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showResendVerification = false;

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastr.success('Login successful!', 'Welcome');
          const redirectUrl = this.authService.redirectUrl || '/dashboard';
          this.authService.redirectUrl = null;
          this.router.navigate([redirectUrl]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.errorMessage = 'Please verify your email before logging in.';
          this.showResendVerification = true;
          this.unverifiedEmail = email;
          this.toastr.warning(
            'Click "Resend Verification Email" to get a new verification link.',
            'Email Not Verified',
            { timeOut: 10000 }
          );
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.toastr.error(this.errorMessage, 'Login Failed');
        }
      },
    });
  }

  resendVerificationEmail(): void {
    if (!this.unverifiedEmail || this.isResendingVerification) {
      return;
    }

    this.isResendingVerification = true;

    this.authService.resendVerification(this.unverifiedEmail).subscribe({
      next: (response) => {
        this.isResendingVerification = false;
        this.toastr.success(
          'Please check your inbox and spam folder.',
          'Verification Email Sent',
          { timeOut: 10000 }
        );
        this.showResendVerification = false;
      },
      error: (error) => {
        this.isResendingVerification = false;
        const message = error.error?.message || 'Failed to send verification email. Please try again.';
        this.toastr.error(message, 'Error');
      },
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
