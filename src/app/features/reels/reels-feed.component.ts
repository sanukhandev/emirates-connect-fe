import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { ReelCardComponent } from './reel-card.component';

@Component({
  selector: 'app-reels-feed',
  imports: [RouterLink, ReelCardComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div><a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a><h1 class="mt-3 text-3xl font-bold tracking-tight">Reels</h1><p class="mt-1 text-content-secondary">Professional video, in chronological order.</p></div>
          <div class="flex flex-wrap gap-2"><button type="button" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary" (click)="refresh()" [disabled]="loading()">{{ loading() ? 'Refreshing…' : 'Refresh' }}</button>@if (auth.isAuthenticated()) { <a routerLink="/reels/create" class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Create reel</a><a routerLink="/my-reels" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary">My reels</a> }</div>
        </header>
        @if (error()) { <section class="mt-6 rounded-3xl border border-status-danger/25 bg-status-danger/10 p-6 text-center" role="alert"><p class="text-status-danger">{{ error() }}</p><button type="button" class="mt-4 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white" (click)="loadInitial()">Retry</button></section> }
        @if (loading() && !reels().length) { <div class="mx-auto mt-6 max-w-3xl space-y-5" aria-label="Loading reels" aria-live="polite">@for (item of [1, 2]; track item) { <div class="h-96 animate-pulse rounded-3xl bg-surface-muted"></div> }</div> }
        @else if (!error() && !reels().length) { <section class="mx-auto mt-6 max-w-3xl rounded-3xl bg-surface-card p-10 text-center shadow-card"><h2 class="text-2xl font-bold">No reels yet.</h2><p class="mt-2 text-content-secondary">Share a short professional video with the community.</p>@if (auth.isAuthenticated()) { <a routerLink="/reels/create" class="mt-5 inline-flex rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white">Create the first reel</a> }</section> }
        @else { <section class="mx-auto mt-6 max-w-3xl space-y-5" aria-label="Reels feed">@for (reel of reels(); track reel.id) { <app-reel-card [reel]="reel" /> }</section> }
        @if (loadMoreError()) { <section class="mx-auto mt-5 max-w-3xl rounded-3xl bg-surface-card p-5 text-center" role="alert"><p class="text-sm text-status-danger">{{ loadMoreError() }}</p><button type="button" class="mt-3 rounded-xl border border-border-subtle px-4 py-2 text-sm" (click)="loadMore()">Retry</button></section> }
        @if (hasMore()) { <button type="button" class="mx-auto mt-5 block rounded-xl border border-border-subtle bg-surface-card px-5 py-3 text-sm font-medium hover:border-brand-primary disabled:opacity-50" (click)="loadMore()" [disabled]="loadingMore()">{{ loadingMore() ? 'Loading…' : 'Load more reels' }}</button> }
        <div #sentinel class="h-2" aria-hidden="true"></div>
      </div>
    </main>
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
  readonly auth = inject(AuthService);
  private readonly service = inject(ReelService);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;
  private requestVersion = 0;

  constructor() { this.loadInitial(); }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinel) return;
    this.observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) this.loadMore(); }, { rootMargin: '600px' });
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  loadInitial(): void {
    const version = ++this.requestVersion;
    this.loading.set(true); this.error.set(null); this.loadMoreError.set(null); this.reels.set([]); this.nextCursor.set(null);
    this.service.getFeed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => { if (version !== this.requestVersion) return; this.reels.set(this.unique(response.data)); this.nextCursor.set(response.meta.next_cursor); this.loading.set(false); },
      error: (error: unknown) => { if (version !== this.requestVersion) return; this.error.set(this.service.errorMessage(error)); this.loading.set(false); },
    });
  }

  refresh(): void { this.loadInitial(); }

  hasMore(): boolean { return this.nextCursor() !== null; }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || this.loadingMore()) return;
    const version = this.requestVersion;
    this.loadingMore.set(true); this.loadMoreError.set(null);
    this.service.getFeed(cursor).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => { if (version !== this.requestVersion) return; this.reels.update((items) => this.unique([...items, ...response.data])); this.nextCursor.set(response.meta.next_cursor); this.loadingMore.set(false); },
      error: (error: unknown) => { if (version !== this.requestVersion) return; this.loadMoreError.set(this.service.errorMessage(error)); this.loadingMore.set(false); },
    });
  }

  private unique(items: Reel[]): Reel[] { const seen = new Set<number>(); return items.filter((item) => !seen.has(item.id) && seen.add(item.id)); }
}
