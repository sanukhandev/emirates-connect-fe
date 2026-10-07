import { TitleCasePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { Business } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';

@Component({
  selector: 'app-business-list',
  imports: [
    RouterLink,
    TitleCasePipe,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
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
          <!-- Top Application Header -->
          <app-header createLabel="Create Business" createRoute="/businesses/create" />

          <!-- Businesses Page Header Bar -->
          <header class="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-5">
            <div class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Businesses</p>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">Your businesses</h1>
              <p class="text-sm text-content-secondary max-w-2xl">
                Manage the businesses and organizations you represent on Emirates Connect.
              </p>
            </div>

            <a
              routerLink="/businesses/create"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Business</span>
            </a>
          </header>

          <!-- Search & Summary Row (when businesses exist) -->
          @if (business.myBusinesses().length > 0) {
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <!-- Local Search -->
              <div class="relative w-full max-w-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <label for="local-business-search" class="sr-only">Search your businesses</label>
                <input
                  id="local-business-search"
                  type="search"
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  placeholder="Search your businesses…"
                  class="h-10 w-full rounded-xl border border-border-subtle bg-white pl-9.5 pr-3 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>

              <!-- Count summary -->
              <div class="text-xs font-medium text-content-secondary">
                <span>{{ filteredBusinesses().length }}</span>
                {{ filteredBusinesses().length === 1 ? 'business' : 'businesses' }} managed
              </div>
            </div>
          }

          <!-- Loading State (6 realistic skeleton cards) -->
          @if (business.isLoading()) {
            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading businesses" aria-live="polite">
              @for (item of [1, 2, 3, 4, 5, 6]; track item) {
                <div class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card animate-pulse">
                  <div class="h-24 bg-surface-secondary"></div>
                  <div class="p-5 pt-0">
                    <div class="-mt-8 h-16 w-16 rounded-2xl border-4 border-surface-card bg-surface-muted"></div>
                    <div class="mt-3.5 h-4.5 w-3/4 rounded-md bg-surface-muted"></div>
                    <div class="mt-2 h-3.5 w-full rounded-md bg-surface-muted"></div>
                    <div class="mt-3 flex gap-2">
                      <div class="h-5 w-16 rounded-md bg-surface-muted"></div>
                      <div class="h-5 w-20 rounded-md bg-surface-muted"></div>
                    </div>
                    <div class="mt-4 flex gap-2 pt-3 border-t border-border-subtle">
                      <div class="h-8 flex-1 rounded-xl bg-surface-muted"></div>
                      <div class="h-8 flex-1 rounded-xl bg-surface-muted"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Error Alert State -->
          @else if (error()) {
            <div role="alert" class="rounded-3xl border border-status-danger/25 bg-status-danger/10 p-6 text-status-danger flex items-center gap-3">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{{ error() }}</span>
            </div>
          }

          <!-- Empty State (No businesses created yet) -->
          @else if (!business.myBusinesses().length) {
            <section class="rounded-3xl border border-border-subtle bg-surface-card p-8 sm:p-12 text-center shadow-card space-y-4">
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
                Your business presence starts here.
              </h2>
              <p class="mx-auto max-w-lg text-sm text-content-secondary leading-relaxed">
                Create a professional business page to connect with customers, executives, and enterprises across the UAE.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/businesses/create"
                  class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-600 transition-colors"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create Business</span>
                </a>
              </div>
            </section>
          }

          <!-- Business Grid (3 columns on desktop, 2 on tablet, 1 on mobile) -->
          @else {
            <section class="space-y-6" aria-label="Your businesses list">
              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                @for (item of filteredBusinesses(); track item.id) {
                  <div
                    class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card-hover"
                  >
                    <!-- Cover Image / Intentional Fallback -->
                    <div class="relative h-28 w-full overflow-hidden bg-linear-to-r from-brand-100 via-brand-50 to-brand-200">
                      @if (item.cover_image_url && !isCoverFailed(item.id)) {
                        <img
                          [src]="item.cover_image_url"
                          alt=""
                          (error)="onCoverError(item.id)"
                          class="h-full w-full object-cover"
                        />
                      } @else {
                        <div class="absolute inset-0 opacity-25">
                          <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none">
                            <defs>
                              <pattern id="card-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                                <path d="M0 24L24 0M0 0l24 24" stroke="#9470f8" stroke-width="0.5" stroke-opacity="0.3" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#card-pattern)" />
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Card Body -->
                    <div class="p-5 pt-0 flex flex-col flex-1 justify-between">
                      <div>
                        <!-- Logo with border and initials fallback -->
                        <div class="-mt-8 relative mb-3 inline-block">
                          <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface-card bg-brand-500 text-lg font-bold text-white shadow-xs">
                            @if (item.logo_url && !isLogoFailed(item.id)) {
                              <img
                                [src]="item.logo_url"
                                [alt]="item.name + ' logo'"
                                (error)="onLogoError(item.id)"
                                class="h-full w-full object-cover"
                              />
                            } @else {
                              {{ initials(item.name) }}
                            }
                          </div>
                        </div>

                        <!-- Business Name with Link and Verification Badge -->
                        <h2 class="flex flex-wrap items-center gap-1.5 text-lg font-bold text-content-primary">
                          <a
                            [routerLink]="['/businesses', item.slug]"
                            class="hover:text-brand-600 transition-colors truncate max-w-[210px]"
                          >
                            {{ item.name }}
                          </a>
                          @if (item.is_verified) {
                            <span class="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200" aria-label="Verified business">
                              <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <polyline points="9 12 11 14 15 10" />
                              </svg>
                              Verified
                            </span>
                          }
                        </h2>

                        <!-- Tagline -->
                        <p class="mt-1 line-clamp-2 text-xs sm:text-sm text-content-secondary leading-snug min-h-6">
                          {{ item.tagline || 'Business organization page' }}
                        </p>

                        <!-- Location & Industry Meta -->
                        <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-content-muted">
                          @if (item.emirate) {
                            <span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                              <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {{ item.emirate | titlecase }}
                            </span>
                          }
                          @if (item.industry) {
                            <span class="inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                              {{ item.industry | titlecase }}
                            </span>
                          }
                        </div>

                        <!-- User Role Badge -->
                        @if (item.current_user_role) {
                          <div class="mt-3">
                            <span class="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 border border-brand-200">
                              {{ item.current_user_role }}
                            </span>
                          </div>
                        }
                      </div>

                      <!-- Action Buttons -->
                      <div class="mt-5 flex items-center gap-2 pt-3 border-t border-border-subtle">
                        <a
                          [routerLink]="['/businesses', item.slug, 'edit']"
                          class="flex-1 rounded-xl bg-brand-50 py-2 text-center text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-500 hover:text-white"
                        >
                          Manage
                        </a>
                        <a
                          [routerLink]="['/businesses', item.slug]"
                          class="flex-1 rounded-xl border border-border-subtle bg-white py-2 text-center text-xs font-semibold text-content-primary transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          View page
                        </a>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Compact Centered Pagination -->
              @if (business.myBusinessesMeta(); as meta) {
                @if (meta.last_page > 1) {
                  <nav class="flex items-center justify-center gap-4 pt-4 text-xs sm:text-sm font-medium" aria-label="Business pages">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-content-secondary shadow-xs hover:border-brand-500 hover:text-brand-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      (click)="load(meta.current_page - 1)"
                      [disabled]="meta.current_page <= 1 || business.isLoading()"
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                      Previous
                    </button>
                    <span class="text-content-secondary">
                      Page <span class="font-bold text-content-primary">{{ meta.current_page }}</span> of <span class="font-bold text-content-primary">{{ meta.last_page }}</span>
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-content-secondary shadow-xs hover:border-brand-500 hover:text-brand-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      (click)="load(meta.current_page + 1)"
                      [disabled]="meta.current_page >= meta.last_page || business.isLoading()"
                    >
                      Next
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </nav>
                }
              }
            </section>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation (<= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class BusinessListComponent {
  readonly business = inject(BusinessService);
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  readonly error = signal('');
  readonly searchQuery = signal('');
  readonly failedLogos = signal<Set<number>>(new Set());
  readonly failedCovers = signal<Set<number>>(new Set());
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filteredBusinesses = computed(() => {
    const list = this.business.myBusinesses();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter((b: Business) =>
      b.name.toLowerCase().includes(query) ||
      (b.tagline && b.tagline.toLowerCase().includes(query)) ||
      (b.emirate && b.emirate.toLowerCase().includes(query)) ||
      (b.industry && b.industry.toLowerCase().includes(query)),
    );
  });

  constructor() {
    this.load();
  }

  initials(name: string): string {
    return (name || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  load(page = 1): void {
    this.error.set('');
    this.business.getMyBusinesses(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.error.set(this.business.errorMessage(error)),
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onGlobalSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value.trim();
    if (val) {
      void this.router.navigate(['/search'], { queryParams: { q: val } });
    }
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  onLogoError(id: number): void {
    this.failedLogos.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  onCoverError(id: number): void {
    this.failedCovers.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  isLogoFailed(id: number): boolean {
    return this.failedLogos().has(id);
  }

  isCoverFailed(id: number): boolean {
    return this.failedCovers().has(id);
  }
}
