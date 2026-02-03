import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserFilters } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p class="text-muted">Manage all users in the system</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input
                type="text"
                class="form-control"
                placeholder="Search by name or email..."
                [(ngModel)]="filters.search"
                (input)="onSearchChange()"
              />
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.role" (change)="loadUsers()">
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.authProvider" (change)="loadUsers()">
                <option value="">All Providers</option>
                <option value="local">Local</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="verifiedFilter" (change)="onVerifiedChange()">
                <option value="">All Status</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" (click)="resetFilters()">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-body p-0">
          @if (isLoading) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          } @else {
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
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users; track user._id) {
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
                        <select
                          class="form-select form-select-sm"
                          [ngModel]="user.role"
                          (change)="updateRole(user, $event)"
                          [disabled]="!canModifyUser(user)"
                          style="width: auto;"
                        >
                          <option value="USER">User</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                          @if (authService.isSuperAdmin()) {
                            <option value="SUPER_ADMIN">Super Admin</option>
                          }
                        </select>
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
                      <td class="text-end">
                        @if (canModifyUser(user)) {
                          <button
                            class="btn btn-sm btn-outline-danger"
                            (click)="deleteUser(user)"
                            [disabled]="deletingUserId === user._id"
                          >
                            @if (deletingUserId === user._id) {
                              <span class="spinner-border spinner-border-sm"></span>
                            } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            }
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center py-4 text-muted">
                        No users found
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (pagination.pages > 1) {
              <div class="card-footer d-flex justify-content-between align-items-center">
                <div class="text-muted">
                  Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
                  {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
                  {{ pagination.total }} users
                </div>
                <nav>
                  <ul class="pagination mb-0">
                    <li class="page-item" [class.disabled]="pagination.page === 1">
                      <button class="page-link" (click)="goToPage(pagination.page - 1)">
                        Previous
                      </button>
                    </li>
                    @for (page of getPageNumbers(); track page) {
                      <li class="page-item" [class.active]="page === pagination.page">
                        <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
                      </li>
                    }
                    <li class="page-item" [class.disabled]="pagination.page === pagination.pages">
                      <button class="page-link" (click)="goToPage(pagination.page + 1)">
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;

      h1 {
        margin-bottom: 0.25rem;
        font-weight: 700;
      }
    }

    .card {
      border: none;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .form-select-sm {
      padding: 0.25rem 2rem 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
  `],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  deletingUserId: string | null = null;
  verifiedFilter = '';
  Math = Math;

  filters: UserFilters = {
    page: 1,
    limit: 10,
    search: '',
    role: '',
    authProvider: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  private searchTimeout: any;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers(this.filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.pagination = response.pagination;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isLoading = false;
      },
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadUsers();
    }, 300);
  }

  onVerifiedChange(): void {
    if (this.verifiedFilter === '') {
      this.filters.isEmailVerified = undefined;
    } else {
      this.filters.isEmailVerified = this.verifiedFilter === 'true';
    }
    this.filters.page = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      search: '',
      role: '',
      authProvider: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    this.verifiedFilter = '';
    this.loadUsers();
  }

  updateRole(user: User, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as User['role'];

    this.adminService.updateUser(user._id, { role: newRole }).subscribe({
      next: (response) => {
        user.role = response.user.role;
        this.notificationService.success(`Role updated to ${newRole}`);
      },
      error: (error) => {
        select.value = user.role; // Revert
        this.notificationService.handleError(error);
      },
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    this.deletingUserId = user._id;
    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u._id !== user._id);
        this.pagination.total--;
        this.notificationService.success('User deleted successfully');
        this.deletingUserId = null;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.deletingUserId = null;
      },
    });
  }

  canModifyUser(user: User): boolean {
    const currentUser = this.authService.user();
    if (!currentUser) return false;

    // Can't modify yourself
    if (currentUser._id === user._id) return false;

    // Super admin can modify anyone
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Admin can only modify users with lower role level
    const roleHierarchy: Record<string, number> = {
      USER: 1,
      MODERATOR: 2,
      ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    return roleHierarchy[currentUser.role] > roleHierarchy[user.role];
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.filters.page = page;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.pagination.page;
    const total = this.pagination.pages;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (current <= 3) {
      end = Math.min(5, total);
    }
    if (current >= total - 2) {
      start = Math.max(1, total - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
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
