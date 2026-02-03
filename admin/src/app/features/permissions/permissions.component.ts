import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { Permission } from '../../core/models/user.model';

interface PermissionForm {
  name: string;
  resource: string;
  action: string;
  description: string;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="permissions-page">
      <div class="page-header d-flex justify-content-between align-items-start">
        <div>
          <h1>Permissions Management</h1>
          <p class="text-muted">Manage system permissions (Super Admin only)</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Permission
        </button>
      </div>

      @if (isLoading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      } @else {
        <!-- Filter by Resource -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Search permissions..."
                  [(ngModel)]="searchTerm"
                  (input)="filterPermissions()"
                />
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="resourceFilter" (change)="filterPermissions()">
                  <option value="">All Resources</option>
                  @for (resource of uniqueResources; track resource) {
                    <option [value]="resource">{{ resource | titlecase }}</option>
                  }
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="actionFilter" (change)="filterPermissions()">
                  <option value="">All Actions</option>
                  @for (action of uniqueActions; track action) {
                    <option [value]="action">{{ action | titlecase }}</option>
                  }
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" (click)="resetFilters()">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Permission Name</th>
                    <th>Resource</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (perm of filteredPermissions; track perm._id) {
                    <tr>
                      <td>
                        <code class="permission-code">{{ perm.name }}</code>
                      </td>
                      <td>
                        <span class="badge bg-info">{{ perm.resource }}</span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getActionBadgeClass(perm.action)">
                          {{ perm.action }}
                        </span>
                      </td>
                      <td class="text-muted">{{ perm.description }}</td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <button
                            class="btn btn-outline-primary"
                            (click)="openEditModal(perm)"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            class="btn btn-outline-danger"
                            (click)="deletePermission(perm)"
                            [disabled]="deletingId === perm._id"
                            title="Delete"
                          >
                            @if (deletingId === perm._id) {
                              <span class="spinner-border spinner-border-sm"></span>
                            } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-4 text-muted">
                        No permissions found
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-muted">
            Showing {{ filteredPermissions.length }} of {{ permissions.length }} permissions
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal) {
        <div class="modal-backdrop fade show" (click)="closeModal()"></div>
        <div class="modal fade show d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ isEditing ? 'Edit Permission' : 'Create Permission' }}</h5>
                <button type="button" class="btn-close" (click)="closeModal()"></button>
              </div>
              <form (ngSubmit)="savePermission()">
                <div class="modal-body">
                  <div class="mb-3">
                    <label class="form-label">Resource</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="formData.resource"
                      name="resource"
                      required
                      placeholder="e.g., users, roles, settings"
                      [disabled]="isEditing"
                    />
                    <div class="form-text">The resource this permission applies to</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Action</label>
                    <select class="form-select" [(ngModel)]="formData.action" name="action" required [disabled]="isEditing">
                      <option value="">Select action</option>
                      <option value="create">Create</option>
                      <option value="read">Read</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="manage">Manage (All)</option>
                    </select>
                    <div class="form-text">The action allowed by this permission</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Permission Name</label>
                    <input
                      type="text"
                      class="form-control"
                      [value]="generatedName"
                      readonly
                      disabled
                    />
                    <div class="form-text">Auto-generated from resource and action</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea
                      class="form-control"
                      [(ngModel)]="formData.description"
                      name="description"
                      rows="2"
                      placeholder="Describe what this permission allows"
                    ></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="isSaving || !formData.resource || !formData.action"
                  >
                    @if (isSaving) {
                      <span class="spinner-border spinner-border-sm me-2"></span>
                    }
                    {{ isEditing ? 'Update' : 'Create' }}
                  </button>
                </div>
              </form>
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

    .permission-code {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .table th {
      font-weight: 600;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }

    .table td {
      vertical-align: middle;
    }

    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
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

    .badge {
      font-weight: 500;
    }

    .action-create { background: #10b981; }
    .action-read { background: #3b82f6; }
    .action-update { background: #f59e0b; }
    .action-delete { background: #ef4444; }
    .action-manage { background: #8b5cf6; }
  `],
})
export class PermissionsComponent implements OnInit {
  permissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  isLoading = true;
  deletingId: string | null = null;

  // Filters
  searchTerm = '';
  resourceFilter = '';
  actionFilter = '';
  uniqueResources: string[] = [];
  uniqueActions: string[] = [];

  // Modal
  showModal = false;
  isEditing = false;
  isSaving = false;
  editingPermission: Permission | null = null;
  formData: PermissionForm = {
    name: '',
    resource: '',
    action: '',
    description: '',
  };

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.adminService.getPermissions().subscribe({
      next: (response) => {
        this.permissions = response.permissions;
        this.filteredPermissions = [...this.permissions];
        this.sortPermissions();
        this.extractUniqueFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.isLoading = false;
      },
    });
  }

  extractUniqueFilters(): void {
    this.uniqueResources = [...new Set(this.permissions.map(p => p.resource))].sort();
    this.uniqueActions = [...new Set(this.permissions.map(p => p.action))].sort();
  }

  filterPermissions(): void {
    this.filteredPermissions = this.permissions.filter(perm => {
      const matchesSearch = !this.searchTerm ||
        perm.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        perm.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesResource = !this.resourceFilter || perm.resource === this.resourceFilter;
      const matchesAction = !this.actionFilter || perm.action === this.actionFilter;
      return matchesSearch && matchesResource && matchesAction;
    });
    this.sortPermissions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.resourceFilter = '';
    this.actionFilter = '';
    this.filteredPermissions = [...this.permissions];
    this.sortPermissions();
  }

  sortPermissions(): void {
    this.filteredPermissions.sort((a, b) => a.name.localeCompare(b.name));
  }

  get generatedName(): string {
    if (!this.formData.resource || !this.formData.action) return '';
    return `${this.formData.resource}:${this.formData.action}`;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingPermission = null;
    this.formData = {
      name: '',
      resource: '',
      action: '',
      description: '',
    };
    this.showModal = true;
  }

  openEditModal(permission: Permission): void {
    this.isEditing = true;
    this.editingPermission = permission;
    this.formData = {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingPermission = null;
  }

  savePermission(): void {
    if (!this.formData.resource || !this.formData.action) return;

    this.isSaving = true;
    const data = {
      name: this.generatedName,
      resource: this.formData.resource.toLowerCase(),
      action: this.formData.action.toLowerCase(),
      description: this.formData.description,
    };

    if (this.isEditing && this.editingPermission) {
      this.adminService.updatePermission(this.editingPermission._id, data).subscribe({
        next: (response) => {
          const index = this.permissions.findIndex(p => p._id === this.editingPermission!._id);
          if (index !== -1) {
            this.permissions[index] = response.permission;
          }
          this.filterPermissions();
          this.notificationService.success('Permission updated successfully');
          this.closeModal();
          this.isSaving = false;
        },
        error: (error) => {
          this.notificationService.handleError(error);
          this.isSaving = false;
        },
      });
    } else {
      this.adminService.createPermission(data).subscribe({
        next: (response) => {
          this.permissions.push(response.permission);
          this.filterPermissions();
          this.extractUniqueFilters();
          this.notificationService.success('Permission created successfully');
          this.closeModal();
          this.isSaving = false;
        },
        error: (error) => {
          this.notificationService.handleError(error);
          this.isSaving = false;
        },
      });
    }
  }

  deletePermission(permission: Permission): void {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"?`)) {
      return;
    }

    this.deletingId = permission._id;
    this.adminService.deletePermission(permission._id).subscribe({
      next: () => {
        this.permissions = this.permissions.filter(p => p._id !== permission._id);
        this.filterPermissions();
        this.extractUniqueFilters();
        this.notificationService.success('Permission deleted successfully');
        this.deletingId = null;
      },
      error: (error) => {
        this.notificationService.handleError(error);
        this.deletingId = null;
      },
    });
  }

  getActionBadgeClass(action: string): string {
    const classes: Record<string, string> = {
      create: 'action-create',
      read: 'action-read',
      update: 'action-update',
      delete: 'action-delete',
      manage: 'action-manage',
    };
    return classes[action] || 'bg-secondary';
  }
}
