import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'inventory',
    loadComponent: () => import('./pages/inventory/inventory').then((m) => m.Inventory),
  },
  {
    path: 'receive',
    loadComponent: () => import('./pages/receive/receive').then((m) => m.Receive),
  },
  {
    path: 'pick',
    loadComponent: () => import('./pages/pick/pick').then((m) => m.Pick),
  },
  {
    path: 'import',
    loadComponent: () => import('./pages/import/import').then((m) => m.Import),
  },
];
