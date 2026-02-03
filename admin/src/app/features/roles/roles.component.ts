import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Role, Permission } from '../../core/models/user.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-page">
      <div class="page-header d-flex justify-content-between align-items-start">
        <div>
          <h1>Roles & Permissions</h1>
          <p class="text-muted">Manage system roles and their permissions</p>
        </div>
        @if (authService.isSuperAdmin()) {
          <button class="btn btn-primary" (click)="seedDefaults()" [disabled]="isSeeding">
            @if (isSeeding) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            Seed Default Roles
          </button>
        }
      </div>

      @if (isLoading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      } @else {
        <!-- Roles Cards -->
        <div class="row g-4 mb-4">
          @for (role of roles; track role._id) {
            <div class="col-md-6">
              <div class="card role-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">{{ role.displayName }}</h5>
                    <small class="text-muted">Level {{ role.level }} · {{ role.name }}</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    @if (role.isSystem) {
                      <span class="badge bg-secondary">System</span>
                    }
                    @if (authService.isSuperAdmin()) {
                      <button
                        class="btn btn-sm btn-outline-primary"
                        (click)="openEditModal(role)"
                        title="Edit Permissions"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
                <div class="card-body">
                  <p class="text-muted mb-3">{{ role.description }}</p>
                  <h6 class="mb-2">Permissions ({{ getPermissionNames(role.permissions).length }}):</h6>
                  <div class="permissions-list">
                    @for (perm of getPermissionNames(role.permissions); track perm) {
                      <span class="badge bg-light text-dark me-1 mb-1">{{ perm }}</span>
                    } @empty {
                      <span class="text-muted">No permissions assigned</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-12">
              <div class="alert alert-info">
                <strong>No roles found.</strong> Click "Seed Default Roles" to create the default roles and permissions.
              </div>
            </div>
          }
        </div>

        <!-- Permissions List -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">All Permissions ({{ permissions.length }})</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Resource</th>
                    <th>Action</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  @for (perm of permissions; track perm._id) {
                    <tr>
                      <td>
                        <code>{{ perm.name }}</code>
                      </td>
                      <td class="text-capitalize">{{ perm.resource }}</td>
                      <td>
                        <span class="badge" [ngClass]="getActionBadgeClass(perm.action)">
                          {{ perm.action }}
                        </span>
                      </td>
                      <td class="text-muted">{{ perm.description }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="text-center py-4 text-muted">
                        No permissions found
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Edit Role Modal -->
      @if (showEditModal && editingRole) {
        <div class="modal-backdrop fade show" (click)="closeEditModal()"></div>
        <div class="modal fade show d-block" tabindex="-1">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Role: {{ editingRole.displayName }}</h5>
                <button type="button" class="btn-close" (click)="closeEditModal()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Role Name</label>
                  <input type="text" class="form-control" [value]="editingRole.name" disabled />
                </div>
                <div class="mb-3">
                  <label class="form-label">Display Name</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="editForm.displayName"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea
                    class="form-control"
                    [(ngModel)]="editForm.description"
                    rows="2"
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Permissions</label>
                  <p class="text-muted small">Select which permissions this role should have:</p>

                  <!-- Group permissions by resource -->
                  @for (group of permissionGroups; track group.resource) {
                    <div class="permission-group mb-3">
                      <div class="permission-group-header">
                        <strong class="text-capitalize">{{ group.resource }}</strong>
                        <button
                          type="button"
                          class="btn btn-sm btn-link"
                          (click)="toggleAllInGroup(group.resource)"
                        >
                          {{ isGroupFullySelected(group.resource) ? 'Deselect All' : 'Select All' }}
                        </button>
                      </div>
                      <div class="permission-checkboxes">
                        @for (perm of group.permissions; track perm.name) {
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              [id]="'perm-' + perm.name"
                              [checked]="selectedPermissions.has(perm.name)"
                              (change)="togglePermission(perm.name)"
                            />
                            <label class="form-check-label" [for]="'perm-' + perm.name">
                              <code>{{ perm.name }}</code>
                              <small class="text-muted d-block">{{ perm.description }}</small>
                            </label>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <span class="me-auto text-muted">
                  {{ selectedPermissions.size }} permission(s) selected
                </span>
                <button type="button" class="btn btn-secondary" (click)="closeEditModal()">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="saveRole()"
                  [disabled]="isSaving"
                >
                  @if (isSaving) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      }
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

    .role-card .card-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .permissions-list {
      max-height: 150px;
      overflow-y: auto;
    }

    .permissions-list .badge {
      font-weight: 500;
      border: 1px solid #e5e7eb;
    }

    .table th {
      font-weight: 600;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }

    code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }

    .modal {
      z-index: 1050;
    }

    .modal-content {
      border: none;
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .permission-group {
      background: #f9fafb;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .permission-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .permission-checkboxes {
      display: grid;
      gap: 0.5rem;
    }

    .form-check-label code {
      font-size: 0.8rem;
    }

    .form-check-label small {
      font-size: 0.75rem;
    }

    .badge {
      font-weight: 500;
    }

    .action-create { background: #10b981; color: white; }
    .action-read { background: #3b82f6; color: white; }
    .action-update { background: #f59e0b; color: white; }
    .action-delete { background: #ef4444; color: white; }
    .action-list { background: #6366f1; color: white; }
    .action-manage { background: #8b5cf6; color: white; }
    .action-access { background: #14b8a6; color: white; }
    .action-change { background: #f97316; color: white; }
  `],
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  permissions: Permission[] = [];
  isLoading = true;
  isSeeding = false;

  // Edit modal
  showEditModal = false;
  editingRole: Role | null = null;
  editForm = {
    displayName: '',
    description: '',
  };
  selectedPermissions = new Set<string>();
  isSaving = false;

  // Grouped permissions for the modal
  permissionGroups: { resource: string; permissions: Permission[] }[] = [];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Load roles and permissions in parallel
    this.adminService.getRoles().subscribe({
      next: (response) => {
        this.roles = response.roles;
      },
      error: (error) => {
        this.notificationService.handleError(error);
      },
    });

    this.adminService.getPermissions().subscribe({
      next: (response) => {
        this.permissions = response.permissions;
        this.groupPermissions();
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isLoading = false;
      },
    });
  }

  groupPermissions(): void {
    const groups = new Map<string, Permission[]>();

    for (const perm of this.permissions) {
      if (!groups.has(perm.resource)) {
        groups.set(perm.resource, []);
      }
      groups.get(perm.resource)!.push(perm);
    }

    this.permissionGroups = Array.from(groups.entries())
      .map(([resource, permissions]) => ({ resource, permissions }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }

  seedDefaults(): void {
    if (!confirm('This will create/update default roles and permissions. Continue?')) {
      return;
    }

    this.isSeeding = true;
    this.adminService.seedDefaults().subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.loadData();
        this.isSeeding = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isSeeding = false;
      },
    });
  }

  openEditModal(role: Role): void {
    this.editingRole = role;
    this.editForm = {
      displayName: role.displayName,
      description: role.description || '',
    };

    // Initialize selected permissions from the role
    this.selectedPermissions = new Set(this.getPermissionNames(role.permissions));
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingRole = null;
    this.selectedPermissions.clear();
  }

  togglePermission(permName: string): void {
    if (this.selectedPermissions.has(permName)) {
      this.selectedPermissions.delete(permName);
    } else {
      this.selectedPermissions.add(permName);
    }
  }

  toggleAllInGroup(resource: string): void {
    const group = this.permissionGroups.find(g => g.resource === resource);
    if (!group) return;

    const isFullySelected = this.isGroupFullySelected(resource);

    for (const perm of group.permissions) {
      if (isFullySelected) {
        this.selectedPermissions.delete(perm.name);
      } else {
        this.selectedPermissions.add(perm.name);
      }
    }
  }

  isGroupFullySelected(resource: string): boolean {
    const group = this.permissionGroups.find(g => g.resource === resource);
    if (!group) return false;
    return group.permissions.every(p => this.selectedPermissions.has(p.name));
  }

  saveRole(): void {
    if (!this.editingRole) return;

    this.isSaving = true;
    const updateData = {
      displayName: this.editForm.displayName,
      description: this.editForm.description,
      permissions: Array.from(this.selectedPermissions),
    };

    this.adminService.updateRole(this.editingRole._id, updateData).subscribe({
      next: (response) => {
        // Update the role in the local array
        const index = this.roles.findIndex(r => r._id === this.editingRole!._id);
        if (index !== -1) {
          this.roles[index] = response.role;
        }
        this.notificationService.success('Role updated successfully');
        this.closeEditModal();
        this.isSaving = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isSaving = false;
      },
    });
  }

  getPermissionNames(permissions: string[] | Permission[]): string[] {
    if (!permissions || permissions.length === 0) return [];

    if (typeof permissions[0] === 'string') {
      return permissions as string[];
    }

    return (permissions as Permission[]).map((p) => p.name);
  }

  getActionBadgeClass(action: string): string {
    return `action-${action}`;
  }
}
