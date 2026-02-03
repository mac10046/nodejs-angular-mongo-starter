import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { User, Role, Permission, DashboardStats } from '../models/user.model';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isEmailVerified?: boolean;
  authProvider?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly API_URL = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(
      `${this.API_URL}/dashboard`,
      { withCredentials: true }
    );
  }

  // Users
  getUsers(filters: UserFilters = {}): Observable<PaginatedResponse<User>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.isEmailVerified !== undefined) {
      params = params.set('isEmailVerified', filters.isEmailVerified.toString());
    }
    if (filters.authProvider) params = params.set('authProvider', filters.authProvider);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<User>>(`${this.API_URL}/users`, {
      params,
      withCredentials: true,
    });
  }

  getUser(id: string): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(
      `${this.API_URL}/users/${id}`,
      { withCredentials: true }
    );
  }

  updateUser(
    id: string,
    data: Partial<User>
  ): Observable<{ success: boolean; user: User }> {
    return this.http.put<{ success: boolean; user: User }>(
      `${this.API_URL}/users/${id}`,
      data,
      { withCredentials: true }
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_URL}/users/${id}`,
      { withCredentials: true }
    );
  }

  // Roles
  getRoles(): Observable<{ success: boolean; roles: Role[] }> {
    return this.http.get<{ success: boolean; roles: Role[] }>(
      `${this.API_URL}/roles`,
      { withCredentials: true }
    );
  }

  updateRole(
    id: string,
    data: Partial<Role>
  ): Observable<{ success: boolean; role: Role }> {
    return this.http.put<{ success: boolean; role: Role }>(
      `${this.API_URL}/roles/${id}`,
      data,
      { withCredentials: true }
    );
  }

  // Permissions
  getPermissions(): Observable<{ success: boolean; permissions: Permission[] }> {
    return this.http.get<{ success: boolean; permissions: Permission[] }>(
      `${this.API_URL}/permissions`,
      { withCredentials: true }
    );
  }

  createPermission(
    data: Partial<Permission>
  ): Observable<{ success: boolean; permission: Permission }> {
    return this.http.post<{ success: boolean; permission: Permission }>(
      `${this.API_URL}/permissions`,
      data,
      { withCredentials: true }
    );
  }

  updatePermission(
    id: string,
    data: Partial<Permission>
  ): Observable<{ success: boolean; permission: Permission }> {
    return this.http.put<{ success: boolean; permission: Permission }>(
      `${this.API_URL}/permissions/${id}`,
      data,
      { withCredentials: true }
    );
  }

  deletePermission(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_URL}/permissions/${id}`,
      { withCredentials: true }
    );
  }

  // Seed defaults (Super Admin only)
  seedDefaults(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API_URL}/seed`,
      {},
      { withCredentials: true }
    );
  }
}
