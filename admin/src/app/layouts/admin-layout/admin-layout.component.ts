import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent],
  template: `
    <div class="admin-layout">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <h1 class="page-title">Admin Dashboard</h1>
          </div>
          <div class="top-bar-right">
            <!-- User Dropdown -->
            <div class="user-dropdown" (click)="toggleDropdown()" [class.open]="isDropdownOpen">
              <div class="user-trigger">
                @if (authService.user()?.avatar) {
                  <img [src]="authService.user()?.avatar" alt="Profile" class="user-avatar-img" />
                } @else {
                  <div class="user-avatar">{{ userInitials }}</div>
                }
                <span class="user-name">{{ authService.user()?.name }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              @if (isDropdownOpen) {
                <div class="dropdown-menu">
                  <div class="dropdown-header">
                    <div class="dropdown-user-name">{{ authService.user()?.name }}</div>
                    <div class="dropdown-user-email">{{ authService.user()?.email }}</div>
                    <div class="dropdown-user-role">
                      <span class="role-badge">{{ authService.user()?.role }}</span>
                    </div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <a routerLink="/profile" class="dropdown-item" (click)="closeDropdown()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </a>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout" (click)="logout()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </header>
        <!-- Main Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <!-- Backdrop for dropdown -->
    @if (isDropdownOpen) {
      <div class="dropdown-backdrop" (click)="closeDropdown()"></div>
    }
  `,
  styles: [`
    .admin-layout {
      min-height: 100vh;
      background: #f3f4f6;
    }

    .main-wrapper {
      margin-left: 260px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .top-bar {
      height: 64px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-dropdown {
      position: relative;
    }

    .user-trigger {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f3f4f6;
      }
    }

    .user-avatar, .user-avatar-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }

    .user-avatar {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      color: white;
    }

    .user-avatar-img {
      object-fit: cover;
    }

    .user-name {
      font-weight: 500;
      color: #374151;
    }

    .chevron {
      color: #6b7280;
      transition: transform 0.2s;
    }

    .user-dropdown.open .chevron {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 240px;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      z-index: 1000;
    }

    .dropdown-header {
      padding: 1rem;
      background: #f9fafb;
    }

    .dropdown-user-name {
      font-weight: 600;
      color: #1f2937;
    }

    .dropdown-user-email {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .dropdown-user-role {
      margin-top: 0.5rem;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 0.25rem;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #374151;
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;

      &:hover {
        background: #f3f4f6;
      }

      &.logout {
        color: #dc2626;

        &:hover {
          background: #fef2f2;
        }
      }

      svg {
        color: inherit;
      }
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99;
    }

    .main-content {
      flex: 1;
      padding: 1.5rem;
    }
  `],
})
export class AdminLayoutComponent {
  isDropdownOpen = false;

  constructor(public authService: AuthService) {}

  get userInitials(): string {
    const name = this.authService.user()?.name || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
