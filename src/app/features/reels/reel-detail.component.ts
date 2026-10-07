import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ProfileService } from '../../core/profile/profile.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { ReelCardComponent } from './reel-card.component';

@Component({
  selector: 'app-reel-detail',
  imports: [
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    ReelCardComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Responsive Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (sticky, Reels active) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-24 md:pb-10">
          <!-- Application Shell Top Global Header -->
          <section aria-label="Global application bar" class="flex items-center justify-between gap-3 sm:gap-4">
            <!-- Global Search -->
            <div class="relative flex-1 max-w-xl">
              <label for="global-reel-detail-search" class="sr-only">Search people, businesses and posts</label>
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                id="global-reel-detail-search"
                type="search"
                (keydown.enter)="onGlobalSearch($event)"
                placeholder="Search people, businesses and posts"
                class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-card transition-all duration-150 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-primary/15"
              />
            </div>

            <!-- Header Quick Actions -->
            <div class="flex items-center gap-2 sm:gap-3">
              @if (auth.isAuthenticated()) {
                <a
                  routerLink="/reels/create"
                  class="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover active:scale-95"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create</span>
                </a>

                <a
                  routerLink="/notifications"
                  class="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white text-content-secondary shadow-card transition hover:border-brand-primary hover:text-brand-primary active:scale-95"
                  aria-label="View notifications"
                >
                  <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </a>

                <a
                  routerLink="/profile"
                  class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-brand-soft font-bold text-brand-strong shadow-card transition hover:ring-2 hover:ring-brand-primary/30"
                  aria-label="View my profile"
                >
                  @if (userAvatar()) {
                    <img [src]="userAvatar()!" alt="User avatar" class="h-full w-full object-cover" />
                  } @else {
                    <span class="text-xs uppercase">{{ userInitials() }}</span>
                  }
                </a>
              } @else {
                <a
                  routerLink="/auth/login"
                  class="rounded-xl bg-brand-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition"
                >
                  Sign in
                </a>
              }
            </div>
          </section>

          <!-- Back Navigation Bar -->
          <div class="flex items-center justify-between">
            <a
              routerLink="/reels"
              class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-strong hover:underline"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Reels</span>
            </a>
          </div>

          <!-- Loading State Skeleton -->
          @if (loading()) {
            <div class="flex justify-center py-4">
              <div class="aspect-[9/16] w-full max-w-[420px] max-h-[720px] min-h-[500px] rounded-3xl bg-[#18181C] animate-pulse"></div>
            </div>
          }
          <!-- Error State -->
          @else if (error()) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface-card p-10 text-center shadow-card"
            >
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-status-danger/15 text-status-danger mb-3">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 class="text-xl font-bold text-content-primary">Reel unavailable</h1>
              <p class="mt-2 text-sm text-content-secondary leading-relaxed">
                This reel may have been deleted or is no longer accessible.
              </p>
              <a
                routerLink="/reels"
                class="mt-6 inline-flex rounded-xl bg-brand-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition"
              >
                Browse other reels
              </a>
            </section>
          }
          <!-- Reel Card Presentation -->
          @else if (reel(); as value) {
            <div class="flex justify-center py-2">
              <app-reel-card [reel]="value" [isActive]="true" />
            </div>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation (fixed bottom, <= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class ReelDetailComponent {
  readonly reel = signal<Reel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReelService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    this.service
      .getReel(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reel) => {
          this.reel.set(reel);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  userAvatar(): string | null {
    return this.profileService.profile()?.avatar_url ?? null;
  }

  userInitials(): string {
    const name =
      this.profileService.profile()?.display_name ||
      this.authState.currentUser()?.name ||
      this.authState.currentUser()?.email ||
      'EC';
    return name.slice(0, 2).toUpperCase();
  }

  onGlobalSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    if (query) {
      void this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
