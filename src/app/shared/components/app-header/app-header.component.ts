import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthStateService } from '../../../core/auth/auth-state.service';
import { NotificationService } from '../../../core/notification/notification.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="flex items-center justify-between gap-3 sm:gap-4" aria-label="Global application bar">
      <!-- Global Search Bar -->
      <div class="relative flex-1 max-w-xl">
        <label for="ec-global-search" class="sr-only">{{ searchPlaceholder() }}</label>
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
          <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          id="ec-global-search"
          type="search"
          [placeholder]="searchPlaceholder()"
          (keydown.enter)="onSearch($event)"
          class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-card transition-all duration-150 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-primary/15"
        />
      </div>

      <!-- Action Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        @if (showCreate()) {
          <a
            [routerLink]="createRoute()"
            class="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-brand-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            [title]="createLabel()"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span class="hidden sm:inline">{{ createLabel() }}</span>
          </a>
        }

        <!-- Notifications Bell -->
        <a
          routerLink="/notifications"
          class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white text-content-secondary shadow-card transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-95"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          @if (hasUnread()) {
            <span class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-primary ring-2 ring-white"></span>
          }
        </a>

        <!-- Mini Profile Avatar / Account Link -->
        <a
          routerLink="/profile"
          class="flex items-center gap-2 rounded-xl border border-border-subtle bg-white p-1 sm:pr-3 shadow-card transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          title="Your Profile"
        >
          <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
            @if (userAvatar()) {
              <img [src]="userAvatar()!" [alt]="userName()" class="h-full w-full object-cover" (error)="onAvatarError()" />
            } @else {
              {{ initials() }}
            }
          </div>
          <span class="hidden text-xs font-medium text-content-primary lg:inline max-w-[110px] truncate">
            {{ userName() }}
          </span>
        </a>
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  readonly searchPlaceholder = input<string>('Search people, businesses and posts');
  readonly createLabel = input<string>('Create');
  readonly createRoute = input<string>('/');
  readonly showCreate = input<boolean>(true);

  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService, { optional: true });

  private avatarFailed = false;

  userName(): string {
    const user = this.auth.currentUser();
    return user?.profile?.display_name || user?.name || 'Member';
  }

  userAvatar(): string | null {
    if (this.avatarFailed) return null;
    return this.auth.currentUser()?.profile?.avatar_url || null;
  }

  onAvatarError(): void {
    this.avatarFailed = true;
  }

  initials(): string {
    return this.userName()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  hasUnread(): boolean {
    return (this.notificationService?.unreadCount() ?? 0) > 0;
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    if (query) {
      void this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }
}
