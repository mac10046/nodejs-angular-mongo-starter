import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-callback.component.html',
  styleUrl: './oauth-callback.component.scss',
})
export class OAuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMessage = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    // Check for error
    if (params['error']) {
      this.errorMessage = decodeURIComponent(params['error']);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    // Check for token
    const token = params['token'];
    const expiresIn = parseInt(params['expiresIn'], 10);

    if (token && expiresIn) {
      this.authService.handleOAuthCallback(token, expiresIn);
    } else {
      this.errorMessage = 'Authentication failed. Please try again.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }
}
