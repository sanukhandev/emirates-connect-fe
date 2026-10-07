import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas px-4 text-center">
      <section class="max-w-md rounded-3xl border border-border-subtle bg-surface-card p-8 shadow-card">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 shadow-xs">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <p class="mt-5 text-[11px] font-semibold uppercase tracking-wider text-brand-600">Access Restricted</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-content-primary">
          Platform Administrators Only
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
          Your account is registered as a regular member and does not possess system-administration privileges.
        </p>

        <div class="mt-6">
          <a routerLink="/" class="ec-btn-primary w-full">
            Return to feed
          </a>
        </div>
      </section>
    </main>
  `,
})
export class ForbiddenComponent {}
