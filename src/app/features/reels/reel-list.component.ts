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
  selector: 'app-reel-list',
  imports: [
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    ReelCardComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <app-mobile-header />

      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-24 md:pb-10">
          <div class="flex items-center justify-between">
            <a
              [routerLink]="backLink()"
              class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-strong hover:underline"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              {{ title() }}
            </h1>
          </div>

          @if (loading()) {
            <div class="flex flex-col items-center gap-8 py-2">
              <div class="aspect-[9/16] w-full max-w-[420px] max-h-[720px] min-h-[500px] rounded-3xl bg-[#18181C] animate-pulse"></div>
            </div>
          } @else if (error()) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface-card p-8 text-center shadow-card"
            >
              <p class="text-sm font-medium text-status-danger">Reels are currently unavailable.</p>
            </section>
          } @else if (!reels().length) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface-card p-10 text-center shadow-card"
            >
              <h2 class="text-xl font-bold">No published reels yet</h2>
              <p class="mt-2 text-sm text-content-secondary">This profile has not shared any short videos yet.</p>
            </section>
          } @else {
            <section class="flex flex-col items-center gap-10 py-2">
              @for (reel of reels(); track reel.id) {
                <div class="w-full flex justify-center">
                  <app-reel-card [reel]="reel" />
                </div>
              }
            </section>
          }
        </main>
      </div>

      <app-mobile-bottom-nav />
    </div>
  `,
})
export class ReelListComponent {
  readonly reels = signal<Reel[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly title = signal('Reels');

  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReelService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const userId = this.route.snapshot.paramMap.get('id');
    const slug = this.route.snapshot.paramMap.get('slug');
    const request = userId
      ? this.service.getUserReels(Number(userId))
      : this.service.getBusinessReels(slug ?? '');
    this.title.set(userId ? 'Professional Reels' : 'Business Reels');
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.reels.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  backLink(): string {
    return this.route.snapshot.paramMap.get('id')
      ? `/users/${this.route.snapshot.paramMap.get('id')}`
      : `/businesses/${this.route.snapshot.paramMap.get('slug')}`;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
