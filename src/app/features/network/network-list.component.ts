import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { FollowerUser, FollowTarget, PaginatedFollowers, PaginatedFollowing } from '../../core/follow/follow.models';
import { FollowService } from '../../core/follow/follow.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { UserIdentityComponent } from '../../shared/components/user-identity/user-identity.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type NetworkKind = 'user-followers' | 'user-following' | 'business-followers';

@Component({
  selector: 'app-network-list',
  imports: [
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    UserIdentityComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar (sticky, 240-256px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[920px] shrink min-w-0 space-y-6 pb-20 md:pb-10">

          <!-- Page Header Card -->
          <header class="rounded-2xl border border-border-subtle bg-surface-card p-5 sm:p-6 shadow-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Professional Network</p>
                <h1 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                  {{ title() }}
                </h1>
                <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                  {{ subtitle() }}
                </p>
              </div>

              <!-- Back Link -->
              <a
                [routerLink]="backRoute()"
                class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </a>
            </div>
          </header>

          <!-- Loading State -->
          @if (loading()) {
            <div class="space-y-3" aria-label="Loading network" role="status">
              @for (item of [1, 2, 3, 4]; track item) {
                <div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div>
              }
            </div>
          } @else if (notFound()) {
            <app-empty-state
              icon="info"
              title="Network unavailable"
              description="This profile or business is unavailable or has been removed."
              actionLabel="Return to feed"
              actionRoute="/"
            />
          } @else if (error()) {
            <app-empty-state
              icon="info"
              title="Unable to load this network"
              description="A temporary connection issue occurred while fetching members."
              actionLabel="Retry"
              (actionClick)="load()"
            />
          } @else if (kind() === 'user-following') {
            <!-- Following List (Users & Businesses) -->
            @if (!targets().length) {
              <app-empty-state
                icon="users"
                title="Not following anyone yet"
                description="Follow professionals and verified businesses to see their latest updates in your feed."
                actionLabel="Discover Network"
                actionRoute="/search"
              />
            } @else {
              <section class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card divide-y divide-border-subtle" aria-label="Following">
                @for (target of targets(); track target.type + ':' + target.id) {
                  @if (target.type === 'user') {
                    <div class="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-secondary/50">
                      <app-user-identity
                        [name]="target.display_name || target.name"
                        [id]="target.id"
                        [avatarUrl]="target.avatar_url"
                        [headline]="target.headline || 'Professional on Emirates Connect'"
                        type="user"
                        size="md"
                      />
                      <a
                        [routerLink]="['/users', target.id]"
                        class="shrink-0 rounded-xl border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        View
                      </a>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-secondary/50">
                      <app-user-identity
                        [name]="target.name"
                        [slug]="target.slug"
                        [avatarUrl]="target.logo_url"
                        headline="Verified Business"
                        type="business"
                        size="md"
                      />
                      <a
                        [routerLink]="['/businesses', target.slug]"
                        class="shrink-0 rounded-xl border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        View
                      </a>
                    </div>
                  }
                }
              </section>
            }
          } @else {
            <!-- Followers List -->
            @if (!users().length) {
              <app-empty-state
                icon="users"
                title="No followers yet"
                description="When professionals follow this profile, they will appear here."
                actionLabel="Explore Network"
                actionRoute="/search"
              />
            } @else {
              <section class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card divide-y divide-border-subtle" aria-label="Followers">
                @for (user of users(); track user.id) {
                  <div class="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-secondary/50">
                    <app-user-identity
                      [name]="user.profile.display_name || user.name"
                      [id]="user.id"
                      [avatarUrl]="user.profile.avatar_url"
                      [headline]="user.profile.headline || 'Professional on Emirates Connect'"
                      [isVerified]="user.profile.is_verified"
                      type="user"
                      size="md"
                    />
                    <a
                      [routerLink]="['/users', user.id]"
                      class="shrink-0 rounded-xl border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      View
                    </a>
                  </div>
                }
              </section>
            }
          }

          <!-- Pagination Controls -->
          @if (!loading() && !notFound() && !error() && hasMore()) {
            <div class="text-center pt-2">
              <button
                type="button"
                class="ec-btn-secondary px-5 py-2.5"
                [disabled]="loadingMore()"
                (click)="loadMore()"
              >
                {{ loadingMore() ? 'Loading more…' : 'Load more connections' }}
              </button>
              @if (loadMoreError()) {
                <p role="alert" class="mt-3 text-xs text-status-danger">
                  Couldn’t load more connections. <button type="button" class="font-medium underline" (click)="loadMore()">Retry</button>
                </p>
              }
            </div>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class NetworkListComponent {
  readonly users = signal<FollowerUser[]>([]);
  readonly targets = signal<FollowTarget[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal(false);
  readonly loadMoreError = signal(false);
  readonly notFound = signal(false);
  readonly kind = signal<NetworkKind>('user-followers');

  private readonly route = inject(ActivatedRoute);
  private readonly follow = inject(FollowService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private page = 1;

  constructor() {
    this.kind.set(this.route.snapshot.data['networkKind'] as NetworkKind);
    this.load();
  }

  logout(): void {
    this.auth.logout();
  }

  title(): string {
    return this.kind() === 'user-following' ? 'Following' : 'Followers';
  }

  subtitle(): string {
    return this.kind() === 'user-following'
      ? 'People and businesses followed by this account.'
      : 'Public members connected on Emirates Connect.';
  }

  backRoute(): string[] {
    const userId = this.route.snapshot.paramMap.get('id');
    const slug = this.route.snapshot.paramMap.get('slug');
    if (this.kind() === 'business-followers' && slug) {
      return ['/businesses', slug];
    }
    if (userId) {
      return ['/users', userId];
    }
    return ['/'];
  }

  load(page = 1, append = false): void {
    if (append && this.loadingMore()) return;
    if (append) this.loadingMore.set(true);
    else {
      this.loading.set(true);
      this.error.set(false);
      this.notFound.set(false);
      this.loadMoreError.set(false);
    }

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const request: Observable<PaginatedFollowers | PaginatedFollowing> = this.kind() === 'user-followers'
      ? this.follow.getUserFollowers(userId, page)
      : this.kind() === 'user-following'
        ? this.follow.getUserFollowing(userId, page)
        : this.follow.getBusinessFollowers(slug, page);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.page = response.meta.current_page;
        this.hasMore.set(response.meta.current_page < response.meta.last_page);
        if (this.kind() === 'user-following') {
          const res = response as PaginatedFollowing;
          const existing = append ? this.targets() : [];
          const seen = new Set(existing.map((target) => target.type + ':' + target.id));
          this.targets.set([...existing, ...res.data.filter((target) => !seen.has(target.type + ':' + target.id))]);
        } else {
          const res = response as PaginatedFollowers;
          const existing = append ? this.users() : [];
          const seen = new Set(existing.map((user) => user.id));
          this.users.set([...existing, ...res.data.filter((user) => !seen.has(user.id))]);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
        this.loadMoreError.set(false);
      },
      error: (failure: unknown) => {
        this.loading.set(false);
        this.loadingMore.set(false);
        if ((failure as { status?: number }).status === 404) this.notFound.set(true);
        else if (append) this.loadMoreError.set(true);
        else this.error.set(true);
      },
    });
  }

  loadMore(): void {
    this.load(this.page + 1, true);
  }
}
