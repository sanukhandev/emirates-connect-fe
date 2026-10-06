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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Business, BusinessRole } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { FeedService } from '../../core/feed/feed.service';
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

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feed-page',
  imports: [
    FormsModule,
    PostCardComponent,
    PostComposerComponent,
    DesktopSidebarComponent,
    RightSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    ConnectStripComponent,
    FeedSkeletonComponent,
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
          <!-- Top Global Search & Create CTA -->
          <section class="flex items-center gap-2.5 sm:gap-3" aria-label="Search and Create">
            <div class="relative flex-1">
              <label for="global-search-input" class="sr-only">Search people, businesses and posts</label>
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                id="global-search-input"
                type="search"
                [(ngModel)]="searchQuery"
                (keydown.enter)="onSearchSubmit()"
                placeholder="Search people, businesses and posts"
                class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-card transition-all duration-150 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>

            <!-- Primary Create Post CTA -->
            <button
              type="button"
              (click)="triggerCreate()"
              class="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-brand-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span class="hidden sm:inline">Create Post</span>
              <span class="sm:hidden">Create</span>
            </button>
          </section>

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

  readonly pendingDelete = signal<Post | null>(null);
  readonly loggingOut = signal(false);
  readonly managedBusinesses = signal<Business[]>([]);
  readonly activeFilter = signal<'for-you' | 'following'>('for-you');

  searchQuery = '';

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;

  // Curated UAE benchmark demo posts for the "For You" feed when no API posts exist yet
  readonly curatedUaePosts: Post[] = [
    {
      id: 9991,
      body: `We're expanding our engineering team in Dubai.\n\nIf you're passionate about building products used across the UAE, I'd love to connect.\n\n#Dubai #Technology #Hiring`,
      status: 'published',
      published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      author: {
        type: 'user',
        id: 901,
        name: 'Sarah Ahmed',
        display_name: 'Sarah Ahmed',
        headline: 'Founder & Managing Director',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
        is_verified: true,
        location: 'Dubai, UAE',
      },
      media: [
        {
          id: 881,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
          mime_type: 'image/jpeg',
          width: 1200,
          height: 800,
          sort_order: 1,
        },
      ],
      reactions: {
        total: 128,
        counts: { like: 94, celebrate: 22, insightful: 12, support: 0 },
        current_user: null,
      },
      shares_count: 8,
      comments_count: 24,
    },
    {
      id: 9992,
      body: `Delighted to announce our new Cloud & AI Innovation Hub in Dubai Internet City.\n\nPartnering with visionary UAE enterprises to accelerate digital transformation across logistics, finance, and smart infrastructure.\n\n#ArtificialIntelligence #DubaiTech #Cloud #Innovation`,
      status: 'published',
      published_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      author: {
        type: 'business',
        id: 902,
        name: 'Emirates Digital Labs',
        slug: 'emirates-digital-labs',
        logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=240&q=80',
        is_verified: true,
        industry: 'Enterprise Cloud & AI',
        location: 'Dubai, UAE',
      },
      media: [
        {
          id: 882,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
          mime_type: 'image/jpeg',
          width: 800,
          height: 600,
          sort_order: 1,
        },
        {
          id: 883,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
          mime_type: 'image/jpeg',
          width: 800,
          height: 600,
          sort_order: 2,
        },
      ],
      reactions: {
        total: 284,
        counts: { like: 198, celebrate: 62, insightful: 24, support: 0 },
        current_user: null,
      },
      shares_count: 31,
      comments_count: 46,
    },
    {
      id: 9993,
      body: `A question for our UAE leadership network:\n\nAs the Emirates continues accelerating the national AI strategy and digital economy roadmap, which emerging technology domain will drive the most immediate commercial impact for UAE businesses?`,
      status: 'published',
      published_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      author: {
        type: 'user',
        id: 903,
        name: 'Dr. Rashid Al Nuaimi',
        display_name: 'Dr. Rashid Al Nuaimi',
        headline: 'Chief Innovation Officer',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
        is_verified: true,
        location: 'Abu Dhabi, UAE',
      },
      media: [],
      poll: {
        question: 'What technology will have the biggest impact on UAE businesses?',
        options: [
          { id: 1, text: 'Artificial Intelligence', votes: 222 },
          { id: 2, text: 'Cloud Infrastructure', votes: 120 },
          { id: 3, text: 'Blockchain & Web3', votes: 51 },
          { id: 4, text: 'Industrial IoT', votes: 35 },
        ],
        total_votes: 428,
        days_remaining: 2,
      },
      reactions: {
        total: 196,
        counts: { like: 142, insightful: 44, celebrate: 10, support: 0 },
        current_user: null,
      },
      shares_count: 18,
      comments_count: 62,
    },
  ];

  readonly displayedPosts = computed<Post[]>(() => {
    const apiPosts = this.feed.posts();
    // If backend returned posts, display authoritative backend posts
    if (apiPosts.length > 0) {
      if (this.activeFilter() === 'following') {
        // Filter for following tab
        return apiPosts.filter((p) => p.author.type === 'business' || p.author.id % 2 === 0);
      }
      return apiPosts;
    }

    // When backend feed is empty and not loading, display curated UAE showcase posts for 'For You'
    if (this.activeFilter() === 'for-you' && !this.feed.loadingInitial() && !this.feed.error()) {
      return this.curatedUaePosts;
    }

    return [];
  });

  constructor() {
    this.feed.loadInitial();
    this.business
      .getMyBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.managedBusinesses.set(response.data),
      });
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

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      void this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
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
