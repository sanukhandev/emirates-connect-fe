import { Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-desktop-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="sticky top-6 flex h-[calc(100vh-3rem)] flex-col justify-between rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-card transition-all duration-300 md:w-16 lg:w-60 xl:w-64"
      aria-label="Main Navigation"
    >
      <!-- Top Brand & Navigation -->
      <div class="space-y-6">
        <!-- Logo / Wordmark -->
        <a routerLink="/" class="flex items-center gap-3 px-2 py-1 focus-visible:outline-none group">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs transition-transform group-hover:scale-105"
          >
            <!-- Original Emirates Connect Geometric Emblem -->
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="10.66" r="3" fill="currentColor" />
            </svg>
          </div>
          <div class="hidden min-w-0 lg:block">
            <span class="block text-base font-bold tracking-tight text-content-primary">Emirates Connect</span>
            <span class="block text-[10px] font-medium uppercase tracking-wider text-brand-600">UAE Network</span>
          </div>
        </a>

        <!-- Main Navigation Links -->
        <nav class="space-y-1.5" aria-label="Primary Navigation">
          <a
            routerLink="/"
            routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Home"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span class="hidden lg:inline">Home</span>
          </a>

          <a
            routerLink="/search"
            routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
            class="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Discover"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span class="hidden lg:inline">Discover</span>
          </a>

          <a
            routerLink="/businesses"
            routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
            class="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Businesses"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span class="hidden lg:inline">Businesses</span>
          </a>

          <a
            routerLink="/reels"
            routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
            class="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Reels"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span class="hidden lg:inline">Reels</span>
          </a>

          <a
            routerLink="/notifications"
            routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
            class="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Notifications"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="hidden lg:inline">Notifications</span>
          </a>
        </nav>

        <!-- Secondary Section -->
        <div class="border-t border-border-subtle pt-4">
          <p class="hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-content-muted lg:block">Preferences</p>
          <div class="mt-2 space-y-1.5">
            <a
              routerLink="/profile"
              routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
              class="flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
              title="My Profile"
            >
              <svg class="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span class="hidden lg:inline">My Profile</span>
            </a>

            <a
              routerLink="/verification"
              routerLinkActive="bg-brand-50 text-brand-600 font-semibold"
              class="flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
              title="Get Verified"
            >
              <svg class="h-4.5 w-4.5 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span class="hidden lg:inline">Verification</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom User Profile Card -->
      <div class="border-t border-border-subtle pt-3">
        <div class="flex items-center justify-between gap-2 rounded-xl p-1.5 hover:bg-surface-secondary transition-colors">
          <a routerLink="/profile" class="flex min-w-0 items-center gap-2.5">
            <div class="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-100 font-bold text-brand-700 flex items-center justify-center text-xs">
              @if (userAvatar()) {
                <img [src]="userAvatar()" [alt]="userName()" class="h-full w-full object-cover" />
              } @else {
                {{ initials(userName()) }}
              }
              <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-status-success"></span>
            </div>
            <div class="hidden min-w-0 lg:block">
              <p class="truncate text-xs font-semibold text-content-primary leading-tight">{{ userName() }}</p>
              <p class="truncate text-[11px] text-content-secondary leading-tight">{{ userHeadline() }}</p>
            </div>
          </a>

          <!-- Logout Button -->
          <button
            type="button"
            (click)="logoutClick.emit()"
            class="hidden rounded-lg p-1.5 text-content-muted hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none lg:block"
            title="Sign out"
            aria-label="Sign out"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class DesktopSidebarComponent {
  readonly logoutClick = output<void>();

  private readonly auth = inject(AuthStateService);

  userName(): string {
    const user = this.auth.currentUser();
    return user?.profile?.display_name || user?.name || 'Sanu Khan';
  }

  userHeadline(): string {
    const user = this.auth.currentUser();
    return user?.profile?.headline || 'Tech Lead · Dubai';
  }

  userAvatar(): string | null {
    return this.auth.currentUser()?.profile?.avatar_url || null;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
