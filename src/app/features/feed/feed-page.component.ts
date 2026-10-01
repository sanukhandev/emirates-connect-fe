import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Business, BusinessRole } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { FeedService } from '../../core/feed/feed.service';
import { Post } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { PostComposerComponent } from '../post/post-composer.component';

@Component({
  selector: 'app-feed-page',
  imports: [RouterLink, PostCardComponent, PostComposerComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div><p class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong">Emirates Connect</p><h1 class="mt-2 text-3xl font-bold tracking-tight">Home</h1><p class="mt-1 text-content-secondary">The latest professional updates from the community.</p></div>
          <div class="flex flex-wrap items-center gap-3"><a routerLink="/businesses" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary">Businesses</a><a routerLink="/profile" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary">Profile</a><button type="button" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary" (click)="refresh()" [disabled]="feed.refreshing()">{{ feed.refreshing() ? 'Refreshing…' : 'Refresh' }}</button><button type="button" class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary" (click)="logout()" [disabled]="loggingOut()">{{ loggingOut() ? 'Signing out…' : 'Sign out' }}</button></div>
        </header>

        <div class="mx-auto mt-6 max-w-3xl space-y-5">
          <app-post-composer (saved)="published()" />
          @if (feed.error(); as error) { <section class="rounded-3xl bg-surface-card p-6 text-center shadow-card" role="alert"><p class="text-status-danger">{{ error }}</p><button type="button" class="mt-4 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white" (click)="retry()">Retry</button></section> }
          @if (feed.loadingInitial() || (feed.refreshing() && !feed.posts().length)) { <div class="space-y-4" aria-label="Loading feed" aria-live="polite"><div class="h-52 animate-pulse rounded-3xl bg-surface-muted"></div><div class="h-52 animate-pulse rounded-3xl bg-surface-muted"></div></div> }
          @else if (!feed.error() && !feed.posts().length) { <section class="rounded-3xl bg-surface-card p-8 text-center shadow-card"><h2 class="text-xl font-bold">No posts yet.</h2><p class="mt-2 text-content-secondary">Be the first to share something with the Emirates Connect community.</p></section> }
          @else { <section class="space-y-4" aria-label="Latest posts">@for (item of feed.posts(); track item.id) { <app-post-card [post]="item" [management]="canManage(item)" (edit)="edit(item)" (remove)="remove(item)" /> }</section> }
          @if (feed.loadMoreError(); as error) { <section class="rounded-3xl bg-surface-card p-5 text-center shadow-card" role="alert"><p class="text-sm text-status-danger">{{ error }}</p><button type="button" class="mt-3 rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium" (click)="feed.refresh()">Retry</button></section> }
          @if (feed.loadingMore()) { <p class="py-4 text-center text-sm text-content-muted" aria-live="polite">Loading more posts…</p> }
          @if (feed.hasMore()) { <button type="button" class="w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-sm font-medium hover:border-brand-primary disabled:opacity-50" (click)="feed.loadMore()" [disabled]="feed.loadingMore()">Load more</button> } @else if (feed.posts().length && !feed.loadingMore()) { <p class="py-4 text-center text-sm text-content-muted">You’re all caught up.</p> }
          <div #sentinel class="h-1" aria-hidden="true"></div>
        </div>
      </div>
    </main>
    @if (pendingDelete(); as post) { <div class="fixed inset-0 z-10 flex items-center justify-center bg-content-primary/40 px-4"><section role="dialog" aria-modal="true" aria-labelledby="feed-delete-title" class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card"><h2 id="feed-delete-title" class="text-xl font-bold">Delete this post?</h2><p class="mt-2 text-sm text-content-secondary">This post will be removed from the feed.</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="pendingDelete.set(null)">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-sm text-white" (click)="confirmDelete(post)">Delete</button></div></section></div> }
  `,
})
export class FeedPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sentinel') private readonly sentinel?: ElementRef<HTMLDivElement>;
  readonly feed = inject(FeedService);
  readonly auth = inject(AuthService);
  readonly business = inject(BusinessService);
  readonly post = inject(PostService);
  readonly pendingDelete = signal<Post | null>(null);
  readonly loggingOut = signal(false);
  readonly managedBusinesses = signal<Business[]>([]);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;

  constructor() {
    this.feed.loadInitial();
    this.business.getMyBusinesses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => this.managedBusinesses.set(response.data) });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinel) return;
    this.observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) this.feed.loadMore(); }, { rootMargin: '600px' });
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  published(): void { this.feed.refresh(); }
  refresh(): void { this.feed.refresh(); }
  retry(): void { this.feed.loadInitial(); }
  edit(post: Post): void { void this.router.navigate(['/posts', post.id, 'edit']); }
  remove(post: Post): void { this.pendingDelete.set(post); }

  confirmDelete(post: Post): void {
    this.post.deletePost(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.pendingDelete.set(null); this.feed.removePost(post.id); },
      error: () => this.pendingDelete.set(null),
    });
  }

  canManage(post: Post): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (post.author.type === 'user') return post.author.id === user.id;
    const managerRoles: BusinessRole[] = ['owner', 'admin', 'editor'];
    return this.managedBusinesses().some((business) => business.id === post.author.id && business.current_user_role !== null && managerRoles.includes(business.current_user_role));
  }

  logout(): void {
    this.loggingOut.set(true);
    this.feed.reset();
    this.auth.logout().subscribe({ next: () => this.router.navigateByUrl('/login'), error: () => this.router.navigateByUrl('/login') });
  }
}
