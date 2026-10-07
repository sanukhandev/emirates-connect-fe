import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
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
          <!-- Back Navigation Bar -->

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

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
