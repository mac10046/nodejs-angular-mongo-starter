import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { DashboardStats, User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="text-muted">Overview of your application</p>
      </div>

      @if (isLoading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      } @else if (stats) {
        <!-- Stats Cards -->
        <div class="row g-4 mb-4">
          <div class="col-md-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.verifiedUsers }}</div>
                <div class="stat-label">Verified Users</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.unverifiedUsers }}</div>
                <div class="stat-label">Unverified Users</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ getGoogleUsers() }}</div>
                <div class="stat-label">Google Users</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row g-4 mb-4">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">Users by Role</h5>
              </div>
              <div class="card-body">
                @for (item of stats.usersByRole; track item.role) {
                  <div class="role-item">
                    <div class="role-info">
                      <span class="role-name">{{ item.role }}</span>
                      <span class="role-count">{{ item.count }}</span>
                    </div>
                    <div class="progress">
                      <div
                        class="progress-bar"
                        [style.width.%]="getPercentage(item.count)"
                        [class]="getRoleColor(item.role)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">Users by Auth Provider</h5>
              </div>
              <div class="card-body">
                @for (item of stats.usersByProvider; track item.provider) {
                  <div class="role-item">
                    <div class="role-info">
                      <span class="role-name text-capitalize">{{ item.provider }}</span>
                      <span class="role-count">{{ item.count }}</span>
                    </div>
                    <div class="progress">
                      <div
                        class="progress-bar"
                        [style.width.%]="getPercentage(item.count)"
                        [class]="item.provider === 'google' ? 'bg-danger' : 'bg-primary'"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Users -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Recent Users</h5>
            <a routerLink="/users" class="btn btn-sm btn-outline-primary">View All</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of stats.recentUsers; track user._id) {
                    <tr>
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="user-avatar-sm me-2">
                            @if (user.avatar) {
                              <img [src]="user.avatar" alt="Avatar" />
                            } @else {
                              {{ getInitials(user.name) }}
                            }
                          </div>
                          {{ user.name }}
                        </div>
                      </td>
                      <td>{{ user.email }}</td>
                      <td>
                        <span class="badge" [class]="getRoleBadge(user.role)">
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="text-capitalize">{{ user.authProvider }}</td>
                      <td>
                        @if (user.isEmailVerified) {
                          <span class="badge bg-success">Verified</span>
                        } @else {
                          <span class="badge bg-warning">Pending</span>
                        }
                      </td>
                      <td>{{ formatDate(user.createdAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-header {
      margin-bottom: 2rem;

      h1 {
        margin-bottom: 0.25rem;
        font-weight: 700;
      }
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.bg-primary { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }
      &.bg-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      &.bg-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      &.bg-info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .card {
      border: none;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 1.5rem;
    }

    .role-item {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .role-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .role-name {
      font-weight: 500;
    }

    .role-count {
      color: #6b7280;
    }

    .progress {
      height: 8px;
      border-radius: 4px;
      background: #e5e7eb;
    }

    .user-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .table th {
      font-weight: 600;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }

    .table td {
      vertical-align: middle;
    }
  `],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.adminService.getDashboard().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isLoading = false;
      },
    });
  }

  getPercentage(count: number): number {
    if (!this.stats) return 0;
    return (count / this.stats.totalUsers) * 100;
  }

  getGoogleUsers(): number {
    if (!this.stats) return 0;
    const google = this.stats.usersByProvider.find((p) => p.provider === 'google');
    return google?.count || 0;
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      USER: 'bg-secondary',
      MODERATOR: 'bg-info',
      ADMIN: 'bg-primary',
      SUPER_ADMIN: 'bg-danger',
    };
    return colors[role] || 'bg-secondary';
  }

  getRoleBadge(role: string): string {
    const badges: Record<string, string> = {
      USER: 'bg-secondary',
      MODERATOR: 'bg-info',
      ADMIN: 'bg-primary',
      SUPER_ADMIN: 'bg-danger',
    };
    return badges[role] || 'bg-secondary';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
