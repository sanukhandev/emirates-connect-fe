import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { NotificationService } from '../../core/notification/notification.service';

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 border-b border-border-subtle bg-surface-card/95 shadow-xs backdrop-blur-md">
      <div class="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-3.5 sm:px-6 lg:px-8">
        <!-- Logo & Brand Mark -->
        <a
          routerLink="/"
          class="flex shrink-0 items-center gap-2.5 rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Emirates Connect home"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-xs">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="10.66" r="3" fill="currentColor" />
            </svg>
          </span>
          <span class="hidden text-sm font-bold tracking-tight text-content-primary sm:inline">Emirates Connect</span>
        </a>

        <!-- Global Search Input -->
        <form class="min-w-0 flex-1 md:max-w-md" (submit)="search($event)" role="search">
          <label for="global-navigation-search" class="sr-only">Search people, businesses and posts</label>
          <div class="relative">
            <svg
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="global-navigation-search"
              type="search"
              [value]="query()"
              (input)="query.set(inputValue($event))"
              placeholder="Search people, businesses and posts"
              class="w-full rounded-xl border border-border-subtle bg-surface-secondary py-2 pl-9 pr-3 text-xs text-content-primary outline-none transition focus:border-brand-primary focus:bg-surface-card focus:ring-4 focus:ring-brand-primary/10 sm:text-sm"
            />
          </div>
        </form>

        <!-- Desktop Navigation Links -->
        <nav class="hidden items-center gap-1 lg:flex" aria-label="Quick menu">
          @for (item of quickLinks; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-soft text-brand-strong"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="rounded-xl px-3 py-2 text-xs font-semibold text-content-secondary transition hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- Right Side: Auth / Member Controls -->
        <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          @if (auth.isAuthenticated()) {
            <!-- Notification Bell with Unread Dot -->
            <a
              routerLink="/notifications"
              class="relative flex h-10 w-10 items-center justify-center rounded-xl text-content-secondary transition hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              @if (hasUnread()) {
                <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-primary ring-2 ring-white"></span>
              }
            </a>

            <!-- Settings Quick Action -->
            <a
              routerLink="/profile/edit"
              class="hidden h-10 items-center gap-1.5 rounded-xl border border-border-subtle px-3 text-xs font-semibold text-content-secondary transition hover:border-brand-primary hover:text-content-primary sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Profile settings"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06A1.7 1.7 0 0 0 11.64 6H12V4h2.4v.2A1.7 1.7 0 0 0 15.43 5.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.67 9c.2.6.76 1 1.4 1H21v2.4h-.93A1.7 1.7 0 0 0 18.67 15Z" />
              </svg>
              <span>Settings</span>
            </a>

            <!-- User Profile Avatar with Initials Fallback -->
            <a
              routerLink="/profile"
              class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-soft text-sm font-bold text-brand-strong ring-1 ring-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Open profile"
              title="Open profile"
            >
              @if (avatar() && !imgError()) {
                <img
                  [src]="avatar()!"
                  [alt]="userName()"
                  class="h-full w-full object-cover"
                  (error)="imgError.set(true)"
                />
              } @else {
                {{ initials() }}
              }
            </a>
          } @else {
            <!-- Guest / Logged Out Controls -->
            <a
              routerLink="/login"
              class="rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-content-secondary transition hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Log in
            </a>
            <a
              routerLink="/register"
              class="ec-btn-primary px-3.5 py-2 text-xs sm:text-sm"
            >
              Join Now
            </a>
          }
        </div>
      </div>
    </header>
  `,
})
export class TopNavComponent {
  readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService, { optional: true });

  readonly query = signal('');
  readonly imgError = signal(false);

  readonly quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/search' },
    { label: 'Businesses', path: '/businesses' },
    { label: 'Reels', path: '/reels' },
    { label: 'Notifications', path: '/notifications' },
  ];

  avatar(): string | null {
    return this.auth.currentUser()?.profile?.avatar_url ?? null;
  }

  userName(): string {
    return this.auth.currentUser()?.profile?.display_name || this.auth.currentUser()?.name || 'User';
  }

  initials(): string {
    return (this.userName() || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  hasUnread(): boolean {
    return (this.notificationService?.unreadCount() ?? 0) > 0;
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  search(event: Event): void {
    event.preventDefault();
    const query = this.query().trim();
    if (query) {
      void this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }
}
