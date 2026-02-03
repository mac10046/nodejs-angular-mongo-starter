import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.errorMessage = 'Invalid verification link';
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.isSuccess = true;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Verification failed. The link may be expired or invalid.';
      },
    });
  }
}
