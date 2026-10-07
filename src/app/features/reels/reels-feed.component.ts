import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { ReelCardComponent } from './reel-card.component';

@Component({
  selector: 'app-reels-feed',
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
          <!-- Compact Reels Page Header -->
          <section
            aria-label="Reels overview header"
            class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-subtle bg-surface-card p-4 sm:p-6 shadow-card"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-brand-primary">Reels</span>
                <span class="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-strong">
                  UAE Network
                </span>
              </div>
              <h1 class="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
                Short Video Insights
              </h1>
              <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                Professional ideas, stories, and business knowledge from across the Emirates.
              </p>
            </div>

            <!-- Page Level Actions -->
            <div class="flex items-center gap-2 sm:gap-2.5">
              <!-- Icon-Only Refresh Action -->
              <button
                type="button"
                (click)="refresh()"
                [disabled]="loading()"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white text-content-secondary shadow-xs transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50 active:scale-95"
                title="Refresh reels"
                aria-label="Refresh reels"
              >
                <svg
                  class="h-4 w-4"
                  [class.animate-spin]="loading()"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>

              @if (auth.isAuthenticated()) {
                <!-- My Reels CTA -->
                <a
                  routerLink="/my-reels"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary active:scale-95"
                >
                  <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                  <span>My reels</span>
                </a>

                <!-- Create Reel Primary Action (#9470F8) -->
                <a
                  routerLink="/reels/create"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover active:scale-95"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create reel</span>
                </a>
              }
            </div>
          </section>

          <!-- Error Alert Banner -->
          @if (error()) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-status-danger/25 bg-status-danger/10 p-6 text-center"
              role="alert"
            >
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/20 text-status-danger mb-3">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 class="text-base font-bold text-status-danger">Unable to load reels</h2>
              <p class="mt-1 text-sm text-status-danger/90">{{ error() }}</p>
              <button
                type="button"
                class="mt-4 rounded-xl bg-brand-primary px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover active:scale-95"
                (click)="loadInitial()"
              >
                Retry loading
              </button>
            </section>
          }

          <!-- Realistic 9:16 Video Skeletons -->
          @if (loading() && !reels().length) {
            <div class="flex flex-col items-center gap-8 py-2" aria-label="Loading reels" aria-live="polite">
              @for (item of [1, 2]; track item) {
                <div class="flex items-end justify-center gap-3 sm:gap-4 w-full">
                  <div
                    class="relative aspect-[9/16] w-full max-w-[420px] max-h-[720px] min-h-[500px] overflow-hidden rounded-3xl bg-[#18181C] animate-pulse p-5 flex flex-col justify-between"
                  >
                    <div class="flex justify-between items-center">
                      <div class="h-6 w-16 rounded-full bg-white/10"></div>
                      <div class="h-8 w-8 rounded-full bg-white/10"></div>
                    </div>
                    <div class="space-y-3">
                      <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-white/10"></div>
                        <div class="space-y-1.5 flex-1">
                          <div class="h-3.5 w-28 rounded-md bg-white/15"></div>
                          <div class="h-2.5 w-20 rounded-md bg-white/10"></div>
                        </div>
                      </div>
                      <div class="h-3 w-3/4 rounded-md bg-white/15"></div>
                      <div class="h-3 w-1/2 rounded-md bg-white/10"></div>
                    </div>
                  </div>

                  <div class="hidden sm:flex flex-col items-center gap-3.5 pb-2">
                    @for (btn of [1, 2, 3, 4, 5]; track btn) {
                      <div class="h-12 w-12 rounded-2xl bg-surface-muted animate-pulse"></div>
                    }
                  </div>
                </div>
              }
            </div>
          }
          <!-- Empty State -->
          @else if (!error() && !reels().length) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface-card p-10 text-center shadow-card"
            >
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary">
                <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              </div>
              <h2 class="mt-4 text-2xl font-bold tracking-tight text-content-primary">No reels yet</h2>
              <p class="mt-2 text-sm text-content-secondary leading-relaxed">
                Be the first to share a short professional story, idea, or business insight with the Emirates Connect community.
              </p>
              @if (auth.isAuthenticated()) {
                <a
                  routerLink="/reels/create"
                  class="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover active:scale-95 transition"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create the first reel</span>
                </a>
              }
            </section>
          }
          <!-- Centered Vertical Video Feed -->
          @else {
            <section
              class="flex flex-col items-center gap-10 py-2"
              aria-label="Professional Reels feed"
            >
              @for (reel of reels(); track reel.id) {
                <div class="w-full flex justify-center scroll-mt-24">
                  <app-reel-card
                    [reel]="reel"
                    [isActive]="activeReelId() === reel.id"
                    (becameVisible)="onReelVisible($event)"
                  />
                </div>
              }
            </section>
          }

          <!-- Load More Error Alert -->
          @if (loadMoreError()) {
            <section
              class="mx-auto max-w-xl rounded-2xl border border-status-danger/25 bg-surface-card p-4 text-center shadow-card"
              role="alert"
            >
              <p class="text-sm font-medium text-status-danger">{{ loadMoreError() }}</p>
              <button
                type="button"
                class="mt-2 rounded-xl border border-border-subtle bg-white px-4 py-2 text-xs font-semibold hover:border-brand-primary transition"
                (click)="loadMore()"
              >
                Retry loading more
              </button>
            </section>
          }

          <!-- Manual Load More Fallback Button -->
          @if (hasMore() && !loading()) {
            <div class="flex justify-center pt-2">
              <button
                type="button"
                class="rounded-xl border border-border-subtle bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50 active:scale-95"
                (click)="loadMore()"
                [disabled]="loadingMore()"
              >
                {{ loadingMore() ? 'Loading more reels…' : 'Load more reels' }}
              </button>
            </div>
          }

          <!-- Sentinel for Infinite Scroll -->
          <div #sentinel class="h-4" aria-hidden="true"></div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation (fixed bottom, <= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class ReelsFeedComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sentinel') private readonly sentinel?: ElementRef<HTMLDivElement>;

  readonly reels = signal<Reel[]>([]);
  readonly error = signal<string | null>(null);
  readonly loadMoreError = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly nextCursor = signal<string | null>(null);
  readonly activeReelId = signal<number | null>(null);

  readonly auth = inject(AuthService);
  private readonly service = inject(ReelService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private observer?: IntersectionObserver;
  private visibilityHandler?: () => void;
  private requestVersion = 0;

  constructor() {
    this.loadInitial();
    this.setupVisibilityListener();
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinel) return;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.loadMore();
      },
      { rootMargin: '600px' }
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  onReelVisible(reelId: number): void {
    this.activeReelId.set(reelId);
  }

  loadInitial(): void {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set(null);
    this.loadMoreError.set(null);
    this.reels.set([]);
    this.nextCursor.set(null);
    this.activeReelId.set(null);

    this.service
      .getFeed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (version !== this.requestVersion) return;
          const items = this.unique(response.data);
          this.reels.set(items);
          this.nextCursor.set(response.meta.next_cursor);
          if (items.length > 0 && !this.activeReelId()) {
            this.activeReelId.set(items[0].id);
          }
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (version !== this.requestVersion) return;
          this.error.set(this.service.errorMessage(error));
          this.loading.set(false);
        },
      });
  }

  refresh(): void {
    this.loadInitial();
  }

  hasMore(): boolean {
    return this.nextCursor() !== null;
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || this.loadingMore()) return;

    const version = this.requestVersion;
    this.loadingMore.set(true);
    this.loadMoreError.set(null);

    this.service
      .getFeed(cursor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (version !== this.requestVersion) return;
          this.reels.update((items) => this.unique([...items, ...response.data]));
          this.nextCursor.set(response.meta.next_cursor);
          this.loadingMore.set(false);
        },
        error: (error: unknown) => {
          if (version !== this.requestVersion) return;
          this.loadMoreError.set(this.service.errorMessage(error));
          this.loadingMore.set(false);
        },
      });
  }

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;
    let savedActiveId: number | null = null;
    this.visibilityHandler = () => {
      if (document.hidden) {
        savedActiveId = this.activeReelId();
        this.activeReelId.set(null);
      } else if (savedActiveId !== null) {
        this.activeReelId.set(savedActiveId);
        savedActiveId = null;
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unique(items: Reel[]): Reel[] {
    const seen = new Set<number>();
    return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
  }
}
