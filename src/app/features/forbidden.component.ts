import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-forbidden', imports: [RouterLink], template: `<main class="flex min-h-screen items-center justify-center bg-canvas px-4 text-center"><section class="max-w-md rounded-3xl bg-surface-card p-8 shadow-card"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong">Access denied</p><h1 class="mt-3 text-3xl font-bold">This area is for platform administrators.</h1><p class="mt-3 text-content-secondary">Your account does not have system-admin access.</p><a routerLink="/" class="mt-6 inline-flex rounded-xl bg-brand-primary px-4 py-3 font-medium text-white">Return home</a></section></main>` })
export class ForbiddenComponent {}
