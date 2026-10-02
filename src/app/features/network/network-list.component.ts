import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { FollowerUser, FollowTarget, PaginatedFollowers, PaginatedFollowing } from '../../core/follow/follow.models';
import { FollowService } from '../../core/follow/follow.service';

type NetworkKind = 'user-followers' | 'user-following' | 'business-followers';

@Component({
  selector: 'app-network-list',
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>
        <header class="mt-6 border-b border-border-subtle pb-5">
          <h1 class="text-3xl font-bold">{{ title() }}</h1>
          <p class="mt-2 text-content-secondary">{{ subtitle() }}</p>
        </header>

        @if (loading()) {
          <div class="mt-8 space-y-3" aria-label="Loading network" role="status">
            @for (item of [1, 2, 3]; track item) { <div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div> }
          </div>
        } @else if (notFound()) {
          <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card">
            <h2 class="text-2xl font-bold">Network unavailable</h2>
            <p class="mt-2 text-content-secondary">This profile or business is unavailable.</p>
          </section>
        } @else if (error()) {
          <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card">
            <h2 class="text-2xl font-bold">Unable to load this network.</h2>
            <button type="button" class="mt-5 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white" (click)="load()">Retry</button>
          </section>
        } @else if (kind() === 'user-following') {
          @if (!targets().length) { <p class="mt-8 rounded-3xl bg-surface-card p-8 text-center text-content-secondary">Not following anyone yet.</p> }
          <section class="mt-8 space-y-3" aria-label="Following">
            @for (target of targets(); track target.type + ':' + target.id) {
              @if (target.type === 'user') {
                <a [routerLink]="['/users', target.id]" class="flex items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-card transition hover:-translate-y-0.5">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">
                    @if (target.avatar_url) { <img [src]="target.avatar_url" [alt]="target.display_name || target.name" class="h-full w-full object-cover" /> } @else { {{ initials(target.display_name || target.name) }} }
                  </div>
                  <div class="min-w-0"><h2 class="font-semibold">{{ target.display_name || target.name }}</h2><p class="truncate text-sm text-content-secondary">{{ target.headline || 'Professional on Emirates Connect' }}</p></div>
                </a>
              } @else {
                <a [routerLink]="['/businesses', target.slug]" class="flex items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-card transition hover:-translate-y-0.5">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">
                    @if (target.logo_url) { <img [src]="target.logo_url" [alt]="target.name + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(target.name) }} }
                  </div>
                  <div class="min-w-0"><h2 class="font-semibold">{{ target.name }}</h2><p class="text-sm text-content-secondary">Business</p></div>
                </a>
              }
            }
          </section>
        } @else {
          @if (!users().length) { <p class="mt-8 rounded-3xl bg-surface-card p-8 text-center text-content-secondary">No followers yet.</p> }
          <section class="mt-8 space-y-3" aria-label="Followers">
            @for (user of users(); track user.id) {
              <a [routerLink]="['/users', user.id]" class="flex items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-card transition hover:-translate-y-0.5">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">
                  @if (user.profile.avatar_url) { <img [src]="user.profile.avatar_url" [alt]="user.profile.display_name || user.name" class="h-full w-full object-cover" /> } @else { {{ initials(user.profile.display_name || user.name) }} }
                </div>
                <div class="min-w-0"><h2 class="font-semibold">{{ user.profile.display_name || user.name }}</h2><p class="truncate text-sm text-content-secondary">{{ user.profile.headline || 'Professional on Emirates Connect' }}</p></div>
              </a>
            }
          </section>
        }

        @if (!loading() && !notFound() && !error() && hasMore()) {
          <div class="mt-6 text-center">
            <button type="button" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-sm font-medium disabled:opacity-50" [disabled]="loadingMore()" (click)="loadMore()">
              {{ loadingMore() ? 'Loading…' : 'Load more' }}
            </button>
            @if (loadMoreError()) { <p role="alert" class="mt-3 text-sm text-status-danger">Couldn’t load more. <button type="button" class="font-medium underline" (click)="loadMore()">Retry</button></p> }
          </div>
        }
      </div>
    </main>
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
  private readonly destroyRef = inject(DestroyRef);
  private page = 1;

  constructor() {
    this.kind.set(this.route.snapshot.data['networkKind'] as NetworkKind);
    this.load();
  }

  title(): string {
    return this.kind() === 'user-following' ? 'Following' : 'Followers';
  }

  subtitle(): string {
    return this.kind() === 'user-following' ? 'People and businesses followed by this account.' : 'Public members of the Emirates Connect network.';
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
          const page = response as PaginatedFollowing;
          const existing = append ? this.targets() : [];
          const seen = new Set(existing.map((target) => target.type + ':' + target.id));
          this.targets.set([...existing, ...page.data.filter((target) => !seen.has(target.type + ':' + target.id))]);
        } else {
          const page = response as PaginatedFollowers;
          const existing = append ? this.users() : [];
          const seen = new Set(existing.map((user) => user.id));
          this.users.set([...existing, ...page.data.filter((user) => !seen.has(user.id))]);
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

  initials(name: string): string {
    return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }
}
