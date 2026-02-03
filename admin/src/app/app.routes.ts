import { Routes } from '@angular/router';
import { adminAuthGuard, guestGuard, superAdminGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [adminAuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./features/permissions/permissions.component').then(
            (m) => m.PermissionsComponent
          ),
        canActivate: [superAdminGuard],
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
