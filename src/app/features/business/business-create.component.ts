import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { Business } from '../../core/business/business.models';
import { BusinessFormComponent } from './business-form.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-business-create',
  imports: [
    BusinessFormComponent,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Responsive Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (240px, sticky, Businesses active) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Shell Top Global Header -->
          <section aria-label="Global application bar" class="flex items-center justify-between gap-3 sm:gap-4">
            <div class="relative flex-1 max-w-xl">
              <label for="global-business-search" class="sr-only">Search people, businesses and posts</label>
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                id="global-business-search"
                type="search"
                (keydown.enter)="onGlobalSearch($event)"
                placeholder="Search people, businesses and posts"
                class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-card transition-all duration-150 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <a
                routerLink="/notifications"
                class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white text-content-secondary shadow-card transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"></span>
              </a>

              <a
                routerLink="/profile"
                class="flex items-center gap-2 rounded-xl border border-border-subtle bg-white p-1 sm:pr-3 shadow-card transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Your Profile"
              >
                <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                  @if (profile.profile()?.avatar_url) {
                    <img [src]="profile.profile()?.avatar_url" alt="" class="h-full w-full object-cover" />
                  } @else {
                    {{ initials(profile.profile()?.display_name || auth.currentUser()?.name || '') }}
                  }
                </div>
                <span class="hidden text-xs font-medium text-content-primary lg:inline max-w-[110px] truncate">
                  {{ profile.profile()?.display_name || auth.currentUser()?.name }}
                </span>
              </a>
            </div>
          </section>

          <!-- Breadcrumbs and Back Link -->
          <div class="flex items-center gap-2 text-sm text-content-secondary">
            <a routerLink="/businesses" class="inline-flex items-center gap-1.5 font-medium hover:text-brand-600 transition-colors">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Businesses
            </a>
            <span class="text-border-subtle">/</span>
            <span class="font-bold text-content-primary">Create Business</span>
          </div>

          <!-- Page Header -->
          <header class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Business Presence</p>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
              Create a business page
            </h1>
            <p class="text-sm text-content-secondary max-w-2xl">
              Build your professional presence, verify operations, and connect with the Emirates Connect ecosystem.
            </p>
          </header>

          <!-- Bento Card Wrapper -->
          <section aria-label="Business creation form" class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
            <app-business-form submitLabel="Create business" [showPreview]="true" (saved)="created($event)" />
          </section>
        </main>
      </div>

      <!-- Mobile Bottom Navigation (<= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class BusinessCreateComponent {
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  created(business: Business): void {
    void this.router.navigate(['/businesses', business.slug]);
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  onGlobalSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value.trim();
    if (val) {
      void this.router.navigate(['/search'], { queryParams: { q: val } });
    }
  }

  initials(name: string): string {
    return (name || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
