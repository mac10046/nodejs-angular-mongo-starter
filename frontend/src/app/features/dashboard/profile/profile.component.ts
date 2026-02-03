import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  authService = inject(AuthService);

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });

  isEditing = false;
  isLoading = false;

  get user() {
    return this.authService.currentUser();
  }

  get userInitials(): string {
    const name = this.user?.name || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get f() {
    return this.profileForm.controls;
  }

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.profileForm.patchValue({
      name: this.user?.name || '',
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.resetForm();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { name } = this.profileForm.value;

    this.authService.updateProfile({ name }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.isEditing = false;
          this.toastr.success('Profile updated successfully', 'Success');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(error.error?.message || 'Failed to update profile', 'Error');
      },
    });
  }
}
