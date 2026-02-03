import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  get f() {
    return this.forgotPasswordForm.controls;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'If an account exists with this email, a password reset link has been sent.';
          this.toastr.success('Check your email for reset instructions', 'Email Sent');
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Always show success message to prevent email enumeration
        this.successMessage = 'If an account exists with this email, a password reset link has been sent.';
        this.toastr.success('Check your email for reset instructions', 'Email Sent');
      },
    });
  }
}
