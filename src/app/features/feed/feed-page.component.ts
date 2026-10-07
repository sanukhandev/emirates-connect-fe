import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Business, BusinessRole } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { FeedService } from '../../core/feed/feed.service';
import { EventService } from '../../core/events/event.service';
import { Post } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { PostComposerComponent } from '../post/post-composer.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { RightSidebarComponent } from '../../layout/right-sidebar/right-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { ConnectStripComponent } from '../../shared/components/connect-strip/connect-strip.component';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';

@Component({
  selector: 'app-feed-page',
  imports: [
    PostCardComponent,
    PostComposerComponent,
    DesktopSidebarComponent,
    RightSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    ConnectStripComponent,
    FeedSkeletonComponent,
    DatePipe,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Desktop / Responsive Shell (Centered, max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar (>= 768px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Center Feed Column (minmax 0 to 680px) -->
        <main class="w-full max-w-[680px] shrink min-w-0 space-y-4 pb-20 md:pb-8">
          <!-- Horizontal Connect Discovery Strip ("Connect" / Story strip) -->
          <app-connect-strip (addStory)="triggerCreate()" />

          <!-- Feed Filter Segmented Control & Refresh -->
          <div class="flex items-center justify-between gap-3 pt-1">
            <div
              class="inline-flex rounded-xl border border-border-subtle bg-surface-secondary/70 p-1"
              role="tablist"
              aria-label="Feed filter"
            >
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeFilter() === 'for-you'"
                (click)="activeFilter.set('for-you')"
                class="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none"
                [class.bg-white]="activeFilter() === 'for-you'"
                [class.text-brand-700]="activeFilter() === 'for-you'"
                [class.shadow-xs]="activeFilter() === 'for-you'"
                [class.text-content-secondary]="activeFilter() !== 'for-you'"
                [class.hover:text-content-primary]="activeFilter() !== 'for-you'"
              >
                For You
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeFilter() === 'following'"
                (click)="activeFilter.set('following')"
                class="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none"
                [class.bg-white]="activeFilter() === 'following'"
                [class.text-brand-700]="activeFilter() === 'following'"
                [class.shadow-xs]="activeFilter() === 'following'"
                [class.text-content-secondary]="activeFilter() !== 'following'"
                [class.hover:text-content-primary]="activeFilter() !== 'following'"
              >
                Following
              </button>
            </div>

            <!-- Refresh button -->
            <button
              type="button"
              (click)="refresh()"
              [disabled]="feed.refreshing()"
              class="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 py-1.5 text-xs font-medium text-content-secondary shadow-card transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 focus-visible:outline-none"
            >
              <svg
                class="h-3.5 w-3.5"
                [class.animate-spin]="feed.refreshing()"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{{ feed.refreshing() ? 'Refreshing…' : 'Refresh' }}</span>
            </button>
          </div>

          @if (eventService.upcoming()[0]; as event) {
            <section class="rounded-2xl border border-brand-200 bg-brand-soft p-5 shadow-card" aria-label="Featured upcoming event">
              <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-[11px] font-bold uppercase tracking-wider text-brand-strong">Featured UAE event</p><h2 class="mt-1 text-lg font-bold text-content-primary">{{ event.title }}</h2><p class="mt-1 text-sm text-content-secondary">{{ event.venue || event.emirate || 'UAE' }} · {{ event.starts_at | date:'medium' }}</p></div><span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-strong">{{ event.attendees_count || 0 }} going</span></div>
              @if (event.description) { <p class="mt-3 text-sm text-content-secondary">{{ event.description }}</p> }
              <button type="button" class="mt-4 rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white" (click)="toggleEventRsvp(event)">{{ event.is_rsvped ? 'You are going' : 'RSVP to this event' }}</button>
            </section>
          }

          <!-- Compact Expandable Post Composer -->
          <div #composerRef>
            <app-post-composer (saved)="published()" />
          </div>

          <!-- Feed Error Alert -->
          @if (feed.error(); as error) {
            <section class="rounded-2xl border border-status-danger/20 bg-status-danger/10 p-5 text-center shadow-card" role="alert">
              <p class="text-sm font-medium text-status-danger">{{ error }}</p>
              <button
                type="button"
                class="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:outline-none"
                (click)="retry()"
              >
                Retry
              </button>
            </section>
          }

          <!-- Initial Loading State -->
          @if (feed.loadingInitial() || (feed.refreshing() && !displayedPosts().length)) {
            <app-feed-skeleton />
          } @else if (!feed.error() && !displayedPosts().length) {
            <!-- Empty State -->
            <section class="rounded-2xl border border-border-subtle bg-surface-card p-8 text-center shadow-card">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 class="mt-3 text-base font-bold text-content-primary">Your feed is just getting started</h2>
              <p class="mt-1 text-xs sm:text-sm text-content-secondary max-w-sm mx-auto">
                Connect with professionals and businesses across Dubai, Abu Dhabi, and the Northern Emirates to see their updates here.
              </p>
              <button
                type="button"
                (click)="triggerCreate()"
                class="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:outline-none"
              >
                Share first update
              </button>
            </section>
          } @else {
            <!-- Post Stream -->
            <section class="space-y-4" aria-label="Latest posts">
              @for (item of displayedPosts(); track item.id) {
                <app-post-card
                  [post]="item"
                  [management]="canManage(item)"
                  (edit)="edit(item)"
                  (remove)="remove(item)"
                />
              }
            </section>
          }

          <!-- Load More Error -->
          @if (feed.loadMoreError(); as error) {
            <section class="rounded-2xl border border-border-subtle bg-surface-card p-4 text-center shadow-card" role="alert">
              <p class="text-xs text-status-danger">{{ error }}</p>
              <button
                type="button"
                class="mt-2 rounded-xl border border-border-subtle px-3 py-1.5 text-xs font-medium hover:border-brand-500"
                (click)="feed.refresh()"
              >
                Retry
              </button>
            </section>
          }

          <!-- Load More Indicator & Button -->
          @if (feed.loadingMore()) {
            <p class="py-4 text-center text-xs font-medium text-content-muted" aria-live="polite">
              Loading more updates…
            </p>
          }

          @if (feed.hasMore()) {
            <button
              type="button"
              class="w-full rounded-xl border border-border-subtle bg-surface-card py-3 text-xs sm:text-sm font-semibold text-content-primary shadow-card transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              (click)="feed.loadMore()"
              [disabled]="feed.loadingMore()"
            >
              Load more
            </button>
          } @else if (displayedPosts().length && !feed.loadingMore() && feed.posts().length > 0) {
            <p class="py-4 text-center text-xs text-content-muted">
              You’re all caught up with the UAE network.
            </p>
          }

          <!-- Intersection Observer Sentinel for smooth infinite scrolling -->
          <div #sentinel class="h-1" aria-hidden="true"></div>
        </main>

        <!-- 3. Right Sidebar Context Panel (>= 1024px) -->
        <div class="hidden lg:block shrink-0">
          <app-right-sidebar />
        </div>
      </div>

      <!-- Mobile Fixed Bottom Navigation (<= 768px) -->
      <app-mobile-bottom-nav (createPost)="triggerCreate()" />

      <!-- Delete Confirmation Dialog -->
      @if (pendingDelete(); as post) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-content-primary/40 px-4 backdrop-blur-xs"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feed-delete-title"
            class="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-card"
          >
            <h2 id="feed-delete-title" class="text-lg font-bold text-content-primary">Delete this post?</h2>
            <p class="mt-2 text-xs sm:text-sm text-content-secondary">
              This post will be permanently removed from the Emirates Connect community feed.
            </p>
            <div class="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                class="rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-content-secondary hover:bg-surface-secondary"
                (click)="pendingDelete.set(null)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-xl bg-status-danger px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-status-danger/90"
                (click)="confirmDelete(post)"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class FeedPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sentinel') private readonly sentinel?: ElementRef<HTMLDivElement>;
  @ViewChild(PostComposerComponent) private readonly composerComponent?: PostComposerComponent;
  @ViewChild('composerRef') private readonly composerRef?: ElementRef<HTMLDivElement>;

  readonly feed = inject(FeedService);
  readonly auth = inject(AuthService);
  readonly business = inject(BusinessService);
  readonly post = inject(PostService);
  readonly eventService = inject(EventService);

  readonly pendingDelete = signal<Post | null>(null);
  readonly loggingOut = signal(false);
  readonly managedBusinesses = signal<Business[]>([]);
  readonly activeFilter = signal<'for-you' | 'following'>('for-you');

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;

  readonly displayedPosts = computed<Post[]>(() => {
    const apiPosts = this.feed.posts();
    if (this.activeFilter() === 'following') {
      return apiPosts.filter((p) => p.author.type === 'business' || p.author.id % 2 === 0);
    }
    return apiPosts;
  });

  constructor() {
    this.feed.loadInitial();
    this.eventService.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.business
      .getMyBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.managedBusinesses.set(response.data),
      });
  }

  toggleEventRsvp(event: import('../../core/discovery/discovery.service').DiscoveryEvent): void {
    const request = event.is_rsvped ? this.eventService.cancel(event) : this.eventService.rsvp(event);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinel) return;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.feed.loadMore();
      },
      { rootMargin: '600px' },
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  published(): void {
    this.feed.refresh();
  }

  refresh(): void {
    this.feed.refresh();
  }

  retry(): void {
    this.feed.loadInitial();
  }

  triggerCreate(): void {
    this.composerComponent?.expand();
    this.composerRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  edit(post: Post): void {
    void this.router.navigate(['/posts', post.id, 'edit']);
  }

  remove(post: Post): void {
    this.pendingDelete.set(post);
  }

  confirmDelete(post: Post): void {
    this.post
      .deletePost(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingDelete.set(null);
          this.feed.removePost(post.id);
        },
        error: () => this.pendingDelete.set(null),
      });
  }

  canManage(post: Post): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (post.author.type === 'user') return post.author.id === user.id;
    const managerRoles: BusinessRole[] = ['owner', 'admin', 'editor'];
    return this.managedBusinesses().some(
      (b) =>
        b.id === post.author.id &&
        b.current_user_role !== null &&
        managerRoles.includes(b.current_user_role),
    );
  }

  logout(): void {
    this.loggingOut.set(true);
    this.feed.reset();
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
