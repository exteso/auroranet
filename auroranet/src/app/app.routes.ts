import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  // Default route - redirect to login
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Authentication routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register').then(m => m.Register)
      }
    ]
  },

  // Admin routes (protected by adminGuard)
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'events',
        loadComponent: () => import('./admin/events/events').then(m => m.Events)
      }
    ]
  },

  // User routes (protected by authGuard)
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      {
        path: 'events',
        loadComponent: () => import('./user/events/events').then(m => m.Events)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./user/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'profile',
        loadComponent: () => import('./user/profile/profile').then(m => m.Profile)
      }
    ]
  },

  // 404 Not Found route
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found').then(m => m.NotFound)
  }
];
