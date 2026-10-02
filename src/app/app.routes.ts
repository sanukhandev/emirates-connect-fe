import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { onboardingGuard, onboardingPageGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/feed/feed-page.component').then((component) => component.FeedPageComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingPageGuard],
    loadComponent: () => import('./features/onboarding/onboarding.component').then((component) => component.OnboardingComponent),
  },
  {
    path: 'profile/edit',
    canActivate: [authGuard, onboardingGuard],
    data: { edit: true },
    loadComponent: () => import('./features/profile/profile.component').then((component) => component.ProfileComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/profile/profile.component').then((component) => component.ProfileComponent),
  },
  {
    path: 'verification',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/verification/verification-page.component').then((component) => component.VerificationPageComponent),
  },
  {
    path: 'users/:id/followers',
    data: { networkKind: 'user-followers' },
    loadComponent: () => import('./features/network/network-list.component').then((component) => component.NetworkListComponent),
  },
  {
    path: 'users/:id/following',
    data: { networkKind: 'user-following' },
    loadComponent: () => import('./features/network/network-list.component').then((component) => component.NetworkListComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/profile/public-profile.component').then((component) => component.PublicProfileComponent),
  },
  {
    path: 'businesses/create',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/business/business-create.component').then((component) => component.BusinessCreateComponent),
  },
  {
    path: 'posts/:id/edit',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/post/post-edit.component').then((component) => component.PostEditComponent),
  },
  {
    path: 'posts/:id',
    loadComponent: () => import('./features/post/post-page.component').then((component) => component.PostPageComponent),
  },
  {
    path: 'my-posts',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/post/my-posts.component').then((component) => component.MyPostsComponent),
  },
  {
    path: 'businesses/:slug/followers',
    data: { networkKind: 'business-followers' },
    loadComponent: () => import('./features/network/network-list.component').then((component) => component.NetworkListComponent),
  },
  {
    path: 'businesses/:slug/edit',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/business/business-edit.component').then((component) => component.BusinessEditComponent),
  },
  {
    path: 'businesses/:slug/verification',
    canActivate: [authGuard, onboardingGuard],
    data: { verificationKind: 'business' },
    loadComponent: () => import('./features/verification/verification-page.component').then((component) => component.VerificationPageComponent),
  },
  {
    path: 'businesses/:slug/members',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/business/business-members.component').then((component) => component.BusinessMembersComponent),
  },
  {
    path: 'businesses/:slug',
    loadComponent: () => import('./features/business/business-page.component').then((component) => component.BusinessPageComponent),
  },
  {
    path: 'businesses',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/business/business-list.component').then((component) => component.BusinessListComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((component) => component.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((component) => component.RegisterComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password.component').then((component) => component.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then((component) => component.ResetPasswordComponent),
  },
  { path: '**', redirectTo: '' },
];
